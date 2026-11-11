<script lang="ts">
    // Layer 3, view partial of Terminal.svelte. The conversation of the session a Terminal tab
    // reads, oldest first, drawn in place of the tab's row of grids while the tab's switch stands
    // on Transcript, so that who said what reads at a glance. What each row draws, and the one
    // right-click menu over the rows, are TurnList.svelte's; this component holds the column they
    // scroll in, what fetches the turns, and where the reader stands.
    //
    // A press on a run chooses open or closed, and the tab holds that choice (`chosen`,
    // tab-session.svelte.ts), since this component goes with every switch to Live and a press
    // outlives it.
    //
    // The turns are not in the snapshot. state/sessions/transcript.svelte.ts fetches them for the
    // session on screen, holds them in the client's query client and follows the file from an
    // effect: the record's lastActivity moving is the transcript being written, and that is what
    // asks for the bytes appended since the last read. This component is mounted only while
    // Transcript shows, so a tab on Live fetches and follows nothing.
    //
    // A first read holds the last turns of the session. When the reader is within one column height
    // of the top, on a scroll, after each draw and when the column changes size, the store is asked
    // for the turns before them, so a list shorter than the pane fills itself and goes on filling
    // when the pane grows. Nothing asks while the column has no height, which is a hidden tab, or
    // while the error box stands where the list was. After a failed read of older turns nothing
    // asks by itself: the failure line carries the press that does.
    //
    // Only the rows near the view are in the page (turn-window.svelte.ts). The window is made here
    // rather than in the list, so its heights outlive the error box, which takes the list away.
    //
    // The reader's words stay where they are through every draw (reader-place.ts), unless the
    // reader is at the foot, where the column follows. Two flags say so. `stuck`, within SLACK of
    // the foot, decides what an appended turn does. `following`, at the true foot, decides what a
    // height change does: estimates can be far off, so `toFoot`, a first draw and following the
    // newest turn go to the foot again as rows measure, and a slow scroll up, which draws rows not
    // yet measured while inside SLACK, or a press on a run clears `following`.
    //
    // The turns draw at the size of the `terminal.transcript_font_px` option, or at `--fs-sm` where
    // the key is left out, and the font buttons of the tab's bar write that key while Transcript
    // shows. `--fs-*` resolve at the root, so a descendant cannot rescale them; each row's box
    // inside the scroller takes CSS `zoom` instead (terminal-list.ts, `transcriptZoom`). The
    // scroller itself is not zoomed, so its measures stay the ones the foot rule reads.
    //
    // A press on a link to a fragment is the document's own (shared/prose/jump.ts). A heading in a
    // row not drawn has no element to find, so this column hears the press too, draws the row whose
    // answer carries the id and then scrolls to it. A Markdown heading of an answer carries no id,
    // so the link reaches an id the answer wrote as raw HTML.
    //
    // Under the conversation sits the prompt box that steers the session through its terminal, read
    // only for a session with no terminal. A tab opened from an agent row of the Session details
    // reads that subagent's own transcript and has no prompt box, since the agent is steered
    // through the session that started it.

    import { tick, untrack } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import SteerBox from '$lib/views/shared/sessions/SteerBox.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { followTab } from '$lib/state/sessions/transcript.svelte';
    import type { Turn } from '$lib/state/sessions/transcript.svelte';
    import { useState } from '$lib/state/client/use';
    import { onShown } from '$lib/ui/shown';
    import { fragmentIds, named, scrollToFragment } from '$lib/views/shared/prose/jump';
    import { transcriptZoom } from '../terminal-list';
    import { readerPlace } from './reader-place';
    import TurnList from './TurnList.svelte';
    import {
        carryChoices,
        flatRows,
        groupTurns,
        listReplaced,
        rowOfId,
        turnDocs,
        type FlatRow,
        type RunChoice
    } from './turn-rows';
    import { turnWindow } from './turn-window.svelte';

    type Props = {
        /** The session the tab reads. */
        session: string;
        /** The subagent the tab reads, or the empty text for the session's own transcript. */
        agent: string;
        /** Whether the tab is locked, which leaves the prompt box read-only. */
        locked: boolean;
        /** What a press chose for each run, by `runKey`, which the tab holds. */
        chosen: Map<string, RunChoice>;
    };

    let { session, agent, locked, chosen }: Props = $props();

    const {
        selectors: { sessionById },
        terminals: { terminalOfSession },
        transcripts: { follow, readOlder, showing, turnsFor },
        ui: { textScale, transcriptFont }
    } = useState();

    const record = $derived(sessionById(session));
    /**
     * The session's id, which the effects that fetch and hold its turns read. The sessions channel
     * hands every record anew with each message, so an effect reading the record re-runs at every
     * write of any session; a derived of the id changes only when the session does.
     */
    const sessionId = $derived(record?.id ?? '');
    /**
     * The agent's id, for the same reason: the prop reads through the tab's target, a new object
     * whenever the tab's state or its session's record is handed anew, and the effect that holds
     * the turns would release them each time.
     */
    const agentId = $derived(agent);
    const held = $derived(turnsFor(sessionId, agentId));
    const turns = $derived(held.turns);
    const rows = $derived(groupTurns(turns, held.above));
    /** The rows the window draws, which what the tab's presses chose opens up. */
    const flat = $derived(flatRows(rows, chosen));

    const docs = turnDocs();

    /** The scroller, null once the component is torn down. */
    let column: HTMLDivElement | null | undefined = $state();

    /** The box of the rows drawn. */
    let list: HTMLDivElement | null | undefined = $state();

    /** The reader's place in the column. */
    const place = readerPlace();

    const windowed = turnWindow({
        column: () => column,
        list: () => list,
        rows: () => flat,
        anchored: place.rows
    });

    /**
     * What the documents belong to. The props are read through the tab's target, a new object at
     * each sessions message, so an effect reading them re-runs at every message; a derived of the
     * words changes only when the session or the agent does.
     */
    const target = $derived(JSON.stringify([session, agent]));

    // One component outlives its target, so a change of the session or the agent empties the
    // documents of the turns that go with it and the window's heights before the new turns are
    // drawn.
    $effect.pre(() => {
        if (target === '') return;
        docs.clear();
        untrack(windowed.drop);
    });

    /** The zoom of the box of turns, as `transcriptZoom` gives it. */
    function fontZoom(): number {
        return transcriptZoom(transcriptFont(), textScale() ?? 1);
    }

    let zoom = $state(fontZoom());

    /**
     * Take the zoom again; once a new one is drawn the drawn rows measure again, since a change of
     * zoom alone may fire no observer, and the height change does the rest.
     */
    function retakeZoom(): void {
        const next = fontZoom();
        if (next === untrack(() => zoom)) return;
        zoom = next;
        void tick().then(() => {
            windowed.measureDrawn();
            windowed.readMargin();
        });
    }

    // The zoom follows the font setting and the text scale, which this effect reads. A theme lands
    // on the body's attributes whenever its file arrives, which `--fs-sm` and `--fs-md` are read
    // through, so the observer takes the zoom again however late that is.
    $effect(() => {
        retakeZoom();
        const watch = new MutationObserver(retakeZoom);
        watch.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
        return () => {
            watch.disconnect();
        };
    });

    /** The rows the list draws from at this moment: `flat` until a draw, and then that list. */
    let drawn: readonly FlatRow[] = [];

    /** The session whose turns are on screen. A change to it sends the column to the foot. */
    let shown = '';

    /** The turns and the count above them at the last draw, to tell a list that was replaced. */
    let lastList: { turns: readonly Turn[]; above: number } = { turns: [], above: 0 };

    /**
     * Whether the reader was at the foot the last time the column scrolled. It is kept by the
     * scroll listener rather than measured in the effect, because the effect runs after the
     * appended turns are in the DOM, when the old position is above the foot of the new height.
     */
    let stuck = true;

    /** Whether the reader stands at the true foot, where a height change goes to the foot again. */
    let following = true;

    /** Where `toFoot` last put the column; a scroll above it is the reader leaving. */
    let footTop = 0;

    /** Pixels from the foot that still count as reading the newest turn. */
    const SLACK = 40;

    /** Pixels from the true foot that a scroll reaching it may stop short by. */
    const TRUE_FOOT = 1;

    // The record is read by this effect, so it re-runs at each sessions message and hands follow()
    // the tab's mark of that message (state/sessions/transcript.svelte.ts, followTab).
    followTab(follow, () => ({ id: sessionId, agent: agentId, record }));

    // The store keeps a transcript's turns while an instance is showing it and drops them when the
    // last one stops; the effect's cleanup is that release, so a change of session or a teardown
    // lets go. It reads the id and never the record, so a new record of the same session keeps the
    // turns held and the next read asks only from the offset held.
    $effect(() => showing(sessionId, agentId));

    /** What a draw is made from, so a change to any of it can move what is under the reader. */
    const draw = $derived({ rows, older: held.older, failed: held.olderError, error: held.error });

    // Before a draw the words are taken from the list as it still stands, and a press made on a run
    // while it was cut goes with the run to its key. A read from the start leaves a key naming
    // another turn, so the window's heights go with the list it replaced.
    $effect.pre(() => {
        const next = draw.rows;
        const listed = { turns, above: held.above };
        untrack(() => {
            carryChoices(next, chosen);
            if (listReplaced(lastList, listed)) windowed.drop();
            lastList = listed;
        });
        const nextFlat = flat;
        untrack(() => {
            if (column) place.take(column, list, drawn);
            drawn = nextFlat;
        });
    });

    $effect(() => {
        const id = sessionId;
        // The draw is read here as well as the id, and an append or a patched result makes a new
        // list, so either re-runs this; then the column follows the newest turn only if the reader
        // was at the foot before, and otherwise the reader's words are put back. A result that
        // opens a run grows the column as an append does. A press on a run is not read here, so it
        // moves nothing. The line above the list comes and goes with a draw, which moves the list
        // in the column.
        const { rows: next } = draw;
        const box = column;
        windowed.readMargin();
        if (!box || next.length === 0) return;
        const fresh = id !== shown;
        if (fresh || stuck) {
            shown = id;
            stuck = true;
            place.clear();
            toFoot();
        } else {
            untrack(() => {
                holdWords(box);
            });
        }
        untrack(() => {
            askOlder(box);
        });
    });

    // Every change of what the window draws is a height change or a draw: it goes to the foot only
    // for a reader at the true foot, and otherwise the words are put back.
    $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the read is the dependency
        windowed.drawn;
        untrack(() => {
            if (following) toFoot();
            else if (column) holdWords(column);
        });
    });

    // A tab shown again goes back to the foot or to the words the anchor kept, and then the size
    // watcher, made after it and so called after it, asks what a hidden tab or a smaller pane could
    // not.
    $effect(() => {
        const box = column;
        if (!box) return;
        const stopShown = onShown(box, () => {
            if (stuck) toFoot();
            else holdWords(box);
        });
        const sized = new ResizeObserver(() => {
            askOlder(box);
        });
        sized.observe(box);
        return () => {
            stopShown();
            sized.disconnect();
        };
    });

    /** Put the words back, and tell the window at once, so the rows under them draw this frame. */
    function holdWords(box: HTMLDivElement): void {
        place.hold(box, list, flat);
        windowed.sync();
    }

    function atFoot(box: HTMLDivElement, slack: number): boolean {
        return box.scrollTop + box.clientHeight >= box.scrollHeight - slack;
    }

    /**
     * Ask for older turns when the reader is within one column height of the top. An error box
     * stands where the list was while `held.error` is set, so the column only reads as being at the
     * top, and after a failed read of older turns the press on its line is what asks.
     */
    function askOlder(box: HTMLDivElement): void {
        if (held.error !== '' || held.olderError !== '') return;
        if (box.clientHeight > 0 && box.scrollTop <= box.clientHeight)
            readOlder(sessionId, agentId);
    }

    /** Note where the reader stands and ask for what that nears. A hidden column notes nothing. */
    function scrolled(): void {
        const box = column;
        if (!box || box.clientHeight === 0) return;
        stuck = atFoot(box, SLACK);
        if (atFoot(box, TRUE_FOOT)) {
            following = true;
            footTop = box.scrollTop;
        } else if (box.scrollTop < footTop - TRUE_FOOT) {
            following = false;
        }
        place.take(box, list, drawn);
        askOlder(box);
    }

    /** Scroll to the newest turn, which the tab's End tool asks for. */
    export function toFoot(): void {
        if (!column || column.clientHeight === 0) return;
        column.scrollTop = column.scrollHeight;
        following = true;
        footTop = column.scrollTop;
        place.clear();
        windowed.sync();
    }

    /**
     * A press on a run closes it or opens it. Once drawn the foot is read again, since the press
     * moved the foot and not the reader, so one who opened the last run stays where it was opened
     * as its rows measure and when the next turn is appended.
     */
    function pressRun(key: string, open: boolean): void {
        following = false;
        chosen.set(key, open ? 'closed' : 'opened');
        void tick().then(scrolled);
    }

    /**
     * A press on a link to a heading of an undrawn answer draws that answer and scrolls to it. The
     * reader's place lets go for the jump and is taken at the heading, ahead of the window moving.
     */
    function linked(event: MouseEvent): void {
        const link = event.target instanceof Element ? event.target.closest('a') : null;
        const fragment = link?.getAttribute('href')?.match(/^#(.+)$/)?.[1];
        const box = column;
        const view = box?.closest('[data-instance]');
        if (fragment === undefined || !box || !view || named(view, fragment) !== null) return;
        const key = rowOfId(flat, fragmentIds(fragment));
        if (key === null) return;
        following = false;
        place.leave();
        void windowed.showRow(key, () => {
            scrollToFragment(view, fragment);
            place.land(box, list, flat);
            windowed.sync();
        });
    }
</script>

<div class="frame">
    <!-- The press is the links' own: this box only hears it bubble up. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        class="chat"
        bind:this={column}
        onscroll={scrolled}
        onclick={linked}
        data-scroll
        data-windowed
    >
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
            {#if held.older}
                <div class="older" style:zoom>{t('sessions.turns_older')}</div>
            {:else if held.olderError !== ''}
                <div class="older" style:zoom>
                    <span>{t('sessions.turns_older_failed', held.olderError)}</span>
                    <ToolButton
                        small
                        label={t('sessions.turns_older_retry')}
                        onclick={() => {
                            readOlder(sessionId, agentId);
                        }}
                    />
                </div>
            {/if}
            <TurnList {windowed} docOf={docs.of} {zoom} onpress={pressRun} bind:list />
        {/if}
    </div>
    {#if record !== null && agent === ''}
        <SteerBox terminal={terminalOfSession(record)} {locked} ended={!record.live} />
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

    /* The right padding keeps the words off the scrollbar this box draws at its edge. The browser's
       scroll anchoring is off, since reader-place.ts owns every correction of this box. */
    .chat {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        overflow-anchor: none;
        padding-right: 8px;
    }

    /* The muted line at the top of the list while a read of older turns is out or has failed. */
    .older {
        display: flex;
        flex: none;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: a log, in the face a log is read in. */
    :global(body.rice:where(:not(.rice-sans))) .chat {
        font-family: var(--font-mono);
    }
</style>
