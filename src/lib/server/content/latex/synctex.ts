// Layer 2, server. SyncTeX in both directions, through the `synctex` program of TeX Live: the
// places in the PDF a source line was typeset at (forward) and the source line a place in the PDF
// came from (inverse).
//
// The program runs with no shell and its arguments as a list, under the time limit every LaTeX
// program has (core/program.ts). Its output is read by line: a result is a block of `Key:value`
// lines, a forward result one block per place and an inverse result one block for the place asked
// about. The coordinates are PDF points measured from the page's top left, which are a PDF.js
// viewport's coordinates at scale 1.
//
// A forward search gives the places in the order the program names them. An inverse search gives
// the first place, with its column only when the program knows one (it answers -1 when it does
// not). The file it names is the real path of a file of the build, which may be a path with a `./`
// segment or a link's other name; it is mapped to a path inside the served root, and one that is
// outside every root the caller serves is not given.

import { posix, relative, resolve, sep } from 'node:path';
import { z } from 'zod';
import { inside, realPath } from '../../core/paths.ts';
import { isFile } from '../latex.ts';
import { run, type Run, type Tools } from '../../core/program.ts';

/** One place a source line was typeset at: the page, the point, and the box the line sits in. */
export type Place = {
    page: number;
    x: number;
    y: number;
    /** The box's left edge and top edge, and its width and height, in PDF points. */
    left: number;
    top: number;
    w: number;
    h: number;
};

/** The numbers of one forward result block, read as numbers or refused. */
const placeShape = z.object({
    Page: z.coerce.number().int().min(1),
    x: z.coerce.number(),
    y: z.coerce.number(),
    h: z.coerce.number(),
    v: z.coerce.number(),
    W: z.coerce.number(),
    H: z.coerce.number()
});

/** The fields of one inverse result block. */
const sourceShape = z.object({
    Input: z.string().min(1),
    Line: z.coerce.number().int().min(1),
    Column: z.coerce.number().int()
});

/** One `Key:value` line, the key being letters. */
const FIELD = /^([A-Za-z]+):(.*)$/;

/**
 * The result blocks of a program's output: each begins at a line the given key opens, and holds the
 * `Key:value` lines up to the next such line or the end of the result.
 */
function blocksOf(stdout: string, opener: string): Record<string, string>[] {
    const blocks: Record<string, string>[] = [];
    let open = false;
    for (const line of stdout.split(/\r?\n/)) {
        if (line.startsWith('SyncTeX result end')) break;
        if (line.startsWith('SyncTeX result begin')) {
            open = true;
            continue;
        }
        const field = open ? FIELD.exec(line) : null;
        if (field === null) continue;
        if (field[1] === opener) blocks.push({});
        const current = blocks.at(-1);
        if (current !== undefined) current[field[1]] = field[2];
    }
    return blocks;
}

/** The places of a `synctex view` output, in the program's order. */
export function placesOf(stdout: string): Place[] {
    return blocksOf(stdout, 'Page').flatMap((block) => {
        const read = placeShape.safeParse(block);
        if (!read.success) return [];
        const { Page, x, y, h, v, W, H } = read.data;
        return [{ page: Page, x, y, left: h, top: v - H, w: W, h: H }];
    });
}

/** The first source record of a `synctex edit` output, or null when it holds none. */
export function sourceOf(
    stdout: string
): { input: string; line: number; column: number | null } | null {
    for (const block of blocksOf(stdout, 'Output')) {
        const read = sourceShape.safeParse(block);
        if (read.success) {
            const { Input, Line, Column } = read.data;
            return { input: Input, line: Line, column: Column >= 0 ? Column : null };
        }
    }
    return null;
}

/** The program a build's SyncTeX is read with: the configured path, else `synctex` on PATH. */
export function programFor(path: string): string {
    return path === '' ? 'synctex' : path;
}

/** The places `line` and `column` of a source file were typeset at in the PDF a build wrote. */
export function forward(
    program: string,
    pdf: string,
    file: string,
    line: number,
    column: number,
    tools?: Tools
): Promise<Run> {
    const args = ['view', '-i', `${line}:${column}:${file}`, '-o', pdf];
    return run(program, args, {}, tools);
}

/** The source record of the place (`x`, `y`) of a page of a PDF. */
export function inverse(
    program: string,
    pdf: string,
    page: number,
    x: number,
    y: number,
    tools?: Tools
): Promise<Run> {
    return run(program, ['edit', '-o', `${page}:${x}:${y}:${pdf}`], {}, tools);
}

/**
 * The file a source record names, as a path against the served root `bound`, or null when it lies
 * outside it or is no file. A relative name is taken from the PDF's folder; the path is worked out
 * (`./` and `..` segments) and its links followed before the test, so a name that reaches a file
 * through another spelling of the root is still the root's file.
 */
export function placedIn(bound: string, pdfFolder: string, input: string): string | null {
    const real = realPath(resolve(pdfFolder, input));
    if (real === null || !inside(real, bound) || !isFile(real)) return null;
    return relative(bound, real).split(sep).join(posix.sep);
}
