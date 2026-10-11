// Layer 2, server. The bytes of one file, read and replaced for a custom editor of an app.
//
// A custom editor holds the bytes of the file it was opened on, text or binary, and gives the whole
// of them back. The save has the source save's checks (source.ts): the file is resolved inside a
// root (`outside`), a file that is not there is `missing`, one this machine's mode refuses is
// `readonly`, and the hash of the bytes the editor last read (`base`) must be the hash of the bytes
// on disk now, with the file unchanged between two stamps (`changed`). The file as it was is copied
// into the local history after those checks and before the write; a copy that cannot be made does
// not stop the save and is answered in `unkept`. The machine's own `config/local.yml` is never
// written here: it is read by its own rules (source.ts `localRefusal`) and a custom editor holds
// bytes the rules cannot judge, so it answers `readonly`.
//
// Whether the app may have the file at all is the app routes' check (apps/reach/open.ts), made
// before any function here runs.

import { readFileSync, statSync } from 'node:fs';
import { hashOf } from '../core/file-bytes.ts';
import { writeBytesAtomic } from '../core/json.ts';
import { ENGINE_ROOT, resolveRootFileResult, resolveRootPath, type Root } from './files.ts';
import {
    goneSince,
    historyRefusal,
    isReadonly,
    sameStamp,
    stampOf,
    type StatOf
} from './source.ts';

/** What a read of a file's bytes came to. */
export type BytesRead =
    | { ok: true; bytes: Buffer; hash: string }
    | { ok: false; word: 'missing' | 'outside' | 'too_large' };

/** What a save of a file's bytes came to. */
export type BytesSaved =
    | { ok: true; hash: string; unkept: string | null }
    | { ok: false; word: 'missing' | 'outside' | 'readonly' | 'changed' };

/** The bytes of a file of a root and their hash; `too_large` above `limit` bytes. */
export function readBytes(rootList: Root[], root: string, path: string, limit: number): BytesRead {
    const found = resolveRootFileResult(rootList, root, path);
    if ('error' in found) return { ok: false, word: found.error };
    try {
        if (statSync(found.path).size > limit) return { ok: false, word: 'too_large' };
        const bytes = readFileSync(found.path);
        return { ok: true, bytes, hash: hashOf(bytes) };
    } catch {
        return { ok: false, word: 'missing' };
    }
}

/** Whether a path of a root is the machine's own `local.yml`. */
function isLocal(rootList: Root[], real: string): boolean {
    const own = resolveRootPath(rootList, ENGINE_ROOT, 'local.yml');
    return 'path' in own && own.path === real;
}

/**
 * Replace the bytes of a file of a root with `bytes`. `base` is the hash of the bytes the editor
 * last read; `history` is the local history's folder, or undefined for no copy. `stat` is how the
 * file is stamped before it is read and again right before it is written.
 */
export function saveBytes(
    rootList: Root[],
    ask: { root: string; path: string; bytes: Buffer; base: string },
    history: string | undefined,
    stat: StatOf = statSync
): BytesSaved {
    const found = resolveRootFileResult(rootList, ask.root, ask.path);
    if ('error' in found) return { ok: false, word: found.error };
    const real = found.path;
    if (isReadonly(real) || isLocal(rootList, real)) return { ok: false, word: 'readonly' };
    const before = stampOf(stat, real);
    if (before === null) return { ok: false, word: 'changed' };
    let held: Buffer;
    try {
        held = readFileSync(real);
    } catch (error) {
        return { ok: false, word: goneSince(error) ? 'changed' : 'missing' };
    }
    if (hashOf(held) !== ask.base) return { ok: false, word: 'changed' };
    const after = stampOf(stat, real);
    if (after === null || !sameStamp(before, after)) return { ok: false, word: 'changed' };
    const unkept = historyRefusal(rootList, real, held, history);
    try {
        writeBytesAtomic(real, ask.bytes);
    } catch {
        return { ok: false, word: 'readonly' };
    }
    return { ok: true, hash: hashOf(ask.bytes), unkept };
}
