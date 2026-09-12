// The appearance store: the theme, the CRT overlay, the wallpaper, the glyph mode and what each
// view instance remembers, read and written through a fake storage. Nothing here touches
// localStorage, and the theme names it accepts are the ones config/appearance.yml lists, so a theme
// that was dropped from that file cannot come back out of a browser that still holds it.
//
// What a browser that saved nothing starts on is config/appearance.yml's too, so the defaults are
// asserted against that file rather than against a literal: the first theme of its list, its
// `crt.default`, and a wallpaper wherever it configures one the starting theme shows it under.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import {
    crtDefault,
    defaultTheme,
    setAppearance,
    themes,
    wallpaperOnTheme
} from '../../src/lib/state/appearance.ts';
import {
    UI_KEY,
    UI_VERSION,
    crt,
    instanceState,
    loadUi,
    requestUpdateTray,
    setCrt,
    setInstanceState,
    setTheme,
    setUnicode,
    setWallpaper,
    theme,
    unicode,
    updateTrayRequested,
    wallpaper
} from '../../src/lib/state/ui.svelte.ts';

// The store checks a stored theme against the theme list, so the list the server ships is installed
// first, exactly as the page installs it before the workbench renders.
setAppearance(loadConfig(engineDir()).config);

const DEFAULT_THEME = defaultTheme();

/** A fake Storage: what the store needs of one, and a window on what it wrote. */
function fakeStorage(seed?: unknown) {
    const held: Record<string, string> =
        seed === undefined ? {} : { [UI_KEY]: JSON.stringify(seed) };
    return {
        held,
        getItem: (key: string): string | null => held[key] ?? null,
        setItem: (key: string, value: string): void => {
            held[key] = value;
        }
    };
}

/** What the store wrote, as the object it wrote. */
function saved(storage: { held: Record<string, string> }): Record<string, unknown> {
    return JSON.parse(storage.held[UI_KEY]) as Record<string, unknown>;
}

describe('the appearance store', () => {
    it('starts on what config/appearance.yml says, with nothing remembered', () => {
        const storage = fakeStorage();
        expect(loadUi(storage)).toBe(false);
        expect(theme()).toBe(DEFAULT_THEME);
        expect(DEFAULT_THEME).toBe(themes()[0].name);
        expect(crt()).toBe(crtDefault());
        expect(wallpaper()).toBe(wallpaperOnTheme(DEFAULT_THEME));
        expect(unicode()).toBe(false);
        expect(instanceState('a')).toBe(undefined);
    });

    it('saves the four appearance flags and one blob per instance under the one key', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setTheme('mocha');
        setCrt(true);
        setWallpaper(true);
        setUnicode(true);
        setInstanceState('a', { filter: 'active' });
        setInstanceState('b', 3);

        expect(Object.keys(storage.held)).toEqual([UI_KEY]);
        expect(saved(storage)).toEqual({
            version: UI_VERSION,
            theme: 'mocha',
            crt: true,
            wallpaper: true,
            unicode: true,
            instances: { a: { filter: 'active' }, b: 3 }
        });
    });

    it('reads the wallpaper and the glyph mode back, each on its own', () => {
        const first = fakeStorage();
        loadUi(first);
        setWallpaper(true);
        setUnicode(false);

        const second = fakeStorage(saved(first));
        expect(loadUi(second)).toBe(true);
        expect(wallpaper()).toBe(true);
        expect(unicode()).toBe(false);

        setWallpaper(false);
        setUnicode(true);
        const third = fakeStorage(saved(second));
        expect(loadUi(third)).toBe(true);
        expect(wallpaper()).toBe(false);
        expect(unicode()).toBe(true);
    });

    it('takes the two flags from the config when the saved appearance predates them', () => {
        const storage = fakeStorage({
            version: UI_VERSION,
            theme: 'mocha',
            crt: false,
            instances: {}
        });
        expect(loadUi(storage)).toBe(true);
        expect(theme()).toBe('mocha');
        expect(wallpaper()).toBe(wallpaperOnTheme(DEFAULT_THEME));
        expect(unicode()).toBe(false);
    });

    it('reads back what it wrote', () => {
        const first = fakeStorage();
        loadUi(first);
        setTheme('nord');
        setCrt(true);
        setInstanceState('a', { at: 2 });

        const second = fakeStorage(saved(first));
        expect(loadUi(second)).toBe(true);
        expect(theme()).toBe('nord');
        expect(crt()).toBe(true);
        expect(instanceState('a')).toEqual({ at: 2 });
    });

    it('keeps two instances of the same view apart by their ids', () => {
        loadUi(fakeStorage());
        setInstanceState('one', { pick: 'a' });
        setInstanceState('two', { pick: 'b' });
        expect(instanceState('one')).toEqual({ pick: 'a' });
        expect(instanceState('two')).toEqual({ pick: 'b' });
    });

    it('falls back to the default theme for a stored name the theme list does not hold', () => {
        const storage = fakeStorage({
            version: UI_VERSION,
            theme: 'chartreuse',
            crt: true,
            instances: { a: 1 }
        });
        expect(loadUi(storage)).toBe(true);
        expect(theme()).toBe(DEFAULT_THEME);
        expect(crt()).toBe(true);
        expect(instanceState('a')).toBe(1);
    });

    it('refuses a name the theme list does not hold when it is set as well', () => {
        loadUi(fakeStorage());
        setTheme('mocha');
        setTheme('chartreuse');
        expect(theme()).toBe(DEFAULT_THEME);
    });

    it('falls back whole on another version, on nothing readable, and on a broken shape', () => {
        expect(loadUi(fakeStorage({ version: UI_VERSION + 1, theme: 'mocha' }))).toBe(false);
        expect(theme()).toBe(DEFAULT_THEME);

        const broken = fakeStorage();
        broken.held[UI_KEY] = 'not json';
        expect(loadUi(broken)).toBe(false);
        expect(theme()).toBe(DEFAULT_THEME);

        expect(loadUi(fakeStorage({ version: UI_VERSION, theme: 5, instances: 'none' }))).toBe(
            true
        );
        expect(theme()).toBe(DEFAULT_THEME);
        expect(instanceState('a')).toBe(undefined);
    });

    it('accepts every theme config/appearance.yml lists', () => {
        loadUi(fakeStorage());
        for (const entry of themes()) {
            setTheme(entry.name);
            expect(theme()).toBe(entry.name);
        }
    });
});

describe('the Update tray request', () => {
    it('changes the observed counter once for every request', () => {
        const before = updateTrayRequested();
        requestUpdateTray();
        requestUpdateTray();
        expect(updateTrayRequested()).toBe(before + 2);
    });
});
