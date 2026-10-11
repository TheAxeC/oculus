// Layer 2, server. What the server looks at to know that an activation event of a host has
// happened without a page saying so: whether a root holds a file that a `workspaceContains` glob
// matches, and the language id of a file whose source tab a page opened.
//
// The look at a root is a walk of its folders: at most `scanEntries` entries per root are read,
// whatever they are, a dot-led folder and `node_modules` are never entered, a link is neither
// followed nor taken for a file, and the glob is matched on the path relative to the root, so a
// match can only name a file inside it. The listing of a folder is an argument, so a test lists
// folders in an order it chooses.

import { opendir } from 'node:fs/promises';
import { join } from 'node:path';
import { extensionOf } from '../../../../data/helpers/files/opens-in-program.ts';
import { nameOf } from '../../../../data/helpers/files/paths.ts';
import type { LanguageMap } from '../../../../data/helpers/files/languages.ts';
import { globTest } from '../../../../data/helpers/search/glob.ts';

/** What a folder lists of one entry. */
type Listed = { name: string; kind: 'file' | 'folder' | 'other' };

/** The first `limit` entries of a folder, in the order the disk gives them. */
export type List = (folder: string, limit: number) => Promise<Listed[]>;

/** The language the editor gives a file no entry of the map names. */
const PLAIN = 'plaintext';

/** The folders a look never enters, beside every dot-led one. */
const SKIPPED = 'node_modules';

/** The listing of the disk. */
export const diskList: List = async (folder, limit) => {
    const handle = await opendir(folder);
    const entries: Listed[] = [];
    try {
        for (let read = 0; read < limit; read += 1) {
            const entry = await handle.read();
            if (entry === null) break;
            const kind = entry.isFile() ? 'file' : entry.isDirectory() ? 'folder' : 'other';
            entries.push({ name: entry.name, kind });
        }
    } finally {
        await handle.close().catch(() => undefined);
    }
    return entries;
};

/**
 * Whether a file under `dir` matches the glob, reading at most `limit` entries. A folder that
 * cannot be read is left out.
 */
export async function rootHolds(
    dir: string,
    glob: string,
    limit: number,
    list: List = diskList
): Promise<boolean> {
    const matches = globTest(glob);
    const pending = [''];
    let left = limit;
    while (pending.length > 0 && left > 0) {
        const below = pending.shift() ?? '';
        let entries: Listed[];
        try {
            entries = await list(below === '' ? dir : join(dir, below), left);
        } catch {
            continue;
        }
        left -= entries.length;
        for (const entry of entries) {
            const path = below === '' ? entry.name : `${below}/${entry.name}`;
            if (entry.kind === 'file' && matches(path)) return true;
            const entered =
                entry.kind === 'folder' && !entry.name.startsWith('.') && entry.name !== SKIPPED;
            if (entered) pending.push(path);
        }
    }
    return false;
}

/**
 * The language id the editor opens a file of this path in: the map's entry for its whole name
 * lowercased, else for its extension, else plain text.
 */
export function languageOfPath(path: string, map: LanguageMap): string {
    const bare = nameOf(path).toLowerCase();
    const whole = bare.startsWith('.') ? undefined : map.get(bare);
    return whole ?? map.get(extensionOf(path)) ?? PLAIN;
}
