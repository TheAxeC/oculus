// Layer 2, client state. How a terminal is marked: the icon and the colour its reader gave it, or
// its kind's own glyph and the default look. The terminal's row, its bar title and the tab strip's
// tab of a Terminal tab all draw the mark from these rules, so one terminal reads the same in each.

import { TERMINAL_COLORS, type Terminal, type TerminalColor } from '../../../data/model/index.ts';
import { hasGlyph, t } from '../../shared/words/text.ts';
import { readTab, TERMINAL_VIEW } from './terminal-tabs.ts';

/** The theme token each colour name is painted from; a missing or extra name is a type error. */
const COLOR_TOKENS: Record<TerminalColor, string> = {
    black: '--muted',
    red: '--c-red',
    green: '--c-green',
    yellow: '--c-gold',
    blue: '--c-blue',
    magenta: '--c-magenta',
    cyan: '--c-cyan',
    white: '--ink'
};

/** The colour names a terminal may carry, in the order offered. */
export const COLOR_NAMES: readonly TerminalColor[] = TERMINAL_COLORS;

/** The token a colour name is drawn in, or null for a name outside the eight (the default look). */
export function colorToken(name: string): string | null {
    return Object.hasOwn(COLOR_TOKENS, name) ? COLOR_TOKENS[name as TerminalColor] : null;
}

/**
 * The glyph a terminal's mark is drawn with: the icon it was given while the vocabulary still holds
 * it, else its kind's own glyph.
 */
export function markGlyph(kind: Terminal['kind'], icon: string): string {
    if (icon !== '' && hasGlyph(icon)) return icon;
    if (kind === 'claude') return t('sessions.kind_claude_glyph');
    if (kind === 'codex') return t('sessions.kind_codex_glyph');
    return t('sessions.kind_shell_glyph');
}

/**
 * What the strip's tab of a Terminal tab is drawn with, given the terminal the tab shows: the
 * icon it was given and the token of its colour. A terminal with neither (or none shown) gives
 * nothing, and the tab keeps the view's own glyph and the default colour.
 */
export function tabMark(shown: Pick<Terminal, 'icon' | 'color'> | null): {
    glyph?: string;
    token?: string;
} {
    if (shown === null) return {};
    const token = colorToken(shown.color);
    return {
        ...(shown.icon !== '' && hasGlyph(shown.icon) ? { glyph: shown.icon } : {}),
        ...(token === null ? {} : { token })
    };
}

/**
 * The strip mark of a tab of any view: a Terminal tab gives the mark of the terminal it shows
 * (`tabMark`), any other tab gives nothing.
 */
export function tabMarkOf(
    instance: { view: string; state: unknown },
    terminalById: (id: string | null) => Terminal | null
): { glyph?: string; token?: string } {
    if (instance.view !== TERMINAL_VIEW) return {};
    return tabMark(terminalById(readTab(instance.state).shown));
}
