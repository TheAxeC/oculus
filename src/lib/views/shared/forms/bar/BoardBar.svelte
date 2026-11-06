<script lang="ts">
    // Layer 3, shared view partial of the project boards (views/boards/projects/Projects.svelte)
    // and the Present view's bar (views/academic/present/Bar.svelte). The bar of a project board,
    // its two lines in the board's texts. Line 1 (FilterBar.svelte): the search, the stale,
    // deadline and waiting toggles, each carrying its count over the projects before any filter,
    // Mine only and the Role group while a person is marked as the user, the groups of
    // `LINE_FACETS` on the line and the rest in More, the Hub group while the workspace has more
    // than one hub, and the Situation button's blocked badge and the Venue button's amber mark.
    // Line 2 (SliceLine.svelte): the slices by category, how many projects are shown, and Clear
    // all.
    //
    // Both callers draw the same component from the same answer, state/boards/board/filter-menu.ts
    // `boardFilter`, so the Present view's filter is the board's in every control, count and text.
    // It holds no state: each press hands the fields it changes to `write`, which saves them in the
    // caller's instance state.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import FilterBar from './FilterBar.svelte';
    import SliceLine from './SliceLine.svelte';
    import {
        LINE_FACETS,
        blockedBadge,
        deadlineWords,
        shownWords,
        venueWarning,
        waitingWords,
        withPick,
        type BoardFilter,
        type BoardState,
        type BoardStats
    } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The bar's answer: the saved state as read, the groups, the slices and what is shown. */
        filter: BoardFilter;
        /** The counts on the controls, over the same projects before any filter. */
        stats: BoardStats;
        /** The search box's placeholder, already translated. */
        placeholder: string;
        /** Saves the fields a press changes in the caller's instance state. */
        write: (next: Partial<BoardState>) => void;
    };

    let { filter, stats, placeholder, write }: Props = $props();

    const held = $derived(filter.held);
</script>

{#snippet toggles()}
    <Chip
        label={t('board.quick_stale')}
        title={t('board.quick_stale_tip')}
        glyph={t('board.stale_glyph')}
        pressed={held.stale}
        onclick={() => write({ stale: !held.stale })}
    />
    <Chip
        label={deadlineWords(stats)}
        title={t('board.quick_deadline_tip')}
        glyph={t('project.card.deadline_glyph')}
        pressed={held.dated}
        onclick={() => write({ dated: !held.dated })}
    />
    <Chip
        label={waitingWords(stats)}
        title={t('board.quick_waiting_tip')}
        glyph={t('project.card.waiting_glyph')}
        pressed={held.waiting}
        onclick={() => write({ waiting: !held.waiting })}
    />
{/snippet}

<FilterBar
    label={t('board.filters')}
    search={held.search}
    {placeholder}
    onsearch={(value: string) => write({ search: value })}
    {toggles}
    named={filter.named}
    mine={filter.mine}
    pressed={held.mine}
    onmine={() => write({ mine: !held.mine })}
    groups={filter.groups}
    line={LINE_FACETS}
    badges={{
        status: { badge: blockedBadge(stats) },
        venue: { warning: venueWarning(stats) }
    }}
    ontoggle={(facet: string, value: string) =>
        write({ filters: withPick(held.filters, facet, value) })}
/>
<SliceLine
    label={t('board.slices')}
    groups={filter.slices}
    facet="slice"
    counted={filter.counted}
    filters={held.filters}
    shown={filter.shown.length}
    total={stats.projects}
    words={shownWords}
    onfilters={(next: Record<string, string[]>) => write({ filters: next })}
/>
