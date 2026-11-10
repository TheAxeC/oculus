// Layer 4, tree check. The glyphs and icons of the config folder oculus ships, read the way the
// server reads them: every configured icon is a glyph name, every glyph has one icon, a drawing and
// a stand-in of one to three printable ASCII characters, every glyph is read by the source or by
// another config file, and a drifted glyph or icon file is reported by name.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    iconCatalog,
    iconSet,
    loadConfig
} from '../../../src/lib/data/sources/config.ts';
import { iconFindings } from '../../../src/lib/data/sources/config/catalogs.ts';
import { DEMO_HUB } from '../../fixtures/hubs/real-hub.ts';
import { treeFiles } from '../walk.ts';

/** The shapes the source names a glyph in: a prop or field, a `<Glyph>`, a `glyph()` call. */
const NAMED = [
    /\b[\w$]*(?:glyph|icon)[\w$]*\s*[:=]\s*\{?\s*['"`]([\w-]+)['"`]/gi,
    /\bglyph\s*\(\s*['"`]([\w-]+)['"`]/g,
    /<Glyph\b[^>]*\bname=["']([\w-]+)["']/g
];

/**
 * Every word a glyph name is read as. A glyph is named by a prop or a field whose own name carries
 * `glyph` or `icon` (`glyph="edit"`, `const OVERDUE_GLYPH = 'bang'`), by the `name` of a `<Glyph>`,
 * by a `glyph('edit')` call, by a string value of any config file but the two that define the
 * glyphs, at any depth, or inside a label as a `{G.name}` placeholder (`appearance.yml`'s
 * `{G.theme_rice} mocha`). A name found in none of those is read by nothing. A config value is not
 * always a glyph name, so the check can pass a name some other value happens to spell; it cannot
 * fail a name that is read.
 */
function glyphReaders(engine: string): Set<string> {
    const found = new Set<string>();
    const walk = (dir: string, take: (file: string) => void): void => {
        for (const rel of treeFiles(dir)) take(join(dir, rel));
    };
    const placeholders = (text: string): void => {
        for (const match of text.matchAll(/\bG\.(\w+)/g)) found.add(match[1]);
    };
    walk(join(engine, 'src'), (file) => {
        const text = readFileSync(file, 'utf8');
        for (const shape of NAMED) for (const match of text.matchAll(shape)) found.add(match[1]);
        placeholders(text);
    });
    const values = (value: unknown): void => {
        if (typeof value === 'string') {
            found.add(value);
            placeholders(value);
        } else if (Array.isArray(value)) value.forEach(values);
        else if (typeof value === 'object' && value !== null) Object.values(value).forEach(values);
    };
    walk(join(engine, 'config'), (file) => {
        if (!file.endsWith('.yml')) return;
        if (file.endsWith('glyphs.yml') || file.endsWith('icons.yml')) return;
        values(parse(readFileSync(file, 'utf8')));
    });
    return found;
}

describe("the glyphs and icons of oculus's own config directory", () => {
    it('uses glyph names for every configured icon', () => {
        const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
        const glyphs = glyphCatalog(config);
        const icons = ['stages', 'forms', 'chips', 'statuses'].flatMap((list) =>
            Object.values((config[list] ?? {}) as Record<string, { icon?: string }>).flatMap(
                (entry) => (entry.icon === undefined ? [] : [entry.icon])
            )
        );
        expect(icons.length).toBeGreaterThan(0);
        expect(icons.filter((name) => !(name in glyphs))).toEqual([]);
    });

    it('names one icon for every glyph and for nothing but a glyph', () => {
        const { config } = loadConfig(engineDir());
        expect(Object.keys(iconCatalog(config))).toEqual(Object.keys(glyphCatalog(config)));
        expect(iconFindings(engineDir(), config)).toEqual([]);
    });

    it('names a glyph only where the source or another config file reads it', () => {
        const { config } = loadConfig(engineDir());
        const read = glyphReaders(engineDir());
        expect(Object.keys(glyphCatalog(config)).filter((name) => !read.has(name))).toEqual([]);
    });

    it('gives every glyph name a stand-in of printable ASCII, and holds no other map', () => {
        const { config } = loadConfig(engineDir());
        const raw = config.glyphs as Record<string, unknown>;
        const loose = Object.entries(raw).filter(
            ([, standIn]) => typeof standIn !== 'string' || !/^[\x20-\x7E]+$/.test(standIn)
        );
        expect(loose.map(([name]) => name)).toEqual([]);
        expect(config.ascii).toBe(undefined);
    });

    it('holds every stand-in to three characters, the box a terminal theme draws it in', () => {
        const { config } = loadConfig(engineDir());
        const wide = Object.entries(glyphCatalog(config)).filter(
            ([, standIn]) => standIn.length > 3
        );
        expect(wide.map(([name, standIn]) => `${name}: ${standIn}`)).toEqual([]);
    });

    it('reports a glyph whose stand-in is empty, not text, wider than three, or not ASCII', () => {
        const drifted = {
            glyphs: { pin: 'P', blank: '', count: 3, mark: '\u25C6', wide: '[><]' },
            icons: { pin: 'pin', blank: 'pin', count: 'pin', mark: 'pin', wide: 'pin' },
            text: loadConfig(engineDir()).config.text
        };
        const found = iconFindings(engineDir(), drifted);
        expect(
            found.filter((one) => one.file.endsWith('glyphs.yml')).map((one) => one.key)
        ).toEqual(['blank', 'count', 'mark', 'wide']);
        expect(found.map((one) => one.message)).toContain(
            'glyph wide has no stand-in of one to three printable ASCII characters'
        );
    });

    it('ships a drawing for every one of them', () => {
        const { config } = loadConfig(engineDir());
        const icons = iconSet(config);
        expect(Object.keys(icons)).toEqual(Object.keys(glyphCatalog(config)));
        for (const [name, svg] of Object.entries(icons)) {
            expect(svg, name).toContain('<svg');
            expect(svg, name).toContain('stroke="currentColor"');
        }
    });

    it('reports a glyph with no icon, a row that is no glyph, and an icon the package has not', () => {
        const drifted = {
            glyphs: { pin: 'P', flag: 'F' },
            icons: { pin: 'nonesuch-icon', nothing: 'circle' },
            text: loadConfig(engineDir()).config.text
        };
        expect(iconFindings(engineDir(), drifted).map((one) => one.message)).toEqual([
            'glyph flag has no icon',
            'the icon package ships no nonesuch-icon.svg',
            'nothing is not a name in config/catalogs/glyphs.yml'
        ]);
        expect(iconSet(drifted)).toEqual({});
    });

    it('reads glyph and icon names as own keys, so a name like constructor is no name', () => {
        const inherited = {
            glyphs: { pin: 'P', toString: 'T' },
            icons: { pin: 'pin', constructor: 'circle' },
            text: loadConfig(engineDir()).config.text
        };
        expect(iconFindings(engineDir(), inherited).map((one) => one.message)).toEqual([
            'glyph toString has no icon',
            'constructor is not a name in config/catalogs/glyphs.yml'
        ]);
        expect(Object.keys(iconSet(inherited))).toEqual(['pin']);
    });
});
