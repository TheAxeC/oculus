// Layer 2, client-state tests. The notifications store: a post from anywhere is one call, the list
// is newest first, the bell's count is what has not been seen, a toast shows unless Do Not Disturb
// is on, and each can be put away or cleared, one or all.
//
// What this does NOT cover: the bell, the centre and the toasts drawn and pressed.

import { describe, expect, it } from 'vitest';
import { createNotices } from '../../../../src/lib/state/workbench/navigation/notices.svelte.ts';

/** A ui store's Do Not Disturb, set by the case. */
function quiet(on = false): { statusQuiet: () => boolean; set: (value: boolean) => void } {
    let held = on;
    return { statusQuiet: () => held, set: (value) => (held = value) };
}

describe('the notifications store', () => {
    it('lists a post newest first, with its words, tone, time and actions, unread and toasting', () => {
        let now = 1000;
        const store = createNotices(quiet(), () => now);
        const run = (): void => undefined;
        const first = store.post('first');
        now = 2000;
        const second = store.post('second', { tone: 'error', actions: [{ label: 'Go', run }] });
        expect(first).not.toBe(second);
        expect(store.list().map((notice) => notice.message)).toEqual(['second', 'first']);
        expect(store.list()[0]).toMatchObject({
            tone: 'error',
            at: 2000,
            read: false,
            toast: true,
            actions: [{ label: 'Go', run }]
        });
        expect(store.list()[1]).toMatchObject({ tone: 'info', at: 1000, actions: [] });
        expect(store.unread()).toBe(2);
        expect(store.toasts().map((notice) => notice.id)).toEqual([second, first]);
    });

    it('shows no toast for a post while Do Not Disturb is on, and keeps it in the list', () => {
        const ui = quiet(true);
        const store = createNotices(ui);
        store.post('quiet');
        expect(store.toasts()).toEqual([]);
        expect(store.list()).toHaveLength(1);
        expect(store.unread()).toBe(1);
        ui.set(false);
        store.post('loud');
        expect(store.toasts().map((notice) => notice.message)).toEqual(['loud']);
    });

    it('puts a toast away and keeps its entry, and marks everything seen', () => {
        const store = createNotices(quiet());
        const one = store.post('one');
        store.post('two');
        store.settle(one);
        expect(store.toasts().map((notice) => notice.message)).toEqual(['two']);
        expect(store.list()).toHaveLength(2);
        store.settleAll();
        expect(store.toasts()).toEqual([]);
        store.markRead();
        expect(store.unread()).toBe(0);
        store.post('three');
        expect(store.unread()).toBe(1);
    });

    it('clears one entry, and every entry', () => {
        const store = createNotices(quiet());
        const one = store.post('one');
        store.post('two');
        store.clear(one);
        expect(store.list().map((notice) => notice.message)).toEqual(['two']);
        store.clear(99);
        expect(store.list()).toHaveLength(1);
        store.clearAll();
        expect(store.list()).toEqual([]);
        expect(store.unread()).toBe(0);
    });
});
