// Layer 2, server. The main file a `.tex` file builds through: the file itself when it is a main
// file, else the main its `% !TEX root = <path>` comment names, else the only main of its folder.
//
// A root comment is followed the way latexmk's editors follow it: the named file is read in its
// turn, so a chapter that names a part that names the thesis builds the thesis. The value is
// resolved from the folder of the file that holds the comment and must lie inside the same root, so
// a comment never reaches a file the root does not serve. A comment naming a file that is missing
// or outside the root is no comment, and the folder rule answers. A chain that comes back to a file
// it has already passed through is a cycle and answers no main, since the folder rule of any file
// in it would be a guess.

import { dirname, join, resolve } from 'node:path';
import { inside, realPath } from '../../core/paths.ts';
import { declaresClass, head, isFile, mainsIn } from '../latex.ts';
import { magicComments } from './reader.ts';

/** What a step of the chain answers when it has met a file it already passed through. */
const CYCLE = Symbol('cycle');

/** The real path of a file that lies inside the bound, or null. */
function fileInside(bound: string, path: string): string | null {
    const real = realPath(path);
    return real !== null && inside(real, bound) && isFile(real) ? real : null;
}

/** The only main file in a file's folder, or null when it holds none or several. */
function onlyMain(file: string): string | null {
    const dir = dirname(file);
    const found = mainsIn(dir);
    return found.length === 1 ? join(dir, found[0]) : null;
}

/**
 * One step of the chain from a file: itself, what its root comment reaches, or its folder's main.
 */
function follow(bound: string, file: string, seen: Set<string>): string | null | typeof CYCLE {
    if (seen.has(file)) return CYCLE;
    seen.add(file);
    if (declaresClass(head(file))) return file;
    const named = magicComments(head(file)).get('root');
    if (named !== undefined && named !== '') {
        const target = fileInside(bound, resolve(dirname(file), named));
        if (target !== null) {
            const reached = follow(bound, target, seen);
            if (reached !== null) return reached;
        }
    }
    return onlyMain(file);
}

/**
 * The real path of the main file the given file builds through, or null when none can be told.
 * `bound` is the real path of the root's folder and `file` the real path of a file inside it.
 */
export function rootOf(bound: string, file: string): string | null {
    const found = follow(bound, file, new Set());
    return found === CYCLE ? null : found;
}
