<script lang="ts">
    // Layer 3, view partial of Terminal.svelte. The conversation of the session a Terminal tab
    // reads, oldest first, drawn in place of the tab's row of grids while the tab's switch stands
    // on Transcript, so that who said what reads at a glance:
    //
    // - A person's turn opens an exchange: a line above it, a wider gap, the accent bar and the
    //   person's words at the size of a row's main words. Off a wallpaper it takes the chip
    //   surface; over one nothing is painted behind a turn, since the box this view fills is that
    //   surface.
    // - An answer draws as a document at full ink. It draws its head only when the minute moved
    //   since the last head (turn-rows.ts, `groupTurns`).
    // - Tool calls are muted and small. Calls next to each other make one run, which is one line
    //   while closed (TurnRun.svelte). A press chooses open or closed and the choice holds; a run
    //   no press chose stands open while it holds a failed call, whenever that result arrives, so
    //   a failure is never behind a press.
    //
    // The turns are not in the snapshot. state/sessions/transcript.svelte.ts fetches them for the
    // session on screen, holds them in the client's query client and follows the file from an
    // effect: the record's lastActivity moving is the transcript being written, and that is what
    // asks for the bytes appended since the last read. This component is mounted only while
    // Transcript shows, so a tab on Live fetches and follows nothing.
    //
    // An answer is what an agent wrote into a file on disk. shared/prose/Markdown.svelte draws it,
    // which sanitises it once and brings the document rules, the Copy control of a code block and
    // the prose menu. A person's turn keeps its own line breaks and is never rendered.
    //
    // The turns draw at the terminal grid's size, never below `--fs-sm`, so the font buttons of the
    // tab's bar size them as they size a grid. `--fs-*` resolve at the root, so a descendant cannot
    // rescale them; an inner box inside the scroller takes CSS `zoom` instead (terminal-list.ts,
    // `transcriptZoom`). The scroller itself is not zoomed, so its measures stay the ones the foot
    // rule reads.
    //
    // Under the conversation sits the prompt box that steers the session through its terminal, read
    // only for a session with no terminal. A tab opened from an agent row of the Session details
    // reads that subagent's own transcript and has no prompt box, since the agent is steered
    // through the session that started it.

    import { tick, untrack } from 'svelte';
    import { SvelteMap } from 'svelte/reactivity';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Markdown from '$lib/views/shared/prose/Markdown.svelte';
    import SteerBox from '$lib/views/shared/sessions/SteerBox.svelte';
    import { clock } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import { followTab, type Turn } from '$lib/state/sessions/transcript.svelte';
    import { useState } from '$lib/state/client/use';
    import { transcriptZoom } from '../terminal-list';
    import TurnRun from './TurnRun.svelte';
    import {
        groupTurns,
        relativeLink,
        runKey,
        runOpen,
        turnDocs,
        type RunChoice
    } from './turn-rows';

    type Props = {
        /** The session the tab reads. */
        session: string;
        /** The subagent the tab reads, or the empty text for the session's own transcript. */
        agent: string;
        /** Whether the tab is locked, which leaves the prompt box read-only. */
        locked: boolean;
    };

    let { session, agent, locked }: Props = $props();

    const {
        selectors: { sessionById },
        terminals: { terminalOfSession },
        transcripts: { follow, showing, turnsFor },
        ui: { terminalFont, textScale }
    } = useState();

    const record = $derived(sessionById(session));
    /**
     * The session's id, which the effects that fetch and hold its turns read. The sessions channel
     * hands every record anew with each message, so an effect reading the record re-runs at every
     * write of any session; a derived of the id changes only when the session does.
     */
    const sessionId = $derived(record?.id ?? '');
    const held = $derived(turnsFor(sessionId, agent));
    const turns = $derived(held.turns);
    const rows = $derived(groupTurns(turns));

    const docOf = turnDocs();

    /** What a press chose for each run, by `runKey`. */
    const chosen = new SvelteMap<string, RunChoice>();

    /**
     * What the choices belong to. The props are read through the tab's target, a new object at each
     * sessions message, so an effect reading them re-runs at every message; a derived of the words
     * changes only when the session or the agent does.
     */
    const target = $derived(JSON.stringify([session, agent]));

    // One component outlives its target, and a run's key means nothing in another transcript, so
    // a change of the session or the agent empties the choices before the new turns are drawn.
    $effect.pre(() => {
        if (target !== '') chosen.clear();
    });

    /** The zoom of the box of turns, as `transcriptZoom` gives it. */
    function fontZoom(): number {
        return transcriptZoom(terminalFont(), textScale() ?? 1);
    }

    let zoom = $state(fontZoom());

    /** Take the zoom again; once a new one is drawn, a reader who was at the foot stays there. */
    function retakeZoom(): void {
        const next = fontZoom();
        if (next === untrack(() => zoom)) return;
        zoom = next;
        void tick().then(() => {
            if (stuck) toFoot();
        });
    }

    // The zoom follows the font setting and the text scale, which this effect reads. A theme lands
    // on the body's attributes whenever its file arrives, which `--fs-md` is read through, so the
    // observer takes the zoom again however late that is.
    $effect(() => {
        retakeZoom();
        const watch = new MutationObserver(retakeZoom);
        watch.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
        return () => {
            watch.disconnect();
        };
    });

    /** The scroller, null once the component is torn down. */
    let column: HTMLDivElement | null | undefined = $state();

    /** The session whose turns are on screen. A change to it sends the column to the foot. */
    let shown = '';

    /**
     * Whether the reader was at the foot the last time the column scrolled. It is kept by the
     * scroll listener rather than measured in the effect, because the effect runs after the
     * appended turns are in the DOM, when the old position is above the foot of the new height.
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
        // The list is read here as well as the id, and an append or a patched result makes a new
        // list, so either re-runs this; then the column follows the newest turn only if the reader
        // was at the foot before. A result that opens a run grows the column as an append does. A
        // press on a run is not read here, so it moves nothing.
        const list = turns;
        const box = column;
        if (!box || list.length === 0) return;
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
        if (column) stuck = atFoot(column);
    }

    /** Scroll to the newest turn, which the tab's End tool asks for. */
    export function toFoot(): void {
        if (!column) return;
        column.scrollTop = column.scrollHeight;
    }

    /** The head's label: who said it. */
    function roleLabel(turn: Turn): string {
        return turn.role === 'user' ? t('sessions.turn_user') : t('sessions.turn_assistant');
    }

    /**
     * A press on a run closes it or opens it. Once drawn the foot is read again, since the press
     * moved the foot and not the reader, so one who opened the last run stays where it was opened
     * when the next turn is appended.
     */
    function pressRun(key: string, open: boolean): void {
        chosen.set(key, open ? 'closed' : 'opened');
        void tick().then(scrolled);
    }
</script>

<div class="frame">
    <div class="chat" bind:this={column} onscroll={scrolled} data-scroll>
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else if held.error !== ''}
            <Empty error message={held.error} />
        {:else if turns.length === 0}
            <!-- The sentence is for a read that landed with no turns; a read still out draws
                 nothing. -->
            {#if !held.pending}
                <Empty message={t('sessions.turns_empty')} glyph={t('sessions.empty_glyph')} />
            {/if}
        {:else}
            <div class="turns" style:zoom>
                {#each rows as row (row.first)}
                    {#if row.kind === 'said'}
                        {@const turn = row.turn}
                        <div class="turn" class:user={turn.role === 'user'}>
                            <div class="body">
                                {#if row.head}
                                    <div class="head">
                                        <span class="who">{roleLabel(turn)}</span>
                                        <span class="ts">{clock(turn.at)}</span>
                                    </div>
                                {/if}
                                {#if turn.role === 'user'}
                                    <div class="said">{turn.text}</div>
                                {:else}
                                    <div class="answer">
                                        <Markdown
                                            doc={docOf(turn)}
                                            loading=""
                                            failed=""
                                            onlink={relativeLink}
                                        />
                                    </div>
                                {/if}
                                {#if turn.cut}
                                    <p class="cut">{t('sessions.turn_cut')}</p>
                                {/if}
                            </div>
                        </div>
                    {:else if row.kind === 'run'}
                        {@const key = runKey(row)}
                        {@const open = runOpen(chosen.get(key), row.calls)}
                        <TurnRun
                            calls={row.calls}
                            {open}
                            onpress={() => {
                                pressRun(key, open);
                            }}
                        />
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
    {#if record !== null && agent === ''}
        <SteerBox terminal={terminalOfSession(record)} {locked} ended={!record.live} small />
    {/if}
</div>

<style>
    /* The tab's body insets this frame 4px 6px 6px; this padding brings the turns to 16px from the
       pane's edge, wider than a pane's text, since a long conversation is read here. */
    .frame {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        padding: 6px 10px 4px;
        box-sizing: border-box;
    }

    /* The right padding keeps the words off the scrollbar this box draws at its edge. */
    .chat {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding-right: 8px;
    }

    .turns {
        display: flex;
        flex: none;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
        line-height: 1.5;
    }

    .turn {
        min-width: 0;
    }

    /* A person's turn opens an exchange: the line above it with a wider gap on either side. */
    .user {
        margin-top: 10px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
    }

    .user:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: 0;
    }

    .user .body {
        padding: 4px 10px;
        border-left: 3px solid var(--accent-txt, var(--accent));
        border-radius: var(--radius-sm);
        background: var(--chip);
    }

    /* The box this view fills carries the translucent surface over a picture, and a second one
       inside it would read as a nearly solid layer, so a person's turn paints none of its own. */
    :global(body.wall) .user .body {
        background: transparent;
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

    .user .who {
        color: var(--accent-txt, var(--accent));
    }

    .ts {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }

    .said {
        max-width: 80ch;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    /* A heading of an answer sits under the view's own title, so none draws larger than this step.
       The selector names the answer and the document, which outranks Markdown.svelte's sizes. */
    .answer :global(.doc h1),
    .answer :global(.doc h2),
    .answer :global(.doc h3),
    .answer :global(.doc h4),
    .answer :global(.doc h5),
    .answer :global(.doc h6) {
        font-size: var(--fs-lg);
    }

    /* A wide pane draws no very long line of prose. A table and a code block keep the pane's width
       and scroll in their own box. */
    .answer :global(.doc h1),
    .answer :global(.doc h2),
    .answer :global(.doc h3),
    .answer :global(.doc h4),
    .answer :global(.doc h5),
    .answer :global(.doc h6),
    .answer :global(.doc p),
    .answer :global(.doc ul),
    .answer :global(.doc ol),
    .answer :global(.doc blockquote) {
        max-width: 80ch;
    }

    .cut {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: a log, in the face a log is read in. */
    :global(body.rice:where(:not(.rice-sans))) .chat {
        font-family: var(--font-mono);
    }
</style>
