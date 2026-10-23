// Layer 4, server test. An app's colour theme the `theme` or the `app_theme` option names is drawn
// from a window's first paint: the page's first load carries the theme's file, read as GET
// /api/app-theme reads it and only for an approved, enabled app (`firstAppThemes`), the page draws
// it from that file before it asks the server for anything (`drawConfiguredTheme`, and in the
// workbench the first draw, which `firstDrawFile` hands the file to while a later draw loads it),
// and the desktop host fills a new window with the background and the symbol colour of the block
// the page's mapping makes of it (`startColours`). An app that is not approved, an app that is
// disabled and a theme file that does not resolve give the start of the rows; for the first two
// the lookup of the saved name answers `closed`, on which `appThemeOf` returns before it opens a
// file of the app. The page's first `applyTheme` takes away the ground element of its first HTML.
//
// Vitest empties a stylesheet a module reads as text, so the two sheets the page converts an app's
// theme over are handed the text the browser reads. The modules under test are loaded after the
// module registry is reset, so a run whose test files share their modules loads them over these
// sheets too.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, vi } from 'vitest';
import { NO_OFFERS, type AppThemeFiles } from '../../../src/lib/data/helpers/files/apps/choices.ts';
import { vscodeRuleIds } from '../../../src/lib/data/places/code-rules.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { AppsHeld } from '../../../src/lib/server/machine/apps/read/held.ts';
import { plantSaved } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    approvedHeld,
    MANIFEST,
    PAGE,
    plant,
    type Fixture
} from '../../routes/apps/apps-fixture.ts';

vi.mock('$lib/themes/tokens.css?raw', () => ({ default: sheet('tokens.css') }));
vi.mock('$lib/themes/themes.css?raw', () => ({ default: sheet('themes.css') }));

/** The text of one sheet of src/lib/themes/. */
function sheet(name: string): string {
    return readFileSync(join(engineDir(), 'src', 'lib', 'themes', name), 'utf8');
}

/** The modules under test, loaded once the module registry was reset. */
type Modules = {
    startColours: typeof import('../../../src/desktop/windows/start-colours.ts').startColours;
    themeOffers: typeof import('../../../src/lib/data/helpers/files/apps/choices.ts').themeOffers;
    firstAppThemes: typeof import('../../../src/lib/server/machine/apps/routes/theme.ts').firstAppThemes;
    requestStart: typeof import('../../../src/lib/server/machine/apps/routes/theme.ts').requestStart;
    heldChoice: typeof import('../../../src/lib/server/machine/apps/routes/choice.ts').heldChoice;
    words: typeof import('../../../src/lib/state/shared/words/appearance.ts');
    drawConfiguredTheme: typeof import('../../../src/lib/ui/theme/app-theme.ts').drawConfiguredTheme;
    drawTheme: typeof import('../../../src/lib/ui/theme/app-theme.ts').drawTheme;
    firstDrawFile: typeof import('../../../src/lib/ui/theme/app-theme.ts').firstDrawFile;
    applyTheme: typeof import('../../../src/lib/ui/theme/theme.ts').applyTheme;
    groundId: typeof import('../../../src/lib/ui/theme/theme.ts').GROUND_STYLE_ID;
};

let loaded: Modules;

beforeAll(async () => {
    vi.resetModules();
    const [colours, choices, theme, choice, words, page, drawn] = await Promise.all([
        import('../../../src/desktop/windows/start-colours.ts'),
        import('../../../src/lib/data/helpers/files/apps/choices.ts'),
        import('../../../src/lib/server/machine/apps/routes/theme.ts'),
        import('../../../src/lib/server/machine/apps/routes/choice.ts'),
        import('../../../src/lib/state/shared/words/appearance.ts'),
        import('../../../src/lib/ui/theme/app-theme.ts'),
        import('../../../src/lib/ui/theme/theme.ts')
    ]);
    loaded = {
        startColours: colours.startColours,
        themeOffers: choices.themeOffers,
        firstAppThemes: theme.firstAppThemes,
        requestStart: theme.requestStart,
        heldChoice: choice.heldChoice,
        words,
        drawConfiguredTheme: page.drawConfiguredTheme,
        drawTheme: page.drawTheme,
        firstDrawFile: page.firstDrawFile,
        applyTheme: drawn.applyTheme,
        groundId: drawn.GROUND_STYLE_ID
    };
});

const engine = engineDir();
const shipped = loadConfig(engine).config;
const CLASSES = vscodeRuleIds(engine);

/** The colours of the theme file below: its side bar's background and its title bar's words. */
const DUSK = { background: '#102030', symbol: '#e0e8f0' };
const DARK_MODERN = { background: '#181818', symbol: '#cccccc' };
const LIGHT = { background: '#f1f5f9', symbol: '#0f172a' };

const THEME_FILE = JSON.stringify({
    colors: {
        'sideBar.background': '#102030',
        'editor.background': '#0a1520',
        foreground: '#d0d8e0',
        'titleBar.activeBackground': '#102030',
        'titleBar.activeForeground': '#e0e8f0'
    },
    tokenColors: []
});

/** An app `notes` that offers the colour theme Dusk from `dusk.json`. */
function plantDusk(): Fixture {
    const manifest = `${MANIFEST}contributes:\n  themes:\n    - { label: Dusk, uiTheme: vs-dark, path: dusk.json }\n`;
    return plant({
        machine: {
            'notes/app.yml': manifest,
            'notes/index.html': PAGE,
            'notes/dusk.json': THEME_FILE
        }
    });
}

/** The saved name of Dusk, as the theme list offers it once the app is approved. */
function duskChoice(fixture: Fixture): string {
    const [offer] = loaded.themeOffers(approvedHeld(fixture).apps.map((app) => app.row));
    return offer.choice;
}

/** The held apps of a fixture with the app approved and disabled machine-wide. */
function disabledHeld(fixture: Fixture, view: string): AppsHeld {
    const hashes = fixture.scan(new Set()).apps.map((one) => one.row.hash);
    writeFileSync(
        join(fixture.base, 'apps.json'),
        JSON.stringify({ version: 1, disabled: [view], workspaces: {} })
    );
    return fixture.scan(new Set(hashes));
}

/** A document as the page's theme draw touches it, with what it was given. */
function pageDocument() {
    const styles: { id: string; textContent: string | null; remove: () => void }[] = [];
    const document = {
        body: { className: '' },
        documentElement: { style: { setProperty: () => undefined } },
        head: { append: (node: HTMLStyleElement) => void styles.push(node) },
        getElementById: (id: string) => styles.find((one) => one.id === id) ?? null,
        createElement: () =>
            ({
                id: '',
                textContent: '',
                remove: () => undefined
            }) as unknown as HTMLStyleElement
    };
    return { document, sheet: () => styles.map((one) => one.textContent).join('\n') };
}

/**
 * What a window of the desktop app starts on for a config whose options are `options`, over the
 * held apps: the files the first load carries, the page's draw of them before any request, and the
 * host's start colours for a saved workspace that sets the same options.
 */
function startOn(held: AppsHeld, options: Record<string, string>) {
    const config = { ...shipped, ...options };
    const files: AppThemeFiles = loaded.firstAppThemes(held, config);
    loaded.words.setAppearance(config, CLASSES);
    const page = pageDocument();
    const drawn = loaded.drawConfiguredTheme(page.document, true, files);
    const settings = Object.entries(options)
        .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}\n`)
        .join('');
    const state = plantSaved(scratchDir('oculus-app-theme-hub-'), `settings:\n${settings}`).state;
    return {
        files,
        classes: page.document.body.className,
        sheet: page.sheet(),
        drawn,
        colours: loaded.startColours(engine, engine, files, state)
    };
}

describe("an app's colour theme from a window's first paint", () => {
    const fetched = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', fetched);
        fetched.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        loaded.words.setAppearance(shipped, CLASSES);
    });

    it.each([
        { row: 'theme names it', option: 'theme' },
        { row: 'app_theme names it and theme is empty', option: 'app_theme' }
    ])(
        "carries an approved app's theme file, draws it at once and fills a window with it when $row",
        { tags: ['slow'] },
        async ({ option }) => {
            const fixture = plantDusk();
            const choice = duskChoice(fixture);
            const start = startOn(approvedHeld(fixture), { theme: '', [option]: choice });
            expect(Object.keys(start.files)).toEqual([choice]);
            expect(start.files[choice]?.theme.colors['sideBar.background']).toBe('#102030');
            expect(start.classes.split(' ')).toContain('app-theme');
            expect(start.sheet).toContain('--bg: #102030;');
            expect(start.colours).toEqual(DUSK);
            expect(await start.drawn).toBe(true);
            expect(fetched).not.toHaveBeenCalled();
        }
    );

    it("draws the workbench's first draw of an app's theme from the carried file, and loads a later one", async () => {
        const fixture = plantDusk();
        const choice = duskChoice(fixture);
        const files = loaded.firstAppThemes(approvedHeld(fixture), { ...shipped, theme: choice });
        loaded.words.setAppearance({ ...shipped, theme: choice }, CLASSES);
        const firstFile = loaded.firstDrawFile(() => files);
        const draw = (file: ReturnType<typeof firstFile>) => {
            const page = pageDocument();
            const drawn = loaded.drawTheme(page.document, {
                choice,
                app: true,
                classes: 'vscode-dark-modern',
                crt: false,
                brackets: true,
                monospace: true,
                file
            });
            return { page, drawn };
        };
        const first = draw(firstFile(choice));
        expect(first.page.sheet()).toContain('--bg: #102030;');
        expect(await first.drawn).toBe(true);
        expect(fetched).not.toHaveBeenCalled();
        expect(firstFile(choice)).toBeUndefined();
        expect(firstFile('app:other/none')).toBeUndefined();
        fetched.mockResolvedValue({ json: () => Promise.resolve({ ok: false, word: 'missing' }) });
        const later = draw(firstFile(choice));
        expect(await later.drawn).toBe(false);
        expect(fetched).toHaveBeenCalledTimes(1);
    });

    it.each([
        {
            row: 'an app that is not approved, whose files the lookup leaves closed',
            held: (f: Fixture) => f.scan(new Set()),
            closed: true
        },
        {
            row: 'an app that is disabled, whose files the lookup leaves closed',
            held: (f: Fixture) => disabledHeld(f, duskChoice(f).split('/')[0]),
            closed: true
        },
        {
            row: 'a theme file that no longer resolves once the apps were read',
            held: (f: Fixture) => {
                const apps = approvedHeld(f);
                writeFileSync(
                    join(f.machine, 'notes', 'dusk.json'),
                    JSON.stringify({ include: './gone.json', colors: {} })
                );
                return apps;
            },
            closed: false
        }
    ])('gives the start of the rows for $row', { tags: ['slow'] }, ({ held, closed }) => {
        const fixture = plantDusk();
        const choice = duskChoice(fixture);
        const apps = held(fixture);
        expect(loaded.heldChoice(apps, choice) === 'closed').toBe(closed);
        const named = startOn(apps, { theme: choice });
        expect(named.files).toEqual({ [choice]: null });
        expect(named.classes.split(' ')).toContain('vscode-dark-modern');
        expect(named.sheet).toBe('');
        expect(named.colours).toEqual(DARK_MODERN);
        const started = startOn(apps, { theme: '', app_theme: choice });
        expect(started.files).toEqual({ [choice]: null });
        expect(started.classes.split(' ')).not.toContain('app-theme');
        expect(started.colours).toEqual(LIGHT);
        expect(fetched).not.toHaveBeenCalled();
    });
});

/** The held apps a start is read over: Dusk approved, not approved, or its file gone. */
type HeldAs = 'approved' | 'unapproved' | 'unresolved';

// The start a page is sent with (`requestStart`), by the rule its first draw starts on: the theme
// `theme` names, else in the desktop app's window the one `app_theme` names, else the first row,
// an app's theme counting only when its app is approved and enabled and its file resolves, and the
// class string joined with the rice looks and, on a page that draws the CRT overlay, the overlay's,
// as the page's first `applyTheme` joins them.
describe('the theme a page is sent with', () => {
    let held: Record<HeldAs, AppsHeld>;
    let dusk = '';

    beforeAll(() => {
        const fixture = plantDusk();
        dusk = duskChoice(fixture);
        const gone = plantDusk();
        const resolvable = approvedHeld(gone);
        writeFileSync(
            join(gone.machine, 'notes', 'dusk.json'),
            JSON.stringify({ include: './gone.json', colors: {} })
        );
        held = {
            approved: approvedHeld(fixture),
            unapproved: fixture.scan(new Set()),
            unresolved: resolvable
        };
    });

    /**
     * The body class the page sets for `config`, read through the page's own reader: the workbench's
     * draw as shell/window/appearance.svelte.ts makes it, with the CRT overlay the config sets, and
     * the draw of a page with no `apps` channel, which draws no overlay.
     */
    async function pageClass(
        config: Record<string, unknown>,
        inApp: boolean,
        drawnBy: 'workbench' | 'find'
    ): Promise<string> {
        loaded.words.setAppearance(config, CLASSES);
        const page = pageDocument();
        if (drawnBy === 'find') {
            await loaded.drawConfiguredTheme(page.document, inApp, {});
            return page.document.body.className;
        }
        const look = loaded.words.configuredLook();
        await loaded.drawTheme(page.document, {
            choice: look.theme,
            app: false,
            classes: loaded.words.themeClass(look.theme, NO_OFFERS, inApp),
            crt: look.crt,
            brackets: look.brackets,
            monospace: look.monospace
        });
        return page.document.body.className;
    }

    it.each([
        { row: 'the shipped config in a browser (C1)', options: {}, marked: false, classes: '' },
        {
            row: 'the shipped config in the desktop window (C2)',
            options: {},
            marked: true,
            classes: 'vscode-dark-modern'
        },
        {
            row: 'theme dark in a browser (C3)',
            options: { theme: 'dark' },
            marked: false,
            classes: 'dark'
        },
        {
            row: 'theme dark in the desktop window (C3)',
            options: { theme: 'dark' },
            marked: true,
            classes: 'dark'
        },
        {
            row: "theme naming an approved app's theme (C4)",
            options: { theme: 'dusk' },
            marked: false,
            classes: 'app-theme',
            file: true
        },
        {
            row: 'theme naming the theme of an app that is not approved, in a browser (C5)',
            options: { theme: 'dusk' },
            held: 'unapproved',
            marked: false,
            classes: ''
        },
        {
            row: 'theme naming the theme of an app that is not approved, in the desktop window (C5)',
            options: { theme: 'dusk' },
            held: 'unapproved',
            marked: true,
            classes: 'vscode-dark-modern'
        },
        {
            row: 'theme naming an app theme whose file does not resolve, in a browser (C5)',
            options: { theme: 'dusk' },
            held: 'unresolved',
            marked: false,
            classes: ''
        },
        {
            row: 'theme naming an app theme whose file does not resolve, in the desktop window (C5)',
            options: { theme: 'dusk' },
            held: 'unresolved',
            marked: true,
            classes: 'vscode-dark-modern'
        },
        {
            row: 'the CRT overlay on and the rice toggles off over a rice theme (C11)',
            options: {
                theme: 'kanagawalotus',
                crt: { on: true },
                rice: { brackets: false, monospace: false }
            },
            marked: false,
            classes: 'rice kanagawalotus crt rice-plain rice-sans',
            drawnBy: 'workbench'
        },
        {
            row: 'the same looks on a page that draws no CRT overlay (C11)',
            options: {
                theme: 'kanagawalotus',
                crt: { on: true },
                rice: { brackets: false, monospace: false }
            },
            marked: false,
            crt: false,
            classes: 'rice kanagawalotus rice-plain rice-sans',
            drawnBy: 'find'
        },
        {
            row: 'rice.monospace written as a word, which reads as its default (C11)',
            options: {
                theme: 'kanagawalotus',
                crt: { on: true },
                rice: { brackets: false, monospace: 'x' }
            },
            marked: false,
            classes: 'rice kanagawalotus crt rice-plain',
            drawnBy: 'workbench'
        },
        {
            row: "app_theme naming an approved app's theme and theme empty, in the desktop window (C12)",
            options: { theme: '', app_theme: 'dusk' },
            marked: true,
            classes: 'app-theme',
            file: true
        },
        {
            row: "app_theme naming an approved app's theme and theme empty, in a browser (C12)",
            options: { theme: '', app_theme: 'dusk' },
            marked: false,
            classes: ''
        }
    ] as {
        row: string;
        options: Record<string, unknown>;
        held?: HeldAs;
        marked: boolean;
        crt?: boolean;
        classes: string;
        file?: boolean;
        drawnBy?: 'workbench' | 'find';
    }[])('starts on $row', async ({ options, held: as, marked, crt, classes, file, drawnBy }) => {
        const named = Object.fromEntries(
            Object.entries(options).map(([key, value]) => [key, value === 'dusk' ? dusk : value])
        );
        const config = { ...shipped, ...named };
        const start = loaded.requestStart(held[as ?? 'approved'], config, marked, crt ?? true);
        expect(start.classes).toBe(classes);
        if (file === true) {
            expect(start.file?.theme.colors['sideBar.background']).toBe('#102030');
        } else {
            expect(start.file).toBeNull();
        }
        if (drawnBy !== undefined) {
            expect(start.classes).toBe(await pageClass(config, marked, drawnBy));
        }
    });
});

// The page's first HTML carries the start theme's ground in a style element of its own
// (hooks.server.ts), and the page's first draw takes it away, so the ground from then on is the
// layout's rule over the loaded sheets and a later theme paints the whole window.
describe('the ground a page is sent with', () => {
    it("is taken away by the page's first draw, and a later draw finds none and takes nothing", () => {
        const head = [loaded.groundId, 'another-style'];
        const asked: string[] = [];
        const document = {
            body: { className: '' },
            documentElement: { style: { setProperty: () => undefined } },
            getElementById: (id: string) => {
                asked.push(id);
                return head.includes(id)
                    ? { remove: () => void head.splice(head.indexOf(id), 1) }
                    : null;
            }
        };
        const looks = { crt: false, brackets: true, monospace: true };
        loaded.applyTheme(document, 'dark', looks);
        expect(head).toEqual(['another-style']);
        loaded.applyTheme(document, 'dark', looks);
        expect(head).toEqual(['another-style']);
        expect(asked).toEqual([loaded.groundId, loaded.groundId]);
        expect(document.body.className).toBe('dark');
    });
});
