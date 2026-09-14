<script module lang="ts">
    // Layer 3, view registration. Session-list registration stays on the component because the
    // registry discovers this file directly.
    import type { ViewRegistration } from '$lib/views/registry';

    export const registration: ViewRegistration = {
        id: 'session-list',
        label: 'sessions.rail_title',
        glyph: 'sessions.rail_glyph',
        group: 'sessions',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, sessions view. The session-list frame owns grouping and transient list state because
    // workspace rows and terminal rows render and change independently.

    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { findView } from '$lib/state/layout';
    import type { Area, GroupedSession, Workspace } from '$lib/state/selectors.svelte';
    import { resumeRefusal, type Terminal } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from '$lib/views/registry';
    import SessionWorkspace from './SessionWorkspace.svelte';
    import TerminalRows from './TerminalRows.svelte';
    import { useState } from '$lib/state/use';

    const {
        layout: { openView, workbench },
        selection: { select },
        selectors: { sessionsByWorkspace },
        ui: { instanceState, setInstanceState },
        terminals: { resumeTerminal, stopTerminal, terminals },
        writes: { writeSession }
    } = useState();

    let { instance }: ViewProps = $props();
    type ListState = { ended: boolean; dismissed: boolean };

    let flipped: Record<string, boolean> = $state({});
    let failure = $state('');
    let arming = $state('');
    let armedResume = $state('');
    const now = Date.now();

    const opened = $derived(readState(instanceState(instance.id)));
    const tree = $derived(sessionsByWorkspace(true));
    const rows = $derived(tree.flatMap((workspace) => workspace.areas.flatMap((a) => a.sessions)));
    const dismissed = $derived(rows.filter((row) => hidden(row)).length);
    const endedCount = $derived(rows.filter((row) => !row.live && !hidden(row)).length);
    const live = $derived(prune(tree, (row) => row.live));
    const panes = $derived(terminals());
    const ended = $derived(prune(tree, (row) => !row.live && (opened.dismissed || !hidden(row))));

    function readState(saved: unknown): ListState {
        if (typeof saved !== 'object' || saved === null || Array.isArray(saved))
            return { ended: false, dismissed: false };
        const held = saved as Record<string, unknown>;
        return { ended: held.ended === true, dismissed: held.dismissed === true };
    }

    function write(next: Partial<ListState>): void {
        setInstanceState(instance.id, { ...opened, ...next });
    }

    function hidden(row: GroupedSession): boolean {
        return flipped[row.id] ?? row.hidden;
    }

    function prune(workspaces: Workspace[], keep: (row: GroupedSession) => boolean): Workspace[] {
        const found: Workspace[] = [];
        for (const workspace of workspaces) {
            const areas: Area[] = [];
            for (const area of workspace.areas) {
                const sessions = area.sessions.filter(keep);
                if (sessions.length > 0) areas.push({ ...area, sessions });
            }
            if (areas.length > 0) found.push({ ...workspace, areas });
        }
        return found;
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

    function openTranscript(row: GroupedSession): void {
        select(row.id);
        const where = findView(workbench().panel, 'transcript') !== null ? 'panel' : 'main';
        openView('transcript', where);
    }

    function openPinnedSession(row: GroupedSession): void {
        openView('session-detail', 'main', { session: row.id, label: row.title });
    }

    function openPinnedTerminal(entry: Terminal): void {
        openView('terminal', 'main', { session: entry.id, label: entry.name });
    }

    function terminalOpen(): boolean {
        const trees = [workbench().main, workbench().panel];
        return trees.some((one) => findView(one, 'terminal', null) !== null);
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
        if (!terminalOpen()) openView('terminal', 'main');
    }

    async function dismiss(row: GroupedSession): Promise<void> {
        const next = !hidden(row);
        flipped = { ...flipped, [row.id]: next };
        failure = '';
        const answer = await writeSession(row.id, { hidden: next });
        if (answer.ok) return;
        flipped = { ...flipped, [row.id]: !next };
        failure = t('sessions.dismiss_failed');
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.list_toolbar')}>
        {#if dismissed > 0}
            <ToolButton
                label={opened.dismissed
                    ? t('sessions.hide_dismissed', dismissed)
                    : t('sessions.show_dismissed', dismissed)}
                active={opened.dismissed}
                onclick={() => write({ dismissed: !opened.dismissed })}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('sessions.rail_title')} toolbar={tools} tinted>
    <div class="list" data-instance={instance.id}>
        {#if failure !== ''}
            <p class="failure">{failure}</p>
        {/if}
        {#if rows.length === 0 && panes.length === 0}
            <Empty message={t('sessions.state_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each live as workspace (workspace.key)}
                <SessionWorkspace
                    {workspace}
                    {now}
                    {armedResume}
                    isHidden={hidden}
                    onresume={resume}
                    ondismiss={dismiss}
                    ontranscript={openTranscript}
                    onpinned={openPinnedSession}
                />
            {/each}
            <TerminalRows
                entries={panes}
                {now}
                {arming}
                onstop={stop}
                onpinned={openPinnedTerminal}
            />
            {#if ended.length > 0}
                <div class="ended" class:open={opened.ended}>
                    <button
                        type="button"
                        class="ended-h"
                        aria-expanded={opened.ended}
                        onclick={() => write({ ended: !opened.ended })}
                    >
                        <Glyph name={t('sessions.ended_glyph')} />
                        <span>{t('sessions.ended_section', endedCount)}</span>
                    </button>
                    {#if opened.ended}
                        <div class="ended-body">
                            {#each ended as workspace (workspace.key)}
                                <SessionWorkspace
                                    {workspace}
                                    {now}
                                    {armedResume}
                                    isHidden={hidden}
                                    onresume={resume}
                                    ondismiss={dismiss}
                                    ontranscript={openTranscript}
                                    onpinned={openPinnedSession}
                                />
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .failure {
        margin: 0;
        color: var(--c-red-txt, var(--ink));
        font-size: var(--fs-md);
    }
    .ended-h {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        border: 0;
        border-top: 1px solid var(--line);
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-sm);
        text-align: left;
        padding: 4px 0;
        cursor: pointer;
    }
    .ended-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    :global(body.rice) .list {
        font-family: var(--font-mono);
    }
</style>
