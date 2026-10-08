// Layer 2, server. What a build or a clean of a LaTeX main file asks the reader to approve before
// it runs code that is not the project's text: the latexmkrc files latexmk reads, and a recipe's
// weave tools. Both are approved once and asked again when they change, by the processes rule of
// DESIGN.md ("Approval"), and neither runs anything here.
//
// The latexmkrc set of a main file is every `.latexmkrc` and `latexmkrc` that is a file in the
// main's folder and in each folder above it up to the folder that bounds the request (the served
// root, or the hub), `$XDG_CONFIG_HOME/latexmk/latexmkrc` (`~/.config/latexmk/latexmkrc` when the
// variable is unset or empty) and `~/.latexmkrc`. Each file is listed under its folder's real path
// and its own name, with the SHA-256 of the bytes it leads to, so a link out of the root is hashed
// by what it reads and listed by where it sits. The text approved is the repository and the pairs
// in path order; a main with no such file asks nothing, and a file that cannot be read cannot be
// approved, so the step is refused with its path.
//
// A weave tool is a recipe tool whose program is none of the TeX programs, so `R CMD Sweave`,
// `quarto` and a program the reader adds ask like `Rscript`, `julia` and `pweave`. The recipe's
// tool entries are approved as they are written in `latex.tools`, with their placeholders, for the
// repository and the main's folder, so one approval covers every main of that folder and a changed
// entry asks again. Its text is a `command:` text with a `weave` member, which no chain's or debug
// launch's text has.

import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import type { LatexApproval } from '../../../../data/model/index.ts';
import type { LatexBuilding, LatexTool } from '../../../../data/sources/config/settings.ts';
import type { Step } from '../../../content/latex/recipes.ts';
import { realPath } from '../../../core/paths.ts';
import { isApproved, isConfigApproved } from '../../approvals/approvals.ts';

/** The names latexmk reads a configuration from in each folder. */
const RC_NAMES = ['.latexmkrc', 'latexmkrc'] as const;

/** The programs a recipe runs that are TeX's own, which ask no weave approval. */
const TEX_PROGRAMS = [
    'latexmk',
    'latex',
    'pdflatex',
    'xelatex',
    'lualatex',
    'bibtex',
    'biber',
    'makeindex',
    'makeglossaries',
    'tectonic'
];

/** One latexmkrc file of a set: where it sits and the SHA-256 of its bytes. */
type RcFile = { path: string; hash: string };

/** The set of a main, or the first file of it that cannot be read. */
type RcSet = { files: RcFile[] } | { unread: string };

/** Where the user-level files are: the home folder and the XDG configuration folder, if set. */
export type RcHomes = { home: string; xdg: string | undefined };

/** The homes of this process: `$HOME` as the platform resolves it and `$XDG_CONFIG_HOME`. */
export function processHomes(env: NodeJS.ProcessEnv = process.env): RcHomes {
    const xdg = env.XDG_CONFIG_HOME;
    return { home: homedir(), xdg: xdg === undefined || xdg === '' ? undefined : xdg };
}

/** The path a file is listed under: its folder's real path and its own name. */
function listedPath(folder: string, name: string): string {
    return join(realPath(folder) ?? folder, name);
}

/** The folders from `start` up to and including `bound`, or up to the top when it is not above. */
function foldersUp(start: string, bound: string): string[] {
    const folders: string[] = [];
    for (let at = start; ; at = dirname(at)) {
        folders.push(at);
        if (at === bound || dirname(at) === at) return folders;
    }
}

/**
 * Whether a file is at the path: a link to a file counts, a broken link counts too since latexmk
 * would try to read it, and a folder or any other kind of entry does not.
 */
function isFile(path: string): boolean {
    try {
        const found = lstatSync(path);
        if (!found.isSymbolicLink()) return found.isFile();
    } catch {
        return false;
    }
    try {
        return statSync(path).isFile();
    } catch {
        return true;
    }
}

/**
 * The latexmkrc files a latexmk run of `main` would read, in path order. `main` is the main file's
 * absolute path and `bound` the real path of the folder that bounds the request.
 */
function latexmkrcSet(main: string, bound: string, homes: RcHomes): RcSet {
    const start = realPath(dirname(main)) ?? dirname(main);
    const candidates: string[] = [];
    for (const folder of foldersUp(start, bound)) {
        for (const name of RC_NAMES) candidates.push(listedPath(folder, name));
    }
    const configHome = homes.xdg ?? join(homes.home, '.config');
    candidates.push(listedPath(join(configHome, 'latexmk'), 'latexmkrc'));
    candidates.push(listedPath(homes.home, '.latexmkrc'));
    const files: RcFile[] = [];
    for (const path of [...new Set(candidates)].sort()) {
        if (!isFile(path)) continue;
        try {
            files.push({
                path,
                hash: createHash('sha256').update(readFileSync(path)).digest('hex')
            });
        } catch {
            return { unread: path };
        }
    }
    return { files };
}

/** The text a latexmkrc set is approved by: the repository's real path and the pairs by path. */
function latexmkrcText(repo: string, files: RcFile[]): string {
    const ordered = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    return JSON.stringify([repo, ordered.map((one) => [one.path, one.hash])]);
}

/** Whether a program is none of TeX's own. */
function isWeave(tool: LatexTool): boolean {
    return !TEX_PROGRAMS.includes(basename(tool.command));
}

/** The tool entries of a recipe as written in `latex.tools`, in the recipe's order. */
function recipeTools(building: LatexBuilding, recipe: string): LatexTool[] {
    const names = building.recipes.find((one) => one.name === recipe)?.tools ?? [];
    return names.flatMap((name) => building.tools.filter((one) => one.name === name).slice(0, 1));
}

/** The text a recipe's tools are approved by, for a repository and the folder of the main. */
function weaveText(repo: string, folder: string, tools: LatexTool[]): string {
    const entries = tools.map((one) => ({ name: one.name, command: one.command, args: one.args }));
    return JSON.stringify({ repo, weave: [folder, entries] }, null, 1);
}

/** What a step is judged by. */
export type NeedsInput = {
    step: 'build' | 'clean';
    /** The main's name as the request gave it, and its absolute path. */
    main: string;
    path: string;
    /** The real path of the folder that bounds the request. */
    bound: string;
    building: LatexBuilding;
    /** The recipe a build runs, empty for a clean, and the commands the step would run. */
    recipe: string;
    steps: Step[];
    approvals: string;
    homes: RcHomes;
};

/** One text a step is approved by, the lines the reader is shown for it, and whether it is held. */
type Item = { text: string; lines: string[]; approved: boolean };

/** The two texts a step is approved by; a null one is not needed by the step. */
export type Items = { latexmkrc: Item | null; weave: (Item & { recipe: string }) | null };

/** Whether a command is a latexmk run, which reads the latexmkrc set. */
function runsLatexmk(steps: Step[]): boolean {
    return steps.some((one) => basename(one.program) === 'latexmk');
}

/** The texts the step is approved by, or the latexmkrc file it cannot read. */
export function latexItems(input: NeedsInput): Items | { unread: string } {
    const { step, bound, approvals } = input;
    let latexmkrc: Item | null = null;
    if (step === 'clean' || runsLatexmk(input.steps)) {
        const set = latexmkrcSet(input.path, bound, input.homes);
        if ('unread' in set) return set;
        if (set.files.length > 0) {
            const text = latexmkrcText(bound, set.files);
            latexmkrc = {
                text,
                lines: set.files.map((one) => one.path),
                approved: isConfigApproved(approvals, 'latexmkrc', text)
            };
        }
    }
    let weave: Items['weave'] = null;
    const tools = step === 'build' ? recipeTools(input.building, input.recipe) : [];
    const weaving = tools.filter(isWeave);
    if (weaving.length > 0) {
        const folder = realPath(dirname(input.path)) ?? dirname(input.path);
        const text = weaveText(bound, folder, tools);
        weave = {
            text,
            lines: weaving.map((one) => [one.command, ...one.args].join(' ')),
            approved: isApproved(approvals, text),
            recipe: input.recipe
        };
    }
    return { latexmkrc, weave };
}

/**
 * What the step still needs approved: the answer the page shows, `{ unread }` for a latexmkrc the
 * step cannot read, or null when nothing is missing.
 */
export function latexNeeds(input: NeedsInput): { ask: LatexApproval } | { unread: string } | null {
    const items = latexItems(input);
    if ('unread' in items) return items;
    const rc = items.latexmkrc !== null && !items.latexmkrc.approved ? items.latexmkrc : null;
    const weave = items.weave !== null && !items.weave.approved ? items.weave : null;
    if (rc === null && weave === null) return null;
    return {
        ask: {
            main: input.main,
            step: input.step,
            latexmkrc: rc?.lines ?? [],
            weave: weave === null ? null : { recipe: weave.recipe, tools: weave.lines },
            texts: { latexmkrc: rc?.text ?? null, weave: weave?.text ?? null }
        }
    };
}
