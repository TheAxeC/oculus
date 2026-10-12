// Layer 3, shell, partial of Palette.svelte. The list of `:language`: the languages the words after
// the command narrow to, the entries above them (with no words typed and the first list drawn), and
// the association the second list picks a language for. The second list belongs to the association
// the reader chose in the first, and it is left with the language mode.

import {
    languageActions,
    languageMatches,
    type LanguageAssociation,
    type LanguageMatch
} from '$lib/state/workbench/navigation/status';
import type { ParsedCommand } from '$lib/state/workbench/palette';

/** What the list is made over: the query and the source tab on screen, null when it is none. */
export type LanguageListInput = {
    parsed: () => ParsedCommand | null;
    source: () => { status: { file: string; language: string } } | null;
};

/** The list of `:language`. */
export type LanguageList = {
    /** Whether the query is `:language`. */
    readonly active: boolean;
    /** The languages the words narrow to; none without a source tab. */
    readonly languages: LanguageMatch[];
    /** The entries above the languages: with no words typed, and not in the second list. */
    readonly entries: ReturnType<typeof languageActions>;
    /** The association the second list picks for, or null while the first is drawn. */
    readonly associating: LanguageAssociation | null;
    /** Draw the second list, which picks a language for the association. */
    associate: (next: LanguageAssociation) => void;
    /** Draw the first list again. */
    leave: () => void;
};

export function createLanguageList(input: LanguageListInput): LanguageList {
    const active = $derived(input.parsed()?.name === 'language');
    let associating = $state<LanguageAssociation | null>(null);
    const languages = $derived<LanguageMatch[]>(
        active && input.source() !== null ? languageMatches(input.parsed()?.argument ?? '') : []
    );
    const entries = $derived.by(() => {
        const source = input.source();
        const first = active && source !== null && associating === null;
        return first && input.parsed()?.argument.trim() === ''
            ? languageActions(source.status.file, source.status.language)
            : [];
    });
    return {
        get active() {
            return active;
        },
        get languages() {
            return languages;
        },
        get entries() {
            return entries;
        },
        get associating() {
            return associating;
        },
        associate: (next) => {
            associating = next;
        },
        leave: () => {
            associating = null;
        }
    };
}
