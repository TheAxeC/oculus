// Layer 2, client-state tests. The armed keep and the ask for the keyboard
// (state/workbench/layout/open/armed-keep.svelte.ts), in Svelte's client runtime since both are
// $state: which press arms a keep for which tab, when the window ends it, who may end it, and
// which kept tab holds the ask for the keyboard.
//
// It does not cover the layer a pane draws while a keep is armed or the focus the pane gives, which
// the look does.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Instance } from '../../../../src/lib/state/workbench/layout/model.ts';
import { createArmedKeeps } from '../../../../src/lib/state/workbench/layout/open/armed-keep.svelte.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const PREVIEW: Instance = { id: 'p', view: 'source', state: {}, preview: true };
const KEPT: Instance = { id: 'k', view: 'source', state: {} };

/** Keeps over a preview tab and a kept tab, with a clock the test moves. */
function make(now: number) {
    const clock = { at: now };
    const keeps = createArmedKeeps(
        (id) => [PREVIEW, KEPT].find((one) => one.id === id) ?? null,
        () => clock.at
    );
    return { keeps, clock };
}

describe('the armed keep and the ask for the keyboard', () => {
    // A press is made at 1000 ms on the clock; `now` is when the tree arms the keep for it.
    it.each([
        { row: 'a preview tab', id: 'p', now: 1000, owner: 'files-1' },
        { row: 'a preview tab, 499 ms after the press', id: 'p', now: 1499, owner: 'files-1' },
        { row: 'a kept tab', id: 'k', now: 1000, owner: null },
        { row: 'an id no tab has', id: 'gone', now: 1000, owner: null },
        { row: 'a preview tab, 500 ms after the press', id: 'p', now: 1500, owner: null },
        { row: 'a preview tab, 600 ms after the press', id: 'p', now: 1600, owner: null }
    ])('arms for $row: owner $owner', ({ id, now, owner }) => {
        const { keeps } = make(now);
        keeps.arm(id, 'files-1', 1000);
        expect(keeps.armed()?.owner ?? null).toBe(owner);
    });

    it.each([
        { row: 'the clock passes the rest of the window', by: 300, armed: false },
        { row: 'the clock is a millisecond short of it', by: 299, armed: true }
    ])('ends an armed keep when $row: armed $armed', ({ by, armed }) => {
        const { keeps } = make(1200);
        keeps.arm('p', 'files-1', 1000);
        vi.advanceTimersByTime(by);
        expect(keeps.armed() !== null).toBe(armed);
    });

    it.each([
        { row: 'another owner', owner: 'files-2', armed: true },
        { row: 'its owner', owner: 'files-1', armed: false },
        { row: 'no owner', owner: undefined as string | undefined, armed: false }
    ])('a disarm from $row leaves armed $armed', ({ owner, armed }) => {
        const { keeps } = make(1000);
        keeps.arm('p', 'files-1', 1000);
        keeps.disarm(owner);
        expect(keeps.armed() !== null).toBe(armed);
    });

    it.each([
        { row: 'no ask', steps: [] as string[][], asked: null },
        { row: 'an ask for a', steps: [['ask', 'a']], asked: 'a' },
        {
            row: 'an ask for a, then for b',
            steps: [
                ['ask', 'a'],
                ['ask', 'b']
            ],
            asked: 'b'
        },
        {
            row: 'asks for a and b, then a is given the keyboard',
            steps: [
                ['ask', 'a'],
                ['ask', 'b'],
                ['given', 'a']
            ],
            asked: 'b'
        },
        {
            row: 'an ask for b, then b is given it',
            steps: [
                ['ask', 'b'],
                ['given', 'b']
            ],
            asked: null
        }
    ])('answers $asked after $row', ({ steps, asked }) => {
        const { keeps } = make(1000);
        for (const [step, id] of steps) {
            if (step === 'ask') keeps.askFocus(id);
            else keeps.focusGiven(id);
        }
        expect(keeps.focusAsked()).toBe(asked);
    });

    it('keeps the ask when the keep is disarmed', () => {
        const { keeps } = make(1000);
        keeps.arm('p', 'files-1', 1000);
        keeps.askFocus('p');
        keeps.disarm();
        expect(keeps.focusAsked()).toBe('p');
    });
});
