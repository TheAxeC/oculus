<script module lang="ts">
    // Layer 3, view registration. The session list opens the Sessions page's group, as it opens the
    // page.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'session-list',
        label: 'sessions.rail_title',
        glyph: 'sessions.rail_glyph',
        group: 'sessions',
        order: 0
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
    // The filter and the search text are kept in the instance's state, so a list comes back as it
    // was left. The marks a row menu sets (pinned to the top, archived, a title) are writes to
    // ~/.oculus/sessions.json and are drawn at once, before the write lands, and put back when it
    // does not.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import {
        LIST_AGENTS,
        LIST_STATES,
        isTop,
        listFilterOf,
        listGroups,
        toggled,
        type ListFilter
    } from '$lib/state/sessions/folds';
    import { resumeRefusal, type Terminal } from '$lib/state/sessions/terminals.svelte';
    import { TERMINAL_VIEW, emptyTab } from '$lib/state/sessions/terminal/terminal-tabs';
    import { t } from '$lib/state/shared/words/text';
    import { instanceMap } from '$lib/state/workbench/layout';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import Customizations from './Customizations.svelte';
    import SessionWorkspace from './SessionWorkspace.svelte';
    import TerminalRows from './TerminalRows.svelte';
    import { filterGroups } from './session-list';
    import { useState } from '$lib/state/client/use';

    const {
        agents: { exportSession },
        layout: { currentPage, openView },
        selection: { select },
        selectors: { sessionsByWorkspace },
        clock: { minuteNow, startMinuteClock },
        ui: { instanceState, setInstanceState },
        terminals: {
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

    /** The marks drawn ahead of their writes, by session id. */
    let archivedNow: Record<string, boolean> = $state({});
    let topNow: Record<string, boolean> = $state({});
    let failure = $state('');
    let arming = $state('');
    let armedResume = $state('');
    let renaming = $state('');
    // A row's age moves between publishes, so the minute the page is in is read as state.
    $effect(startMinuteClock);
    const now = $derived(minuteNow());

    const filter = $derived(listFilterOf(instanceState(instance.id)));
    const tree = $derived(sessionsByWorkspace(true));
    const groups = $derived(listGroups(tree, filter, archived, top));
    const panes = $derived(terminals());
    const filtered = $derived(
        filter.states.length > 0 || filter.agents.length > 0 || filter.query.trim() !== ''
    );

    function write(next: Partial<ListFilter>): void {
        setInstanceState(instance.id, {
            ...instanceMap(instanceState(instance.id)),
            ...filter,
            ...next
        });
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
        composeIn();
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
            failure = resumeRefusal(answer.error);
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

    /** Flip one mark at once and write it; a write that does not land puts the mark back. */
    async function mark(
        row: GroupedSession,
        field: 'hidden' | 'top',
        next: boolean
    ): Promise<void> {
        const drawn = field === 'hidden' ? archivedNow : topNow;
        drawn[row.id] = next;
        failure = '';
        const answer = await writeSession(row.id, { [field]: next });
        if (answer.ok) return;
        drawn[row.id] = !next;
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
            openView('session-detail', { session: row.id, label: row.title });
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
                <Empty
                    message={filtered ? t('sessions.filter_empty') : t('sessions.state_empty')}
                    glyph={t('sessions.empty_glyph')}
                />
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

    :global(body.rice) .list {
        font-family: var(--font-mono);
    }
</style>
