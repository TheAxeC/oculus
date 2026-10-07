<script lang="ts">
    // Layer 3, primitive. A dense list of dated lines: a glyph, a name, and what the date says
    // about it. It knows no domain, so what a row means and what picking one does are the caller's;
    // the Focus board draws one of these per group of its ticker, and the gallery draws one with
    // sample rows so the shape is visible under every theme.
    //
    // The tail's hue is a tone name, turned into `--c-<tone>-txt` on a custom property here, so the
    // only colours in the rules below are tokens.
    //
    // A list that `reveal`s draws a row's buttons while the pointer is in the row, the keyboard is
    // inside it, a first finger tap has opened it, or the device has no hover. What a row is not
    // drawing is not in the page at all: it takes no width, so the name has the whole row; it
    // answers no press, so nothing is pressed that cannot be seen; and the row is the same box to
    // the board around it open or not, so nothing moves under the pointer. The keyboard reaches the
    // buttons through the row: the focus landing on anything the row draws puts them in the page,
    // and Tab then walks them in the order the caller listed them. A row that draws nothing
    // focusable of its own, a plain row with no kept button, is a pointer's to open.
    //
    // An open row draws its buttons on the line at the row's end, and the name is cut where they
    // begin by the row's own rule, so no word is under a button. A row opens drawing every button
    // and then takes back the ones it has measured no room for, which is why the box is clipped to
    // the row: a narrow pane draws the buttons that fit and leaves the rest undrawn. The button
    // `kept` names, the one the row exists for, is drawn all the time, where the caller lists it,
    // on a plain row too, and the button holding the keyboard is never taken back.
    //
    // A row whose name is cut says the whole line as its hover words: the label and the tail, set
    // when the pointer or the focus arrives, since only then is the room the name has known. A
    // name that fits has no hover words.
    //
    // A finger opens a row before it presses anything in it. On a device that also has a pointer
    // the buttons of a closed row are not in the page, so a tap that pressed straight through would
    // reach none of them: the first tap in a row opens it and presses nothing, the next tap presses
    // what it lands on, and a tap that misses that row closes it again. A row with no button
    // waiting to be drawn has nothing to open, so a tap in one is an ordinary press. The pointer
    // and the finger open the same one row: the pointer arriving over a row closes the one a tap
    // opened, and the finger reaching the list takes the pointer off it, which closes the row the
    // pointer was in. A row a tap opened is held by the id it was drawn under, so the lines around
    // it may change under it; a row the list no longer holds is no longer open. A stylus hovers
    // without pressing, so it opens a row as a mouse does.

    import type { TickerRow } from '$lib/ui/display/ticker-rows';
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

    /**
     * How much of its name a row keeps whatever its buttons ask for, in the row's own text size.
     */
    const NAME_FLOOR = 5;

    /**
     * One row drawn with its buttons: which row of this list, and the buttons it has room for. A
     * row that has just opened carries none, which draws them all and asks for the measurement.
     */
    type Open = { at: number; shown: number[] | null };

    /**
     * The row a tap opened, by the id it was drawn under rather than by its place in the list: it
     * outlives whatever a button on it writes, and a place would name whichever line moved up into
     * it once the caller has drawn the list again.
     */
    type Tapped = { id: string; shown: number[] | null };

    /**
     * Whether the row a finger went down in was already drawing its buttons. It is read on the
     * press and not on the click, because the press moves the focus into the row on its way to the
     * click, and a row the focus has just landed in would otherwise answer that it is already open.
     */
    let wasOpen = false;

    let list: HTMLUListElement | undefined = $state();
    let pointed = $state<Open | null>(null);
    let keyed = $state<Open | null>(null);
    let tapped = $state<Tapped | null>(null);
    /** The row whose name is cut as the pointer or the focus last arrived, and its whole line. */
    let cut = $state<{ id: string; text: string } | null>(null);

    /** Where the row a tap opened is drawn now, and -1 once the list holds no row of that id. */
    const tappedAt = $derived.by(() => {
        const held = tapped;
        return held === null ? -1 : rows.findIndex((row) => row.id === held.id);
    });

    /** Whether the name of a row is cut, read on the row as the pointer or the focus arrives. */
    function measureCut(event: Event, row: TickerRow): void {
        const li = event.currentTarget;
        const name = li instanceof Element ? li.querySelector('.name') : null;
        if (name === null || name.scrollWidth <= name.clientWidth) {
            if (cut?.id === row.id) cut = null;
            return;
        }
        const tail = row.tail ?? '';
        cut = { id: row.id, text: tail === '' ? row.label : `${row.label} ${tail}` };
    }

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

    /**
     * Whether a row holds a button it does not draw until it opens, which is what a tap opens it
     * for.
     */
    function reveals(row: TickerRow | undefined): boolean {
        if (row === undefined || onaction === undefined || row.actions === undefined) return false;
        const keep = kept?.(row);
        return row.actions.some((action) => action.id !== keep);
    }

    /**
     * A finger going down, read for whether the row under it was open before the press reached it.
     */
    function down(event: PointerEvent): void {
        if (event.pointerType !== 'touch') return;
        const found = rowAt(event.target);
        wasOpen = found !== null && opened(found.at) !== null;
    }

    /**
     * A finger pressing in this list. A tap in a row that was not open opens it and is spent doing
     * that, the click taken before it reaches anything, since what the row would draw was not in
     * the page for the finger to land on; a tap in a row that was already drawing its buttons,
     * however it came to be open, is an ordinary press of whatever is under it, which is what tells
     * the second tap from the first. A row with nothing to draw is never opened, so it costs one
     * tap as it costs the pointer one press. It is the click and not the press under it that opens
     * a row, so what the tap reaches is decided while the row is still closed.
     */
    function tap(event: MouseEvent): void {
        if (!(event instanceof PointerEvent) || event.pointerType !== 'touch') return;
        const found = rowAt(event.target);
        if (found === null || wasOpen) return;
        const row = rows[found.at];
        if (!reveals(row)) return;
        // The press moved the focus onto the row's name on its way here, which is not the reader
        // reaching the row with the keyboard: the tap holds the row open, and it alone, so the
        // pointer entering another row has one thing to close.
        if (keyed !== null && keyed.at === found.at) keyed = null;
        tapped = { id: row.id, shown: null };
        event.preventDefault();
        event.stopPropagation();
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
        if (tapped !== null && tappedAt === at) return { at, shown: tapped.shown };
        return null;
    }

    /**
     * The buttons the row drawn at one place has room for, the button holding the keyboard kept.
     */
    function roomAt(at: number): number[] {
        const li = list?.children[at];
        if (!(li instanceof HTMLElement)) return [];
        const held = document.activeElement;
        const inside =
            held instanceof Element && held.classList.contains('act') && li.contains(held)
                ? [...(held.parentElement?.children ?? [])].indexOf(held)
                : -1;
        return room(li, inside);
    }

    /** One open row measured on the line it is drawing. */
    function measured(was: Open): Open {
        return { at: was.at, shown: roomAt(was.at) };
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
        if (tapped === null) return;
        // The line a tap opened may have been written away by what a button on it did.
        if (tappedAt < 0) tapped = null;
        else if (tapped.shown === null) tapped = { id: tapped.id, shown: roomAt(tappedAt) };
    });

    // Nothing tells this list that the finger has moved on, so a row opened by a tap is closed by
    // whatever comes next that is not in it: a press anywhere on the page, and the pointer arriving
    // over another row or over none, since the pointer and the finger open the same one row. Both
    // listeners live only while such a row is open and read the event before it is answered.
    $effect(() => {
        if (tapped === null) return;
        const missed = (target: EventTarget | null): boolean => rowAt(target)?.at !== tappedAt;
        const pressed = (event: MouseEvent): void => {
            if (missed(event.target)) tapped = null;
        };
        const arrived = (event: PointerEvent): void => {
            if (event.pointerType !== 'touch' && missed(event.target)) tapped = null;
        };
        document.addEventListener('click', pressed, true);
        document.addEventListener('pointerover', arrived, true);
        return () => {
            document.removeEventListener('click', pressed, true);
            document.removeEventListener('pointerover', arrived, true);
        };
    });

    $effect(() => {
        const held = list;
        if (!reveal || held === undefined) return;
        const watch = new ResizeObserver(() => {
            pointed = afresh(pointed);
            keyed = afresh(keyed);
            tapped = tapped === null ? null : { id: tapped.id, shown: null };
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
    onpointerdown={reveal ? down : undefined}
    onclickcapture={reveal ? tap : undefined}
    onpointerleave={reveal ? () => (pointed = null) : undefined}
    onfocusin={reveal ? into : undefined}
    onfocusout={reveal ? out : undefined}
>
    {#each rows as row, at (`${at}:${row.id}`)}
        {@const here = opened(at)}
        <li
            class:open={here !== null}
            title={cut?.id === row.id ? cut.text : undefined}
            onpointerenter={(event) => measureCut(event, row)}
            onfocusin={(event) => measureCut(event, row)}
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

    .act:hover,
    .act:focus-visible {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent-txt, var(--accent));
    }
</style>
