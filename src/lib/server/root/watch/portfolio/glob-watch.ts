// Layer 2, server. The portfolio watcher's half of the store of folder-glob matches
// (data/sources/documents/folder-globs.ts): the store the server owns, the handling of one watch
// event by the drop rule of glob-drop.ts, and the watches that make sure every held key is heard.
//
// The rule runs at the event, inside the callback of every recursive watch the watcher holds
// (portfolio.ts `open`) and of the watches here, before the debounce, so a deck read in the quiet
// before the rebuild already walks again; an event the rule names a project folder moved under a
// scan folder (`movedFolder`) also queues a rebuild.
//
// A key the store takes, at the snapshot build or at a deck read between two rebuilds, is heard
// from then on: a recursive watch is opened on the folder of its fixed part, or on the nearest
// folder above it that is there, unless a recursive watch of the watcher already covers that
// folder, under any root. The watches are closed with the watcher; a key dropped keeps its watch,
// since the next read takes the key again.

import { statSync, watch, type FSWatcher } from 'node:fs';
import { dirname, join } from 'node:path';
import {
    folderGlobs,
    type FolderGlobs,
    type HeldGlob
} from '../../../../data/sources/documents/folder-globs.ts';
import { holdsProject } from '../../../../data/sources/manifests.ts';
import { inside } from '../../../core/paths.ts';
import { droppedKeys, movedFolder, type GlobEvent, type PathNow } from './glob-drop.ts';

/** The store the watcher reads and drops, and how it is told of each key the store takes. */
export type GlobSource = {
    store: FolderGlobs;
    follow: (listener: (glob: HeldGlob) => void) => () => void;
};

/** What a path is now, by a stat that follows a link. */
function pathNow(path: string): PathNow {
    try {
        return statSync(path).isDirectory() ? 'folder' : 'file';
    } catch {
        return 'gone';
    }
}

/** The watches of the held keys, and the handling of one event of any recursive watch. */
export type GlobWatch = {
    /**
     * One event of a recursive watch of the folder `dir`: the keys it drops are dropped, and the
     * answer says whether it rebuilds the snapshot.
     */
    heard: (dir: string, type: string, filename: string) => boolean;
    /** Open the watch of every held key no recursive watch covers, a key taken earlier included. */
    follow: () => void;
    close: () => void;
};

/**
 * The watcher's handling of the store `source`: `covered` says whether a recursive watch of the
 * watcher's own holds a folder, `scanned` gives the scan folders of the last rebuild, `projects`
 * the folders of the projects its snapshot names, `never` the folders of a project the hubs'
 * settings leave out of the watch (audited.ts), as segments, and `queue` queues a rebuild.
 */
export function globWatch(options: {
    source: GlobSource;
    covered: (dir: string) => boolean;
    scanned: () => readonly string[];
    projects: () => readonly string[];
    never: () => readonly string[][];
    queue: () => void;
}): GlobWatch {
    const { source } = options;
    const own = new Map<string, FSWatcher>();
    let closed = false;

    const heard = (dir: string, type: string, filename: string): boolean => {
        const path = join(dir, filename);
        let now: PathNow | null = null;
        let manifest: boolean | null = null;
        const event: GlobEvent = {
            type,
            root: dir,
            path: filename,
            now: () => (now ??= pathNow(path)),
            manifest: () => (manifest ??= holdsProject(path))
        };
        const held = source.store.held();
        const never = options.never();
        const moved = movedFolder(event, held, options.scanned(), options.projects(), never);
        for (const key of droppedKeys(event, held, never)) source.store.drop(key);
        return moved;
    };

    const coveredHere = (dir: string): boolean =>
        options.covered(dir) || [...own.keys()].some((one) => inside(dir, one));

    /** The folder a key is heard through: its fixed folder, or the nearest one above it. */
    const folderOf = (glob: HeldGlob): string | null => {
        let dir = join(glob.root, glob.fixed);
        while (pathNow(dir) !== 'folder') {
            if (dir === glob.root || dirname(dir) === dir) return null;
            dir = dirname(dir);
        }
        return dir;
    };

    const take = (glob: HeldGlob): void => {
        if (closed) return;
        const dir = folderOf(glob);
        if (dir === null || coveredHere(dir)) return;
        try {
            const handle = watch(dir, { recursive: true }, (type, filename) => {
                if (typeof filename !== 'string' || closed) return;
                if (heard(dir, type, filename)) options.queue();
            });
            handle.on('error', () => {
                handle.close();
                own.delete(dir);
            });
            own.set(dir, handle);
        } catch {
            // A folder that cannot be watched is tried again at the next rebuild (`follow`).
        }
    };

    const unfollow = source.follow(take);
    return {
        heard,
        follow: () => {
            for (const glob of source.store.held()) take(glob);
        },
        close: () => {
            closed = true;
            unfollow();
            for (const handle of own.values()) handle.close();
            own.clear();
        }
    };
}

/** A store for the server, with the fan-out its watcher follows the taken keys through. */
export function globSource(): GlobSource {
    const listeners = new Set<(glob: HeldGlob) => void>();
    return {
        store: folderGlobs({
            taken: (glob) => {
                for (const listener of [...listeners]) listener(glob);
            }
        }),
        follow: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
}
