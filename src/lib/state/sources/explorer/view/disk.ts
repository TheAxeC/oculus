// Layer 2, client state, pure. What a `files` message says about the file browser's own reads:
// which served roots to read again whole, and which of their folders to list again. The git watcher
// publishes the root it watched and the folders written in it; a served root is concerned when the
// message's root is inside it or holds it, and the folders map onto the served root's own paths.
//
// A message with no `folders` says the whole root changed, so every served root it concerns is read
// again whole. A message whose `folders` is empty concerns nothing. A folder above a served root
// leaves what the root lists as it was, and a folder at or below the root's own top is listed
// again.

import { pathUnder } from '../../../../data/helpers/files/paths.ts';
import type { FilesPayload } from '../../../../data/model/index.ts';
import type { FsRoot } from '../../fs.ts';

/** What one message asks of the store: the roots to read whole and the folders to list again. */
export type DiskPlan = {
    /** The keys of the served roots to read again whole: listings, texts and file kinds. */
    roots: string[];
    /** The folders to list again, each as a served root's key and a path under that root. */
    folders: { root: string; path: string }[];
};

/** A path under a base and one more path under it, joined with a `/`, either of them empty. */
function joined(base: string, path: string): string {
    if (base === '') return path;
    return path === '' ? base : `${base}/${path}`;
}

/** What `payload` asks of the served roots, none for a message that names no root. */
export function diskPlan(payload: FilesPayload, served: readonly FsRoot[]): DiskPlan {
    const plan: DiskPlan = { roots: [], folders: [] };
    if (payload.root === '') return plan;
    for (const one of served) {
        const inside = pathUnder(one.dir, payload.root);
        const above = pathUnder(payload.root, one.dir);
        if (inside === null && above === null) continue;
        if (payload.folders === undefined) {
            plan.roots.push(one.key);
            continue;
        }
        for (const folder of payload.folders) {
            const path = inside !== null ? joined(inside, folder) : below(above ?? '', folder);
            if (path === null) continue;
            if (!plan.folders.some((held) => held.root === one.key && held.path === path)) {
                plan.folders.push({ root: one.key, path });
            }
        }
    }
    return plan;
}

/**
 * The path under a served root of a folder the message names, where the root lies at `from` under
 * the message's root: the folder's own path when it is the root or lies under it, null for a folder
 * outside the root, whose listing the root does not draw.
 */
function below(from: string, folder: string): string | null {
    if (from === '') return folder;
    if (folder === from) return '';
    return folder.startsWith(`${from}/`) ? folder.slice(from.length + 1) : null;
}
