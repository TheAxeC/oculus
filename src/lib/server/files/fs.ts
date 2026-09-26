// Layer 2, server. The file browser's server concerns: the entries of one directory under a named
// root, the workspaces the reader saved on this machine, and the two things the reader keeps beside
// them, their own bookmarks and their scratch notes.
//
// The bookmarks and the notes are read here and written through this route because they are the
// file browser's: a bookmark is a file under a root and a note is a file in a folder. What each one
// is kept in is its own module, fs/bookmarks.ts and fs/notes.ts; a bookmark is written by the
// collection write path instead, since it is a collection file and the entry form edits it.
//
// A listing is one level deep and read at the call. The tree asks for a folder when the folder is
// opened, so nothing walks a root: a home directory with a hundred thousand files under it costs
// one readdir of whatever folder is on screen. Dotfiles and the three build folders are left out
// unless the request carries `hidden=1`, because a tree that is mostly node_modules is a tree
// nobody reads; every entry git ignores is left out unless it carries `ignored=1`, read by
// server/core/git.ts's ignoredIn, the module of the read-only git forms this server runs. The two
// are the reader's own toggles on the tab, so the same folder is listed either way on request. The
// file route still serves what a listing leaves out, since what is served and what is offered are
// different questions. A symbolic link is resolved and then listed as the kind its target is, under
// the same rule the file route serves one by: inside the root it is an ordinary entry, and pointing
// out of the root it is left out.
//
// A workspace is a name and a list of roots, saved at ~/.oculus/workspaces.json. The hub key and
// the keys the configuration names are reserved: a saved root carrying one is dropped on the read
// and named back to the page, so a saved file can only ever add a root and never redirect one the
// rest of the application reads. The file is written whole and atomically, as the other two
// ~/.oculus files are, because it holds work the reader did by hand, and the writes of one process
// are chained so two requests in flight cannot lose one another's change.
//
// The fold from a saved file to the roots on screen is pure: workspaceRoots takes the configured
// roots and the object the file parsed to, and reads nothing. The reading is readSaved's alone.
//
// Nothing here holds state between calls: the path of the file, the roots and the write chain all
// come in from the request's ServerContext, so two servers in one process read two files.

import { readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, sep } from 'node:path';
import { hasToken, sameOrigin } from '../core/auth.ts';
import { expandHome, HUB_ROOT, resolveRootPath, type Root } from './files.ts';
import { readBookmarks } from './fs/bookmarks.ts';
import { ignoredIn } from '../core/git.ts';
import { deleteNote, listNotes, readNote, saveNote } from './fs/notes.ts';
import { chained, isMap, readJson, writeJsonAtomic, type FsWrites } from '../core/json.ts';

/** One entry of one directory, as the tree draws it. */
export type Entry = { name: string; kind: 'file' | 'dir'; size: number; mtime: number };

/** One saved workspace: the name the reader gave it, and the roots they added to it. */
export type SavedWorkspace = { name: string; roots: Root[] };

/**
 * The whole of ~/.oculus/workspaces.json as it was read: which workspace is current, every saved
 * one, and the keys the read dropped because the configuration reserves them. Only the first two
 * are written back.
 */
export type Saved = { current: string; workspaces: SavedWorkspace[]; dropped: string[] };

/** One root as the page reads it: `fixed` is a root a removal refuses. */
export type ShownRoot = Root & { fixed: boolean };

/**
 * What a GET with no root answers: the workspace in force, every one there is, and what was
 * dropped.
 */
export type WorkspacesAnswer = {
    current: string;
    workspaces: { name: string; roots: ShownRoot[] }[];
    dropped: string[];
};

/**
 * The folders a tree offers only when hidden files are asked for. Dotfiles are left out beside
 * them.
 */
const SKIPPED = ['node_modules', '__pycache__', '.git'];

/** What one listing request asks to see beside what the tree offers by default. */
export type Shown = {
    /** Dotfiles and the three build folders. */
    hidden: boolean;
    /** Entries git ignores in the folder listed. */
    ignored: boolean;
};

/** A listing request that asks for nothing beyond the default. */
export const DEFAULT_SHOWN: Shown = { hidden: false, ignored: false };

/** Where a workspace starts when neither the configuration nor the reader names a root. */
const DEFAULT_ROOT = { key: 'workspace', dir: '~/workspace' };

/** The workspace that is always there and holds no name: the configured roots, plus any added. */
export const DEFAULT_WORKSPACE = '';

/**
 * How long one folder's ignored names are reused. A write that moves the file browser's round has
 * every open folder of every Files tab, shown or hidden, listed again at once, and each listing
 * asks git; within this window the same folder with the same entries is asked once. It is the
 * cadence the git watcher reads a root at (root/watch/git.ts).
 */
export const IGNORED_REUSE_MS = 2000;

/** The ignored names asked for lately, per folder and its entries, held by one ServerContext. */
export type IgnoredCache = { held: Map<string, { at: number; ignored: Set<string> }> };

/** An empty cache, for a ServerContext being built. */
export function ignoredCache(): IgnoredCache {
    return { held: new Map() };
}

/**
 * The names of a folder's entries that git ignores, asked of `ask` unless the same folder with the
 * same entries was asked within IGNORED_REUSE_MS. An entry added or removed since makes the key
 * differ, so an answer is never reused for a listing it was not given.
 */
export function cachedIgnored(
    cache: IgnoredCache,
    folder: string,
    names: string[],
    ask: (folder: string, names: string[]) => Set<string> = ignoredIn,
    now: number = Date.now()
): Set<string> {
    const key = `${folder}\0${names.join('\0')}`;
    const held = cache.held.get(key);
    if (held !== undefined && now - held.at < IGNORED_REUSE_MS) return held.ignored;
    const ignored = ask(folder, names);
    for (const [one, entry] of cache.held) {
        if (now - entry.at >= IGNORED_REUSE_MS) cache.held.delete(one);
    }
    cache.held.set(key, { at: now, ignored });
    return ignored;
}

/**
 * What one request needs: the files to read and write, the roots no workspace may touch, and the
 * chain.
 */
export type FsTarget = {
    /** The workspaces file this request reads and writes. */
    file: string;
    /** The reader's own bookmarks file, which this request reads and the write path writes. */
    bookmarks: string;
    /** The folder the scratch notes live in. */
    notes: string;
    /** The hub and the configured roots, resolved once for this request. */
    fixed: Root[];
    /** The process's write chain. */
    writes: FsWrites;
    /** The ignored names asked for lately, which listings reuse for a moment. */
    ignored: IgnoredCache;
};

/** ~/.oculus/workspaces.json, resolved at the call rather than at import. */
export function defaultWorkspacesPath(): string {
    return join(homedir(), '.oculus', 'workspaces.json');
}

/** One root out of the file, or null for an entry that is not a pair of non-empty strings. */
function readRoot(value: unknown): Root | null {
    if (!isMap(value)) return null;
    const { key, dir } = value;
    if (typeof key !== 'string' || key === '') return null;
    if (typeof dir !== 'string' || dir === '') return null;
    return { key, dir };
}

/**
 * Every workspace the file holds. Missing, corrupt or the wrong shape all read as nothing saved. A
 * saved root whose key is one of `reserved` is dropped and its key is named in `dropped`, so the
 * page can say what was left out rather than showing a root that silently does nothing.
 */
export function readSaved(file: string, reserved: string[] = []): Saved {
    const data = readJson(file);
    const dropped: string[] = [];
    if (!isMap(data)) return { current: DEFAULT_WORKSPACE, workspaces: [], dropped };
    const workspaces: SavedWorkspace[] = [];
    for (const entry of Array.isArray(data.workspaces) ? data.workspaces : []) {
        if (!isMap(entry) || typeof entry.name !== 'string') continue;
        if (workspaces.some((one) => one.name === entry.name)) continue;
        const roots: Root[] = [];
        for (const raw of Array.isArray(entry.roots) ? entry.roots : []) {
            const root = readRoot(raw);
            if (root === null || roots.some((one) => one.key === root.key)) continue;
            if (reserved.includes(root.key)) {
                if (!dropped.includes(root.key)) dropped.push(root.key);
                continue;
            }
            roots.push(root);
        }
        workspaces.push({ name: entry.name, roots });
    }
    const current = typeof data.current === 'string' ? data.current : DEFAULT_WORKSPACE;
    const known = current === DEFAULT_WORKSPACE || workspaces.some((one) => one.name === current);
    return { current: known ? current : DEFAULT_WORKSPACE, workspaces, dropped };
}

/**
 * Write the file whole, through the same atomic replace the other ~/.oculus files are written by.
 */
export function writeSaved(file: string, saved: Saved): void {
    writeJsonAtomic(file, { current: saved.current, workspaces: saved.workspaces });
}

/** The roots one workspace adds of its own, which is nothing for a name nothing is saved under. */
export function rootsOf(saved: Saved, name: string): Root[] {
    return saved.workspaces.find((one) => one.name === name)?.roots ?? [];
}

/**
 * The roots one workspace shows, and whether each one may be removed. Pure: the saved object comes
 * in and no file is read.
 *
 * The configured roots and the hub are in every workspace and are fixed. A machine whose
 * configuration names no root beside the hub and whose reader has saved none is given the reader's
 * own workspace folder; that root is fixed too, since nothing saved it and a removal of it has
 * nothing to remove.
 */
export function workspaceRoots(fixed: Root[], saved: Saved, name: string): ShownRoot[] {
    const shown: ShownRoot[] = fixed.map((one) => ({ ...one, fixed: true }));
    for (const one of rootsOf(saved, name)) {
        if (shown.some((held) => held.key === one.key)) continue;
        shown.push({ ...one, fixed: false });
    }
    // The hub is in every workspace, so "no root" means no root beside it.
    if (shown.every((one) => one.key === HUB_ROOT)) {
        shown.push({ key: DEFAULT_ROOT.key, dir: expandHome(DEFAULT_ROOT.dir), fixed: true });
    }
    return shown;
}

/**
 * The roots the file route adds to the configured ones: the workspace's own, or the default folder.
 */
export function addedRoots(fixed: Root[], saved: Saved): Root[] {
    return workspaceRoots(fixed, saved, saved.current)
        .filter((one) => !fixed.some((held) => held.key === one.key))
        .map((one) => ({ key: one.key, dir: one.dir }));
}

/**
 * The key a reader-added root is filed under: its folder name reduced to the characters a key may
 * hold, with a number added while the key is taken. A folder whose name reduces to nothing is filed
 * under the same word the default root is.
 */
export function rootKey(dir: string, taken: string[]): string {
    const reduced = basename(dir)
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^[-.]+|-+$/g, '');
    const stem = reduced === '' ? DEFAULT_ROOT.key : reduced;
    if (!taken.includes(stem)) return stem;
    for (let at = 2; ; at += 1) {
        const candidate = `${stem}-${at}`;
        if (!taken.includes(candidate)) return candidate;
    }
}

/**
 * Whether a name is one the tree leaves out unless hidden files are asked for: a dotfile, or one
 * of the three build folders.
 */
function skipped(name: string): boolean {
    return name.startsWith('.') || SKIPPED.includes(name);
}

/** The real path of a file or directory, or null when there is nothing there to resolve. */
function real(path: string): string | null {
    try {
        return realpathSync(path);
    } catch {
        return null;
    }
}

/**
 * One entry of a listing, or null for one that is not there or is not a file or a folder. A link is
 * followed here, so what the tree shows is what opening the entry will give.
 */
function described(dir: string, name: string): Entry | null {
    try {
        const stat = statSync(join(dir, name));
        if (stat.isDirectory()) return { name, kind: 'dir', size: 0, mtime: stat.mtimeMs };
        if (!stat.isFile()) return null;
        return { name, kind: 'file', size: stat.size, mtime: stat.mtimeMs };
    } catch {
        return null;
    }
}

/**
 * The entries of one directory under a named root, folders first and then files, each side by name,
 * and the directory's own path. A path that leaves the root, a root nothing names and a path that
 * is not a directory are all the same refusal to the caller, which is what the route answers 404
 * for. Dotfiles and the build folders are listed only when `hidden` is true.
 *
 * An entry is kept only when its real path is still inside the root, which is the check the file
 * route applies before serving one: a link out of the root is not offered, since pressing it would
 * be refused.
 */
export function listDir(
    list: Root[],
    key: string,
    path: string,
    hidden = false
): { entries: Entry[]; at: string } | { error: 'outside' | 'missing' } {
    const found = resolveRootPath(list, key, path);
    if ('error' in found) return found;
    const root = list.find((one) => one.key === key);
    const dir = root === undefined ? null : real(root.dir);
    if (dir === null) return { error: 'outside' };
    let entries: Entry[];
    try {
        if (!statSync(found.path).isDirectory()) return { error: 'missing' };
        entries = readdirSync(found.path, { withFileTypes: true })
            .filter((entry) => hidden || !skipped(entry.name))
            .filter((entry) => {
                if (!entry.isSymbolicLink()) return true;
                const target = real(join(found.path, entry.name));
                return target !== null && inside(target, dir);
            })
            .map((entry) => described(found.path, entry.name))
            .filter((entry): entry is Entry => entry !== null);
    } catch {
        return { error: 'missing' };
    }
    entries.sort((left, right) => {
        if (left.kind !== right.kind) return left.kind === 'dir' ? -1 : 1;
        return left.name.localeCompare(right.name);
    });
    return { entries, at: found.path };
}

/**
 * One directory as a listing request asks for it: listDir's entries, without the ones git ignores
 * there unless the request asks for those too.
 */
export function listShown(
    list: Root[],
    key: string,
    path: string,
    shown: Shown = DEFAULT_SHOWN,
    cache: IgnoredCache = ignoredCache()
): { entries: Entry[] } | { error: 'outside' | 'missing' } {
    const found = listDir(list, key, path, shown.hidden);
    if ('error' in found) return found;
    if (shown.ignored) return { entries: found.entries };
    const ignored = cachedIgnored(
        cache,
        found.at,
        found.entries.map((one) => one.name)
    );
    return { entries: found.entries.filter((one) => !ignored.has(one.name)) };
}

/** What a listing request asks to see, from its query: `hidden=1` and `ignored=1`, each alone. */
export function shownOf(query: URLSearchParams): Shown {
    return { hidden: query.get('hidden') === '1', ignored: query.get('ignored') === '1' };
}

/** Whether a real path is a real directory itself or something under it. */
function inside(path: string, dir: string): boolean {
    return path === dir || path.startsWith(dir + sep);
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** The keys a saved workspace may not carry, which is every key the configuration owns. */
function reservedKeys(fixed: Root[]): string[] {
    return fixed.map((one) => one.key);
}

/** The answer a GET with no root gives: the workspace in force, and the roots each one holds. */
export function workspacesAnswer(into: FsTarget, saved: Saved): WorkspacesAnswer {
    const names = [DEFAULT_WORKSPACE];
    for (const one of saved.workspaces) if (!names.includes(one.name)) names.push(one.name);
    return {
        current: saved.current,
        workspaces: names.map((name) => ({
            name,
            roots: workspaceRoots(into.fixed, saved, name)
        })),
        dropped: saved.dropped
    };
}

/**
 * GET /api/fs: one of five reads, chosen by what the query names. `bookmarks` answers the reader's
 * own bookmarks and their schema, `notes` every scratch note, `note` one note's own text, a root
 * and a path the entries of that directory (with `hidden=1` and `ignored=1` asking for what the
 * tree leaves out by default), and nothing at all the workspaces.
 *
 * A read, so it carries no token; it is still refused to another origin, since any page open in the
 * browser can address this server. One file is read, whichever answer is given.
 */
export function handleFs(request: Request, into: FsTarget): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'origin' });
    }
    const url = new URL(request.url);
    if (url.searchParams.get('bookmarks') !== null) return json(200, readBookmarks(into.bookmarks));
    if (url.searchParams.get('notes') !== null) return json(200, { notes: listNotes(into.notes) });
    const one = url.searchParams.get('note');
    if (one !== null) {
        const note = readNote(into.notes, one);
        return note === null ? json(404, { error: 'no-such-note' }) : json(200, note);
    }
    const key = url.searchParams.get('root') ?? '';
    const path = url.searchParams.get('path') ?? '';
    const saved = readSaved(into.file, reservedKeys(into.fixed));
    if (key === '') return json(200, workspacesAnswer(into, saved));
    const roots = [...into.fixed, ...addedRoots(into.fixed, saved)];
    const found = listShown(roots, key, path, shownOf(url.searchParams), into.ignored);
    if ('error' in found) return json(404, { error: found.error });
    return json(200, { root: key, path, entries: found.entries });
}

/** Every action POST /api/fs knows. */
export const ACTIONS = [
    'add-root',
    'remove-root',
    'save-workspace',
    'select-workspace',
    'note-save',
    'note-delete'
];

/**
 * The workspace a write lands in. The default workspace holds no roots of its own until one is
 * added, at which point it is saved under its own empty name; the picker draws it once either way.
 */
function currentOf(saved: Saved): SavedWorkspace {
    const held = saved.workspaces.find((one) => one.name === saved.current);
    if (held !== undefined) return held;
    const made: SavedWorkspace = { name: saved.current, roots: [] };
    saved.workspaces.push(made);
    return made;
}

/** Write the file and say what changed, in the shape every other write endpoint answers in. */
function written(saved: Saved, into: FsTarget): Response {
    writeSaved(into.file, saved);
    return json(200, { ok: true, changed: ['workspaces'], refused: [] });
}

/** Add the folder the body names to the workspace in force, under a key taken from its own name. */
function addRoot(saved: Saved, fields: Record<string, unknown>, into: FsTarget): Response {
    const typed = text(fields.dir).trim();
    if (typed === '') return json(400, { error: 'no-dir' });
    const expanded = expandHome(typed);
    if (!isAbsolute(expanded)) return json(400, { error: 'not-absolute' });
    const dir = real(expanded);
    if (dir === null) return json(400, { error: 'no-such-dir' });
    let directory: boolean;
    try {
        directory = statSync(dir).isDirectory();
    } catch {
        return json(400, { error: 'no-such-dir' });
    }
    if (!directory) return json(400, { error: 'not-a-directory' });
    const held = [...into.fixed, ...addedRoots(into.fixed, saved)];
    // The real paths are compared, so the same folder reached through a trailing slash or a link is
    // the root it already is rather than a second root under a second key.
    if (held.some((one) => real(one.dir) === dir)) return json(400, { error: 'root-held' });
    const workspace = currentOf(saved);
    const taken = [...held.map((one) => one.key), ...workspace.roots.map((one) => one.key)];
    workspace.roots.push({ key: rootKey(dir, taken), dir });
    return written(saved, into);
}

/** Take one reader-added root out of the workspace in force. A configured root is refused. */
function removeRoot(saved: Saved, fields: Record<string, unknown>, into: FsTarget): Response {
    const key = text(fields.key);
    if (into.fixed.some((one) => one.key === key)) return json(400, { error: 'root-fixed' });
    const workspace = currentOf(saved);
    const at = workspace.roots.findIndex((one) => one.key === key);
    if (at < 0) return json(400, { error: 'no-such-root' });
    workspace.roots.splice(at, 1);
    return written(saved, into);
}

/** Save the roots in force under a new name, and make that workspace the current one. */
function saveWorkspace(saved: Saved, fields: Record<string, unknown>, into: FsTarget): Response {
    const name = text(fields.name).trim();
    if (name === '') return json(400, { error: 'no-name' });
    if (saved.workspaces.some((one) => one.name === name)) return json(400, { error: 'name-held' });
    saved.workspaces.push({ name, roots: [...rootsOf(saved, saved.current)] });
    saved.current = name;
    return written(saved, into);
}

/** Put another saved workspace, or the default one, in force. */
function selectWorkspace(saved: Saved, fields: Record<string, unknown>, into: FsTarget): Response {
    const name = text(fields.name);
    if (name !== DEFAULT_WORKSPACE && !saved.workspaces.some((one) => one.name === name)) {
        return json(400, { error: 'no-such-workspace' });
    }
    saved.current = name;
    return written(saved, into);
}

/** Write one note, which is a file of its own rather than a change to the workspaces file. */
function writeNote(fields: Record<string, unknown>, into: FsTarget): Response {
    const id = text(fields.id).trim();
    const row = saveNote(into.notes, id, text(fields.title), text(fields.body));
    if (row === null) return json(400, { error: 'no-such-note' });
    return json(200, { ok: true, changed: ['note'], refused: [], note: row });
}

/** Take one note off the disk. */
function removeNote(fields: Record<string, unknown>, into: FsTarget): Response {
    const id = text(fields.id).trim();
    if (!deleteNote(into.notes, id)) return json(400, { error: 'no-such-note' });
    return json(200, { ok: true, changed: ['note'], refused: [] });
}

/**
 * One action, read and written behind the process's chain so no change is lost to another's write.
 */
function act(action: string, fields: Record<string, unknown>, into: FsTarget): Response {
    if (action === 'note-save') return writeNote(fields, into);
    if (action === 'note-delete') return removeNote(fields, into);
    const saved = readSaved(into.file, reservedKeys(into.fixed));
    if (action === 'add-root') return addRoot(saved, fields, into);
    if (action === 'remove-root') return removeRoot(saved, fields, into);
    if (action === 'save-workspace') return saveWorkspace(saved, fields, into);
    return selectWorkspace(saved, fields, into);
}

/**
 * POST /api/fs: one action on the workspaces file. The order is the order of the refusals: the
 * origin, the token, the body, the action, and only then the file.
 */
export async function handleFsWrite(
    request: Request,
    token: string,
    into: FsTarget
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'origin' });
    }
    if (!hasToken(request, token)) return json(403, { error: 'token' });
    let body: unknown;
    try {
        body = (await request.json()) as unknown;
    } catch {
        return json(400, { error: 'not-json' });
    }
    if (!isMap(body)) return json(400, { error: 'not-an-action' });
    const action = text(body.action);
    if (!ACTIONS.includes(action)) return json(400, { error: 'not-an-action' });
    const fields = body;
    // Whichever request got here first finishes its read, its change and its write before the next
    // one starts its read, so two adds in flight are two roots and never one.
    return chained(into.writes, () => act(action, fields, into));
}
