// Layer 2, server. The edit a language server asks for in files no tab holds, as POST /api/ops
// `lsp-edit` (rename, a code action, `workspace/applyEdit`). server/files/fs/ops.ts dispatches to
// it behind the same write chain `replace` runs behind.
//
// The request names each file by its root and path, the SHA-256 of the bytes the edit was computed
// for, and its edits in the protocol's positions (data/prose/text-edits.ts: UTF-16 units over the
// file's own line ends). The server decides what is written from the file as it is now, never from
// the page: every file is read and checked before any is written, and a request that fails a check
// writes nothing. The checks are made per file in the order `outside` (a root not served, a path
// out of it, or under a `node_modules` folder or a folder whose name starts with a dot, which are
// never edited here), `missing`, `protected` (the machine's local.yml), `denied` (the file's mode
// locks it), `binary` (bytes that are not text, or text that is not UTF-8), `too_large` (over what
// the history keeps a copy of, as the file is and as the edit would leave it), `changed` (the bytes
// are not the ones the edit was computed for, or a range names a line the file lacks). A file named
// twice, no file at all, or two ranges of a file that overlap is `not-an-action`.
//
// Each file is then written once: its copy is kept in the local history first (kind `lsp-edit`),
// the new text is written through the same atomic write a save uses with the file's byte order mark
// kept, and the file is read back and compared with what was meant to be written. A write that
// fails stops the list there and the answer names the files done before it and the one it stopped
// at. The whole request is one `files` record, with the stamps of the files as they were (each
// naming its copy) and as they are.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { FileStamp, LspEditFile, OpsAnswer } from '../../../data/file-ops.ts';
import { applyTextEdits } from '../../../data/prose/text-edits.ts';
import { writeBytesAtomic } from '../../core/json.ts';
import type { Root } from '../files.ts';
import { stampOf } from './file-changes.ts';
import { SAVE_MAX_BYTES, keepCopy } from './history.ts';
import { fail, readChecked, refused, type Fail } from './replace.ts';

/** What an `lsp-edit` runs over: the roots, the files never changed, the history and the record. */
export type LspEditScope = {
    roots: Root[];
    /** Whether a path is a file the server never changes, or a folder that holds one. */
    guarded: (path: string) => boolean;
    /** The local history folder a copy is kept in before a file is written; none keeps none. */
    history?: string;
    /** Say that files were written: the stamps of what was there and of what is there now. */
    note: (before: FileStamp[], after: FileStamp[]) => void;
};

/** The byte order mark of UTF-8, which a file may start with and the edit never touches. */
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/** One file read, checked and its new bytes made, not yet written. */
type Planned = { name: string; real: string; before: Buffer; after: Buffer };

/**
 * Whether a path of a root names a folder an edit is never made under: dot folders, node_modules.
 */
function inLibraryFolder(path: string): boolean {
    const folders = path.split('/').filter((part) => part !== '');
    return folders
        .slice(0, -1)
        .some((part) => part === 'node_modules' || part.startsWith('.') || part === '..');
}

/** The SHA-256 of bytes as lower-case hex. */
function hashOf(bytes: Buffer): string {
    return createHash('sha256').update(bytes).digest('hex');
}

/** One file of the request, read and checked, with the bytes its edit makes. */
function plan(scope: LspEditScope, file: LspEditFile): Planned | Fail {
    if (inLibraryFolder(file.path)) return fail('outside');
    const read = readChecked(scope, file.root, file.path, SAVE_MAX_BYTES, true);
    if (refused(read)) return read;
    const { bytes } = read;
    if (hashOf(bytes) !== file.hash) return fail('changed');
    const marked = bytes.subarray(0, BOM.length).equals(BOM);
    const body = marked ? bytes.subarray(BOM.length) : bytes;
    const text = body.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(body)) return fail('binary');
    const edited = applyTextEdits(text, file.edits);
    if (!edited.ok) return fail(edited.reason === 'overlap' ? 'not-an-action' : 'changed');
    const made = Buffer.from(edited.text, 'utf8');
    const after = marked ? Buffer.concat([BOM, made]) : made;
    if (after.length > SAVE_MAX_BYTES) return fail('too_large');
    return { name: `${file.root}/${file.path}`, real: read.real, before: bytes, after };
}

/** Whether a request names no file, or one file twice, or a file with no edit. */
function malformed(files: LspEditFile[]): boolean {
    if (files.length === 0) return true;
    const named = new Set(files.map((one) => `${one.root}\0${one.path}`));
    return named.size !== files.length || files.some((one) => one.edits.length === 0);
}

/** One planned file written: its copy kept first, then the file, read back and compared. */
function write(
    scope: LspEditScope,
    one: Planned
): { before: FileStamp; after: FileStamp[] } | Fail {
    const was = stampOf(one.real);
    if (was === null) return fail('missing');
    let kept: string | undefined;
    if (scope.history !== undefined) {
        const copy = keepCopy(scope.history, one.real, 'lsp-edit');
        if (!copy.ok) return fail('denied');
        kept = copy.kept?.id;
    }
    try {
        writeBytesAtomic(one.real, one.after);
    } catch {
        return fail('denied');
    }
    const now = stampOf(one.real);
    const before = kept === undefined ? was : { ...was, kept };
    let written: Buffer | null;
    try {
        written = readFileSync(one.real);
    } catch {
        written = null;
    }
    // The file was written, so the record names it whether or not it reads back as meant.
    scope.note([before], now === null ? [] : [now]);
    if (!written?.equals(one.after)) return fail('changed');
    return { before, after: now === null ? [] : [now] };
}

/**
 * POST /api/ops `lsp-edit`: the edits the request names, written file by file in order once every
 * file passed its checks. The answer names the files written as `root/path`, or the refusal, and
 * for a write that stopped part way the files done and the one it stopped at.
 */
export function lspEditFiles(scope: LspEditScope, files: LspEditFile[]): OpsAnswer {
    if (malformed(files)) return fail('not-an-action');
    const planned: Planned[] = [];
    for (const file of files) {
        const one = plan(scope, file);
        if (refused(one)) {
            return { ok: false, error: one.error, done: [], failed: `${file.root}/${file.path}` };
        }
        planned.push(one);
    }
    if (new Set(planned.map((one) => one.real)).size !== planned.length) {
        return fail('not-an-action');
    }
    const done: string[] = [];
    for (const one of planned) {
        const outcome = write(scope, one);
        if (refused(outcome)) {
            return { ok: false, error: outcome.error, done, failed: one.name };
        }
        done.push(one.name);
    }
    return { ok: true, paths: done };
}
