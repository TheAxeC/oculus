// Layer 2, client state. The Catalogs and Texts groups of the Settings view: the files of a folder
// of the engine's config tree and of every folder under it, read from the file browser's listings
// of those folders and never from a fixed list. Each file is a path under config/ (`catalogs/
// glyphs.yml`, `text/views/system/history.yml`), in name order, whatever its extension.
//
// A listing still being read makes the folder `loading` and lists nothing yet; one that failed
// makes it `failed` and names the folder and the reason, and a failure wins over a listing still
// loading.

import type { FsEntry } from '../../../sources/fs.ts';
import { message, type Message } from '../messages.ts';
import type { RowBase } from '../rows.ts';

/** What the file browser holds for one folder: its entries, why it failed, and whether it loads. */
export type Listing = { entries: FsEntry[]; error: string; loading: boolean };

/** The listing of the folder at a path under config/. */
export type ListingOf = (path: string) => Listing;

/** The files of a folder, or why there are none yet. */
export type Listed = {
    status: 'rows' | 'loading' | 'failed';
    files: string[];
    said: Message | null;
};

/**
 * One file listed in a group: the path and the open action, with its description when it has one.
 */
export type FileRow = RowBase & { kind: 'file'; file: string };

/** How deep under a folder the walk goes; a listing deeper than the config tree is a loop. */
const DEEPEST = 8;

/** What a walk found: the files, the first failure met, and whether any listing was loading. */
type Found = { files: string[]; failed: Message | null; loading: boolean };

/** The files under one folder, added to what the walk has found. */
function walk(folder: string, listing: ListingOf, depth: number, found: Found): void {
    const held = listing(folder);
    if (held.error !== '') {
        found.failed ??= message('listFailed', folder, held.error);
        return;
    }
    if (held.loading) {
        found.loading = true;
        return;
    }
    for (const entry of held.entries) {
        const path = `${folder}/${entry.name}`;
        if (entry.kind === 'dir') {
            if (depth < DEEPEST) walk(path, listing, depth + 1, found);
        } else {
            found.files.push(path);
        }
    }
}

/** The files of a folder and of the folders under it, in name order. */
export function listedFiles(folder: string, listing: ListingOf): Listed {
    const found: Found = { files: [], failed: null, loading: false };
    walk(folder, listing, 0, found);
    if (found.failed !== null) return { status: 'failed', files: [], said: found.failed };
    if (found.loading) {
        return { status: 'loading', files: [], said: message('listLoading', folder) };
    }
    const files = found.files.sort((left, right) => left.localeCompare(right));
    return { status: 'rows', files, said: null };
}
