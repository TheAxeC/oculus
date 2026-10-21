// Layer 1, data. What is wrong with the `themes:` list, the `code_theme:` option and the
// `code_themes:` lists that the page cannot put right, as findings of the file each was read from
// (the open workspace file when its `settings:` sets it, else config/defaults/appearance.yml). Each
// row of `themes:` names the glyph drawn before its words; a row whose glyph is missing, empty or
// not a name of config/catalogs/glyphs.yml is still offered, with its words alone, and a second row
// naming a theme already listed is not offered at all, since the choice keys its entries by the
// name. A row whose `group` is there and is not words is drawn before the groups, with the rows
// that carry none. state/shared/words/appearance.ts draws by the same rules, so a row the finding
// names is drawn as the finding says.
//
// The code themes are read from `code_themes:` alone (data/helpers/editor/code-themes.ts). A
// `code_theme:` that is neither `tokens`, the class of a VS Code theme nor the id of a Shiki theme
// the choice offers (case-sensitive) is named, since the editor then colours code from the tokens,
// and so is a `code_themes.vscode` that is no list or holds a row with no class, a row repeating a
// class, a row whose class is `tokens` or a row whose class has no TextMate rules in
// src/lib/themes/vscode-rules.json, and a `code_themes.shiki` that is no list or holds a row with
// no id, a row repeating an id or a row whose id Shiki does not bundle, since such a row makes no
// code theme.
//
// An `app_theme:` that names no theme of the rows and no theme of an app is named, since a window
// of the desktop app whose `theme` names no theme it can draw then starts on the first theme.

import {
    isCodeTheme,
    shikiProblems,
    vscodeProblems,
    type ShikiProblem,
    type VscodeProblem
} from '../../../helpers/editor/code-themes.ts';
import { splitAppChoice } from '../../../helpers/files/apps/choices.ts';
import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import type { Finding } from '../../../model/index.ts';
import { vscodeRuleIds } from '../../../places/code-rules.ts';
import { filledText, itemsShape, mapShape, readAs } from '../../../shapes/shapes.ts';
import { glyphCatalog } from '../catalogs.ts';
import { keyFile, type ConfigWhere } from '../merge/merge.ts';
import { textCatalog } from '../merge/text.ts';

/** The key and the words of the finding over one problem of `code_themes.vscode`. */
function vscodeFinding(
    problem: VscodeProblem,
    catalog: TextCatalog
): { key: string; message: string } {
    const key = problem.at < 0 ? 'code_themes.vscode' : `code_themes.vscode[${problem.at}]`;
    return { key, message: vscodeMessage(problem, catalog) };
}

/** The words of the finding over one problem of `code_themes.vscode`. */
function vscodeMessage(problem: VscodeProblem, catalog: TextCatalog): string {
    switch (problem.kind) {
        case 'list':
            return findingText(catalog, 'findings.appearance.code_themes_vscode_list');
        case 'class':
            return findingText(catalog, 'findings.appearance.code_themes_vscode_class', problem.at);
        case 'repeated':
            return findingText(
                catalog,
                'findings.appearance.code_themes_vscode_repeated',
                problem.id
            );
        case 'tokens':
            return findingText(catalog, 'findings.appearance.code_themes_vscode_tokens');
        default:
            return findingText(catalog, 'findings.appearance.code_themes_vscode_rules', problem.id);
    }
}

/** The key and the words of the finding over one problem of `code_themes.shiki`. */
function shikiFinding(
    problem: ShikiProblem,
    catalog: TextCatalog
): { key: string; message: string } {
    const key = problem.at < 0 ? 'code_themes.shiki' : `code_themes.shiki[${problem.at}]`;
    return { key, message: shikiMessage(problem, catalog) };
}

/** The words of the finding over one problem of `code_themes.shiki`. */
function shikiMessage(problem: ShikiProblem, catalog: TextCatalog): string {
    switch (problem.kind) {
        case 'list':
            return findingText(catalog, 'findings.appearance.code_themes_shiki_list');
        case 'id':
            return findingText(catalog, 'findings.appearance.code_themes_shiki_id', problem.at);
        case 'repeated':
            return findingText(
                catalog,
                'findings.appearance.code_themes_shiki_repeated',
                problem.id
            );
        case 'unbundled':
            return findingText(
                catalog,
                'findings.appearance.code_themes_shiki_unbundled',
                problem.id
            );
    }
}

/**
 * The findings over the code theme keys: one for a `code_theme:` that is no code theme, one per
 * problem of `code_themes.vscode` and one per problem of `code_themes.shiki`. An absent
 * `code_theme:` says nothing.
 */
function codeFindings(where: ConfigWhere, config: Record<string, unknown>): Finding[] {
    const catalog = textCatalog(config);
    const ruled = new Set(vscodeRuleIds());
    const file = keyFile(where, 'code_themes');
    const findings: Finding[] = [];
    if (Object.hasOwn(config, 'code_theme') && !isCodeTheme(config.code_theme, config, ruled)) {
        findings.push({
            file: keyFile(where, 'code_theme'),
            key: 'code_theme',
            message: findingText(
                catalog,
                'findings.appearance.code_theme',
                JSON.stringify(config.code_theme)
            )
        });
    }
    for (const problem of vscodeProblems(config, ruled)) {
        findings.push({ file, ...vscodeFinding(problem, catalog) });
    }
    for (const problem of shikiProblems(config)) {
        findings.push({ file, ...shikiFinding(problem, catalog) });
    }
    return findings;
}

/**
 * The finding for an `app_theme:` that names no theme of the rows `names` holds, or is not words: a
 * window of the desktop app whose `theme` names no theme it can draw then starts on the first
 * theme, by the rule of data/helpers/editor/start-theme.ts. The saved name of an app's theme is a
 * value the option takes, drawn when its app is approved and enabled and its file resolves, and
 * says nothing here. An absent `app_theme:` says nothing.
 */
function appThemeFinding(
    where: ConfigWhere,
    config: Record<string, unknown>,
    names: ReadonlySet<string>
): Finding[] {
    const value = config.app_theme;
    if (!Object.hasOwn(config, 'app_theme')) return [];
    if (typeof value === 'string' && (names.has(value) || splitAppChoice(value) !== null))
        return [];
    return [
        {
            file: keyFile(where, 'app_theme'),
            key: 'app_theme',
            message: findingText(
                textCatalog(config),
                'findings.appearance.app_theme',
                JSON.stringify(value)
            )
        }
    ];
}

/**
 * The findings over the code theme keys, then one finding per theme row whose glyph the choice
 * cannot draw, per row whose group is not words and per row that repeats a theme's name, then the
 * one over `app_theme:`. A row with no name is dropped by the choice and says nothing here, and a
 * config with no `themes:` list has no row to report.
 */
export function themeFindings(where: ConfigWhere, config: Record<string, unknown>): Finding[] {
    const file = keyFile(where, 'themes');
    const catalog = textCatalog(config);
    const findings: Finding[] = [];
    const rows = readAs(itemsShape, config.themes) ?? [];
    const glyphs = glyphCatalog(config);
    const seen = new Set<string>();
    rows.forEach((raw, index) => {
        const row = readAs(mapShape, raw);
        const name = filledText(row?.name);
        if (row === null || name === undefined) return;
        const key = `themes[${index}]`;
        const said = (message: string): void => {
            findings.push({ file, key, message });
        };
        if (seen.has(name)) {
            said(findingText(catalog, 'findings.appearance.repeated', name));
            return;
        }
        seen.add(name);
        const glyph = filledText(row.glyph);
        if (glyph === undefined) said(findingText(catalog, 'findings.appearance.glyph', name));
        else if (!Object.hasOwn(glyphs, glyph)) {
            said(findingText(catalog, 'findings.appearance.glyph_unknown', name));
        }
        if (Object.hasOwn(row, 'group') && filledText(row.group) === undefined) {
            said(findingText(catalog, 'findings.appearance.group', name));
        }
    });
    return [...codeFindings(where, config), ...findings, ...appThemeFinding(where, config, seen)];
}
