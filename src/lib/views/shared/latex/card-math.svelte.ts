// Layer 3, shared view partial. The formulas of a card's Markdown fields: a hub writes math in its
// files as LaTeX between dollars, so a field that holds a dollar asks for KaTeX
// (`loadMarkdownMath`, one load for the page), and every field a component draws with
// `inlineMarkdown(text, cardMath(text))` is drawn again with its formulas typeset once the modules
// are in. A field with no dollar loads nothing. A component makes its own `cardMath` in its script,
// so the drawing is that component's state and nothing is held at module level.

import type { MathDrawing } from '$lib/ui/html';
import { t } from '$lib/state/shared/words/text';
import { MATH_OPTIONS, holdsMath, loadMarkdownMath } from './math.ts';

/** How a component's fields draw their formulas: null until the modules have loaded. */
export function createCardMath(): (text: string) => MathDrawing | null {
    let drawing = $state.raw<MathDrawing | null>(null);
    // Whether a load is on its way, so a component with many fields asks once.
    let asked = false;
    return (text) => {
        if (drawing === null && !asked && holdsMath(text)) {
            asked = true;
            loadMarkdownMath().then(
                (modules) => {
                    drawing = { modules, options: MATH_OPTIONS, refused: t('notes.math_refused') };
                },
                () => {
                    asked = false;
                }
            );
        }
        return drawing;
    };
}
