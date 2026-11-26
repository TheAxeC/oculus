<script lang="ts">
    // Layer 3, shared view partial of the project boards and the Present view, through the shared
    // board bar (BoardBar.svelte), the collection views (views/boards/collection/Collection.svelte)
    // and the Map (views/structure/map/Map.svelte). Line 2 of their bar: for each category of
    // slices the caller hands (a board's and the Map's categories of projects, a collection's
    // status field), its label in small capitals in the category's colour, then its slices as
    // chips, each with its words and its count ("journal article 9"), outlined in the slice's hue,
    // filled while included and struck through in the red while excluded. A press on a slice is the
    // row press (includes an off or an excluded slice, turns an included one off), and an Alt-click
    // on it, or Alt+Enter or Alt+Space while it has the focus, is the "not" press (excludes an off
    // or an included slice, turns an excluded one off); a press on a category's label includes
    // every slice of it, or takes them all out when all are included, and an Alt-click on it
    // excludes every slice of it. The slices are stored under one facet key (`facet`: `slice` on a
    // board and the Map, the collection's `status`), and their counts are that facet's in
    // `counted`. The line ends with how many are shown, in the caller's words (`words`: "16
    // projects", "5 of 16 shown", "12 entries") and, while any facet value is included or excluded,
    // Clear all, which takes every group's and slice's include and exclude out and leaves the
    // search and the caller's toggles as they are.
    //
    // The line is one line at any pane width: the slices that do not fit beside the end of the line
    // fold, last in, first out, into a "+<n>" button that opens them in a list headed by category
    // (PickMenu.svelte), its words carrying how many of them are included or excluded ("+5, 1
    // picked") as line 1's More does, so a folded pick shows on the line too; a category whose
    // slices all fold folds its label with them. The folding is ui/frame/toolbar/FoldRun.svelte's,
    // as line 1's (FilterBar.svelte) is; a render with no layout draws every slice.
    //
    // It holds no state of its caller: the slices, their counts and the picks are the caller's,
    // computed by pure functions of state/boards/; a row press, a press on a category's label and
    // Clear all are handed back as both lists they leave (`onfilters`, made by
    // state/boards/board/state.ts `withPick`, `withCategory` and `noPicks`), and the "not" press on
    // a slice, on the line or in the folded list, as the slice it is on (`onexclude`), which the
    // caller writes as FilterBar.svelte's is.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import ToolButton from '$lib/ui/controls/tool-button/ToolButton.svelte';
    import FoldRun from '$lib/ui/frame/toolbar/FoldRun.svelte';
    import PickMenu from './PickMenu.svelte';
    import {
        noPicks,
        sliceChoices,
        withCategory,
        withPick,
        type Facet,
        type FilterPicks,
        type Slice,
        type SliceGroup
    } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The line's accessible name, already translated. */
        label: string;
        /** The slices by category, read from the caller's items before any filter. */
        groups: SliceGroup[];
        /** The facet key the slices are stored under in `filters` and counted in `counted`. */
        facet: string;
        /** The facets with their counts over what the other filters leave, slices included. */
        counted: Facet[];
        /** The facet values the caller's saved state includes, and those it excludes. */
        filters: Record<string, string[]>;
        excluded: Record<string, string[]>;
        /** How many items are shown, and how many the caller holds. */
        shown: number;
        total: number;
        /** The words of the shown count, already translated. */
        words: (shown: number, total: number) => string;
        /**
         * Hands back both lists a press leaves: the row press on one slice, a category's slices
         * included, taken out or excluded, or every facet value taken out by Clear all.
         */
        onfilters: (picks: FilterPicks) => void;
        /** The "not" press on one slice of the facet `facet`. */
        onexclude: (facet: string, value: string) => void;
    };

    let {
        label,
        groups,
        facet,
        counted,
        filters,
        excluded,
        shown,
        total,
        words,
        onfilters,
        onexclude
    }: Props = $props();

    /** How wide the "+<n>" button is taken to be before it is first drawn. */
    const MORE_GUESS = 40;

    /** One place of the run: a category's label or one of its slices, in the order drawn. */
    type Place = { group: SliceGroup; slice?: Slice };

    const places: Place[] = $derived(
        groups.flatMap((group) => [{ group }, ...group.slices.map((slice) => ({ group, slice }))])
    );
    const picks: FilterPicks = $derived({ filters, excluded });
    const picked = $derived(Object.hasOwn(filters, facet) ? filters[facet] : []);
    const out = $derived(Object.hasOwn(excluded, facet) ? excluded[facet] : []);
    const counts = $derived(
        new Map(
            (counted.find((one) => one.key === facet)?.values ?? []).map((one) => [
                one.value,
                one.count
            ])
        )
    );
    const picking = $derived(
        [...Object.values(filters), ...Object.values(excluded)].some((values) => values.length > 0)
    );

    /** How many places the line draws, and null while it draws all of them. */
    let fits: number | null = $state(null);

    let line = $state<HTMLElement | null>(null);
    let end = $state<HTMLElement | null>(null);
    let moreBox = $state<HTMLElement | null>(null);
    /** The width the "+<n>" button was last drawn at. */
    let moreWidth = MORE_GUESS;

    const folded = $derived(
        new Set(
            fits === null ? [] : places.slice(fits).flatMap((place) => place.slice?.value ?? [])
        )
    );
    const foldedGroups = $derived(sliceChoices(groups, facet, counted, picks, folded));
    /** How many of the folded slices are included or excluded, which the "+<n>" button carries. */
    const foldedPicks = $derived([...picked, ...out].filter((value) => folded.has(value)).length);

    /** The room the places have beside the end of the line, and the "+<n>" button after them. */
    function room(gap: number): { room: number; opener: number } | null {
        if (line === null || end === null) return null;
        if (moreBox !== null) moreWidth = moreBox.getBoundingClientRect().width;
        return {
            room: line.getBoundingClientRect().width - end.getBoundingClientRect().width - gap,
            opener: moreWidth
        };
    }

    /** A label whose slices all fold folds with them, so no label ends the run. */
    function keep(count: number): number {
        let kept = count;
        while (kept > 0 && places.at(kept - 1)?.slice === undefined) kept -= 1;
        return kept;
    }

    /** A place's key in the run: its slice's value, or its category's key for a label. */
    function placeKey(place: Place): string {
        return place.slice?.value ?? `group:${place.group.key}`;
    }

    /**
     * A press on a category's label: a plain click includes every slice of it, or takes them all
     * out when all are included; an Alt-click excludes every slice of it.
     */
    function pickCategory(group: SliceGroup, event: MouseEvent): void {
        const values = group.slices.map((one) => one.value);
        onfilters(withCategory(picks, facet, values, event.altKey));
    }

    /**
     * A press on a slice: the "not" press with Alt held, which a press of Enter or Space on the
     * focused chip carries as a click with the key's modifiers, else the row press.
     */
    function pressSlice(slice: Slice, event: MouseEvent): void {
        if (event.altKey) onexclude(facet, slice.value);
        else onfilters(withPick(picks, facet, slice.value));
    }

    /** The hue of a category's label, as an inline custom property, and none for "other". */
    function labelStyle(group: SliceGroup): string | undefined {
        return group.tone === '' ? undefined : `--tone: var(--c-${group.tone}-txt)`;
    }
</script>

{#snippet placed(place: Place)}
    {#if place.slice === undefined}
        <span class="category" style={labelStyle(place.group)}>
            <RowButton onclick={(event: MouseEvent) => pickCategory(place.group, event)}>
                <span class="words">{place.group.label}</span>
            </RowButton>
        </span>
    {:else}
        {@const slice = place.slice}
        <Chip
            label={t('board.slice_words', slice.label, counts.get(slice.value) ?? 0)}
            title={out.includes(slice.value) ? t('board.exclude_stop', slice.label) : slice.tip}
            tone={slice.tone === '' ? undefined : slice.tone}
            outlined
            pressed={picked.includes(slice.value)}
            excluded={out.includes(slice.value)}
            onclick={(event: MouseEvent) => pressSlice(slice, event)}
        />
    {/if}
{/snippet}

<div class="line" role="toolbar" aria-label={label} bind:this={line}>
    <FoldRun
        items={places}
        key={placeKey}
        item={placed}
        box={line}
        {room}
        {keep}
        bind:shown={fits}
    />
    {#if foldedGroups.length > 0}
        <span class="more" bind:this={moreBox}>
            <PickMenu
                label={foldedPicks === 0
                    ? t('board.slices_more', folded.size)
                    : t('board.slices_more_picked', folded.size, foldedPicks)}
                groups={foldedGroups}
                headed
                onpick={(_category: string, value: string) =>
                    onfilters(withPick(picks, facet, value))}
                onexclude={(_category: string, value: string) => onexclude(facet, value)}
            />
        </span>
    {/if}
    <span class="end" bind:this={end}>
        <span class="count">{words(shown, total)}</span>
        {#if picking}
            <ToolButton
                small
                glyph="clear_all"
                label={t('board.filter_clear')}
                onclick={() => onfilters(noPicks())}
            />
        {/if}
    </span>
</div>

<style>
    /* One line that never wraps: the slices take what the end of the line leaves, and those past
       it fold into the "+<n>" button. Until the first measure the line clips what passes its width
       rather than scrolling the bar sideways. */
    .line {
        display: flex;
        flex: 1 0 100%;
        align-items: center;
        gap: 6px;
        min-width: 0;
        overflow: hidden;
    }

    .more {
        display: inline-flex;
        flex: none;
    }

    /* A category's label: its words in small capitals in the category's hue, pressable as a whole
       to include or take out every slice of it, or with Alt to exclude every slice of it. */
    .category {
        display: inline-flex;
        flex: none;
    }

    .words {
        font-size: var(--fs-xs);
        font-weight: 700;
        font-variant: small-caps;
        letter-spacing: 0.04em;
        white-space: nowrap;
        color: var(--tone, var(--muted-txt, var(--muted)));
    }

    /* How many are shown, and Clear all, at the line's right end. */
    .end {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 6px;
        margin-left: auto;
    }

    .count {
        font-size: var(--fs-xs);
        white-space: nowrap;
        color: var(--muted-txt, var(--muted));
    }
</style>
