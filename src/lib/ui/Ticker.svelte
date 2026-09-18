<script lang="ts">
    // Layer 3, primitive. A dense list of dated lines: a glyph, a name, and what the date says about
    // it. It knows no domain, so what a row means and what picking one does are the caller's; the
    // Focus board draws one of these per group of its ticker, and the gallery draws one with sample
    // rows so the shape is visible under every theme.
    //
    // The tail's hue is a tone name, turned into `--c-<tone>-txt` on a custom property here, so the
    // only colours in the rules below are tokens.
    //
    // A list that `reveal`s draws a row's buttons only while the pointer is in the row or the
    // keyboard is inside it, and always on a device with no hover. What a row is not drawing is not
    // in the page at all: it takes no width, so the name has the whole row; it answers no press, so
    // nothing is pressed that cannot be seen; and the row is the same box to the board around it
    // open or not, so nothing moves under the pointer. The keyboard reaches the buttons through the
    // row: the focus landing on anything the row draws puts them in the page, and Tab then walks
    // them in the order the caller listed them. A row that draws nothing focusable of its own, a
    // plain row with no kept button, is a pointer's to open.
    //
    // An open row draws its buttons on the line at the row's end, and the name is cut where they
    // begin by the row's own rule, so no word is under a button. A row opens drawing every button
    // and then takes back the ones it has measured no room for, which is why the box is clipped to
    // the row: a narrow pane draws the buttons that fit and leaves the rest undrawn. The button
    // `kept` names, the one the row exists for, is drawn all the time, where the caller lists it,
    // on a plain row too, and the button holding the keyboard is never taken back.
    //
    // A finger never opens a row: a tap on a device that also has a pointer raises hover, and the
    // buttons would land under the finger that meant to press the name. A stylus hovers without
    // pressing, so it opens one as a mouse does.

    import type { TickerRow } from '$lib/ui/ticker-rows';
    import Glyph from './Glyph.svelte';

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

    /** How much of its name a row keeps whatever its buttons ask for, in the row's own text size. */
    const NAME_FLOOR = 5;

    /**
     * One row drawn with its buttons: which row of this list, and the buttons it has room for. A
     * row that has just opened carries none, which draws them all and asks for the measurement.
     */
    type Open = { at: number; shown: number[] | null };

    let list: HTMLUListElement | undefined = $state();
    let pointed = $state<Open | null>(null);
    let keyed = $state<Open | null>(null);

    function toneStyle(tone: string | undefined): string | undefined {
        return tone === undefined ? undefined : `--tone-txt: var(--c-${tone}-txt)`;
    }

    /** The row an event happened in, by its place in this list, and nothing outside a row. */
    function rowAt(target: EventTarget | null): { li: HTMLElement; at: number } | null {
        const li = target instanceof Element ? target.closest('li') : null;
        if (li === null || !(li instanceof HTMLElement) || list === undefined) return null;
        const at = [...list.children].indexOf(li);
        return at < 0 ? null : { li, at };
    }

    /**
     * Which buttons of one row there is room for, in the order the row lists them: the row's width
     * less the stretch of name it keeps and everything else on the line, spent one button at a time
     * until the next does not fit. The button the row keeps and the button `first` names are drawn
     * whatever is left, so the one the row exists for and the one the keyboard just reached are
     * never taken away. Measured on an open row, where every button is drawn and so has the width
     * it asks for.
     */
    function room(li: HTMLElement, first: number): number[] {
        const shown: number[] = [];
        const acts = li.querySelector('.acts');
        if (acts === null) return shown;
        const line = getComputedStyle(li);
        const gap = Number.parseFloat(line.columnGap) || 0;
        const floor = Number.parseFloat(line.fontSize) * NAME_FLOOR;
        const between = Number.parseFloat(getComputedStyle(acts).columnGap) || 0;
        const parts = [...li.children];
        let free = li.clientWidth - floor - gap * Math.max(0, parts.length - 1);
        for (const part of parts) {
            if (part !== acts && !part.classList.contains('name')) {
                free -= part.getBoundingClientRect().width;
            }
        }
        const buttons = [...acts.children];
        const held = buttons.findIndex((one) => one.classList.contains('kept'));
        const order = [held, first, ...buttons.map((one, spot) => spot)];
        for (const spot of order) {
            if (spot < 0 || spot >= buttons.length || shown.includes(spot)) continue;
            const cost = buttons[spot].getBoundingClientRect().width + between;
            if (spot !== held && spot !== first && cost > free) break;
            free -= cost;
            shown.push(spot);
        }
        return shown;
    }

    /** The row a pointer is in. */
    function over(event: PointerEvent): void {
        if (event.pointerType === 'touch') return;
        const found = rowAt(event.target);
        if (found === null || pointed?.at === found.at) return;
        pointed = { at: found.at, shown: null };
    }

    /** The row the keyboard is in. */
    function into(event: FocusEvent): void {
        const found = rowAt(event.target);
        if (found === null || keyed?.at === found.at) return;
        keyed = { at: found.at, shown: null };
    }

    /** The keyboard leaving this list altogether, rather than stepping inside it. */
    function out(event: FocusEvent): void {
        const to = event.relatedTarget;
        if (to instanceof Node && list?.contains(to) === true) return;
        keyed = null;
    }

    /** Whether one button of a row is one the row measured no room for. */
    function short(open: Open | null, spot: number): boolean {
        return open?.shown != null && !open.shown.includes(spot);
    }

    /** What one line of this list is drawn as: the buttons it has room for, or nothing. */
    function opened(at: number): Open | null {
        if (keyed !== null && keyed.at === at) return keyed;
        if (pointed !== null && pointed.at === at) return pointed;
        return null;
    }

    /** One open row measured on the line it is drawing, the button holding the keyboard kept. */
    function measured(was: Open): Open {
        const li = list?.children[was.at];
        if (!(li instanceof HTMLElement)) return { at: was.at, shown: [] };
        const held = document.activeElement;
        const inside =
            held instanceof Element && held.classList.contains('act') && li.contains(held)
                ? [...(held.parentElement?.children ?? [])].indexOf(held)
                : -1;
        return { at: was.at, shown: room(li, inside) };
    }

    /** An open row asked to measure itself again, drawing every button until it has. */
    function afresh(was: Open | null): Open | null {
        return was === null ? null : { at: was.at, shown: null };
    }

    // A row that has just opened draws every button; this reads the line it drew and takes back the
    // ones it has no room for. Until then the box is clipped to the row, so nothing is ever drawn
    // outside it.
    $effect(() => {
        if (pointed !== null && pointed.shown === null) pointed = measured(pointed);
        if (keyed !== null && keyed.shown === null) keyed = measured(keyed);
    });

    $effect(() => {
        const held = list;
        if (!reveal || held === undefined) return;
        const watch = new ResizeObserver(() => {
            pointed = afresh(pointed);
            keyed = afresh(keyed);
        });
        watch.observe(held);
        return () => {
            watch.disconnect();
        };
    });
</script>

<ul
    class="ticker"
    class:reveal
    bind:this={list}
    onpointerover={reveal ? over : undefined}
    onpointerleave={reveal ? () => (pointed = null) : undefined}
    onfocusin={reveal ? into : undefined}
    onfocusout={reveal ? out : undefined}
>
    {#each rows as row, at (`${at}:${row.id}`)}
        {@const here = opened(at)}
        <li class:open={here !== null}>
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
        font-size: var(--fs-sm);
        line-height: 1.5;
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

    .act {
        flex: 0 0 auto;
        padding: 0 5px;
        border: 1px solid var(--line);
        border-radius: 4px;
        background: var(--chip);
        font: inherit;
        font-size: var(--fs-3xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
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
           no press and holds no stop on the Tab path, a press at the end of a name reaches the name,
           and the row is the same box to the board around it open or not. */
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

    .act:hover,
    .act:focus-visible {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent-txt, var(--accent));
    }
</style>
