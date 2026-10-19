<script module lang="ts">
    // Layer 3, view registration. Transcript follows Terminal in the Sessions page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'transcript',
        label: 'sessions.view_transcript',
        glyph: 'sessions.transcript_glyph',
        group: 'sessions',
        order: 2
    };
</script>

<script lang="ts">
    // Layer 3, view. The conversation of the selected session: what was asked, what the agent
    // answered, and every tool it called on the way, oldest first.
    //
    // The turns are not in the snapshot. state/sessions/transcript.svelte.ts fetches them for the
    // session on screen, holds them in the client's query client and follows the file from an
    // effect: the record's lastActivity moving is the transcript being written, and that is what
    // asks for the bytes appended since the last read.
    //
    // An assistant turn is rendered Markdown, drawn with {@html} through ui/html.ts's sanitise: the
    // turn is what an agent wrote into a file on disk, so the markup is filtered to that profile
    // before it reaches the page. A user turn keeps its own line breaks and is never rendered.
    //
    // Under the conversation sits the prompt box that steers the session, which works for a
    // session running in a terminal oculus started and says so for any other.
    //
    // A tab opened from an agent row of the Session details shows that subagent's own transcript:
    // its saved state names the session and the agent, and it has no session picker and no prompt
    // box, since the agent is steered through the session that started it.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import PickSession from '$lib/views/shared/sessions/PickSession.svelte';
    import SessionPicker from '$lib/views/shared/sessions/SessionPicker.svelte';
    import SteerBox from '$lib/views/shared/sessions/SteerBox.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { sanitise } from '$lib/ui/html';
    import { clock } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import { followTab, pinnedAgent, type Turn } from '$lib/state/sessions/transcript.svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { sessionFor },
        terminals: { terminalOfSession },
        transcripts: { follow, showing, turnsFor }
    } = useState();

    let { instance }: ViewProps = $props();

    const record = $derived(sessionFor(instance.id));
    /**
     * The session's id, which the effects that fetch and hold its turns read. The sessions channel
     * hands every record anew with each message, so an effect reading the record re-runs at every
     * write of any session; a derived of the id changes only when the session does.
     */
    const sessionId = $derived(record?.id ?? '');
    /** The subagent this tab shows, or the empty text for the session's own transcript. */
    const agent = $derived(pinnedAgent(instance.state));
    const held = $derived(turnsFor(sessionId, agent));
    const turns = $derived(held.turns);

    let column: HTMLDivElement | undefined = $state();

    /** The session whose turns are on screen. A change to it sends the column to the foot. */
    let shown = '';

    /**
     * Whether the reader was at the foot the last time the column scrolled. It is kept by the
     * scroll listener rather than measured in the effect, because the effect runs after the
     * appended turns are in the DOM, when the old position is no longer at the foot of the new
     * height.
     */
    let stuck = true;

    /** Pixels from the foot that still count as reading the newest turn. */
    const SLACK = 40;

    // The record is read by this effect, so it re-runs at each sessions message and hands follow()
    // the tab's mark of that message (state/sessions/transcript.svelte.ts, followTab).
    followTab(follow, () => ({ id: sessionId, agent, record }));

    // The store keeps a transcript's turns while an instance is showing it and drops them when the
    // last one stops; the effect's cleanup is that release, so a change of session or a teardown
    // lets go. It reads the id and never the record, so a new record of the same session keeps the
    // turns held and the next read asks only from the offset held.
    $effect(() => showing(sessionId, agent));

    $effect(() => {
        const id = sessionId;
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

    /** What the block is labelled: who said it, or that a tool was called. */
    function roleLabel(role: string): string {
        if (role === 'user') return t('sessions.turn_user');
        if (role === 'assistant') return t('sessions.turn_assistant');
        return t('sessions.turn_tool');
    }

    /** The tag on a tool turn: how the call ended, or that it is still out. */
    function okLabel(ok: boolean | null): string {
        if (ok === null) return t('sessions.turn_running');
        return ok ? t('sessions.turn_ok') : t('sessions.turn_error');
    }

    /** The hue of that outcome: green for a call that came back, red for one that failed. */
    function okTone(ok: boolean | null): string | undefined {
        if (ok === null) return undefined;
        return ok ? 'green' : 'red';
    }

    function key(turn: Turn, at: number): string {
        return `${at}:${turn.at ?? ''}`;
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.turn_toolbar')} overflow>
        <ToolButton
            bare
            label={t('sessions.turn_end')}
            glyph={t('sessions.turn_end_glyph')}
            onclick={() => toFoot()}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('sessions.turn_bar')}>
        <SessionPicker instance={instance.id} />
    </Toolbar>
{/snippet}

<Pane
    title={t('sessions.view_transcript')}
    toolbar={tools}
    bar={agent === '' ? bar : undefined}
    tinted
>
    <div class="frame">
        <div
            class="chat"
            bind:this={column}
            onscroll={scrolled}
            data-instance={instance.id}
            data-scroll
        >
            {#if record === null}
                <PickSession
                    message={t('sessions.detail_empty')}
                    glyph={t('sessions.empty_glyph')}
                />
            {:else if held.error !== ''}
                <Empty error message={held.error} />
            {:else if turns.length === 0}
                <!-- The sentence is for a read that landed with no turns; a read still out draws
                     nothing. -->
                {#if !held.pending}
                    <Empty message={t('sessions.turns_empty')} glyph={t('sessions.empty_glyph')} />
                {/if}
            {:else}
                {#each turns as turn, at (key(turn, at))}
                    <div class="turn {turn.role}">
                        <div class="head">
                            <span class="who">{roleLabel(turn.role)}</span>
                            <span class="ts">{clock(turn.at)}</span>
                            {#if turn.tool !== null}
                                <span class="name">{turn.tool.name}</span>
                                <span class="sum" title={turn.tool.summary}
                                    >{turn.tool.summary}</span
                                >
                                <Tag label={okLabel(turn.tool.ok)} tone={okTone(turn.tool.ok)} />
                            {/if}
                        </div>
                        {#if turn.role === 'assistant'}
                            <!-- eslint-disable-next-line svelte/no-at-html-tags -- the sanitiser writes this -->
                            <div class="doc">{@html sanitise(turn.html)}</div>
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
        {#if record !== null && agent === ''}
            <SteerBox terminal={terminalOfSession(record)} small />
        {/if}
    </div>
</Pane>

<style>
    .frame {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
    }

    .chat {
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    /* A turn's words are the size of a sidebar's, `--fs-sm`, and a heading of an answer one step
       above, `--fs-md`. */
    .turn {
        min-width: 0;
        font-size: var(--fs-sm);
    }

    /* The head of a turn is one line of the tree's row height. */
    .head {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
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
        font-size: var(--fs-sm);
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
        font-size: var(--fs-sm);
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
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The document block of a rendered answer, as the project view draws a README. */
    .doc {
        margin-top: 2px;
        font-size: var(--fs-sm);
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

    /* The box this view fills carries the translucent surface over a picture, and a second one
       inside it would read as a single nearly solid layer, so the code block paints nothing. */
    :global(body.wall) .doc :global(pre) {
        background: transparent;
    }

    .doc :global(pre) {
        padding: 6px 8px;
        overflow-x: auto;
        background: var(--chip);
        border-radius: 4px;
    }

    /* The terminal shape: a log, in the face a log is read in. */
    :global(body.rice:where(:not(.rice-sans))) .chat {
        font-family: var(--font-mono);
    }
</style>
