// Layer 1, data. What an app may name, and the path rules both halves of an app's reach apply. The
// server reads them when it reads a manifest, serves an app file, checks a write and answers an
// open; the page reads them before it sends any of those. One module holds them so the page's
// refusal and the server's refusal cannot disagree, and it imports no node module so the page can
// import it (the `state` row of the layer table names it).
//
// What it holds: the name pattern and the view id an app is known by, with the form the id takes in
// the `x-oculus-app` header; the channels an app may read and the ones closed to every app or to a
// root app; the write kinds an app may ask for, the ones it may not, and the ones that ask the
// reader first; the two rules a file path is judged by, the segment rule and the `closed_paths`
// match; the root a `files` entry names; and the rule of a secret's key and value.

import { joinPath, pathUnder } from './paths.ts';

/** The pattern an app's name matches. It holds neither `/` nor `@`, so the last `/` ends a root. */
export const APP_NAME = /^[a-z][a-z0-9-]{0,39}$/;

/** What every view id of an app starts with. */
const PREFIX = 'app:';

/** The view id of an app: `app:<name>` for a machine app and `app:<root key>/<name>` for a root's.
 * */
export function appViewId(root: string, name: string): string {
    return root === '' ? `${PREFIX}${name}` : `${PREFIX}${root}/${name}`;
}

/**
 * The address of an app up to and including its key, with the leading and trailing `/`: the root
 * key of a root app is percent-encoded, since it may hold a `/`.
 */
export function appAddress(root: string, name: string, key: string): string {
    const first = root === '' ? name : `@${encodeURIComponent(root)}/${name}`;
    return `/apps/${first}/${key}/`;
}

/** The root key and the name a view id carries, or null for text that is no app's view id. */
function splitAppViewId(id: string): { root: string; name: string } | null {
    if (!id.startsWith(PREFIX)) return null;
    const rest = id.slice(PREFIX.length);
    const at = rest.lastIndexOf('/');
    const name = at < 0 ? rest : rest.slice(at + 1);
    const root = at < 0 ? '' : rest.slice(0, at);
    if (!APP_NAME.test(name) || (at >= 0 && root === '')) return null;
    return { root, name };
}

/** The header an app's write carries its view id in, and the header that names the kind it sent. */
export const APP_HEADER = 'x-oculus-app';
export const KIND_HEADER = 'x-oculus-write-kind';

/**
 * A view id as the `x-oculus-app` header carries it: the root key percent-encoded as an address
 * encodes it, since a header value cannot carry every character a root key can.
 */
export function appHeaderValue(id: string): string {
    const parts = splitAppViewId(id);
    if (parts === null) return id;
    return parts.root === ''
        ? appViewId('', parts.name)
        : `${PREFIX}${encodeURIComponent(parts.root)}/${parts.name}`;
}

/** The view id a header value names, or null for a value with a malformed escape or no app. */
export function appViewIdFromHeader(value: string): string | null {
    if (!value.startsWith(PREFIX)) return null;
    const rest = value.slice(PREFIX.length);
    const at = rest.lastIndexOf('/');
    try {
        const root = at < 0 ? '' : decodeURIComponent(rest.slice(0, at));
        const id = appViewId(root, at < 0 ? rest : rest.slice(at + 1));
        return splitAppViewId(id) === null ? null : id;
    } catch {
        return null;
    }
}

/** The channels open to every app, each whole for a machine app. */
const READ_OPEN = ['portfolio', 'feeds', 'hpc', 'audit', 'config', 'git', 'files'] as const;

/** The channels open to a machine app and closed to a root app. */
const READ_MACHINE = ['inbox', 'calendar', 'sessions', 'usage'] as const;

/** The channels closed to every app, by the name the reason is kept under. */
const CLOSED_CHANNELS = ['apps', 'pty', 'processes', 'app-hosts', 'app-messages'] as const;
type ClosedChannel = (typeof CLOSED_CHANNELS)[number];

/**
 * How a channel name stands for an app: open to every app, open to a machine app alone, closed to
 * every app with the name its reason is kept under, or no channel the section names. A channel
 * added to oculus is `unknown` here, and so closed to apps, until it is named in this module.
 */
export type ChannelAccess =
    { access: 'open' | 'machine' | 'unknown' } | { access: 'closed'; carries: ClosedChannel };

export function channelAccess(name: string): ChannelAccess {
    if (READ_OPEN.some((one) => one === name)) return { access: 'open' };
    if (READ_MACHINE.some((one) => one === name)) return { access: 'machine' };
    if (name.startsWith('pty:')) return { access: 'closed', carries: 'pty' };
    const closed = CLOSED_CHANNELS.find((one) => one === name && one !== 'pty');
    return closed === undefined ? { access: 'unknown' } : { access: 'closed', carries: closed };
}

/** The write kinds an app may declare in `writes`; they edit the hub's data. */
const OPEN_WRITES = [
    'manifest',
    'entry',
    'subtask',
    'subtask-add',
    'host',
    'new-entry',
    'reorder',
    'delete-entry',
    'feed-field',
    'feed-delete',
    'lead-add',
    'radar-add',
    'linkedin-idea',
    'linkedin-post',
    'new-idea'
] as const;

/**
 * The names closed to every app: the kinds that take back, rewrite an engine file or edit the
 * machine's overrides, `app-store`, which every app is granted for its own store and cannot ask
 * for, and the write routes the page never sends an app's request to.
 */
const CLOSED_WRITES = [
    'undo',
    'rail',
    'audit-mute',
    'config-key',
    'config-value',
    'session',
    'deck-slides',
    'deck-edit',
    'roots',
    'app-store',
    'calendar',
    'connect',
    'mail',
    'memories',
    'fs',
    'open',
    'source',
    'deposit',
    'git',
    'hpc',
    'usage/refresh',
    'hook',
    'terminal'
] as const;

/** The open kinds that ask the reader in a confirmation, every time they are sent. */
export const CONFIRMED_WRITES: readonly string[] = [
    'delete-entry',
    'feed-delete',
    'new-idea',
    'linkedin-idea',
    'linkedin-post'
];

/** Whether a write kind is open to apps, closed to them, or no kind the section names. */
export function writeAccess(kind: string): 'open' | 'closed' | 'unknown' {
    if (OPEN_WRITES.some((one) => one === kind)) return 'open';
    return CLOSED_WRITES.some((one) => one === kind) ? 'closed' : 'unknown';
}

/**
 * The segment rule of a path an app names or asks for: no segment is empty, `.`, `..` or led by a
 * dot, and no backslash or NUL is anywhere. The text is the exact string given; nothing is decoded.
 */
export function pathSegmentsOpen(path: string): boolean {
    if (path.includes('\\') || path.includes('\0')) return false;
    return path.split('/').every((segment) => segment !== '' && !segment.startsWith('.'));
}

/** Whether an entry of `closed_paths` is a folder path of the segment rule's own shape. */
export function closedPathEntryOk(entry: string): boolean {
    return pathSegmentsOpen(entry);
}

/**
 * Whether a path under a root starts with a folder the list names, compared segment by segment and
 * without regard to letter case: `secrets/a.txt` and `SECRETS/a.txt` match `secrets`, while
 * `secrets-notes.md` and `a/secrets/b` do not.
 */
export function inClosedPaths(path: string, closed: readonly string[]): boolean {
    const parts = path.toLowerCase().split('/');
    return closed.some((folder) => {
        const names = folder.toLowerCase().split('/');
        return names.length <= parts.length && names.every((name, at) => parts[at] === name);
    });
}

/**
 * Whether a file of a root, found by the root's folder and the path under it, lies inside one of
 * the apps folders the `apps` channel names. The page tests the join of what it holds, and the file
 * route tests the real path the page cannot see.
 */
export function inAppsFolder(folders: readonly string[], dir: string, path: string): boolean {
    if (dir === '' || folders.length === 0) return false;
    const full = joinPath(dir, path);
    return folders.some((folder) => pathUnder(folder, full) !== null);
}

/**
 * The root and the path a `files` entry names: the longest key of the shown roots that the entry
 * equals or that is followed by `/` in it, and the rest of the entry as the path, empty for the
 * whole root. Null when no shown root is named; root keys are per workspace, so such an entry is
 * kept and reads as missing.
 */
function splitFilesEntry(
    entry: string,
    rootKeys: readonly string[]
): { root: string; path: string } | null {
    let best: string | null = null;
    for (const key of rootKeys) {
        const named = entry === key || entry.startsWith(`${key}/`);
        if (named && (best === null || key.length > best.length)) best = key;
    }
    return best === null ? null : { root: best, path: entry.slice(best.length + 1) };
}

/**
 * The root and the path a `files` entry names, an entry naming no shown root read as a root key up
 * to its first `/` and a path after it, so the entry still names a place that answers `missing`.
 */
export function filesPlace(
    entry: string,
    rootKeys: readonly string[]
): { root: string; path: string } {
    const shown = splitFilesEntry(entry, rootKeys);
    if (shown !== null) return shown;
    const slash = entry.indexOf('/');
    return slash < 0
        ? { root: entry, path: '' }
        : { root: entry.slice(0, slash), path: entry.slice(slash + 1) };
}

/**
 * Whether a path of a root lies in a folder a `files` entry lists: the entry's root is the root,
 * and the entry's path is empty or is the path or a folder above it, compared segment by segment.
 */
export function inFilesEntry(
    entry: string,
    rootKeys: readonly string[],
    root: string,
    path: string
): boolean {
    const place = filesPlace(entry, rootKeys);
    if (place.root !== root) return false;
    return place.path === '' || path === place.path || path.startsWith(`${place.path}/`);
}

/** The pattern a secret's key matches: 1 to 64 letters, digits, dots, underscores and hyphens. */
export const SECRET_KEY = /^[A-Za-z0-9._-]{1,64}$/;

/** The most bytes a secret's value may hold, as UTF-8. */
export const SECRET_MAX_BYTES = 2048;
