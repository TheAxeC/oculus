// Layer 3, primitive tests. The actions a tab hands up to its pane's breadcrumb bar
// (ui/tabs/tab-actions.svelte.ts), in Svelte's client runtime since `handUp` registers an effect:
// what the pane finds for a tab after the view mounts, after the tab is kept or walked to another
// file in the same view (the instance is replaced by a copy under the same id), after the view is
// torn down, and while none of its actions applies. Snippets are made with `createRawSnippet`.
//
// It does not cover the bar that draws the snippet, which the look does.

import { createRawSnippet, flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { handUp, TabActions } from '../../../src/lib/ui/tabs/tab-actions.svelte.ts';
import { cell, rooted } from '../frame/rooted.svelte.ts';

type Copy = { id: string; steps: number };

/** A snippet that draws nothing; the test compares it by identity. */
function snippet() {
    return createRawSnippet(() => ({ render: () => '<span></span>' }));
}

describe('the actions a tab hands up', () => {
    it('hands the snippet up when the view mounts', () => {
        const actions = new TabActions();
        const mine = snippet();
        const instance = cell<Copy>({ id: 'a', steps: 0 });
        const view = rooted(() =>
            handUp(
                actions,
                () => instance.get().id,
                mine,
                () => true
            )
        );
        flushSync();
        expect(actions.of('a')).toBe(mine);
        view.stop();
    });

    it.each([
        { row: 'a keep (one same-id copy)', copies: 1 },
        { row: 'a keep and a walk in the same view (two same-id copies)', copies: 2 }
    ])('keeps the snippet through $row', ({ copies }) => {
        const actions = new TabActions();
        const mine = snippet();
        const instance = cell<Copy>({ id: 'a', steps: 0 });
        const view = rooted(() =>
            handUp(
                actions,
                () => instance.get().id,
                mine,
                () => true
            )
        );
        flushSync();
        for (let step = 1; step <= copies; step += 1) {
            instance.set({ id: 'a', steps: step });
            flushSync();
        }
        expect(actions.of('a')).toBe(mine);
        view.stop();
    });

    it('takes the snippet back when the view is torn down', () => {
        const actions = new TabActions();
        const instance = cell<Copy>({ id: 'a', steps: 0 });
        const view = rooted(() =>
            handUp(
                actions,
                () => instance.get().id,
                snippet(),
                () => true
            )
        );
        flushSync();
        view.stop();
        expect(actions.of('a')).toBeUndefined();
    });

    it('leaves a newer snippet another view handed up for the same tab', () => {
        const actions = new TabActions();
        const older = snippet();
        const newer = snippet();
        const instance = cell<Copy>({ id: 'a', steps: 0 });
        const view = rooted(() =>
            handUp(
                actions,
                () => instance.get().id,
                older,
                () => true
            )
        );
        flushSync();
        actions.set('a', newer);
        view.stop();
        expect(actions.of('a')).toBe(newer);
    });
});

describe('a tab none of whose actions applies', () => {
    it('hands nothing up until one applies, and takes the snippet back when none does', () => {
        const actions = new TabActions();
        const mine = snippet();
        const instance = cell<Copy>({ id: 'a', steps: 0 });
        const applies = cell(false);
        const view = rooted(() => handUp(actions, () => instance.get().id, mine, applies.get));
        flushSync();
        expect(actions.of('a')).toBeUndefined();
        applies.set(true);
        flushSync();
        expect(actions.of('a')).toBe(mine);
        applies.set(false);
        flushSync();
        expect(actions.of('a')).toBeUndefined();
        view.stop();
    });
});
