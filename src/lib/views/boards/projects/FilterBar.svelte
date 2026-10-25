<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. The bar under the project
    // board's header: the search, the one Filter menu, the stale and deadline quick filters and,
    // where the board draws it, Mine only; under them, while one or more facet values are in force,
    // one chip per value with its remove control, and Clear all, which takes every facet value out
    // and leaves the search and the quick filters as they are.
    //
    // It holds no state and works nothing out: the board's saved state, the menu's groups and the
    // chips are the board's, computed by the pure functions of state/boards/board/, and every press
    // is handed back through `onwrite` or `ontoggle`, which write the board's instance state.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        filterLabel,
        type BoardState,
        type FilterGroup,
        type InForceChip
    } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The board's saved state, read for the search, the quick filters and the facet values. */
        held: BoardState;
        /** The search box's placeholder, the board's own or the empty string for the default. */
        placeholder: string;
        /** The Filter menu's groups, one per facet with its counts. */
        groups: FilterGroup[];
        /** The facet values in force, one chip each, in the order they are drawn. */
        chips: InForceChip[];
        /** Whether the board draws Mine only, which it does only where it changes the board. */
        mine: boolean;
        /** Writes part of the board's state. */
        onwrite: (next: Partial<BoardState>) => void;
        /** Adds or takes out one value of one facet, as a pick in the menu does. */
        ontoggle: (facet: string, value: string) => void;
    };

    let { held, placeholder, groups, chips, mine, onwrite, ontoggle }: Props = $props();
</script>

<Toolbar label={t('board.filters')}>
    <Search
        fill
        value={held.search}
        placeholder={placeholder === '' ? t('board.search_default') : placeholder}
        oninput={(value: string) => onwrite({ search: value })}
    />
    <Menu
        label={filterLabel(held.filters)}
        items={[]}
        {groups}
        onpick={(value: string, _event: MouseEvent, facet?: string) => {
            if (facet !== undefined) ontoggle(facet, value);
        }}
        placement="down"
    />
    <Chip
        label={t('board.quick_stale')}
        title={t('board.quick_stale_tip')}
        glyph={t('board.stale_glyph')}
        pressed={held.stale}
        onclick={() => onwrite({ stale: !held.stale })}
    />
    <Chip
        label={t('board.quick_deadline')}
        title={t('board.quick_deadline_tip')}
        glyph={t('project.card.deadline_glyph')}
        pressed={held.dated}
        onclick={() => onwrite({ dated: !held.dated })}
    />
    {#if mine}
        <Chip
            label={t('roles.mine')}
            title={t('roles.mine_tip')}
            pressed={held.mine}
            onclick={() => onwrite({ mine: !held.mine })}
        />
    {/if}
</Toolbar>
{#if chips.length > 0}
    <div class="chips">
        {#each chips as chip (`${chip.facet}\n${chip.value}`)}
            <Chip
                label={chip.label}
                onremove={() => ontoggle(chip.facet, chip.value)}
                removeLabel={chip.remove}
            />
        {/each}
        <ToolButton
            small
            glyph="clear_all"
            label={t('board.filter_clear')}
            onclick={() => onwrite({ filters: {} })}
        />
    </div>
{/if}

<style>
    /* The values in force, on a line of their own under the bar's controls: the bar is a wrapping
       row, and a box as wide as the bar starts the next line of it. The chips wrap within it when
       they do not fit on one line. */
    .chips {
        display: flex;
        flex: 1 0 100%;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }
</style>
