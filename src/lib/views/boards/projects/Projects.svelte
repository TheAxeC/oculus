<script module lang="ts">
    // Layer 3, view registration. One board component owns the six portfolio board registrations,
    // the Projects page's group. A board's tab counts its cards and, in the row's tone, its cards
    // in each row of `categories` in config/catalogs/vocab.yml that holds one; the rail, where the
    // board's row of `counts` says `rail: true`, gets the count of its cards in the rows carrying
    // `rail: true`, in the tone of the first such row, and 0 when none is in such a row.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    const boardRegistration = (id: string, order: number): ViewRegistration => ({
        id,
        label: `views.${id}`,
        glyph: `views.${id}_glyph`,
        group: 'projects',
        order,
        badge: (client) => client.railBadges.boardBadge(id),
        badgeTitle: (client) => client.railBadges.boardBadgeTitle(id),
        badgeCells: (client) => client.railBadges.boardCells(id),
        countPart: (client) => client.railBadges.boardRail(id)
    });

    export const registration: ViewRegistration[] = [
        boardRegistration('projects', 1),
        boardRegistration('supervision', 2),
        boardRegistration('coauthor', 3),
        boardRegistration('archive', 4),
        boardRegistration('personal', 5),
        boardRegistration('software', 6)
    ];
</script>

<script lang="ts">
    // Layer 3, view. The project board: cards or a table, a search, quick filters, one filter menu
    // headed by every way the board can be split, the stage first, the facet values in force as
    // removable chips, a stats strip and a short or full title. It is registered six times, as
    // `projects`, `supervision`, `coauthor`, `archive`, `personal` and `software`, and reads which
    // board it is from the instance it was mounted as, so the six board tabs are one component
    // here. A board holds every project its keys in `boards:` meet, so one project may be on
    // several. The cards are laid out in sections, one per row of `categories` holding a card, in
    // the list's order, and an "other" section last for the cards in no row, or as one flat grid
    // where the board's `cards:` says `grid`. The header holds New project, Expand all and
    // Collapse, then Cards and List, the one in force pressed, and Full titles, pressed while the
    // board draws full titles. A board offers New project, written with its tier and its `role:`
    // keys, only when its rule takes the project that write makes
    // (state/boards/board/new-project.ts), so Archive, which takes done work, offers none with the
    // shipped boards. While the workspace names a `self`, the board draws the Role facet, and a
    // card whose lead is the user carries the Lead badge; the Mine only toggle, on by default, is
    // drawn and applied only where one of the board's projects is one it does not keep. Without a
    // `self` it draws none of them.
    //
    // It joins nothing and counts nothing itself: the projects come from the board selector already
    // joined, and the facets, the filter menu's groups, the chips, the filters, the counts and the
    // sentence cut are the pure functions of state/board; each facet's counts are taken over the
    // projects the search, the quick filters and the other facets leave. The bar is
    // views/boards/projects/FilterBar.svelte, the strip views/boards/projects/Stats.svelte and the
    // new-project form views/boards/projects/NewIdea.svelte, which is the partials rule of the
    // boundary table: a view too large for one file is split into its own folder. The card is
    // views/shared/card/project/ProjectCard.svelte, since views/boards/project/Project.svelte draws
    // the same one. A web address written in a cell of the table, the next line's among them, is a
    // link (ui/display/text/LinkedText.svelte).

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import { type Column, cellText } from '$lib/ui/display/table/table-rows';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Card from '../../shared/card/project/ProjectCard.svelte';
    import FilterBar from './FilterBar.svelte';
    import NewIdea from './NewIdea.svelte';
    import Stats from './Stats.svelte';
    import {
        applyFilters,
        cardSections,
        facets,
        filterChips,
        filterGroups,
        firstSentence,
        offersMine,
        parseBoardState,
        type BoardItem,
        type BoardMode,
        type BoardState,
        type QuickFilters
    } from '$lib/state/boards/board';
    import { projectLane } from '$lib/state/boards/focus';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import { lookup, t } from '$lib/state/shared/words/text';
    import {
        chipGlyphName,
        chipLabel,
        statusMarkTone,
        projectStatusWords,
        toneOf,
        vocabOf
    } from '$lib/state/shared/words/tones';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { board, boardPreset, boardStats, offersNewProject, selfNamed, staleLag },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How much of `next` a list row shows. */
    const ROW_NEXT = 110;

    const preset = $derived(boardPreset(instance.view));
    const cursor = $derived(cardCursor(instance.state));
    const items = $derived(board(preset));
    /** Whether the workspace names a `self`, which the Mine only toggle and the Role facet need. */
    const named = $derived(selfNamed());
    /** Whether the board draws Mine only, which it applies only while it draws it. */
    const mineShown = $derived(offersMine(items, named));
    /** The facets with their counts over every project, which the saved state is read against. */
    const offered = $derived(facets(items, preset, named));
    const held = $derived(
        parseBoardState(
            instanceState(instance.id),
            preset.labels,
            offered,
            preset.categories.map((one) => one.key)
        )
    );
    const lag = $derived(staleLag());
    const quick: QuickFilters = $derived({
        stale: held.stale,
        dated: held.dated,
        mine: mineShown && held.mine,
        staleLag: lag
    });
    /** The facets with each value counted over the projects the other filters leave. */
    const counted = $derived(
        facets(items, preset, named, { filters: held.filters, search: held.search, quick })
    );
    const groups = $derived(filterGroups(counted, held.filters, preset));
    const chips = $derived(filterChips(counted, held.filters, preset));
    const shown = $derived(applyFilters(items, held.filters, held.search, quick));
    const rows = $derived(shown.map(row));
    const sections = $derived(cardSections(shown, preset));
    const strip = $derived(boardStats(items));

    /** What the last write on this board answered, shown under the toolbar until the next one. */
    let said = $state('');

    /** True while the new-project form is open under the toolbar. */
    let adding = $state(false);
    /** Whether the board takes the project its New project writes, so it draws the button. */
    const offersNew = $derived(offersNewProject(preset));

    /**
     * Today, for the deadline badge. It is read when the board is opened and not again, so a page
     * left open across midnight counts the day it was opened on until it is reloaded.
     */
    const now = Date.now();

    function write(next: Partial<BoardState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }, ['expanded', 'more']));
    }

    /** Draw the cards or the table; a press on the mode in force changes nothing. */
    function setMode(mode: BoardMode): void {
        if (held.mode !== mode) write({ mode });
    }

    /** Add or remove one value of one facet, which is what a pick in the filter menu means. */
    function toggleFilter(facet: string, value: string): void {
        const selected = held.filters[facet] ?? [];
        const next = selected.includes(value)
            ? selected.filter((one) => one !== value)
            : [...selected, value];
        const filters = { ...held.filters };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (next.length === 0) delete filters[facet];
        else filters[facet] = next;
        write({ filters });
    }

    function toggleCard(id: string): void {
        const open = held.expanded.includes(id);
        write({
            expanded: open ? held.expanded.filter((one) => one !== id) : [...held.expanded, id]
        });
    }

    /** Draw one card's long description whole, or cut it to its clamp again. */
    function toggleMore(id: string): void {
        const open = held.more.includes(id);
        write({ more: open ? held.more.filter((one) => one !== id) : [...held.more, id] });
    }

    /** Open or close every card of the board at once, which is what the two bulk controls do. */
    function bulk(expand: boolean): void {
        write({ expanded: expand ? shown.map((item) => item.id) : [] });
    }

    /** The board's own name, the key the registry names it by. */
    function title(): string {
        return lookup(`views.${preset.id}`);
    }

    /** The label a card and a row carry: the short handle in short mode, else the full title. */
    function label(item: BoardItem): string {
        const short = item.project.short;
        if (held.labels === 'full' || short === undefined || short === '') {
            return item.project.title;
        }
        return short;
    }

    /**
     * What the project's own tab is called in the strip: the short handle whenever there is one.
     */
    function tabLabel(item: BoardItem): string {
        const short = item.project.short;
        return short === undefined || short === '' ? item.project.title : short;
    }

    /**
     * The status keys one row's marks are drawn for. They ride beside the row's sortable words
     * rather than in them, since a mark is a component and a cell's value is text; each is drawn
     * in its own hue with its words as the title, as a lane draws it.
     */
    function statusMarks(row: Record<string, unknown>): string[] {
        const marks = row.statusMarks;
        if (!Array.isArray(marks)) return [];
        return marks.filter((chip): chip is string => typeof chip === 'string');
    }

    /**
     * One row of the list mode. Every column key of the boards' columns is filled here; the Authors
     * cell is the team line, the names of the lead, the collaborators and the supervisors without
     * the user.
     */
    function row(item: BoardItem): Record<string, unknown> {
        const next = item.project.next;
        const hub = rootOf(item.project);
        const words = projectStatusWords(
            item.project.stage,
            item.project.form,
            item.project.chips,
            hub
        );
        return {
            id: item.id,
            title: label(item),
            authors: item.teamLine,
            venue: item.venue?.short ?? '',
            hub,
            status: words.map((word) => chipLabel(word, hub)).join(' '),
            statusMarks: words.filter((word) => chipGlyphName(word, hub) !== ''),
            focus: projectLane(item.project, vocabOf)?.label ?? '',
            next: next === undefined ? '' : firstSentence(next, ROW_NEXT),
            domain: item.domain?.label ?? '',
            pillar: item.pillars.map((tag) => tag.label).join(' | '),
            funding: item.funding.map((tag) => tag.label).join(' | ')
        };
    }
</script>

{#snippet statusCell(row: Record<string, unknown>, column: Column)}
    {#if column.key === 'status'}
        {#each statusMarks(row) as chip (chip)}
            <span
                class="mark"
                title={chipLabel(chip, cellText(row.hub))}
                style={`--mark: var(--c-${statusMarkTone(chip, cellText(row.hub))}-txt)`}
            >
                <Glyph name={chipGlyphName(chip, cellText(row.hub))} />
            </span>
        {/each}
    {:else}
        <LinkedText text={cellText(row[column.key])} />
    {/if}
{/snippet}

{#snippet card(item: BoardItem)}
    <Card
        {item}
        {now}
        cursor={cursor === item.id}
        open={held.expanded.includes(item.id)}
        more={held.more.includes(item.id)}
        onmore={() => toggleMore(item.id)}
        label={label(item)}
        tab={tabLabel(item)}
        staleLag={lag}
        ontoggle={() => toggleCard(item.id)}
        onsaid={(answer: string) => (said = answer)}
    />
{/snippet}

{#snippet tools()}
    <Toolbar label={t('board.toolbar')} overflow>
        {#if offersNew}
            <ToolButton
                bare
                glyph="add"
                label={t('board.new_idea')}
                title={t('board.new_idea_tip')}
                active={adding}
                pressed={adding}
                onclick={() => (adding = !adding)}
            />
        {/if}
        <ToolButton
            bare
            label={t('board.expand_all')}
            glyph={t('project.card.expand_glyph')}
            onclick={() => bulk(true)}
        />
        <ToolButton
            bare
            label={t('board.collapse')}
            glyph={t('project.card.collapse_glyph')}
            onclick={() => bulk(false)}
        />
        <ToolButton
            bare
            glyph="cards"
            label={t('board.view_cards')}
            pressed={held.mode === 'cards'}
            onclick={() => setMode('cards')}
        />
        <ToolButton
            bare
            glyph="list"
            label={t('board.view_list')}
            pressed={held.mode === 'list'}
            onclick={() => setMode('list')}
        />
        <ToolButton
            bare
            glyph="full_titles"
            label={t('board.full_titles')}
            pressed={held.labels === 'full'}
            onclick={() => write({ labels: held.labels === 'full' ? 'short' : 'full' })}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <FilterBar
        {held}
        placeholder={preset.search}
        {groups}
        {chips}
        mine={mineShown}
        onwrite={write}
        ontoggle={toggleFilter}
    />
{/snippet}

<Pane title={title()} toolbar={tools} {bar}>
    <div class="board" data-instance={instance.id} data-board={preset.id}>
        {#if adding && offersNew}
            <NewIdea
                tier={preset.rule.tiers?.at(0)}
                roles={preset.rule.roles}
                takes={(hub: string) => offersNewProject(preset, hub)}
                onclose={() => (adding = false)}
                onsaid={(answer: string) => (said = answer)}
            />
        {/if}
        <Stats stats={strip} shown={shown.length} />
        {#if said !== ''}
            <Surface>
                <p class="said">{said}</p>
            </Surface>
        {/if}
        {#if shown.length === 0}
            <Empty message={t('board.empty')} glyph={t('board.empty_glyph')} />
        {:else if held.mode === 'list'}
            <Surface>
                <div class="table">
                    <Table columns={preset.columns} {rows} rowKey="id" sortable cell={statusCell} />
                </div>
            </Surface>
        {:else if preset.cards === 'grid'}
            <div class="cards">
                {#each shown as item (item.id)}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render card(item)}
                {/each}
            </div>
        {:else}
            {#each sections as section (section.key)}
                <section class="section" data-category={section.key}>
                    <h3
                        class="heading"
                        style={section.color === ''
                            ? undefined
                            : `--section: var(--c-${toneOf(section.color)}-txt)`}
                    >
                        {section.key === '' ? t('board.section_other') : section.label}
                        <span class="count">{section.items.length}</span>
                    </h3>
                    <div class="cards">
                        {#each section.items as item (item.id)}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render card(item)}
                        {/each}
                    </div>
                </section>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    /* A status mark is a line icon, so it is drawn in the hue of its own status. */
    .mark {
        color: var(--mark, var(--muted-txt));
    }

    /* A table wider than the pane scrolls inside its own box and not the pane. */
    .table {
        min-width: 0;
        overflow-x: auto;
    }

    /* A section of the card view: the cards of one category under a heading in the category's
       colour, which carries the count. */
    .section + .section {
        margin-top: 14px;
    }

    .heading {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin: 0 0 8px;
        font-size: var(--fs-md);
        color: var(--section, var(--muted-txt));
    }

    .count {
        font-size: var(--fs-sm);
    }

    /* The cards of one row stretch to the row's height, in file order, so no empty cell is left
       under a short card and nothing is reordered to fill one. */
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        align-items: stretch;
    }

    .said {
        margin: 0 0 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: the folder is the only monospace line in a card by default, so under the
       rice themes the whole card follows it rather than mixing two faces. */
    :global(body.rice:where(:not(.rice-sans))) .board {
        font-family: var(--font-mono);
    }
</style>
