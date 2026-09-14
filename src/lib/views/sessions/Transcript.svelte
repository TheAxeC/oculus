<script module lang="ts">
    // Layer 3, view registration. Transcript follows Terminal in the sessions flyout.
    import type { ViewRegistration } from '$lib/views/registry';
    export const registration: ViewRegistration = {
        id: 'transcript',
        label: 'sessions.view_transcript',
        glyph: 'sessions.transcript_glyph',
        group: 'sessions',
        order: 3
    };
</script>

<script lang="ts">
    // Layer 3, view. The conversation of the selected session: what was asked, what the agent
    // answered, and every tool it called on the way, oldest first.
    //
    // The turns are not in the snapshot. state/transcript.svelte.ts fetches them for the session on
    // screen and follows the file from an effect: the record's lastActivity moving is the transcript
    // being written, and that is what asks for the bytes appended since the last read.
    //
    // An assistant turn is rendered Markdown, drawn with {@html} unsanitised, because it is the
    // owner's own agent's output from the owner's own disk; server/sessions/turns.ts says the same
    // at greater length. A user turn keeps its own line breaks and is never rendered.

    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { clock } from '$lib/state/format';
    import { instanceLayoutState, pinInstance, unpinInstance } from '$lib/state/layout.svelte';
    import { pinnedSession } from '$lib/state/selection.svelte';
    import { sessionFor } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { follow, turnsFor, type Turn } from '$lib/state/transcript.svelte';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();

    const record = $derived(sessionFor(instance.id));
    const panePin = $derived(pinnedSession(instanceLayoutState(instance.id)));
    const held = $derived(turnsFor(record?.id ?? ''));
    const turns = $derived(held.turns);

    let column: HTMLDivElement | undefined = $state(undefined);

    /** The session whose turns are on screen. A change to it sends the column to the foot. */
    let shown = '';

    /**
     * Whether the reader was at the foot the last time the column scrolled. It is kept by the scroll
     * listener rather than measured in the effect, because the effect runs after the appended turns
     * are in the DOM, when the old position is no longer at the foot of the new height.
     */
    let stuck = true;

    /** Pixels from the foot that still count as reading the newest turn. */
    const SLACK = 40;

    $effect(() => {
        const id = record?.id ?? '';
        if (id !== '') follow(id, record?.lastActivity ?? null);
    });

    $effect(() => {
        const id = record?.id ?? '';
        // The count is read here as well as the id, so an appended turn re-runs this too; then the
        // column follows the newest turn only if the reader was at the foot before it was appended.
        const count = turns.length;
        const box = column;
        if (box === undefined || count === 0) return;
        const fresh = id !== shown;
        if (!fresh && !stuck) return;
        shown = id;
        stuck = true;
        toFoot();
    });

    function atFoot(box: HTMLDivElement): boolean {
        return box.scrollTop + box.clientHeight >= box.scrollHeight - SLACK;
    }

    function scrolled(): void {
        if (column !== undefined) stuck = atFoot(column);
    }

    function toFoot(): void {
        if (column === undefined) return;
        column.scrollTop = column.scrollHeight;
    }

    /** Pin this transcript to what it shows, or return it to following the selection. */
    function togglePanePin(): void {
        if (panePin !== null) {
            unpinInstance(instance.id);
            return;
        }
        if (record !== null) {
            pinInstance(instance.id, record.id, record.title);
        }
    }

    /** What the block is labelled: who said it, or that a tool was called. */
    function roleLabel(role: string): string {
        if (role === 'user') return t('sessions.turn_user');
        if (role === 'assistant') return t('sessions.turn_assistant');
        return t('sessions.turn_tool');
    }

    /** The chip on a tool turn: how the call ended, or that it is still out. */
    function okLabel(ok: boolean | null): string {
        if (ok === null) return t('sessions.turn_running');
        return ok ? t('sessions.turn_ok') : t('sessions.turn_error');
    }

    function okTone(ok: boolean | null): string | undefined {
        if (ok === null) return undefined;
        return ok ? 'green' : 'red';
    }

    function key(turn: Turn, at: number): string {
        return `${at}:${turn.at ?? ''}`;
    }
</script>

<Pane title={t('sessions.view_transcript')}>
    {#snippet toolbar()}
        <Toolbar label={t('sessions.turn_toolbar')}>
            {#if record !== null || panePin !== null}
                <ToolButton
                    label={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                    title={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                    pressed={panePin !== null}
                    onclick={togglePanePin}
                />
            {/if}
            <ToolButton
                label={t('sessions.turn_end')}
                glyph={t('sessions.turn_end_glyph')}
                title={t('sessions.turn_end')}
                onclick={() => toFoot()}
            />
        </Toolbar>
    {/snippet}
    <div
        class="chat"
        bind:this={column}
        onscroll={scrolled}
        data-instance={instance.id}
        data-scroll
    >
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else if held.error !== ''}
            <p class="failed">{held.error}</p>
        {:else if turns.length === 0}
            <Empty message={t('sessions.turns_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each turns as turn, at (key(turn, at))}
                <div class="turn {turn.role}">
                    <div class="head">
                        <span class="who">{roleLabel(turn.role)}</span>
                        <span class="ts">{clock(turn.at)}</span>
                        {#if turn.tool !== null}
                            <span class="name">{turn.tool.name}</span>
                            <span class="sum" title={turn.tool.summary}>{turn.tool.summary}</span>
                            <Chip label={okLabel(turn.tool.ok)} tone={okTone(turn.tool.ok)} />
                        {/if}
                    </div>
                    {#if turn.role === 'assistant'}
                        <div class="doc">{@html turn.html}</div>
                    {:else if turn.role === 'user'}
                        <div class="said">{turn.text}</div>
                    {/if}
                    {#if turn.cut}
                        <p class="cut">{t('sessions.turn_cut')}</p>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    .chat {
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: 100%;
        overflow: auto;
    }

    .turn {
        min-width: 0;
        font-size: var(--fs-md);
    }

    .turn.tool {
        font-size: var(--fs-sm);
    }

    .head {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
    }

    .who {
        flex: 0 0 auto;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .ts {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .name {
        flex: 0 0 auto;
        font-family: var(--font-mono);
        color: var(--ink-txt, var(--ink));
    }

    .sum {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted-txt, var(--muted));
    }

    .said {
        margin-top: 2px;
        padding-left: 8px;
        border-left: 2px solid var(--line);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: var(--ink-txt, var(--ink));
    }

    .cut {
        margin: 2px 0 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .failed {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The document block of a rendered answer, as the project view draws a README. */
    .doc {
        margin-top: 2px;
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
        overflow-wrap: anywhere;
    }

    .doc :global(h1),
    .doc :global(h2),
    .doc :global(h3),
    .doc :global(h4) {
        margin: 10px 0 4px;
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
    }

    .doc :global(p),
    .doc :global(ul),
    .doc :global(ol) {
        margin: 4px 0;
    }

    .doc :global(a) {
        color: var(--accent-txt, var(--accent));
    }

    .doc :global(code),
    .doc :global(pre) {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
    }

    :global(body.wall) .doc :global(pre) {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .doc :global(pre) {
        padding: 6px 8px;
        overflow-x: auto;
        background: var(--chip);
        border-radius: 4px;
    }

    /* The terminal shape: a log, in the face a log is read in. */
    :global(body.rice) .chat {
        font-family: var(--font-mono);
    }
</style>
