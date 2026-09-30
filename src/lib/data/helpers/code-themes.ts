// Layer 1, data. The code themes the editors can colour code with: `tokens`, which takes the UI
// theme's own code tokens, and the ids of the themes Shiki bundles. The list is read from Shiki's
// `bundledThemesInfo`, whose entries each carry their theme file as a dynamic import, so reading
// the list loads no theme file; only the id, the display name and the type of each come with the
// page. Three readers share it: the finding for a bad `code_theme:` value (data/sources/config),
// the appearance store that checks a saved pick, and the Settings view's menu of themes.

import { bundledThemesInfo } from 'shiki/themes';

/** The value that takes the syntax colours from the UI theme's own code tokens. */
export const CODE_TOKENS = 'tokens';

/** One code theme as the menu lists it: the id saved, the words shown, and whether it is dark. */
export type CodeThemeInfo = { id: string; label: string; dark: boolean };

/** The id of every bundled Shiki theme, in Shiki's order. Case-sensitive, as Shiki's are. */
export function codeThemeIds(): string[] {
    return bundledThemesInfo.map((info) => info.id);
}

/** Every bundled Shiki theme with its display name and whether it is a dark theme. */
export function codeThemeInfo(): CodeThemeInfo[] {
    return bundledThemesInfo.map((info) => ({
        id: info.id,
        label: info.displayName,
        dark: info.type === 'dark'
    }));
}

/** Whether a value is a code theme: `tokens` or the id of a bundled Shiki theme. */
export function isCodeTheme(value: unknown): value is string {
    return typeof value === 'string' && (value === CODE_TOKENS || codeThemeIds().includes(value));
}
