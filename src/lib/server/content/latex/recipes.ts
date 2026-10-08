// Layer 2, server. What one LaTeX build runs: the recipe chosen for a main file, its tools with the
// placeholders filled in, and the folders it writes to. The recipes and tools are `latex.recipes`
// and `latex.tools` of config/behavior.yml as LaTeX Workshop's `latex.recipes` and `latex.tools`
// read, so a build here is the one LaTeX Workshop would run.
//
// The placeholders are LaTeX Workshop's: `%DOC%` is the main's absolute path without its extension,
// `%DOC_EXT%` with it, `%DOCFILE%` and `%DOCFILE_EXT%` its file name without and with the
// extension, `%DIR%` its absolute folder, and `%OUTDIR%` and `%AUXDIR%` the two folders a build
// writes to. The output folder and the auxiliary folder are the settings `latex.out_dir` and
// `latex.aux_dir` resolved from the main's folder; one that leaves the folder the root serves is
// refused, so no build writes outside it.
//
// A recipe is chosen in this order: the one the page asked for, the one a `% !LW recipe = <name>`
// comment names, under `latex.recipe_default` `last_used` the one the page used last, the recipe of
// the file's kind when it is a literate source, a `% !TEX program = xelatex | lualatex` comment's
// `latexmk (xelatex)` or `latexmk (lualatex)` recipe, and the first recipe. A name no recipe has is
// a refusal and never another recipe in its place.
//
// A recipe is run as one terminal line, so every program and every argument of it is one
// `shellWord`, since tools come from the configuration (pty/routes.ts builds the line). The
// programs a recipe needs are looked up on PATH first: its tools' programs, and the engine a
// latexmk tool is switched to, so a missing engine is refused before any terminal starts.

import { basename, dirname, join, relative, resolve } from 'node:path';
import { stemOf } from '../../../data/prose/latex.ts';
import type {
    LatexBuilding,
    LatexRecipe,
    LatexTool
} from '../../../data/sources/config/settings.ts';
import { inside, realPath } from '../../core/paths.ts';
import type { Folders } from '../latex.ts';
import { magicComments } from './reader.ts';

/** The recipe a literate source builds with, by the source's extension in lower case. */
const LITERATE_RECIPES: Record<string, string> = {
    '.rnw': 'Compile Rnw files',
    '.jnw': 'Compile Jnw files',
    '.pnw': 'Compile Pnw files'
};

/** The recipe a `% !TEX program` comment picks, by the program it names. */
const PROGRAM_RECIPES: Record<string, string> = {
    xelatex: 'latexmk (xelatex)',
    lualatex: 'latexmk (lualatex)'
};

/** The program a latexmk switch builds with. */
const ENGINE_SWITCHES: Record<string, string | undefined> = {
    '-pdf': 'pdflatex',
    '-pdfxe': 'xelatex',
    '-xelatex': 'xelatex',
    '-pdflua': 'lualatex',
    '-lualatex': 'lualatex'
};

/** The TeX Live package a program comes in, which `tlmgr install` takes. */
const TEXLIVE_PACKAGES: Record<string, string | undefined> = {
    latexmk: 'latexmk',
    pdflatex: 'pdftex',
    xelatex: 'xetex',
    lualatex: 'luatex',
    bibtex: 'bibtex',
    biber: 'biber',
    checkcites: 'checkcites',
    texdoc: 'texdoc',
    texcount: 'texcount'
};

/** The Homebrew formula a program comes in. */
const BREW_FORMULAE: Record<string, string | undefined> = {
    Rscript: 'r',
    julia: 'julia',
    tectonic: 'tectonic'
};

/** A build the page asked for: the recipe by name and the one it used last. */
export type RecipeAsk = { recipe?: string; last?: string };

/**
 * A refusal before any terminal starts: a word of TERMINAL_REFUSALS and the names its sentence
 * needs.
 */
export type Refused = {
    refused: 'latex-program' | 'latex-recipe' | 'latex-no-recipe' | 'latex-folder';
    names: string[];
};

/** One command of a recipe, its placeholders filled: the program and its arguments. */
export type Step = { program: string; args: string[] };

/** What a build runs: the recipe's name, its commands in order and the folders it writes to. */
export type Plan = { recipe: string; steps: Step[]; folders: Folders };

/**
 * Fill the placeholders of a text from a table of their values; any other `%` text stays as it is.
 */
function fill(text: string, values: Record<string, string>): string {
    return text.replace(
        /%(DOC_EXT|DOCFILE_EXT|DOCFILE|DOC|DIR|OUTDIR|AUXDIR)%/g,
        (whole, name: string) => values[name] ?? whole
    );
}

/** The placeholders that depend on the main file alone. */
function mainValues(main: string): Record<string, string> {
    const dir = dirname(main);
    const file = basename(main);
    return {
        DOC: join(dir, stemOf(file)),
        DOC_EXT: main,
        DOCFILE: stemOf(file),
        DOCFILE_EXT: file,
        DIR: dir
    };
}

/**
 * The output and auxiliary folders of a main file, or the setting that leaves `bound`. A value is
 * resolved from the main's folder, and the place it names is judged by its real spelling: the
 * main's real folder with the value's path from it, and the folder itself once it exists and its
 * links are followed, must both lie inside the real `bound`.
 */
export function foldersOf(
    main: string,
    bound: string,
    building: Pick<LatexBuilding, 'outDir' | 'auxDir'>
): Folders | Refused {
    const values = mainValues(main);
    const from = dirname(main);
    const out = resolve(from, fill(building.outDir, values));
    const aux = resolve(from, fill(building.auxDir, { ...values, OUTDIR: out }));
    const home = realPath(from) ?? from;
    const root = realPath(bound) ?? bound;
    for (const [key, folder] of [
        ['latex.out_dir', out],
        ['latex.aux_dir', aux]
    ] as const) {
        const real = realPath(folder);
        const there = resolve(home, relative(from, folder));
        if (!inside(there, root) || (real !== null && !inside(real, root))) {
            return { refused: 'latex-folder', names: [key] };
        }
    }
    return { out, aux };
}

/** The recipe of the given name, or undefined. */
function recipeNamed(building: LatexBuilding, name: string | undefined): LatexRecipe | undefined {
    return name === undefined ? undefined : building.recipes.find((one) => one.name === name);
}

/**
 * The recipe a build of `main` runs. `text` is the head of the file, which its magic comments are
 * read from. A name that no recipe has, asked for or written in the file, is refused.
 */
function chooseRecipe(
    building: LatexBuilding,
    main: string,
    text: string,
    ask: RecipeAsk = {}
): LatexRecipe | Refused {
    if (building.recipes.length === 0) return { refused: 'latex-no-recipe', names: [] };
    const comments = magicComments(text);
    for (const named of [ask.recipe, comments.get('recipe')]) {
        if (named === undefined) continue;
        return recipeNamed(building, named) ?? { refused: 'latex-recipe', names: [named] };
    }
    const dot = main.lastIndexOf('.');
    const kind = LITERATE_RECIPES[dot < 0 ? '' : main.slice(dot).toLowerCase()];
    const program = PROGRAM_RECIPES[comments.get('program')?.toLowerCase() ?? ''];
    const last = building.recipeDefault === 'last_used' ? ask.last : undefined;
    const programRecipe = building.recipeDefault === 'first' ? program : undefined;
    return (
        recipeNamed(building, last) ??
        recipeNamed(building, kind) ??
        recipeNamed(building, programRecipe) ??
        building.recipes[0]
    );
}

/** Whether a command is a latexmk run, which `-g` and the engine lookup apply to. */
function isLatexmk(tool: LatexTool): boolean {
    return basename(tool.command) === 'latexmk';
}

/**
 * The commands of a recipe for one main file. `force` adds latexmk's `-g` to each latexmk tool,
 * which makes it build what it believes is up to date.
 */
function stepsOf(
    building: LatexBuilding,
    recipe: LatexRecipe,
    main: string,
    folders: Folders,
    force: boolean
): Step[] {
    const values = { ...mainValues(main), OUTDIR: folders.out, AUXDIR: folders.aux };
    return recipe.tools.flatMap((name) => {
        const tool = building.tools.find((one) => one.name === name);
        if (tool === undefined) return [];
        const args = tool.args.map((arg) => fill(arg, values));
        return [
            {
                program: fill(tool.command, values),
                args: force && isLatexmk(tool) ? ['-g', ...args] : args
            }
        ];
    });
}

/** The command that removes what a build left, keeping the PDF and the SyncTeX file. */
export function cleanStep(main: string, folders: Folders): Step {
    const values = mainValues(main);
    return {
        program: 'latexmk',
        args: ['-c', `-outdir=${folders.out}`, `-auxdir=${folders.aux}`, values.DOC]
    };
}

/** The programs a step needs: its own, and the engine of a latexmk run. */
function programsOf(step: Step): string[] {
    const engine = step.args.map((arg) => ENGINE_SWITCHES[arg]).find((one) => one !== undefined);
    return basename(step.program) === 'latexmk' && engine !== undefined
        ? [step.program, engine]
        : [step.program];
}

/** The refusal for a program that is not found, naming where it comes from when that is known. */
function missing(program: string): Refused {
    const name = basename(program);
    const texlive = TEXLIVE_PACKAGES[name];
    if (texlive !== undefined)
        return { refused: 'latex-program', names: [name, 'texlive', texlive] };
    const brew = BREW_FORMULAE[name];
    if (brew !== undefined) return { refused: 'latex-program', names: [name, 'brew', brew] };
    return { refused: 'latex-program', names: [name, 'none', ''] };
}

/**
 * The first program of the steps that `found` does not find, as a refusal, or null when every one
 * is there.
 */
export function missingProgram(steps: Step[], found: (program: string) => boolean): Refused | null {
    for (const step of steps) {
        const lost = programsOf(step).find((program) => !found(program));
        if (lost !== undefined) return missing(lost);
    }
    return null;
}

/** The plan of a build, or the refusal that stops it before a terminal starts. */
export function planOf(
    building: LatexBuilding,
    request: {
        main: string;
        bound: string;
        text: string;
        ask: RecipeAsk;
        force: boolean;
        found: (program: string) => boolean;
    }
): Plan | Refused {
    const folders = foldersOf(request.main, request.bound, building);
    if ('refused' in folders) return folders;
    const recipe = chooseRecipe(building, request.main, request.text, request.ask);
    if ('refused' in recipe) return recipe;
    const steps = stepsOf(building, recipe, request.main, folders, request.force);
    const lost = missingProgram(steps, request.found);
    if (lost !== null) return lost;
    return { recipe: recipe.name, steps, folders };
}
