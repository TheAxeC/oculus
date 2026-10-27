<script module lang="ts">
    // Layer 3, view registration. Focus opens the Focus page's group and is the landing view.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'focus',
        label: 'views.focus',
        glyph: 'views.focus_glyph',
        group: 'focus',
        order: 0,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. The landing board, one page of sections drawn top to bottom in the order
    // `focus.sections` of config/defaults/behavior.yml lists them (`drawnSections`), each of the
    // board's own words for the sections it knows how to draw: `career` the career banner,
    // `command_center` the command center of the dates the records hold, the snoozed lines and the
    // attention and refresh lines, `tasks` the tasks section of the work the reader set down (the
    // follow-ups, the subtasks and the entries of the tasks file, dated or not), `quick_add` the
    // quick add, `awaiting` the box of what is out for an answer, `band` the band of durable work
    // that is not a project, and `lanes` the lanes each project's stage and chips put it on, with
    // the message of a board with no project. A section the list leaves out is not drawn. The said
    // line is drawn after the quick add, and at the top of the board when the list leaves the quick
    // add out.
    //
    // It counts nothing and draws little. The arithmetic is the pure functions of
    // state/boards/focus.ts, state/boards/focus/filter.ts, state/feeds/feeds.ts and
    // state/boards/career.ts; the markup is seven partials under views/boards/focus/ (Band,
    // CareerPanel, CommandCenter, FocusFilter, Lanes, QuickAdd and Tasks), which are this view's
    // own and which nothing else may import. What is left here is the composition, the
    // awaiting-a-response box, and the one line that says what the last write answered, or what a
    // press on a career row could not open. The career banner, the command center, the tasks
    // section, each cluster or lane section of the lanes and the band fold the same way, each by a
    // control on its heading, and which of them is closed is kept in the tab's instance state
    // under its key (state/boards/focus.ts `FoldKey`), so a reload and a move of the tab keep it;
    // all of them start open.
    //
    // The header holds the Filter action (FocusFilter.svelte): Mine only, the Role, Tier, Pillar
    // and Hub checklists, kept in the tab's instance state beside the folds. The page works the
    // filter out once (state/boards/focus/filter.ts) and hands the command center, the tasks, the
    // awaiting box, the band and the lanes the records it keeps and how many rows each hides; the
    // career banner and the quick add read the whole portfolio.
    //
    // Every name of the awaiting box is a button. A name of Applications or Grants opens its
    // entry's page, as a card title of its collection does, and is plain words when its hub holds
    // no collection to find that page in. A name of Under review or Waiting on, and Blocked's
    // count, opens the box's board (views/boards/projects/Projects.svelte, the view
    // `awaiting_board`): one tab per name, titled by the row's label and the name, holding exactly
    // the projects the name counts under the filter in force at the press, which its tab state
    // carries.
    //
    // Over a wallpaper the banner, the command center, the tasks, the band's lanes and the lanes
    // are each a surface of their own; the awaiting box and the said line are read off a
    // `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Band from './Band.svelte';
    import CareerPanel from './career/CareerPanel.svelte';
    import CommandCenter from './CommandCenter.svelte';
    import FocusFilter from './FocusFilter.svelte';
    import Lanes from './lanes/Lanes.svelte';
    import QuickAdd from './QuickAdd.svelte';
    import Tasks from './Tasks.svelte';
    import { entryPage } from './rows';
    import { AWAITING_VIEW } from '$lib/state/boards/board';
    import { cardCursor, instanceMap } from '$lib/state/workbench/layout/instance';
    import { recordState } from '$lib/state/shared/page/records';
    import { hubList, keyOf } from '$lib/state/shared/page/hubs';
    import {
        drawnSections,
        foldOpen,
        foldToggled,
        labelOf,
        lanes,
        liveProjects,
        portfolioProjects,
        type AwaitedEntry,
        type Awaited,
        type AwaitingRow,
        type FoldKey,
        type Id
    } from '$lib/state/boards/focus';
    import {
        awaitingTab,
        filterLists,
        focusFilter,
        focusPage,
        pillarRows,
        withFocusFilter,
        type FocusFilter as Choice
    } from '$lib/state/boards/focus/filter';
    import { personNames } from '$lib/state/boards/person';
    import { vocabOf } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        clock: { minuteNow, startMinuteClock },
        fs: { primary, roots },
        selectors: { collectionsOfKey, configMap, hubVocabs, selfPeople },
        entities: { portfolio },
        layout: { openView },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /**
     * Today, for every countdown on the board, from the minute clock: a page left open across
     * midnight moves on to the new day rather than counting the one it was opened on.
     */
    const now = $derived(minuteNow());

    $effect(startMinuteClock);

    const cursor = $derived(cardCursor(instance.state));

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const projects = $derived(portfolioProjects(snapshot));
    const board = $derived(lanes(vocabOf()));
    /** The sections the board draws, in drawing order, as `focus.sections` lists them. */
    const sections = $derived(drawnSections(config));

    /** The tab's folded sections and its filter, which its instance state keeps. */
    const folds = $derived(instanceState(instance.id));
    const filter = $derived(focusFilter(folds));
    const self = $derived(selfPeople());
    const hubs = $derived(hubList(roots(), primary()));
    /** The rows of the Role and Tier checklists, in the primary hub's words. */
    const lists = $derived(filterLists(vocabOf()));
    /** The rows of the Pillar checklist: every pillar of the workspace. */
    const pillars = $derived(pillarRows(snapshot?.entities.pillars ?? {}, hubs));

    /**
     * The page under the filter: every section's records, worked out once here and handed down,
     * with how many rows each hides, so no section reads the portfolio itself.
     */
    const page = $derived(
        snapshot === null
            ? null
            : focusPage(snapshot, config, now, filter, {
                  self,
                  hubs,
                  wordsOf: vocabOf,
                  lists: hubVocabs()
              })
    );
    const week = $derived(page?.sections.week ?? null);
    const strip = $derived(page?.sections.strip ?? null);

    /** What a lane card is read against, from the whole portfolio. */
    const known = $derived({
        names: personNames(snapshot),
        projects: snapshot?.entities.projects ?? {},
        venues: snapshot?.entities.venues ?? {},
        self
    });

    /** The projects quick add may write to: every project not at a `terminal` stage. */
    const live = $derived(liveProjects(projects, config, vocabOf));

    /** One name of a tally, with its count only when the count is above one: "BSPC (2)". */
    function counted(label: string, count: number): string {
        return count > 1 ? t('focus.wait_count', label, count) : label;
    }

    /** One name of the box: its words, and what a press opens, null for plain words. */
    type BoxName = { text: string; press: (() => void) | null };

    /** The label of a row whose names open the box's board, as the box draws it. */
    function rowWords(row: AwaitingRow): string {
        if (row === 'review') return t('focus.wait_review');
        if (row === 'people') return t('focus.wait_people');
        return t('focus.wait_blocked');
    }

    /** The words of a name of a row that opens the board: the venue-unset words for no venue. */
    function nameWords(row: AwaitingRow, name: string): string {
        return row === 'review' && name === '' ? t('focus.venue_unset') : name;
    }

    /**
     * Open the box's board of one name, titled by the row's label and the name ("Under review:
     * BSPC"), Blocked by its label alone, with the Focus filter in force now, so it holds what the
     * name counts. A second press on the name brings its tab forward with the filter of that press,
     * and the board's Mine only is set to the filter's each time.
     */
    function openBoard(row: AwaitingRow, name: string): void {
        const words = rowWords(row);
        const label =
            row === 'blocked' ? words : t('board.awaiting_title', words, nameWords(row, name));
        const id = openView(AWAITING_VIEW, awaitingTab(row, name, label, filter));
        setInstanceState(id, { ...instanceMap(instanceState(id)), mine: filter.mine });
    }

    /** A name of a tally that opens the box's board of the projects it counts. */
    function boardName(row: AwaitingRow, one: Awaited): BoxName {
        const text = counted(nameWords(row, one.label), one.count);
        return { text, press: () => openBoard(row, one.label) };
    }

    /**
     * A grant or an application, named by its title or by its id when it has none, its hub's name
     * after it for a hub other than the primary while the workspace has more than one; a press
     * opens its entry's page, and one whose page cannot be found is plain words.
     */
    function entryName(entry: AwaitedEntry): BoxName {
        const title = entry.title === '' ? entry.id : entry.title;
        const root = entry.root ?? '';
        const shown = hubs.length > 0 && root !== (primary() ?? '');
        const text = shown ? t('focus.wait_in_hub', title, root) : title;
        const page =
            entry.collection === undefined
                ? null
                : entryPage(entry.collection, root, entry.id, collectionsOfKey);
        return { text, press: page === null ? null : () => openView(page.view, page.state) };
    }

    /**
     * The rows of the awaiting box, in its fixed order, each a label and the names it lists; a kind
     * with nothing draws no row, and Blocked lists its count.
     */
    const awaiting = $derived(
        strip === null
            ? []
            : [
                  {
                      key: 'people',
                      label: t('focus.wait_people'),
                      names: strip.people.map((one) => boardName('people', one))
                  },
                  {
                      key: 'review',
                      label: t('focus.wait_review'),
                      names: strip.venues.map((one) => boardName('review', one))
                  },
                  {
                      key: 'apps',
                      label: t('focus.wait_apps'),
                      names: strip.applications.map(entryName)
                  },
                  {
                      key: 'grants',
                      label: t('focus.wait_grants'),
                      names: strip.grants.map(entryName)
                  },
                  {
                      key: 'blocked',
                      label: t('focus.wait_blocked'),
                      names:
                          strip.blocked.length > 0
                              ? [
                                    {
                                        text: String(strip.blocked.length),
                                        press: () => openBoard('blocked', '')
                                    }
                                ]
                              : []
                  }
              ].filter((row) => row.names.length > 0)
    );

    /**
     * What the last write on this board answered, whichever partial made it, or why a press on a
     * career row opened the file at no line.
     */
    let said = $state('');

    /** Open one project as its own tab, the same tab a click on a board card opens. */
    function openProject(id: Id): void {
        const project = snapshot?.entities.projects[id];
        openView('project', recordState(id, project === undefined ? keyOf(id) : labelOf(project)));
    }

    /** Open or close one folded section or group, keeping the rest of the tab's state. */
    function fold(key: FoldKey): void {
        setInstanceState(instance.id, foldToggled(folds, key));
    }

    /** Keep a new choice of the filter, keeping the rest of the tab's state. */
    function choose(next: Choice): void {
        setInstanceState(instance.id, withFocusFilter(folds, next));
    }
</script>

<Pane title={t('views.focus')}>
    {#snippet toolbar()}
        <Toolbar label={t('focus.toolbar')} overflow>
            <FocusFilter
                {filter}
                named={self.size > 0}
                roles={lists.roles}
                tiers={lists.tiers}
                {pillars}
                {hubs}
                mineHides={page?.mineHides ?? false}
                hides={page?.hides ?? false}
                onchange={choose}
            />
        </Toolbar>
    {/snippet}
    <div class="focus" data-instance={instance.id}>
        {#snippet saidLine()}
            {#if said !== ''}
                <Surface>
                    <p class="said">{said}</p>
                </Surface>
            {/if}
        {/snippet}
        {#if !sections.includes('quick_add')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render saidLine()}
        {/if}
        {#each sections as section (section)}
            {#if section === 'career'}
                <CareerPanel
                    instance={instance.id}
                    {now}
                    open={foldOpen(folds, 'career')}
                    ontoggle={() => fold('career')}
                    onsaid={(text: string) => (said = text)}
                />
            {:else if section === 'command_center'}
                <CommandCenter
                    {week}
                    snapshot={page?.snapshot ?? null}
                    hidden={page?.hidden.command ?? 0}
                    {now}
                    open={foldOpen(folds, 'command')}
                    ontoggle={() => fold('command')}
                    onproject={openProject}
                    onsaid={(text: string) => (said = text)}
                />
            {:else if section === 'tasks'}
                <Tasks
                    {week}
                    hidden={page?.hidden.tasks ?? 0}
                    {now}
                    open={foldOpen(folds, 'tasks')}
                    ontoggle={() => fold('tasks')}
                    onproject={openProject}
                    onsaid={(text: string) => (said = text)}
                />
            {:else if section === 'quick_add'}
                <QuickAdd projects={live} onsaid={(text: string) => (said = text)} />
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render saidLine()}
            {:else if section === 'awaiting'}
                {#if awaiting.length > 0 || (page?.hidden.awaiting ?? 0) > 0}
                    <Surface fitted>
                        <section class="waitroll">
                            <p class="wait-head">
                                {t('focus.awaiting_response')}
                                {#if (page?.hidden.awaiting ?? 0) > 0}
                                    <span class="wait-hidden">
                                        {t('focus.hidden', page?.hidden.awaiting ?? 0)}
                                    </span>
                                {/if}
                            </p>
                            {#each awaiting as row (row.key)}
                                <span class="wait-lbl">{row.label}</span>
                                <span class="wait-names" class:blocked={row.key === 'blocked'}
                                    >{#each row.names as name, at (at)}{#if at > 0}{t(
                                                'focus.wait_join'
                                            )}{/if}{#if name.press === null}{name.text}{:else}<span
                                                class="wait-name"
                                                ><ToolButton
                                                    plain
                                                    label={name.text}
                                                    onclick={name.press}
                                                /></span
                                            >{/if}{/each}</span
                                >
                            {/each}
                        </section>
                    </Surface>
                {/if}
            {:else if section === 'band'}
                {#if page !== null}
                    <Band
                        {now}
                        cards={page.sections.band}
                        hidden={page.hidden.band}
                        isOpen={(key: FoldKey) => foldOpen(folds, key)}
                        ontoggle={fold}
                    />
                {/if}
            {:else if section === 'lanes'}
                {#if board.length === 0 || projects.length === 0}
                    <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
                {/if}
                <Lanes
                    {now}
                    {cursor}
                    items={page?.sections.lanes ?? {}}
                    hidden={page?.hidden.lanes ?? {}}
                    {known}
                    onproject={openProject}
                    onsaid={(text: string) => (said = text)}
                    isOpen={(key: FoldKey) => foldOpen(folds, key)}
                    ontoggle={fold}
                />
            {/if}
        {/each}
    </div>
</Pane>

<style>
    .focus {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .said {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--accent-txt, var(--accent));
    }

    /* The box is a grid of two columns: the labels, one width for every row since a grid column
       is as wide as its widest cell, and the names, which wrap inside their own column. The
       heading spans both. */
    .waitroll {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr);
        align-items: baseline;
        gap: 2px 12px;
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
    }

    .wait-head {
        grid-column: 1 / -1;
        margin: 0;
    }

    .wait-hidden {
        margin-left: 6px;
        font-weight: 400;
    }

    .wait-head,
    .wait-lbl {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

    /* The names are the box's rows, drawn at a ticker row's size and line (`Ticker.svelte`), as the
       rows of the command center and the tasks are. */
    .wait-names {
        min-width: 0;
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
        overflow-wrap: anywhere;
    }

    /* A name of the box is a plain button: its words, with the focus ring the button draws, and an
       underline and the accent colour under the pointer and with keyboard focus. Its box is
       inline-flex so the underline reaches the button inside it; Blocked's count keeps its red. */
    .wait-name {
        display: inline-flex;
        min-width: 0;
    }

    .wait-name:hover,
    .wait-name:has(:global(:focus-visible)) {
        color: var(--accent-txt, var(--accent));
        text-decoration: underline;
    }

    .wait-names.blocked,
    .wait-names.blocked .wait-name {
        color: var(--c-red-txt);
    }
</style>
