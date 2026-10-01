// The appearance store when several browser tabs of one server write the one key. Each tab saves
// the state its views remember, one record per view instance, and a tab that saves must not drop
// the records another tab saved; a tab also takes the records another tab saved when the browser
// says so, and keeps its own appearance.
//
// Client states stand for browser tabs over one fake Storage, and an EventTarget stands for each
// one's window: a case raises the event the browser would fire. Nothing here touches localStorage
// or the DOM.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { setAppearance, themes } from '../../../src/lib/state/shared/words/appearance.ts';
import { UI_KEY } from '../../../src/lib/state/workbench/ui.svelte.ts';
import { createClientState } from '../../fixtures/client.ts';

setAppearance(loadConfig(engineDir()).config);

/** A fake Storage with a count of what was written. */
function fakeStorage() {
    const held: Record<string, string> = {};
    const writes: string[] = [];
    return {
        held,
        writes,
        getItem: (key: string): string | null => held[key] ?? null,
        setItem: (key: string, value: string): void => {
            writes.push(key);
            held[key] = value;
        }
    };
}

type Storage = ReturnType<typeof fakeStorage>;

/** A browser tab: its client state, loaded from the storage it shares, and its window. */
function browserTab(storage: Storage, follow = true) {
    const client = createClientState();
    const window = new EventTarget();
    client.ui.loadUi(storage, follow ? window : undefined);
    return { ui: client.ui, window };
}

/** What the browser fires in the other tabs when one of them writes `key`. */
function written(window: EventTarget, key: string = UI_KEY): void {
    window.dispatchEvent(Object.assign(new Event('storage'), { key }));
}

/** The instance records the storage holds. */
function records(storage: Storage): Record<string, unknown> {
    return (JSON.parse(storage.held[UI_KEY]) as { instances: Record<string, unknown> }).instances;
}

describe('two browser tabs saving the state their views remember', () => {
    it('keep the record each one changed when both have saved', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        const second = browserTab(storage);
        first.ui.setInstanceState('a', { filter: 'active' });
        second.ui.setInstanceState('b', { draft: 'text' });
        expect(records(storage)).toEqual({ a: { filter: 'active' }, b: { draft: 'text' } });
        expect(second.ui.instanceState('a')).toEqual({ filter: 'active' });
    });

    it('keep the change of a record both held when the other saves another record later', () => {
        const storage = fakeStorage();
        const seed = browserTab(storage);
        seed.ui.setInstanceState('a', 1);
        const first = browserTab(storage);
        const second = browserTab(storage);
        first.ui.setInstanceState('a', 2);
        second.ui.setInstanceState('b', 3);
        expect(records(storage)).toEqual({ a: 2, b: 3 });
    });

    it('do not bring back a record the other removed, and drop it in the tab that saves', () => {
        const storage = fakeStorage();
        const seed = browserTab(storage);
        seed.ui.setInstanceState('x', 'gone');
        seed.ui.setInstanceState('y', 'kept');
        const first = browserTab(storage);
        const second = browserTab(storage);
        second.ui.clearInstanceState('x');
        first.ui.setInstanceState('a', 1);
        expect(records(storage)).toEqual({ y: 'kept', a: 1 });
        expect(first.ui.instanceState('x')).toBe(undefined);
    });

    it('remove the record they removed themselves', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        first.ui.setInstanceState('x', 1);
        const second = browserTab(storage);
        second.ui.setInstanceState('b', 2);
        first.ui.clearInstanceState('x');
        expect(records(storage)).toEqual({ b: 2 });
    });

    it('save their own records when the stored value cannot be read', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        storage.held[UI_KEY] = '{ not the ui state';
        first.ui.setInstanceState('a', 1);
        expect(records(storage)).toEqual({ a: 1 });
    });

    it('write every record they hold when the stored value becomes unreadable after a save', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        first.ui.setInstanceState('a', 1);
        expect(records(storage)).toEqual({ a: 1 });
        storage.held[UI_KEY] = '{ not the ui state';
        first.ui.setInstanceState('b', 2);
        expect(records(storage)).toEqual({ a: 1, b: 2 });
    });
});

describe('a browser tab told that another one saved', () => {
    it('takes the records the other saved and keeps its own appearance', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        const second = browserTab(storage);
        const [one, other] = themes().map((entry) => entry.name);
        first.ui.setTheme(one);
        second.ui.setTheme(other);
        second.ui.setInstanceState('b', { draft: 'text' });
        expect(first.ui.instanceState('b')).toBe(undefined);

        written(first.window);
        expect(first.ui.instanceState('b')).toEqual({ draft: 'text' });
        expect(first.ui.theme()).toBe(one);
    });

    it('drops a record the other removed', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        first.ui.setInstanceState('x', 1);
        const second = browserTab(storage);
        second.ui.clearInstanceState('x');
        written(first.window);
        expect(first.ui.instanceState('x')).toBe(undefined);
    });

    it('writes nothing back, and hears no other key, no value and no value that parses', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        const second = browserTab(storage);
        second.ui.setInstanceState('b', 1);
        const before = storage.writes.length;
        written(first.window, 'oculus.layout.v1');
        expect(first.ui.instanceState('b')).toBe(undefined);
        written(first.window);
        expect(first.ui.instanceState('b')).toBe(1);
        storage.held[UI_KEY] = '{ not the ui state';
        written(first.window);
        expect(first.ui.instanceState('b')).toBe(1);
        expect(storage.writes.length).toBe(before);
    });

    it('follows nothing when loaded without a window, after it stops following, or on a second load for the older window', () => {
        const storage = fakeStorage();
        const writer = browserTab(storage);
        writer.ui.setInstanceState('b', 1);
        const loose = browserTab(storage, false);
        writer.ui.setInstanceState('c', 2);
        written(loose.window);
        expect(loose.ui.instanceState('c')).toBe(undefined);

        const stopped = browserTab(storage);
        stopped.ui.stopFollowing();
        writer.ui.setInstanceState('d', 3);
        written(stopped.window);
        expect(stopped.ui.instanceState('d')).toBe(undefined);

        const tab = createClientState();
        const older = new EventTarget();
        const newer = new EventTarget();
        tab.ui.loadUi(storage, older);
        tab.ui.loadUi(storage, newer);
        writer.ui.setInstanceState('e', 4);
        written(older);
        expect(tab.ui.instanceState('e')).toBe(undefined);
        written(newer);
        expect(tab.ui.instanceState('e')).toBe(4);
    });
});

describe('a browser tab whose storage refuses a write', () => {
    it('keeps every record it holds in memory and writes them again at the next save', () => {
        const held: Record<string, string> = {};
        let refusing = false;
        const storage = {
            held,
            writes: [] as string[],
            getItem: (key: string): string | null => held[key] ?? null,
            setItem: (key: string, value: string): void => {
                if (refusing) throw new Error('quota');
                held[key] = value;
            }
        };
        const tab = browserTab(storage);
        tab.ui.setInstanceState('a', 1);
        refusing = true;
        tab.ui.setInstanceState('b', 2);
        expect(tab.ui.instanceState('b')).toBe(2);
        refusing = false;
        tab.ui.setInstanceState('c', 3);
        expect(records(storage)).toEqual({ a: 1, b: 2, c: 3 });
    });
});
