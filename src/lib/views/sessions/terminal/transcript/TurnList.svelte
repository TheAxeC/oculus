<script lang="ts">
    // Layer 3, view partial of TranscriptBody.svelte. The rows of a transcript in view, oldest
    // first, which turn-window.svelte.ts picks. Each drawn row is one child box of the list with
    // its key and its index as data attributes, and the height of the rows not drawn stands in a
    // spacer before a drawn row and after the last, which paints nothing. CSS `zoom` stands on each
    // row's box rather than on the list, so a spacer's px are the column's px, and a box holds the
    // space above its row as padding from data (turn-rows.ts, `RowLead`), since a height measured
    // from a box leaves out what stands outside it:
    //
    // - A person's turn opens an exchange: a line above it, a wider gap, the accent bar and the
    //   person's words at the size of a row's main words. The row at the head of the list has no
    //   line and no gap. Off a wallpaper it takes the chip surface; over one nothing is painted
    //   behind a turn, since the box the view fills is that surface. Its words keep their own line
    //   breaks and are never rendered.
    // - An answer draws as a document at full ink. It draws its head only when the minute moved
    //   since the last head (turn-rows.ts, `groupTurns`). An answer is what an agent wrote into a
    //   file on disk: shared/prose/Markdown.svelte draws it, which sanitises it once and brings the
    //   document rules and the Copy control of a code block.
    // - Tool calls are muted and small. Calls next to each other make one run, which is one line
    //   while closed and that line with one row per call while open (TurnRun.svelte). A press
    //   chooses open or closed and the choice holds; a run no press chose stands open while it
    //   holds a failed call, whenever that result arrives, so a failure is never behind a press.
    //
    // One prose menu (shared/prose/prose-menu.ts) stands around the box, outside it, so it adds no
    // child. It is one menu over the rows because a selection crosses them: Copy is offered while
    // text is selected in the list, whichever row the selection started in, and an answer draws
    // `plain`, so one right-click opens one menu. What the right-click read is kept, so Copy gives
    // that text whatever changes under an open menu. The menu hears only this box, a spacer
    // included: the line above it and the space under its last row open nothing.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Markdown from '$lib/views/shared/prose/Markdown.svelte';
    import { prosePicked, proseRead, type ProseRead } from '$lib/views/shared/prose/prose-menu';
    import { clock } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import type { Turn } from '$lib/state/sessions/transcript.svelte';
    import type { DocState } from '$lib/state/system/docs.svelte';
    import { useState } from '$lib/state/client/use';
    import TurnRun from './TurnRun.svelte';
    import { relativeLink } from './turn-rows';
    import type { TurnWindow } from './turn-window.svelte';

    type Props = {
        /** The window that picks the rows drawn (turn-window.svelte.ts). */
        windowed: TurnWindow;
        /** The document of an answer. */
        docOf: (turn: Turn) => DocState;
        /** The zoom of each row's box (terminal-list.ts, `transcriptZoom`). */
        zoom: number;
        /** A press on a run, with its key and whether it stood open. */
        onpress: (key: string, open: boolean) => void;
        /** The box of the rows drawn, which the body reads the reader's place in. */
        list?: HTMLDivElement | null;
    };

    let { windowed, docOf, zoom, onpress, list = $bindable() }: Props = $props();

    const {
        layout: { openView }
    } = useState();

    /** What the last right-click read. */
    let heard: ProseRead = { text: '', image: null };

    function pointed(event: MouseEvent): MenuItem[] {
        const read = proseRead(event, list ?? null, t);
        heard = read.heard;
        return read.items;
    }

    function picked(pick: string): void {
        prosePicked(pick, heard, { openView });
    }

    /** The head's label: who said it. */
    function roleLabel(turn: Turn): string {
        return turn.role === 'user' ? t('sessions.turn_user') : t('sessions.turn_assistant');
    }
</script>

<ContextMenu label={t('ui.prose_menu')} read={pointed} onpick={picked}>
    <div class="turns" bind:this={list} {@attach windowed.heard}>
        {#each windowed.drawn.rows as { row, index, gap } (row.key)}
            {#if gap > 0}
                <div class="spacer" aria-hidden="true" style:height="{gap}px"></div>
            {/if}
            <div
                class="row"
                class:gap={row.lead === 'gap'}
                class:exchange={row.lead === 'exchange'}
                style:zoom
                data-row-key={row.key}
                data-index={index}
                {@attach windowed.measured}
            >
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
                                        plain
                                        onlink={relativeLink}
                                    />
                                </div>
                            {/if}
                            {#if turn.cut}
                                <p class="cut">{t('sessions.turn_cut')}</p>
                            {/if}
                        </div>
                    </div>
                {:else}
                    <TurnRun
                        {row}
                        onpress={() => {
                            if (row.kind === 'press') onpress(row.choice, row.open);
                        }}
                    />
                {/if}
            </div>
        {/each}
        {#if windowed.drawn.after > 0}
            <div class="spacer" aria-hidden="true" style:height="{windowed.drawn.after}px"></div>
        {/if}
    </div>
</ContextMenu>

<style>
    .turns {
        display: flex;
        flex: none;
        flex-direction: column;
        min-width: 0;
        line-height: 1.5;
    }

    /* A spacer stands for rows not drawn and paints nothing, so a wallpaper shows through it. */
    .spacer {
        flex: none;
    }

    .row {
        flex: none;
        min-width: 0;
    }

    .gap {
        padding-top: 10px;
    }

    /* The wider gap that opens an exchange, the line itself standing on the turn below. */
    .exchange {
        padding-top: 20px;
    }

    .turn {
        min-width: 0;
    }

    /* A person's turn opens an exchange: the line above it with a wider gap on either side. */
    .exchange .user {
        padding-top: 16px;
        border-top: 1px solid var(--line);
    }

    .user .body {
        padding: 4px 10px;
        border-left: 3px solid var(--accent-txt, var(--accent));
        border-radius: var(--radius-sm);
        background: var(--chip);
    }

    /* The box the view fills carries the translucent surface over a picture, and a second one
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
</style>
