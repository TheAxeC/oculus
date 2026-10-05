// Layer 2, server. The source endpoint: what one file may be done with, and the whole-file write.
//
// The write authenticates one request by its token, resolves its existing file inside a configured
// root, and replaces its text through a temporary neighbour and atomic rename. What it may be done
// to is the file itself and not a list of extensions: a file the mode locks is refused with
// `readonly`, and a file whose own bytes are not text is refused with `binary`, since replacing
// those with an editor's text would destroy them. The refusals are single words; the sentence a
// reader is shown for each is the source tab's, from the catalog.
//
// A save first copies the file as it was into the local history (server/files/fs/history.ts), after
// every refusal above and before the write. A copy that cannot be made does not stop the save: the
// answer is `ok` and carries `refused: [{ field: 'history', reason }]`, which the tab says. The
// machine's own config/local.yml is never copied, compared by device and inode.
//
// The GET answers the one fact the tab needs before it draws anything, whether the file is writable
// on this machine, so the editor can say so rather than letting a reader type into something that
// will refuse the save.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { accessSync, closeSync, constants, openSync, readSync, statSync } from 'node:fs';
import { LOCAL_NAME, checkLocal } from '../../data/sources/config.ts';
import { TEXT_SNIFF_READ, isTextBytes } from '../../data/helpers/files/text-kind.ts';
import { tokenedBody } from '../core/auth.ts';
import { ENGINE_ROOT, resolveRootFileResult, resolveRootPath, type Root } from './files.ts';
import { writeTextAtomic } from '../core/json.ts';
import { keepCopy } from './fs/history.ts';

export type SourceBody = { root: string; path: string; content: string };

function refuse(reason: string): Response {
    return json(
        { ok: false, error: reason, refused: [{ field: 'path', reason }] },
        { status: 403 }
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
 * Whether the file on disk holds bytes no editor could have read, by the rule the browser told the
 * file's kind by, over the window and the one byte after it the rule reads a cut by.
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
    content: z.string()
}) satisfies z.ZodType<SourceBody>;

/** A valid whole-file source body, or null when any required field is absent or malformed. */
export function sourceBody(value: unknown): SourceBody | null {
    const body = sourceBodyShape.safeParse(value);
    return body.success ? body.data : null;
}

/**
 * The sentence a save of the machine's own file is refused with, or null for any other file and for
 * a body whose every key reads. That one file of the config folder is read by its own rules rather
 * than merged, and a key it gets wrong is read as its default: saved, the wrong value would cost
 * the machine that key without a word at the save, so the save is refused with the sentence naming
 * it. The path is resolved through the same resolver the request went through, so the two strings
 * are comparable.
 */
function localRefusal(list: Root[], path: string, content: string): string | null {
    const own = resolveRootPath(list, ENGINE_ROOT, LOCAL_NAME);
    if ('error' in own || own.path !== path) return null;
    return checkLocal(content, LOCAL_NAME);
}

/** Whether two paths are one file: the same device and inode, under whatever spelling. */
function sameFile(one: string, other: string): boolean {
    try {
        const left = statSync(one);
        const right = statSync(other);
        return left.ino === right.ino && left.dev === right.dev;
    } catch {
        return false;
    }
}

/**
 * The refusal reason of a copy that failed, or null when the copy was made, was not needed (the
 * file is over the limit) or must not be made: the machine's own file is never copied.
 */
function historyRefusal(list: Root[], path: string, history: string | undefined): string | null {
    if (history === undefined) return null;
    const own = resolveRootPath(list, ENGINE_ROOT, LOCAL_NAME);
    if ('path' in own && sameFile(own.path, path)) return null;
    const kept = keepCopy(history, path, 'save');
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

/** Refuse a source write or replace its complete text and answer in the write route's shape. */
export async function handleSource(
    request: Request,
    token: string,
    rootList: Root[],
    history?: string
): Promise<Response> {
    const read = await tokenedBody(request, token, { fields: { ok: false } });
    if (read instanceof Response) return read;
    const body = sourceBody(read.body);
    if (body === null) {
        return json({ ok: false, error: 'root, path and content are required' }, { status: 400 });
    }

    const resolved = resolveRootFileResult(rootList, body.root, body.path);
    if ('error' in resolved) {
        return resolved.error === 'missing'
            ? json({ ok: false, error: 'the file is not there' }, { status: 404 })
            : refuse('the path is outside the named root');
    }
    if (isReadonly(resolved.path)) return refuse('readonly');
    if (isBinaryFile(resolved.path)) return refuse('binary');
    const refusal = localRefusal(rootList, resolved.path, body.content);
    if (refusal !== null) return json({ ok: false, error: refusal }, { status: 400 });
    const unkept = historyRefusal(rootList, resolved.path, history);
    try {
        writeTextAtomic(resolved.path, body.content);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return json(
            { ok: false, error: `the source could not be saved: ${reason}` },
            { status: 500 }
        );
    }
    return unkept === null
        ? json({ ok: true })
        : json({ ok: true, refused: [{ field: 'history', reason: unkept }] });
}
