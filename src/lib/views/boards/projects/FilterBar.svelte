<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. Line 1 of a project board's
    // bar: the search; the stale toggle; the deadline toggle with how many of the board's projects
    // carry a deadline ("deadline 3"); Mine only, drawn while a person is marked as the user and
    // drawn disabled, its tip saying every project here is the user's, where it would change
    // nothing; then one group button per facet that has values, Form, Situation, Role, Year,
    // Domain, Venue and Hub (while the workspace has more than one hub), each reading its picks
    // ("Form: journal article +1") and opening its values (PickMenu.svelte); then More, which holds
    // the other facets as headed sections. The Situation button carries a red badge while projects
    // are blocked, and the Venue button an amber mark while a venue reaches the warning, its tip
    // naming the venue.
    //
    // The line is one line at any pane width: the group buttons that do not fit beside the
    // controls before them go into More, last in, first out, the search keeping `SEARCH_MIN`;
    // More then holds their sections first, and carries the badge and the mark of a group it
    // holds. The folding is ui/frame/toolbar/FoldRun.svelte's, which line 2 (SliceLine.svelte)
    // folds by too; a render with no layout draws every group button.
    //
    // It holds no state of the board and works nothing out: the board's saved state, the groups
    // and the counts are the board's, computed by the pure functions of state/boards/board/, and
    // every press is handed back through `onwrite` or `ontoggle`, which write the board's instance
    // state.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import FoldRun from '$lib/ui/frame/toolbar/FoldRun.svelte';
    import PickMenu from './PickMenu.svelte';
    import {
        LINE_FACETS,
        blockedBadge,
        deadlineWords,
        groupWords,
        moreWords,
        venueWarning,
        type BoardState,
        type BoardStats,
        type FilterGroup
    } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The board's saved state, read for the search and the toggles. */
        held: BoardState;
        /** The search box's placeholder, the board's own or the empty string for the default. */
        placeholder: string;
        /** Every group of the bar, one per facet with its counts, in the order of the facets. */
        groups: FilterGroup[];
        /** The counts the controls carry, over the board's projects before any filter. */
        stats: BoardStats;
        /** Whether a person is marked as the user, which draws Mine only. */
        named: boolean;
        /** Whether Mine only changes the board, which is where it is pressable and applied. */
        mine: boolean;
        /** Writes part of the board's state. */
        onwrite: (next: Partial<BoardState>) => void;
        /** Adds or takes out one value of one facet, as a pick in a group's list does. */
        ontoggle: (facet: string, value: string) => void;
    };

    let { held, placeholder, groups, stats, named, mine, onwrite, ontoggle }: Props = $props();

    /** The narrowest the search box is drawn while group buttons are folded into More. */
    const SEARCH_MIN = 120;

    /** How wide More is taken to be before it is first drawn. */
    const MORE_GUESS = 64;

    const lineGroups = $derived(groups.filter((one) => LINE_FACETS.includes(one.id)));
    const ownGroups = $derived(groups.filter((one) => !LINE_FACETS.includes(one.id)));

    /** How many group buttons line 1 draws, and null while it draws all of them. */
    let shown: number | null = $state(null);

    let line = $state<HTMLElement | null>(null);
    let toggles = $state<HTMLElement | null>(null);
    let moreBox = $state<HTMLElement | null>(null);
    /** The width More was last drawn at. */
    let moreWidth = MORE_GUESS;

    const folded = $derived(shown === null ? [] : lineGroups.slice(shown));
    const moreGroups = $derived([...folded, ...ownGroups]);

    /**
     * The room the group buttons have: the line less the search at its narrowest, the toggles and,
     * where More holds facets of its own, More, each with a gap before the next; More is the
     * opener only while it holds nothing else.
     */
    function room(gap: number): { room: number; opener: number } | null {
        if (line === null || toggles === null) return null;
        if (moreBox !== null) moreWidth = moreBox.getBoundingClientRect().width;
        const always = ownGroups.length > 0;
        return {
            room:
                line.getBoundingClientRect().width -
                SEARCH_MIN -
                toggles.getBoundingClientRect().width -
                gap * (always ? 3 : 2) -
                (always ? moreWidth : 0),
            opener: always ? 0 : moreWidth
        };
    }
</script>

{#snippet button(group: FilterGroup)}
    <PickMenu
        label={groupWords(group)}
        groups={[group]}
        onpick={ontoggle}
        badge={group.id === 'status' ? blockedBadge(stats) : ''}
        warning={group.id === 'venue' ? venueWarning(stats) : ''}
    />
{/snippet}

<div class="line" role="toolbar" aria-label={t('board.filters')} bind:this={line}>
    <span class="search">
        <Search
            fill
            value={held.search}
            placeholder={placeholder === '' ? t('board.search_default') : placeholder}
            oninput={(value: string) => onwrite({ search: value })}
        />
    </span>
    <span class="toggles" bind:this={toggles}>
        <Chip
            label={t('board.quick_stale')}
            title={t('board.quick_stale_tip')}
            glyph={t('board.stale_glyph')}
            pressed={held.stale}
            onclick={() => onwrite({ stale: !held.stale })}
        />
        <Chip
            label={deadlineWords(stats)}
            title={t('board.quick_deadline_tip')}
            glyph={t('project.card.deadline_glyph')}
            pressed={held.dated}
            onclick={() => onwrite({ dated: !held.dated })}
        />
        {#if named}
            <Chip
                label={t('roles.mine')}
                title={mine ? t('roles.mine_tip') : t('board.mine_all')}
                pressed={held.mine}
                disabled={!mine}
                onclick={() => onwrite({ mine: !held.mine })}
            />
        {/if}
    </span>
    <FoldRun
        items={lineGroups}
        key={(group: FilterGroup) => group.id}
        item={button}
        box={line}
        {room}
        bind:shown
    />
    {#if moreGroups.length > 0}
        <span class="more" bind:this={moreBox}>
            <PickMenu
                label={moreWords(moreGroups)}
                groups={moreGroups}
                headed
                onpick={ontoggle}
                badge={folded.some((one) => one.id === 'status') ? blockedBadge(stats) : ''}
                warning={folded.some((one) => one.id === 'venue') ? venueWarning(stats) : ''}
            />
        </span>
    {/if}
</div>

<style>
    /* One line that never wraps: the search takes what the controls leave, down to its minimum,
       and the group buttons past the line's room are folded into More. Until the first measure
       the line clips what passes its width rather than scrolling the bar sideways. */
    .line {
        display: flex;
        flex: 1 0 100%;
        align-items: center;
        gap: 6px;
        min-width: 0;
        overflow: hidden;
    }

    .search {
        display: flex;
        flex: 1 1 0;
        min-width: 120px;
    }

    .toggles {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 6px;
    }

    .more {
        display: inline-flex;
        flex: none;
    }
</style>
