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
    // Layer 3, view. The project board: cards or a list, under a bar of two lines and a header. It
    // is registered six times, as `projects`, `supervision`, `coauthor`, `archive`, `personal` and
    // `software`, and reads which board it is from the instance it was mounted as, so the six board
    // tabs are one component here. A board holds every project its keys in `boards:` meet, so one
    // project may be on several.
    //
    // The header holds New project, Cards and List, the one in force pressed, Full titles, pressed
    // while the board draws full titles, and, in list mode, Columns, a menu that shows or hides
    // each cell of the list, Project always shown. A board offers New project, written with its
    // tier and its `role:` keys, only when its rule takes the project that write makes
    // (state/boards/board/new-project.ts), so Archive, which takes done work, offers none with the
    // shipped boards. Line 1 of the bar is the search, the toggles and the group buttons
    // (views/boards/projects/FilterBar.svelte); line 2 the slices, each the projects of one
    // category at one stage or form, how many projects are shown, and Clear all
    // (views/boards/projects/SliceLine.svelte). While the workspace names a `self`, the bar draws
    // the Role group and Mine only, and a card whose lead is the user carries the Lead badge;
    // Mine only, on by default, is applied only where one of the board's projects is one it does
    // not keep, and drawn disabled elsewhere. Without a `self` it draws none of them. While the
    // workspace has more than one hub, line 1 draws the Hub group after Venue, a project's hub
    // being its `root`; with one hub it draws none, and a hub picked earlier narrows nothing.
    //
    // Every card is drawn closed; its title, its Open project page action and Enter on the
    // keyboard cursor open the project page beside the board (ProjectCard.svelte).
    //
    // The cards and the list are laid out in sections, one per row of `categories` holding a
    // project, in the list's order, and an "other" section last for the projects in no row, each
    // headed by the category's label in its colour with its count
    // (views/shared/card/FoldHead.svelte); the heading stays at the top of the pane while its
    // section scrolls under it, and a press on its fold control folds the section, which the board
    // remembers. A board whose `cards:` says `grid` draws its cards and its list as one section
    // with no heading. The list draws one table per section
    // (views/boards/projects/BoardList.svelte).
    //
    // It joins nothing and counts nothing itself: the projects come from the board selector already
    // joined, and the facets, the slices, the groups, the filters, the counts on the controls and
    // the columns are the pure functions of state/boards/board/; each facet's counts are taken over
    // the projects the search, the toggles and the other facets leave, and the counts on the
    // controls over the board's projects before any filter. The new-project form is
    // views/boards/projects/NewIdea.svelte, which is the partials rule of the boundary table: a
    // view too large for one file is split into its own folder. The card is
    // views/shared/card/project/ProjectCard.svelte, since views/boards/project/Project.svelte draws
    // the same one.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Card from '../../shared/card/project/ProjectCard.svelte';
    import FoldHead from '../../shared/card/FoldHead.svelte';
    import SaidBody from '../../shared/writes/SaidBody.svelte';
    import BoardList from './BoardList.svelte';
    import FilterBar from './FilterBar.svelte';
    import NewIdea from './NewIdea.svelte';
    import SliceLine from './SliceLine.svelte';
    import {
        appliedFilters,
        applyFilters,
        cardSections,
        facets,
        filterGroups,
        listCells,
        offersMine,
        parseBoardState,
        pickCell,
        sliceGroups,
        type BoardItem,
        type BoardMode,
        type BoardState,
        type QuickFilters
    } from '$lib/state/boards/board';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import { hubList } from '$lib/state/shared/page/hubs';
    import { lookup, t } from '$lib/state/shared/words/text';
    import { toneOf } from '$lib/state/shared/words/tones';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { primary, roots },
        selectors: { board, boardPreset, boardStats, offersNewProject, selfNamed, staleLag },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const preset = $derived(boardPreset(instance.view));
    const cursor = $derived(cardCursor(instance.state));
    const items = $derived(board(preset));
    /** Whether the workspace names a `self`, which Mine only and the Role facet need. */
    const named = $derived(selfNamed());
    /** Whether Mine only changes the board, which is where it is applied. */
    const mineApplies = $derived(offersMine(items, named));
    /** The facets with their counts over every project, which the saved state is read against. */
    const offered = $derived(facets(items, preset, named));
    /** The board's slices by category, read from its projects before any filter. */
    const slices = $derived(sliceGroups(items, preset));
    const held = $derived(
        parseBoardState(
            instanceState(instance.id),
            preset.labels,
            offered,
            slices.flatMap((group) => group.slices.map((one) => one.value))
        )
    );
    const lag = $derived(staleLag());
    const quick: QuickFilters = $derived({
        stale: held.stale,
        dated: held.dated,
        mine: mineApplies && held.mine,
        staleLag: lag
    });
    /** The hubs the Hub group lists, none while the workspace has one hub. */
    const hubs = $derived(hubList(roots(), primary()));
    /**
     * The facet values that narrow the board, which leave out a role while no `self` is named and
     * a hub while the Hub group is not drawn.
     */
    const filters = $derived(appliedFilters(held.filters, named, hubs));
    /** The facets with each value counted over the projects the other filters leave. */
    const counted = $derived(
        facets(items, preset, named, { filters, search: held.search, quick }, hubs)
    );
    const groups = $derived(filterGroups(counted, held.filters, preset, named, hubs));
    const shown = $derived(applyFilters(items, filters, held.search, quick));
    const grid = $derived(preset.cards === 'grid');
    const sections = $derived(cardSections(shown, preset));
    const folded = $derived(new Set(held.folded));
    const cells = $derived(listCells(preset.columns, held.columns));
    /** The counts on the controls, over the board's projects before any filter. */
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
        setInstanceState(instance.id, storedState({ ...held, ...next }, ['more']));
    }

    /** Draw the cards or the list; a press on the mode in force changes nothing. */
    function setMode(mode: BoardMode): void {
        if (held.mode !== mode) write({ mode });
    }

    /** Set the picked values of one facet, and take the facet out when none is left. */
    function setFacet(facet: string, values: string[]): void {
        const next = { ...held.filters };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (values.length === 0) delete next[facet];
        else next[facet] = values;
        write({ filters: next });
    }

    /** Add or remove one value of one facet, which is what a pick in a group's list means. */
    function toggleFilter(facet: string, value: string): void {
        const selected = held.filters[facet] ?? [];
        setFacet(
            facet,
            selected.includes(value)
                ? selected.filter((one) => one !== value)
                : [...selected, value]
        );
    }

    /** Draw one card's long description whole, or cut it to its clamp again. */
    function toggleMore(id: string): void {
        const open = held.more.includes(id);
        write({ more: open ? held.more.filter((one) => one !== id) : [...held.more, id] });
    }

    /** Fold a section, or unfold it, by its category's key. */
    function toggleFold(key: string): void {
        write({
            folded: folded.has(key)
                ? held.folded.filter((one) => one !== key)
                : [...held.folded, key]
        });
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

    /** A section's words: its category's label, or "other" for the projects in no category. */
    function sectionTitle(key: string, words: string): string {
        return key === '' ? t('board.section_other') : words;
    }
</script>

{#snippet card(item: BoardItem)}
    <Card
        {item}
        {now}
        cursor={cursor === item.id}
        more={held.more.includes(item.id)}
        onmore={() => toggleMore(item.id)}
        label={label(item)}
        tab={tabLabel(item)}
        staleLag={lag}
        onsaid={(answer: string) => (said = answer)}
    />
{/snippet}

{#snippet projects(part: BoardItem[])}
    {#if held.mode === 'list'}
        <Surface>
            <BoardList items={part} {cells} {label} />
        </Surface>
    {:else}
        <div class="cards">
            {#each part as item (item.id)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render card(item)}
            {/each}
        </div>
    {/if}
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
        {#if held.mode === 'list'}
            <Menu
                label={t('board.columns')}
                glyph="sliders"
                compact
                bare
                placement="down"
                align="right"
                items={cells.map((cell) => ({
                    id: cell.key,
                    label: cell.label,
                    checked: cell.shown,
                    disabled: cell.key === 'title',
                    title: cell.key === 'title' ? t('board.columns_always', cell.label) : cell.label
                }))}
                onpick={(key: string) =>
                    write({ columns: pickCell(preset.columns, held.columns, key) })}
            />
        {/if}
    </Toolbar>
{/snippet}

{#snippet bar()}
    <FilterBar
        {held}
        placeholder={preset.search}
        {groups}
        stats={strip}
        {named}
        mine={mineApplies}
        onwrite={write}
        ontoggle={toggleFilter}
    />
    <SliceLine
        groups={slices}
        {counted}
        filters={held.filters}
        shown={shown.length}
        total={strip.projects}
        ontoggle={toggleFilter}
        onslices={(values: string[]) => setFacet('slice', values)}
        onclear={() => write({ filters: {} })}
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
        <SaidBody
            {said}
            empty={shown.length === 0}
            message={t('board.empty')}
            glyph={t('board.empty_glyph')}
        >
            {#if grid}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render projects(shown)}
            {:else}
                {#each sections as section (section.key)}
                    <section class="section" data-category={section.key}>
                        <div class="heading">
                            <FoldHead
                                title={sectionTitle(section.key, section.label)}
                                name={sectionTitle(section.key, section.label)}
                                open={!folded.has(section.key)}
                                ontoggle={() => toggleFold(section.key)}
                                tone={section.color === '' ? undefined : toneOf(section.color)}
                                count={section.items.length}
                            />
                        </div>
                        {#if !folded.has(section.key)}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render projects(section.items)}
                        {/if}
                    </section>
                {/each}
            {/if}
        </SaidBody>
    </div>
</Pane>

<style>
    /* A section of the cards or the list: the projects of one category under a heading in the
       category's colour, which carries the count. */
    .section + .section {
        margin-top: 14px;
    }

    /* The heading stays at the top of the pane's body while its section scrolls under it, on the
       pane's own background, so the cards do not read through it. */
    .heading {
        position: sticky;
        top: 0;
        z-index: 2;
        padding: 2px 0 6px;
        background: var(--panel);
    }

    /* Over a wallpaper the heading is the strip of `tokens.css` that keeps a mix of its own, the
       panel at the wallpaper's opacity, as a table's header row that stays is. */
    :global(body.wall) .heading {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The cards of one row stretch to the row's height, in file order, so no empty cell is left
       under a short card and nothing is reordered to fill one. */
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        align-items: stretch;
    }

    /* The terminal shape: the folder's name is the only monospace text in a card by default, so
       under the rice themes the whole card follows it rather than mixing two faces. */
    :global(body.rice:where(:not(.rice-sans))) .board {
        font-family: var(--font-mono);
    }
</style>
