<script lang="ts">
    // Layer 3, primitive. A dense list of dated lines: a glyph, a name, and what the date says
    // about it. It knows no domain, so what a row means and what picking one does are the caller's;
    // the Focus board draws one of these per group of its ticker, and the gallery draws one with
    // sample rows so the shape is visible under every theme.
    //
    // The tail's hue is a tone name, turned into `--c-<tone>-txt` on a custom property here, so the
    // only colours in the rules below are tokens. When a row's buttons are drawn, and the hover
    // words of a cut name, are reveal.svelte.ts's. A row's button the caller marks `disabled` is
    // drawn and answers no press, with the caller's `title` as the reason.

    import Glyph from '../Glyph.svelte';
    import { createReveal, short } from './reveal.svelte';
    import type { TickerRow } from './ticker-rows';

    type Props = {
        rows: TickerRow[];
        /** What picking a row means. Rows are plain text when the caller wants none. */
        onpick?: (id: string) => void;
        /** What pressing one of a row's buttons means, by the row's id and the button's. */
        onaction?: (row: string, action: string) => void;
        /** Draw a row's buttons only under the pointer or the keyboard. */
        reveal?: boolean;
        /** The id of the one button a row keeps drawn, and nothing for a row that keeps none. */
        kept?: (row: TickerRow) => string | undefined;
    };

    let { rows, onpick, onaction, reveal = false, kept }: Props = $props();

    let list: HTMLUListElement | undefined = $state();

    const shown = createReveal({
        list: () => list,
        rows: () => rows,
        reveal: () => reveal,
        actionable: () => onaction !== undefined,
        kept: () => kept
    });

    function toneStyle(tone: string | undefined): string | undefined {
        return tone === undefined ? undefined : `--tone-txt: var(--c-${tone}-txt)`;
    }
</script>

<ul
    class="ticker"
    class:reveal
    bind:this={list}
    onpointerover={reveal ? shown.over : undefined}
    onpointerdown={reveal ? shown.down : undefined}
    onclickcapture={reveal ? shown.tap : undefined}
    onpointerleave={reveal ? shown.leave : undefined}
    onfocusin={reveal ? shown.into : undefined}
    onfocusout={reveal ? shown.out : undefined}
>
    {#each rows as row, at (`${at}:${row.id}`)}
        {@const here = shown.opened(at)}
        <li
            class:open={here !== null}
            title={shown.cutText(row)}
            onpointerenter={(event) => shown.measureCut(event, row)}
            onfocusin={(event) => shown.measureCut(event, row)}
        >
            <Glyph name={row.glyph} />
            {#if onpick !== undefined && row.id !== '' && row.plain !== true}
                <button
                    type="button"
                    class="name"
                    data-ticker-id={row.id}
                    onclick={() => onpick(row.id)}
                >
                    {row.label}
                    {#if row.tail !== undefined && row.tail !== ''}
                        <span
                            class="tail"
                            class:toned={row.tone !== undefined}
                            style={toneStyle(row.tone)}
                        >
                            {row.tail}
                        </span>
                    {/if}
                </button>
            {:else}
                <span class="name plain">{row.label}</span>
                {#if row.tail !== undefined && row.tail !== ''}
                    <span
                        class="tail"
                        class:toned={row.tone !== undefined}
                        style={toneStyle(row.tone)}
                    >
                        {row.tail}
                    </span>
                {/if}
            {/if}
            {#if onaction !== undefined && row.actions !== undefined}
                {@const keep = kept?.(row)}
                <span class="acts">
                    {#each row.actions as action, spot (action.id)}
                        <button
                            type="button"
                            class="act"
                            class:kept={action.id === keep}
                            class:gone={short(here, spot)}
                            title={action.title}
                            disabled={action.disabled === true}
                            onclick={() => onaction(row.id, action.id)}
                        >
                            {action.label}
                        </button>
                    {/each}
                </span>
            {/if}
        </li>
    {/each}
</ul>

<style>
    .ticker {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    li {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
        line-height: calc(var(--button-line) * var(--text-scale, 1));
    }

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font: inherit;
        font-weight: 600;
        color: var(--ink-txt, var(--ink));
    }

    /* The words that date a row belong to the row's own control, so the whole line opens what the
       count names rather than only the count. */
    button.name .tail {
        font-weight: 400;
    }

    button.name {
        padding: 0;
        border: 0;
        background: none;
        text-align: left;
        cursor: pointer;
    }

    button.name:hover,
    button.name:focus-visible {
        text-decoration: underline;
    }

    .plain {
        font-weight: 600;
    }

    .tail {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
    }

    .tail.toned {
        color: var(--tone-txt);
        font-weight: 600;
    }

    /* The buttons of a row, in one box: what it holds is what the row is drawing. The box sits on
       the middle of the line rather than on its baseline, so a button coming onto the line leaves
       the row's height where it was and the board around it does not move. */
    .acts {
        display: flex;
        flex: 0 0 auto;
        align-self: center;
        align-items: baseline;
        gap: 6px;
    }

    /* A row's button is drawn as ToolButton.svelte's small text button, VS Code's: 11px words on a
       14px line in 3px above and below and 6px beside, 22 px high, in the words the caller wrote.
       It is a button of this list's own and not a ToolButton, since the list reads its buttons by
       class to measure and reveal them and a ToolButton's wrapper would stand between. */
    .act {
        flex: 0 0 auto;
        padding: 3px 6px;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--panel);
        font: inherit;
        font-size: var(--fs-xs);
        font-weight: 400;
        line-height: calc(14px * var(--text-scale, 1));
        color: var(--muted-txt, var(--muted));
        cursor: pointer;
    }

    .reveal .act {
        opacity: 0;
        transition: opacity 120ms ease-out;
    }

    .reveal li.open .act,
    .reveal .act.kept {
        opacity: 1;
    }

    @media (hover: none) {
        .reveal .act {
            opacity: 1;
        }
    }

    @media (hover: hover) {
        /* A row draws its buttons at its own end, so they are in one place whatever the name's
           length. What the row is not drawing is not in the page at all: it takes no width, answers
           no press and holds no stop on the Tab path, a press at the end of a name reaches the
           name, and the row is the same box to the board around it open or not. */
        .reveal .acts {
            margin-left: auto;
        }

        .reveal .act:not(.kept) {
            display: none;
        }

        .reveal li.open .act {
            display: inline-block;
        }

        /* The box reaches no further than the row whatever it holds, so nothing is drawn outside
           the row even in the frame before the row has measured its room. */
        .reveal li.open .acts {
            max-width: 100%;
            overflow: hidden;
        }

        /* A button an open row has no room for is neither drawn nor reached. */
        .reveal li.open .act.gone {
            display: none;
        }
    }

    /* A button the caller disabled is drawn dimmed whichever way its row reveals it. */
    .ticker .act:disabled,
    .reveal li.open .act:disabled {
        cursor: default;
        opacity: 0.5;
    }

    .act:not(:disabled):hover,
    .act:not(:disabled):focus-visible {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent-txt, var(--accent));
    }
</style>
