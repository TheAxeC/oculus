// Layer 2, server. The source endpoint: what one file may be done with, and the whole-file write.
//
// The write authenticates one request by its token, resolves its file inside a configured root,
// and replaces its text through a temporary neighbour and atomic rename. What it may be done to is
// the file itself and not a list of extensions: a file the mode locks is refused with `readonly`,
// and a file whose bytes are not UTF-8 text throughout (a NUL byte anywhere, or a byte sequence
// UTF-8 does not allow) is refused with `binary`, since replacing those with an editor's text would
// destroy them. The refusals are single words; the sentence a reader is shown for each is the
// source tab's, from the catalog. A file that starts with the UTF-8 byte order mark keeps it.
//
// A body carries the hash of the bytes the tab last read or wrote (`base`). The server reads the
// file's bytes once, with a stat before the read, and refuses `changed` (409, nothing written, no
// copy kept) when the bytes hash to something else, when the body has a base and the file is gone,
// or when a second stat right before the write differs from the first in inode, size or either
// time, or when either stat cannot be made (the file went between the check and the stat). A body
// without a base writes over whatever is there, which is what Overwrite and a restore from the
// Timeline send. A body with `create` and no file writes a new file when its folder is in
// the root; with a folder where the file should be it is refused `changed`. The `ok` answer carries
// the hash of the bytes written, which is the next base of the tab.
//
// A save copies the file as the compare read it into the local history (server/files/fs/
// history.ts), after every refusal above and before the write. A copy that cannot be made does not
// stop the save: the answer is `ok` and carries `refused: [{ field: 'history', reason }]`, which
// the tab says. A save of a machine file (a hub's `.oculus/local.yml`) is refused while a key in
// its text does not read (`localRefusal`), and is otherwise a save like any other.
//
// The GET answers the one fact the tab needs before it draws anything, whether the file is writable
// on this machine, so the editor can say so rather than letting a reader type into something that
// will refuse the save.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import {
    accessSync,
    closeSync,
    constants,
    openSync,
    readFileSync,
    readSync,
    statSync
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { LOCAL_NAME, checkLocal } from '../../../data/sources/config.ts';
import {
    TEXT_SNIFF_READ,
    isTextBytes,
    isWholeText
} from '../../../data/helpers/files/text-kind.ts';
import { tokenedBody } from '../../core/auth.ts';
import { hashOf, splitMark, withMark } from '../../core/file-bytes.ts';
import { writeBytesAtomic } from '../../core/json.ts';
import { namesMachineFile } from '../workspace/machine-file.ts';
import { resolveRootFileResult, resolveRootPath, type Root } from '../files.ts';
import { keepBytes } from '../fs/history.ts';

/**
 * A save: the root and path of the file, the text to write, the hash of the bytes the tab last read
 * or wrote when the save is to refuse a file that changed since (`base`, 64 hexadecimal
 * characters), and whether the file may be made when it is not there (`create`).
 */
export type SourceBody = {
    root: string;
    path: string;
    content: string;
    base?: string;
    create?: boolean;
};

/** The part of a stat that says a file was written: what a second stat is compared with. */
export type Stamp = { ino: number; size: number; mtimeMs: number; ctimeMs: number };

/** How a save asks the system about a file, which a test replaces to move a file in between. */
export type StatOf = (path: string) => Stamp;

function refuse(reason: string): Response {
    return json(
        { ok: false, error: reason, refused: [{ field: 'path', reason }] },
        { status: 403 }
    );
}

/**
 * A save refused because the file is not what the tab read: nothing is written. The `code` is the
 * word the page acts on, so the refusal is answered with the tab's question and not told as a
 * failure.
 */
function changed(field: 'base' | 'path', reason: 'changed' | 'folder'): Response {
    return json(
        { ok: false, error: 'changed', code: 'changed', refused: [{ field, reason }] },
        { status: 409 }
    );
}

/** The word a refusal carries, which the source tab has a sentence of its own for. */
export type SourceRefusal = 'readonly' | 'binary';

/** Whether this machine's mode on the resolved file refuses a write to it. */
export function isReadonly(path: string): boolean {
    try {
        accessSync(path, constants.W_OK);
        return false;
    } catch {
        return true;
    }
}

/**
 * Whether the file on disk starts with bytes no editor could have read, by the head rule the
 * browser told the file's kind by (data/helpers/files/text-kind.ts), over the window and the one
 * byte after it the rule reads a cut by. It is the check of the readers that do not hold the whole
 * file (Replace, the file compare, the language server library); the save reads every byte and
 * runs the whole-file rule.
 *
 * A file that cannot be opened for reading is not binary and is not refused here: the mode that
 * refuses the read either refuses the write too, which answers in the write's own words, or allows
 * it, and a file this machine says may be written is written. Nothing is decided here about a file
 * nothing could be read from.
 */
export function isBinaryFile(path: string): boolean {
    let handle: number | null = null;
    try {
        handle = openSync(path, 'r');
        const head = new Uint8Array(TEXT_SNIFF_READ);
        const read = readSync(handle, head, 0, TEXT_SNIFF_READ, 0);
        return !isTextBytes(head.subarray(0, read));
    } catch {
        return false;
    } finally {
        if (handle !== null) closeSync(handle);
    }
}

/** A whole-file source body: a root and a path that are not empty, and the text to write. */
const sourceBodyShape = z.object({
    root: z.string().min(1),
    path: z.string().min(1),
    content: z.string(),
    base: z
        .string()
        .regex(/^[0-9a-f]{64}$/)
        .optional(),
    create: z.boolean().optional()
}) satisfies z.ZodType<SourceBody>;

/** A valid whole-file source body, or null when any required field is absent or malformed. */
export function sourceBody(value: unknown): SourceBody | null {
    const body = sourceBodyShape.safeParse(value);
    return body.success ? body.data : null;
}

/**
 * The sentence a save of the machine's own file is refused with, or null for any other file and for
 * a body whose every key reads. The `local.yml` of each hub of the workspace is read by its own
 * rules rather than merged, and a key one gets wrong is read as its default: saved, the wrong value
 * would cost the machine that key without a word at the save, so the save is refused with the
 * sentence naming it. The file is recognised by its device and inode, so any spelling of its path
 * is it.
 */
function localRefusal(list: Root[], path: string, content: string): string | null {
    if (!namesMachineFile(path, list)) return null;
    return checkLocal(content, LOCAL_NAME);
}

/** The stamp of a file, or null when the system cannot stat it, as for a file gone since. */
export function stampOf(stat: StatOf, path: string): Stamp | null {
    try {
        return stat(path);
    } catch {
        return null;
    }
}

/** Whether a read failed because the file went away after its stamp was taken. */
export function goneSince(error: unknown): boolean {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    return code === 'ENOENT' || code === 'ENOTDIR';
}

/** Two stamps of one file are the same when no write, replace or move happened between them. */
export function sameStamp(one: Stamp, other: Stamp): boolean {
    return (
        one.ino === other.ino &&
        one.size === other.size &&
        one.mtimeMs === other.mtimeMs &&
        one.ctimeMs === other.ctimeMs
    );
}

/**
 * The refusal reason of a copy that failed, or null when the copy was made or was not needed (the
 * file is over the limit). The copy is of the bytes the compare read.
 */
export function historyRefusal(
    path: string,
    bytes: Buffer,
    history: string | undefined
): string | null {
    if (history === undefined) return null;
    const kept = keepBytes(history, path, bytes, 'save');
    return kept.ok ? null : kept.reason;
}

/**
 * What the source tab may do with one file: whether this machine's mode on it refuses a write. The
 * resolver is the write's, so the two answer about the same file.
 */
export function handleSourceInfo(request: Request, url: URL, rootList: Root[]): Response {
    const root = url.searchParams.get('root') ?? '';
    const path = url.searchParams.get('path') ?? '';
    if (root === '' || path === '') {
        return json({ ok: false, error: 'root and path are required' }, { status: 400 });
    }
    const resolved = resolveRootFileResult(rootList, root, path);
    if ('error' in resolved) {
        return resolved.error === 'missing'
            ? json({ ok: false, error: 'the file is not there' }, { status: 404 })
            : refuse('the path is outside the named root');
    }
    return json({ ok: true, readonly: isReadonly(resolved.path) });
}

/** The answer of a write that failed after every check passed. */
function notWritten(error: unknown): Response {
    const reason = error instanceof Error ? error.message : String(error);
    return json({ ok: false, error: `the source could not be saved: ${reason}` }, { status: 500 });
}

/** The answer of a save that wrote: the hash of the bytes now on disk, and a copy that failed. */
function saved(bytes: Buffer, unkept: string | null): Response {
    const hash = hashOf(bytes);
    return unkept === null
        ? json({ ok: true, hash })
        : json({ ok: true, hash, refused: [{ field: 'history', reason: unkept }] });
}

/**
 * The bytes of a save: the text, with the byte order mark before it when the file it replaces had
 * one and the text does not start with one of its own.
 */
function bytesOf(content: string, marked: boolean): Buffer {
    return withMark(Buffer.from(content, 'utf8'), marked && !content.startsWith('\uFEFF'));
}

/**
 * Make a file that is not there, in a folder of its root. A folder that is not there, or that is a
 * file, is the missing file's 404; a folder in the file's place is refused `changed`.
 */
function createFile(rootList: Root[], body: SourceBody, folder: boolean): Response {
    if (folder) return changed('path', 'folder');
    const parent = resolveRootPath(rootList, body.root, dirname(body.path));
    if ('error' in parent) {
        return parent.error === 'missing'
            ? json({ ok: false, error: 'the file is not there' }, { status: 404 })
            : refuse('the path is outside the named root');
    }
    try {
        if (!statSync(parent.path).isDirectory()) {
            return json({ ok: false, error: 'the file is not there' }, { status: 404 });
        }
    } catch {
        return json({ ok: false, error: 'the file is not there' }, { status: 404 });
    }
    const target = join(parent.path, basename(body.path));
    const refusal = localRefusal(rootList, target, body.content);
    if (refusal !== null) return json({ ok: false, error: refusal }, { status: 400 });
    const written = bytesOf(body.content, false);
    try {
        writeBytesAtomic(target, written);
    } catch (error) {
        return notWritten(error);
    }
    return saved(written, null);
}

/**
 * Refuse a source write or replace its complete text and answer in the write route's shape. `stat`
 * is how the file is stamped before it is read and again right before it is written.
 */
export async function handleSource(
    request: Request,
    token: string,
    text: () => Record<string, string>,
    rootList: Root[],
    history?: string,
    stat: StatOf = statSync
): Promise<Response> {
    const read = await tokenedBody(request, token, { fields: { ok: false }, text });
    if (read instanceof Response) return read;
    const body = sourceBody(read.body);
    if (body === null) {
        return json(
            {
                ok: false,
                error: 'root, path and content are required, and base is 64 hexadecimal characters'
            },
            { status: 400 }
        );
    }

    const found = resolveRootPath(rootList, body.root, body.path);
    if ('error' in found && found.error === 'outside') {
        return refuse('the path is outside the named root');
    }
    let real: string | null = null;
    let folder = false;
    if ('path' in found) {
        try {
            const info = statSync(found.path);
            if (info.isFile()) real = found.path;
            folder = info.isDirectory();
        } catch {
            real = null;
        }
    }
    if (real === null) {
        if (body.create === true) return createFile(rootList, body, folder);
        return body.base === undefined
            ? json({ ok: false, error: 'the file is not there' }, { status: 404 })
            : changed('base', 'changed');
    }
    if (isReadonly(real)) return refuse('readonly');
    const before = stampOf(stat, real);
    if (before === null) return changed('base', 'changed');
    let bytes: Buffer;
    try {
        bytes = readFileSync(real);
    } catch (error) {
        return goneSince(error) ? changed('base', 'changed') : notWritten(error);
    }
    if (!isWholeText(bytes)) return refuse('binary');
    if (body.base !== undefined && hashOf(bytes) !== body.base) return changed('base', 'changed');
    const refusal = localRefusal(rootList, real, body.content);
    if (refusal !== null) return json({ ok: false, error: refusal }, { status: 400 });
    const after = stampOf(stat, real);
    if (after === null || !sameStamp(before, after)) return changed('base', 'changed');
    const unkept = historyRefusal(real, bytes, history);
    const written = bytesOf(body.content, splitMark(bytes).marked);
    try {
        writeBytesAtomic(real, written);
    } catch (error) {
        return notWritten(error);
    }
    return saved(written, unkept);
}
