<script module lang="ts">
    // Layer 3, view registration. The Sessions tab is the Explorer's third, after Repositories. Its
    // badge is how many sessions the list draws as needing input, an archived one left out, its
    // count, drawn in amber where its row of `counts` says; a list limited to a folder carries the
    // same count, the view's.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import { countText } from '$lib/state/workbench/rail-badges/rail-badges';

    export const registration: ViewRegistration = {
        id: 'session-list',
        label: 'sessions.rail_title',
        glyph: 'sessions.rail_glyph',
        group: 'explorer',
        order: 2,
        badge: (client) => countText(client.railBadges.sessionInputCount()),
        countPart: (client) => ({
            count: client.railBadges.sessionInputCount(),
            tone: 'amber'
        })
    };
</script>

<script lang="ts">
    // Layer 3, view. The Sessions tab, built as Repositories is: New, the filter menu and the
    // search box in its header, then a fold headed Sessions that holds the list, at most ten rows
    // tall and scrolled inside itself, and under the fold the sections of the session the tab
    // follows (views/shared/sessions/sections/SessionSections.svelte) and the Customizations
    // section. The pane scrolls all of it. The tab keeps the session it shows as a Session tab does
    // (state/workbench/selection.svelte.ts `keepShown`), follows a session's terminal to its
    // session, and leaves the sections as they were for a terminal with no session. With no
    // session to follow the sections are not drawn and Customizations stays.
    //
    // The list is one tree (ui/tree/TreeView.svelte), so it is one stop of the focus order: the
    // fold's head, the heads of the groups and the rows are its rows (session-list.ts `listRows`)
    // and the arrows walk them, scrolling a row into the fold. It holds the sessions grouped by
    // workspace, then every terminal oculus started with each by-hand terminal.
    //
    // A press on a session picks it and shows its terminal or transcript in the page's Terminal
    // tab. A terminal row shows its terminal in the Terminal tab that owns it, on whichever page,
    // or, for one no tab owns (its tab was closed, or a task, a hook or LaTeX started it, or it is
    // by hand), in the Terminal tab of the page on screen; `Open in its own pane` moves it into a
    // new Terminal tab beside it. New shows the composer in the tab of the page that holds a typed
    // prompt, else in the page's Terminal tab. On a page with no Terminal tab a press and New open
    // one in the page's documents pane.
    //
    // A list a workbench limited to a folder (state/sources/explorer/view/limit.ts) holds the
    // sessions and terminals that work in the folder or are filed into it, with the line "In
    // root/folder" and the control that lists every session again. New there starts in the folder.
    //
    // A group is named as the workspace picker names its folder (place-names.ts): a hub of the open
    // workspace by the name the workspace file gives it, any other folder by its last segment, and
    // two groups that would read the same by the folders above them.
    //
    // The filter and the search text are kept in the instance's state, so a list comes back as it
    // was left. The marks a row menu sets are session-marks.svelte.ts's.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import FolderLine from '$lib/views/shared/links/FolderLine.svelte';
    import SessionSections from '$lib/views/shared/sessions/sections/SessionSections.svelte';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { limitDir, limitOf, withLimit } from '$lib/state/sources/explorer/view/limit';
    import { servesRoot } from '$lib/state/sources/fs-transport';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import {
        LIST_AGENTS,
        LIST_STATES,
        listFilterOf,
        listGroups,
        sessionRows,
        type ListFilter
    } from '$lib/state/sessions/folds';
    import { toggled } from '$lib/state/shared/lists/lists';
    import type { Terminal } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { instanceMap } from '$lib/state/workbench/layout';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { followedSession, keepShown } from '$lib/state/workbench/selection.svelte';
    import Customizations from './Customizations.svelte';
    import SessionWorkspace from './SessionWorkspace.svelte';
    import TerminalRows from './TerminalRows.svelte';
    import {
        LIST_FOLD,
        TERMINALS_FOLD,
        filterGroups,
        foldOfRow,
        listRows,
        sessionRowId,
        sessionsInFolder,
        terminalRowId,
        terminalsInFolder
    } from './session-list';
    import { createSessionMarks } from './session-marks.svelte';
    import { hubPlaces, placeNames } from '$lib/views/shared/sessions/place-names';
    import { useState } from '$lib/state/client/use';

    const {
        agents: { exportSession },
        fs: { roots, workspaces },
        layout: { instanceLayoutState, openView, restateInstance },
        selection: { select, selected, selectedTerminal },
        selectors: { sessionById, sessionsByWorkspace },
        clock: { minuteNow, startMinuteClock },
        ui: { instanceState, setInstanceState },
        terminals: {
            composeAt,
            composeIn,
            forkTerminal,
            moveToNewTab,
            openSession,
            resumeTerminal,
            sessionOfTerminal,
            showTerminal,
            stopTerminal,
            terminals
        },
        writes: { writeSession }
    } = useState();

    let { instance }: ViewProps = $props();

    const fold = usePaneFold();

    /** The session the selection names: its own id, or the session its terminal runs, if any. */
    const pickedSession = $derived.by(() => {
        const terminal = selectedTerminal();
        return terminal === null ? selected() : (sessionOfTerminal(terminal)?.id ?? null);
    });
    /** The session the sections under the fold show. */
    const followed = $derived(
        sessionById(followedSession(instanceLayoutState(instance.id), pickedSession))
    );
    keepShown({
        state: () => instanceLayoutState(instance.id),
        selected: () => pickedSession,
        shown: () => followed?.id ?? null,
        write: (state) => restateInstance(instance.id, state)
    });

    const marks = createSessionMarks({
        rows: () => sessionRows(sessionsByWorkspace(true)),
        write: writeSession
    });
    const { archived, top } = marks;
    let failure = $state('');
    let arming = $state('');
    let armedResume = $state('');
    let renaming = $state('');
    // A row's age moves between publishes, so the minute the page is in is read as state.
    $effect(startMinuteClock);
    const now = $derived(minuteNow());

    const filter = $derived(listFilterOf(instanceState(instance.id)));
    /** The folder a workbench limits this list to, and its absolute path; null when not served. */
    const folder = $derived(limitOf(instanceState(instance.id)));
    const dir = $derived(folder === null ? null : limitDir(roots(), folder));
    const tree = $derived(
        folder === null
            ? sessionsByWorkspace(true)
            : sessionsInFolder(sessionsByWorkspace(true), dir)
    );
    const listed = $derived(listGroups(tree, filter, archived, top));
    const names = $derived(
        placeNames(
            listed.map((group) => group.key).filter((key) => key !== ''),
            hubPlaces(workspaces().folders, workspaces().primary)
        )
    );
    const groups = $derived(
        listed.map((group) => ({ ...group, name: names.get(group.key) ?? group.name }))
    );
    const panes = $derived(folder === null ? terminals() : terminalsInFolder(terminals(), dir));
    /** The groups of the list as its tree walks them, the Terminals group after the workspaces'. */
    const keyRows = $derived(
        listRows(
            [
                ...groups.map((group) => ({
                    key: group.key,
                    rows: group.rows.map((row) => sessionRowId(row.id))
                })),
                ...(panes.length === 0
                    ? []
                    : [{ key: TERMINALS_FOLD, rows: panes.map((one) => terminalRowId(one.id)) }])
            ],
            fold.open
        )
    );
    /** How many rows the list holds, drawn on the fold's head. */
    const held = $derived(groups.reduce((sum, group) => sum + group.rows.length, panes.length));
    const filtered = $derived(
        filter.states.length > 0 || filter.agents.length > 0 || filter.query.trim() !== ''
    );
    /** What the list says when it holds no row: the filter, a folder no root holds, or nothing. */
    const emptyWords = $derived.by(() => {
        if (folder !== null && !servesRoot(workspaces(), folder.root)) {
            return t('sessions.folder_gone', folder.root);
        }
        return filtered ? t('sessions.filter_empty') : t('sessions.state_empty');
    });

    function write(next: Partial<ListFilter>): void {
        setInstanceState(instance.id, {
            ...instanceMap(instanceState(instance.id)),
            ...filter,
            ...next
        });
    }

    /** A pick in the filter menu: a state or an agent kept or let go. */
    function picked(id: string, group?: string): void {
        if (group === 'state') {
            const state = LIST_STATES.find((one) => one === id);
            if (state !== undefined) write({ states: toggled(filter.states, state) });
        } else if (group === 'agent') {
            const agent = LIST_AGENTS.find((one) => one === id);
            if (agent !== undefined) write({ agents: toggled(filter.agents, agent) });
        }
    }

    /**
     * Start a new session: the composer in the tab of the page on screen that holds a typed prompt,
     * else in its Terminal tab, which keeps the terminals it owns, or in a new Terminal tab in the
     * documents pane when the page has none. The workbench's `n` key does the same.
     */
    function newSession(): void {
        if (dir === null) composeIn(undefined, true);
        else void composeAt({ cwd: dir, agent: 'claude', documents: true, asNew: true });
    }

    /**
     * A press on a session: it is the selection, so the sections follow it, and it shows in the
     * page's Terminal tab, or in a new one in the documents pane when the page has none.
     */
    function pick(row: GroupedSession): void {
        select(row.id);
        openSession({ session: row.id, label: row.title, press: true, documents: true });
    }

    /** Take the folder away from this list: it lists every session again. */
    function clearFolder(): void {
        setInstanceState(instance.id, withLimit(instanceState(instance.id), null));
    }

    async function stop(entry: Terminal): Promise<void> {
        if (arming !== entry.id) {
            arming = entry.id;
            return;
        }
        arming = '';
        failure = '';
        const answer = await stopTerminal(entry.id);
        if (!answer.ok) failure = answer.error;
    }

    async function resume(row: GroupedSession): Promise<void> {
        if (armedResume !== row.id) {
            armedResume = row.id;
            return;
        }
        armedResume = '';
        failure = '';
        const answer = await resumeTerminal(row.tool, row.id);
        if (!answer.ok) {
            failure = answer.error;
            return;
        }
        select(answer.id);
        showTerminal(answer.id);
    }

    async function fork(row: GroupedSession): Promise<void> {
        failure = '';
        const answer = await forkTerminal(row.tool, row.id);
        if (!answer.ok) {
            failure = answer.error;
            return;
        }
        select(answer.id);
        showTerminal(answer.id);
    }

    /** Flip one mark, and say so when its write did not land. */
    async function mark(
        row: GroupedSession,
        field: 'hidden' | 'top',
        next: boolean
    ): Promise<void> {
        failure = '';
        if (await marks.set(row, field, next)) return;
        failure = field === 'hidden' ? t('sessions.archive_failed') : t('sessions.top_failed');
    }

    /** A title typed and taken (a string), the field opened (null), or closed without one (''). */
    async function rename(row: GroupedSession, title: string | null): Promise<void> {
        if (title === null) {
            renaming = row.id;
            return;
        }
        renaming = '';
        const next = title.trim();
        if (next === '' || next === row.title) return;
        failure = '';
        const answer = await writeSession(row.id, { title: next });
        if (!answer.ok) failure = t('sessions.rename_failed');
    }

    function action(id: string, row: GroupedSession): void {
        if (id === 'top') void mark(row, 'top', !top(row));
        else if (id === 'archive') void mark(row, 'hidden', !archived(row));
        else if (id === 'fork') void fork(row);
        else if (id === 'export') {
            if (!exportSession(row.id)) failure = t('sessions.export_failed');
        } else if (id === 'pinned')
            openView('session-detail', { session: row.id, label: row.title }, undefined, {
                keep: true
            });
        else if (id === 'transcript') {
            select(row.id);
            openSession({ session: row.id, label: row.title });
        } else if (id === 'resume') void resume(row);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.list_toolbar')} overflow>
        <ToolButton
            label={t('sessions.new_session')}
            title={t('sessions.new_session_title')}
            glyph="expand"
            compact
            bare
            onclick={newSession}
        />
        <span class="filter" data-list-filter>
            <Menu
                label={t('sessions.filter')}
                glyph="search"
                compact
                bare
                placement="down"
                align="right"
                items={[]}
                groups={filterGroups(filter)}
                onpick={(id: string, _event: MouseEvent, group?: string) => picked(id, group)}
            />
        </span>
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('sessions.list_bar')}>
        <Search
            fill
            value={filter.query}
            placeholder={t('sessions.search')}
            oninput={(value: string) => write({ query: value })}
        />
        {#if folder !== null}
            <FolderLine
                text={folder.path === ''
                    ? t('sessions.in_root', folder.root)
                    : t('sessions.in_folder', folder.root, folder.path)}
                clear={t('sessions.clear_scope')}
                title={t('sessions.clear_scope_title')}
                onclear={clearFolder}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('sessions.rail_title')} toolbar={tools} {bar} tinted>
    <div class="list" data-instance={instance.id}>
        {#if failure !== ''}
            <div class="failure" data-list-failure>
                <Empty error message={failure} />
            </div>
        {/if}
        <TreeView
            label={t('sessions.rail_title')}
            rows={keyRows}
            ontoggle={(id: string) => fold.toggle(foldOfRow(id))}
        >
            {#snippet children(nav: TreeNav)}
                <TreeSection
                    label={t('sessions.rail_title')}
                    id={LIST_FOLD}
                    {nav}
                    count={held}
                    open={fold.open(LIST_FOLD)}
                    ontoggle={() => fold.toggle(LIST_FOLD)}
                >
                    <li class="fold" role="none" tabindex="-1" data-session-fold>
                        {#if groups.length === 0 && panes.length === 0}
                            <Empty message={emptyWords} glyph={t('sessions.empty_glyph')} />
                        {:else}
                            {#each groups as group (group.key)}
                                <SessionWorkspace
                                    {group}
                                    {nav}
                                    {now}
                                    {armedResume}
                                    {renaming}
                                    isArchived={archived}
                                    topOf={top}
                                    onaction={action}
                                    onpick={pick}
                                    onrename={(row: GroupedSession, title: string | null) =>
                                        void rename(row, title)}
                                />
                            {/each}
                            <TerminalRows
                                entries={panes}
                                {nav}
                                {now}
                                {arming}
                                onstop={stop}
                                onpinned={(entry: Terminal) => moveToNewTab(entry.id)}
                            />
                        {/if}
                    </li>
                </TreeSection>
            {/snippet}
        </TreeView>
        {#if followed !== null}
            <SessionSections owner={instance.id} record={followed} />
        {/if}
        <Customizations owner={instance.id} />
    </div>
</Pane>

<style>
    /* The pane scrolls the fold, the sections and Customizations together. */
    .list {
        display: flex;
        flex-direction: column;
        min-width: 0;
        font-size: var(--fs-sm);
    }

    /* At most ten rows tall, scrolling inside itself, and no Tab stop of its own: the tree is one.
       A row an arrow moves to stops clear of the sticky head of its group. */
    .fold {
        max-height: calc(10 * var(--tree-row) * var(--text-scale, 1));
        overflow: auto;
        scroll-padding-top: calc(var(--tree-row) * var(--text-scale, 1) + 8px);
    }

    .failure {
        flex: none;
        padding: 0 8px 4px;
    }

    .filter {
        display: inline-flex;
    }

    :global(body.rice:where(:not(.rice-sans))) .list {
        font-family: var(--font-mono);
    }
</style>
