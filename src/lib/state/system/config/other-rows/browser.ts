// Layer 2, client state. The "This browser" rows of the Settings view: the seven appearance values
// the ui store keeps per browser (theme, code theme, text size, terminal text size, CRT overlay,
// wallpaper, icons) as rows beside the options of the config files, with their titles and
// descriptions from the catalog.
//
// A row is Modified when this browser holds a value of its own: a code theme, wallpaper, text size
// or terminal text size that is not null, and a theme, CRT or icons value that differs from what a
// browser with nothing saved starts on (`initial()` of the store, which reads the config). Reset
// makes the store forget the value, so the config's answer applies again.
//
// The wallpaper row is made where a theme shows one (the view says which with `offersWallpaper`)
// and wherever this browser holds a wallpaper choice of its own, so a saved choice can be seen as
// Modified and reset under a theme that has none. The terminal text size box is read by
// `terminalSizeOf`, by the decimal rule a config number row is read by.

import { isEqual } from 'lodash-es';
import { t } from '../../../shared/words/text.ts';
import { message, type Message } from '../messages.ts';
import type { RowBase } from '../rows.ts';
import { decimalOf } from '../write.ts';

/** The names of the seven per-browser values, in the order their rows are drawn. */
export const BROWSER_NAMES = [
    'theme',
    'code_theme',
    'text_size',
    'terminal_font',
    'crt',
    'wallpaper',
    'icons'
] as const;

/** The name of one per-browser value. */
export type BrowserName = (typeof BROWSER_NAMES)[number];

/** The control each row draws, in the words a config row's control uses. */
export type BrowserControl = 'choice' | 'number' | 'toggle';

/**
 * One per-browser value: the value in force, which the controls of the row show, and the kind of
 * control the row draws for it.
 */
export type BrowserRow = RowBase & {
    kind: 'browser';
    name: BrowserName;
    control: BrowserControl;
    value: unknown;
};

/**
 * The seven values as this browser holds them of its own: a null is one it has not chosen, which
 * the config's answer stands in for. The ui store's `Chosen` has this shape.
 */
export type BrowserValues = {
    theme: string;
    codeTheme: string | null;
    textScale: number | null;
    terminalFont: number | null;
    crt: boolean;
    wallpaper: boolean | null;
    icons: boolean;
};

/** What the rows need of the ui store, which has these members under the same names. */
export type BrowserUi = {
    theme: () => string;
    codeTheme: () => string;
    textScale: () => number | null;
    terminalFont: () => number | null;
    crt: () => boolean;
    wallpaper: () => boolean;
    icons: () => boolean;
    chosen: () => BrowserValues;
    initial: () => BrowserValues;
    setTheme: (name: string) => void;
    setCodeTheme: (id: string | null) => void;
    setTextScale: (scale: number | null) => void;
    setTerminalFont: (size: number | null) => void;
    setCrt: (on: boolean) => void;
    setWallpaper: (on: boolean | null) => void;
    setIcons: (on: boolean) => void;
};

/** The kind of control each value is set with: a list of words, a number or an on/off switch. */
const CONTROL: Record<BrowserName, BrowserControl> = {
    theme: 'choice',
    code_theme: 'choice',
    text_size: 'number',
    terminal_font: 'number',
    crt: 'toggle',
    wallpaper: 'toggle',
    icons: 'toggle'
};

/** The field of the store's chosen values each value is held in. */
const FIELD: Record<BrowserName, keyof BrowserValues> = {
    theme: 'theme',
    code_theme: 'codeTheme',
    text_size: 'textScale',
    terminal_font: 'terminalFont',
    crt: 'crt',
    wallpaper: 'wallpaper',
    icons: 'icons'
};

/** The words of each value, read when its row is made. */
const WORDS: Record<BrowserName, () => { title: string; help: string }> = {
    theme: () => ({
        title: t('workbench.settings_browser_theme'),
        help: t('workbench.settings_browser_theme_about')
    }),
    code_theme: () => ({
        title: t('workbench.settings_browser_code_theme'),
        help: t('workbench.settings_browser_code_theme_about')
    }),
    text_size: () => ({
        title: t('workbench.settings_browser_text_size'),
        help: t('workbench.settings_browser_text_size_about')
    }),
    terminal_font: () => ({
        title: t('workbench.settings_browser_terminal_font'),
        help: t('workbench.settings_browser_terminal_font_about')
    }),
    crt: () => ({
        title: t('workbench.settings_browser_crt'),
        help: t('workbench.settings_browser_crt_about')
    }),
    wallpaper: () => ({
        title: t('workbench.settings_browser_wallpaper'),
        help: t('workbench.settings_browser_wallpaper_about')
    }),
    icons: () => ({
        title: t('workbench.settings_browser_icons'),
        help: t('workbench.settings_browser_icons_about')
    })
};

/** The value in force for each name, as the page uses it. */
function inForce(ui: BrowserUi, name: BrowserName): unknown {
    if (name === 'theme') return ui.theme();
    if (name === 'code_theme') return ui.codeTheme();
    if (name === 'text_size') return ui.textScale();
    if (name === 'terminal_font') return ui.terminalFont();
    if (name === 'crt') return ui.crt();
    if (name === 'wallpaper') return ui.wallpaper();
    return ui.icons();
}

/**
 * The rows of the per-browser values, in the order of BROWSER_NAMES, the wallpaper's left out
 * where `offersWallpaper` is false and this browser holds no wallpaper choice.
 */
export function thisBrowserRows(ui: BrowserUi, offersWallpaper: boolean): BrowserRow[] {
    const chosen = ui.chosen();
    const initial = ui.initial();
    const wallpaper = offersWallpaper || chosen.wallpaper !== null;
    return BROWSER_NAMES.filter((name) => wallpaper || name !== 'wallpaper').map((name) => ({
        kind: 'browser',
        id: `this-browser:${name}`,
        name,
        path: name,
        control: CONTROL[name],
        section: '',
        ...WORDS[name](),
        value: inForce(ui, name),
        modified: !isEqual(chosen[FIELD[name]], initial[FIELD[name]])
    }));
}

/** Make the store forget the value of one row, so the config's answer applies again. */
export function resetBrowserRow(ui: BrowserUi, row: BrowserRow): void {
    const initial = ui.initial();
    if (row.name === 'theme') ui.setTheme(initial.theme);
    else if (row.name === 'code_theme') ui.setCodeTheme(null);
    else if (row.name === 'text_size') ui.setTextScale(null);
    else if (row.name === 'terminal_font') ui.setTerminalFont(null);
    else if (row.name === 'crt') ui.setCrt(initial.crt);
    else if (row.name === 'wallpaper') ui.setWallpaper(null);
    else ui.setIcons(initial.icons);
}

/** What the size box makes of its text: a size to set (null for the config's) or why not. */
export type SizeText = { set: true; value: number | null } | { set: false; said: Message };

/**
 * The size an applied text of the terminal text size box stands for: an empty box gives the size
 * back to the config, a decimal is the size (the store clamps it), and any other text is refused
 * with the message a config number row gives.
 */
export function terminalSizeOf(text: string): SizeText {
    if (text.trim() === '') return { set: true, value: null };
    const value = decimalOf(text);
    return value === null ? { set: false, said: message('notNumber') } : { set: true, value };
}
