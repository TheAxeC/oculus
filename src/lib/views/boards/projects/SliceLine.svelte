<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. Line 2 of a project board's
    // bar: for each category the board's projects are in, its label in small capitals in the
    // category's colour, then its slices as chips, each with its words and its count ("journal
    // article 9"), outlined in the slice's hue and filled while picked; a press on a slice picks or
    // unpicks it, and a press on a category's label picks every slice of it, or takes them all out
    // when all are picked. The line ends with how many projects the board shows ("16 projects",
    // "5 of 16 shown") and, while any facet value is picked, Clear all, which takes every facet
    // value out, the slices included, and leaves the search and the toggles as they are.
    //
    // The line is one line at any pane width: the slices that do not fit beside the end of the line
    // fold, last in, first out, into a "+<n>" button that opens them in a list headed by category
    // (PickMenu.svelte), its words carrying how many of them are picked ("+5, 1 picked") as line
    // 1's More does, so a folded pick still shows on the line; a category whose slices all fold
    // folds its label with them. The folding is ui/frame/toolbar/FoldRun.svelte's, as line 1's
    // (FilterBar.svelte) is; a render with no layout draws every slice.
    //
    // It holds no state of the board: the slices, their counts and the picks are the board's,
    // computed by the pure functions of state/boards/board/, and every press is handed back.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FoldRun from '$lib/ui/frame/toolbar/FoldRun.svelte';
    import PickMenu from './PickMenu.svelte';
    import {
        shownWords,
        sliceChoices,
        type Facet,
        type Slice,
        type SliceGroup
    } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The board's slices by category, read from its projects before any filter. */
        groups: SliceGroup[];
        /** The facets with their counts over what the other filters leave, slices included. */
        counted: Facet[];
        /** The facet values the board's saved state holds. */
        filters: Record<string, string[]>;
        /** How many projects the board shows, and how many it holds. */
        shown: number;
        total: number;
        /** Adds or takes out one slice. */
        ontoggle: (facet: string, value: string) => void;
        /** Sets the picked slices to `values`. */
        onslices: (values: string[]) => void;
        /** Takes every facet value out. */
        onclear: () => void;
    };

    let { groups, counted, filters, shown, total, ontoggle, onslices, onclear }: Props = $props();

    /** How wide the "+<n>" button is taken to be before it is first drawn. */
    const MORE_GUESS = 40;

    /** One place of the run: a category's label or one of its slices, in the order drawn. */
    type Place = { group: SliceGroup; slice?: Slice };

    const places: Place[] = $derived(
        groups.flatMap((group) => [{ group }, ...group.slices.map((slice) => ({ group, slice }))])
    );
    const picked = $derived(Object.hasOwn(filters, 'slice') ? filters.slice : []);
    const counts = $derived(
        new Map(
            (counted.find((one) => one.key === 'slice')?.values ?? []).map((one) => [
                one.value,
                one.count
            ])
        )
    );
    const picking = $derived(Object.values(filters).some((values) => values.length > 0));

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
    const foldedGroups = $derived(sliceChoices(groups, counted, filters, folded));
    /** How many of the folded slices are picked, which the "+<n>" button's words carry. */
    const foldedPicks = $derived(picked.filter((value) => folded.has(value)).length);

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

    /** Picks every slice of a category, or takes them all out when all are picked. */
    function pickCategory(group: SliceGroup): void {
        const values = group.slices.map((one) => one.value);
        const all = values.every((value) => picked.includes(value));
        onslices(
            all
                ? picked.filter((value) => !values.includes(value))
                : [...picked, ...values.filter((value) => !picked.includes(value))]
        );
    }

    /** The hue of a category's label, as an inline custom property, and none for "other". */
    function labelStyle(group: SliceGroup): string | undefined {
        return group.tone === '' ? undefined : `--tone: var(--c-${group.tone}-txt)`;
    }
</script>

{#snippet placed(place: Place)}
    {#if place.slice === undefined}
        <span class="category" style={labelStyle(place.group)}>
            <RowButton onclick={() => pickCategory(place.group)}>
                <span class="words">{place.group.label}</span>
            </RowButton>
        </span>
    {:else}
        {@const slice = place.slice}
        <Chip
            label={t('board.slice_words', slice.label, counts.get(slice.value) ?? 0)}
            title={slice.tip}
            tone={slice.tone === '' ? undefined : slice.tone}
            outlined
            pressed={picked.includes(slice.value)}
            onclick={() => ontoggle('slice', slice.value)}
        />
    {/if}
{/snippet}

<div class="line" role="toolbar" aria-label={t('board.slices')} bind:this={line}>
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
                onpick={ontoggle}
            />
        </span>
    {/if}
    <span class="end" bind:this={end}>
        <span class="count">{shownWords(shown, total)}</span>
        {#if picking}
            <ToolButton small glyph="clear_all" label={t('board.filter_clear')} onclick={onclear} />
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
       to pick or take out every slice of it. */
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

    /* How many projects are shown, and Clear all, at the line's right end. */
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
