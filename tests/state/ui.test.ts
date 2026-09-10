// The appearance store: the theme, the CRT overlay and what each view instance remembers, read and
// written through a fake storage. Nothing here touches localStorage, and the theme names it accepts
// are the ones config/text.yml lists, so a theme that was dropped from the catalog cannot come back
// out of a browser that still holds it.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog, themeOrder } from '../../src/lib/state/text.ts';
import {
    DEFAULT_THEME,
    UI_KEY,
    UI_VERSION,
    crt,
    instanceState,
    loadUi,
    setCrt,
    setInstanceState,
    setTheme,
    theme
} from '../../src/lib/state/ui.svelte.ts';

// The store checks a stored theme against the catalog, so the catalog the server ships is installed
// first, exactly as the page installs it before the workbench renders.
setCatalog(textCatalog(loadConfig(engineDir()).config));

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
    it('starts on the default theme with no overlay and nothing remembered', () => {
        const storage = fakeStorage();
        expect(loadUi(storage)).toBe(false);
        expect(theme()).toBe(DEFAULT_THEME);
        expect(crt()).toBe(false);
        expect(instanceState('a')).toBe(undefined);
    });

    it('saves the theme, the overlay and one blob per instance under the one key', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setTheme('mocha');
        setCrt(true);
        setInstanceState('a', { filter: 'active' });
        setInstanceState('b', 3);

        expect(Object.keys(storage.held)).toEqual([UI_KEY]);
        expect(saved(storage)).toEqual({
            version: UI_VERSION,
            theme: 'mocha',
            crt: true,
            instances: { a: { filter: 'active' }, b: 3 }
        });
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

    it('falls back to the default theme for a stored name the catalog does not list', () => {
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

    it('refuses a name the catalog does not list when it is set as well', () => {
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

    it('accepts every theme the catalog lists', () => {
        loadUi(fakeStorage());
        for (const name of themeOrder()) {
            setTheme(name);
            expect(theme()).toBe(name);
        }
    });
});
