// Layer 1, data. The vocabulary, glyph and icon catalogs read out of the merged map, and the
// findings over them: an icon name no installed set holds, a key behavior.yml holds that the
// options catalog names no option under, a retired behavior key, a setting of
// behavior.yml whose value the options catalog's rule refuses, and a key or row of local.yml that
// fails to read.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { parse } from 'yaml';
import { z } from 'zod';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { isMap } from '../../helpers/guards.ts';
import { MAC_TARGET, type Finding } from '../../model/index.ts';
import { standInShape } from '../../shapes/catalog-files/glyphs.ts';
import { mapOfShape, mapShape, readAs, readOr } from '../../shapes/shapes.ts';
import { mustBe } from './catalog/value-words.ts';
import { readEditorOptions, type EditorProblem } from './editor-options.ts';
import { configDir, engineFile } from './folder.ts';
import type { LocalProblem } from './local.ts';
import type { MachineProblem } from './machine.ts';
import { CATALOGS_DIR, keyFile, keyPlace, type ConfigWhere } from './merge/merge.ts';
import { TEXT_KEY, textCatalog } from './merge/text.ts';
import { catalogOf } from './catalog/options.ts';
import { closedPaths } from './settings/machine.ts';
import { settingProblems } from './settings/problems.ts';
import type { RowIssue } from './settings/rows/check.ts';
import { focusFindings } from './sections/focus.ts';

/**
 * The keys of the merged config the client state installs before the page renders: the theme
 * list, the theme, the theme a desktop window starts on, the text size, the terminal themes' three
 * settings, the wallpaper, the CRT overlay, the code theme and the lists that shape its choice, the
 * pane strip's three settings and the status bar's values state/shared/words/appearance.ts reads.
 * `themes`, `theme`, `app_theme`, `text_size`, `rice`, `wallpaper`, `crt`, `code_theme`,
 * `code_themes`, `file_icons`, `show_tabs`, `editor_actions`, `wrap_tabs` and `terminal` are
 * options of the appearance defaults file, and `status_bar` of the behavior defaults file. The
 * colours and the words of the stages, forms, chips and statuses state/shared/words/tones.ts reads
 * are each hub's own and reach the page in the vocabulary of every hub (`hubVocabs` of
 * data/index.ts), with the research domains and the venue and dataset themes of its registry
 * files.
 */
export const VOCAB_KEYS = [
    'themes',
    'theme',
    'app_theme',
    'text_size',
    'rice',
    'status_bar',
    'wallpaper',
    'crt',
    'code_theme',
    'code_themes',
    'file_icons',
    'show_tabs',
    'editor_actions',
    'wrap_tabs',
    'terminal'
];

/**
 * The slice of the merged config the appearance store needs, shipped as the page's data beside the
 * catalog, the glyphs and every hub's vocabulary: the keys above, `code_themes` among them, which
 * holds the VS Code code themes. The whole merged config goes over the `config` channel afterwards
 * and setAppearance reads the same keys out of it, so this is the first load only and carries no
 * more than those keys.
 */
export function vocabCatalog(config: Record<string, unknown>): Record<string, unknown> {
    const vocab: Record<string, unknown> = {};
    for (const key of VOCAB_KEYS) if (config[key] !== undefined) vocab[key] = config[key];
    return vocab;
}

/**
 * The glyph vocabulary held in the merged config's `glyphs` key: each glyph name with the ASCII
 * stand-in a terminal theme draws for it, flat. It ships with the catalog as the page's data and is
 * pushed on the `config` channel afterwards, so a glyph is edited in config/catalogs/glyphs.yml and
 * nowhere else. A value that is not a string is dropped rather than thrown on: the map is a
 * vocabulary and one bad entry is not worth losing the rest, and iconFindings reports it.
 */
export function glyphCatalog(config: Record<string, unknown>): Record<string, string> {
    return readOr(stringMapShape, config.glyphs, {});
}

/**
 * The icon map held in the merged config's `icons` key: one icon name per glyph name, flat. It is
 * the names alone; iconSet() is what turns them into the drawing the page is given.
 */
export function iconCatalog(config: Record<string, unknown>): Record<string, string> {
    return readOr(stringMapShape, config.icons, {});
}

/**
 * The file the icon package ships for one icon name, or nothing when it ships none. The package is
 * resolved the way an import of it would be, so a hoisted install and a nested one both answer and
 * no path into node_modules is written here.
 */
const resolver = createRequire(import.meta.url);

/** The shape of an icon name in the package: lowercase words joined by hyphens, and no path. */
const ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function iconFile(icon: string): string | null {
    if (!ICON_NAME.test(icon)) return null;
    try {
        return resolver.resolve(`lucide-static/icons/${icon}.svg`);
    } catch {
        return null;
    }
}

/** A map of strings out of a config key, dropping anything that is not one. */
const stringMapShape = mapOfShape(z.string());

/**
 * Every way the icon map and the glyph vocabulary can drift apart, as findings: a glyph name whose
 * stand-in is not one to three printable ASCII characters, a glyph name with no row, a row naming
 * something that is not a glyph name, and a row naming an icon the package does not ship. A name
 * with no row has no drawing, and ui/display/Glyph.svelte draws it as an empty box rather than as
 * text. The package is a fact about this machine's install rather than about the merged files,
 * which is why this is separate from loadConfig and takes the engine directory. Like loadConfig's
 * own findings, these are worded from the merged catalog, and a key it lacks is written as the key
 * and its arguments. With `where`, a finding about a name of a map the open workspace file's
 * `settings:` set names that file and `settings.glyphs.<name>` or `settings.icons.<name>`
 * (keyPlace); otherwise, and without `where`, it names oculus's catalog file and the name.
 */
export function iconFindings(
    engine: string,
    config: Record<string, unknown>,
    where?: ConfigWhere
): Finding[] {
    const placed = (map: 'glyphs' | 'icons', name: string): { file: string; key: string } => {
        const own = { file: join(configDir(engine), CATALOGS_DIR, `${map}.yml`), key: name };
        if (where === undefined) return own;
        const place = keyPlace(where, `${map}.${name}`);
        return place.key.startsWith('settings.') ? place : own;
    };
    const map = iconCatalog(config);
    const glyphs = glyphCatalog(config);
    const catalog = textCatalog(config);
    const findings: Finding[] = [];
    const vocabulary = readAs(mapShape, config.glyphs);
    if (vocabulary !== null) {
        for (const [name, standIn] of Object.entries(vocabulary)) {
            if (standInShape.safeParse(standIn).success) continue;
            findings.push({
                ...placed('glyphs', name),
                message: findingText(catalog, 'findings.config.glyph_not_ascii', name)
            });
        }
    }
    for (const name of Object.keys(glyphs)) {
        if (Object.hasOwn(map, name)) continue;
        findings.push({
            ...placed('icons', name),
            message: findingText(catalog, 'findings.config.glyph_no_icon', name)
        });
    }
    for (const [name, icon] of Object.entries(map)) {
        if (!Object.hasOwn(glyphs, name)) {
            findings.push({
                ...placed('icons', name),
                message: findingText(catalog, 'findings.config.icon_not_glyph', name)
            });
        } else if (iconFile(icon) === null) {
            findings.push({
                ...placed('icons', name),
                message: findingText(catalog, 'findings.config.icon_not_shipped', icon)
            });
        }
    }
    return findings;
}

/**
 * The top-level keys the engine's behavior.yml holds as written, none when the file cannot be read
 * as a map (loadConfig reports that file itself).
 */
function writtenKeys(file: string): string[] {
    try {
        const parsed: unknown = parse(readFileSync(file, 'utf8'));
        return isMap(parsed) ? Object.keys(parsed) : [];
    } catch {
        return [];
    }
}

/**
 * What is wrong with `behavior.yml` that only the reader can put right and that the options
 * catalog does not describe, as findings on the config channel: a top-level key no option of the
 * catalog's `behavior.yml` names, which nothing reads; a key written under a name the tree does
 * not read, which is ignored where it stands (`chat.skip_permissions` and `tasks.skip_permissions`,
 * whose place is a schedule's Run unattended choice); and an `apps.closed_paths` that is missing,
 * is no list of strings or holds an entry that is no folder path, since the default of the entry
 * does not stand in for it; and what is wrong with the `focus:` block (sections/focus.ts). The
 * unknown keys are those of oculus's config/defaults/behavior.yml (the workspace file's own are the
 * merge's findings); every other finding names the file its value was read from. It is worded from
 * the merged catalog, as iconFindings' are.
 */
export function behaviorFindings(where: ConfigWhere, config: Record<string, unknown>): Finding[] {
    const shipped = engineFile(where.engine, 'behavior.yml');
    const catalog = textCatalog(config);
    const findings: Finding[] = [];
    const named = Object.keys(catalogOf(config)['behavior.yml'] ?? {});
    const read = new Set(named.map((path) => path.split('.')[0]));
    for (const key of writtenKeys(shipped)) {
        if (key === TEXT_KEY || read.has(key)) continue;
        findings.push({
            file: shipped,
            key,
            message: findingText(catalog, 'findings.config.shape_unknown', key)
        });
    }
    for (const group of ['chat', 'tasks']) {
        const keys = readAs(mapShape, config[group]);
        if (keys === null || !('skip_permissions' in keys)) continue;
        const key = `${group}.skip_permissions`;
        findings.push({
            file: keyFile(where, key),
            key,
            message: findingText(catalog, 'findings.config.skip_permissions_retired', key)
        });
    }
    findings.push(...focusFindings(config, (key) => keyFile(where, key), catalog));
    if (!closedPaths(config).shaped) {
        const file = keyFile(where, 'apps.closed_paths');
        findings.push({
            file,
            key: 'apps.closed_paths',
            message: findingText(
                catalog,
                'findings.apps.closed_paths_shape',
                'apps.closed_paths',
                file
            )
        });
    }
    return findings;
}

/** The sentence for one thing wrong with a reader row or a `links` row of the key `key`. */
function rowText(catalog: TextCatalog, key: string, issue: RowIssue): string {
    const { row, at } = issue;
    switch (issue.kind) {
        case 'unknown':
            return findingText(catalog, 'findings.config.row_unknown', key, row, at);
        case 'missing':
            return findingText(catalog, 'findings.config.row_missing', key, row, at);
        case 'value':
            return findingText(catalog, 'findings.config.row_value', key, row, at);
        case 'https':
            return findingText(catalog, 'findings.config.row_https', key, row, at);
        case 'origin':
            return findingText(catalog, 'findings.config.row_origin', key, row, at);
        case 'pattern':
            return findingText(catalog, 'findings.config.row_pattern', key, row, at);
        case 'op':
            return findingText(catalog, 'findings.config.row_op', key, row, at);
        case 'empty':
            return findingText(catalog, 'findings.config.row_empty', key, row, at);
        case 'repeat':
            return findingText(catalog, 'findings.config.row_repeat', key, row, at);
        case 'shape':
            return findingText(catalog, 'findings.config.row_shape', key, row, at);
    }
}

/** The sentence for one thing the readers of behavior.yml found wrong. */
function settingText(catalog: TextCatalog, problem: EditorProblem): string {
    switch (problem.where) {
        case 'block':
            return findingText(catalog, 'findings.config.setting_block', problem.key);
        case 'family':
            return findingText(catalog, 'findings.config.setting_family', problem.key);
        case 'repeat':
            return findingText(
                catalog,
                'findings.config.setting_repeat',
                problem.key,
                problem.name
            );
        case 'unnamed':
            return findingText(catalog, 'findings.config.setting_unnamed', problem.key);
        case 'this-mac':
            return findingText(
                catalog,
                'findings.config.setting_this_mac',
                problem.key,
                MAC_TARGET
            );
        case 'unknown-language':
            return findingText(catalog, 'findings.config.editor_unknown_language', problem.key);
        case 'unknown-field':
            return findingText(catalog, 'findings.config.editor_unknown_field', problem.key);
        case 'not-a-map':
            return findingText(catalog, 'findings.config.editor_not_a_map', problem.key);
        case 'row':
            return rowText(catalog, problem.key, problem.issue);
        case 'value':
        case 'entry':
        case 'field':
            break;
    }
    if (problem.problem.kind === 'empty') {
        return findingText(catalog, 'findings.config.setting_empty', problem.key);
    }
    const words = mustBe(catalog, problem.spec, problem.problem);
    switch (problem.where) {
        case 'value':
            return findingText(catalog, 'findings.config.setting_default', problem.key, words);
        case 'entry':
            return findingText(catalog, 'findings.config.setting_entry', problem.key, words);
        case 'field':
            return findingText(catalog, 'findings.config.setting_field', problem.key, words);
    }
}

/**
 * One finding for each setting of `behavior.yml`, and each option of the editor, whose value the
 * options catalog's rule refuses (and the repository scan depth of sources.yml): it names the file
 * the value was read from and the key, and the reader uses the entry's default. A key the catalog
 * holds no entry for gives none (the options files' own findings name that file), and neither does
 * a configuration whose merge dropped behavior.yml, which holds no key to be wrong. They are worded
 * from the merged catalog, as iconFindings' are.
 */
export function settingFindings(where: ConfigWhere, config: Record<string, unknown>): Finding[] {
    const catalog = textCatalog(config);
    const problems: EditorProblem[] = settingProblems(config);
    try {
        problems.push(...readEditorOptions(config).problems);
    } catch {
        // A key the catalog holds no rule for is options.yml's finding, not a setting's.
    }
    const named = new Set<string>();
    return problems.flatMap((problem) => {
        const once = `${problem.where}:${problem.key}${problem.where === 'repeat' ? problem.name : ''}`;
        if (named.has(once)) return [];
        named.add(once);
        const file = keyFile(where, problem.key);
        return [{ file, key: problem.key, message: settingText(catalog, problem) }];
    });
}

/** The sentence for one thing wrong with local.yml, with no value the file holds in it. */
function localText(catalog: TextCatalog, problem: LocalProblem): string {
    switch (problem.kind) {
        case 'value':
            return findingText(
                catalog,
                'findings.config.setting_default',
                problem.key,
                problem.words
            );
        case 'row':
            return findingText(catalog, 'findings.config.local_row', problem.key, problem.words);
        case 'repeat':
            return findingText(catalog, 'findings.config.local_repeat', problem.key);
        case 'other-hub':
            return findingText(
                catalog,
                'findings.config.local_other_hub',
                problem.key,
                problem.hub
            );
        case 'label':
            return findingText(
                catalog,
                'findings.config.setting_default',
                problem.key,
                findingText(catalog, 'findings.config.claude_label')
            );
        case 'user':
            return findingText(catalog, 'findings.config.local_user', problem.service);
        case 'unparsed':
            return findingText(catalog, 'findings.config.local_unparsed');
        case 'not-a-map':
            return findingText(catalog, 'findings.config.local_not_a_map');
        case 'unreadable':
            return findingText(catalog, 'findings.config.local_unreadable', problem.code);
    }
}

/**
 * One finding for each key or row of a hub's `.oculus/local.yml` that does not read, or for a file
 * as a whole, against that file and the key. The config payload reaches every page, so a finding
 * never holds a value the file holds, a label or the parser's text.
 */
export function localFindings(
    config: Record<string, unknown>,
    problems: readonly MachineProblem[]
): Finding[] {
    const catalog = textCatalog(config);
    return problems.map(({ file, problem }) => ({
        file,
        key: problem.key,
        message: localText(catalog, problem)
    }));
}

/** The icon drawings in force, in a holder whose contents the config watcher replaces. */
export type IconMemory = { set: Record<string, string> };

/**
 * The drawing of every mapped icon, by glyph name, read once per config load and shipped with the
 * glyph vocabulary so the page never fetches an icon file of its own. A row the findings above
 * report is left out, and the primitive draws an empty box for a name that is not here.
 */
export function iconSet(config: Record<string, unknown>): Record<string, string> {
    const glyphs = glyphCatalog(config);
    const icons: Record<string, string> = {};
    for (const [name, icon] of Object.entries(iconCatalog(config))) {
        if (!Object.hasOwn(glyphs, name)) continue;
        const file = iconFile(icon);
        if (file === null) continue;
        icons[name] = readFileSync(file, 'utf8').trim();
    }
    return icons;
}
