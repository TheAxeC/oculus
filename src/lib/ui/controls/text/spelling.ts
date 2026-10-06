// Layer 3, primitive support. What a text box's menu asks of the spell checker: whether a word is
// misspelt and what would replace it. The desktop app has a spell checker and a browser page has
// none of its own to ask, so the page root provides the ask when the app gave it one, and a text
// box finds none otherwise and offers nothing.
//
// It is the primitives' own context and names no store, as the tooltip counter's is: `ui/` imports
// nothing of the state layer, so the page hands the ask down.

import { getContext, setContext } from 'svelte';

/** What the spell checker says of one word. */
type SpellingAnswer = { misspelled: boolean; suggestions: string[] };

/** The ask: one word in, the checker's answer out. */
export type SpellingAsk = (word: string) => Promise<SpellingAnswer>;

/** The key the ask is provided under. */
const SPELLING_KEY = Symbol('spelling');

/** Provide the page's ask to every text box it renders; undefined provides none. */
export function provideSpelling(ask: SpellingAsk | undefined): void {
    setContext(SPELLING_KEY, ask);
}

/** The page's ask, read while a text box initialises, or undefined where the page has none. */
export function useSpelling(): SpellingAsk | undefined {
    return getContext<SpellingAsk | undefined>(SPELLING_KEY);
}
