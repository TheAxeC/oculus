<script module lang="ts">
    // Layer 3, view registration. The Personal board is the Projects page's fourth tab; its badge
    // is the number of side projects the snapshot holds.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'personal',
        label: 'views.personal',
        glyph: 'views.personal_glyph',
        group: 'projects',
        order: 4,
        badge: (client) => client.railBadges.personalBadge()
    };
</script>

<script lang="ts">
    // Layer 3, view. The Personal board: one card per side project, whether it is a folder of the
    // hub's `side-projects/` or a repository that is a Files root and carries a
    // `.oculus/project.yml`, as cards or as a table. The card is the project card of the research
    // boards (views/shared/card/ProjectCard.svelte), drawn from the side project's record: the
    // title opens the project view, the controls are the research card's (Pin, Copy context, Ask,
    // Finder, Files, Workbench, expand, subtasks, Present when the folder has a deck, Edit
    // Manifest) without the deposit, and the status is drawn in the hue of `side_project_status`.
    // The switch between cards and the table, the search, the status toggles and the open cards are
    // the view instance's state.
    //
    // It joins nothing and counts nothing itself: the cards, their order, the search, the toggles
    // and the board item of each card are the pure functions of state/boards/board/personal.ts.
    // Every word a manifest holds is drawn as text.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import type { Column } from '$lib/ui/display/table/table-rows';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ModeSwitch from '$lib/views/shared/card/ModeSwitch.svelte';
    import ProjectCard from '$lib/views/shared/card/ProjectCard.svelte';
    import {
        filterCards,
        parsePersonalState,
        toggleExpanded,
        toggleMore,
        toggleStatus,
        type PersonalState,
        type SideCard
    } from '$lib/state/boards/board/personal';
    import { firstSentence, type BoardMode } from '$lib/state/boards/board';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { sideCards, sideItem, sideStatuses, staleLag },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How much of `next` a table row shows. */
    const ROW_NEXT = 110;

    const held = $derived(parsePersonalState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const cards = $derived(sideCards());
    const statuses = $derived(sideStatuses());
    const shown = $derived(filterCards(cards, held));
    const lag = $derived(staleLag());
    const rows = $derived(shown.map(row));

    /** What the last write on this board answered, shown under the toolbar until the next one. */
    let said = $state('');

    /**
     * Today, for the deadline badge. It is read once, when the board is opened, so a page left open
     * across midnight counts the day it was opened on until it is reloaded.
     */
    const now = Date.now();

    const columns: Column[] = [
        { key: 'title', label: t('personal.col_title') },
        { key: 'status', label: t('personal.col_status') },
        { key: 'next', label: t('personal.col_next') },
        { key: 'deadline', label: t('personal.col_deadline') }
    ];

    function write(next: PersonalState): void {
        setInstanceState(instance.id, next);
    }

    function setMode(mode: BoardMode): void {
        write({ ...held, mode });
    }

    /** One row of the table: the card's title, status, what comes next and its deadline. */
    function row(card: SideCard): Record<string, unknown> {
        return {
            id: card.project.id,
            title: card.project.title,
            status: card.status.label,
            next: firstSentence(card.project.next, ROW_NEXT),
            deadline: card.project.deadline ?? ''
        };
    }
</script>

{#snippet bar()}
    <Toolbar label={t('personal.toolbar')}>
        <Search
            fill
            value={held.search}
            placeholder={t('personal.search')}
            oninput={(value: string) => write({ ...held, search: value })}
        />
        {#each statuses as item (item.key)}
            <Chip
                label={item.label}
                title={t('personal.status_toggle_tip', item.label)}
                glyph={item.glyph}
                tone={item.tone}
                pressed={!held.hidden.includes(item.key)}
                onclick={() => write(toggleStatus(held, item.key))}
            />
        {/each}
        <ModeSwitch mode={held.mode} onchange={setMode} />
    </Toolbar>
{/snippet}

<Pane title={t('views.personal')} {bar}>
    <div class="board" data-instance={instance.id} data-board="personal">
        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}
        {#if shown.length === 0}
            {#if cards.length === 0}
                <Empty message={t('personal.empty')} glyph={t('personal.empty_glyph')} />
            {:else}
                <Empty message={t('personal.none_match')} glyph={t('personal.none_match_glyph')} />
            {/if}
        {:else if held.mode === 'list'}
            <div class="table">
                <Table {columns} {rows} rowKey="id" sortable />
            </div>
        {:else}
            <div class="cards">
                {#each shown as card (card.project.id)}
                    {@const item = sideItem(card)}
                    {#if item !== null}
                        <ProjectCard
                            {item}
                            {now}
                            cursor={cursor === item.id}
                            open={held.expanded.includes(item.id)}
                            more={held.more.includes(item.id)}
                            onmore={() => write(toggleMore(held, item.id))}
                            label={card.project.title}
                            tab={card.project.title}
                            staleLag={lag}
                            ontoggle={() => write(toggleExpanded(held, item.id))}
                            onsaid={(answer: string) => (said = answer)}
                        />
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
</Pane>

<style>
    /* The cards of one row stretch to the row's height, in the board's order. */
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        align-items: stretch;
    }

    /* A table wider than the pane scrolls inside its own box. */
    .table {
        min-width: 0;
        overflow-x: auto;
    }

    .said {
        margin: 0 0 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
