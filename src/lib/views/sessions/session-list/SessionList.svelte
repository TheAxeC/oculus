<script module lang="ts">
    // Layer 3, view registration. The session list opens the Sessions page's group, as it opens the
    // page. Its badge is how many sessions the list draws as needing input, an archived one left
    // out, its count, drawn where its row of `counts` says; a list limited to a folder carries the
    // same count, the view's.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import { countText } from '$lib/state/workbench/rail-badges/rail-badges';

    export const registration: ViewRegistration = {
        id: 'session-list',
        label: 'sessions.rail_title',
        glyph: 'sessions.rail_glyph',
        group: 'sessions',
        order: 0,
        badge: (client) => countText(client.railBadges.sessionInputCount()),
        countPart: (client) => ({ count: client.railBadges.sessionInputCount() })
    };
</script>

<script lang="ts">
    // Layer 3, sessions view. The sessions list of VS Code's Agents window: New, the filter menu
    // and the search box in its header, the sessions grouped by workspace, every terminal oculus
    // started, and the Customizations section at its foot. A terminal row shows its terminal in the
    // Terminal tab that owns it, or, for one no tab owns (its tab was closed, or a task, a hook or
    // LaTeX started it), in the Terminal tab of the page on screen; `Open in its own pane` moves it
    // into a new Terminal tab. New shows the composer in the page's Terminal tab.
    //
    // A list a workbench limited to a folder (state/sources/explorer/view/limit.ts) holds the
    // sessions and terminals that work in the folder or are filed into it, with the line "In
    // root/folder" and the control that lists every session again. Its pages have no Terminal tab
    // of their own: New opens one in the page's documents pane, in the folder, and a picked session
    // opens its Transcript and its Session view there.
    //
    // A group is named as the workspace picker names its folder (place-names.ts): a hub of the open
    // workspace by the name the workspace file gives it, any other folder by its last segment, and
    // two groups that would read the same by the folders above them.
    //
    // The filter and the search text are kept in the instance's state, so a list comes back as it
    // was left. The marks a row menu sets (pinned to the top, archived, a title) are writes to
    // ~/.oculus/sessions.json and are drawn at once, before the write lands. A mark drawn ahead is
    // held while its write is in flight and then until the sessions channel gives its row the same
    // mark, and a write that does not land drops it: from then on the row's mark is the channel's,
    // so a change made from another place is drawn and the list's archived rows are the ones the
    // channel names.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FolderLine from '$lib/views/shared/links/FolderLine.svelte';
    import { limitDir, limitOf, withLimit } from '$lib/state/sources/explorer/view/limit';
    import { servesRoot } from '$lib/state/sources/fs-transport';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import {
        LIST_AGENTS,
        LIST_STATES,
        isTop,
        listFilterOf,
        listGroups,
        sessionRows,
        type ListFilter
    } from '$lib/state/sessions/folds';
    import { toggled } from '$lib/state/shared/lists/lists';
    import type { Terminal } from '$lib/state/sessions/terminals.svelte';
    import { TERMINAL_VIEW, emptyTab } from '$lib/state/sessions/terminal/terminal-tabs';
    import { t } from '$lib/state/shared/words/text';
    import { instanceMap } from '$lib/state/workbench/layout';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import Customizations from './Customizations.svelte';
    import SessionWorkspace from './SessionWorkspace.svelte';
    import TerminalRows from './TerminalRows.svelte';
    import { filterGroups, sessionsInFolder, terminalsInFolder } from './session-list';
    import { hubPlaces, placeNames } from '$lib/views/shared/sessions/place-names';
    import { useState } from '$lib/state/client/use';

    const {
        agents: { exportSession },
        fs: { roots, workspaces },
        layout: { currentPage, openView },
        selection: { select },
        selectors: { sessionsByWorkspace },
        clock: { minuteNow, startMinuteClock },
        ui: { instanceState, setInstanceState },
        terminals: {
            composeAt,
            composeIn,
            forkTerminal,
            moveTerminal,
            resumeTerminal,
            showTerminal,
            stopTerminal,
            terminals
        },
        writes: { writeSession }
    } = useState();

    let { instance }: ViewProps = $props();

    /**
     * The marks drawn ahead of their writes, by session id, each held while its write is in flight
     * and then until the channel gives the row the same mark.
     */
    let archivedNow: Record<string, boolean> = $state({});
    let topNow: Record<string, boolean> = $state({});
    /** The writes of a mark in flight, by `<field>:<session id>`, counted. */
    let writing: Record<string, number> = $state({});
    // A mark drawn ahead goes once the channel's row carries it and no write of it is in flight.
    $effect(() => {
        const rows = sessionRows(sessionsByWorkspace(true));
        const archivedHeld = uncarried(archivedNow, rows, (row) => row.hidden, 'hidden');
        if (archivedHeld !== null) archivedNow = archivedHeld;
        const topHeld = uncarried(topNow, rows, isTop, 'top');
        if (topHeld !== null) topNow = topHeld;
    });
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

    /**
     * The marks of `drawn` that no row of the channel carries yet or whose write is in flight, or
     * null when none goes, so an unchanged map is not written.
     */
    function uncarried(
        drawn: Record<string, boolean>,
        rows: GroupedSession[],
        mark: (row: GroupedSession) => boolean,
        field: 'hidden' | 'top'
    ): Record<string, boolean> | null {
        const carried = new Set(
            rows
                .filter((row) => drawn[row.id] === mark(row) && !writing[`${field}:${row.id}`])
                .map((row) => row.id)
        );
        if (carried.size === 0) return null;
        return Object.fromEntries(Object.entries(drawn).filter(([id]) => !carried.has(id)));
    }

    /** Draw one mark of one row ahead of the channel. */
    function drawAhead(field: 'hidden' | 'top', id: string, value: boolean): void {
        if (field === 'hidden') archivedNow = { ...archivedNow, [id]: value };
        else topNow = { ...topNow, [id]: value };
    }

    /** Stop drawing one row's mark ahead, so the row draws the channel's mark again. */
    function forget(field: 'hidden' | 'top', id: string): void {
        const without = (drawn: Record<string, boolean>) =>
            Object.fromEntries(Object.entries(drawn).filter(([one]) => one !== id));
        if (field === 'hidden') archivedNow = without(archivedNow);
        else topNow = without(topNow);
    }

    /** Count one write of a row's mark in, or one answered write out. */
    function hold(key: string, step: 1 | -1): void {
        const count = (writing[key] ?? 0) + step;
        writing = Object.fromEntries(
            Object.entries({ ...writing, [key]: count }).filter(([, held]) => held > 0)
        );
    }

    function archived(row: GroupedSession): boolean {
        return archivedNow[row.id] ?? row.hidden;
    }

    function top(row: GroupedSession): boolean {
        return topNow[row.id] ?? isTop(row);
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
     * Start a new session: the composer in the Terminal tab of the page on screen, which keeps the
     * terminals it owns, or in a new Terminal tab when the page has none. The workbench's `n` key
     * does the same.
     */
    function newSession(): void {
        if (dir === null) composeIn();
        else void composeAt({ cwd: dir, agent: 'claude', documents: true });
    }

    /** A press on a session: it is the selection, and a workbench shows it in its documents. */
    function pick(row: GroupedSession): void {
        select(row.id);
        if (folder === null) return;
        const page = currentPage().id;
        const pinned = { session: row.id, label: row.title };
        openView('transcript', pinned, page, { document: true });
        openView('session-detail', pinned, page, { document: true, keep: true });
    }

    /** Take the folder away from this list: it lists every session again. */
    function clearFolder(): void {
        setInstanceState(instance.id, withLimit(instanceState(instance.id), null));
    }

    /** Open a new Terminal tab on the page on screen and move the terminal into it. */
    function ownPane(entry: Terminal): void {
        const page = currentPage().id;
        const opened = openView(TERMINAL_VIEW, emptyTab(crypto.randomUUID()), page);
        if (opened !== '') moveTerminal(entry.id, opened, page, 0);
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

    /**
     * Flip one mark at once and write it. A write that does not land stops drawing the mark ahead,
     * so the row draws the mark the channel carries, whatever another place wrote meanwhile.
     */
    async function mark(
        row: GroupedSession,
        field: 'hidden' | 'top',
        next: boolean
    ): Promise<void> {
        const key = `${field}:${row.id}`;
        drawAhead(field, row.id, next);
        failure = '';
        hold(key, 1);
        try {
            const answer = await writeSession(row.id, { [field]: next });
            if (answer.ok) return;
            if (writing[key] === 1) forget(field, row.id);
            failure = field === 'hidden' ? t('sessions.archive_failed') : t('sessions.top_failed');
        } finally {
            hold(key, -1);
        }
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
            openView('transcript', { session: row.id, label: row.title });
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
        <div class="rows">
            {#if groups.length === 0 && panes.length === 0}
                <Empty message={emptyWords} glyph={t('sessions.empty_glyph')} />
            {:else}
                {#each groups as group (group.key)}
                    <SessionWorkspace
                        {group}
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
                <TerminalRows entries={panes} {now} {arming} onstop={stop} onpinned={ownPane} />
            {/if}
        </div>
        <Customizations owner={instance.id} />
    </div>
</Pane>

<style>
    .list {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
    }

    .rows {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
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
