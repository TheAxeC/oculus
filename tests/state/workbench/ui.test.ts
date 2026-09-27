// The appearance store: the theme, the CRT overlay, the wallpaper, the glyph mode, the terminal
// size and what each view instance remembers, read and written through a fake storage. Nothing here
// touches localStorage, and the theme names it accepts are the ones config/appearance.yml lists, so
// a theme that was dropped from that file cannot come back out of a browser that still holds it.
//
// What a browser that saved nothing starts on is config/appearance.yml's too, so the defaults are
// asserted against that file rather than against a literal: the first theme of its list, its
// `crt.default`, and a wallpaper wherever it configures one the starting theme shows it under.

import { beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    crtDefault,
    defaultTheme,
    setAppearance,
    themes,
    wallpaperOnTheme
} from '../../../src/lib/state/shared/words/appearance.ts';
import { UI_KEY, UI_VERSION } from '../../../src/lib/state/workbench/ui.svelte.ts';
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
        cardMoveRequested,
        requestCardMove,
        updateTrayRequested,
        wallpaper
    } = client.ui);
});

// The store checks a stored theme against the theme list, so the list the server ships is installed
// first, exactly as the page installs it before the workbench renders.
setAppearance(loadConfig(engineDir()).config);

const DEFAULT_THEME = defaultTheme();

/** The envelope before the toggle's value became the viewer's own choice alone. */
const EARLIER_VERSION = UI_VERSION - 1;

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

    it('saves the six appearance values and one blob per instance under the one key', () => {
        // revert: src/lib/state/workbench/ui.svelte.ts "statusHidden: []," => delete
        const storage = fakeStorage();
        loadUi(storage);
        setTheme('mocha');
        setCrt(true);
        setWallpaper(true);
        setIcons(true);
        setTextScale(1.3);
        setTerminalFont(14.5);
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
            statusHidden: [],
            statusQuiet: false,
            instances: { a: { filter: 'active' }, b: 3 }
        });
    });

    it('keeps the status bar items the reader hid and Do Not Disturb, and reads them back', () => {
        // revert: src/lib/state/workbench/ui.svelte.ts "save({ ...store.current, statusHidden: hidden ? [...others, item] : others });" => save({ ...store.current });
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

    it('reads a hidden list saved wrongly as the entries it can use, and one saved before it as none', () => {
        // revert: src/lib/state/workbench/ui.svelte.ts "(item): item is string => typeof item === 'string' && item !== ''" => (item): item is string => typeof item === 'string'
        const odd = createClientState();
        odd.ui.loadUi(
            fakeStorage({
                version: UI_VERSION,
                theme: DEFAULT_THEME,
                statusHidden: ['sync', 3, '', 'sync', null, 'host'],
                statusQuiet: 'yes'
            })
        );
        expect(odd.ui.statusHidden()).toEqual(['sync', 'host']);
        expect(odd.ui.statusQuiet()).toBe(false);
        const before = createClientState();
        before.ui.loadUi(fakeStorage({ version: UI_VERSION, theme: DEFAULT_THEME }));
        expect(before.ui.statusHidden()).toEqual([]);
        expect(before.ui.statusQuiet()).toBe(false);
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

    it('bounds a saved app scale and rejects a non-number', () => {
        expect(loadUi(fakeStorage({ version: UI_VERSION, textScale: 5, instances: {} }))).toBe(
            true
        );
        expect(textScale()).toBe(1.6);
        expect(
            loadUi(fakeStorage({ version: UI_VERSION, textScale: 'large', instances: {} }))
        ).toBe(true);
        expect(textScale()).toBe(null);
    });

    it('bounds a saved terminal size and rejects a non-number', () => {
        expect(loadUi(fakeStorage({ version: UI_VERSION, terminalFont: 80, instances: {} }))).toBe(
            true
        );
        expect(terminalFont()).toBe(40);
        expect(
            loadUi(fakeStorage({ version: UI_VERSION, terminalFont: 'large', instances: {} }))
        ).toBe(true);
        expect(terminalFont()).toBe(null);
    });

    it('reads the wallpaper and the glyph mode back, each on its own', () => {
        const first = fakeStorage();
        loadUi(first);
        setWallpaper(true);
        setIcons(false);

        const second = fakeStorage(saved(first));
        expect(loadUi(second)).toBe(true);
        expect(wallpaper()).toBe(true);
        expect(icons()).toBe(false);

        setWallpaper(false);
        setIcons(true);
        const third = fakeStorage(saved(second));
        expect(loadUi(third)).toBe(true);
        expect(wallpaper()).toBe(false);
        expect(icons()).toBe(true);
    });

    // revert: src/lib/state/workbench/ui.svelte.ts "icons: typeof held.icons === 'boolean' ? held.icons : held.unicode === true," => icons: held.icons === true,
    it('reads a choice saved under the older field name when no icons field is saved', () => {
        const older = fakeStorage({
            version: UI_VERSION,
            theme: 'mocha',
            crt: false,
            unicode: true,
            instances: {}
        });
        expect(loadUi(older)).toBe(true);
        expect(icons()).toBe(true);
        const both = fakeStorage({
            version: UI_VERSION,
            theme: 'mocha',
            crt: false,
            unicode: true,
            icons: false,
            instances: {}
        });
        expect(loadUi(both)).toBe(true);
        expect(icons()).toBe(false);
    });

    // revert: src/lib/state/workbench/ui.svelte.ts "if (typeof held.icons !== 'boolean' && typeof held.unicode === 'boolean')" => if (false)
    it('writes a choice read under the older field name back under icons at once', () => {
        const older = fakeStorage({
            version: UI_VERSION,
            theme: 'mocha',
            crt: false,
            unicode: false,
            instances: {}
        });
        loadUi(older);
        expect(saved(older)).toMatchObject({ theme: 'mocha', icons: false });
        // the choice now lives under its own name, so the older field is not carried on
        expect(saved(older)).not.toHaveProperty('unicode');
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
        expect(wallpaper()).toBe(wallpaperOnTheme('mocha'));
        expect(icons()).toBe(false);
    });

    it('reads a wallpaper saved by the earlier envelope as no choice at all', () => {
        // Every save wrote that field then, so a false there is not a press of the toggle.
        const storage = fakeStorage({
            version: EARLIER_VERSION,
            theme: 'mocha',
            crt: true,
            wallpaper: false,
            instances: { a: 1 }
        });
        expect(loadUi(storage)).toBe(true);
        expect(wallpaperOnTheme('mocha')).toBe(true);
        expect(wallpaper()).toBe(true);
        expect(crt()).toBe(true);
        expect(instanceState('a')).toBe(1);
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

    it('saves and restores distinct source working and saved copies by instance id', () => {
        const first = fakeStorage();
        loadUi(first);
        const one = {
            text: 'unsaved one',
            saved: 'disk one',
            loaded: true,
            error: '',
            message: ''
        };
        const two = {
            text: 'unsaved two',
            saved: 'disk two',
            loaded: true,
            error: '',
            message: ''
        };
        setInstanceState('source-one', one);
        setInstanceState('source-two', two);
        const second = fakeStorage(saved(first));
        expect(loadUi(second)).toBe(true);
        expect(instanceState('source-one')).toEqual(one);
        expect(instanceState('source-two')).toEqual(two);
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
