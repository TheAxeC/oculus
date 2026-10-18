// Layer 4, test. The armed Kill of a Terminal tab
// (views/sessions/terminal/list/kill-arm.svelte.ts): the first press of a terminal's Kill arms it
// and ends nothing, and only a second press of that same terminal's Kill ends it, so a press that
// lands on another row's Kill, or any press after the arm was taken off, never ends a terminal the
// reader did not arm twice. The client runtime has no document, so the file sets vitest's jsdom
// environment up over its globals for its cases, with a `CSS.escape` when jsdom has none. jsdom is
// loaded with the file, so the setup hook only builds the document: loaded inside the hook, under
// the load of a whole suite, it took longer than the hook's limit.

import 'jsdom';
import { flushSync } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { builtinEnvironments } from 'vitest/environments';
import { createKillArm } from '../../../../src/lib/views/sessions/terminal/list/kill-arm.svelte.ts';
import { cell, rooted } from '../../../ui/frame/rooted.svelte.ts';

let dom: { teardown: (global: typeof globalThis) => unknown } | undefined;
beforeAll(async () => {
    dom = await builtinEnvironments.jsdom.setup(globalThis, {});
    if (!('CSS' in globalThis)) {
        Object.assign(globalThis, {
            CSS: { escape: (text: string) => text.replace(/["\\]/g, '\\$&') }
        });
    }
    if (!('PointerEvent' in globalThis)) Object.assign(globalThis, { PointerEvent: MouseEvent });
});
afterAll(() => dom?.teardown(globalThis));

let stops: (() => void)[] = [];
afterEach(() => {
    for (const stop of stops) stop();
    stops = [];
    document.body.replaceChildren();
});

/** A tab's armed Kill over the terminals `a` and `b`, with every stop it asks for recorded. */
function tab() {
    const ended: string[] = [];
    const owned = cell<readonly string[]>(['a', 'b']);
    const made = rooted(() =>
        createKillArm((terminal) => {
            ended.push(terminal);
            return Promise.resolve({ ok: true, error: '' });
        }, owned.get)
    );
    stops.push(made.stop);
    flushSync();
    return { arm: made.value, ended, owned };
}

/** A press of a terminal's Kill control: the pointer press the document sees, then the kill. */
function pressKill(arm: ReturnType<typeof tab>['arm'], terminal: string): void {
    const button = document.createElement('button');
    button.dataset.kill = terminal;
    document.body.append(button);
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    arm.kill(terminal);
    flushSync();
}

describe('the armed Kill of a Terminal tab', () => {
    const rows: {
        row: string;
        presses: string[];
        between?: 'elsewhere' | 'joined';
        ended: string[];
    }[] = [
        { row: 'one press arms the terminal and ends nothing', presses: ['a'], ended: [] },
        {
            row: 'a second press of the same Kill ends that terminal',
            presses: ['a', 'a'],
            ended: ['a']
        },
        {
            row: "a press of another row's Kill arms that row and ends nothing",
            presses: ['a', 'b'],
            ended: []
        },
        {
            row: 'a press elsewhere takes the arm off, so the next press arms again',
            presses: ['a', 'a'],
            between: 'elsewhere',
            ended: []
        },
        {
            row: 'a terminal joining the tab takes the arm off, so the next press arms again',
            presses: ['a', 'a'],
            between: 'joined',
            ended: []
        }
    ];
    it.each(rows)('$row', async ({ presses, between, ended }) => {
        const held = tab();
        pressKill(held.arm, presses[0]);
        expect(held.arm.armed()).toBe(presses[0]);
        if (between === 'elsewhere') {
            document.body.dispatchEvent(
                new PointerEvent('pointerdown', { bubbles: true, button: 0 })
            );
            flushSync();
        }
        if (between === 'joined') {
            held.owned.set(['a', 'b', 'c']);
            flushSync();
        }
        for (const terminal of presses.slice(1)) pressKill(held.arm, terminal);
        await Promise.resolve();
        expect(held.ended).toEqual(ended);
    });
});
