// Layer 3, view helper. The armed Kill of one Terminal tab: the terminal whose Kill was pressed or
// picked once and waits for the second, and the kill the server refused. The tab holds one, since a
// list row's Kill, a Delete or Backspace on the row, and Kill Terminal on the grid's, the row's and
// the bar's menus all arm and kill through the same `pressKill`.
//
// The arm ends at the second press, which kills, and otherwise at the first of: a pointer press
// elsewhere, Escape, KILL_ARM_MS without the second press, a terminal joining or leaving the tab,
// and, on the list, the keyboard's stop moving off the armed row (`armKept`). A press elsewhere is
// any press outside the armed terminal's own Kill control and outside an open menu, a press inside
// a frame (an app's page, a document tab) included; a right press on the armed terminal's row, grid
// or name on the bar opens that terminal's menu and keeps the arm, so Kill Terminal picked there
// kills. Focus moving does not end it, so a press that moves the focus before it reaches Kill keeps
// the arm it is the second press of.

import { untrack } from 'svelte';

/** How long an armed Kill waits for its second press before it is taken off, in milliseconds. */
const KILL_ARM_MS = 4000;

/** The attributes that carry a terminal's id: a list row, a grid, and the bar's name of it. */
const TERMINAL_PLACES = ['data-terminal-row', 'data-terminal', 'data-terminal-shown'];

/**
 * What a press of a row's Kill, a Delete or Backspace on the row, or a pick of Kill Terminal from
 * the grid's or the row's menu does: a terminal not armed is armed, and the armed one is stopped,
 * the arm taken off first. A refusal of the stop is handed to `fail`.
 */
async function pressKill(
    armed: string,
    terminal: string,
    deps: {
        arm: (terminal: string) => void;
        stop: (terminal: string) => Promise<{ ok: boolean; error: string }>;
        fail: (error: string) => void;
    }
): Promise<void> {
    if (armed !== terminal) {
        deps.arm(terminal);
        return;
    }
    deps.arm('');
    deps.fail('');
    const answer = await deps.stop(terminal);
    if (!answer.ok) deps.fail(answer.error);
}

/**
 * Whether an armed Kill stays armed when the keyboard's stop moves: only while its row is still the
 * stop, so a second Delete or Backspace kills the row the first one armed and no other.
 */
export function armKept(armed: string, stop: string): boolean {
    return armed !== '' && armed === stop;
}

/**
 * Whether a pointer press keeps the arm on `armed`: a press on its own Kill control (the second
 * press), inside an open menu (a pick of Kill Terminal), or a right press or a Ctrl+press (the
 * right click of macOS) on the row, the grid or the bar's name of that terminal, which opens its
 * menu. Any other press is elsewhere.
 */
function pressKeepsArm(
    target: EventTarget | null,
    armed: string,
    press: { button: number; ctrlKey: boolean }
): boolean {
    if (!(target instanceof Element)) return false;
    const id = CSS.escape(armed);
    if (target.closest('[role="menu"]') !== null) return true;
    if (target.closest(`[data-kill="${id}"]`) !== null) return true;
    if (press.button !== 2 && !press.ctrlKey) return false;
    return TERMINAL_PLACES.some((name) => target.closest(`[${name}="${id}"]`) !== null);
}

/**
 * Take the arm on `armed` off at a press elsewhere, at Escape, or after KILL_ARM_MS. Both listeners
 * sit on the document in the capture phase, so a press or key the grid's xterm stops is still seen.
 * A press inside a frame reaches the frame's own document and never this one, so it is seen as the
 * page's window losing the focus to the frame: once the window's `blur` has run, the focus is on a
 * frame of the page. The returned function takes the listeners and the timers away.
 */
function holdArm(doc: Document, armed: string, disarm: () => void): () => void {
    const pressed = (event: PointerEvent): void => {
        if (!pressKeepsArm(event.target, armed, event)) disarm();
    };
    const keyed = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') disarm();
    };
    let framed: ReturnType<typeof setTimeout> | undefined;
    const left = (): void => {
        clearTimeout(framed);
        framed = setTimeout(() => {
            if (doc.activeElement?.tagName === 'IFRAME') disarm();
        }, 0);
    };
    const timer = setTimeout(disarm, KILL_ARM_MS);
    doc.addEventListener('pointerdown', pressed, true);
    doc.addEventListener('keydown', keyed, true);
    doc.defaultView?.addEventListener('blur', left);
    return () => {
        clearTimeout(timer);
        clearTimeout(framed);
        doc.removeEventListener('pointerdown', pressed, true);
        doc.removeEventListener('keydown', keyed, true);
        doc.defaultView?.removeEventListener('blur', left);
    };
}

/** The armed Kill of a tab, as the tab hands it to its list, its grids and its bar. */
export type KillArm = {
    /** The terminal armed, or ''. */
    armed: () => string;
    /** A kill the server refused, until the next kill. */
    failure: () => string;
    /** A press of Kill, or a pick of Kill Terminal: the first arms, the second kills. */
    kill: (terminal: string) => void;
    /** Take the arm off. */
    disarm: () => void;
};

/**
 * The armed Kill of one Terminal tab, made while the tab's component starts, since it holds its own
 * effects: `stop` ends a terminal and `owned` reads the terminals the tab owns.
 */
export function createKillArm(
    stop: (terminal: string) => Promise<{ ok: boolean; error: string }>,
    owned: () => readonly string[]
): KillArm {
    const held = $state({ arming: '', failure: '' });
    const disarm = (): void => {
        held.arming = '';
    };

    // An arm holds only while the tab's terminals stay the same: one joining or leaving takes it
    // off, so an arm set from the grid of a lone terminal never turns a later Delete on its row
    // into a kill.
    let among = '';
    $effect(() => {
        const now = owned().join(' ');
        if (now === among) return;
        among = now;
        untrack(disarm);
    });

    // While a terminal is armed, a press elsewhere, Escape and the timeout take the arm off.
    $effect(() => {
        const armed = held.arming;
        if (armed === '') return;
        return holdArm(document, armed, disarm);
    });

    function kill(terminal: string): void {
        void pressKill(held.arming, terminal, {
            arm: (one) => (held.arming = one),
            stop,
            fail: (error) => (held.failure = error)
        });
    }

    return { armed: () => held.arming, failure: () => held.failure, kill, disarm };
}
