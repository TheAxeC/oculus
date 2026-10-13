// Layer 2, server. The edit a language server asks for in files no tab holds, as POST /api/ops
// `lsp-edit` (rename, a code action, `workspace/applyEdit`), and the edits of the writing rules'
// folder Fix All, as `writing-fix`. server/files/fs/ops.ts dispatches both to it behind the same
// write chain `replace` runs behind; the operation's name is the kind its history copies are kept
// under.
//
// The request names each file by its root and path, the SHA-256 of the bytes the edit was computed
// for, and its edits in the protocol's positions (data/prose/text-edits.ts: UTF-16 units over the
// file's own line ends). The server decides what is written from the file as it is now, never from
// the page: every file is read and checked before any is written, and a request that fails a check
// writes nothing. The checks are made per file in the order `outside` (a root not served, a path
// out of it, a path under a `node_modules` folder or a folder whose name starts with a dot, or a
// file in the `secrets` folder of every hub or in `~/.oculus`, none of which is ever edited here),
// `missing`, `denied` (the file's mode locks it), `binary` (a NUL byte in the first 8 KB),
// `too_large` (over the most a copy of the operation's kind is kept for, 5 MB for `lsp-edit` and
// 256 KB for `writing-fix`, as the file is and as the edit would leave it), `changed` (the bytes
// are not the ones the edit was computed for, or a range names a line the file lacks), and after
// `changed` `binary` again for a file with a NUL byte anywhere or bytes that are not UTF-8
// throughout (the whole-file rule of data/helpers/files/text-kind.ts). A file named twice, no file
// at all, or two ranges of a file that overlap is `not-an-action`.
//
// Each file is then written once: its copy is kept in the local history first, under the kind of
// the operation that writes it (`lsp-edit` or `writing-fix`), the new text is written through the
// same atomic write a save uses with the file's byte order mark kept, and the file is read back and
// compared with what was meant to be written. A write that fails stops the list there and the
// answer names the files done before it and the one it stopped at. The whole request is one `files`
// record, with the stamps of the files as they were (each naming its copy) and as they are.

import { readFileSync } from 'node:fs';
import type { FileStamp, LspEditFile, OpsAnswer } from '../../../data/file-ops.ts';
import { isWholeText } from '../../../data/helpers/files/text-kind.ts';
import { applyTextEdits } from '../../../data/prose/text-edits.ts';
import { hashOf, splitMark, withMark } from '../../core/file-bytes.ts';
import { writeBytesAtomic } from '../../core/json.ts';
import { under } from '../../core/paths.ts';
import { resolveRootPath, type Root } from '../files.ts';
import { stampOf } from './file-changes.ts';
import { copyLimit, keepCopy } from './history.ts';
import { fail, readChecked, refused, type Fail } from './operations/replace.ts';

/** What an `lsp-edit` runs over: the roots, the folders withheld, the history and the record. */
export type LspEditScope = {
    roots: Root[];
    /** The folders no file of is edited: the `secrets` folder of every hub and `~/.oculus`. */
    withheld: readonly string[];
    /** The local history folder a copy is kept in before a file is written; none keeps none. */
    history?: string;
    /** Say that files were written: the stamps of what was there and of what is there now. */
    note: (before: FileStamp[], after: FileStamp[]) => void;
};

/** The operations that run this chain, which are also the kinds of history copy it keeps. */
export type LspEditOperation = 'lsp-edit' | 'writing-fix';

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

/** One file of the request, read and checked, with the bytes its edit makes. */
function plan(scope: LspEditScope, file: LspEditFile, operation: LspEditOperation): Planned | Fail {
    if (inLibraryFolder(file.path)) return fail('outside');
    const found = resolveRootPath(scope.roots, file.root, file.path);
    if ('path' in found && under(found.path, scope.withheld)) return fail('outside');
    const limit = copyLimit(operation);
    const read = readChecked(scope, file.root, file.path, limit, true);
    if (refused(read)) return read;
    const { bytes } = read;
    if (hashOf(bytes) !== file.hash) return fail('changed');
    if (!isWholeText(bytes)) return fail('binary');
    const { marked, body } = splitMark(bytes);
    const edited = applyTextEdits(body.toString('utf8'), file.edits);
    if (!edited.ok) return fail(edited.reason === 'overlap' ? 'not-an-action' : 'changed');
    const after = withMark(Buffer.from(edited.text, 'utf8'), marked);
    if (after.length > limit) return fail('too_large');
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
    one: Planned,
    operation: LspEditOperation
): { before: FileStamp; after: FileStamp[] } | Fail {
    const was = stampOf(one.real);
    if (was === null) return fail('missing');
    let kept: string | undefined;
    if (scope.history !== undefined) {
        const copy = keepCopy(scope.history, one.real, operation);
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
 * POST /api/ops `lsp-edit` and `writing-fix`: the edits the request names, written file by file in
 * order once every file passed its checks. The answer names the files written as `root/path`, or
 * the refusal, and for a write that stopped part way the files done and the one it stopped at.
 */
export function lspEditFiles(
    scope: LspEditScope,
    files: LspEditFile[],
    operation: LspEditOperation
): OpsAnswer {
    if (malformed(files)) return fail('not-an-action');
    const planned: Planned[] = [];
    for (const file of files) {
        const one = plan(scope, file, operation);
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
        const outcome = write(scope, one, operation);
        if (refused(outcome)) {
            return { ok: false, error: outcome.error, done, failed: one.name };
        }
        done.push(one.name);
    }
    return { ok: true, paths: done };
}
