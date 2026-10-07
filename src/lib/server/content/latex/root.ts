// Layer 2, server. The main file a source file builds through, and what a main file depends on.
//
// The root of a file is found by these rules in order, as LaTeX Workshop's root detection runs
// them, and the answer says which one found it (`how`):
//   magic     the `% !TEX root = <path>` comment of the file's leading comment block, followed the
//             way latexmk's editors follow it: the named file is read in its turn, so a chapter
//             that names a part that names the thesis builds the thesis. A chain that comes back to
//             a file it has already passed through is a cycle and answers no main, since any other
//             rule's answer for a file in it would be a guess.
//   self      the file itself, when it declares a document class.
//   included  a main file of the file's folder, or of the nearest folder above it up to the served
//             root, whose include closure holds the file.
//   folder    the only main file of the file's own folder.
// A root comment is resolved from the folder of the file that holds it and must name an existing
// source file inside the same served root, so a comment never reaches a file the root does not
// serve; any other comment is no comment and the next rule answers. A `.bib`, `.sty` or `.cls`
// file takes the last two rules only.
//
// The main a PDF is the build of (`mainOfPdf`) is the nearest main, from the PDF's folder up to the
// served root, of the PDF's name whose output folder holds that PDF.
//
// The include closure of a main file is the files its text includes (`\input`, `\include`,
// `\subfile`, `\import` and their relatives, read by the line scan of data/prose/latex.ts, which
// reads a text the parser refuses as well), the bibliographies its `\bibliography` and
// `\addbibresource` name, and the files the build itself recorded in `<main>.fls` when one is
// beside the main or in the output or auxiliary folder, which is how a chapter included only by a
// class macro is found. No file outside the served root is followed.
//
// One call reads each file at most once: what a call has read is held in a `Walk` that the steps of
// the call share, so a file several mains include, and a main that is both a candidate and a
// closure member, is read once. The call stops reading when the answer is decided: a closure is
// walked only until it holds the file asked about, and the mains of a folder are read in their
// order only as far as the rule needs.

import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { isTexSource, scanFiles, stemOf, type Include } from '../../../data/prose/latex.ts';
import { inside, realPath } from '../../core/paths.ts';
import { HEAD_BYTES, declaresClass, head, isFile, sourcesIn } from '../latex.ts';
import { magicComments, readBounded } from './reader.ts';

/** Which rule found a root. */
export type RootHow = 'magic' | 'self' | 'included' | 'folder';

/** The main file a source file builds through, and the rule that found it. */
export type RootFound = { main: string; how: RootHow };

/** The folders a build of a main file writes to, which its `.fls` may be in. */
export type RootFolders = (main: string) => string[];

/**
 * The most files a closure holds, which bounds the walk over a document that includes itself deep.
 */
const CLOSURE_MAX = 2000;

/** What a step of the magic chain answers when it has met a file it already passed through. */
const CYCLE = Symbol('cycle');

/** What one call has read: the first bytes of a file, and the text of a file read whole. */
type Walk = {
    heads: Map<string, string>;
    texts: Map<string, string | null>;
    named: Map<string, { sources: string[]; bibliographies: string[] }>;
};

function createWalk(): Walk {
    return { heads: new Map(), texts: new Map(), named: new Map() };
}

/**
 * The first bytes of a file, read the first time the call asks for them; the start of the text
 * when the call has read the file whole.
 */
function headOf(walk: Walk, path: string): string {
    const whole = walk.texts.get(path);
    if (typeof whole === 'string') return whole.slice(0, HEAD_BYTES);
    let held = walk.heads.get(path);
    if (held === undefined) {
        held = head(path);
        walk.heads.set(path, held);
    }
    return held;
}

/**
 * The text of a file within the byte bound, or null; read the first time the call asks for it,
 * and taken from the first bytes when those were the whole file.
 */
function textOf(walk: Walk, path: string): string | null {
    if (!walk.texts.has(path)) {
        const first = walk.heads.get(path);
        const complete = first !== undefined && new TextEncoder().encode(first).length < HEAD_BYTES;
        walk.texts.set(path, complete ? first : readBounded(path));
    }
    return walk.texts.get(path) ?? null;
}

/**
 * The names of the main files directly in a folder, in the order `sourcesIn` gives, each file's
 * first bytes read when the name is reached and `wanted` accepts it.
 */
function* mainsOf(
    walk: Walk,
    dir: string,
    wanted: (name: string) => boolean = () => true
): Generator<string> {
    for (const name of sourcesIn(dir)) {
        if (wanted(name) && declaresClass(headOf(walk, join(dir, name)))) yield name;
    }
}

/** The real path of a file that lies inside the bound, or null. */
function fileInside(bound: string, path: string): string | null {
    const real = realPath(path);
    return real !== null && inside(real, bound) && isFile(real) ? real : null;
}

/**
 * The file an include or a bibliography names, as a real path inside the bound, or null. The name
 * is resolved from the folder of the main file, which is where LaTeX runs; a name without the
 * extension of a source file gets `.tex` added first, and then is tried as it stands.
 */
function reach(bound: string, dir: string, name: string, extension: string): string | null {
    if (name === '') return null;
    const asNamed = isAbsolute(name) ? name : resolve(dir, name);
    const added = `${asNamed}${extension}`;
    const candidates =
        isTexSource(name) || extname(name) === extension ? [asNamed] : [added, asNamed];
    for (const candidate of candidates) {
        const found = fileInside(bound, candidate);
        if (found !== null) return found;
    }
    return null;
}

/** The files of a main's `.fls` recorded as read, as real paths inside the bound. */
function recorded(walk: Walk, bound: string, main: string, folders: string[]): string[] {
    const found: string[] = [];
    const stem = `${stemOf(basename(main))}.fls`;
    for (const folder of new Set([dirname(main), ...folders])) {
        const text = textOf(walk, join(folder, stem));
        if (text === null) continue;
        let base = dirname(main);
        for (const line of text.split(/\r?\n/)) {
            if (line.startsWith('PWD ')) base = line.slice('PWD '.length).trim();
            if (!line.startsWith('INPUT ')) continue;
            const path = line.slice('INPUT '.length).trim();
            const real = fileInside(bound, isAbsolute(path) ? path : resolve(base, path));
            if (real !== null) found.push(real);
        }
    }
    return found;
}

/** The names of the files a build of a main wrote, from its `.fls` OUTPUT lines. */
function written(walk: Walk, main: string, folders: string[]): Set<string> {
    const found = new Set<string>();
    const stem = `${stemOf(basename(main))}.fls`;
    for (const folder of new Set([dirname(main), ...folders])) {
        const text = textOf(walk, join(folder, stem)) ?? '';
        let base = dirname(main);
        for (const line of text.split(/\r?\n/)) {
            if (line.startsWith('PWD ')) base = line.slice('PWD '.length).trim();
            if (!line.startsWith('OUTPUT ')) continue;
            const path = line.slice('OUTPUT '.length).trim();
            const full = isAbsolute(path) ? path : resolve(base, path);
            found.add(realPath(full) ?? full);
        }
    }
    return found;
}

/** The files one include names, in the order the text names them. */
function namedBy(
    walk: Walk,
    bound: string,
    dir: string,
    file: string
): { sources: string[]; bibliographies: string[] } {
    const key = `${dir}\n${file}`;
    const held = walk.named.get(key);
    if (held !== undefined) return held;
    const read = scanFiles(textOf(walk, file) ?? '');
    const pick = (include: Include): string | null => reach(bound, dir, include.path, '.tex');
    const found = {
        sources: read.includes.map(pick).filter((one) => one !== null),
        bibliographies: read.bibliographies
            .map((name) => reach(bound, dir, name, '.bib'))
            .filter((one) => one !== null)
    };
    walk.named.set(key, found);
    return found;
}

/**
 * Every file a main file depends on, as real paths inside the bound, the main first: the files its
 * text includes and the bibliographies it names, each read once, and the files its `.fls` records.
 */
export function closureOf(bound: string, main: string, folders: string[] = []): Set<string> {
    return closureIn(createWalk(), bound, main, folders, null);
}

/**
 * The closure of `main` as `closureOf` answers it, read through `walk`. With `wanted` it stops as
 * soon as that file is in the set, and the set is then partial: it answers whether the closure
 * holds the file and nothing else.
 */
function closureIn(
    walk: Walk,
    bound: string,
    main: string,
    folders: string[],
    wanted: string | null
): Set<string> {
    const seen = new Set<string>([main]);
    if (wanted === main) return seen;
    const dir = dirname(main);
    const queue = [main];
    while (queue.length > 0 && seen.size < CLOSURE_MAX) {
        const file = queue.pop() ?? main;
        const named = namedBy(walk, bound, dir, file);
        for (const found of [...named.sources, ...named.bibliographies]) {
            if (seen.has(found)) continue;
            seen.add(found);
            if (found === wanted) return seen;
            if (isTexSource(found)) queue.push(found);
        }
    }
    for (const found of recorded(walk, bound, main, folders)) seen.add(found);
    return seen;
}

/** The extensions of the files a build writes, which are never a dependency of the main. */
const GENERATED = [
    '.aux',
    '.log',
    '.fls',
    '.fdb_latexmk',
    '.toc',
    '.lof',
    '.lot',
    '.out',
    '.bbl',
    '.blg',
    '.bcf',
    '.idx',
    '.ind',
    '.ilg',
    '.glo',
    '.gls',
    '.glg',
    '.nav',
    '.snm',
    '.vrb',
    '.xdv',
    '.dvi'
];

/**
 * What changes when the main file's document changes: its closure without what the build writes.
 * The build's own files are the ones its `.fls` lists as written, everything in an output or
 * auxiliary folder that is not the main's own folder, the `.tex` file a literate main weaves, and
 * the generated kinds (and the main's own PDF) beside the main, so a build never changes its own
 * dependencies.
 */
export function dependenciesOf(bound: string, main: string, folders: string[] = []): string[] {
    const walk = createWalk();
    const wrote = written(walk, main, folders);
    const here = dirname(main);
    const stem = stemOf(basename(main));
    const apart = folders.map((folder) => resolve(folder)).filter((folder) => folder !== here);
    const woven = extname(main).toLowerCase() === '.tex' ? null : join(here, `${stem}.tex`);
    const generated = (file: string): boolean => {
        if (wrote.has(file) || apart.some((folder) => inside(file, folder))) return true;
        if (file === woven) return true;
        if (dirname(file) !== here) return false;
        const name = basename(file);
        if (name.endsWith('.synctex.gz')) return true;
        const kind = extname(name).toLowerCase();
        return kind === '.pdf' ? stemOf(name) === stem : GENERATED.includes(kind);
    };
    return [...closureIn(walk, bound, main, folders, null)].filter((file) => !generated(file));
}

/** The only main file in a file's folder, or null when it holds none or several. */
function onlyMain(walk: Walk, file: string): string | null {
    const dir = dirname(file);
    const found = mainsOf(walk, dir);
    const first = found.next();
    if (first.done === true || found.next().done !== true) return null;
    return join(dir, first.value);
}

/**
 * The main a root comment leads to, followed from `file`: the named file when it declares a class,
 * else where its own comment leads. Null when no comment leads to a main, CYCLE when the chain
 * returned to a file it passed.
 */
function followMagic(
    walk: Walk,
    bound: string,
    file: string,
    seen: Set<string>
): string | null | typeof CYCLE {
    if (seen.has(file)) return CYCLE;
    seen.add(file);
    const named = magicComments(headOf(walk, file)).get('root');
    if (named === undefined || named === '') return null;
    const target = fileInside(bound, resolve(dirname(file), named));
    if (target === null || !isTexSource(target)) return null;
    if (declaresClass(headOf(walk, target))) return target;
    return followMagic(walk, bound, target, seen);
}

/** The folders from a file's own folder up to the bound, nearest first. */
function foldersUp(bound: string, file: string): string[] {
    const found: string[] = [];
    for (let dir = dirname(file); inside(dir, bound); dir = dirname(dir)) {
        found.push(dir);
        if (dir === resolve(bound) || dirname(dir) === dir) break;
    }
    return found;
}

/** The nearest main whose closure holds the file, searched folder by folder up to the bound. */
function includedBy(walk: Walk, bound: string, file: string, folders: RootFolders): string | null {
    for (const dir of foldersUp(bound, file)) {
        for (const name of mainsOf(walk, dir)) {
            const real = realPath(join(dir, name));
            if (real === null) continue;
            if (closureIn(walk, bound, real, folders(real), file).has(file)) return real;
        }
    }
    return null;
}

/**
 * The main whose build wrote the PDF `pdf`, a real path inside the bound: the nearest main, from
 * the PDF's folder up to the bound, whose output folder holds a PDF of its name that is this one.
 * `outputOf` names the folder a main's PDF is written to.
 */
export function mainOfPdf(
    bound: string,
    pdf: string,
    outputOf: (main: string) => string
): string | null {
    const name = `${stemOf(basename(pdf))}.pdf`;
    const walk = createWalk();
    for (const dir of foldersUp(bound, pdf)) {
        for (const candidate of mainsOf(
            walk,
            dir,
            (one) => stemOf(one) === stemOf(basename(pdf))
        )) {
            const main = join(dir, candidate);
            const real = realPath(main);
            if (real === null) continue;
            if (realPath(join(outputOf(real), name)) === pdf) return real;
        }
    }
    return null;
}

/**
 * The main file `file` builds through and the rule that found it, or null when none can be told.
 * `bound` is the real path of the served root's folder and `file` the real path of a file inside
 * it. `folders` names the folders a main's build writes to, where its `.fls` may be read.
 */
export function rootOf(
    bound: string,
    file: string,
    folders: RootFolders = () => []
): RootFound | null {
    const walk = createWalk();
    const source = isTexSource(file);
    if (source) {
        const magic = followMagic(walk, bound, file, new Set());
        if (magic === CYCLE) return null;
        if (magic !== null) return { main: magic, how: 'magic' };
        if (declaresClass(headOf(walk, file))) return { main: file, how: 'self' };
    }
    const included = includedBy(walk, bound, file, folders);
    if (included !== null) return { main: included, how: 'included' };
    const only = onlyMain(walk, file);
    return only === null ? null : { main: only, how: 'folder' };
}
