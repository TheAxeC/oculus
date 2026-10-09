// Layer 2, server. The paths a language server asks its client to watch one by one: a Markdown
// server asks for a watcher of each file and folder its links lead to, by an id, and is told each
// create, change and delete under it with that id. One recursive watch of the root (watch.ts)
// serves every id; its changes are matched to the ids by path.
//
// A change is told to an id when it is the followed path, lies under it (a followed folder), or is
// a folder the followed path lies in when the id asked for its parents, which is how a link to a
// file in a folder that does not exist yet hears of the folder being made. An id that is followed
// again is replaced, and an id that is not followed is told nothing.

import type { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative, sep } from 'node:path';
import type { ChangeKind } from '../../servers.ts';
import { normal } from '../../uris.ts';
import { RootWatch, kindOf, type FileChange } from '../watch.ts';

/** What is asked of the server for a change of a followed path. */
type Notice = (real: string, kind: ChangeKind) => { method: string; params: unknown };

/** One followed path. */
type Follow = { real: string; parents: boolean; notice: Notice };

/** What the followed paths are told through. */
export type FollowedOptions = {
    root: string;
    /** Ask the server something it needs no answer to. */
    tell: (message: { method: string; params: unknown }) => void;
    watchFolder?: typeof watch;
};

/** Whether a path is another or lies under it, by their parts. */
function isUnder(path: string, folder: string): boolean {
    return path === folder || path.startsWith(folder === '' ? '' : folder + sep);
}

export class Followed {
    #options: FollowedOptions;
    #follows = new Map<string, Follow>();
    #watch: RootWatch;

    constructor(options: FollowedOptions) {
        this.#options = options;
        this.#watch = new RootWatch({
            root: options.root,
            open: () => false,
            changed: (changes) => this.changed(changes),
            watchFolder: options.watchFolder
        });
    }

    /** Follow a path under an id, in place of what the id followed. */
    follow(id: string, real: string, parents: boolean, notice: Notice): void {
        this.#follows.set(id, { real, parents, notice });
        const own = normal(relative(this.#options.root, real));
        this.#watch.registerMatch(
            id,
            (path) => isUnder(path, own) || (parents && isUnder(own, path))
        );
    }

    /** Stop following the paths of an id. */
    unfollow(id: string): void {
        if (!this.#follows.delete(id)) return;
        this.#watch.unregister(id);
    }

    /** Tell every id that follows a changed path. */
    changed(changes: readonly FileChange[]): void {
        for (const { uri, type } of changes) this.told(fileURLToPath(uri), kindOf(type));
    }

    /** Tell every id that follows a changed path, by its real path. */
    told(real: string, kind: ChangeKind): void {
        const path = normal(real);
        for (const follow of this.#follows.values()) {
            const own = normal(follow.real);
            if (isUnder(path, own) || (follow.parents && isUnder(own, path))) {
                this.#options.tell(follow.notice(real, kind));
            }
        }
    }

    /** Stop every watch. */
    close(): void {
        this.#follows.clear();
        this.#watch.close();
    }
}
