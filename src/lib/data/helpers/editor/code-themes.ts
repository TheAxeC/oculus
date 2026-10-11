// Layer 1, data. The code themes the editors can colour code with: `tokens`, which takes the UI
// theme's own code tokens, the 19 VS Code themes by their body classes (`vscode-dark-2026` and so
// on), and the ids of the themes Shiki bundles. The Shiki list is read from Shiki's
// `bundledThemesInfo`, whose entries each carry their theme file as a dynamic import, so reading
// the list loads no theme file; only the id, the display name and the type of each come with the
// page. Readers of the list: the finding for a bad `code_theme:` value (data/sources/config), the
// write check and the schema of that key, the appearance store and the saved pick, and the Settings
// view's menu of themes.

import { bundledThemesInfo } from 'shiki/themes';

/** The value that takes the syntax colours from the UI theme's own code tokens. */
export const CODE_TOKENS = 'tokens';

/**
 * One code theme as the menu lists it: the id saved, the words shown, whether it is dark, and
 * whether it is a VS Code theme (its label is then the class, which the caller words from the UI
 * theme list).
 */
export type CodeThemeInfo = { id: string; label: string; dark: boolean; vscode: boolean };

/**
 * The body class of every VS Code theme, in the order of themes/vscode-rules.json. The layers above
 * `data/` cannot read that file, and `node utils/migrations/convert-vscode-themes.ts --check` names
 * every class that this list and the file do not both hold. A theme is light when its class says
 * so, which agrees with the `color-scheme` each class sets in themes/vscode.css.
 */
const VSCODE_THEMES = [
    'vscode-light-2026',
    'vscode-light-modern',
    'vscode-light-plus',
    'vscode-light-visual-studio',
    'vscode-quiet-light',
    'vscode-solarized-light',
    'vscode-abyss',
    'vscode-dark-2026',
    'vscode-dark-modern',
    'vscode-dark-plus',
    'vscode-dark-visual-studio',
    'vscode-kimbie-dark',
    'vscode-monokai',
    'vscode-monokai-dimmed',
    'vscode-red',
    'vscode-solarized-dark',
    'vscode-tomorrow-night-blue',
    'vscode-dark-high-contrast',
    'vscode-light-high-contrast'
] as const;

/** The id of every code theme but `tokens`: the VS Code classes, then Shiki's, in Shiki's order. */
export function codeThemeIds(): string[] {
    return [...VSCODE_THEMES, ...bundledThemesInfo.map((info) => info.id)];
}

/** Every VS Code theme, then every bundled Shiki theme, with its words and whether it is dark. */
export function codeThemeInfo(): CodeThemeInfo[] {
    return [
        ...VSCODE_THEMES.map((id) => ({
            id,
            label: id,
            dark: !id.includes('light'),
            vscode: true
        })),
        ...bundledThemesInfo.map((info) => ({
            id: info.id,
            label: info.displayName,
            dark: info.type === 'dark',
            vscode: false
        }))
    ];
}

/** Whether a value is a code theme: `tokens`, a VS Code class or a bundled Shiki theme's id. */
export function isCodeTheme(value: unknown): value is string {
    return typeof value === 'string' && (value === CODE_TOKENS || codeThemeIds().includes(value));
}
