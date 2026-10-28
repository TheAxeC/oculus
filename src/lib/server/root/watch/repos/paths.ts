// Layer 2, server. What the git watcher (../git.ts) asks of a path: whether a write there can
// change what git reports, which folders below a root are repositories, what a stat says of the
// path itself and which folder holds it.

import { existsSync, lstatSync, readdirSync } from 'node:fs';
import type { Stats } from 'node:fs';
import { join } from 'node:path';
import { APP_FOLDERS, PLAIN_FOLDERS } from '../../process/build-folders.ts';

/** Path segments whose writes never change what git reports about the working tree. */
export const IGNORED = [
    'node_modules',
    ...Object.values(PLAIN_FOLDERS),
    ...Object.values(APP_FOLDERS),
    '__pycache__'
];

/**
 * Whether an event is one of ours: outside .git/objects, outside every ignored folder, and not a
 * lock file inside .git.
 *
 * The lock is the one that matters. The module's own reads run without optional locks and write
 * none, but another git process in the same repository (the owner's commit, an editor) takes
 * .git/index.lock and renames it away again, and without this line each of those would schedule a
 * read. A real index change announces itself with an event on .git/index, which is not filtered.
 */
export function relevant(filename: string | null): boolean {
    if (filename === null || filename === '') return false;
    const parts = filename.split(/[/\\]/);
    if (parts.some((part) => IGNORED.includes(part))) return false;
    if (parts[0] !== '.git') return true;
    if (parts[1] === 'objects') return false;
    return !parts[parts.length - 1].endsWith('.lock');
}

/**
 * The repositories below a root, by path in name order: every folder down to `depth` levels under
 * it that holds a `.git`, a folder or a file. The walk enters repositories too (a repository inside
 * one is found), skips links, `.git` and the ignored folders, and enters every other folder, dot
 * folders included. A folder that cannot be listed is skipped and the rest of the walk goes on. A
 * depth of 0 finds nothing, and `Infinity` has no limit.
 */
export function subrepositories(root: string, depth: number): string[] {
    const found: string[] = [];
    const walk = (dir: string, level: number): void => {
        if (level >= depth) return;
        let entries;
        try {
            entries = readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name === '.git' || IGNORED.includes(entry.name)) {
                continue;
            }
            const path = join(dir, entry.name);
            if (existsSync(join(path, '.git'))) found.push(path);
            walk(path, level + 1);
        }
    };
    walk(root, 0);
    return found.sort();
}

/**
 * What a stat says of a path itself, or nothing when there is no entry there to say it of: a path
 * that is gone, and one under a file (a worktree's `.git` is one), which the stat refuses with
 * ENOTDIR. A symbolic link is dated by its own change time, not its target's: a link made or
 * pointed elsewhere now, at a file that is old, is a new entry git reports.
 */
export function statOf(path: string): Stats | undefined {
    try {
        return lstatSync(path, { throwIfNoEntry: false });
    } catch {
        return undefined;
    }
}

/** The folder that holds a path, relative to the root: `''` for the root's own top. */
export function parentOf(path: string): string {
    const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return at === -1 ? '' : path.slice(0, at);
}
