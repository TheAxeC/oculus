// Layer 1, data. The vocabulary, glyph and icon catalogs read out of the merged map, and the
// findings over them: an icon name no installed set holds, and a behavior block the editor needs
// and the file does not carry.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { paintLimit } from '../../helpers/editor.ts';
import { findingText } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { configDir } from './folder.ts';
import { CATALOGS_DIR, textCatalog } from './merge.ts';

/**
 * The keys of the merged config the client state installs before the page renders: the colours and
 * the chip vocabulary state/shared/words/tones.ts reads, and the theme list, the wallpaper and the
 * CRT default and the code theme state/shared/words/appearance.ts reads. `domains` is the research
 * domains of config/catalogs/vocab.yml; `themes`, `wallpaper`, `crt`, `code_theme` and `terminal`
 * are config/appearance.yml's.
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
    return stringMap(config.glyphs);
}

/**
 * The icon map held in the merged config's `icons` key: one icon name per glyph name, flat. It is
 * the names alone; iconSet() is what turns them into the drawing the page is given.
 */
export function iconCatalog(config: Record<string, unknown>): Record<string, string> {
    return stringMap(config.icons);
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
const STAND_IN = /^[\x20-\x7E]{1,3}$/;

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
    const vocabulary = config.glyphs;
    if (typeof vocabulary === 'object' && vocabulary !== null && !Array.isArray(vocabulary)) {
        for (const [name, standIn] of Object.entries(vocabulary as Record<string, unknown>)) {
            if (typeof standIn === 'string' && STAND_IN.test(standIn)) continue;
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
 * What is wrong with `behavior.yml` that only the reader can put right, as findings on the config
 * channel. Both are things a saved edit can introduce while the server runs, where a throw would
 * take the page down with it: a key still written under a name the tree no longer reads, which is
 * ignored where it stands so the block runs on its default, and a key the editor needs that no
 * longer names a size, which leaves the editor painting without colour and says nothing about why.
 * They are worded from the merged catalog, as iconFindings' are.
 */
export function behaviorFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'behavior.yml');
    const catalog = textCatalog(config);
    const findings: Finding[] = [];
    const chat = config.chat;
    if (typeof chat === 'object' && chat !== null && !Array.isArray(chat)) {
        if ('skip_permissions' in (chat as Record<string, unknown>)) {
            findings.push({
                file,
                key: 'chat.skip_permissions',
                message: findingText(catalog, 'findings.config.skip_permissions_retired')
            });
        }
    }
    if (paintLimit(config) === null) {
        findings.push({
            file,
            key: 'editor.paint_limit_kb',
            message: findingText(catalog, 'findings.config.paint_limit')
        });
    }
    return findings;
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

/** A map of strings out of a config key, dropping anything that is not one. */
function stringMap(raw: unknown): Record<string, string> {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
    const map: Record<string, string> = {};
    for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value === 'string') map[name] = value;
    }
    return map;
}
