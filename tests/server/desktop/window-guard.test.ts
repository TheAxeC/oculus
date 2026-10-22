// Layer 4, server test. The decisions the desktop host makes before it lets a window do anything,
// each a pure function of its inputs that imports nothing from electron: where an address goes,
// which sender the bridge answers, which permission a page is granted, the web preferences every
// window is made with, the colours a window takes before its page paints, and the fill it takes
// from its page once a theme is drawn.

import { cpSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { linkDecision, movedPort } from '../../../src/desktop/decide/links.ts';
import { permissionGranted } from '../../../src/desktop/decide/permissions.ts';
import { mayCall, printTarget, senderOf } from '../../../src/desktop/decide/sender.ts';
import {
    drawnFill,
    overlayColours,
    TITLEBAR_HEIGHT,
    windowFill,
    windowFrame,
    windowPreferences
} from '../../../src/desktop/decide/window-options.ts';
import * as channels from '../../../src/desktop/decide/channels.ts';
import {
    CLOSE_FIND,
    FIND,
    OPEN_FLOAT_WINDOW,
    PRINT_PDF,
    STOP_FIND,
    TITLE_COLOURS
} from '../../../src/desktop/decide/channels.ts';
import { startColours } from '../../../src/desktop/windows/start-colours.ts';
import { windowStart } from '../../../src/lib/data/helpers/editor/start-theme.ts';
import { fileOffers, NO_OFFERS } from '../../../src/lib/data/helpers/files/apps/choices.ts';
import { vscodeRuleIds } from '../../../src/lib/data/places/code-rules.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    configuredTheme,
    setAppearance,
    startClass,
    themeClass
} from '../../../src/lib/state/shared/words/appearance.ts';
import { plantSaved } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const ORIGIN = 'http://127.0.0.1:8817';

/** Two colours a window's frame is handed, which it passes on as they are. */
const COLOURS = { background: '#123456', symbol: '#abcdef' };

describe('the desktop host decisions', () => {
    it('sends each address where the link decision says', () => {
        const where = (address: string) => linkDecision(address, ORIGIN);
        expect(where(`${ORIGIN}/`)).toEqual({ kind: 'main' });
        expect(where(`${ORIGIN}/?float=f1`)).toEqual({ kind: 'float', id: 'f1' });
        expect(where(`${ORIGIN}/api/file/hub/a.pdf`)).toEqual({ kind: 'browser' });
        expect(where('https://example.org/')).toEqual({ kind: 'browser' });
        expect(where('mailto:a@b.c')).toEqual({ kind: 'browser' });
        expect(where('file:///etc/hosts')).toEqual({ kind: 'refused' });
        expect(where('javascript:alert(1)')).toEqual({ kind: 'refused' });
        expect(where('not an address')).toEqual({ kind: 'refused' });
        expect(where('http://127.0.0.1:8790/')).toEqual({ kind: 'browser' });
        expect(where('http://localhost:8817/')).toEqual({ kind: 'browser' });
        expect(where(`${ORIGIN}/?float=f1&owner=p1`)).toEqual({ kind: 'float', id: 'f1' });
        expect(where(`${ORIGIN}/?float=f1&x=1`)).toEqual({ kind: 'browser' });
        expect(movedPort('http://127.0.0.1:8819/', ORIGIN)).toBe(8819);
        expect(movedPort('http://127.0.0.1:8819/?float=f1', ORIGIN)).toBe(8819);
        expect(movedPort(`${ORIGIN}/`, ORIGIN)).toBeNull();
        expect(movedPort('http://localhost:8819/', ORIGIN)).toBeNull();
        expect(movedPort('https://127.0.0.1:8819/', ORIGIN)).toBeNull();
    });

    it("answers the bridge only from the top frame of the server's page", () => {
        const top = { origin: ORIGIN, isTop: true, pathname: '/' };
        expect(senderOf(top, ORIGIN)).toBe('page');
        expect(senderOf({ ...top, isTop: false }, ORIGIN)).toBeNull();
        expect(senderOf({ ...top, origin: 'https://example.org' }, ORIGIN)).toBeNull();
        expect(senderOf({ ...top, origin: 'http://127.0.0.1:8790' }, ORIGIN)).toBeNull();
        expect(senderOf({ ...top, pathname: '/find' }, ORIGIN)).toBe('find-bar');
        expect(senderOf({ ...top, pathname: '/find', isTop: false }, ORIGIN)).toBeNull();
        expect(
            senderOf({ ...top, pathname: '/find', origin: 'https://example.org' }, ORIGIN)
        ).toBeNull();
        expect(mayCall('page', OPEN_FLOAT_WINDOW)).toBe(true);
        expect(mayCall('find-bar', FIND)).toBe(true);
        expect(mayCall('find-bar', STOP_FIND)).toBe(true);
        expect(mayCall('find-bar', CLOSE_FIND)).toBe(true);
        expect(mayCall('find-bar', OPEN_FLOAT_WINDOW)).toBe(false);
        expect(mayCall(null, FIND)).toBe(false);
        expect(senderOf({ ...top, pathname: '/present/print' }, ORIGIN)).toBe('print');
        expect(senderOf({ ...top, pathname: '/present/print', isTop: false }, ORIGIN)).toBeNull();
        expect(
            senderOf({ ...top, pathname: '/present/print', origin: 'https://example.org' }, ORIGIN)
        ).toBeNull();
        for (const channel of [FIND, OPEN_FLOAT_WINDOW, PRINT_PDF]) {
            expect(mayCall('print', channel), channel).toBe(false);
        }
        expect(mayCall('page', PRINT_PDF)).toBe(true);
        expect(mayCall('find-bar', PRINT_PDF)).toBe(false);
    });

    it('prints only the print route of its own server, named by a root and a path and nothing else', () => {
        const route = `${ORIGIN}/present/print`;
        expect(printTarget(`${route}?root=hub&path=deck`, ORIGIN)).toBe(
            `${route}?root=hub&path=deck`
        );
        for (const refused of [
            `${route}?root=hub`,
            `${route}?root=hub&path=deck&x=1`,
            `${route}?root=hub&path=deck#top`,
            `${ORIGIN}/?root=hub&path=deck`,
            `${ORIGIN}/find?root=hub&path=deck`,
            `http://127.0.0.1:8790/present/print?root=hub&path=deck`,
            `https://example.org/present/print?root=hub&path=deck`,
            'file:///etc/hosts',
            'not an address'
        ]) {
            expect(printTarget(refused, ORIGIN), refused).toBeNull();
        }
    });

    it('sends the audience route of its own server, named by a root and a path and nothing else, to an app window of its own', () => {
        const route = `${ORIGIN}/present/show`;
        const where = (address: string) => linkDecision(address, ORIGIN);
        expect(where(`${route}?root=hub&path=deck`)).toEqual({
            kind: 'audience',
            root: 'hub',
            path: 'deck'
        });
        expect(where(`${route}?path=talks%2Fa&root=hub`)).toEqual({
            kind: 'audience',
            root: 'hub',
            path: 'talks/a'
        });
        expect(where(`${route}?root=hub&path=`)).toEqual({
            kind: 'audience',
            root: 'hub',
            path: ''
        });
        for (const other of [
            `${route}?root=hub`,
            `${route}?path=deck`,
            `${route}?root=&path=deck`,
            `${route}?root=hub&path=deck&x=1`,
            `${route}?root=hub&path=deck#top`,
            route,
            `${ORIGIN}/present/print?root=hub&path=deck`,
            `${ORIGIN}/present/show/?root=hub&path=deck`,
            `http://127.0.0.1:8790/present/show?root=hub&path=deck`,
            `https://example.org/present/show?root=hub&path=deck`
        ]) {
            expect(where(other), other).toEqual({ kind: 'browser' });
        }
        expect(where('file:///present/show?root=hub&path=deck')).toEqual({ kind: 'refused' });
    });

    it("answers no bridge channel to the audience window's page", () => {
        const top = { origin: ORIGIN, isTop: true, pathname: '/present/show' };
        expect(senderOf(top, ORIGIN)).toBe('audience');
        expect(senderOf({ ...top, isTop: false }, ORIGIN)).toBeNull();
        expect(senderOf({ ...top, origin: 'https://example.org' }, ORIGIN)).toBeNull();
        const named = Object.values(channels).filter((value) => typeof value === 'string');
        expect(named).toContain(OPEN_FLOAT_WINDOW);
        for (const channel of named) {
            expect(mayCall('audience', channel), channel).toBe(false);
        }
    });

    it("takes the strip's colours from the window's own page alone, each a hex colour, off macOS", () => {
        expect(mayCall('page', TITLE_COLOURS)).toBe(true);
        for (const who of ['find-bar', 'print', 'audience', null] as const) {
            expect(mayCall(who, TITLE_COLOURS), String(who)).toBe(false);
        }
        expect(overlayColours('win32', '#1f1f1f', '#cccccc')).toEqual({
            color: '#1f1f1f',
            symbolColor: '#cccccc'
        });
        expect(overlayColours('linux', '#ABC', '#1f1f1f80')).toEqual({
            color: '#ABC',
            symbolColor: '#1f1f1f80'
        });
        expect(overlayColours('darwin', '#1f1f1f', '#cccccc')).toBeNull();
        for (const wrong of [
            'red',
            'rgb(31, 31, 31)',
            '#12345',
            '#1f1f1g',
            ' #1f1f1f',
            '#1f1f1f; color: red',
            '',
            31,
            null,
            undefined,
            ['#1f1f1f']
        ]) {
            expect(overlayColours('win32', wrong, '#cccccc'), String(wrong)).toBeNull();
            expect(overlayColours('linux', '#1f1f1f', wrong), String(wrong)).toBeNull();
        }
    });

    it('fills the window with the background of the theme its page drew, a hex colour on every system', () => {
        expect(drawnFill('#1e1e2e')).toBe('#1e1e2e');
        expect(drawnFill('#F1F5F9')).toBe('#F1F5F9');
        for (const wrong of [
            'red',
            'rgb(30, 30, 46)',
            '#12345',
            '#1e1e2g',
            ' #1e1e2e',
            '#1e1e2e; color: red',
            '',
            30,
            null,
            undefined,
            ['#1e1e2e']
        ]) {
            expect(drawnFill(wrong), String(wrong)).toBeNull();
        }
    });

    it("grants clipboard and full screen to the server's page alone and denies every other ask", () => {
        for (const permission of ['clipboard-read', 'clipboard-sanitized-write', 'fullscreen']) {
            expect(permissionGranted(permission, ORIGIN, ORIGIN)).toBe(true);
            expect(permissionGranted(permission, 'https://example.org', ORIGIN)).toBe(false);
        }
        for (const permission of [
            'media',
            'geolocation',
            'notifications',
            'openExternal',
            'midi'
        ]) {
            expect(permissionGranted(permission, ORIGIN, ORIGIN)).toBe(false);
            expect(permissionGranted(permission, 'https://example.org', ORIGIN)).toBe(false);
        }
    });

    it('makes every window with Node integration off and isolation and the sandbox on, subframes included', () => {
        expect(windowPreferences('/x/preload.cjs')).toEqual({
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            nodeIntegrationInSubFrames: false,
            webSecurity: true,
            spellcheck: true,
            preload: '/x/preload.cjs'
        });
    });

    it.each([
        {
            row: 'takes the first press on an inactive window and holds the window buttons inside the strip',
            platform: 'darwin',
            keys: ['acceptFirstMouse', 'titleBarStyle', 'trafficLightPosition'],
            frame: { titleBarStyle: 'hidden', acceptFirstMouse: true }
        },
        ...['win32', 'linux'].map((platform) => ({
            row: "draws the window buttons over the strip's right end at its height",
            platform,
            keys: ['titleBarOverlay', 'titleBarStyle'],
            frame: {
                titleBarStyle: 'hidden',
                titleBarOverlay: {
                    height: TITLEBAR_HEIGHT,
                    color: COLOURS.background,
                    symbolColor: COLOURS.symbol
                }
            }
        }))
    ])(
        "makes the frame of a main window and a float's window on $platform that $row",
        ({ platform, keys, frame }) => {
            const made = windowFrame(platform, COLOURS);
            expect(Object.keys(made).sort()).toEqual(keys);
            expect(made).toMatchObject(frame);
        }
    );

    it('leaves the colours to the system and Electron when the start theme gives none', () => {
        expect(windowFrame('linux', null)).toEqual({
            titleBarStyle: 'hidden',
            titleBarOverlay: { height: TITLEBAR_HEIGHT }
        });
        expect(windowFill(null)).toEqual({});
        expect(windowFill(COLOURS)).toEqual({ backgroundColor: COLOURS.background });
    });
});

// The colours a window takes before its page paints, read from the checkout's theme sheets: the
// background and the title bar words of the theme the window starts on, for the workspace a state
// folder opens, with the config read from the folder `--engine` names, which may hold config/
// alone. The values below are the ones the blocks of src/lib/themes/ set: `vscode-dark-modern` in
// vscode.css, `mocha` in rice/catppuccin.css (which sets no title bar words, so its ink is taken)
// and `:root` in tokens.css for the light theme.
describe('the colours of the theme a window starts on', { tags: ['slow'] }, () => {
    const engine = engineDir();
    const DARK_MODERN = { background: '#181818', symbol: '#cccccc' };
    const LIGHT = { background: '#f1f5f9', symbol: '#0f172a' };

    /** The start colours for a saved workspace whose file's `settings:` block is `settings`. */
    const startWith = (settings: string) =>
        startColours(
            engine,
            engine,
            {},
            plantSaved(scratchDir('oculus-start-hub-'), settings).state
        );

    it('reads the start theme app_theme names when theme is empty, from its stylesheet block', () => {
        const config = loadConfig(engine).config;
        expect([config.theme, config.app_theme]).toEqual(['', 'vscode-dark-modern']);
        expect(startColours(engine, engine, {}, scratchDir('oculus-start-state-'))).toEqual(
            DARK_MODERN
        );
        expect(startWith('')).toEqual(DARK_MODERN);
    });

    it("reads the theme the workspace file's theme names, and the start for an app's theme the server told no file of", () => {
        expect(startWith('settings:\n  theme: mocha\n')).toEqual({
            background: '#181825',
            symbol: '#cdd6f4'
        });
        expect(startWith('settings:\n  theme: app:rice-pack/paper\n')).toEqual(DARK_MODERN);
        expect(startWith('settings:\n  theme: light\n  app_theme: mocha\n')).toEqual(LIGHT);
    });

    it("reads the workspace file's app_theme, and the first theme listed when it names none", () => {
        expect(startWith('settings:\n  app_theme: mocha\n')).toEqual({
            background: '#181825',
            symbol: '#cdd6f4'
        });
        expect(startWith('settings:\n  app_theme: gone\n')).toEqual(LIGHT);
    });

    it('reads the sheets from the code folder when the config folder holds config/ alone', () => {
        const configOnly = scratchDir('oculus-start-engine-');
        cpSync(join(engine, 'config'), join(configOnly, 'config'), { recursive: true });
        const state = scratchDir('oculus-start-state-');
        expect(startColours(configOnly, engine, {}, state)).toEqual(DARK_MODERN);
    });

    it("keeps oculus's app_theme for an empty or a wrong one in a workspace file, and reads the first of two rows of a name", () => {
        expect(startWith('settings:\n  app_theme: ""\n')).toEqual(DARK_MODERN);
        expect(startWith('settings:\n  app_theme: 5\n')).toEqual(DARK_MODERN);
        const twice = [
            { name: 'x', class: 'mocha' },
            { name: 'x', class: 'latte' }
        ];
        expect(windowStart({ themes: twice, theme: '', app_theme: 'x' }, [])).toEqual({
            cls: 'mocha'
        });
        expect(windowStart({ themes: 'none', theme: 'x', app_theme: 'x' }, [])).toEqual({
            cls: ''
        });
    });
});

// The page in the desktop app's window starts on the theme by the rule the host fills the window
// by (data/helpers/editor/start-theme.ts): the class of the page's start theme is the class the
// host reads from the same config, for the configs whose start theme is a row of `themes:`.
describe('the theme the page and the host start a window on', () => {
    const shipped = loadConfig(engineDir()).config;
    const classes = vscodeRuleIds();

    afterEach(() => {
        setAppearance(shipped, classes);
    });

    it.each([
        { row: 'the shipped config', settings: {} },
        { row: 'an empty app_theme', settings: { app_theme: '' } },
        { row: 'an app_theme that is no words', settings: { app_theme: 5 } },
        { row: 'an app_theme naming no theme', settings: { app_theme: 'gone' } },
        { row: 'a theme naming a row', settings: { theme: 'mocha' } },
        {
            row: "a theme naming an app's theme the first load carries no file of",
            settings: { theme: 'app:rice-pack/paper' },
            files: { 'app:rice-pack/paper': null }
        },
        {
            row: 'two rows of one name',
            settings: {
                themes: [
                    { name: 'x', class: 'mocha', glyph: 'theme_base' },
                    { name: 'x', class: 'latte', glyph: 'theme_base' }
                ],
                app_theme: 'x'
            }
        }
    ])('starts both on one class with $row', ({ settings, files }) => {
        const merged = { ...shipped, ...settings };
        setAppearance(merged, classes);
        const offers = fileOffers(files ?? {});
        expect({ cls: themeClass(configuredTheme(true, offers), offers, true) }).toEqual(
            windowStart(merged, [])
        );
    });

    it("draws an app's theme no acting app offers, or the first load carries no file of, in the start theme of its page", () => {
        const choice = 'app:rice-pack/paper';
        const offered = { themes: [], icons: [] };
        expect([startClass(true), startClass(false)]).toEqual(['vscode-dark-modern', '']);
        expect(themeClass(choice, offered, true)).toBe('vscode-dark-modern');
        expect(themeClass(choice, offered, false)).toBe('');
        const carried = fileOffers({ [choice]: null });
        expect(themeClass(choice, carried, true)).toBe('vscode-dark-modern');
        expect(themeClass(choice, carried, false)).toBe('');
    });

    it("reads an app's theme in the start theme's class while the page knows no app yet", () => {
        expect(themeClass('app:rice-pack/paper', NO_OFFERS, true)).toBe('vscode-dark-modern');
        expect(themeClass('app:rice-pack/paper', NO_OFFERS, false)).toBe('');
    });
});
