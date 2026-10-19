// Layer 3, primitive. An app's colour theme on the page. The app declares a VS Code theme file; the
// server resolves its `include` chain inside the app and serves the result (GET /api/app-theme),
// and this converts it with the mapping the shipped VS Code themes are made with
// (themes/vscode-map.ts, over the same tokens.css and themes.css the page is styled with). The
// block it makes is `body.app-theme`, put in a style element of the document, and the editor's
// rules for the theme are held for the editor to read (app-rules.ts).
//
// A theme is loaded by the name the page saves it under (data/helpers/files/apps/choices.ts), so a
// page that holds only that name, the find page and the presenter's pages, loads it the same way
// the workbench does.

import { NO_OFFERS } from '$lib/data/helpers/files/apps/choices';
import { APP_THEME_CLASS, appThemeState, themeClass } from '$lib/state/shared/words/appearance';
import {
    GIT_DEFAULTS,
    basesOf,
    mapTheme,
    type OutRule,
    type ResolvedTheme,
    type UiTheme
} from '$lib/themes/vscode-map';
import themesCss from '$lib/themes/themes.css?raw';
import tokensCss from '$lib/themes/tokens.css?raw';
import { setAppRules } from './app-rules';
import { THEME_SHEETS, applyTheme, type BodyLooks, type Themeable } from './theme';

/** The id of the style element that holds the app theme's block. */
const STYLE_ID = 'oculus-app-theme';

/** An app theme converted: its block, the editor's rules and whether it is dark. */
type AppThemeSheet = { css: string; rules: OutRule[]; dark: boolean };

/** A theme the server resolved, with its converted sheet and the words that name it. */
type AppThemeLoad = { sheet: AppThemeSheet; label: string; app: string };

/** What the style element needs of the document. */
export type AppThemeDocument = {
    head: { append: (node: HTMLStyleElement) => void };
    getElementById: (id: string) => { textContent: string | null; remove: () => void } | null;
    createElement: (tag: 'style') => HTMLStyleElement;
};

/** Convert a resolved VS Code theme file into the `body.app-theme` block and the editor's rules. */
function convertAppTheme(theme: ResolvedTheme, ui: UiTheme): AppThemeSheet {
    const mapped = mapTheme(theme, ui, {
        git: GIT_DEFAULTS,
        bases: basesOf(tokensCss, themesCss)
    });
    const body = mapped.entries.map(([name, value]) => `    ${name}: ${value};`).join('\n');
    return { css: `body.${APP_THEME_CLASS} {\n${body}\n}`, rules: mapped.rules, dark: mapped.dark };
}

/** The shape of the server's answer. */
type Answer = {
    ok?: unknown;
    theme?: { colors?: Record<string, string>; tokenColors?: unknown[] };
    uiTheme?: UiTheme;
    label?: unknown;
    app?: unknown;
};

/** Load the theme saved under `choice`, converted, or null when the server does not serve it. */
async function loadAppTheme(
    choice: string,
    get: typeof fetch = (...args) => fetch(...args)
): Promise<AppThemeLoad | null> {
    try {
        const response = await get(`/api/app-theme?choice=${encodeURIComponent(choice)}`);
        const body = (await response.json()) as Answer;
        if (body.ok !== true || body.theme === undefined || body.uiTheme === undefined) {
            return null;
        }
        const theme = {
            colors: body.theme.colors ?? {},
            tokenColors: body.theme.tokenColors ?? []
        } as ResolvedTheme;
        return {
            sheet: convertAppTheme(theme, body.uiTheme),
            label: typeof body.label === 'string' ? body.label : choice,
            app: typeof body.app === 'string' ? body.app : ''
        };
    } catch {
        return null;
    }
}

/**
 * Put an app theme's block in the document and hold its rules, or take both away with null. The
 * block's text is answered, for the derivation of the tokens that follows (`applyTheme`).
 */
function paintAppTheme(document: AppThemeDocument, sheet: AppThemeSheet | null): string {
    const present = document.getElementById(STYLE_ID);
    setAppRules(sheet === null ? null : sheet.rules);
    if (sheet === null) {
        present?.remove();
        return '';
    }
    if (present !== null) {
        present.textContent = sheet.css;
        return sheet.css;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = sheet.css;
    document.head.append(style);
    return sheet.css;
}

/**
 * What a page draws its theme from: the theme, and the per-browser looks beside it (the CRT
 * overlay, and whether a rice theme draws brackets and the monospace font).
 */
export type ThemeDraw = BodyLooks & {
    /** The saved name of the theme. */
    choice: string;
    /** Whether the name is an app's theme, which the page loads. */
    app: boolean;
    /**
     * The body classes the page draws when the theme is not an app's, or when it cannot be loaded.
     */
    classes: string;
    /** Classes put beside an app theme's own, such as the wallpaper's. */
    extra?: string;
};

/**
 * Put a theme on the document. A theme of the configuration is its classes; an app's is loaded,
 * its block put in the document and its tokens derived from it. Answers false when an app's theme
 * could not be loaded and the page drew `classes` instead, which is the default theme's.
 * `current` says whether the draw is still wanted once the load has returned.
 */
export async function drawTheme(
    document: Themeable & AppThemeDocument,
    draw: ThemeDraw,
    current: () => boolean = () => true
): Promise<boolean> {
    if (!draw.app) {
        paintAppTheme(document, null);
        applyTheme(document, draw.classes, draw);
        return true;
    }
    const load = await loadAppTheme(draw.choice);
    if (!current()) return load !== null;
    if (load === null) {
        paintAppTheme(document, null);
        applyTheme(document, draw.classes, draw);
        return false;
    }
    const css = paintAppTheme(document, load.sheet);
    const classes = [APP_THEME_CLASS, draw.extra ?? ''].join(' ');
    applyTheme(document, classes, draw, undefined, `${THEME_SHEETS}\n${css}`);
    return true;
}

/**
 * Draw the theme a saved record names on a page that holds no `apps` channel (the find page and
 * the presenter's pages): an app's theme is loaded from the server, which answers for the saved
 * name alone. Such a page holds no per-browser values, so it draws no overlay and a rice theme
 * whole, brackets and monospace font included.
 */
export function drawSavedTheme(
    document: Themeable & AppThemeDocument,
    choice: string
): Promise<boolean> {
    return drawTheme(document, {
        choice,
        app: appThemeState(choice, NO_OFFERS) !== 'none',
        classes: themeClass(choice, NO_OFFERS),
        crt: false,
        brackets: true,
        monospace: true
    });
}
