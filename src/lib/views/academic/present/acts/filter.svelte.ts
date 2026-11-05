// Layer 3, view helper. The filter of one Present pane: the picks it holds in the pane's saved
// state (`filters` of PresentState), the kept list its deck is read under, the answer the pane
// draws, and what the toolbar draws of it: the groups of its bar and the line that says how many
// of the deck's decks it keeps. The rules are the boards', through state/life/present.ts
// (`filterGroupsOf`, `keptKeys`, `deckTally`); this holds only the wiring to the pane and to the
// page's stores. No pick writes a file.
//
// The kept list is read from the pane's saved state and the page's stores at each call, so the
// presenting store's link (`keepFor`) answers for a pane that is not drawn. While picks are held
// and the snapshot the board items are made from is not read yet, it is undefined, which asks the
// deck route for nothing. The pane's own list stays the same array while its keys are the same, and
// the pane tells the Present store which list it reads under (`asking`), so the answers of lists no
// pane reads under any more are dropped.
//
// While the deck under a new kept list is being read, the pane goes on drawing the answer it drew
// for the same deck, so a pick neither blanks the pane nor ends a presentation that runs. Once
// that answer is in, a pick or Clear leaves the pane on the slide on screen when the deck read
// under the new list holds it, and puts it on that deck's first slide when the filter took it
// out. It is called while the view is being initialised, since it registers its effect there.

import { untrack } from 'svelte';
import { mapPreset, withPick, type FilterGroup } from '$lib/state/boards/board';
import { useState } from '$lib/state/client/use';
import {
    FILTER_GROUPS,
    deckHub,
    deckTally,
    filterGroupsOf,
    filterable,
    filtering,
    keptKeys,
    parsePresentState,
    sameDeck,
    type DeckFilters,
    type DeckRef
} from '$lib/state/life/present';
import type { DeckAnswer, Keep } from '$lib/state/life/present.svelte';
import { vocabOf } from '$lib/state/shared/words/tones';
import { t } from '$lib/state/shared/words/text';

/** What the filter reads from the pane. */
type Reads = {
    ref: () => DeckRef | null;
    /** The pane's instance id, which the Present store knows the list the pane reads under by. */
    instance: () => string;
    /** The pane's picks, from its saved state. */
    filters: () => DeckFilters;
    /** The key of the slide the pane is on; empty for the deck's first. */
    slide: () => string;
    /** Write the pane's picks and, when the filter took the slide on screen out, its slide. */
    write: (changes: { filters?: DeckFilters; slide?: string }) => void;
};

/** What the toolbar draws of a pane's filter. */
export type FilterLine = {
    groups: FilterGroup[];
    /** The ids of the groups the bar draws, in their order. */
    line: readonly string[];
    /** "Filtered: n of m decks" while a pick is held, else the empty string. */
    said: string;
    ontoggle: (group: string, value: string) => void;
    onclear: () => void;
};

export type PaneFilter = {
    /** The answer the pane draws for its deck, null with no deck named. */
    answer: () => DeckAnswer | null;
    keep: () => Keep;
    /** The kept list of a pane by its instance id, read from its saved state at the call. */
    keepFor: (instance: string, ref: DeckRef) => Keep;
    /** What the toolbar draws, null for a deck that holds no group of project decks. */
    bar: () => FilterLine | null;
};

export function createFilter(reads: Reads): PaneFilter {
    const {
        entities: { portfolio },
        fs: { primary, roots },
        present: { asking, deck: deckOf },
        selectors: { board, configMap },
        ui: { instanceState }
    } = useState();

    /** The kept list under a set of picks: undefined while the snapshot is not read. */
    function keepOf(ref: DeckRef, filters: DeckFilters): Keep {
        if (!filtering(filters)) return null;
        if (portfolio() === null) return undefined;
        const preset = mapPreset(configMap(), vocabOf);
        return keptKeys(board(preset), deckHub(ref, roots(), primary()), filters, preset);
    }

    function keepFor(instance: string, ref: DeckRef): Keep {
        return keepOf(ref, parsePresentState(instanceState(instance)).filters);
    }

    /**
     * The pane's kept list: the same array while the keys it holds are the same, so a slide move or
     * a push that leaves them as they were runs nothing that reads it again.
     */
    let kept: Keep = null;
    const keep = $derived.by(() => {
        const ref = reads.ref();
        const next = ref === null ? null : keepOf(ref, reads.filters());
        if (JSON.stringify(next) !== JSON.stringify(kept)) kept = next;
        return kept;
    });

    // The Present store holds an answer under a kept list while a pane reads under it, so the pane
    // says the list it reads under at each change, and that it reads none once it is gone. What the
    // store reads while it drops answers is no part of what the effect follows.
    $effect(() => {
        const pane = reads.instance();
        const ref = reads.ref();
        const list = keep;
        untrack(() => asking(pane, ref, list));
    });
    $effect(() => {
        const pane = reads.instance();
        return () => asking(pane, null, undefined);
    });

    /** The last answer the pane drew that was in, which a read under a new kept list keeps. */
    let last: { ref: DeckRef; answer: DeckAnswer } | null = null;
    const answer = $derived.by((): DeckAnswer | null => {
        const ref = reads.ref();
        if (ref === null) return null;
        const read = deckOf(ref, keep);
        const pending = read.deck === null && read.loading;
        if (!pending) last = { ref, answer: read };
        if (!pending || last === null || !sameDeck(last.ref, ref)) return read;
        return { ...last.answer, loading: true };
    });

    /** Whether a pick changed and the answer under the new kept list is yet to be checked. */
    let moving = $state(false);
    $effect(() => {
        const read = answer;
        if (!moving || read === null || read.loading) return;
        moving = false;
        const slides = read.deck?.slides ?? [];
        if (!slides.some((row) => row.key === reads.slide())) {
            reads.write({ slide: slides.at(0)?.key ?? '' });
        }
    });

    function pick(filters: DeckFilters): void {
        moving = true;
        reads.write({ filters });
    }

    const bar = $derived.by((): FilterLine | null => {
        const deck = answer?.deck ?? null;
        if (deck === null || !filterable(deck)) return null;
        const preset = mapPreset(configMap(), vocabOf);
        const filters = reads.filters();
        const tally = deckTally(deck);
        const said = !filtering(filters)
            ? ''
            : tally.total === 1
              ? t('present.filtered_one', String(tally.kept))
              : t('present.filtered', String(tally.kept), String(tally.total));
        return {
            groups: filterGroupsOf(deck, board(preset), filters, preset),
            line: FILTER_GROUPS,
            said,
            ontoggle: (group, value) => pick(withPick(filters, group, value)),
            onclear: () => pick({})
        };
    });

    return { answer: () => answer, keep: () => keep, keepFor, bar: () => bar };
}
