// Layer 2, client-state tests. config/appearance.yml as the page reads it, over a synthetic config
// with every key of the wrong type or the wrong shape: the theme rows, the wallpaper's numbers, the
// CRT default, the code theme, the terminal's size and its four other keys. Each reader answers
// what it answers for the value it is given, a value of the wrong type being the key left out.
//
// What this does not cover: the real config/appearance.yml, which tests/checks/config holds to
// its shape, and the picker that draws the themes, which is
// tests/views/system/workbench/settings.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { codeThemeIds } from '../../../../src/lib/data/helpers/code-themes.ts';
import { engineDir, glyphCatalog, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import {
    codeThemeDefault,
    crtDefault,
    defaultTheme,
    editorActions,
    setAppearance,
    showTabs,
    terminalFontPx,
    terminalOptions,
    terminalTheme,
    themeClass,
    themeLabel,
    themes,
    wallpaperOnTheme,
    wallpaperSettings,
    type Wallpaper
} from '../../../../src/lib/state/shared/words/appearance.ts';
import { setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';

const GLYPHS = glyphCatalog(loadConfig(engineDir()).config);

beforeEach(() => {
    setGlyphs(GLYPHS);
    setAppearance({});
});

/** The wallpaper a `wallpaper: {}` key reads as: every number at its own default. */
const DEFAULT_WALLPAPER: Wallpaper = {
    dim: 0.72,
    blur: 0,
    themes: 'rice',
    panel: 86,
    popover: 97,
    panelBlur: 6
};

describe('the config with no key', () => {
    it('reads every key as its own absence', () => {
        expect(themes()).toStrictEqual([]);
        expect(defaultTheme()).toBe('light');
        expect(themeClass('dark')).toBe('');
        expect(themeLabel('dark')).toBe('dark');
        expect(crtDefault()).toBe(false);
        expect(codeThemeDefault()).toBe('tokens');
        expect(showTabs()).toBe('multiple');
        expect(editorActions()).toBe('strip');
        expect(terminalFontPx()).toBeNull();
        expect(terminalOptions()).toStrictEqual({});
        expect(wallpaperSettings()).toBeNull();
        expect(wallpaperOnTheme('dark')).toBe(false);
        expect(terminalTheme('dark')).toBe(false);
    });

    it('forgets what an earlier config installed', () => {
        setAppearance({
            themes: [{ name: 'a', class: 'rice' }],
            wallpaper: {},
            crt: { default: true },
            code_theme: codeThemeIds()[0],
            show_tabs: 'none',
            editor_actions: 'hidden',
            terminal: { font_px: 14, cursor_style: 'block' }
        });
        setAppearance({});
        expect(showTabs()).toBe('multiple');
        expect(editorActions()).toBe('strip');
        expect(themes()).toStrictEqual([]);
        expect(wallpaperSettings()).toBeNull();
        expect(crtDefault()).toBe(false);
        expect(codeThemeDefault()).toBe('tokens');
        expect(terminalFontPx()).toBeNull();
        expect(terminalOptions()).toStrictEqual({});
    });
});

describe('the theme rows', () => {
    it.each([['x'], [{ name: 'a' }]])(
        'reads a themes key that is %j, no list, as no themes',
        (rows) => {
            setAppearance({ themes: rows });
            expect(themes()).toStrictEqual([]);
            expect(defaultTheme()).toBe('light');
        }
    );

    it('reads each row for its name, its class, its glyph and its label', () => {
        setAppearance({
            themes: [
                'x',
                null,
                [],
                3,
                {},
                { name: 3 },
                { name: '' },
                { name: 'a', class: 3, glyph: 4, label: [] },
                { name: 'a', class: 'duplicate', label: 'again' },
                { name: 'b', class: 'rice x', glyph: 'theme_base', label: '' },
                { name: 'c', glyph: 'nope', label: 'C' },
                { name: 'd', class: 'ricer', label: 'D', extra: 1 },
                { name: 'constructor', class: 'k' }
            ]
        });
        expect(themes()).toStrictEqual([
            { name: 'a', class: '', glyph: '', label: 'a' },
            { name: 'b', class: 'rice x', glyph: 'theme_base', label: '' },
            { name: 'c', class: '', glyph: '', label: 'C' },
            { name: 'd', class: 'ricer', glyph: '', label: 'D' },
            { name: 'constructor', class: 'k', glyph: '', label: 'constructor' }
        ]);
        expect(Object.keys(themes()[0])).toStrictEqual(['name', 'class', 'glyph', 'label']);
        expect(defaultTheme()).toBe('a');
        expect(themeLabel('a')).toBe('a');
        expect(themeLabel('b')).toBe('');
        expect(themeLabel('zzz')).toBe('zzz');
        expect(themeClass('b')).toBe('rice x');
        expect(themeClass('d')).toBe('ricer');
        expect(themeClass('constructor')).toBe('k');
        expect(themeClass('toString')).toBe('');
        expect(themeLabel('toString')).toBe('toString');
    });

    it('answers a copy of the list, so a caller cannot edit what is installed', () => {
        setAppearance({ themes: [{ name: 'a', class: 'c' }] });
        const first = themes();
        first[0].class = 'edited';
        first.pop();
        expect(themes()).toStrictEqual([{ name: 'a', class: 'c', glyph: '', label: 'a' }]);
    });

    it('lists no row named __proto__ and finds no class under that name', () => {
        setAppearance({
            themes: [{ name: 'a' }, { name: '__proto__', class: 'p' }, { name: 'b' }]
        });
        expect(themes().map((one) => one.name)).toStrictEqual(['a', 'b']);
        expect(themeClass('__proto__')).toBe('');
        expect(themeLabel('__proto__')).toBe('__proto__');
    });

    it.each([
        ['rice', 'rice x', true],
        ['spaced classes', ' rice  dark ', true],
        ['a class that only starts with it', 'ricer', false],
        ['a class that is a number', 3, false]
    ])('tells a terminal palette from a class of %s', (_name, cls, expected) => {
        setAppearance({ themes: [{ name: 'a', class: cls }] });
        expect(terminalTheme('a')).toBe(expected);
        expect(terminalTheme('unlisted')).toBe(false);
    });
});

describe('the wallpaper', () => {
    it.each([
        ['absent', undefined],
        ['a list', []]
    ])('is none when the key is %s', (_name, wallpaper) => {
        setAppearance({ wallpaper });
        expect(wallpaperSettings()).toBeNull();
        expect(wallpaperOnTheme('a')).toBe(false);
    });

    it('is every number at its own default for an empty map, the keys in the order the page paints', () => {
        setAppearance({ wallpaper: {} });
        expect(wallpaperSettings()).toStrictEqual(DEFAULT_WALLPAPER);
        expect(Object.keys(wallpaperSettings() ?? {})).toStrictEqual([
            'dim',
            'blur',
            'themes',
            'panel',
            'popover',
            'panelBlur'
        ]);
    });

    it('is the same object on every read', () => {
        setAppearance({ wallpaper: {} });
        expect(wallpaperSettings()).toBe(wallpaperSettings());
    });

    it('reads each number and the percentages as whole numbers', () => {
        setAppearance({
            wallpaper: {
                dim: 0.5,
                blur: 10,
                themes: 'all',
                panel_opacity: 0.555,
                popover_opacity: 0.6,
                panel_blur: 12
            }
        });
        expect(wallpaperSettings()).toStrictEqual({
            dim: 0.5,
            blur: 10,
            themes: 'all',
            panel: 56,
            popover: 60,
            panelBlur: 12
        });
    });

    it.each([
        ['dim below its range', { dim: -1 }, { dim: 0 }],
        ['dim above its range', { dim: 2 }, { dim: 1 }],
        ['blur above its range', { blur: 100 }, { blur: 64 }],
        ['blur below its range', { blur: -5 }, { blur: 0 }],
        ['panel_blur above its range', { panel_blur: 99 }, { panelBlur: 64 }],
        ['panel_opacity above its range', { panel_opacity: 2 }, { panel: 100, popover: 100 }],
        ['panel_opacity below its range', { panel_opacity: -1 }, { panel: 0, popover: 75 }],
        ['popover_opacity above its range', { popover_opacity: 2 }, { popover: 100 }],
        ['popover_opacity below its range', { popover_opacity: -1 }, { popover: 0 }],
        ['a popover three quarters to solid', { panel_opacity: 0.5 }, { panel: 50, popover: 88 }]
    ])('clamps %s', (_name, wallpaper, over) => {
        setAppearance({ wallpaper });
        expect(wallpaperSettings()).toStrictEqual({ ...DEFAULT_WALLPAPER, ...over });
    });

    it.each([
        ['a string', '0.5'],
        ['NaN', Number.NaN],
        ['positive infinity', Number.POSITIVE_INFINITY]
    ])('reads a number that is %s as its default', (_name, value) => {
        setAppearance({
            wallpaper: {
                dim: value,
                blur: value,
                panel_opacity: value,
                panel_blur: value
            }
        });
        expect(wallpaperSettings()).toStrictEqual(DEFAULT_WALLPAPER);
    });

    it.each([
        ['a string', '0.5', 88],
        ['NaN', Number.NaN, 97],
        ['positive infinity', Number.POSITIVE_INFINITY, 97],
        ['a number', 0.2, 20]
    ])('reads a popover_opacity that is %s over a panel of 50 as %i', (_name, value, popover) => {
        setAppearance({ wallpaper: { panel_opacity: 0.5, popover_opacity: value } });
        expect(wallpaperSettings()).toStrictEqual({ ...DEFAULT_WALLPAPER, panel: 50, popover });
    });

    it.each([
        ['all', 'all'],
        ['everything', 'rice']
    ])('reads the themes key %j as %s', (value, expected) => {
        setAppearance({ wallpaper: { themes: value } });
        expect(wallpaperSettings()?.themes).toBe(expected);
    });

    it('shows under every theme for all, even one the config does not list', () => {
        setAppearance({ themes: [{ name: 'a', class: 'plain' }], wallpaper: { themes: 'all' } });
        expect(wallpaperOnTheme('a')).toBe(true);
        expect(wallpaperOnTheme('unlisted')).toBe(true);
    });

    it('shows under the terminal palettes alone for rice', () => {
        setAppearance({
            themes: [
                { name: 'a', class: 'plain' },
                { name: 'b', class: 'rice nord' }
            ],
            wallpaper: { themes: 'rice' }
        });
        expect(wallpaperOnTheme('a')).toBe(false);
        expect(wallpaperOnTheme('b')).toBe(true);
        expect(wallpaperOnTheme('unlisted')).toBe(false);
    });
});

describe('the CRT default', () => {
    it.each([
        [{ default: true }, true],
        [{ default: 'true' }, false],
        [true, false]
    ])('reads the crt key %j as %s', (crt, expected) => {
        setAppearance({ crt });
        expect(crtDefault()).toBe(expected);
    });
});

describe('the tab bar and the editor actions', () => {
    it.each([
        ['single', 'single'],
        ['none', 'none'],
        ['few', 'multiple']
    ])('reads the show_tabs key %j as %j', (value, expected) => {
        setAppearance({ show_tabs: value });
        expect(showTabs()).toBe(expected);
    });

    it.each([
        ['hidden', 'hidden'],
        ['tabs', 'strip']
    ])('reads the editor_actions key %j as %j', (value, expected) => {
        setAppearance({ editor_actions: value });
        expect(editorActions()).toBe(expected);
    });

    it('reads the two keys independently of each other', () => {
        setAppearance({ show_tabs: 'none' });
        expect([showTabs(), editorActions()]).toEqual(['none', 'strip']);
        setAppearance({ editor_actions: 'hidden' });
        expect([showTabs(), editorActions()]).toEqual(['multiple', 'hidden']);
    });
});

describe('the code theme', () => {
    const shiki = codeThemeIds()[0];

    it.each([
        [shiki, shiki],
        ['nope', 'tokens']
    ])('reads the code_theme key %j as %j', (value, expected) => {
        setAppearance({ code_theme: value });
        expect(codeThemeDefault()).toBe(expected);
    });
});

describe('the terminal size', () => {
    it.each([
        [12.5, 12.5],
        [3, 6],
        [100, 40],
        ['12', null],
        [Number.NaN, null],
        [Number.POSITIVE_INFINITY, null]
    ])('reads a font_px of %j as %j', (value, expected) => {
        setAppearance({ terminal: { font_px: value } });
        expect(terminalFontPx()).toBe(expected);
    });

    it.each([['x'], [[{ font_px: 12 }]]])(
        'reads a terminal key that is %j, no map, as no size and no options',
        (terminal) => {
            setAppearance({ terminal });
            expect(terminalFontPx()).toBeNull();
            expect(terminalOptions()).toStrictEqual({});
        }
    );
});

describe('the terminal options', () => {
    it('reads the four keys in the order xterm is handed them, leaving out the size', () => {
        setAppearance({
            terminal: {
                cursor_blinking: true,
                cursor_style: 'line',
                copy_on_selection: true,
                mac_option_is_meta: false,
                font_px: 14
            }
        });
        const options = terminalOptions();
        expect(options).toStrictEqual({
            macOptionIsMeta: false,
            copyOnSelection: true,
            cursorStyle: 'bar',
            cursorBlink: true
        });
        expect(Object.keys(options)).toStrictEqual([
            'macOptionIsMeta',
            'copyOnSelection',
            'cursorStyle',
            'cursorBlink'
        ]);
    });

    it.each([
        ['block', 'block'],
        ['line', 'bar'],
        ['bar', undefined],
        ['constructor', undefined],
        ['__proto__', undefined],
        [3, undefined]
    ])('reads a cursor_style of %j as %j', (value, expected) => {
        setAppearance({ terminal: { cursor_style: value } });
        expect(terminalOptions()).toStrictEqual(
            expected === undefined ? {} : { cursorStyle: expected }
        );
        expect(Object.keys(terminalOptions())).toStrictEqual(
            expected === undefined ? [] : ['cursorStyle']
        );
    });

    it.each([
        ['mac_option_is_meta', 'macOptionIsMeta'],
        ['copy_on_selection', 'copyOnSelection'],
        ['cursor_blinking', 'cursorBlink']
    ])('reads %s only when it is true or false', (key, name) => {
        for (const flag of [true, false]) {
            setAppearance({ terminal: { [key]: flag } });
            expect(terminalOptions()).toStrictEqual({ [name]: flag });
        }
        for (const value of ['yes', 'false', 1]) {
            setAppearance({ terminal: { [key]: value } });
            expect(terminalOptions()).toStrictEqual({});
            expect(Object.keys(terminalOptions())).toStrictEqual([]);
        }
    });

    it('answers a copy, so a caller cannot edit what is installed', () => {
        setAppearance({ terminal: { cursor_style: 'block' } });
        const first = terminalOptions();
        first.cursorStyle = 'bar';
        first.cursorBlink = true;
        expect(terminalOptions()).toStrictEqual({ cursorStyle: 'block' });
        expect(terminalOptions()).not.toBe(terminalOptions());
    });
});
