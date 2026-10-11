// Layer 1, data. The name an app's colour theme or file icon theme is saved under: the app's view
// id, a `/` and the theme's label or id, percent-encoded. A view id starts with `app:` and holds a
// `/` when the app belongs to a root, and the encoded part holds none, so the name is read by
// splitting at its last `/`. The page saves a theme by this name and the server reads the saved
// `file_icons` key by it. The themes an app offers are the colour themes and icon themes of the
// apps that act (apps.ts `appActive`), each under that name.

import type { AppRow } from '../../../model/index.ts';
import { appActive, appViewId } from './apps.ts';

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

/** An icon theme an acting app offers. */
export type IconThemeOffer = { choice: string; label: string; appTitle: string };

/**
 * The themes the acting apps offer, each list null while the `apps` channel has sent nothing, so
 * that a saved app theme is kept until the apps are known.
 */
export type AppOffers = { themes: ThemeOffer[] | null; icons: IconThemeOffer[] | null };

/** The offers of a page that holds no `apps` channel. */
export const NO_OFFERS: AppOffers = { themes: null, icons: null };

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
