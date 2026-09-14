<script module lang="ts">
    // Layer 3, view. Exported session and terminal menu item builders supply the row menus and their tests.

    import type { MenuItem } from '$lib/ui/Menu.svelte';
    import { t } from '$lib/state/text';
    import type { ViewRegistration } from '$lib/views/registry';

    export const registration: ViewRegistration = {
        id: 'session-list',
        label: 'sessions.rail_title',
        glyph: 'sessions.rail_glyph',
        group: 'sessions',
        order: 0
    };

    type SessionRow = { id: string; live: boolean; cwd: string | null };

    /** The actions in a session row's menu, including the pinned pane available on every row. */
    export function sessionRowItems(row: SessionRow, armedResume: string): MenuItem[] {
        const items: MenuItem[] = [
            {
                id: 'pinned',
                label: t('sessions.open_pinned'),
                title: t('sessions.open_pinned_tip')
            },
            {
                id: 'transcript',
                label: t('sessions.transcript_open'),
                glyph: t('sessions.transcript_glyph')
            }
        ];
        if (!row.live) {
            items.push({
                id: 'resume',
                label:
                    armedResume === row.id
                        ? t('sessions.resume_confirm', row.cwd ?? '')
                        : t('sessions.resume'),
                glyph: t('sessions.resume_glyph')
            });
        }
        return items;
    }

    /** The action in a terminal row's menu. */
    export function terminalRowItems(): MenuItem[] {
        return [
            {
                id: 'pinned',
                label: t('sessions.open_pinned'),
                title: t('sessions.open_pinned_tip')
            }
        ];
    }
</script>

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
    import Menu from '$lib/ui/Menu.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { clock, modelShort, stamp } from '$lib/state/format';
    import { openView, workbench } from '$lib/state/layout.svelte';
    import { findView } from '$lib/state/layout';
    import { select, selected } from '$lib/state/selection.svelte';
    import {
        sessionsByWorkspace,
        type Area,
        type GroupedSession,
        type Workspace
    } from '$lib/state/selectors.svelte';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import {
        resumeRefusal,
        resumeTerminal,
        stopTerminal,
        terminals,
        type Terminal,
        type TerminalKind
    } from '$lib/state/terminals.svelte';
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

    /** What the last dismissal or stop failed with, or the empty string when none did. */
    let failure = $state('');

    /**
     * The terminal whose stop control is armed, or the empty string when none is. Stopping ends the
     * tmux session and everything in it, so the control asks once before it acts.
     */
    let arming = $state('');

    /**
     * The session whose resume has been asked once, or the empty string. Resuming runs the agent
     * again on the same transcript (DESIGN.md's explicit migration), so the row's menu asks twice:
     * the first pick arms it and the item then reads what the second pick will do.
     */
    let armedResume = $state('');

    /** Read once, so the stamps of one rendering all agree on what day it is. */
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
        if (row.liveStatus === 'busy') return t('sessions.live_busy');
        if (row.liveStatus === 'idle') return t('sessions.live_idle');
        return row.liveStatus ?? '';
    }

    /** The last thing that happened: the newest timeline event, and the last prompt before any. */
    function activity(row: GroupedSession): string {
        const event = row.timeline.length > 0 ? row.timeline[row.timeline.length - 1] : null;
        if (event === null) return row.lastPrompt;
        if (event.kind === 'turn') {
            return t(
                'sessions.activity_turn',
                String(Math.round((Number(event.text) || 0) / 1000))
            );
        }
        const text = String(event.text ?? '');
        const at = text.lastIndexOf('/');
        return at < 0 ? text : text.slice(at + 1);
    }

    /** The glyph a terminal's kind is drawn with. One call per kind, so every key is a literal. */
    function kindGlyph(kind: TerminalKind): string {
        if (kind === 'claude') return t('sessions.kind_claude_glyph');
        if (kind === 'codex') return t('sessions.kind_codex_glyph');
        return t('sessions.kind_shell_glyph');
    }

    /** The last segment of a path, which is what a terminal's row has room for. */
    function basename(path: string): string {
        const at = path.lastIndexOf('/');
        return at < 0 ? path : path.slice(at + 1);
    }

    /** Stop one terminal, once the control has been armed. */
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

    /**
     * Show one row's turns. The row becomes the selection first, since the transcript view draws the
     * selected session; a transcript view already up is activated rather than a second one opened.
     */
    function openTranscript(row: GroupedSession): void {
        select(row.id);
        const where = findView(workbench().panel, 'transcript') !== null ? 'panel' : 'main';
        openView('transcript', where);
    }

    /** Open one session as a labelled detail tab that no later selection retargets. */
    function openPinnedSession(row: GroupedSession): void {
        openView('session-detail', 'main', { session: row.id, label: row.title });
    }

    /** Open one terminal as a labelled tab that no later selection retargets. */
    function openPinnedTerminal(entry: Terminal): void {
        openView('terminal', 'main', { session: entry.id, label: entry.name });
    }

    /** Whether an unpinned terminal is already up and will follow a resumed terminal. */
    function terminalOpen(): boolean {
        const trees = [workbench().main, workbench().panel];
        return trees.some((tree) => findView(tree, 'terminal', null) !== null);
    }

    /**
     * Continue an ended session in a terminal. The server reads the directory and the title off the
     * record, so only the tool and the id go out; on success the new terminal is the selection, and
     * a terminal view opens when none is showing.
     */
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

    /** Dismiss a row, or bring it back. The rail moves on the click; the write follows it. */
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
                {#if entry.pinned}
                    <span class="pin" title={t('sessions.pin_mark')}>
                        <Glyph name={t('project.card.pin_glyph')} />
                    </span>
                {/if}
                {#if entry.hook?.event === 'notification' && entry.hook.kind === 'permission_prompt'}
                    <span class="hook" title={entry.hook.message ?? ''}>
                        <Chip label={t('notify.permission_chip')} tone="amber" />
                    </span>
                {:else if entry.hook?.event === 'notification' && entry.hook.kind === 'idle_prompt'}
                    <Chip label={t('notify.idle_chip')} />
                {/if}
            </span>
            <span class="meta">
                {#if entry.live}
                    <span class="live">{liveLabel(entry)}</span>
                    <span class="sep">{t('sessions.meta_sep')}</span>
                {/if}
                <span class="mo">{modelShort(entry.model)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="ts">{stamp(entry.started, now)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="act">{activity(entry)}</span>
                {#if entry.hook?.event === 'stop'}
                    <span class="sep">{t('sessions.meta_sep')}</span>
                    <span class="stopped">{t('sessions.stopped_at', clock(entry.hook.at))}</span>
                {/if}
                {#each entry.secondaryAreas as area (area.key)}
                    <Chip label={area.short === '' ? area.key : area.short} />
                {/each}
            </span>
        </button>
        <div class="menu">
            <Menu
                label={t('ui.row_menu')}
                items={sessionRowItems(entry, armedResume)}
                glyph={t('ui.pane_menu_glyph')}
                compact
                placement="down"
                align="right"
                onpick={(id) => {
                    if (id === 'pinned') openPinnedSession(entry);
                    if (id === 'resume') void resume(entry);
                    if (id === 'transcript') openTranscript(entry);
                }}
            />
        </div>
        {#if !entry.live}
            <button
                type="button"
                class="hide"
                title={away ? t('sessions.restore_tip') : t('sessions.close_tip')}
                aria-label={away ? t('sessions.restore_tip') : t('sessions.close_tip')}
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
                <span class="unknown">{t('sessions.area_unknown')}</span>
            {/if}
        </div>
        {#each area.sessions as entry (entry.id)}
            {@render row(entry)}
        {/each}
    </div>
{/snippet}

{#snippet terminalRow(entry: Terminal)}
    <div class="row" class:on={entry.id === selected()}>
        <button
            type="button"
            class="pick"
            title={t('sessions.select_tip')}
            onclick={() => select(entry.id)}
        >
            <span class="top">
                <Glyph name={kindGlyph(entry.kind)} />
                <Chip label={entry.kind} />
                <span class="nm">{entry.name}</span>
            </span>
            <span class="meta">
                <span class="act">{basename(entry.cwd)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="ts">{stamp(entry.created, now)}</span>
            </span>
        </button>
        <div class="menu">
            <Menu
                label={t('ui.row_menu')}
                items={terminalRowItems()}
                glyph={t('ui.pane_menu_glyph')}
                compact
                placement="down"
                align="right"
                onpick={(picked) => {
                    if (picked === 'pinned') openPinnedTerminal(entry);
                }}
            />
        </div>
        <button
            type="button"
            class="hide"
            title={arming === entry.id ? t('sessions.confirm_stop') : t('sessions.stop_terminal')}
            aria-label={arming === entry.id ? t('ui.confirm_stop') : t('sessions.stop_terminal')}
            onclick={() => void stop(entry)}
        >
            {#if arming === entry.id}
                <span class="confirm">{t('ui.confirm_stop')}</span>
            {:else}
                <Glyph name={t('sessions.dismiss_glyph')} />
            {/if}
        </button>
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

{#snippet terminalSection()}
    {#if panes.length > 0}
        <div class="ws">
            <div class="ws-h">
                <span class="nm">{t('sessions.terminals')}</span>
                <span class="n">{panes.length}</span>
            </div>
            <div class="area">
                {#each panes as pane (pane.id)}
                    {@render terminalRow(pane)}
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

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

<Pane title={t('sessions.rail_title')} toolbar={tools}>
    <div class="list" data-instance={instance.id}>
        {#if failure !== ''}
            <p class="failure">{failure}</p>
        {/if}
        {#if rows.length === 0 && panes.length === 0}
            <Empty message={t('sessions.state_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each live as workspace (workspace.key)}
                {@render workspaceOf(workspace)}
            {/each}
            {@render terminalSection()}
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
        font-size: var(--fs-md);
    }

    .row .menu {
        display: flex;
        align-items: center;
    }

    .ws-h,
    .area-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
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

    .hide .confirm {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
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

    /* The row's title at the list's own size: the page's base size is the largest step, and a
       session's title is one line among many rather than a heading. */
    .top .pin,
    .top .hook {
        flex: none;
        font-size: var(--fs-3xs);
    }

    .top .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
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

    .meta .ts {
        font-size: var(--fs-xs);
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

    /* The terminal shape: the rail is a monospace column, which is where its alignment comes from. */
    :global(body.rice) .list {
        font-family: var(--font-mono);
    }
</style>
