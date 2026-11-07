// Layer 1, data. The store of folder-glob matches: what the walk of one `find.folders` pattern
// under one folder found, kept so the hub is walked once per pattern rather than at every deck
// read. Server side only: it reads the filesystem and no client module may import it.
//
// A deck group finds its members by globs walked under the root the deck is in (deck/read.ts
// `under`), and a walk of the real hub enters every project's `code/` and `attic/` folders, which
// costs about a second. The store holds, by the key `<folder>\n<pattern>`, the strings the walk
// answered and nothing a reader makes of them: each reader resolves every match inside its root,
// raises its own finding for a match that leaves it, and tests each matched folder for its
// `present.yml` at every read, so a deck file added to or removed from a matched folder is seen
// with no drop. What does change the matches, a folder made, moved or removed under the pattern,
// drops the key: the portfolio watcher does so at the event that says it, by the drop rule of
// server/root/watch/portfolio/glob-drop.ts run in the watches of glob-watch.ts, and a deck act that
// makes or removes a deck folder does so in the call that does it
// (server/edit/writes/config/lists/deck/deck-new.ts and deck-undo.ts), since the page reads the
// deck at once after the act's answer.
//
// The store is a value its owner makes and passes. The server context holds one for the process,
// which the snapshot build, the deck route and the deck writes all read through; a reader made with
// no server in hand (a check, a test) makes its own, which reads as one walk per store. The factory
// takes the walk, `globSync` unless a test counts its runs, and a listener called with each key the
// store takes, which the watcher opens a watch for.

import { globSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { realOf } from '../deck/files.ts';

/** A walk of one pattern under a folder, answering the matches relative to it. */
export type Walk = (pattern: string, options: { cwd: string }) => string[];

/** One key the store holds, with what is needed to tell which events change its matches. */
export type HeldGlob = {
    /** `<root>\n<pattern>`. */
    key: string;
    /** The folder the pattern is walked under, as the reader named it. */
    root: string;
    /** The real path of `root` when the key was taken, null when it was not there. */
    real: string | null;
    pattern: string;
    /**
     * The segments of the pattern before the first that holds a glob character, and never its last
     * segment, joined with `/`: the folder under the root every match lies in. Empty for a pattern
     * that starts with `**`, whose matches may lie anywhere under the root.
     */
    fixed: string;
    /** The matches of the walk, relative to the root, as the walk answered them. */
    matches: readonly string[];
};

/** The store: the matches of a key, the keys it holds, and the drop of one. */
export type FolderGlobs = {
    /** The matches of `pattern` under `root`, from the store, or walked and kept on a miss. */
    matches: (root: string, pattern: string) => readonly string[];
    /** Every key the store holds now. */
    held: () => HeldGlob[];
    /** Forget one key, so the next read of it walks again. */
    drop: (key: string) => void;
};

/** The characters that make a segment of a pattern a glob rather than a name. */
const GLOB = /[*?[\]{}()!+@]/;

/** Whether a segment of a pattern holds a glob character, so it matches names other than itself. */
export function isGlob(segment: string): boolean {
    return GLOB.test(segment);
}

/** The folder part of a pattern every match lies under (`HeldGlob.fixed`). */
function fixedPart(pattern: string): string {
    const segments = pattern.split(/[\\/]/).filter((one) => one !== '' && one !== '.');
    const first = segments.findIndex(isGlob);
    const end = first < 0 ? segments.length - 1 : Math.min(first, segments.length - 1);
    return segments.slice(0, Math.max(end, 0)).join('/');
}

/** A store of folder-glob matches over `walk`, calling `taken` with each key it takes. */
export function folderGlobs(
    options: { walk?: Walk; taken?: (glob: HeldGlob) => void } = {}
): FolderGlobs {
    const walk: Walk = options.walk ?? ((pattern, at) => globSync(pattern, at));
    const held = new Map<string, HeldGlob>();
    return {
        matches: (root, pattern) => {
            const key = `${root}\n${pattern}`;
            const found = held.get(key);
            if (found !== undefined) return found.matches;
            const glob: HeldGlob = {
                key,
                root,
                real: realOf(root),
                pattern,
                fixed: fixedPart(pattern),
                matches: Object.freeze([...walk(pattern, { cwd: root })])
            };
            held.set(key, glob);
            options.taken?.(glob);
            return glob.matches;
        },
        held: () => [...held.values()],
        drop: (key) => {
            held.delete(key);
        }
    };
}

/** The path below `dir`, with `/` separators, when `path` is `dir` or lies under it; else null. */
function below(dir: string, path: string): string | null {
    const within = relative(dir, path);
    if (within.startsWith('..') || isAbsolute(within)) return null;
    return sep === '/' ? within : within.split(sep).join('/');
}

/**
 * Where an absolute path lies under a key's root, with `/` separators, when it lies inside the
 * folder of the key's fixed part, under the root as the reader named it or under its real path;
 * else null.
 */
export function placeIn(glob: HeldGlob, path: string): string | null {
    for (const root of glob.real === null ? [glob.root] : [glob.root, glob.real]) {
        if (below(join(root, glob.fixed), path) === null) continue;
        return below(root, path);
    }
    return null;
}

/**
 * Drop every key whose fixed folder holds one of `paths`, absolute paths a write made or removed:
 * the deck acts' drop, made after the write so a read between the two cannot keep the old matches.
 */
export function dropUnder(globs: FolderGlobs, paths: readonly string[]): void {
    for (const glob of globs.held()) {
        if (paths.some((path) => placeIn(glob, path) !== null)) globs.drop(glob.key);
    }
}
