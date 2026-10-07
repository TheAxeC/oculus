// Layer 3, shared view partial. The words that name how a build stands, for the project tab's main
// rows and the TeX view's head, and the words of a float's kind in the Structure section. Each is a
// literal read so the word gate sees it.

import type { BuildStatus } from '$lib/state/sessions/latex/latex-state';
import { t } from '$lib/state/shared/words/text';

/** The words for a build's state; an idle build says nothing. */
export function stateWords(status: BuildStatus): string {
    if (status === 'building') return t('latex.state_building');
    if (status === 'succeeded') return t('latex.state_succeeded');
    if (status === 'failed') return t('latex.state_failed');
    if (status === 'stopped') return t('latex.state_stopped');
    return '';
}

/**
 * The glyph that draws a build's state, and the empty string for an idle build, which draws none.
 */
export function stateGlyph(status: BuildStatus): string {
    if (status === 'building') return t('latex.glyph_building');
    if (status === 'succeeded') return t('latex.glyph_succeeded');
    if (status === 'failed' || status === 'stopped') return t('latex.glyph_failed');
    return '';
}

/** The words for a float's kind; a kind the reader does not know is said as it is written. */
export function floatWords(kind: string): string {
    if (kind === 'figure') return t('latex.float_figure');
    if (kind === 'table') return t('latex.float_table');
    if (kind === 'algorithm') return t('latex.float_algorithm');
    if (kind === 'listing') return t('latex.float_listing');
    return kind;
}
