// The saved workbench is one value under one key, and every browser tab of one server reads and
// writes it. A browser tab that saves fires the `storage` event in the others, and each of them
// takes the pages that were saved while it keeps showing the page it was showing; a Terminal tab
// one browser tab added is therefore still there when another has saved a change and the page is
// reloaded, which is what the reload after a server restart does.
//
// Client states stand for browser tabs over one fake Storage, and an EventTarget stands for each
// one's window: a case raises the event the browser would fire. Nothing here touches localStorage
// or the DOM.

import { describe, expect, it } from 'vitest';
import { tabsOf } from '../../../../../src/lib/state/workbench/layout/instance.ts';
import { LAYOUT_KEY } from '../../../../../src/lib/state/workbench/layout.svelte.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { fakeStorage } from '../layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const A = 'a1a1a1-shell';

/** A browser tab: its client state, loaded from the storage it shares, and its window. */
function browserTab(storage: ReturnType<typeof fakeStorage>, follow = true) {
    const client = createClientState();
    const window = new EventTarget();
    client.layout.loadLayout(storage, follow ? window : undefined);
    return { client, window };
}

/** A storage that already holds a saved workbench, as one left by an earlier visit does. */
function seeded(): ReturnType<typeof fakeStorage> {
    const storage = fakeStorage();
    const visit = createClientState();
    visit.layout.loadLayout(storage);
    visit.layout.renamePage(visit.layout.currentPage().id, 'Home');
    return storage;
}

/** What the browser fires in the other tabs when one of them writes `key`. */
function written(window: EventTarget, key: string = LAYOUT_KEY): void {
    window.dispatchEvent(Object.assign(new Event('storage'), { key }));
}

/** The ids of every tab of every page a client holds. */
function tabIds(client: ClientState): string[] {
    return client.layout
        .pages()
        .flatMap((page) => tabsOf(page.workbench.root).map((tab) => tab.id));
}

describe('two browser tabs of one server', () => {
    it('keep a Terminal tab one of them added when the other saves a change, and after a reload', () => {
        const storage = fakeStorage();
        const first = browserTab(storage);
        const second = browserTab(storage);
        const home = first.client.layout.currentPage().id;

        const added = first.client.layout.openView(
            'terminal',
            { id: 'kept', terminals: [A], shown: A },
            home
        );
        written(second.window);
        expect(tabIds(second.client)).toContain(added);

        second.client.layout.openPage('Other');
        written(first.window);
        expect(first.client.layout.pages().map((page) => page.label)).toContain('Other');
        expect(tabIds(first.client)).toContain(added);

        const reloaded = browserTab(storage);
        expect(tabIds(reloaded.client)).toContain(added);
    });

    it('keep showing the page each was showing when the other saves', () => {
        const storage = seeded();
        const first = browserTab(storage);
        const second = browserTab(storage);
        const home = first.client.layout.currentPage().id;

        second.client.layout.openPage('Other');
        const other = second.client.layout.currentPage().id;
        written(first.window);
        expect(first.client.layout.currentPage().id).toBe(home);
        expect(second.client.layout.currentPage().id).toBe(other);
    });

    it('show the page the save names when the page shown is gone from it', () => {
        const storage = seeded();
        const first = browserTab(storage);
        const second = browserTab(storage);
        const home = first.client.layout.currentPage().id;

        second.client.layout.openPage('Other');
        const other = second.client.layout.currentPage().id;
        second.client.layout.closePage(home);
        written(first.window);
        expect(first.client.layout.pages().map((page) => page.id)).toEqual([other]);
        expect(first.client.layout.currentPage().id).toBe(other);
    });

    it('write nothing back when they take a save, so a save does not travel on to its writer', () => {
        const storage = fakeStorage();
        let writes = 0;
        const counting = {
            ...storage,
            setItem: (key: string, value: string): void => {
                writes += 1;
                storage.setItem(key, value);
            }
        };
        const first = browserTab(counting);
        const second = browserTab(counting);
        second.client.layout.openPage('Other');
        const before = writes;
        written(first.window);
        expect(writes).toBe(before);
    });

    it('leave the pages alone for an event of another key, a value that does not parse, or no value', () => {
        const storage = fakeStorage();
        let emptied = false;
        const first = browserTab({
            ...storage,
            getItem: (key: string) => (emptied ? null : storage.getItem(key))
        });
        first.client.layout.openPage('Mine');
        const before = JSON.stringify(first.client.layout.pages());

        written(first.window, 'oculus.layout.previous');
        expect(JSON.stringify(first.client.layout.pages())).toBe(before);

        storage.held[LAYOUT_KEY] = '{ not the layout';
        written(first.window);
        expect(JSON.stringify(first.client.layout.pages())).toBe(before);

        emptied = true;
        written(first.window);
        expect(JSON.stringify(first.client.layout.pages())).toBe(before);
    });

    it('take the save of another tab while still waiting for the rail to choose their first page', () => {
        const storage = fakeStorage();
        const waiting = browserTab(storage);
        expect(waiting.client.layout.startingFresh()).toBe(true);
        const other = browserTab(storage);
        other.client.layout.openPage('Other');
        written(waiting.window);
        expect(waiting.client.layout.startingFresh()).toBe(false);
        expect(waiting.client.layout.pages().map((page) => page.label)).toContain('Other');
    });

    it('follow nothing when loaded without a window, or after they stop following', () => {
        const storage = fakeStorage();
        const loose = browserTab(storage, false);
        const stopped = browserTab(storage);
        const writer = browserTab(storage);
        stopped.client.layout.stopFollowing();
        writer.client.layout.openPage('Other');
        written(loose.window);
        written(stopped.window);
        expect(loose.client.layout.pages().map((page) => page.label)).not.toContain('Other');
        expect(stopped.client.layout.pages().map((page) => page.label)).not.toContain('Other');
    });

    it('follow the newest window when loaded again, and not the one before it', () => {
        const storage = fakeStorage();
        const tab = createClientState();
        const older = new EventTarget();
        const newer = new EventTarget();
        tab.layout.loadLayout(storage, older);
        tab.layout.loadLayout(storage, newer);
        const writer = browserTab(storage);
        writer.client.layout.openPage('Other');
        written(older);
        expect(tab.layout.pages().map((page) => page.label)).not.toContain('Other');
        written(newer);
        expect(tab.layout.pages().map((page) => page.label)).toContain('Other');
    });
});
