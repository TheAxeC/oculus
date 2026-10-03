// Layer 2, server. The sections of a main file in reading order, followed through the files it
// includes: each `\input`, `\include`, `\subfile` and `\import` is expanded where it stands, so the
// outline reads as the document does.
//
// An include is resolved from the folder of the main file, which is where LaTeX runs, with `.tex`
// added when the name has no extension. Each file is read once, so an include of a file already
// read, itself among them, stops there. A file that is missing or outside the root is left out. A
// file past the size limit, or one that cannot be read, is named in `unread` and read no further.
// A file the parser refuses is named in `partial`: its sectioning commands are listed from the line
// scan the reader falls back to, and its includes are not followed, so the sections of the files
// it includes are unknown rather than absent.

import { statSync, readFileSync } from 'node:fs';
import { extname, relative, resolve, sep } from 'node:path';
import type { Include, Section } from '../../../data/prose/latex.ts';
import { inside, realPath } from '../../core/paths.ts';
import { isFile } from '../latex.ts';
import { readTex } from './reader.ts';

/** The largest file the outline reads; a larger one is skipped rather than parsed. */
export const OUTLINE_MAX_BYTES = 2 * 1024 * 1024;

/** One section of the outline: its level, title, the file it is in and its line. */
export type OutlineEntry = { level: number; title: string; file: string; line: number };

/**
 * The outline of a main file, the files read only in part (the parser refused them) and the files
 * not read at all (too large or unreadable).
 */
export type Outline = { sections: OutlineEntry[]; partial: string[]; unread: string[] };

/** The file an include names, as a real path inside the bound, or null. */
function target(bound: string, dir: string, include: Include): string | null {
    const named = extname(include.path) === '' ? `${include.path}.tex` : include.path;
    const real = realPath(resolve(dir, named));
    return real !== null && inside(real, bound) && isFile(real) ? real : null;
}

/** The text of a file, or null when it is too large or cannot be read. */
function readBounded(path: string): string | null {
    try {
        return statSync(path).size > OUTLINE_MAX_BYTES ? null : readFileSync(path, 'utf8');
    } catch {
        return null;
    }
}

/** The sections and includes of one file in the order the file holds them. */
function inOrder(sections: Section[], includes: Include[]): (Section | Include)[] {
    const kept: (Section | Include)[] = [...sections, ...includes];
    return kept.sort((left, right) => left.line - right.line);
}

/**
 * The outline of the main file at `main`, a real path inside `bound`. Includes resolve from `dir`,
 * and every file is named in the answer relative to `base`, which is `bound` unless the caller
 * names its files against a folder of its own (a project's, whose paths are against its folder).
 */
export function outlineOf(bound: string, dir: string, main: string, base = bound): Outline {
    const sections: OutlineEntry[] = [];
    const partial: string[] = [];
    const unread: string[] = [];
    const seen = new Set<string>();
    const name = (path: string): string => relative(base, path).split(sep).join('/');
    const visit = (file: string): void => {
        if (seen.has(file)) return;
        seen.add(file);
        const text = readBounded(file);
        if (text === null) {
            unread.push(name(file));
            return;
        }
        const read = readTex(text);
        if (read.refused) partial.push(name(file));
        for (const item of inOrder(read.sections, read.includes)) {
            if ('title' in item) {
                sections.push({ ...item, file: name(file) });
                continue;
            }
            const reached = target(bound, dir, item);
            if (reached !== null) visit(reached);
        }
    };
    visit(main);
    return { sections, partial, unread };
}
