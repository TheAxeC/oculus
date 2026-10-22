// Layer 3, primitive. An app's colour theme on the page. The app declares a VS Code theme file; the
// server resolves its `include` chain inside the app and serves the result (GET /api/app-theme),
// and this converts it with the conversion the shipped VS Code themes are mapped with (`themeSheet`
// of themes/vscode-map.ts, over the same tokens.css and themes.css the page is styled with). The
// block it makes is `body.app-theme`, put in the style element whose id is `APP_THEME_STYLE_ID`,
// and the editor's rules for the theme are held for the editor to read (app-rules.ts).
//
// A theme is loaded by the name the `theme` option holds it under (data/helpers/files/apps/
// choices.ts), so a page that holds only that name, the find page and the presenter's pages, loads
// it the same way the workbench does. The theme a page starts on is in the page's first HTML
// already: the server writes its body class, the tokens derived for it on the root element and,
// for an app's theme, the block of its file in that style element (hooks.server.ts), so the first
// paint is the theme's. The page's first load carries the same file, which the page hands its
// first draw (`ThemeDraw.file`); the draw converts it here and replaces the text of the element the
// server sent, in the browser and in the desktop app's window alike. The route serves every theme
// chosen after it.

import {
    APP_THEME_CLASS,
    fileOffers,
    themeAnswer,
    type AppThemeFile,
    type AppThemeFiles
} from '$lib/data/helpers/files/apps/choices';
import {
    appThemeState,
    configuredLook,
    configuredTheme,
    startClass,
    themeClass
} from '$lib/state/shared/words/appearance';
import type { BodyLooks } from '$lib/data/helpers/editor/start-theme';
import {
    APP_THEME_STYLE_ID,
    themeSheet,
    type ResolvedTheme,
    type ThemeSheet
} from '$lib/themes/vscode-map';
import themesCss from '$lib/themes/themes.css?raw';
import tokensCss from '$lib/themes/tokens.css?raw';
import { setAppRules } from './app-rules';
import { applyTheme, withThemeBlock, type Themeable } from './theme';

/** A theme the server resolved, with its converted sheet and the words that name it. */
type AppThemeLoad = { sheet: ThemeSheet; label: string; app: string };

/** What the style element needs of the document. */
export type AppThemeDocument = {
    head: { append: (node: HTMLStyleElement) => void };
    getElementById: (id: string) => { textContent: string | null; remove: () => void } | null;
    createElement: (tag: 'style') => HTMLStyleElement;
};

/** A theme file the server read, converted, with the words that name it. */
function loadOf(file: AppThemeFile): AppThemeLoad {
    const theme = {
        colors: file.theme.colors,
        tokenColors: file.theme.tokenColors
    } as ResolvedTheme;
    const sheet = themeSheet(
        theme,
        file.uiTheme,
        { tokens: tokensCss, themes: themesCss },
        APP_THEME_CLASS
    );
    return { sheet, label: file.label, app: file.app };
}

/** Load the theme saved under `choice`, converted, or null when the server does not serve it. */
async function loadAppTheme(
    choice: string,
    get: typeof fetch = (...args) => fetch(...args)
): Promise<AppThemeLoad | null> {
    try {
        const response = await get(`/api/app-theme?choice=${encodeURIComponent(choice)}`);
        const file = themeAnswer(await response.json(), choice);
        return file === null ? null : loadOf(file);
    } catch {
        return null;
    }
}

/**
 * Put an app theme's block in the document and hold its rules, or take both away with null. The
 * element the page was sent with, or one an earlier draw made, has its text replaced, so the
 * document holds one. The block's text is answered, for the derivation of the tokens that follows
 * (`applyTheme`).
 */
function paintAppTheme(document: AppThemeDocument, sheet: ThemeSheet | null): string {
    const present = document.getElementById(APP_THEME_STYLE_ID);
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
    style.id = APP_THEME_STYLE_ID;
    style.textContent = sheet.css;
    document.head.append(style);
    return sheet.css;
}

/**
 * What a page draws its theme from: the theme, and the looks the options set beside it (the CRT
 * overlay, `crt.on`, and whether a rice theme draws brackets and the monospace font,
 * `rice.brackets` and `rice.monospace`).
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
    /** The file of the app's theme the page's first load carries, drawn without a load. */
    file?: AppThemeFile;
};

/** The files of the app themes the `theme` and `app_theme` options name, by saved name. */
export type FirstThemeFiles = AppThemeFiles;

/**
 * The file of an app's theme a page's first load carries, for the first draw of the theme that
 * asks for it, over the files `files` answers; undefined for a later draw of the same theme, which
 * loads its file from the server, so a theme whose file changed after the first load is drawn as
 * it is now, and for a theme the first load carries no file of.
 */
export function firstDrawFile(
    files: () => FirstThemeFiles
): (choice: string) => AppThemeFile | undefined {
    const drawn = new Set<string>();
    return (choice) => {
        const held = files();
        const file = Object.hasOwn(held, choice) ? held[choice] : null;
        if (file === null || drawn.has(choice)) return undefined;
        drawn.add(choice);
        return file;
    };
}

/** Put a converted app theme on the document: its block, and the tokens derived from it. */
function paintLoad(
    document: Themeable & AppThemeDocument,
    draw: ThemeDraw,
    load: AppThemeLoad
): void {
    const css = paintAppTheme(document, load.sheet);
    const classes = [APP_THEME_CLASS, draw.extra ?? ''].join(' ');
    applyTheme(document, classes, draw, undefined, withThemeBlock(css));
}

/**
 * Put a theme on the document. A theme of the configuration is its classes; an app's is converted,
 * its block put in the document and its tokens derived from it. The page's first paint comes from
 * the HTML the server sent, which holds the start theme's class, its derived tokens and, for an
 * app's theme, its block; an app's theme the draw hands the file of (`file`, which the page's first
 * load carries) is drawn from that file at once, the draw replacing the text of the style element
 * the server sent, and any other draw of an app's theme loads its file from the server. Answers
 * false when an app's theme could not be loaded and the page drew `classes` instead, which for an
 * app's theme is the start theme's. `current` says whether the draw is still wanted once the load
 * has returned.
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
    if (draw.file !== undefined) {
        paintLoad(document, draw, loadOf(draw.file));
        return true;
    }
    const load = await loadAppTheme(draw.choice);
    if (!current()) return load !== null;
    if (load === null) {
        paintAppTheme(document, null);
        applyTheme(document, draw.classes, draw);
        return false;
    }
    paintLoad(document, draw, load);
    return true;
}

/**
 * Draw the theme the config names on a page that holds no `apps` channel (the find page and the
 * presenter's pages), over the files of the app themes the `theme` and `app_theme` options name
 * that the page's first load carries (`files`): an app's theme whose file resolved is drawn from
 * that file, and one whose app is not approved and enabled or whose file does not resolve gives
 * the start theme. The terminal themes' `rice.brackets` and `rice.monospace` are the config's too;
 * such a page draws no CRT overlay, which belongs to the workbench.
 */
export function drawConfiguredTheme(
    document: Themeable & AppThemeDocument,
    inApp: boolean,
    files: AppThemeFiles
): Promise<boolean> {
    const offers = fileOffers(files);
    const choice = configuredTheme(inApp, offers);
    const { brackets, monospace } = configuredLook();
    const state = appThemeState(choice, offers);
    return drawTheme(document, {
        choice,
        app: state === 'ready',
        classes: state === 'none' ? themeClass(choice, offers, inApp) : startClass(inApp),
        crt: false,
        brackets,
        monospace,
        file: Object.hasOwn(files, choice) ? (files[choice] ?? undefined) : undefined
    });
}
