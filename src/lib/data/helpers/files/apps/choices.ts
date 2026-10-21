// Layer 1, data. The name an app's colour theme or file icon theme is saved under: the app's view
// id, a `/` and the theme's label or id, percent-encoded. A view id starts with `app:` and holds a
// `/` when the app belongs to a root, and the encoded part holds none, so the name is read by
// splitting at its last `/`. The page saves a theme by this name and the server reads the saved
// `file_icons` key by it. The themes an app offers are the colour themes and icon themes of the
// apps that act (apps.ts `appActive`), each under that name.

import type { AppRow } from '../../../model/index.ts';
import { isMap } from '../../guards.ts';
import { appActive, appViewId } from './apps.ts';

/**
 * The body class an app's colour theme lands on the document as, whose block the page and the
 * desktop host convert the theme's file into.
 */
export const APP_THEME_CLASS = 'app-theme';

/** The saved name of an app's theme. */
function appChoice(view: string, name: string): string {
    return `${view}/${encodeURIComponent(name)}`;
}

/** The app view id and the theme name a saved name stands for, or null for a name of no app. */
export function splitAppChoice(saved: string): { view: string; name: string } | null {
    if (!saved.startsWith('app:')) return null;
    const at = saved.lastIndexOf('/');
    if (at < 0) return null;
    try {
        return { view: saved.slice(0, at), name: decodeURIComponent(saved.slice(at + 1)) };
    } catch {
        return null;
    }
}

/** A colour theme an acting app offers. */
export type ThemeOffer = {
    /** The name the page saves the theme under. */
    choice: string;
    /** The label in the app's file, and the title of the app. */
    label: string;
    appTitle: string;
    uiTheme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
};

/**
 * A colour theme of an acting app as the server reads it: its file with the `include` chain
 * resolved inside the app, the kind of theme it is, its label and the title of its app. The
 * /api/app-theme route answers it, and a page's first load carries it for the themes the `theme`
 * and `app_theme` options name, keyed by the saved name.
 */
export type AppThemeFile = {
    theme: { colors: Record<string, string>; tokenColors: unknown[] };
    uiTheme: ThemeOffer['uiTheme'];
    label: string;
    app: string;
};

/**
 * The colour themes of apps a page's first load carries, by saved name: the theme's file, or null
 * for a name whose app is not approved and enabled or whose file does not resolve.
 */
export type AppThemeFiles = Record<string, AppThemeFile | null>;

/** The kinds of theme a VS Code colour theme declares as its `uiTheme`. */
const UI_THEMES: readonly ThemeOffer['uiTheme'][] = ['vs', 'vs-dark', 'hc-black', 'hc-light'];

/**
 * The saved names of the app themes the `theme` and `app_theme` options name, each once: a value
 * that is the saved name of an app's theme and names no row of `themes:`. These are the themes a
 * page's first load carries the files of and the desktop host reads the colours of.
 */
export function appThemeNames(config: Record<string, unknown>): string[] {
    const rows: unknown[] = Array.isArray(config.themes) ? config.themes : [];
    const named = new Set(rows.flatMap((row) => (isMap(row) ? [row.name] : [])));
    const names: string[] = [];
    for (const value of [config.theme, config.app_theme]) {
        if (typeof value !== 'string' || named.has(value) || splitAppChoice(value) === null) {
            continue;
        }
        if (!names.includes(value)) names.push(value);
    }
    return names;
}

/**
 * The theme file of an answer of `GET /api/app-theme?choice=<choice>`, or null for a refusal or a
 * body of another shape: the theme's colours and token colours, its kind, and its label and app's
 * title, the choice and an empty title when the body gives none.
 */
export function themeAnswer(body: unknown, choice: string): AppThemeFile | null {
    if (!isMap(body) || body.ok !== true || !isMap(body.theme)) return null;
    const uiTheme = UI_THEMES.find((one) => one === body.uiTheme);
    if (uiTheme === undefined) return null;
    const colors = isMap(body.theme.colors) ? body.theme.colors : {};
    return {
        theme: {
            colors: Object.fromEntries(
                Object.entries(colors).filter(
                    (entry): entry is [string, string] => typeof entry[1] === 'string'
                )
            ),
            tokenColors: Array.isArray(body.theme.tokenColors) ? body.theme.tokenColors : []
        },
        uiTheme,
        label: typeof body.label === 'string' ? body.label : choice,
        app: typeof body.app === 'string' ? body.app : ''
    };
}

/** An icon theme an acting app offers. */
export type IconThemeOffer = { choice: string; label: string; appTitle: string };

/**
 * The themes the acting apps offer, each list null while the `apps` channel has sent nothing, so
 * that a saved app theme is kept until the apps are known.
 */
export type AppOffers = { themes: ThemeOffer[] | null; icons: IconThemeOffer[] | null };

/** The offers of a page that holds no `apps` channel. */
export const NO_OFFERS: AppOffers = { themes: null, icons: null };

/**
 * The offers of a page that holds no `apps` channel and was handed the files of the app themes the
 * `theme` and `app_theme` options name (`AppThemeFiles`): each theme whose file resolved, under its
 * saved name, with the label, the app's title and the kind its file gives. A name with no file is
 * not offered, so the page draws the start theme for it; the icon themes are not known.
 */
export function fileOffers(files: AppThemeFiles): AppOffers {
    const themes = Object.entries(files).flatMap(([choice, file]) =>
        file === null
            ? []
            : [{ choice, label: file.label, appTitle: file.app, uiTheme: file.uiTheme }]
    );
    return { themes, icons: null };
}

/** The colour themes the acting apps offer, in the apps' order. */
export function themeOffers(rows: readonly AppRow[]): ThemeOffer[] {
    return rows.filter(appActive).flatMap((row) =>
        row.contributes.themes.map((theme) => ({
            choice: appChoice(appViewId(row.root, row.name), theme.label),
            label: theme.label,
            appTitle: row.title,
            uiTheme: theme.uiTheme
        }))
    );
}

/** The icon themes the acting apps offer, in the apps' order. */
export function iconThemeOffers(rows: readonly AppRow[]): IconThemeOffer[] {
    return rows.filter(appActive).flatMap((row) =>
        row.contributes.iconThemes.map((theme) => ({
            choice: appChoice(appViewId(row.root, row.name), theme.id),
            label: theme.label,
            appTitle: row.title
        }))
    );
}
