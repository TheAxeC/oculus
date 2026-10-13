// Layer 2, server. The file browser's server concerns: the entries of one directory under a named
// folder of the open workspace, the workspace itself (its folders, primary, recent list and the
// files that can be switched to), and the two things the reader keeps beside them, their own
// bookmarks and their scratch notes.
//
// The bookmarks and the notes are read here and written through this route because they are the
// file browser's: a bookmark is a file, a folder or the top of a folder of the workspace and a note
// is a file in a folder. What each one is kept in is its own module, fs/bookmarks.ts and
// fs/notes.ts; a bookmark is written by the collection write path instead, since it is a collection
// file and the entry writers edit it. Both live in the primary hub's `.oculus` folder, so a
// workspace with no primary has none: the lists answer empty and a write is refused `no-primary`.
//
// A listing is one level deep and read at the call. The tree asks for a folder when the folder is
// opened, so nothing walks a root: a home directory with a hundred thousand files under it costs
// one readdir of whatever folder is on screen. Dotfiles and the three build folders are left out
// unless the request carries `hidden=1`, because a tree that is mostly node_modules is a tree
// nobody reads; every entry git ignores is left out unless it carries `ignored=1`, read by
// server/core/git/files.ts's ignoredIn, the module of the read-only git forms this server runs. The
// two are the reader's own toggles on the tab, so the same folder is listed either way on request.
// The file route still serves what a listing leaves out, since what is served and what is offered
// are different questions. A symbolic link is resolved and then listed as the kind its target is,
// under the same rule the file route serves one by: inside the root it is an ordinary entry, and
// pointing out of the root it is left out.
//
// The workspace is the open workspace file of server/files/workspace and nothing else: a GET with
// no root answers it, and the actions on it as a whole are Save Workspace As (`save-workspace`, a
// name), New Workspace (`new-workspace`, a name), Switch Workspace (`select-workspace`, a workspace
// file's path) and Close Workspace (`close-workspace`). The folders of the open file are written
// through the write route's `roots` kind. The notes are written in a new order through the same
// route (`order-notes`).
//
// Nothing here holds state between calls: the workspace, the paths of the bookmarks and the notes
// and the write chain all come in from the request's ServerContext, so two servers in one process
// read two workspaces.
//
// Whether a path lies in a folder and where a path really is are read from server/core/paths.ts
// (`inside`, `realPath`).

import { json } from '@sveltejs/kit';
import { lstatSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { z } from 'zod';
import { isMap } from '../../data/helpers/guards.ts';
import { configDir } from '../../data/sources/config/folder.ts';
import { tokenedBody } from '../core/auth.ts';
import { resolveRootPath, type Root } from './files.ts';
import { readBookmarks } from './fs/bookmarks.ts';
import { ignoredIn } from '../core/git/files.ts';
import { deleteNote, listNotes, readNote, saveNote, writeNoteOrder } from './fs/notes.ts';
import { chained, type FsWrites } from '../core/json.ts';
import { foldsCase, inside, realPath } from '../core/paths.ts';
import {
    closeWorkspace,
    newWorkspace,
    saveWorkspaceAs,
    selectWorkspace
} from './workspace/actions.ts';
import type { OpenWorkspace } from './workspace/open.ts';

/**
 * One entry of one directory, as the tree draws it. `link` is true for a symbolic link, whose
 * `kind` is that of what it points at, and is absent for anything else.
 */
export type Entry = {
    name: string;
    kind: 'file' | 'dir';
    size: number;
    mtime: number;
    link?: true;
    /** True for an entry git ignores, listed because the request asked for those too. */
    ignored?: true;
};

/**
 * A folder of the workspace as the answer carries it: `path` is the path as the workspace file
 * writes it, `dir` the same with `~` expanded, `real` the folder with every symlink resolved (empty
 * for a folder that does not exist), which the page compares with the real path of a repository
 * (`repositoryOf`), and `folds` marks a folder whose file system reads a path in another letter
 * case as the same path, which the page compares private folders by (`isPrivateFile`).
 */
type AnsweredFolder = {
    name: string;
    path: string;
    dir: string;
    real: string;
    hub: boolean;
    folds?: true;
};

/** What a GET with no root answers: the open workspace and the files the switcher offers. */
export type WorkspacesAnswer = {
    /** The home folder of the account the server runs as, which the page writes as `~`. */
    home: string;
    /** The open workspace file, or null while the workspace is unsaved. */
    open: { path: string; name: string; hub: string; real: string } | null;
    folders: AnsweredFolder[];
    primary: string | null;
    /**
     * Where oculus's own `config/` folder lies among the folders: the name of the folder holding it
     * and its path under that folder, or null when no folder holds it.
     */
    engine: { root: string; path: string } | null;
    recent: { path: string; name: string; hub: string; missing: boolean }[];
    available: { path: string; name: string; hub: string }[];
    /**
     * What the Settings view's "This machine" section shows of the machine's `local.yml` files: the
     * names of the keys the primary hub's file sets, the default of each key that has one, and the
     * value each key has in force.
     */
    machine: MachineAnswer;
};

/**
 * The names of the keys the primary's `local.yml` sets, the default text by key, the text of the
 * value in force by key (one line for each row of a joined list), and the hubs whose files set each
 * joined list.
 */
type MachineAnswer = {
    set: readonly string[];
    defaults: Record<string, string>;
    values: Record<string, string>;
    hubs: Record<string, string[]>;
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
 * same entries was asked within IGNORED_REUSE_MS of the moment its answer came. An entry added or
 * removed since makes the key differ, so an answer is never reused for a listing it was not given.
 * Two listings of one folder asked at once may each ask git; the event loop is free while git
 * answers.
 */
export async function cachedIgnored(
    cache: IgnoredCache,
    folder: string,
    names: string[],
    ask: (folder: string, names: string[]) => Promise<Set<string>> = ignoredIn,
    now: () => number = Date.now
): Promise<Set<string>> {
    const key = `${folder}\0${names.join('\0')}`;
    const held = cache.held.get(key);
    if (held !== undefined && now() - held.at < IGNORED_REUSE_MS) return held.ignored;
    const ignored = await ask(folder, names);
    const at = now();
    for (const [one, entry] of cache.held) {
        if (at - entry.at >= IGNORED_REUSE_MS) cache.held.delete(one);
    }
    cache.held.set(key, { at, ignored });
    return ignored;
}

/**
 * What one request needs: the open workspace, the primary hub's bookmarks file and notes folder
 * (null while the workspace has no primary), the chain and the ignored-names cache.
 */
export type FsTarget = {
    /** The folder of oculus itself. */
    engine: string;
    /** The open workspace, as the server holds it. */
    workspace: { open(): OpenWorkspace; stateFolder: string };
    /** What the machine's `local.yml` files set, by name, the defaults and the values in force. */
    machine: MachineAnswer;
    /** The reader's own bookmarks file, which this request reads and the write path writes. */
    bookmarks: string | null;
    /** The folder the scratch notes live in. */
    notes: string | null;
    /** The process's write chain. */
    writes: FsWrites;
    /** The ignored names asked for lately, which listings reuse for a moment. */
    ignored: IgnoredCache;
};

/**
 * Whether a name is one the tree leaves out unless hidden files are asked for: a dotfile, or one
 * of the three build folders.
 */
export function skipped(name: string): boolean {
    return name.startsWith('.') || SKIPPED.includes(name);
}

/**
 * One entry of a listing, or null for one that is not there or is not a file or a folder. A link is
 * followed here, so what the tree shows is what opening the entry will give.
 */
function described(dir: string, name: string): Entry | null {
    try {
        const path = join(dir, name);
        const stat = statSync(path);
        const link = lstatSync(path).isSymbolicLink() ? ({ link: true } as const) : {};
        if (stat.isDirectory()) return { name, kind: 'dir', size: 0, mtime: stat.mtimeMs, ...link };
        if (!stat.isFile()) return null;
        return { name, kind: 'file', size: stat.size, mtime: stat.mtimeMs, ...link };
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
    const dir = root === undefined ? null : realPath(root.dir);
    if (dir === null) return { error: 'outside' };
    let entries: Entry[];
    try {
        if (!statSync(found.path).isDirectory()) return { error: 'missing' };
        entries = readdirSync(found.path, { withFileTypes: true })
            .filter((entry) => hidden || !skipped(entry.name))
            .filter((entry) => {
                if (!entry.isSymbolicLink()) return true;
                const target = realPath(join(found.path, entry.name));
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
 * there unless the request asks for those too, in which case each of them carries `ignored: true`.
 */
export async function listShown(
    list: Root[],
    key: string,
    path: string,
    shown: Shown = DEFAULT_SHOWN,
    cache: IgnoredCache = ignoredCache()
): Promise<{ entries: Entry[] } | { error: 'outside' | 'missing' }> {
    const found = listDir(list, key, path, shown.hidden);
    if ('error' in found) return found;
    const ignored = await cachedIgnored(
        cache,
        found.at,
        found.entries.map((one) => one.name)
    );
    if (!shown.ignored) return { entries: found.entries.filter((one) => !ignored.has(one.name)) };
    return {
        entries: found.entries.map((one) =>
            ignored.has(one.name) ? { ...one, ignored: true } : one
        )
    };
}

/** What a listing request asks to see, from its query: `hidden=1` and `ignored=1`, each alone. */
export function shownOf(query: URLSearchParams): Shown {
    return { hidden: query.get('hidden') === '1', ignored: query.get('ignored') === '1' };
}

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** A text field of a write body: the text as it came, and the empty text for anything else. */
const textShape = z.string().catch('');

/**
 * The folder of the workspace that holds oculus's own `config/` folder, found by real paths, and
 * the path of `config/` under it. The innermost folder wins when several hold it.
 */
function configPlace(open: OpenWorkspace, engine: string): { root: string; path: string } | null {
    const config = realPath(configDir(engine));
    if (config === null) return null;
    let best: { root: string; path: string } | null = null;
    let depth = -1;
    for (const one of open.folders) {
        const base = realPath(one.dir);
        if (base === null || !inside(config, base) || base.length <= depth) continue;
        best = { root: one.name, path: relative(base, config) };
        depth = base.length;
    }
    return best;
}

/**
 * The answer a GET with no root gives: the open workspace and the files that can be switched to.
 */
export function workspacesAnswer(
    open: OpenWorkspace,
    engine: string,
    machine: MachineAnswer
): WorkspacesAnswer {
    return {
        home: homedir(),
        open:
            open.file === null
                ? null
                : {
                      path: open.file,
                      name: open.name,
                      hub: open.hub,
                      real: realPath(open.file) ?? open.file
                  },
        folders: open.folders.map((one) => ({
            name: one.name,
            path: one.path,
            dir: one.dir,
            real: realPath(one.dir) ?? '',
            hub: one.hub,
            ...(foldsCase(one.dir) ? { folds: true as const } : {})
        })),
        primary: open.primary,
        engine: configPlace(open, engine),
        recent: open.recent,
        available: open.available,
        machine
    };
}

/**
 * GET /api/fs: one of five reads, chosen by what the query names. `bookmarks` answers the reader's
 * own bookmarks, `notes` every scratch note, `note` one note's own text, a root and a path the
 * entries of that directory (with `hidden=1` and `ignored=1` asking for what the tree leaves out by
 * default), and nothing at all the workspace.
 *
 * A read, so it carries no token; the origin guard in src/hooks.server.ts still refuses it to
 * another origin, since any page open in the browser can address this server.
 */
export async function handleFs(request: Request, into: FsTarget): Promise<Response> {
    const url = new URL(request.url);
    const open = into.workspace.open();
    if (url.searchParams.get('bookmarks') !== null) {
        return json(
            into.bookmarks === null ? { entries: [] } : readBookmarks(into.bookmarks, open.roots),
            { headers: NO_STORE }
        );
    }
    if (url.searchParams.get('notes') !== null) {
        return json(
            { notes: into.notes === null ? [] : listNotes(into.notes) },
            { headers: NO_STORE }
        );
    }
    const one = url.searchParams.get('note');
    if (one !== null) {
        const note = into.notes === null ? null : readNote(into.notes, one);
        return note === null
            ? json({ error: 'no-such-note' }, { status: 404, headers: NO_STORE })
            : json(note, { headers: NO_STORE });
    }
    const key = url.searchParams.get('root') ?? '';
    const path = url.searchParams.get('path') ?? '';
    if (key === '')
        return json(workspacesAnswer(open, into.engine, into.machine), { headers: NO_STORE });
    const found = await listShown(open.roots, key, path, shownOf(url.searchParams), into.ignored);
    if ('error' in found) return json({ error: found.error }, { status: 404, headers: NO_STORE });
    return json({ root: key, path, entries: found.entries }, { headers: NO_STORE });
}

/** Every action POST /api/fs knows. */
export const ACTIONS = [
    'save-workspace',
    'new-workspace',
    'close-workspace',
    'select-workspace',
    'note-save',
    'note-delete',
    'order-notes'
] as const;

/**
 * A write body: one of the actions, and the fields the actions read, each the text it came as and
 * the empty text for anything else. A body naming no action is refused as a body that is no map is.
 */
const fsBodyShape = z.object({
    action: z.enum(ACTIONS),
    path: textShape,
    name: textShape,
    id: textShape,
    title: textShape,
    body: textShape,
    ids: z.array(z.string()).catch([])
});

type FsFields = z.output<typeof fsBodyShape>;

/**
 * The answer of a workspace action: done, or the word refusing it and the reason when there is one.
 */
function actionAnswer(
    outcome: { ok: true; file?: string } | { error: string; reason?: string }
): Response {
    if ('error' in outcome) {
        return json(
            {
                error: outcome.error,
                ...(outcome.reason === undefined ? {} : { reason: outcome.reason })
            },
            { status: 400, headers: NO_STORE }
        );
    }
    return json(
        {
            ok: true,
            changed: ['workspaces'],
            refused: [],
            ...(outcome.file === undefined ? {} : { file: realPath(outcome.file) ?? outcome.file })
        },
        { headers: NO_STORE }
    );
}

/** Write one note, which is a file of its own rather than a change to the workspace. */
function writeNote(fields: FsFields, notes: string | null): Response {
    if (notes === null) return json({ error: 'no-primary' }, { status: 400, headers: NO_STORE });
    const id = fields.id.trim();
    const row = saveNote(notes, id, fields.title, fields.body);
    if (row === null) return json({ error: 'no-such-note' }, { status: 400, headers: NO_STORE });
    return json({ ok: true, changed: ['note'], refused: [], note: row }, { headers: NO_STORE });
}

/** Take one note off the disk. */
function removeNote(fields: FsFields, notes: string | null): Response {
    if (notes === null) return json({ error: 'no-primary' }, { status: 400, headers: NO_STORE });
    const id = fields.id.trim();
    if (!deleteNote(notes, id))
        return json({ error: 'no-such-note' }, { status: 400, headers: NO_STORE });
    return json({ ok: true, changed: ['note'], refused: [] }, { headers: NO_STORE });
}

/** Write the order the notes are listed in. */
function orderNotes(fields: FsFields, notes: string | null): Response {
    if (notes === null) return json({ error: 'no-primary' }, { status: 400, headers: NO_STORE });
    const refused = writeNoteOrder(notes, fields.ids);
    if (refused !== null) return json({ error: refused }, { status: 400, headers: NO_STORE });
    return json({ ok: true, changed: ['note'], refused: [] }, { headers: NO_STORE });
}

/**
 * One action, read and written behind the process's chain so no change is lost to another's write.
 */
function act(fields: FsFields, into: FsTarget): Response {
    const action = fields.action;
    if (action === 'note-save') return writeNote(fields, into.notes);
    if (action === 'note-delete') return removeNote(fields, into.notes);
    if (action === 'order-notes') return orderNotes(fields, into.notes);
    if (action === 'save-workspace') {
        return actionAnswer(saveWorkspaceAs(into.workspace.stateFolder, fields.name));
    }
    if (action === 'new-workspace') {
        return actionAnswer(newWorkspace(into.workspace.stateFolder, fields.name));
    }
    if (action === 'close-workspace') {
        return actionAnswer(closeWorkspace(into.workspace.stateFolder));
    }
    return actionAnswer(selectWorkspace(into.workspace.stateFolder, fields.path));
}

/**
 * POST /api/fs: one action on the workspace or the notes. The order is the order of the refusals:
 * the token, the body, the action, and only then the files.
 */
export async function handleFsWrite(
    request: Request,
    token: string,
    into: FsTarget
): Promise<Response> {
    const read = await tokenedBody(request, token, {
        headers: NO_STORE,
        words: { token: 'token', json: 'not-json' }
    });
    if (read instanceof Response) return read;
    const body = fsBodyShape.safeParse(read.body);
    if (!isMap(read.body) || !body.success) {
        return json({ error: 'not-an-action' }, { status: 400, headers: NO_STORE });
    }
    const fields = body.data;
    // Whichever request got here first finishes its read, its change and its write before the next
    // one starts its read, so two actions in flight never lose one another's change.
    return chained(into.writes, () => act(fields, into));
}
