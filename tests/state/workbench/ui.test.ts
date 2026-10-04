// Layer 2, client-state tests. The appearance store: the theme, the CRT overlay, the wallpaper, the
// glyph mode, the terminal size and what each view instance remembers, read and written through a
// fake storage. Nothing here touches localStorage, and the theme names it accepts are the ones
// config/appearance.yml lists, so a theme that was dropped from that file cannot come back out of a
// browser that still holds it.
//
// What a browser that saved nothing starts on is config/appearance.yml's too, so the defaults are
// asserted against that file rather than against a literal: the first theme of its list, its
// `crt.default`, and a wallpaper wherever it configures one the starting theme shows it under.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    codeThemeDefault,
    crtDefault,
    defaultTheme,
    setAppearance,
    themes,
    wallpaperOnTheme
} from '../../../src/lib/state/shared/words/appearance.ts';
import { UI_KEY, UI_VERSION, createUi } from '../../../src/lib/state/workbench/ui.svelte.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let crt: ClientState['ui']['crt'];
let instanceState: ClientState['ui']['instanceState'];
let loadUi: ClientState['ui']['loadUi'];
let requestUpdateTray: ClientState['ui']['requestUpdateTray'];
let setCrt: ClientState['ui']['setCrt'];
let setInstanceState: ClientState['ui']['setInstanceState'];
let setTextScale: ClientState['ui']['setTextScale'];
let setTerminalFont: ClientState['ui']['setTerminalFont'];
let setTheme: ClientState['ui']['setTheme'];
let setIcons: ClientState['ui']['setIcons'];
let setWallpaper: ClientState['ui']['setWallpaper'];
let stepTextScale: ClientState['ui']['stepTextScale'];
let theme: ClientState['ui']['theme'];
let textScale: ClientState['ui']['textScale'];
let terminalFont: ClientState['ui']['terminalFont'];
let icons: ClientState['ui']['icons'];
let codeTheme: ClientState['ui']['codeTheme'];
let setCodeTheme: ClientState['ui']['setCodeTheme'];
let cardMoveRequested: ClientState['ui']['cardMoveRequested'];
let requestCardMove: ClientState['ui']['requestCardMove'];
let updateTrayRequested: ClientState['ui']['updateTrayRequested'];
let wallpaper: ClientState['ui']['wallpaper'];

beforeEach(() => {
    client = createClientState();
    ({
        crt,
        instanceState,
        loadUi,
        requestUpdateTray,
        setCrt,
        setInstanceState,
        setTextScale,
        setTerminalFont,
        setTheme,
        setIcons,
        setWallpaper,
        stepTextScale,
        theme,
        textScale,
        terminalFont,
        icons,
        codeTheme,
        setCodeTheme,
        cardMoveRequested,
        requestCardMove,
        updateTrayRequested,
        wallpaper
    } = client.ui);
});

// The store checks a stored theme against the theme list, so the list the server ships is installed
// first, exactly as the page installs it before the workbench renders.
const SHIPPED = loadConfig(engineDir()).config;
setAppearance(SHIPPED);

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
        expect(icons()).toBe(false);
        expect(textScale()).toBe(null);
        expect(terminalFont()).toBe(null);
        expect(instanceState('a')).toBe(undefined);
    });

    // Revert: save the pick without its field (`save({ ...store.current })` in setCodeTheme); the
    // envelope then holds codeTheme null.
    it('saves the seven appearance values and one blob per instance under the one key', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setTheme('mocha');
        setCrt(true);
        setWallpaper(true);
        setIcons(true);
        setTextScale(1.3);
        setTerminalFont(14.5);
        setCodeTheme('nord');
        setInstanceState('a', { filter: 'active' });
        setInstanceState('b', 3);

        expect(Object.keys(storage.held)).toEqual([UI_KEY]);
        expect(saved(storage)).toEqual({
            version: UI_VERSION,
            theme: 'mocha',
            crt: true,
            wallpaper: true,
            icons: true,
            textScale: 1.3,
            terminalFont: 14.5,
            codeTheme: 'nord',
            statusHidden: [],
            statusQuiet: false,
            instances: { a: { filter: 'active' }, b: 3 }
        });
    });

    it('keeps the status bar items the reader hid and Do Not Disturb, and reads them back', () => {
        const storage = fakeStorage();
        loadUi(storage);
        expect(client.ui.statusHidden()).toEqual([]);
        expect(client.ui.statusQuiet()).toBe(false);
        client.ui.setStatusHidden('branch', true);
        client.ui.setStatusHidden('bell', true);
        // hiding one twice keeps it once, and showing it takes it out
        client.ui.setStatusHidden('branch', true);
        client.ui.setStatusHidden('bell', false);
        client.ui.setStatusQuiet(true);
        expect(saved(storage)).toMatchObject({ statusHidden: ['branch'], statusQuiet: true });

        const again = createClientState();
        again.ui.loadUi(storage);
        expect(again.ui.statusHidden()).toEqual(['branch']);
        expect(again.ui.statusQuiet()).toBe(true);
    });

    it('loads an envelope that still carries dismissed lead ids without keeping the field', () => {
        const storage = fakeStorage({
            version: UI_VERSION,
            theme: 'mocha',
            crt: true,
            leadsDismissed: ['lead-one', 'lead-two'],
            instances: { a: 1 }
        });
        expect(loadUi(storage)).toBe(true);
        expect(theme()).toBe('mocha');
        expect(crt()).toBe(true);
        expect(instanceState('a')).toBe(1);

        setTheme('nord');
        const written = saved(storage);
        expect(written.version).toBe(UI_VERSION);
        expect('leadsDismissed' in written).toBe(false);
    });

    it('bounds a chosen terminal size and restores the null config default', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setTerminalFont(2);
        expect(terminalFont()).toBe(6);
        setTerminalFont(45);
        expect(terminalFont()).toBe(40);
        setTerminalFont(null);
        expect(terminalFont()).toBe(null);
        expect(saved(storage).terminalFont).toBe(null);
    });

    it('saves tenth-step app scales, bounds them, and uses null for the default one', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setTextScale(0.51);
        expect(textScale()).toBe(0.7);
        setTextScale(1.74);
        expect(textScale()).toBe(1.6);
        setTextScale(1.24);
        expect(textScale()).toBe(1.2);
        setTextScale(1);
        expect(textScale()).toBe(null);
        expect(saved(storage).textScale).toBe(null);
    });

    it('steps down from the default, stops at the upper bound, and returns to null at one', () => {
        const storage = fakeStorage();
        loadUi(storage);
        stepTextScale(-1);
        expect(textScale()).toBe(0.9);
        expect(saved(storage).textScale).toBe(0.9);
        setTextScale(1.5);
        stepTextScale(1);
        expect(textScale()).toBe(1.6);
        stepTextScale(1);
        expect(textScale()).toBe(1.6);
        expect(saved(storage).textScale).toBe(1.6);
        setTextScale(0.9);
        stepTextScale(1);
        expect(textScale()).toBe(null);
        expect(saved(storage).textScale).toBe(null);
    });

    it('keeps a wallpaper the toggle turned off under a theme that shows one', () => {
        const first = fakeStorage();
        loadUi(first);
        setTheme('mocha');
        setWallpaper(false);
        expect(saved(first).version).toBe(UI_VERSION);

        const second = fakeStorage(saved(first));
        expect(loadUi(second)).toBe(true);
        expect(wallpaper()).toBe(false);
    });

    it('follows the theme while the toggle has not been pressed', () => {
        loadUi(fakeStorage());
        expect(wallpaperOnTheme('light')).not.toBe(wallpaperOnTheme('mocha'));
        setTheme('light');
        expect(wallpaper()).toBe(wallpaperOnTheme('light'));
        setTheme('mocha');
        expect(wallpaper()).toBe(wallpaperOnTheme('mocha'));
    });

    it('leaves the wallpaper unchosen when another value is saved', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setTextScale(1.3);
        expect(saved(storage).wallpaper).toBe(null);
        setTheme('mocha');
        expect(saved(storage).wallpaper).toBe(null);
        expect(wallpaper()).toBe(wallpaperOnTheme('mocha'));
    });

    it('lists the instance records whose key starts with a prefix and clears them in one save', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setInstanceState('t1', { pick: 'a' });
        setInstanceState('t1#files:alpha', { expanded: ['hub:a'] });
        setInstanceState('t1#files:beta', 2);
        setInstanceState('t10#files:alpha', 3);
        setInstanceState('t1#forms', 4);

        expect(client.ui.instanceKeys('t1#files:').sort()).toEqual([
            't1#files:alpha',
            't1#files:beta'
        ]);
        client.ui.clearInstanceStates('t1#files:');

        expect(client.ui.instanceKeys('t1#files:')).toEqual([]);
        expect(Object.keys(saved(storage).instances as object).sort()).toEqual([
            't1',
            't1#forms',
            't10#files:alpha'
        ]);
        expect(instanceState('t1')).toEqual({ pick: 'a' });
    });

    it('refuses a name the theme list does not hold when it is set as well', () => {
        loadUi(fakeStorage());
        setTheme('mocha');
        setTheme('chartreuse');
        expect(theme()).toBe(DEFAULT_THEME);
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

describe('the keyboard reorder request', () => {
    it('reaches the instance the cursor was in, and no other', () => {
        requestCardMove('collection-one', 'alpha', 1);
        expect(cardMoveRequested('collection-one')).toMatchObject({
            instance: 'collection-one',
            card: 'alpha',
            step: 1
        });
        expect(cardMoveRequested('collection-two')).toBe(null);
    });

    it('carries a new sequence number per request, so one press moves one card once', () => {
        requestCardMove('collection-one', 'alpha', -1);
        const first = cardMoveRequested('collection-one')?.seq ?? 0;
        requestCardMove('collection-one', 'alpha', -1);
        const second = cardMoveRequested('collection-one')?.seq ?? 0;
        expect(second).toBe(first + 1);
    });
});

describe('the code theme', () => {
    /** The configured code theme, put in place for one case and restored after. */
    function configured(value: unknown): void {
        setAppearance({ ...SHIPPED, code_theme: value });
    }

    afterEach(() => {
        setAppearance(SHIPPED);
    });

    // Revert: answer `store.current.codeTheme ?? 'tokens'` in codeTheme(); the configured default
    // is then never reached.
    it('is the configured default for a browser that saved nothing, before and after a load', () => {
        configured('dark-plus');
        expect(codeTheme()).toBe('dark-plus');
        loadUi(fakeStorage());
        expect(codeTheme()).toBe('dark-plus');
        expect(codeTheme()).toBe(codeThemeDefault());
    });

    // Revert: freeze the default into the envelope at the first save; the case then answers
    // dark-plus although the config moved on, and the envelope holds it.
    it('follows a live edit of the key in a browser that has not picked, through any other save', () => {
        configured('tokens');
        const storage = fakeStorage();
        loadUi(storage);
        setTheme('mocha');
        setCrt(true);
        expect(saved(storage).codeTheme).toBeNull();
        configured('nord');
        expect(codeTheme()).toBe('nord');
    });

    // Revert: load codeTheme with a fallback to the default instead of null; the pick then
    // freezes at the first save of any field.
    it('keeps the config default reaching a browser with a saved theme and instance state', () => {
        configured('tokens');
        const storage = fakeStorage({
            version: UI_VERSION,
            theme: 'mocha',
            instances: { a: { filter: 'active' } }
        });
        loadUi(storage);
        setTextScale(1.2);
        configured('dark-plus');
        expect(codeTheme()).toBe('dark-plus');
        expect(theme()).toBe('mocha');
        expect(instanceState('a')).toEqual({ filter: 'active' });
    });

    // Revert: read no codeTheme in loadUi (`codeTheme: null`); the pick is lost on the reload.
    it('saves a pick under the one key and reads it back from the same storage', () => {
        const storage = fakeStorage();
        loadUi(storage);
        setCodeTheme('nord');
        expect(Object.keys(storage.held)).toEqual([UI_KEY]);
        expect(saved(storage).codeTheme).toBe('nord');
        expect(saved(storage).version).toBe(UI_VERSION);
        const again = createClientState();
        again.ui.loadUi(storage);
        expect(again.ui.codeTheme()).toBe('nord');
    });

    // Revert: treat tokens as no pick; a pick of tokens then falls back to the config default.
    it('keeps a pick of tokens over a configured code theme', () => {
        configured('dark-plus');
        const storage = fakeStorage();
        loadUi(storage);
        setCodeTheme('nord');
        setCodeTheme('tokens');
        expect(codeTheme()).toBe('tokens');
        expect(saved(storage).codeTheme).toBe('tokens');
        const again = createClientState();
        again.ui.loadUi(storage);
        expect(again.ui.codeTheme()).toBe('tokens');
    });

    // Revert: save the id given whatever it is; the empty string and an unlisted id are then kept.
    it('saves no pick for the empty string or an id the list does not hold', () => {
        configured('dark-plus');
        const storage = fakeStorage();
        loadUi(storage);
        for (const value of ['', 'gone', 'Nord', 'constructor']) {
            setCodeTheme('nord');
            setCodeTheme(value);
            expect(saved(storage).codeTheme, value).toBeNull();
            expect(codeTheme(), value).toBe('dark-plus');
        }
    });

    // Revert: share one field between the code theme and the UI theme; a pick moves both.
    it('is separate from the UI theme of the same name', () => {
        loadUi(fakeStorage());
        setTheme('nord');
        expect(codeTheme()).toBe(codeThemeDefault());
        setCodeTheme('dark-plus');
        expect(theme()).toBe('nord');
        setTheme('mocha');
        expect(codeTheme()).toBe('dark-plus');
        setCodeTheme('nord');
        expect(theme()).toBe('mocha');
    });
});

describe('the values this browser chose of its own', () => {
    /** What a browser that saved nothing holds, as the config gives it. */
    function startValues() {
        return {
            theme: DEFAULT_THEME,
            codeTheme: null,
            textScale: null,
            terminalFont: null,
            crt: crtDefault(),
            wallpaper: null,
            icons: false
        };
    }

    it('gives the start values of a browser that saved nothing, whatever it holds now', () => {
        loadUi(fakeStorage());
        expect(client.ui.initial()).toEqual(startValues());
        expect(client.ui.chosen()).toEqual(startValues());
        setTheme('mocha');
        setCodeTheme('nord');
        setTextScale(1.3);
        setTerminalFont(14);
        setCrt(!crtDefault());
        setWallpaper(true);
        setIcons(true);
        expect(client.ui.initial()).toEqual(startValues());
        expect(client.ui.chosen()).toEqual({
            theme: 'mocha',
            codeTheme: 'nord',
            textScale: 1.3,
            terminalFont: 14,
            crt: !crtDefault(),
            wallpaper: true,
            icons: true
        });
    });
});

describe('the pane strip settings', () => {
    // Revert: save the pick in the browser instead of writing config/appearance.yml.
    it('writes a Tab Bar and an Editor Actions Position pick to appearance.yml', () => {
        const written: unknown[][] = [];
        const ui = createUi((...args: unknown[]) => {
            written.push(args);
            return Promise.resolve(null);
        });
        ui.setPaneStrip('show_tabs', 'single');
        ui.setPaneStrip('editor_actions', 'hidden');
        expect(written).toEqual([
            ['appearance.yml', 'show_tabs', 'single'],
            ['appearance.yml', 'editor_actions', 'hidden']
        ]);
    });

    it('ignores a pick when the store was given no writer', () => {
        expect(() => createUi().setPaneStrip('show_tabs', 'none')).not.toThrow();
    });
});
