// Layer 2, server. Local history: a copy of a file as it was, kept before the save or the delete
// that changes it, so the Timeline section can show the saves and a restore can write one back.
//
// The history folder (local.yml's `history` key, ~/.oculus/history by default) holds one folder per
// file, named by the first 16 hex digits of the SHA-256 of the file's real path. In it
// `entries.json` is `{ path, saves: [{ id, at, size, kind }] }`, newest last, and every save has
// one copy named by its id. An id is the time of the copy as `YYYYMMDDTHHMMSSmmm` in UTC, with
// `-2`, `-3` and so on for a second copy in the same millisecond.
//
// A copy of kind `save` is made only for a file of at most 256 KB, and the newest 50 of them are
// kept per file. A copy of kind `replace`, made before a replace in the Search view writes the
// file, and again before the undo of a replace writes it back, has the limit and the pruning of a
// `save`: a file of at most 256 KB, the newest 50 of that kind per file. A copy of kind `delete`,
// made before a delete, is made for a file of at most 5 MB
// and is not counted in those 50, since the undo of the delete reads it; the newest 50 copies of
// kind `delete` over all files are kept, and when a delete adds one the oldest beyond 50 are
// removed, so an undo of an older delete finds its copy gone. `deletes.json` beside the file
// folders lists the copies of kind `delete` as `{ deletes: [{ folder, id, at }] }`, oldest first,
// so a delete reads one index and the folders of the copies it removes, never every folder; a
// missing or unreadable index is built again from the folders once. A folder left with no copy is
// removed. A file bigger than the limit of its kind is not copied and that is not an error. A copy
// that cannot be written is an error the caller says, and the save or the delete goes on.
//
// A copy is read back only by an id taken from the file's own `entries.json`, so an id that names a
// path (`../x`) or a copy the folder does not list reads as nothing.
//
// GET /api/history?root=<key>&path=<rel> lists the copies of that file, newest first, and with
// `&id=<id>` answers that copy's text. A file that is no longer there is listed all the same, by
// the real path of its folder and its name, since a delete's copy is made for a file that goes.
//
// Nothing here holds state between calls; the folder comes in from the caller. The read and the
// write of `entries.json` of one call run with no await between them, so two copies of one file
// never interleave in this process.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { basename, dirname } from 'node:path';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { writeBytesAtomic, writeTextAtomic } from '../../core/json.ts';
import { realPath } from '../../core/paths.ts';
import { resolveRootPath, type Root } from '../files.ts';

/** The most bytes of a file a copy of kind `save` is made of. */
export const SAVE_MAX_BYTES = 256 * 1024;

/** The most bytes of a file a copy of kind `delete` is made of. */
export const DELETE_MAX_BYTES = 5 * 1024 * 1024;

/** How many copies of kind `save` are kept per file. */
export const SAVES_KEPT = 50;

/** How many copies of kind `delete` are kept over all files. */
export const DELETES_KEPT = 50;

/**
 * What a copy was made before: a save of the file, a replace in it, an edit a language server asked
 * for in it, or the delete of it.
 */
export type HistoryKind = 'save' | 'replace' | 'lsp-edit' | 'delete';

/** The kinds of copy kept per file, newest `SAVES_KEPT` of each, which are the edits of a file. */
const EDIT_KINDS: readonly HistoryKind[] = ['save', 'replace', 'lsp-edit'];

/** One copy of a file: its id, the time it was made (ms), the file's size and why it was made. */
export type HistorySave = { id: string; at: number; size: number; kind: HistoryKind };

/** The content of one file's `entries.json`. */
export type HistoryEntries = { path: string; saves: HistorySave[] };

const entriesShape = z.object({
    path: z.string(),
    saves: z.array(
        z.object({
            id: z.string().regex(/^\d{8}T\d{9}(-\d+)?$/),
            at: z.number(),
            size: z.number(),
            kind: z.enum(['save', 'replace', 'lsp-edit', 'delete'])
        })
    )
});

/** ~/.oculus/history, resolved at the call rather than at import. */
export function defaultHistoryDir(): string {
    return join(homedir(), '.oculus', 'history');
}

/** The folder one file's copies are kept in: 16 hex digits of the SHA-256 of its real path. */
export function historyFolder(history: string, real: string): string {
    return join(history, createHash('sha256').update(real).digest('hex').slice(0, 16));
}

/**
 * The copies of one file by its real path, newest last; none when it has no folder or a bad one.
 */
export function savesOf(history: string, real: string): HistoryEntries {
    try {
        const text = readFileSync(join(historyFolder(history, real), 'entries.json'), 'utf8');
        const held = entriesShape.safeParse(JSON.parse(text));
        if (held.success && held.data.path === real) return held.data;
    } catch {
        // No folder, or one that is not ours: the file has no copies.
    }
    return { path: real, saves: [] };
}

/** The id a copy made at this time takes: UTC `YYYYMMDDTHHMMSSmmm`. */
function idAt(at: number): string {
    return new Date(at).toISOString().replace(/[-:]/g, '').replace('.', '').replace('Z', '');
}

/** The first id of this time that no copy of the file has. */
function freeId(taken: HistorySave[], at: number): string {
    const base = idAt(at);
    const used = new Set(taken.map((one) => one.id));
    if (!used.has(base)) return base;
    for (let n = 2; ; n += 1) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** What keeping a copy came to: its id, nothing because the file is over the limit, or a reason. */
export type KeepResult = { ok: true; kept: HistorySave | null } | { ok: false; reason: string };

/**
 * Copy the file at `file` into the history before it is changed. The file is not there, is not a
 * file, or is over the limit of `kind`: nothing is copied and that is `kept: null`. The copy is
 * written before `entries.json` names it, and the 51st and older copies of kind `save` and of kind
 * `replace` are removed after, as are the delete copies beyond the newest 50 over all files, so a
 * failure never leaves an entry without its copy.
 */
export function keepCopy(
    history: string,
    file: string,
    kind: HistoryKind,
    now: number = Date.now()
): KeepResult {
    const real = realPath(file);
    if (real === null) return { ok: true, kept: null };
    try {
        const info = statSync(real);
        const limit = kind === 'delete' ? DELETE_MAX_BYTES : SAVE_MAX_BYTES;
        if (!info.isFile() || info.size > limit) return { ok: true, kept: null };
        const bytes = readFileSync(real);
        const folder = historyFolder(history, real);
        mkdirSync(folder, { recursive: true });
        const entries = savesOf(history, real);
        const save: HistorySave = {
            id: freeId(entries.saves, now),
            at: now,
            size: bytes.length,
            kind
        };
        writeBytesAtomic(join(folder, save.id), bytes);
        const saves = [...entries.saves, save];
        const old = EDIT_KINDS.flatMap((edit) =>
            saves.filter((one) => one.kind === edit).slice(0, -SAVES_KEPT)
        );
        const dropped = new Set(old.map((one) => one.id));
        writeTextAtomic(
            join(folder, 'entries.json'),
            `${JSON.stringify({ path: real, saves: saves.filter((one) => !dropped.has(one.id)) })}\n`
        );
        for (const one of old) rmSync(join(folder, one.id), { force: true });
        if (kind === 'delete') {
            try {
                addDelete(history, { folder: basename(folder), id: save.id, at: save.at });
            } catch {
                // A copy that stays beyond the 50 is an unused file of the history.
            }
        }
        return { ok: true, kept: save };
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
}

/** One copy of kind `delete` as the index lists it: its file's folder name, its id and its time. */
type DeleteRef = { folder: string; id: string; at: number };

const indexShape = z.object({
    deletes: z.array(z.object({ folder: z.string(), id: z.string(), at: z.number() }))
});

/** The index of the copies of kind `delete`, oldest first. */
function indexPath(history: string): string {
    return join(history, 'deletes.json');
}

/** The copies of kind `delete` the index lists, or, with no readable index, every folder lists. */
function readDeletes(history: string): DeleteRef[] {
    try {
        const held = indexShape.safeParse(JSON.parse(readFileSync(indexPath(history), 'utf8')));
        if (held.success) return held.data.deletes;
    } catch {
        // No index yet, or a broken one: it is built again from the folders.
    }
    const found: DeleteRef[] = [];
    for (const name of readdirSync(history)) {
        const entries = entriesIn(join(history, name));
        if (entries === null) continue;
        for (const copy of entries.saves) {
            if (copy.kind === 'delete') found.push({ folder: name, id: copy.id, at: copy.at });
        }
    }
    return found.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
}

/** One folder's `entries.json`, or null when it is missing or not ours. */
function entriesIn(folder: string): HistoryEntries | null {
    try {
        const parsed = entriesShape.safeParse(
            JSON.parse(readFileSync(join(folder, 'entries.json'), 'utf8'))
        );
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}

/** Write the index of the copies of kind `delete`. */
function writeDeletes(history: string, deletes: DeleteRef[]): void {
    writeTextAtomic(indexPath(history), `${JSON.stringify({ deletes })}\n`);
}

/**
 * Add a copy of kind `delete` to the index, and remove the copies beyond the newest
 * `DELETES_KEPT`, oldest first, from their folders' `entries.json` and from the disk; a folder left
 * with no copy is removed. A folder whose `entries.json` is missing or not ours is left alone.
 */
function addDelete(history: string, added: DeleteRef): void {
    const deletes = [
        ...readDeletes(history).filter((one) => one.id !== added.id || one.folder !== added.folder),
        added
    ];
    deletes.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
    const dropped = deletes.slice(0, Math.max(0, deletes.length - DELETES_KEPT));
    const byFolder = new Map<string, Set<string>>();
    for (const one of dropped) {
        const ids = byFolder.get(one.folder) ?? new Set<string>();
        ids.add(one.id);
        byFolder.set(one.folder, ids);
    }
    for (const [name, ids] of byFolder) {
        const folder = join(history, name);
        const entries = entriesIn(folder);
        if (entries === null) continue;
        const saves = entries.saves.filter((one) => !ids.has(one.id));
        if (saves.length === 0) {
            rmSync(folder, { recursive: true, force: true });
            continue;
        }
        writeTextAtomic(
            join(folder, 'entries.json'),
            `${JSON.stringify({ path: entries.path, saves })}\n`
        );
        for (const id of ids) rmSync(join(folder, id), { force: true });
    }
    writeDeletes(history, deletes.slice(dropped.length));
}

/** The bytes of one copy by the id its file's `entries.json` lists, or null for any other id. */
export function readCopy(history: string, real: string, id: string): Buffer | null {
    if (!savesOf(history, real).saves.some((one) => one.id === id)) return null;
    const path = join(historyFolder(history, real), id);
    if (!existsSync(path)) return null;
    try {
        return readFileSync(path);
    } catch {
        return null;
    }
}

/**
 * Write a copy back as the file at `path`, making the folder it is in first. False when the copy
 * is not in the history, and then nothing is written.
 */
export function restoreCopy(history: string, real: string, id: string, path: string): boolean {
    const copy = readCopy(history, real, id);
    if (copy === null) return false;
    mkdirSync(dirname(path), { recursive: true });
    writeBytesAtomic(path, copy);
    return true;
}

/**
 * The real path a root's key and a relative path name for the history, whether the file is there or
 * not: the path itself when it is there, and the real folder it was in with its name when it is
 * gone. Null for a path outside the root or in a folder that is gone too.
 */
export function historyPath(list: Root[], key: string, path: string): string | null {
    const here = resolveRootPath(list, key, path);
    if ('path' in here) return here.path;
    if (here.error === 'outside' || path === '') return null;
    const folder = resolveRootPath(list, key, dirname(path) === '.' ? '' : dirname(path));
    return 'path' in folder ? join(folder.path, basename(path)) : null;
}

/** What every answer of GET /api/history carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** GET /api/history: the copies of one file, or one copy's text. */
export function handleHistory(url: URL, list: Root[], history: string): Response {
    const key = url.searchParams.get('root') ?? '';
    const path = url.searchParams.get('path') ?? '';
    if (key === '' || path === '') {
        return json(
            { ok: false, error: 'root and path are required' },
            { status: 400, headers: NO_STORE }
        );
    }
    const real = historyPath(list, key, path);
    if (real === null) {
        return json({ ok: false, error: 'outside' }, { status: 400, headers: NO_STORE });
    }
    const id = url.searchParams.get('id');
    if (id === null) {
        const saves = [...savesOf(history, real).saves].reverse();
        return json({ ok: true, saves }, { headers: NO_STORE });
    }
    const copy = readCopy(history, real, id);
    if (copy === null) {
        return json({ ok: false, error: 'no-such-save' }, { status: 400, headers: NO_STORE });
    }
    return json({ ok: true, id, content: copy.toString('utf8') }, { headers: NO_STORE });
}

/** Take a copy out of the history again: the delete it was made for did not happen. */
export function forgetCopy(history: string, real: string, id: string): void {
    const entries = savesOf(history, real);
    if (!entries.saves.some((one) => one.id === id)) return;
    const folder = historyFolder(history, real);
    try {
        writeTextAtomic(
            join(folder, 'entries.json'),
            `${JSON.stringify({ path: real, saves: entries.saves.filter((one) => one.id !== id) })}\n`
        );
        rmSync(join(folder, id), { force: true });
        if (entries.saves.some((one) => one.id === id && one.kind === 'delete')) {
            const name = basename(folder);
            writeDeletes(
                history,
                readDeletes(history).filter((one) => one.id !== id || one.folder !== name)
            );
        }
    } catch {
        // A copy that stays is an unused file of the history and harms nothing.
    }
}
