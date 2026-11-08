// Layer 2, route test support. What the tests of a write across two hubs read of a hub's folder:
// every file with its text, the paths whose text differs between two readings, and whether a file
// lies inside the folder. It is its own file because the two test files of those writes share it.

import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** The log, the overrides and the bookmarks are beside the hub's files and are not its content. */
const BESIDE = new Set(['changes.jsonl', 'sessions.json', 'bookmarks.yml']);

/** Every file under a hub by its path inside it, with its text. */
export function filesOf(dir: string, at = ''): Map<string, string> {
    const held = new Map<string, string>();
    for (const name of readdirSync(join(dir, at))) {
        const path = join(at, name);
        if (at === '' && BESIDE.has(name)) continue;
        if (statSync(join(dir, path)).isDirectory()) {
            for (const [key, text] of filesOf(dir, path)) held.set(key, text);
        } else {
            held.set(path, readFileSync(join(dir, path), 'utf8'));
        }
    }
    return held;
}

/** The paths whose text differs between two readings, or that only one of them holds. */
export function differing(before: Map<string, string>, after: Map<string, string>): string[] {
    const paths = new Set([...before.keys(), ...after.keys()]);
    return [...paths].filter((path) => before.get(path) !== after.get(path)).sort();
}

/** Whether a file lies inside a hub's folder, the folder named by either of its two spellings. */
export function heldBy(dir: string, file: string): boolean {
    return [dir, realpathSync(dir)].some((one) => !relative(one, file).startsWith('..'));
}
