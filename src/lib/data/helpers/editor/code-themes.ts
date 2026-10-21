// Layer 1, data. The code themes the editors can colour code with, which the page and the server
// read alike: the VS Code themes of the `code_themes.vscode` list and the Shiki themes of the
// `code_themes.shiki` list, each with its row's words and group. The UI themes of the `themes:`
// list are another option and are read by start-theme.ts beside this module and by
// state/shared/words/appearance.ts; nothing here reads them.
//
// The code themes are `tokens`, which takes the UI theme's own code tokens, the VS Code themes by
// their classes, and the Shiki themes by their ids. Both lists are merged rows (oculus's rows of
// config/defaults/appearance.yml with the workspace file's `settings:` laid over them, the VS Code
// rows by `class` and the Shiki rows by `id`, a row taken out with `removed: true`). A VS Code row
// makes a code theme when its class is a key of the `themes` map of
// src/lib/themes/vscode-rules.json, the TextMate rules the editor colours code with. The caller
// hands in those keys (`ruled`): the server reads the file (data/places/code-rules.ts) and the page
// takes the keys its first load and the `config` channel carry beside the merged config. A row
// whose class has no rules, a row with no class, a row repeating a class an earlier row gave and a
// row whose class is `tokens` make no code theme (`vscodeProblems` names each). A Shiki row makes a
// code theme when its id is a theme Shiki bundles, read from Shiki's `bundledThemesInfo`, whose
// entries each carry their theme file as a dynamic import, so reading the ids loads no theme file.
// A row with no id, a row repeating an id an earlier row gave and a row whose id Shiki does not
// bundle make no code theme (`shikiProblems` names each). A Shiki theme with no row is not offered,
// and a Shiki row whose id a VS Code theme's class takes is left out, so each id names one code
// theme.
//
// Readers of the code themes: the findings over `code_theme:` and `code_themes:`
// (data/sources/config/sections/themes.ts), the write check and the schema of that key, the
// appearance store and the saved pick, the Settings view's menu of themes, and the converter's
// check of the VS Code rows (utils/migrations/convert-vscode-themes.ts).

import { bundledThemesInfo } from 'shiki/themes';
import { fields, isMap } from '../guards.ts';

/** The value that takes the syntax colours from the UI theme's own code tokens. */
export const CODE_TOKENS = 'tokens';

/** The key of the list of VS Code code themes under `code_themes:`. */
const VSCODE_KEY = 'vscode';

/** The key of the list of Shiki code themes under `code_themes:`. */
const SHIKI_KEY = 'shiki';

/**
 * One code theme as the menu lists it: the id saved, the words shown, the group it is drawn under
 * and whether it is a VS Code theme. Its words and group are its row's: the class or the id for a
 * row with no label (Shiki's own name of the theme for a Shiki row), an empty group for a row with
 * none.
 */
export type CodeThemeInfo = { id: string; label: string; vscode: boolean; group: string };

/** A row of `code_themes.vscode` or `code_themes.shiki` read in its list. */
type CodeRow = { id: string; label: string; group: string };

/**
 * What is wrong with the `code_themes.vscode` value: `list` for a value that is no list, and for a
 * row, `class` for one with no class, `repeated` for one repeating a class an earlier row gave,
 * `tokens` for one whose class is `tokens` and `rules` for one whose class has no rules. `at` is
 * the row's place in the list and `id` its class, both empty for `list`.
 */
export type VscodeProblem = {
    kind: 'list' | 'class' | 'repeated' | 'tokens' | 'rules';
    at: number;
    id: string;
};

/**
 * What is wrong with the `code_themes.shiki` value: `list` for a value that is no list, and for a
 * row, `id` for one with no id, `repeated` for one repeating an id an earlier row gave and
 * `unbundled` for one whose id Shiki does not bundle. `at` is the row's place in the list and `id`
 * its id, both empty for `list`.
 */
export type ShikiProblem = {
    kind: 'list' | 'id' | 'repeated' | 'unbundled';
    at: number;
    id: string;
};

/** The ids of the themes Shiki bundles, with Shiki's own name of each. */
const BUNDLED = new Map(bundledThemesInfo.map((info) => [info.id, info.displayName]));

/** A value that is a string holding something, which a row's class, id, label or group is. */
function filled(value: unknown): string | undefined {
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * The rows of `code_themes.vscode` read in their order, before their classes are held to the rules:
 * each row with a class, the class its id, its label (its class when it has none) and its group,
 * and what is wrong with the value and with each row left out. A class an earlier row gave is
 * listed once, as that row gives it, and a row whose class is `tokens` makes no code theme, since
 * that value takes the UI theme's own code tokens. An absent key reads as no row and no problem.
 */
function vscodeRows(config: Record<string, unknown>): {
    rows: CodeRow[];
    problems: VscodeProblem[];
} {
    const lists = fields(config.code_themes);
    if (!Object.hasOwn(lists, VSCODE_KEY)) return { rows: [], problems: [] };
    const value = lists[VSCODE_KEY];
    if (!Array.isArray(value)) return { rows: [], problems: [{ kind: 'list', at: -1, id: '' }] };
    const rows: CodeRow[] = [];
    const problems: VscodeProblem[] = [];
    value.forEach((raw: unknown, at) => {
        const row = isMap(raw) ? raw : {};
        const id = filled(row.class);
        if (id === undefined) problems.push({ kind: 'class', at, id: '' });
        else if (id === CODE_TOKENS) problems.push({ kind: 'tokens', at, id });
        else if (rows.some((one) => one.id === id)) problems.push({ kind: 'repeated', at, id });
        else rows.push({ id, label: filled(row.label) ?? id, group: filled(row.group) ?? '' });
    });
    return { rows, problems };
}

/**
 * Everything wrong with the `code_themes.vscode` value against the classes `ruled` holds rules
 * for: the problems of the list and its rows, then one `rules` problem per row whose class has
 * none, in the order of the list.
 */
export function vscodeProblems(
    config: Record<string, unknown>,
    ruled: ReadonlySet<string>
): VscodeProblem[] {
    const read = vscodeRows(config);
    const value = fields(config.code_themes)[VSCODE_KEY];
    const places = Array.isArray(value) ? value : [];
    const unruled = read.rows
        .filter((row) => !ruled.has(row.id))
        .map((row): VscodeProblem => ({
            kind: 'rules',
            at: places.findIndex((raw: unknown) => isMap(raw) && raw.class === row.id),
            id: row.id
        }));
    return [...read.problems, ...unruled].sort((a, b) => a.at - b.at);
}

/**
 * The rows of `code_themes.shiki` read in their order: each row whose id Shiki bundles, with its
 * label (Shiki's own name of the theme when it has none) and its group, and what is wrong with the
 * value and with each row left out. An id an earlier row gave is listed once, as that row gives it.
 * An absent key reads as no row and no problem.
 */
function shikiRows(config: Record<string, unknown>): {
    rows: CodeRow[];
    problems: ShikiProblem[];
} {
    const lists = fields(config.code_themes);
    if (!Object.hasOwn(lists, SHIKI_KEY)) return { rows: [], problems: [] };
    const value = lists[SHIKI_KEY];
    if (!Array.isArray(value)) return { rows: [], problems: [{ kind: 'list', at: -1, id: '' }] };
    const rows: CodeRow[] = [];
    const problems: ShikiProblem[] = [];
    value.forEach((raw: unknown, at) => {
        const row = isMap(raw) ? raw : {};
        const id = filled(row.id);
        const named = id === undefined ? undefined : BUNDLED.get(id);
        if (id === undefined) problems.push({ kind: 'id', at, id: '' });
        else if (rows.some((one) => one.id === id)) problems.push({ kind: 'repeated', at, id });
        else if (named === undefined) problems.push({ kind: 'unbundled', at, id });
        else rows.push({ id, label: filled(row.label) ?? named, group: filled(row.group) ?? '' });
    });
    return { rows, problems };
}

/** Everything wrong with the `code_themes.shiki` value, in the order of the list. */
export function shikiProblems(config: Record<string, unknown>): ShikiProblem[] {
    return shikiRows(config).problems;
}

/**
 * Every code theme but `tokens`: the VS Code themes of the rows whose class `ruled` holds rules
 * for, in the order of their rows, then the Shiki themes of the rows whose id Shiki bundles and no
 * VS Code theme's class takes, in the order of their rows, so each id names one code theme.
 */
export function codeThemeInfo(
    config: Record<string, unknown>,
    ruled: ReadonlySet<string>
): CodeThemeInfo[] {
    const vscode = vscodeRows(config)
        .rows.filter((row) => ruled.has(row.id))
        .map((row): CodeThemeInfo => ({ ...row, vscode: true }));
    const shiki = shikiRows(config)
        .rows.filter((row) => !vscode.some((one) => one.id === row.id))
        .map((row): CodeThemeInfo => ({ ...row, vscode: false }));
    return [...vscode, ...shiki];
}

/** The id of every code theme but `tokens`, in the order codeThemeInfo gives them. */
export function codeThemeIds(
    config: Record<string, unknown>,
    ruled: ReadonlySet<string>
): string[] {
    return codeThemeInfo(config, ruled).map((info) => info.id);
}

/** Whether a value is a code theme: `tokens`, a VS Code theme's class or a Shiki theme's id. */
export function isCodeTheme(
    value: unknown,
    config: Record<string, unknown>,
    ruled: ReadonlySet<string>
): value is string {
    return (
        typeof value === 'string' &&
        (value === CODE_TOKENS || codeThemeIds(config, ruled).includes(value))
    );
}
