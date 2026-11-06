// Layer 3, view helper. The fit of a slide's typeset formula to its card: a formula wider than the
// card's content width is drawn smaller until it fits (`equationScale`), measured at its own size
// first. The card runs it when it is drawn and when its width changes (parts/Equation.svelte), and
// the slide's layout runs it at each size it tries (Slide.svelte), so the slide's text is measured
// with each formula fitted to the box the layout gives it. It lives apart from the card's
// component so that both can import it.

import { equationScale } from '$lib/state/life/present';

/** Draw a card's typeset formula at the scale that fits the card's content width. */
export function fitFormula(card: HTMLElement): void {
    const math = card.querySelector<HTMLElement>('.katex-display');
    if (math === null) return;
    math.style.fontSize = '';
    const style = getComputedStyle(card);
    const room = card.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    math.style.fontSize = `${equationScale(math.scrollWidth, room)}em`;
}
