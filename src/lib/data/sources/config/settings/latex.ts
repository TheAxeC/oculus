// Layer 1, data. The typed readers of the LaTeX settings of behavior.yml: the formatter and its
// paths, and what a build and its follow-ups are set by, the lists of tools and recipes among them.
// A plain key reads through settingReader (reader.ts); a list of records reads each row by the
// fields of its entry, a row the rule refuses left out and named as a problem.

import { byKey } from '../../../helpers/guards.ts';
import {
    AUTO_BUILDS,
    AUTO_CLEANS,
    FORMATTERS,
    RECIPE_DEFAULTS,
    REVERSE_SYNCTEX,
    TEXCOUNT_AUTORUNS,
    type AutoBuild,
    type AutoClean,
    type Formatter,
    type RecipeDefault,
    type ReverseSynctex,
    type TexcountAutorun
} from '../../../prose/latex.ts';
import { mapShape, readAs } from '../../../shapes/shapes.ts';
import type { FieldSpec } from '../catalog/options.ts';
import { valueProblem } from '../catalog/value-rule.ts';
import { heldAt, noRule, settingEntry, settingReader, type SettingProblem } from './reader.ts';

/** The LaTeX formatter of behavior.yml: the one Format Document runs, and each path. */
export type LatexFormatting = {
    formatter: Formatter;
    /** Each program's path; empty runs the program found on PATH. */
    paths: Record<Exclude<Formatter, 'none'>, string>;
};

/** Read `latex:`'s four formatter keys, each its default when it is missing or wrong. */
export function latexFormatting(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LatexFormatting {
    const read = settingReader(config, problems);
    const word = read.text('latex.formatter');
    const formatter = FORMATTERS.find((one) => one === word);
    if (formatter === undefined) throw noRule('latex.formatter');
    return {
        formatter,
        paths: {
            latexindent: read.text('latex.latexindent_path'),
            'tex-fmt': read.text('latex.tex_fmt_path'),
            badness: read.text('latex.badness_path')
        }
    };
}

/** The word `latex.auto_build` holds, which the catalog's choice keeps to the three words. */
function latexAutoBuild(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): AutoBuild {
    const word = settingReader(config, problems).text('latex.auto_build');
    const found = AUTO_BUILDS.find((one) => one === word);
    if (found === undefined) throw noRule('latex.auto_build');
    return found;
}

/** One tool of `latex.tools`: a program and its arguments, called by its name. */
export type LatexTool = { name: string; command: string; args: string[] };

/** One recipe of `latex.recipes`: the tools run one after the other, by tool name. */
export type LatexRecipe = { name: string; tools: string[] };

/** What a LaTeX build and its follow-ups are set by, every key of `latex:` but the formatter's. */
export type LatexBuilding = {
    recipes: LatexRecipe[];
    tools: LatexTool[];
    recipeDefault: RecipeDefault;
    outDir: string;
    auxDir: string;
    autoBuild: AutoBuild;
    autoBuildIntervalMs: number;
    cleanAndRetry: boolean;
    autoClean: AutoClean;
    synctexPath: string;
    reverseSynctex: ReverseSynctex;
    texcountAutorun: TexcountAutorun;
    contextMenu: boolean;
    texlabPath: string;
    unimathSymbols: boolean;
    includegraphicsPreview: boolean;
};

/** The word of a choice key, which the catalog's `values` already holds to the list's words. */
function wordOf<T extends string>(list: readonly T[], word: string, key: string): T {
    const found = list.find((one) => one === word);
    if (found === undefined) throw noRule(key);
    return found;
}

/** A field of a records entry: its spec, which the rows are read against. */
function fieldOf(
    fields: Record<string, FieldSpec> | undefined,
    name: string,
    key: string
): FieldSpec {
    const spec = fields === undefined ? undefined : byKey(fields, name);
    if (spec === undefined) throw noRule(key);
    return spec;
}

/** The rows a records entry holds: its list, or none when the key is missing or no list. */
function rowsOf(
    config: Record<string, unknown>,
    key: string,
    problems: SettingProblem[]
): unknown[] {
    const held = heldAt(config, key, problems);
    if (!held.present || held.value === null) return [];
    if (!Array.isArray(held.value)) {
        problems.push({ key, where: 'family' });
        return [];
    }
    return held.value;
}

/**
 * The rows of a list of records, each read by the entry's own fields: a row that is no map, or
 * whose `name` or any other field the rule refuses is not read and comes back as a problem at
 * `<key>[<index>]`, a row with no name is not read, and a row repeating a name an earlier row took
 * is not read either. `pick` takes a row's fields out of it, and `refuse` names a problem a read
 * row has beyond its fields' own, which leaves the row out.
 */
function recordRows<T extends { name: string }>(
    config: Record<string, unknown>,
    key: string,
    problems: SettingProblem[],
    pick: (row: Record<string, unknown>) => T,
    refuse: (one: T, at: string) => SettingProblem | null = () => null
): T[] {
    const entry = settingEntry(config, key);
    const named = new Set<string>();
    const kept: T[] = [];
    rowsOf(config, key, problems).forEach((raw, index) => {
        const at = `${key}[${index}]`;
        const row = readAs(mapShape, raw);
        if (row === null) {
            problems.push({ key: at, where: 'entry', problem: { kind: 'records' }, spec: entry });
            return;
        }
        for (const [name, spec] of Object.entries(entry.fields ?? {})) {
            const problem = valueProblem(spec, row[name]);
            if (problem !== null) {
                problems.push({ key: `${at}.${name}`, where: 'field', problem, spec });
                return;
            }
        }
        const one = pick(row);
        if (one.name === '') {
            problems.push({ key: at, where: 'unnamed' });
            return;
        }
        if (named.has(one.name)) {
            problems.push({ key, where: 'repeat', name: one.name });
            return;
        }
        const refused = refuse(one, at);
        if (refused !== null) {
            problems.push(refused);
            return;
        }
        named.add(one.name);
        kept.push(one);
    });
    return kept;
}

/** The text items of a field the rule has already held to a list of texts. */
function itemsAt(row: Record<string, unknown>, name: string): string[] {
    const held = row[name];
    return Array.isArray(held) ? held.filter((one) => typeof one === 'string') : [];
}

/** The text a field the rule has already held to a text holds. */
function textAt(row: Record<string, unknown>, name: string): string {
    const held = row[name];
    return typeof held === 'string' ? held : '';
}

/**
 * Read the tools of `latex.tools`, then the recipes of `latex.recipes` against them: a tool with
 * no program is not read, and neither is a recipe that names no tool or a tool the list does not
 * hold.
 */
function latexRecipes(
    config: Record<string, unknown>,
    problems: SettingProblem[]
): { recipes: LatexRecipe[]; tools: LatexTool[] } {
    const commandSpec = fieldOf(
        settingEntry(config, 'latex.tools').fields,
        'command',
        'latex.tools'
    );
    const tools = recordRows<LatexTool>(
        config,
        'latex.tools',
        problems,
        (row) => ({
            name: textAt(row, 'name'),
            command: textAt(row, 'command'),
            args: itemsAt(row, 'args')
        }),
        (tool, at) =>
            tool.command === ''
                ? {
                      key: `${at}.command`,
                      where: 'field',
                      problem: { kind: 'empty' },
                      spec: commandSpec
                  }
                : null
    );
    const known = tools.map((tool) => tool.name);
    const toolsSpec = fieldOf(
        settingEntry(config, 'latex.recipes').fields,
        'tools',
        'latex.recipes'
    );
    const recipes = recordRows<LatexRecipe>(
        config,
        'latex.recipes',
        problems,
        (row) => ({ name: textAt(row, 'name'), tools: itemsAt(row, 'tools') }),
        (recipe, at) =>
            recipe.tools.length > 0 && recipe.tools.every((name) => known.includes(name))
                ? null
                : {
                      key: `${at}.tools`,
                      where: 'field',
                      problem: { kind: 'choice', values: known },
                      spec: toolsSpec
                  }
    );
    return { recipes, tools };
}

/** Read every key of `latex:` a build, its follow-ups and its SyncTeX are set by. */
export function latexBuild(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LatexBuilding {
    const read = settingReader(config, problems);
    return {
        ...latexRecipes(config, problems),
        recipeDefault: wordOf(
            RECIPE_DEFAULTS,
            read.text('latex.recipe_default'),
            'latex.recipe_default'
        ),
        outDir: read.text('latex.out_dir'),
        auxDir: read.text('latex.aux_dir'),
        autoBuild: latexAutoBuild(config, problems),
        autoBuildIntervalMs: read.number('latex.auto_build_interval_ms'),
        cleanAndRetry: read.flag('latex.clean_and_retry'),
        autoClean: wordOf(AUTO_CLEANS, read.text('latex.auto_clean'), 'latex.auto_clean'),
        synctexPath: read.text('latex.synctex_path'),
        reverseSynctex: wordOf(
            REVERSE_SYNCTEX,
            read.text('latex.reverse_synctex'),
            'latex.reverse_synctex'
        ),
        texcountAutorun: wordOf(
            TEXCOUNT_AUTORUNS,
            read.text('latex.texcount_autorun'),
            'latex.texcount_autorun'
        ),
        contextMenu: read.flag('latex.context_menu'),
        texlabPath: read.text('latex.texlab_path'),
        unimathSymbols: read.flag('latex.unimath_symbols'),
        includegraphicsPreview: read.flag('latex.includegraphics_preview')
    };
}
