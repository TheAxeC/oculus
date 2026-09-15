// Layer 2, client state. The pure half of the scratch notes: what a note is called, what it is filed
// under, and the wait between the last keystroke and the save.
//
// The wait is a scheduler rather than a setTimeout in the view, so it is a thing a case can drive: it
// is given the two timer calls and hands back a poke, so a fake clock proves that typing on and on
// saves once and that the last text typed is the text saved. Nothing here reads a clock or a timer
// of its own.

/** Two digits, which is what every part of a note's id is except the milliseconds. */
function pad(value: number, width = 2): string {
    return String(value).padStart(width, '0');
}

/**
 * The id one note is filed under: the moment it was started, down to the millisecond, as the file
 * name it becomes. It is the reader's local time rather than UTC, since the folder is theirs and the
 * name is what they see when they open it outside oculus.
 */
export function noteId(now: Date): string {
    const day = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${day}-${time}-${pad(now.getMilliseconds(), 3)}`;
}

/** The longest a title taken from the body may be, so a listing stays one line per note. */
const TITLE_LIMIT = 60;

/**
 * The title a note with no title of its own is listed under: its first line with words in it, cut to
 * one line's worth. A note that is empty has no title, and the view says so in its own words.
 */
export function titleOf(body: string): string {
    for (const line of body.split('\n')) {
        const trimmed = line.trim();
        if (trimmed === '') continue;
        return trimmed.length > TITLE_LIMIT ? trimmed.slice(0, TITLE_LIMIT).trimEnd() : trimmed;
    }
    return '';
}

/**
 * When a note is saved, as the note's own toolbar and the Files view's Notes section say it: the day
 * and the clock, in the reader's own time. A note that has never been written has no time.
 */
export function stamp(when: number): string {
    if (!Number.isFinite(when) || when <= 0) return '';
    const at = new Date(when);
    const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
    return `${day} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/**
 * The wait between the last keystroke and the save. It is `notes.autosave_ms` of
 * config/behavior.yml; the number here is what a page uses before the first configuration push
 * lands, since there is nothing to read until it does.
 */
const AUTOSAVE_MS = 800;

export function autosaveMs(config: Record<string, unknown>): number {
    const held = config.notes;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return AUTOSAVE_MS;
    const value = (held as Record<string, unknown>).autosave_ms;
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : AUTOSAVE_MS;
}

/**
 * Whether a note's tab is closing on nothing: no title, no body, and nothing typed into it. The
 * control that opens a note writes its file before the tab is there, so a note this is true of was
 * made and never used, and closing the tab takes it off the disk rather than leaving an untitled
 * empty note in the folder for good.
 */
export function abandoned(title: string, body: string, touched: boolean): boolean {
    return !touched && title.trim() === '' && body === '';
}

/** The two timer calls a scheduler is given, so a case hands it a clock of its own. */
export type Timer = {
    set: (run: () => void, ms: number) => number;
    clear: (handle: number) => void;
};

/** The browser's own timer, for a caller that has one. */
export const browserTimer: Timer = {
    set: (run, ms) => setTimeout(run, ms) as unknown as number,
    clear: (handle) => clearTimeout(handle)
};

/** What a scheduler offers: put the wait back to the start, run it now, or drop it. */
export type Scheduler = { poke: () => void; flush: () => void; cancel: () => void };

/**
 * A wait that starts again on every poke and runs once it has been left alone for the wait's own
 * length. Typing on and on is therefore one run, with whatever the last poke left behind, since
 * `run` reads the state at the moment it fires rather than at the moment it was scheduled. The
 * length is asked for at each poke rather than fixed, so a configuration push changes the next wait
 * without the caller building a second scheduler and leaving the first one's timer running.
 */
export function debounce(timer: Timer, ms: () => number, run: () => void): Scheduler {
    let handle: number | null = null;
    function cancel(): void {
        if (handle === null) return;
        timer.clear(handle);
        handle = null;
    }
    return {
        poke: () => {
            cancel();
            handle = timer.set(() => {
                handle = null;
                run();
            }, ms());
        },
        // What a caller that is going away calls: a wait still running is run now rather than
        // dropped, so the keystrokes it was holding are not the ones that get lost.
        flush: () => {
            if (handle === null) return;
            cancel();
            run();
        },
        cancel
    };
}
