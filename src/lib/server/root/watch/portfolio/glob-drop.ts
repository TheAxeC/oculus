// Layer 2, server. The drop rule of the store of folder-glob matches
// (data/sources/documents/folder-globs.ts): which keys one watch event drops, and whether it is a
// project folder moved under a scan folder, which rebuilds the snapshot. The watches that run the
// rule are in glob-watch.ts.
//
// A key's matches change when a folder is made, moved or removed under the folder of its fixed
// part, so the drop rule (`droppedKeys`) takes a `rename` event under that folder whose path is a
// folder now, or is gone and was a match or the folder of one, or whose last name is the pattern's
// last segment: that name itself for a segment with no glob character, and for a segment holding
// one only `present.yml` when the segment matches it, since a matched file is a deck only by that
// name. A save drops a key only when the file it renames into place is named by the pattern's last
// segment, as a `present.yml` saved under `projects/*/present.yml` or `slides/*` is: oculus writes
// a file through a temporary name renamed over it, and the temporary name is gone and no match,
// while a slide file renamed into place is no folder and no last segment names it. A `change` event
// never drops, and neither does a path inside a project's `code/` or `attic/` folder (audited.ts
// `NEVER`), which the build never reads and where no deck lies, nor a path inside a dot folder the
// pattern does not name, which Node's `globSync` does not enter (a run of Node 24's
// `globSync('projects/**/present')` over a tree holding `projects/.hidden/b/present` answers only
// the matches outside it; its documentation says nothing of dot folders).
//
// A rename under a scan folder rebuilds the snapshot (`movedFolder`) only when the set of projects
// can change: its path is a folder now that lies inside no project folder of the last snapshot and
// is a project or holds one below it as the scan walks (a filing folder of projects among them), or
// it is gone and was a project folder the last snapshot names, the folder above one, or a held
// key's match or the folder above one. A folder made inside a project, a run's results or a figures
// folder, queues no rebuild, since the scan stops at a project. The scan walks no dot folder
// (data/sources/manifests.ts), so a path inside one queues none either. A folder event names no
// `.yml`, so the file filter of the watcher takes none.

import { isAbsolute, join, matchesGlob, relative } from 'node:path';
import { DECK_FILE } from '../../../../data/sources/deck/read.ts';
import { isGlob, placeIn, type HeldGlob } from '../../../../data/sources/documents/folder-globs.ts';
import { NEVER } from './audited.ts';

/** What a path an event names is now. */
export type PathNow = 'folder' | 'file' | 'gone';

/**
 * One watch event: its type, the folder of the watch and the path under it the event names, and two
 * looks at the path now, each asked only when the rule needs it: what it is, and whether it is a
 * project folder or holds one below it as the scan walks.
 */
export type GlobEvent = {
    type: string;
    root: string;
    path: string;
    now: () => PathNow;
    manifest: () => boolean;
};

/** The segments of a `/` path. */
function segmentsOf(path: string): string[] {
    return path.split('/').filter((one) => one !== '');
}

/** Whether a path inside a key's root is one whose event can change the key's matches. */
function heardBy(glob: HeldGlob, under: string): boolean {
    const parts = segmentsOf(under);
    if (parts.some((one) => NEVER.includes(one))) return false;
    const dotted = segmentsOf(glob.pattern).some((one) => one.startsWith('.'));
    return dotted || !parts.some((one) => one.startsWith('.'));
}

/** Whether `under` is one of the key's matches or the folder of one. */
function wasMatch(glob: HeldGlob, under: string): boolean {
    return glob.matches.some((one) => {
        const match = segmentsOf(one.split('\\').join('/')).join('/');
        return match === under || match.startsWith(`${under}/`);
    });
}

/**
 * Whether a name is the last segment of a pattern: the segment itself, or, for a segment holding a
 * glob character, a `present.yml` the segment matches.
 */
function namedBy(name: string, last: string): boolean {
    if (!isGlob(last)) return name === last;
    return name === DECK_FILE && matchesGlob(name, last);
}

/** The keys of `held` one watch event drops. */
export function droppedKeys(event: GlobEvent, held: readonly HeldGlob[]): string[] {
    if (event.type !== 'rename') return [];
    const path = join(event.root, event.path);
    return held.flatMap((glob) => {
        const under = placeIn(glob, path);
        if (under === null || under === '' || !heardBy(glob, under)) return [];
        const last = segmentsOf(glob.pattern).at(-1) ?? '';
        const name = segmentsOf(under).at(-1) ?? '';
        if (namedBy(name, last)) return [glob.key];
        const state = event.now();
        if (state === 'folder') return [glob.key];
        return state === 'gone' && wasMatch(glob, under) ? [glob.key] : [];
    });
}

/** Whether the folder `dir` is the folder `path` or lies inside it. */
function within(path: string, dir: string): boolean {
    const rest = relative(path, dir);
    return rest === '' || (!rest.startsWith('..') && !isAbsolute(rest));
}

/**
 * Whether a watch event is a project folder made, moved or removed under one of the scan folders
 * `scanned`, which rebuilds the snapshot: a `rename` outside `code/`, `attic/` and every dot folder
 * whose path is a folder now, inside none of the project folders `projects` of the last snapshot,
 * that is a project or holds one below it, or is gone and was one of those project folders or the
 * folder above one, or a match of a held key or the folder above one.
 */
export function movedFolder(
    event: GlobEvent,
    held: readonly HeldGlob[],
    scanned: readonly string[],
    projects: readonly string[]
): boolean {
    if (event.type !== 'rename') return false;
    const path = join(event.root, event.path);
    const below = scanned.flatMap((dir) => {
        const rest = relative(dir, path);
        return rest === '' || rest.startsWith('..') || isAbsolute(rest) ? [] : [rest];
    });
    const parts = below.length === 0 ? null : segmentsOf(below[0].split('\\').join('/'));
    if (parts === null || parts.some((one) => NEVER.includes(one) || one.startsWith('.'))) {
        return false;
    }
    const state = event.now();
    if (state === 'folder') {
        if (projects.some((dir) => dir !== path && within(dir, path))) return false;
        return event.manifest();
    }
    if (state !== 'gone') return false;
    if (projects.some((dir) => within(path, dir))) return true;
    return held.some((glob) => {
        const under = placeIn(glob, path);
        return under !== null && wasMatch(glob, under);
    });
}
