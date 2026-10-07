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

import { dirname, extname, relative, resolve, sep } from 'node:path';
import {
    auxInputs,
    numbersOf,
    scanStructure,
    type Float,
    type Include,
    type Label,
    type Section
} from '../../../data/prose/latex.ts';
import { inside, realPath } from '../../core/paths.ts';
import { isFile } from '../latex.ts';
import { readBounded, readTex } from './reader.ts';

/** One section of the outline: its level, title, the file it is in and its line. */
export type OutlineEntry = { level: number; title: string; file: string; line: number };

/** One label of the document: its name, the number its build gave it ('' before one), its place. */
type LabelEntry = Label & { file: string; number: string };

/** One float of the document: as `Float`, with the number its build gave it and its place. */
type FloatEntry = Float & { file: string; number: string };

/**
 * The outline of a main file: its sections, labels and floats, the files read only in part (the
 * parser refused them) and the files not read at all (too large or unreadable).
 */
export type Outline = {
    sections: OutlineEntry[];
    labels: LabelEntry[];
    floats: FloatEntry[];
    partial: string[];
    unread: string[];
};

/** The file an include names, as a real path inside the bound, or null. */
function target(bound: string, dir: string, include: Include): string | null {
    const named = extname(include.path) === '' ? `${include.path}.tex` : include.path;
    const real = realPath(resolve(dir, named));
    return real !== null && inside(real, bound) && isFile(real) ? real : null;
}

/** The sections and includes of one file in the order the file holds them. */
function inOrder(sections: Section[], includes: Include[]): (Section | Include)[] {
    const kept: (Section | Include)[] = [...sections, ...includes];
    return kept.sort((left, right) => left.line - right.line);
}

/** How deep an `.aux` file's own inputs are followed. */
const AUX_DEPTH = 8;

/**
 * The numbers the build gave the document's labels, from its `.aux` file and the ones that file
 * reads in turn (a `\include` writes one each). Every file is read once, none outside the folder
 * of the first or beyond the size limit; none at all gives no numbers.
 */
function numbersFrom(aux: string): Map<string, string> {
    const numbers = new Map<string, string>();
    const seen = new Set<string>();
    const read = (file: string, depth: number): void => {
        if (seen.has(file) || depth > AUX_DEPTH) return;
        seen.add(file);
        const text = readBounded(file);
        if (text === null) return;
        for (const [name, number] of numbersOf(text)) numbers.set(name, number);
        for (const input of auxInputs(text)) {
            const next = resolve(dirname(file), input);
            if (inside(next, dirname(aux))) read(next, depth + 1);
        }
    };
    read(aux, 0);
    return numbers;
}

/**
 * The outline of the main file at `main`, a real path inside `bound`. Includes resolve from `dir`,
 * and every file is named in the answer relative to `base`, which is `bound` unless the caller
 * names its files against a folder of its own (a project's, whose paths are against its folder).
 * `aux` is the `.aux` file of the build, whose numbers the labels and floats carry once it exists.
 */
export function outlineOf(
    bound: string,
    dir: string,
    main: string,
    base = bound,
    aux = ''
): Outline {
    const sections: OutlineEntry[] = [];
    const labels: LabelEntry[] = [];
    const floats: FloatEntry[] = [];
    const numbers = aux === '' ? new Map<string, string>() : numbersFrom(aux);
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
        const structure = scanStructure(text);
        for (const label of structure.labels) {
            labels.push({ ...label, file: name(file), number: numbers.get(label.name) ?? '' });
        }
        for (const float of structure.floats) {
            floats.push({ ...float, file: name(file), number: numbers.get(float.label) ?? '' });
        }
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
    return { sections, labels, floats, partial, unread };
}
