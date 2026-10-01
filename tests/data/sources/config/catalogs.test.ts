// The icon, glyph and behavior findings and the theme findings of the merged config, over a config
// whose keys hold a value of the wrong type at each place the readers look. Findings are compared
// whole, in order, with the file each names.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    behaviorFindings,
    engineDir,
    glyphCatalog,
    iconCatalog,
    iconFindings,
    iconSet,
    loadConfig,
    themeFindings
} from '../../../../src/lib/data/sources/config.ts';

const ENGINE = engineDir();

/** A merged config holding the shipped sentences and the keys a case sets. */
function configWith(keys: Record<string, unknown>): Record<string, unknown> {
    return { text: loadConfig(ENGINE).config.text, ...keys };
}

const inConfig = (...path: string[]) => join(ENGINE, 'config', ...path);

describe('iconFindings', () => {
    it.each([
        ['a glyphs key that is a list', { glyphs: [] }],
        ['a glyphs key that is text', { glyphs: 'x' }]
    ])('reports nothing for %s', (_label, keys) => {
        expect(iconFindings(ENGINE, configWith(keys))).toStrictEqual([]);
    });

    it('reports a stand-in that is not one to three printable characters, then each glyph with no icon', () => {
        const found = iconFindings(
            ENGINE,
            configWith({ glyphs: { a: 3, b: 'ok', c: 'toolong', d: '' }, icons: {} })
        );
        const standIn = (key: string) => ({
            file: inConfig('catalogs', 'glyphs.yml'),
            key,
            message: `glyph ${key} has no stand-in of one to three printable ASCII characters`
        });
        const noIcon = (key: string) => ({
            file: inConfig('catalogs', 'icons.yml'),
            key,
            message: `glyph ${key} has no icon`
        });
        expect(found).toStrictEqual([
            standIn('a'),
            standIn('c'),
            standIn('d'),
            noIcon('b'),
            noIcon('c'),
            noIcon('d')
        ]);
    });

    it('treats an icons key that is not a map as no icons', () => {
        expect(iconFindings(ENGINE, configWith({ glyphs: { a: 'x' }, icons: [] }))).toStrictEqual([
            {
                file: inConfig('catalogs', 'icons.yml'),
                key: 'a',
                message: 'glyph a has no icon'
            }
        ]);
    });

    it('drops an icon that is not text and reports one the package does not ship or no glyph names', () => {
        const found = iconFindings(
            ENGINE,
            configWith({
                glyphs: { a: 'x', b: 'y', c: 'z' },
                icons: { a: 3, b: 'chevron-right', c: 'no-such-icon-zzz', e: 'chevron-right' }
            })
        );
        expect(found).toStrictEqual([
            {
                file: inConfig('catalogs', 'icons.yml'),
                key: 'a',
                message: 'glyph a has no icon'
            },
            {
                file: inConfig('catalogs', 'icons.yml'),
                key: 'c',
                message: 'the icon package ships no no-such-icon-zzz.svg'
            },
            {
                file: inConfig('catalogs', 'icons.yml'),
                key: 'e',
                message: 'e is not a name in config/catalogs/glyphs.yml'
            }
        ]);
    });
});

describe('behaviorFindings', () => {
    const PAINT = {
        file: inConfig('behavior.yml'),
        key: 'editor.paint_limit_kb',
        message:
            'editor.paint_limit_kb must be a number above zero; the editor paints without colour until it is'
    };

    it.each([
        ['a chat key that is a list', { chat: [] }],
        ['a chat key that is text', { chat: 'x' }],
        ['an editor key that is text', { editor: 'x' }],
        ['a paint limit of zero', { editor: { paint_limit_kb: 0 } }],
        ['a paint limit that is text', { editor: { paint_limit_kb: '5' } }]
    ])('reports only the paint limit for %s', (_label, keys) => {
        expect(behaviorFindings(ENGINE, configWith(keys))).toStrictEqual([PAINT]);
    });

    it('reports the retired chat key before the paint limit', () => {
        expect(
            behaviorFindings(ENGINE, configWith({ chat: { skip_permissions: 1 } }))
        ).toStrictEqual([
            {
                file: inConfig('behavior.yml'),
                key: 'chat.skip_permissions',
                message: 'chat.skip_permissions is not read; the key is tasks.skip_permissions'
            },
            PAINT
        ]);
    });

    it('reports nothing for a usable paint limit', () => {
        expect(
            behaviorFindings(ENGINE, configWith({ editor: { paint_limit_kb: 5 } }))
        ).toStrictEqual([]);
    });
});

describe('the glyph and icon catalogs and the icon set', () => {
    it('keeps the text entries of a map and nothing for another value', () => {
        expect([
            glyphCatalog({ glyphs: [] }),
            glyphCatalog({ glyphs: { a: 'x', b: 3 } }),
            glyphCatalog({}),
            iconCatalog({ icons: 'x' }),
            iconCatalog({ icons: { a: 'x', b: 3 } })
        ]).toStrictEqual([{}, { a: 'x' }, {}, {}, { a: 'x' }]);
    });

    it('draws nothing for a config whose glyphs and icons are of the wrong type', () => {
        expect(iconSet({ glyphs: [], icons: 'x' })).toStrictEqual({});
    });

    it('draws the icons of the glyphs that name one the package ships, as the file reads', () => {
        const file = createRequire(import.meta.url).resolve(
            'lucide-static/icons/chevron-right.svg'
        );
        expect(
            iconSet({
                glyphs: { a: 'x', b: 'y' },
                icons: { a: 'chevron-right', b: 3, c: 'chevron-right' }
            })
        ).toStrictEqual({ a: readFileSync(file, 'utf8').trim() });
    });
});

describe('themeFindings', () => {
    const appearance = inConfig('appearance.yml');
    const CODE_THEME = (value: string) => ({
        file: appearance,
        key: 'code_theme',
        message: `code_theme is ${value}, which is neither tokens nor the id of a Shiki theme; the editor colours code from the tokens instead`
    });

    it('reports a code theme that is a number or null', () => {
        expect(themeFindings(ENGINE, configWith({ code_theme: 3 }))).toStrictEqual([
            CODE_THEME('3')
        ]);
        expect(themeFindings(ENGINE, configWith({ code_theme: null }))).toStrictEqual([
            CODE_THEME('null')
        ]);
    });

    it('reports nothing for a themes key that is text', () => {
        expect(
            themeFindings(ENGINE, configWith({ code_theme: 'tokens', themes: 'x' }))
        ).toStrictEqual([]);
    });

    it('reads each row by its own shape, passing over a row that names no theme', () => {
        const found = themeFindings(
            ENGINE,
            configWith({
                code_theme: 'tokens',
                glyphs: { g: 'x' },
                themes: [
                    3,
                    null,
                    [],
                    { name: 3 },
                    { name: '' },
                    { name: 'a' },
                    { name: 'a', glyph: 'g' },
                    { name: 'b', glyph: 3 },
                    { name: 'c', glyph: 'nope' },
                    { name: 'd', glyph: 'g' }
                ]
            })
        );
        expect(found).toStrictEqual([
            {
                file: appearance,
                key: 'themes[5]',
                message: 'the theme a names no glyph; it is offered with its words alone'
            },
            {
                file: appearance,
                key: 'themes[6]',
                message: 'a second theme row names a; only the first is offered'
            },
            {
                file: appearance,
                key: 'themes[7]',
                message: 'the theme b names no glyph; it is offered with its words alone'
            },
            {
                file: appearance,
                key: 'themes[8]',
                message:
                    'the theme c names a glyph glyphs.yml does not hold; it is offered with its words alone'
            }
        ]);
    });
});
