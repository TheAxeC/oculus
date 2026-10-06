// Layer 1, data. The vocabulary, glyph and icon catalogs read out of the merged map, and the
// findings over them: an icon name no installed set holds, a retired behavior key, a setting of
// behavior.yml whose value the options catalog's rule refuses, and a key or row of local.yml that
// fails to read.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { mapOfShape, mapShape, readAs, readOr } from '../../shapes/shapes.ts';
import { mustBe } from './catalog/value-words.ts';
import { readEditorOptions, type EditorProblem } from './editor-options.ts';
import { configDir } from './folder.ts';
import { localFile, type LocalProblem } from './local.ts';
import { CATALOGS_DIR, textCatalog } from './merge.ts';
import { settingProblems } from './settings.ts';

/**
 * The keys of the merged config the client state installs before the page renders: the colours and
 * the chip vocabulary state/shared/words/tones.ts reads, and the theme list, the wallpaper and the
 * CRT default, the code theme, and the pane strip's three settings state/shared/words/appearance.ts
 * reads. `domains` is the research domains of config/catalogs/vocab.yml; `themes`, `wallpaper`,
 * `crt`, `code_theme`, `show_tabs`, `editor_actions`, `wrap_tabs` and `terminal` are
 * config/appearance.yml's.
 */
export const VOCAB_KEYS = [
    'palette',
    'status_palette',
    'type_color',
    'status_legend',
    'data_access',
    'domains',
    'themes',
    'wallpaper',
    'crt',
    'code_theme',
    'show_tabs',
    'editor_actions',
    'wrap_tabs',
    'terminal'
];

/**
 * The slice of the merged config the tone lookups and the theme picker need, shipped as the page's
 * data beside the catalog and the glyphs. The whole merged config goes over the `config` channel
 * afterwards and setVocab and setAppearance read the same keys out of it, so this is the first load
 * only and carries no more than those keys.
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

/**
 * A stand-in: one to three printable ASCII characters, which a terminal font is sure to hold and
 * the three-character box of ui/display/Glyph.svelte is sure to fit.
 */
const standInShape = z.string().regex(/^[\x20-\x7E]{1,3}$/);

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
 * and its arguments.
 */
export function iconFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), CATALOGS_DIR, 'icons.yml');
    const map = iconCatalog(config);
    const glyphs = glyphCatalog(config);
    const catalog = textCatalog(config);
    const findings: Finding[] = [];
    const vocabulary = readAs(mapShape, config.glyphs);
    if (vocabulary !== null) {
        for (const [name, standIn] of Object.entries(vocabulary)) {
            if (standInShape.safeParse(standIn).success) continue;
            findings.push({
                file: join(configDir(engine), CATALOGS_DIR, 'glyphs.yml'),
                key: name,
                message: findingText(catalog, 'findings.config.glyph_not_ascii', name)
            });
        }
    }
    for (const name of Object.keys(glyphs)) {
        if (Object.hasOwn(map, name)) continue;
        findings.push({
            file,
            key: name,
            message: findingText(catalog, 'findings.config.glyph_no_icon', name)
        });
    }
    for (const [name, icon] of Object.entries(map)) {
        if (!Object.hasOwn(glyphs, name)) {
            findings.push({
                file,
                key: name,
                message: findingText(catalog, 'findings.config.icon_not_glyph', name)
            });
        } else if (iconFile(icon) === null) {
            findings.push({
                file,
                key: name,
                message: findingText(catalog, 'findings.config.icon_not_shipped', icon)
            });
        }
    }
    return findings;
}

/**
 * What is wrong with `behavior.yml` that only the reader can put right and that the options
 * catalog does not describe, as findings on the config channel: a key written under a name the tree
 * does not read, which is ignored where it stands (`chat.skip_permissions` and
 * `tasks.skip_permissions`, whose place is a schedule's Run unattended choice). It is worded from
 * the merged catalog, as iconFindings' are.
 */
export function behaviorFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'behavior.yml');
    const catalog = textCatalog(config);
    const findings: Finding[] = [];
    for (const group of ['chat', 'tasks']) {
        const keys = readAs(mapShape, config[group]);
        if (keys === null || !('skip_permissions' in keys)) continue;
        const key = `${group}.skip_permissions`;
        findings.push({
            file,
            key,
            message: findingText(catalog, 'findings.config.skip_permissions_retired', key)
        });
    }
    return findings;
}

/** The sentence for one thing the readers of behavior.yml found wrong. */
function settingText(catalog: TextCatalog, problem: EditorProblem): string {
    switch (problem.where) {
        case 'block':
            return findingText(catalog, 'findings.config.setting_block', problem.key);
        case 'family':
            return findingText(catalog, 'findings.config.setting_family', problem.key);
        case 'unknown-language':
            return findingText(catalog, 'findings.config.editor_unknown_language', problem.key);
        case 'unknown-field':
            return findingText(catalog, 'findings.config.editor_unknown_field', problem.key);
        case 'not-a-map':
            return findingText(catalog, 'findings.config.editor_not_a_map', problem.key);
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
 * options catalog's rule refuses: it names the file and the key, and the reader uses the entry's
 * default. A key the catalog holds no entry for gives none (options.yml's own findings name that
 * file), and neither does a configuration whose merge dropped behavior.yml, which holds no key to
 * be wrong. They are worded from the merged catalog, as iconFindings' are.
 */
export function settingFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'behavior.yml');
    const catalog = textCatalog(config);
    const problems: EditorProblem[] = settingProblems(config);
    try {
        problems.push(...readEditorOptions(config).problems);
    } catch {
        // A key the catalog holds no rule for is options.yml's finding, not a setting's.
    }
    const named = new Set<string>();
    return problems.flatMap((problem) => {
        const once = `${problem.where}:${problem.key}`;
        if (named.has(once)) return [];
        named.add(once);
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
        case 'unparsed':
            return findingText(catalog, 'findings.config.local_unparsed');
        case 'not-a-map':
            return findingText(catalog, 'findings.config.local_not_a_map');
        case 'unreadable':
            return findingText(catalog, 'findings.config.local_unreadable', problem.code);
    }
}

/**
 * One finding for each key or row of the machine's own file that does not read, or for the file
 * as a whole, against local.yml and the key. The config payload reaches every page, so a finding
 * never holds a value the file holds, a label or the parser's text.
 */
export function localFindings(
    engine: string,
    config: Record<string, unknown>,
    problems: readonly LocalProblem[]
): Finding[] {
    const file = localFile(engine);
    const catalog = textCatalog(config);
    return problems.map((problem) => ({
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
