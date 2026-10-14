// Layer 2, server. Which files of this machine the Markdown server may be given, and how its files
// are listed. The server runs with no read access beyond its own packages, so every file it looks
// at goes through the requests answered here (requests.ts), and each one asks first whether the
// file is in the server's root and does not lie in the `secrets` folder of every hub or in
// `~/.oculus`, whatever letter case names it.
//
// The Markdown files of a root leave out every folder whose name starts with a dot but one: a
// hub's notes folder `.oculus/notes/`, whose notes are in the server's workspace as the hub's other
// Markdown files are, and the folders under it that are not dot folders themselves.

import { readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES_FOLDER, inHiddenFolder } from '../../../../../data/prose/markdown/note-names.ts';
import { inside, realPath } from '../../../../core/paths.ts';
import type { ServedRoot } from '../../uris.ts';
import { isPrivateFile } from '../yaml/private-file.ts';

/** The roots a path is judged against: the root of the server, and every served root. */
export type Reach = { root: ServedRoot; roots: readonly ServedRoot[] };

/** The folders a walk for files never enters. */
const SKIPPED = ['node_modules'];

/**
 * The real path of a path that may not exist: the nearest folder above it that does, resolved,
 * with the rest of the path put back. A link that leaves the root through a link is outside it.
 */
function resolved(path: string): string {
    const full = resolve(path);
    let head = full;
    const tail: string[] = [];
    while (realPath(head, true) === null && dirname(head) !== head) {
        tail.unshift(head.slice(dirname(head).length + 1));
        head = dirname(head);
    }
    return join(realPath(head, true) ?? head, ...tail);
}

/** Whether a real path is a file the server is never given. */
export function withheld(real: string, reach: Reach): boolean {
    return isPrivateFile(real, reach.roots);
}

/** Whether a real path is in the root and is not withheld. */
export function served(real: string, reach: Reach): boolean {
    return inside(real, reach.root.real) && !withheld(real, reach);
}

/** The real path of a `file:` address the server may be given, or null for any other. */
export function reachable(uri: unknown, reach: Reach): string | null {
    if (typeof uri !== 'string' || !uri.startsWith('file:')) return null;
    let path: string;
    try {
        path = fileURLToPath(uri);
    } catch {
        return null;
    }
    const real = resolved(path);
    return served(real, reach) ? real : null;
}

/** Whether a file name ends in one of the extensions, which are compared in lower case. */
function hasExtension(name: string, extensions: readonly string[]): boolean {
    const at = name.lastIndexOf('.');
    return at > 0 && extensions.includes(name.slice(at + 1).toLowerCase());
}

/**
 * The folders a walk for a root's Markdown files starts at, from a folder of the root: the root
 * with a hub's notes folder beside it, the notes folder for a folder above it, none for a folder in
 * another dot folder, and the folder itself otherwise.
 */
function startsOf(reach: Reach, from: string): string[] {
    const hub = reach.root.hub === true;
    const notes = realPath(join(reach.root.real, ...NOTES_FOLDER.split('/')), true);
    const there = hub && notes !== null && served(notes, reach) ? notes : null;
    if (resolve(from) === resolve(reach.root.real)) return there === null ? [from] : [from, there];
    if (there !== null && inside(there, from)) return [there];
    const path = relative(reach.root.real, from).split(sep).join('/');
    return inHiddenFolder(`${path}/.`, hub) ? [] : [from];
}

/**
 * The Markdown files of a root, or of a folder of it, as real paths: the folders are read one at a
 * time without blocking the process, a folder whose name starts with a dot but a hub's notes
 * folder, `node_modules`, a link to a folder and everything withheld are left out.
 */
export async function markdownFiles(
    reach: Reach,
    extensions: readonly string[],
    from: string = reach.root.real
): Promise<string[]> {
    const found: string[] = [];
    const folders = startsOf(reach, from);
    for (let folder = folders.pop(); folder !== undefined; folder = folders.pop()) {
        let entries;
        try {
            entries = await readdir(folder, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            const path = join(folder, entry.name);
            if (entry.isDirectory()) {
                if (
                    !entry.name.startsWith('.') &&
                    !SKIPPED.includes(entry.name) &&
                    !withheld(path, reach)
                ) {
                    folders.push(path);
                }
            } else if (entry.isFile() && hasExtension(entry.name, extensions)) {
                if (!withheld(path, reach)) found.push(path);
            }
        }
    }
    return found.sort();
}

/** What a stat of a path says, or null for a path that is not served or not there. */
async function infoOf(
    path: string,
    reach: Reach
): Promise<{ isDirectory: boolean; size: number } | null> {
    const real = resolved(path);
    if (!served(real, reach)) return null;
    try {
        const info = await stat(real);
        return { isDirectory: info.isDirectory(), size: info.size };
    } catch {
        return null;
    }
}

/** What a stat of a served address says, or null for one that is not served or not there. */
export async function statOf(
    uri: unknown,
    reach: Reach
): Promise<{ isDirectory: boolean; size: number } | null> {
    const real = reachable(uri, reach);
    return real === null ? null : infoOf(real, reach);
}

/** The entries of a served folder with whether each is a folder; withheld ones are left out. */
export async function listing(
    uri: unknown,
    reach: Reach
): Promise<[string, { isDirectory: boolean }][]> {
    const real = reachable(uri, reach);
    if (real === null) throw new Error('the folder is not one the server may read');
    const listed: [string, { isDirectory: boolean }][] = [];
    for (const name of await readdir(real)) {
        const info = await infoOf(join(real, name), reach);
        if (info !== null) listed.push([name, { isDirectory: info.isDirectory }]);
    }
    return listed;
}
