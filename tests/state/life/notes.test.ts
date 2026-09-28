// The pure half of the scratch notes: what a note is filed under, what it is called when it carries
// no title, when it says it was saved, how long it waits before saving, that the wait is one save
// however long the typing goes on, and which keystroke writes its note without waiting at all.
//
// The wait is driven by a clock of this file's own rather than by real time: the scheduler takes
// the two timer calls, so a case runs the wait forward by hand and nothing here sleeps.
//
// What this does NOT cover: the note view's own wiring of the scheduler to its controls, which is
// tests/views/sources/note.test.ts.

import { describe, expect, it } from 'vitest';
import {
    autosaveMs,
    debounce,
    noteId,
    stamp,
    titleOf,
    writesNow,
    type Timer
} from '../../../src/lib/state/life/notes.ts';

/** A clock a case runs forward by hand: every wait it is given, and the one that is still armed. */
function clock(): Timer & { run: () => void; armed: () => number } {
    const waits = new Map<number, () => void>();
    let next = 1;
    return {
        set: (run, ms) => {
            const handle = next;
            next += 1;
            waits.set(handle, () => {
                waits.delete(handle);
                run();
            });
            // The length is what the caller asked for; a case reads it off the last call.
            lengths.push(ms);
            return handle;
        },
        clear: (handle) => {
            waits.delete(handle);
        },
        run: () => {
            for (const fire of [...waits.values()]) fire();
        },
        armed: () => waits.size
    };
}

/** The lengths every scheduler in this file asked for, newest last. */
const lengths: number[] = [];

describe('what a note is filed under', () => {
    it('is the moment it was started, down to the millisecond', () => {
        expect(noteId(new Date(2026, 8, 15, 14, 30, 5, 7))).toBe('20260915-143005-007');
        expect(noteId(new Date(2026, 0, 1, 0, 0, 0, 0))).toBe('20260101-000000-000');
    });

    it('gives two notes started in two milliseconds two names', () => {
        const one = noteId(new Date(2026, 8, 15, 14, 30, 5, 7));
        const two = noteId(new Date(2026, 8, 15, 14, 30, 5, 8));

        expect(one).not.toBe(two);
    });
});

describe('what a note with no title of its own is called', () => {
    it('is the first line with words in it', () => {
        expect(titleOf('  \n\n  the first line  \nthe second\n')).toBe('the first line');
        expect(titleOf('one line')).toBe('one line');
    });

    it('is nothing at all for a note with nothing in it', () => {
        expect(titleOf('')).toBe('');
        expect(titleOf('   \n\t\n')).toBe('');
    });

    it('is cut to one line of a listing, at a whole character', () => {
        const long = `${'a'.repeat(58)} and more words after it`;

        expect(titleOf(long)).toHaveLength(60);
        expect(titleOf(long)).toBe(`${'a'.repeat(58)} a`);
        // A cut that lands on the space keeps no trailing one.
        expect(titleOf(`${'a'.repeat(59)} and more`)).toBe('a'.repeat(59));
    });
});

describe('when a note says it was saved', () => {
    it('is the day and the clock of the moment it was written', () => {
        expect(stamp(new Date(2026, 8, 15, 9, 5).getTime())).toBe('2026-09-15 09:05');
    });

    it('is nothing for a note that has never been written', () => {
        expect(stamp(0)).toBe('');
        expect(stamp(Number.NaN)).toBe('');
    });
});

describe('how long the wait is', () => {
    it('is the number config/behavior.yml carries under notes', () => {
        expect(autosaveMs({ notes: { autosave_ms: 250 } })).toBe(250);
        expect(autosaveMs({ notes: { autosave_ms: 0 } })).toBe(0);
    });

    it('is the built-in number before a configuration push, and for a broken one', () => {
        const before = autosaveMs({});

        expect(before).toBeGreaterThan(0);
        expect(autosaveMs({ notes: 'soon' })).toBe(before);
        expect(autosaveMs({ notes: { autosave_ms: 'soon' } })).toBe(before);
        expect(autosaveMs({ notes: { autosave_ms: -5 } })).toBe(before);
    });
});

describe('the wait before a save', () => {
    it('runs once however many keystrokes went into it', () => {
        const timer = clock();
        let runs = 0;
        const wait = debounce(
            timer,
            () => 800,
            () => (runs += 1)
        );

        wait.poke();
        wait.poke();
        wait.poke();
        expect(runs).toBe(0);
        expect(timer.armed()).toBe(1);

        timer.run();
        expect(runs).toBe(1);
        expect(timer.armed()).toBe(0);
    });

    it('saves what the last keystroke left, not what the first one did', () => {
        const timer = clock();
        let typed = '';
        let written = '';
        const wait = debounce(
            timer,
            () => 800,
            () => (written = typed)
        );

        typed = 'a';
        wait.poke();
        typed = 'ab';
        wait.poke();
        timer.run();

        expect(written).toBe('ab');
    });

    it('runs again for the keystrokes after a save', () => {
        const timer = clock();
        let runs = 0;
        const wait = debounce(
            timer,
            () => 800,
            () => (runs += 1)
        );

        wait.poke();
        timer.run();
        wait.poke();
        timer.run();

        expect(runs).toBe(2);
    });

    it('asks how long to wait at each keystroke, so a pushed number is the next wait', () => {
        const timer = clock();
        let held = 800;
        const wait = debounce(
            timer,
            () => held,
            () => undefined
        );

        wait.poke();
        expect(lengths.at(-1)).toBe(800);
        held = 250;
        wait.poke();
        expect(lengths.at(-1)).toBe(250);
    });

    it('drops the wait when it is cancelled, so nothing is saved after it', () => {
        const timer = clock();
        let runs = 0;
        const wait = debounce(
            timer,
            () => 800,
            () => (runs += 1)
        );

        wait.poke();
        wait.cancel();
        timer.run();

        expect(runs).toBe(0);
        expect(timer.armed()).toBe(0);
        // Cancelling twice, which is what a second unmount would do, is not an error.
        expect(() => wait.cancel()).not.toThrow();
    });
});

describe('a wait its caller is going away from', () => {
    it('runs now rather than being dropped, with what the last keystroke left', () => {
        const timer = clock();
        let typed = '';
        let written = '';
        const wait = debounce(
            timer,
            () => 800,
            () => (written = typed)
        );

        typed = 'the last word';
        wait.poke();
        wait.flush();

        expect(written).toBe('the last word');
        expect(timer.armed()).toBe(0);
    });

    it('runs nothing when no keystroke is waiting', () => {
        const timer = clock();
        let runs = 0;
        const wait = debounce(
            timer,
            () => 800,
            () => (runs += 1)
        );

        wait.flush();
        wait.poke();
        timer.run();
        wait.flush();

        expect(runs).toBe(1);
    });
});

describe('the keystroke that writes its note at once', () => {
    it('is the first one into a note whose file is not there yet', () => {
        expect(writesNow(true, false)).toBe(true);
    });

    it('is not the ones after it, which go through the wait like any other', () => {
        expect(writesNow(true, true)).toBe(false);
    });

    it('is not any keystroke into a note that has a file already', () => {
        expect(writesNow(false, false)).toBe(false);
        expect(writesNow(false, true)).toBe(false);
    });
});
