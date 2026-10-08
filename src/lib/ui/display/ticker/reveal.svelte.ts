// Layer 3, primitive. Which buttons of a ticker's rows are drawn, and the hover words of a row
// whose name is cut. Ticker.svelte draws the list; this holds the state of the pointer, the
// keyboard and the finger over it and the measuring of how many buttons a row has room for.
//
// A list that `reveal`s draws a row's buttons while the pointer is in the row, the keyboard is
// inside it, a first finger tap has opened it, or the device has no hover. What a row is not
// drawing is not in the page at all: it takes no width, so the name has the whole row; it answers
// no press, so nothing is pressed that cannot be seen; and the row is the same box to the board
// around it open or not, so nothing moves under the pointer. The keyboard reaches the buttons
// through the row: the focus landing on anything the row draws puts them in the page, and Tab then
// walks them in the order the caller listed them. A row that draws nothing focusable of its own, a
// plain row with no kept button, is a pointer's to open.
//
// An open row draws its buttons on the line at the row's end, and the name is cut where they begin
// by the row's own rule, so no word is under a button. A row opens drawing every button and then
// takes back the ones it has measured no room for, which is why the box is clipped to the row: a
// narrow pane draws the buttons that fit and leaves the rest undrawn. The button `kept` names, the
// one the row exists for, is drawn all the time, where the caller lists it, on a plain row too, and
// the button holding the keyboard is never taken back.
//
// A row whose name is cut says the whole line as its hover words: the label and the tail, set when
// the pointer or the focus arrives, since only then is the room the name has known. A name that
// fits has no hover words.
//
// A finger opens a row before it presses anything in it. On a device that also has a pointer the
// buttons of a closed row are not in the page, so a tap that pressed straight through would reach
// none of them: the first tap in a row opens it and presses nothing, the next tap presses what it
// lands on, and a tap that misses that row closes it again. A row with no button waiting to be
// drawn has nothing to open, so a tap in one is an ordinary press. The pointer and the finger open
// the same one row: the pointer arriving over a row closes the one a tap opened, and the finger
// reaching the list takes the pointer off it, which closes the row the pointer was in. A row a tap
// opened is held by the id it was drawn under, so the lines around it may change under it; a row
// the list does not hold is not open. A stylus hovers without pressing, so it opens a row as a
// mouse does.

import type { TickerRow } from './ticker-rows';

/**
 * How much of its name a row keeps whatever its buttons ask for, in the row's own text size.
 */
const NAME_FLOOR = 5;

/**
 * One row drawn with its buttons: which row of this list, and the buttons it has room for. A row
 * that has just opened carries none, which draws them all and asks for the measurement.
 */
export type Open = { at: number; shown: number[] | null };

/**
 * The row a tap opened, by the id it was drawn under rather than by its place in the list: it
 * outlives whatever a button on it writes, and a place would name whichever line moved up into it
 * once the caller has drawn the list again.
 */
type Tapped = { id: string; shown: number[] | null };

/** What the reveal reads from the list it serves, each read when it is needed. */
export type RevealInput = {
    list: () => HTMLUListElement | undefined;
    rows: () => TickerRow[];
    /** Whether the list draws a row's buttons only under the pointer or the keyboard. */
    reveal: () => boolean;
    /** Whether the caller listens to the buttons at all. */
    actionable: () => boolean;
    kept: () => ((row: TickerRow) => string | undefined) | undefined;
};

/**
 * Which buttons of one row there is room for, in the order the row lists them: the row's width less
 * the stretch of name it keeps and everything else on the line, spent one button at a time until
 * the next does not fit. The button the row keeps and the button `first` names are drawn whatever
 * is left, so the one the row exists for and the one the keyboard just reached are never taken
 * away. Measured on an open row, where every button is drawn and so has the width it asks for.
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

/** Whether one button of a row is one the row measured no room for. */
export function short(open: Open | null, spot: number): boolean {
    return open?.shown != null && !open.shown.includes(spot);
}

/** The text a row's cut name says whole: the label and the tail. */
function whole(row: TickerRow): string {
    const tail = row.tail ?? '';
    return tail === '' ? row.label : `${row.label} ${tail}`;
}

/**
 * The state of the pointer, the keyboard and the finger over one list, with the listeners the list
 * puts on itself. It registers its effects, so it is made while a component initialises.
 */
export function createReveal(input: RevealInput) {
    /**
     * Whether the row a finger went down in was already drawing its buttons. It is read on the
     * press and not on the click, because the press moves the focus into the row on its way to the
     * click, and a row the focus has just landed in would otherwise answer that it is already open.
     */
    let wasOpen = false;

    let pointed = $state<Open | null>(null);
    let keyed = $state<Open | null>(null);
    let tapped = $state<Tapped | null>(null);
    /** The row whose name is cut as the pointer or the focus last arrived, and its whole line. */
    let cut = $state<{ id: string; text: string } | null>(null);

    /** Where the row a tap opened is drawn now, and -1 once the list holds no row of that id. */
    const tappedAt = $derived.by(() => {
        const held = tapped;
        return held === null ? -1 : input.rows().findIndex((row) => row.id === held.id);
    });

    /** The row an event happened in, by its place in this list, and nothing outside a row. */
    function rowAt(target: EventTarget | null): { li: HTMLElement; at: number } | null {
        const list = input.list();
        const li = target instanceof Element ? target.closest('li') : null;
        if (li === null || !(li instanceof HTMLElement) || list === undefined) return null;
        const at = [...list.children].indexOf(li);
        return at < 0 ? null : { li, at };
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
        const li = input.list()?.children[at];
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

    /**
     * Whether a row holds a button it does not draw until it opens, which is what a tap opens it
     * for.
     */
    function reveals(row: TickerRow | undefined): boolean {
        if (row === undefined || !input.actionable() || row.actions === undefined) return false;
        const keep = input.kept()?.(row);
        return row.actions.some((action) => action.id !== keep);
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
        const held = input.list();
        if (!input.reveal() || held === undefined) return;
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

    return {
        opened,

        /** The whole line of a row whose name was found cut, and nothing for any other row. */
        cutText: (row: TickerRow): string | undefined => {
            return cut?.id === row.id ? cut.text : undefined;
        },

        /**
         * Whether the name of a row is cut, read on the row as the pointer or the focus arrives.
         */
        measureCut: (event: Event, row: TickerRow): void => {
            const li = event.currentTarget;
            const name = li instanceof Element ? li.querySelector('.name') : null;
            if (name === null || name.scrollWidth <= name.clientWidth) {
                if (cut?.id === row.id) cut = null;
                return;
            }
            cut = { id: row.id, text: whole(row) };
        },

        /** The row a pointer is in. */
        over: (event: PointerEvent): void => {
            if (event.pointerType === 'touch') return;
            const found = rowAt(event.target);
            if (found === null || pointed?.at === found.at) return;
            pointed = { at: found.at, shown: null };
        },

        /** The pointer leaving the list. */
        leave: (): void => {
            pointed = null;
        },

        /**
         * A finger going down, read for whether the row under it was open before the press reached
         * it.
         */
        down: (event: PointerEvent): void => {
            if (event.pointerType !== 'touch') return;
            const found = rowAt(event.target);
            wasOpen = found !== null && opened(found.at) !== null;
        },

        /**
         * A finger pressing in this list. A tap in a row that was not open opens it and is spent
         * doing that, the click taken before it reaches anything, since what the row would draw was
         * not in the page for the finger to land on; a tap in a row that was already drawing its
         * buttons, however it came to be open, is an ordinary press of whatever is under it, which
         * is what tells the second tap from the first. A row with nothing to draw is never opened,
         * so it costs one tap as it costs the pointer one press. It is the click and not the press
         * under it that opens a row, so what the tap reaches is decided while the row is closed.
         */
        tap: (event: MouseEvent): void => {
            if (!(event instanceof PointerEvent) || event.pointerType !== 'touch') return;
            const found = rowAt(event.target);
            if (found === null || wasOpen) return;
            const row = input.rows()[found.at];
            if (!reveals(row)) return;
            // The press moved the focus onto the row's name on its way here, which is not the
            // reader reaching the row with the keyboard: the tap holds the row open, and it alone,
            // so the pointer entering another row has one thing to close.
            if (keyed !== null && keyed.at === found.at) keyed = null;
            tapped = { id: row.id, shown: null };
            event.preventDefault();
            event.stopPropagation();
        },

        /** The row the keyboard is in. */
        into: (event: FocusEvent): void => {
            const found = rowAt(event.target);
            if (found === null || keyed?.at === found.at) return;
            keyed = { at: found.at, shown: null };
        },

        /** The keyboard leaving this list altogether, rather than stepping inside it. */
        out: (event: FocusEvent): void => {
            const to = event.relatedTarget;
            if (to instanceof Node && input.list()?.contains(to) === true) return;
            keyed = null;
        }
    };
}
