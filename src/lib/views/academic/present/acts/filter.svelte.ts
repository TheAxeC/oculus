// Layer 3, view helper. The filter of one Present pane: the Projects board's filter over the member
// projects of the deck's groups of project decks, the kept list its deck is read under, the answer
// the pane draws, and what the bar under the toolbar draws (views/shared/forms/bar/BoardBar.svelte,
// the board's own bar). The filter is the board's function (state/boards/board/filter-menu.ts
// `boardFilter`) given the same arguments as on the board: the members as board items of the Map's
// preset, which takes every project, whether a person is marked as the user, the hubs of the Hub
// group, the pane's saved state and the stale lag. Its controls are saved in the pane's state under
// the board's keys (state/life/present.ts `PresentBar`); no control writes a file.
//
// The members are read from the deck's whole answer, which the Present store holds for as long as
// the page does (state/life/present.svelte.ts `asking` never drops it), so the kept list is one
// function of a pane's saved state and that answer, read at each call: the pane's own `keep` and
// the presenting store's link (`keepFor`) give the same list whether the pane is drawn or not. It
// is null for a deck with no group of project decks and while the bar shows every member, and
// undefined, which asks the deck route for nothing, while the whole answer or the snapshot the
// board items are made from is not read yet; so a pane opened on a deck its saved controls narrow
// draws its loading state until the narrowed answer is in. The pane's own list stays the same array
// while its keys are the same, and the pane tells the Present store which list it reads under
// (`asking`), so the answers of lists no pane reads under any more are dropped.
//
// While the deck under a new kept list is being read, the pane goes on drawing the answer it drew
// for the same deck, so a change of the controls neither blanks the pane nor ends a presentation
// that runs. Once that answer is in, the pane stays on the slide on screen when the deck read under
// the new list holds it, and goes to that deck's first slide when the filter took it out. It is
// called while the view is being initialised, since it registers its effects there.

import { untrack } from 'svelte';
import {
    boardFilter,
    mapPreset,
    searchWords,
    type BoardFilter,
    type BoardItem,
    type BoardPreset,
    type BoardState,
    type BoardStats
} from '$lib/state/boards/board';
import { useState } from '$lib/state/client/use';
import {
    barFields,
    filterable,
    memberItems,
    sameDeck,
    shownKeys,
    type DeckRef,
    type PresentState
} from '$lib/state/life/present';
import type { DeckAnswer, Keep } from '$lib/state/life/present.svelte';
import { hubList } from '$lib/state/shared/page/hubs';
import { vocabOf } from '$lib/state/shared/words/tones';

/** What the filter reads from the pane. */
type Reads = {
    ref: () => DeckRef | null;
    /** The pane's instance id, whose saved state holds the controls. */
    instance: () => string;
    /** The key of the slide the pane is on; empty for the deck's first. */
    slide: () => string;
    /** Write fields of the pane's state: the controls, or the slide the filter took out. */
    write: (changes: Partial<PresentState>) => void;
};

/** What the bar under the toolbar draws of a pane's filter, as the board's bar takes it. */
export type PaneBar = {
    filter: BoardFilter;
    /** The counts on the controls, over the members before any filter. */
    stats: BoardStats;
    placeholder: string;
    write: (next: Partial<BoardState>) => void;
};

export type PaneFilter = {
    /** The answer the pane draws for its deck, null with no deck named. */
    answer: () => DeckAnswer | null;
    keep: () => Keep;
    /** The kept list of a pane by its instance id, read from its saved state at the call. */
    keepFor: (instance: string, ref: DeckRef) => Keep;
    /** What the bar draws, null for a deck that holds no group of project decks. */
    bar: () => PaneBar | null;
};

/**
 * A pane's filter over its deck: the members it runs over, the preset they are items of, and the
 * board's answer; null for a deck with no group of project decks, or whose whole answer failed or
 * names nothing, and undefined while that answer or the snapshot is not read yet.
 */
type Worked = { members: BoardItem[]; preset: BoardPreset; filter: BoardFilter } | null | undefined;

export function createFilter(reads: Reads): PaneFilter {
    const {
        entities: { portfolio },
        fs: { primary, roots },
        present: { asking, deck: deckOf },
        selectors: { board, boardStats, configMap, selfNamed, staleLag },
        ui: { instanceState }
    } = useState();

    function worked(instance: string, ref: DeckRef): Worked {
        const whole = deckOf(ref, null);
        if (whole.deck === null) return whole.loading ? undefined : null;
        if (!filterable(whole.deck)) return null;
        if (portfolio() === null) return undefined;
        const preset = mapPreset(configMap(), vocabOf);
        const members = memberItems(whole.deck, board(preset));
        const hubs = hubList(roots(), primary());
        const saved = instanceState(instance);
        const filter = boardFilter(members, preset, selfNamed(), hubs, saved, staleLag());
        return { members, preset, filter };
    }

    function keepOf(work: Worked): Keep {
        if (work === undefined || work === null) return work;
        return shownKeys(work.members, work.filter.shown);
    }

    function keepFor(instance: string, ref: DeckRef): Keep {
        return keepOf(worked(instance, ref));
    }

    const work = $derived.by((): Worked => {
        const ref = reads.ref();
        return ref === null ? null : worked(reads.instance(), ref);
    });

    /**
     * The pane's kept list: the same array while the keys it holds are the same, so a slide move or
     * a push that leaves them as they were runs nothing that reads it again.
     */
    let kept: Keep = null;
    const keep = $derived.by(() => {
        const next = keepOf(work);
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

    /** Whether the kept list changed and the answer under the new one is yet to be checked. */
    let moving = $state(false);
    /** The kept list the pane last read under, which a change of it is told from. */
    let previous: string | undefined;
    $effect(() => {
        const now = JSON.stringify(keep);
        untrack(() => {
            if (now !== previous) moving = true;
            previous = now;
        });
    });
    $effect(() => {
        const read = answer;
        if (!moving || read === null || read.loading) return;
        moving = false;
        const slide = reads.slide();
        const slides = read.deck?.slides ?? [];
        if (slide !== '' && !slides.some((row) => row.key === slide)) {
            reads.write({ slide: slides.at(0)?.key ?? '' });
        }
    });

    const bar = $derived.by((): PaneBar | null => {
        if (work === null || work === undefined) return null;
        const { filter, members, preset } = work;
        return {
            filter,
            stats: boardStats(members),
            placeholder: searchWords(preset),
            write: (next) => reads.write(barFields({ ...filter.held, ...next }))
        };
    });

    return { answer: () => answer, keep: () => keep, keepFor, bar: () => bar };
}
