// Layer 2, server tests. The configuration is read once a request that asks for it, and a page is
// sent with the theme it starts on: the body's class string, the CRT class on the workbench alone,
// the tokens the page derives for that class on the root element, for an app's colour theme whose
// file resolves the block the page's conversion makes of that file, in the style element the
// page's first draw replaces, and the theme's ground, its `--bg` as a hex colour with the page's
// scrollbar sheet, in a style element of its own ahead of the head Kit fills, which the page's
// first draw takes away. A request of the desktop app's window carries the host's mark in its user
// agent and starts on `app_theme`.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.
//
// Vitest empties a stylesheet a module reads as text, so the sheets the hook converts an app's
// theme over and derives the tokens and the ground over, tokens.css, themes.css, the rice palettes
// and vscode.css, and the scrollbar sheet the ground element carries, are handed the text the
// browser reads. The module registry is reset before this file's modules load, so a run whose test
// files share their modules loads the hook and the theme module over these sheets too.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, vi } from 'vitest';
import { handle } from '../../../src/hooks.server.ts';
import { DESKTOP_MARK } from '../../../src/lib/data/helpers/editor/start-theme.ts';
import { themeOffers } from '../../../src/lib/data/helpers/files/apps/choices.ts';
import type { Finding } from '../../../src/lib/data/model/index.ts';
import * as config from '../../../src/lib/data/sources/config.ts';
import { noApps, type AppsHeld } from '../../../src/lib/server/machine/apps/read/held.ts';
import { carryingHandler, type OculusRequest } from '../../../src/lib/server/root/context.ts';
import * as vscodeMap from '../../../src/lib/themes/vscode-map.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    approvedHeld,
    MANIFEST,
    PAGE,
    plant,
    type Fixture
} from '../../routes/apps/apps-fixture.ts';
import {
    applyTheme,
    GROUND_STYLE_ID,
    THEME_SHEETS,
    withThemeBlock
} from '../../../src/lib/ui/theme/theme.ts';
import { contextFixture } from './context-fixture.ts';

const { sheetText } = vi.hoisted(() => ({
    /** A sheet under src/lib/ as a module that reads it as text, holding the text on disk. */
    sheetText: async (name: string) => {
        const { readFileSync: read } = await import('node:fs');
        const path = new URL(`../../../src/lib/${name}`, import.meta.url);
        return { default: read(path, 'utf8') };
    }
}));

vi.mock('$lib/themes/tokens.css?raw', () => sheetText('themes/tokens.css'));
vi.mock('$lib/themes/themes.css?raw', () => sheetText('themes/themes.css'));
vi.mock('$lib/themes/vscode.css?raw', () => sheetText('themes/vscode.css'));
vi.mock('$lib/themes/rice/catppuccin.css?raw', () => sheetText('themes/rice/catppuccin.css'));
vi.mock('$lib/themes/rice/everforest.css?raw', () => sheetText('themes/rice/everforest.css'));
vi.mock('$lib/themes/rice/flexoki.css?raw', () => sheetText('themes/rice/flexoki.css'));
vi.mock('$lib/themes/rice/gruvbox.css?raw', () => sheetText('themes/rice/gruvbox.css'));
vi.mock('$lib/themes/rice/kanagawa.css?raw', () => sheetText('themes/rice/kanagawa.css'));
vi.mock('$lib/themes/rice/phosphor.css?raw', () => sheetText('themes/rice/phosphor.css'));
vi.mock('$lib/themes/rice/rosepine.css?raw', () => sheetText('themes/rice/rosepine.css'));
vi.mock('$lib/themes/rice/singles.css?raw', () => sheetText('themes/rice/singles.css'));
vi.mock('$lib/themes/rice/tokyo.css?raw', () => sheetText('themes/rice/tokyo.css'));
vi.mock('$lib/ui/theme/scrollbar.css?raw', () => sheetText('ui/theme/scrollbar.css'));

vi.hoisted(() => {
    vi.resetModules();
});

afterEach(() => {
    vi.restoreAllMocks();
});

type Resolve = Parameters<typeof handle>[0]['resolve'];

/** This checkout, whose tracked config/ the hook reads; nothing here writes to it. */
const ENGINE = fileURLToPath(new URL('../../..', import.meta.url));

/** One request through the hook, answered by `resolve`, over a context the case closes. */
async function through(resolve: Resolve): Promise<App.Locals> {
    const context = contextFixture({ token: 'hook-token', engine: ENGINE });
    const request = {} as OculusRequest;
    carryingHandler(() => undefined, context)(request, {});
    const locals = {} as App.Locals;
    const event = {
        platform: { req: request },
        locals,
        url: new URL('http://127.0.0.1:8791/'),
        route: { id: '/' },
        request: new Request('http://127.0.0.1:8791/')
    } as unknown as Parameters<typeof handle>[0]['event'];
    await handle({ event, resolve });
    context.close();
    return locals;
}

describe('the server hook', () => {
    it(
        'reads it once for a page, whose title and load function share the read',
        { tags: ['slow'] },
        async () => {
            const read = vi.spyOn(config, 'loadConfig');
            let html: string | undefined;
            await through(async ({ locals }, options) => {
                locals.config();
                locals.config();
                const page = '<title>%oculus.title%</title>';
                html = await options?.transformPageChunk?.({ html: page, done: true });
                return new Response(html);
            });
            expect(read).toHaveBeenCalledOnce();
            expect(html).toMatch(/^<title>[^%]+<\/title>$/);
        }
    );
});

/** The page the server renders every route from, as the hook is handed it. */
const TEMPLATE = readFileSync(new URL('../../../src/app.html', import.meta.url), 'utf8');

/** The shipped configuration's read, which a case changes the options of. */
const SHIPPED = config.loadConfig(ENGINE);

/** A user agent of the desktop app's window: Electron's, with the host's mark appended. */
const MARKED = `Mozilla/5.0 (Macintosh) Chrome/130.0 Electron/33.0.0 ${DESKTOP_MARK}`;

/** A browser's user agent. */
const BROWSER = 'Mozilla/5.0 (Macintosh) Chrome/130.0 Safari/537.36';

/** The colours of the theme file Ember: its side bar's background is the block's `--bg`. */
const EMBER_FILE = {
    colors: {
        'sideBar.background': '#7a1020',
        'editor.background': '#5a0c18',
        foreground: '#f0e0d0'
    },
    tokenColors: []
};

/** A theme file whose side bar colour would close the style element were it written as it is. */
const CLOSING_FILE = {
    colors: { 'sideBar.background': '</style><script>alert(1)</script>', foreground: '#f0e0d0' },
    tokenColors: []
};

/** An app `notes` that offers Ember from `ember.json`, and Closing from `closing.json`. */
function plantThemes(): Fixture {
    const themes =
        '    - { label: Ember, uiTheme: vs-dark, path: ember.json }\n' +
        '    - { label: Closing, uiTheme: vs-dark, path: closing.json }\n';
    return plant({
        machine: {
            'notes/app.yml': `${MANIFEST}contributes:\n  themes:\n${themes}`,
            'notes/index.html': PAGE,
            'notes/ember.json': JSON.stringify(EMBER_FILE),
            'notes/closing.json': JSON.stringify(CLOSING_FILE)
        }
    });
}

/** What one request was answered with, and what the hook read for it. */
type Sent = { html: string; reads: number; helds: number };

/**
 * A request: its path and the route Kit matched, the options its config sets over the shipped one
 * and the findings its read answers with, its user agent and its held apps.
 */
type PageCase = {
    path?: string;
    route?: string;
    options?: Record<string, unknown>;
    findings?: Finding[];
    agent?: string;
    held?: () => AppsHeld;
};

/**
 * One request through the hook over the shipped config with `options` set, answered as Kit answers
 * a page: the template handed to `transformPageChunk`, or for a route under /api/ a JSON answer
 * that never asks for the page. `reads` counts the config reads and `helds` the reads of the apps.
 */
async function sendPage(one: PageCase): Promise<Sent> {
    const base = contextFixture({ token: 'hook-token', engine: ENGINE });
    const read = vi.fn(() => ({
        ...SHIPPED,
        config: { ...SHIPPED.config, ...one.options },
        findings: one.findings ?? SHIPPED.findings
    }));
    const held = vi.fn(one.held ?? noApps);
    const context = {
        ...base,
        configCache: { ...base.configCache, read },
        apps: { ...base.apps, held }
    };
    const request = {} as OculusRequest;
    carryingHandler(() => undefined, context)(request, {});
    const url = new URL(one.path ?? '/', 'http://127.0.0.1:8791');
    const api = url.pathname.startsWith('/api/');
    const headers = { 'user-agent': one.agent ?? BROWSER };
    const event = {
        platform: { req: request },
        locals: {} as App.Locals,
        url,
        route: { id: one.route ?? url.pathname },
        request: new Request(url, { headers })
    } as unknown as Parameters<typeof handle>[0]['event'];
    const response = await handle({
        event,
        resolve: async (_event, options) =>
            api
                ? Response.json({ ok: true })
                : new Response(await options?.transformPageChunk?.({ html: TEMPLATE, done: true }))
    });
    base.close();
    return {
        html: await response.text(),
        reads: read.mock.calls.length,
        helds: held.mock.calls.length
    };
}

/** The body's class attribute as sent, the empty string for none. */
function bodyClass(html: string): string {
    const body = /<body\b([^>]*)>/.exec(html)?.[1] ?? '';
    return /\bclass="([^"]*)"/.exec(body)?.[1] ?? '';
}

/** The custom properties of the root element's style attribute as sent, by name. */
function rootTokens(html: string): Record<string, string> {
    const root = /<html\b([^>]*)>/.exec(html)?.[1] ?? '';
    const style = /\bstyle="([^"]*)"/.exec(root)?.[1] ?? '';
    const pairs = style.split('; ').filter((one) => one !== '');
    return Object.fromEntries(
        pairs.map((one) => [one.split(': ')[0], one.slice(one.indexOf(': ') + 2)])
    );
}

/**
 * The tokens the page's draw sets on the root element for the body class string `classes`, over
 * the theme sheets and, for an app's theme, the block its draw puts in the document.
 */
function pageTokens(classes: string, block: string): Record<string, string> {
    const set: Record<string, string> = {};
    const document = {
        body: { className: '' },
        documentElement: {
            style: {
                setProperty: (name: string, value: string) => {
                    set[name] = value;
                }
            }
        },
        getElementById: () => null
    };
    const looks = { crt: false, brackets: true, monospace: true };
    const themes = block === '' ? THEME_SHEETS : withThemeBlock(block);
    applyTheme(document, classes, looks, undefined, themes);
    return set;
}

/** The texts of the style elements whose id is `id`, in the order the page holds them. */
function stylesOf(html: string, id: string): string[] {
    const pattern = new RegExp(`<style id="${id}">([\\s\\S]*?)</style>`, 'g');
    return [...html.matchAll(pattern)].map((match) => match[1]);
}

/** The texts of the style elements whose id is the shared one. */
function themeStyles(html: string): string[] {
    return stylesOf(html, vscodeMap.APP_THEME_STYLE_ID);
}

/** The texts of the ground elements. */
function grounds(html: string): string[] {
    return stylesOf(html, GROUND_STYLE_ID);
}

/** The page's scrollbar sheet as the layout imports it, read from disk. */
const SCROLLBAR = readFileSync(
    new URL('../../../src/lib/ui/theme/scrollbar.css', import.meta.url),
    'utf8'
);

/**
 * The text of the ground element for the ground `colour`: the colour on the root element, then the
 * page's scrollbar sheet, drawn in the two tokens the root element carries.
 */
function ground(colour: string): string {
    return `html { background: ${colour} }\n${SCROLLBAR}`;
}

/** The ground of Ember: the `--bg` of its block, its side bar's background. */
const EMBER_GROUND = EMBER_FILE.colors['sideBar.background'];

/** The block the page's conversion makes of a theme file. */
function converted(file: { colors: Record<string, string>; tokenColors: unknown[] }): string {
    const sheet = (name: string) =>
        readFileSync(new URL(`../../../src/lib/themes/${name}`, import.meta.url), 'utf8');
    const tokens = sheet('tokens.css');
    const themes = sheet('themes.css');
    const theme = file as vscodeMap.ResolvedTheme;
    return vscodeMap.themeSheet(theme, 'vs-dark', { tokens, themes }, 'app-theme').css;
}

describe('a page sent with the theme it starts on', () => {
    let fixture: Fixture;
    let held: AppsHeld;
    let ember = '';
    let closing = '';

    beforeAll(() => {
        fixture = plantThemes();
        held = approvedHeld(fixture);
        const offers = themeOffers(held.apps.map((app) => app.row));
        ember = offers.find((one) => one.label === 'Ember')?.choice ?? '';
        closing = offers.find((one) => one.label === 'Closing')?.choice ?? '';
    });

    it('starts a browser on the first row and the desktop window on app_theme, by the mark (C1, C2)', async () => {
        const browser = await sendPage({});
        expect(bodyClass(browser.html)).toBe('');
        expect(themeStyles(browser.html)).toEqual([]);
        const desktop = await sendPage({ agent: MARKED });
        expect(bodyClass(desktop.html)).toBe('vscode-dark-modern');
        expect(themeStyles(desktop.html)).toEqual([]);
        const inWord = await sendPage({ agent: `${BROWSER} x${DESKTOP_MARK}y` });
        expect(bodyClass(inWord.html)).toBe('');
    });

    it(
        "sends an approved app's theme as its class and the block of its file in the shared style element (C4)",
        { tags: ['slow'] },
        async () => {
            const sent = await sendPage({ options: { theme: ember }, held: () => held });
            expect(bodyClass(sent.html)).toBe('app-theme');
            const styles = themeStyles(sent.html);
            expect(styles).toEqual([converted(EMBER_FILE)]);
            expect(styles[0]).toContain('--bg: #7a1020;');
            expect(sent.html.indexOf(`<style id="${vscodeMap.APP_THEME_STYLE_ID}">`)).toBeLessThan(
                sent.html.indexOf('</head>')
            );
        }
    );

    it.each([
        { row: 'a float window', path: '/?float=f1', route: '/', workbench: true },
        { row: 'the find page', path: '/find', route: '/find', workbench: false },
        {
            row: 'the audience page',
            path: '/present/show',
            route: '/present/show',
            workbench: false
        },
        { row: 'the print page', path: '/present/print', route: '/present/print', workbench: false }
    ])(
        'sends $row the start the workbench gets (C6)',
        { tags: ['slow'] },
        async ({ path, route, workbench }) => {
            const crt = { crt: { on: true } };
            const starts: [PageCase, string, string, boolean, string][] = [
                [{}, '', '', false, '#f1f5f9'],
                [{ agent: MARKED }, 'vscode-dark-modern', 'vscode-dark-modern', false, '#181818'],
                [{ options: { theme: 'dark' } }, 'dark', 'dark', false, '#0b1120'],
                [
                    { options: { theme: ember }, held: () => held },
                    'app-theme',
                    'app-theme',
                    true,
                    EMBER_GROUND
                ],
                [
                    { options: { theme: '', app_theme: ember }, held: () => held, agent: MARKED },
                    'app-theme',
                    'app-theme',
                    true,
                    EMBER_GROUND
                ],
                [{ options: { ...crt, theme: 'dark' } }, 'dark crt', 'dark', false, '#0b1120'],
                [
                    { options: { ...crt, theme: ember }, held: () => held },
                    'app-theme crt',
                    'app-theme',
                    true,
                    EMBER_GROUND
                ]
            ];
            for (const [one, atRoot, elsewhere, style, colour] of starts) {
                const root = await sendPage(one);
                const page = await sendPage({ ...one, path, route });
                expect(bodyClass(root.html)).toBe(atRoot);
                expect(bodyClass(page.html)).toBe(workbench ? atRoot : elsewhere);
                expect(themeStyles(page.html)).toHaveLength(style ? 1 : 0);
                expect(themeStyles(page.html)).toEqual(themeStyles(root.html));
                expect(grounds(page.html)).toEqual([ground(colour)]);
                expect(grounds(page.html)).toEqual(grounds(root.html));
            }
        }
    );

    it('sends on the root element the tokens the page derives for the start theme', async () => {
        const starts: [PageCase, string, string][] = [
            [{}, '', ''],
            [{ agent: MARKED }, 'vscode-dark-modern', ''],
            [{ options: { theme: 'dark' } }, 'dark', ''],
            [{ options: { theme: ember }, held: () => held }, 'app-theme', converted(EMBER_FILE)]
        ];
        const tracks: string[] = [];
        for (const [one, classes, block] of starts) {
            const sent = await sendPage(one);
            expect(bodyClass(sent.html)).toBe(classes);
            const tokens = rootTokens(sent.html);
            expect(tokens).toEqual(pageTokens(classes, block));
            tracks.push(tokens['--scroll-track']);
        }
        expect(new Set(tracks).size).toBe(starts.length);
    });

    it.each([
        { row: 'theme dark (C1)', options: { theme: 'dark' }, classes: 'dark', colour: '#0b1120' },
        { row: 'the first row in a browser (C3)', classes: '', colour: '#f1f5f9' },
        {
            row: 'the shipped config in the desktop window (C3b)',
            marked: true,
            classes: 'vscode-dark-modern',
            colour: '#181818'
        },
        {
            row: 'theme kanagawalotus (C3b)',
            options: { theme: 'kanagawalotus' },
            classes: 'rice kanagawalotus',
            colour: '#e5ddb0'
        },
        {
            row: "an approved app's theme (C2)",
            options: { theme: 'ember' },
            approved: true,
            classes: 'app-theme',
            colour: EMBER_GROUND
        },
        {
            row: "an app's theme whose app is not approved, in a browser (C6b)",
            options: { theme: 'ember' },
            classes: '',
            colour: '#f1f5f9'
        },
        {
            row: "an app's theme whose app is not approved, in the desktop window (C6b)",
            options: { theme: 'ember' },
            marked: true,
            classes: 'vscode-dark-modern',
            colour: '#181818'
        }
    ] as {
        row: string;
        options?: Record<string, string>;
        marked?: boolean;
        approved?: boolean;
        classes: string;
        colour: string;
    }[])(
        'sends the ground of $row in a style element of its own ahead of the head Kit fills',
        async ({ options = {}, marked, approved, classes, colour }) => {
            const named = Object.fromEntries(
                Object.entries(options).map(([key, value]) => [
                    key,
                    value === 'ember' ? ember : value
                ])
            );
            const sent = await sendPage({
                options: named,
                agent: marked === true ? MARKED : BROWSER,
                held: approved === true ? () => held : noApps
            });
            expect(bodyClass(sent.html)).toBe(classes);
            expect(grounds(sent.html)).toEqual([ground(colour)]);
            expect(sent.html.indexOf(`<style id="${GROUND_STYLE_ID}">`)).toBeLessThan(
                sent.html.indexOf('%sveltekit.head%')
            );
        }
    );

    it.each([
        {
            row: "whose block's --bg is no hex colour, the block sent (C6)",
            edit: (css: string) => css.replace(`--bg: ${EMBER_GROUND};`, '--bg: var(--panel);'),
            blocks: ['--bg: var(--panel);']
        },
        {
            row: 'whose block holds a closing tag, the block withheld (C6)',
            edit: (css: string) => `${css}\n/* </style> */`,
            blocks: []
        }
    ])("sends no ground for an app's theme $row", async ({ edit, blocks }) => {
        const convert = vscodeMap.themeSheet;
        vi.spyOn(vscodeMap, 'themeSheet').mockImplementation((...args) => {
            const sheet = convert(...args);
            return { ...sheet, css: edit(sheet.css) };
        });
        const sent = await sendPage({ options: { theme: ember }, held: () => held });
        expect(bodyClass(sent.html)).toBe('app-theme');
        const styles = themeStyles(sent.html);
        expect(styles).toHaveLength(blocks.length);
        blocks.forEach((text, at) => expect(styles[at]).toContain(text));
        expect(grounds(sent.html)).toEqual([]);
    });

    it('sends the start theme and the title for a theme option naming nothing, in a config the read answers with a finding (C10)', async () => {
        const findings = [
            { file: '/hub/.oculus/workspaces/main.yml', key: 'text_size', message: 'm' }
        ];
        const options = { theme: 'gone' };
        const browser = await sendPage({ options, findings });
        const desktop = await sendPage({ options, findings, agent: MARKED });
        expect([browser.reads, desktop.reads]).toEqual([1, 1]);
        expect(bodyClass(browser.html)).toBe('');
        expect(bodyClass(desktop.html)).toBe('vscode-dark-modern');
        expect(browser.html).toMatch(/<title>[^%<]+<\/title>/);
        expect(desktop.html).toMatch(/<title>[^%<]+<\/title>/);
    });

    it('sends the HTML with no theme and the title when the theme cannot be computed', async () => {
        const sent = await sendPage({
            options: { theme: 'dark' },
            held: () => {
                throw new Error('the apps cannot be read');
            }
        });
        expect(sent.html).toMatch(/<title>[^%<]+<\/title>/);
        expect(bodyClass(sent.html)).toBe('');
        expect(rootTokens(sent.html)).toEqual({});
        expect(themeStyles(sent.html)).toEqual([]);
        expect(grounds(sent.html)).toEqual([]);
        expect(sent.html).not.toContain('%oculus.');
    });

    it('sends the find page in a browser the browser start (C13)', async () => {
        const sent = await sendPage({ path: '/find', route: '/find' });
        expect(bodyClass(sent.html)).toBe('');
        expect(themeStyles(sent.html)).toEqual([]);
    });

    it('writes a class holding a quote, a bracket, an ampersand and a replacement pattern escaped and literal (C14)', async () => {
        const themes = [
            { name: 'plain', class: 'plain', glyph: 'theme_base' },
            { name: 'odd', class: 'a"b<c&d$&e', glyph: 'theme_base' }
        ];
        const odd = await sendPage({ options: { themes, theme: 'odd' } });
        expect(bodyClass(odd.html)).toBe('a&quot;b&lt;c&amp;d$&amp;e');
        const plain = await sendPage({ options: { themes, theme: 'plain' } });
        expect(bodyClass(plain.html)).toBe('plain');
        const without = (html: string) => html.replace(/\sclass="[^"]*"/, '');
        expect(without(odd.html)).toBe(without(plain.html));
    });

    it('sends a theme whose file holds a closing tag in a colour with its block, the colour falling back (C15)', async () => {
        const sent = await sendPage({ options: { theme: closing }, held: () => held });
        expect(bodyClass(sent.html)).toBe('app-theme');
        const fallback = {
            colors: { foreground: CLOSING_FILE.colors.foreground },
            tokenColors: []
        };
        expect(themeStyles(sent.html)).toEqual([converted(fallback)]);
        expect(themeStyles(sent.html)[0]).not.toContain('<');
        expect(sent.html).not.toContain('<script>');
    });

    it('reads no config and no apps for a request to an API route (C16)', async () => {
        const sent = await sendPage({ path: '/api/health', options: { theme: 'dark' } });
        expect(JSON.parse(sent.html)).toEqual({ ok: true });
        expect(sent.reads).toBe(0);
        expect(sent.helds).toBe(0);
    });
});
