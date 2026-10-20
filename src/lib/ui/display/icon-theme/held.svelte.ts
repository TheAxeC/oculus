// Layer 3, primitive. The file icon theme of an app that the page draws, when `file_icons` of
// config/defaults/appearance.yml names one. The app declares a VS Code icon theme file; the server
// reads it and answers it with the paths of its pictures and fonts turned into the addresses of the
// app's files (GET /api/app-icons), and this holds the theme read, puts the theme's `@font-face`
// rules in the document, and answers the icon a file or a folder gets. With no theme held every
// answer is null, and FileIcon draws Seti as it does for `file_icons: seti`.
//
// The theme is held once for the page, as the app colour theme's rules are (ui/theme/app-rules.ts):
// every file icon of the page asks it, and it is a rune so that an icon is drawn again when the
// theme loads or the colour theme changes between light and dark.

import { languageOf, type LanguageMap } from '$lib/data/helpers/files/languages';
import {
    readIconTheme,
    themedFileIcon,
    themedFolderIcon,
    type IconFace,
    type IconTheme
} from './theme';

/** The id of the style element that holds the theme's fonts. */
const STYLE_ID = 'oculus-icon-fonts';

/**
 * The theme in force, whether the colour theme drawn is dark, and the language each file name
 * has, which the theme's `languageIds` rules are looked up by.
 */
const held: { theme: IconTheme | null; dark: boolean; languages: LanguageMap } = $state({
    theme: null,
    dark: true,
    languages: new Map()
});

/** What the style element needs of the document. */
export type IconDocument = {
    head: { append: (node: HTMLStyleElement) => void };
    getElementById: (id: string) => { textContent: string | null; remove: () => void } | null;
    createElement: (tag: 'style') => HTMLStyleElement;
};

/** Load the icon theme saved under `choice`, read, or null when the server does not serve it. */
export async function loadIconTheme(
    choice: string,
    get: typeof fetch = (...args) => fetch(...args)
): Promise<IconTheme | null> {
    try {
        const response = await get(`/api/app-icons?choice=${encodeURIComponent(choice)}`);
        const body = (await response.json()) as { ok?: unknown; theme?: unknown };
        return body.ok === true ? readIconTheme(body.theme) : null;
    } catch {
        return null;
    }
}

/** Put the theme's fonts in the document and hold the theme, or take both away with null. */
export function holdIconTheme(document: IconDocument, theme: IconTheme | null): void {
    held.theme = theme;
    const present = document.getElementById(STYLE_ID);
    if (theme === null || theme.fontCss === '') {
        present?.remove();
        return;
    }
    if (present !== null) {
        present.textContent = theme.fontCss;
        return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = theme.fontCss;
    document.head.append(style);
}

/** Say whether the colour theme drawn is dark, which decides the icons' `light` tables. */
export function setIconsDark(dark: boolean): void {
    held.dark = dark;
}

/** Hold the language each file name has, as the configuration's `languages` key gives it. */
export function setIconLanguages(languages: LanguageMap): void {
    held.languages = languages;
}

/** Whether an app's icon theme is held, so a file the theme names no icon for draws none. */
export function iconThemeHeld(): boolean {
    return held.theme !== null;
}

/** The icon the held theme gives a file, or null with no theme or no icon for it. */
export function themedFile(name: string): IconFace | null {
    return held.theme === null
        ? null
        : themedFileIcon(held.theme, name, languageOf(name, held.languages), held.dark);
}

/**
 * The icon the held theme gives a folder, or null with no theme or none for folders, in which case
 * the folder row draws its own glyph.
 */
export function themedFolder(name: string, open: boolean): IconFace | null {
    return held.theme === null ? null : themedFolderIcon(held.theme, name, open, held.dark);
}
