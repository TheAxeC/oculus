// Layer 3, view partial of Source.svelte. What the tab says under the editor beside the save
// outcome: a refused untitled save, LaTeX action or Submit, and Submit's progress and success
// lines. The caller says whether words are a refusal or a status (save/said-tone.ts).

import type { SaidTone } from './said-tone';

/** The words under the editor and their tone; no words is the empty string. */
export function createSaid() {
    let words = $state('');
    let tone: SaidTone = $state('refusal');
    return {
        get words() {
            return words;
        },
        get tone() {
            return tone;
        },
        /** Say words: a refusal unless the caller says it is a status. */
        say: (next: string, how: SaidTone = 'refusal'): void => {
            words = next;
            tone = how;
        }
    };
}
