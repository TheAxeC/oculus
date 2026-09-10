<script lang="ts">
    // Layer 3, view. The rail of sessions: every workspace, its areas, and the rows in them, newest
    // activity first at every level, which is the order the payload already carries.
    //
    // It is the one session view that writes the selection; the other five read it. What it keeps
    // for itself is which of the two collapsed sets are open, and that goes in its own instance
    // state, so two lists can be open on different sets.
    //
    // A dismissal is written through api/write and shown at once: the row's own flag is flipped here
    // and the write is sent after, since the server re-reads the overrides file only when it
    // rescans, and an ended session's transcript is not going to change again.

    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { modelShort, stamp } from '$lib/state/format';
    import { select, selected } from '$lib/state/selection.svelte';
    import {
        sessionsByWorkspace,
        type Area,
        type GroupedSession,
        type Workspace
    } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import { writeSession } from '$lib/state/writes.svelte';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();

    /** What the list remembers: whether the two collapsed sets are open. */
    type ListState = { ended: boolean; dismissed: boolean };

    /**
     * The rows dismissed or restored since the payload was last pushed, by session id. The server
     * writes the overrides file, but it republishes the payload only when it rescans, and a rescan
     * follows a transcript changing; an ended session's transcript never changes again.
     */
    let flipped: Record<string, boolean> = $state({});

    /** What the last dismissal failed with, or the empty string when none did. */
    let failure = $state('');

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    const opened = $derived(readState(instanceState(instance.id)));
    const tree = $derived(sessionsByWorkspace(true));
    const rows = $derived(tree.flatMap((workspace) => workspace.areas.flatMap((a) => a.sessions)));
    const dismissed = $derived(rows.filter((row) => hidden(row)).length);
    const endedCount = $derived(rows.filter((row) => !row.live && !hidden(row)).length);
    const live = $derived(prune(tree, (row) => row.live));
    const ended = $derived(prune(tree, (row) => !row.live && (opened.dismissed || !hidden(row))));

    function readState(saved: unknown): ListState {
        if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) {
            return { ended: false, dismissed: false };
        }
        const held = saved as Record<string, unknown>;
        return { ended: held.ended === true, dismissed: held.dismissed === true };
    }

    function write(next: Partial<ListState>): void {
        setInstanceState(instance.id, { ...opened, ...next });
    }

    /** Whether a row is dismissed, taking the click that has not been read back yet first. */
    function hidden(row: GroupedSession): boolean {
        return flipped[row.id] ?? row.hidden;
    }

    /** The same tree with the rows a predicate rejects taken out, and no empty heading left. */
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

    /** How many rows a workspace's areas hold between them. */
    function count(workspace: Workspace): number {
        return workspace.areas.reduce((total, area) => total + area.sessions.length, 0);
    }

    /** The hue of the state dot: what the session is doing, as the rail reads it at a glance. */
    function dotTone(row: GroupedSession): string {
        if (row.state === 'working') return 'green';
        if (row.state === 'idle') return 'amber';
        if (row.state === 'ended') return 'grey';
        return 'slate';
    }

    function dotStyle(row: GroupedSession): string {
        return `--tone: var(--c-${dotTone(row)})`;
    }

    /** What the registry says the process is doing, in words beside the colour of the dot. */
    function liveLabel(row: GroupedSession): string {
        if (row.liveStatus === 'busy') return t('js.sessions.live_busy');
        if (row.liveStatus === 'idle') return t('js.sessions.live_idle');
        return row.liveStatus ?? '';
    }

    /** The last thing that happened: the newest timeline event, and the last prompt before any. */
    function activity(row: GroupedSession): string {
        const event = row.timeline.length > 0 ? row.timeline[row.timeline.length - 1] : null;
        if (event === null) return row.lastPrompt;
        if (event.kind === 'turn') {
            return t(
                'js.sessions.activity_turn',
                String(Math.round((Number(event.text) || 0) / 1000))
            );
        }
        const text = String(event.text ?? '');
        const at = text.lastIndexOf('/');
        return at < 0 ? text : text.slice(at + 1);
    }

    /** Dismiss a row, or bring it back. The rail moves on the click; the write follows it. */
    async function dismiss(row: GroupedSession): Promise<void> {
        const next = !hidden(row);
        flipped = { ...flipped, [row.id]: next };
        failure = '';
        const answer = await writeSession(row.id, next);
        if (answer.ok) return;
        flipped = { ...flipped, [row.id]: !next };
        failure = t('js.sessions.dismiss_failed');
    }
</script>

{#snippet row(entry: GroupedSession)}
    {@const away = hidden(entry)}
    <div class="row" class:on={entry.id === selected()} class:away>
        <button
            type="button"
            class="pick"
            title={t('sessions.select_tip')}
            onclick={() => select(entry.id)}
        >
            <span class="top">
                <span class="dot" class:observed={entry.kind === 'observed'} style={dotStyle(entry)}
                ></span>
                <Chip label={entry.tool} />
                <span class="nm">{entry.title}</span>
            </span>
            <span class="meta">
                {#if entry.live}
                    <span class="live">{liveLabel(entry)}</span>
                    <span class="sep">{t('js.sessions.meta_sep')}</span>
                {/if}
                <span class="mo">{modelShort(entry.model)}</span>
                <span class="sep">{t('js.sessions.meta_sep')}</span>
                <span class="ts">{stamp(entry.started, now)}</span>
                <span class="sep">{t('js.sessions.meta_sep')}</span>
                <span class="act">{activity(entry)}</span>
                {#each entry.secondaryAreas as area (area.key)}
                    <Chip label={area.short === '' ? area.key : area.short} />
                {/each}
            </span>
        </button>
        {#if !entry.live}
            <button
                type="button"
                class="hide"
                title={away ? t('js.sessions.restore_tip') : t('js.sessions.close_tip')}
                aria-label={away ? t('js.sessions.restore_tip') : t('js.sessions.close_tip')}
                onclick={() => dismiss(entry)}
            >
                {#if away}
                    <Glyph name={t('sessions.restore_glyph')} />
                {:else}
                    <Glyph name={t('sessions.dismiss_glyph')} />
                {/if}
            </button>
        {/if}
    </div>
{/snippet}

{#snippet areaOf(area: Area)}
    <div class="area">
        <div class="area-h" title={area.full}>
            <span class="short">{area.short === '' ? area.key : area.short}</span>
            {#if !area.known}
                <span class="unknown">{t('js.sessions.area_unknown')}</span>
            {/if}
        </div>
        {#each area.sessions as entry (entry.id)}
            {@render row(entry)}
        {/each}
    </div>
{/snippet}

{#snippet workspaceOf(workspace: Workspace)}
    <div class="ws">
        <div class="ws-h">
            <span class="nm">{workspace.name === '' ? workspace.key : workspace.name}</span>
            <span class="n">{count(workspace)}</span>
        </div>
        {#each workspace.areas as area (area.key)}
            {@render areaOf(area)}
        {/each}
    </div>
{/snippet}

{#snippet tools()}
    <Toolbar label={t('sessions.list_toolbar')}>
        {#if dismissed > 0}
            <ToolButton
                label={opened.dismissed
                    ? t('js.sessions.hide_dismissed', dismissed)
                    : t('js.sessions.show_dismissed', dismissed)}
                active={opened.dismissed}
                onclick={() => write({ dismissed: !opened.dismissed })}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('sessions.rail_title')} toolbar={tools}>
    <div class="list" data-instance={instance.id}>
        {#if failure !== ''}
            <p class="failure">{failure}</p>
        {/if}
        {#if rows.length === 0}
            <Empty message={t('js.sessions.state_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each live as workspace (workspace.key)}
                {@render workspaceOf(workspace)}
            {/each}
            {#if ended.length > 0}
                <div class="ended" class:open={opened.ended}>
                    <button
                        type="button"
                        class="ended-h"
                        aria-expanded={opened.ended}
                        onclick={() => write({ ended: !opened.ended })}
                    >
                        <Glyph name={t('sessions.ended_glyph')} />
                        <span>{t('js.sessions.ended_section', endedCount)}</span>
                    </button>
                    {#if opened.ended}
                        <div class="ended-body">
                            {#each ended as workspace (workspace.key)}
                                {@render workspaceOf(workspace)}
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
        font-size: var(--fs-sm);
    }

    .ws-h,
    .area-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .ws-h {
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
    }

    .ws-h .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .ws-h .n {
        margin-left: auto;
        font-family: var(--font-num);
    }

    .area {
        margin-top: 6px;
        padding-left: 6px;
    }

    .area-h .unknown {
        text-transform: none;
        letter-spacing: 0;
        opacity: 0.7;
    }

    .row {
        display: flex;
        align-items: stretch;
        gap: 2px;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
    }

    .row.on {
        border-color: var(--accent);
    }

    .row.away {
        opacity: 0.55;
    }

    .pick {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1 1 auto;
        min-width: 0;
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        text-align: left;
        padding: 4px 6px;
        cursor: pointer;
    }

    .pick:hover,
    .hide:hover {
        background: var(--chip);
    }

    .pick:focus-visible,
    .hide:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    .top,
    .meta {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }

    .top .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .meta {
        flex-wrap: wrap;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .meta .act {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sep {
        opacity: 0.5;
    }

    .dot {
        flex: 0 0 auto;
        width: 8px;
        height: 8px;
        border-radius: var(--radius-pill);
        background: var(--tone);
    }

    /* A session oculus only reads the transcript of is drawn back: it is here, and it is not ours. */
    .dot.observed {
        opacity: 0.45;
    }

    .hide {
        flex: 0 0 auto;
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        padding: 0 4px;
        cursor: pointer;
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
        font-size: var(--fs-xs);
        text-align: left;
        padding: 4px 0;
        cursor: pointer;
    }

    .ended-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    /* The terminal shape: the rail is a monospace column, which is where its alignment comes from. */
    :global(body.rice) .list {
        font-family: var(--font-mono);
    }
</style>
