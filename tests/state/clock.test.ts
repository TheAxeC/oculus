// Layer 4, state test. The minute clock the Focus board's day is derived from: it moves on its own,
// it runs only while a view holds it, and one interval serves however many views read it.
//
// What this does NOT cover: the redraw. There is no DOM in this suite, so nothing observes the rune;
// what is checked is the value the board's $derived reads and the timer behind it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { minuteNow, startMinuteClock } from '../../src/lib/state/clock.svelte.ts';

const MINUTE = 60000;
const MIDNIGHT = Date.parse('2026-09-14T23:59:30Z');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MIDNIGHT);
});

afterEach(() => {
    vi.useRealTimers();
});

describe('the minute clock', () => {
    it('holds the moment the clock was started at', () => {
        const stop = startMinuteClock();
        expect(minuteNow()).toBe(MIDNIGHT);
        stop();
    });

    it('moves once a minute, so a board left open across midnight counts the new day', () => {
        const stop = startMinuteClock();
        const before = new Date(minuteNow()).getUTCDate();
        vi.advanceTimersByTime(MINUTE);
        const after = new Date(minuteNow()).getUTCDate();
        expect(minuteNow()).toBe(MIDNIGHT + MINUTE);
        expect(after).not.toBe(before);
        stop();
    });

    it('stops when the last reader goes, and not while another still holds it', () => {
        const one = startMinuteClock();
        const two = startMinuteClock();
        one();
        vi.advanceTimersByTime(MINUTE);
        expect(minuteNow()).toBe(MIDNIGHT + MINUTE);
        two();
        vi.advanceTimersByTime(MINUTE * 5);
        expect(minuteNow()).toBe(MIDNIGHT + MINUTE);
    });

    it('starts again after the last reader left', () => {
        startMinuteClock()();
        vi.setSystemTime(MIDNIGHT + MINUTE * 10);
        const stop = startMinuteClock();
        expect(minuteNow()).toBe(MIDNIGHT + MINUTE * 10);
        stop();
    });
});
