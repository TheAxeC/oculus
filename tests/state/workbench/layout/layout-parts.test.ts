// Layer 2, client-state tests. The two parts of the layout store that stand alone from its reactive
// page list: the storage an arrangement is written to and read back from, and the memory of what
// the reader last acted in.
//
// Neither needs a mounted shell, so both are built here directly rather than through createLayout:
// the storage takes nothing at all, and the attention takes an access object, which is a page list
// and the four readers over it. What this does NOT cover is either part wired into the store, which
// is tests/state/workbench/layout/layout.test.ts, tests/state/workbench/layout/pages.test.ts and
// tests/state/workbench/layout/open/show-in-files.test.ts.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_KEY,
    PREVIOUS_KEY,
    createAttention,
    createStorage,
    newPage,
    pageLeaf,
    parseLayout,
    type LayoutAccess,
    type Page,
    type Pages,
    type Storable
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { createUi } from '../../../../src/lib/state/workbench/ui.svelte.ts';
import { bench, pane, split } from './layout-fixture.ts';

/** A storage that records what it was handed. */
function fake(): Storable & { held: Record<string, string> } {
    const held: Record<string, string> = {};
    return {
        held,
        getItem: (key: string): string | null => held[key] ?? null,
        setItem: (key: string, value: string): void => {
            held[key] = value;
        }
    };
}

/** A storage that refuses both ways, which is what a browser with site data blocked is. */
function refusing(): Storable {
    return {
        getItem: (): string | null => {
            throw new Error('refused');
        },
        setItem: (): void => {
            throw new Error('refused');
        }
    };
}

/** One page list, and the readers over it the attention is given. */
function access(pages: Page[], current: string): LayoutAccess {
    const held = (): Pages => ({ pages, current, floats: [] });
    const pageOf = (id: string): Page | null => pages.find((page) => page.id === id) ?? null;
    const currentPage = (): Page => pageOf(current) ?? pages[0];
    const unused = (): never => {
        throw new Error('the attention reaches no arrangement');
    };
    return {
        held,
        save: unused,
        currentPage,
        pageOf,
        at: (page?: string): Page | null => (page === undefined ? currentPage() : pageOf(page)),
        holding: unused,
        workbench: unused,
        layout: unused,
        apply: unused,
        change: unused,
        restorePanes: unused,
        ui: createUi()
    };
}

/** The pages a load of one page starts from, with its id to address it by. */
function onePage(): { pages: Page[]; page: Page } {
    const page = newPage('one', bench(pane(['a'])));
    return { pages: [page], page };
}

describe('the layout storage', () => {
    it('writes nothing before a load has attached a storage', () => {
        const storage = createStorage();
        const held = fake();
        storage.write({ pages: [newPage('one')], current: 'one', floats: [] });
        storage.remember(PREVIOUS_KEY, 'held');
        storage.attach(held);
        // Revert: in write of state/workbench/layout/saved/storage.ts, drop both the `backing ===
        // null` guard and the try/catch around the setItem call, which is what leaves the write
        // nowhere to go.
        expect(Object.keys(held.held)).toEqual([]);
        expect(storage.read(LAYOUT_KEY)).toBe(null);
    });

    it('writes a set of pages under LAYOUT_KEY, in the form parseLayout reads', () => {
        const storage = createStorage();
        const held = fake();
        storage.attach(held);
        const { pages, page } = onePage();
        storage.write({ pages, current: page.id, floats: [] });
        // Revert: in write of state/workbench/layout/saved/storage.ts, write under PREVIOUS_KEY.
        expect(Object.keys(held.held)).toEqual([LAYOUT_KEY]);
        const read = parseLayout(held.held[LAYOUT_KEY], '');
        expect(read?.pages.map((one) => one.label)).toEqual(['one']);
    });

    it('answers null for a storage that refuses to be read, and keeps running', () => {
        const storage = createStorage();
        storage.attach(refusing());
        // Revert: drop the try/catch in read of state/workbench/layout/saved/storage.ts and return
        // the getItem call.
        expect(storage.read(LAYOUT_KEY)).toBe(null);
    });

    it('swallows a storage that refuses to be written', () => {
        const storage = createStorage();
        storage.attach(refusing());
        const { pages, page } = onePage();
        // Revert: drop either try/catch in remember or write of
        // state/workbench/layout/saved/storage.ts.
        expect(() => storage.remember(PREVIOUS_KEY, '')).not.toThrow();
        expect(() => storage.write({ pages, current: page.id, floats: [] })).not.toThrow();
    });
});

describe('the page the reader is in', () => {
    it('is the page on screen before any pane has been acted in', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        // Revert: drop the `if (held === null) return current;` line from touched() in
        // state/workbench/layout/open/attention.ts.
        expect(attention.touched().id).toBe(page.id);
    });

    it('is the page of the pane last acted in, while the screen still draws that page', () => {
        const second = newPage('two', bench(pane(['b'])));
        const first = newPage(
            'one',
            bench(split('row', [0.5, 0.5], [pane(['a']), pageLeaf(second.id)]))
        );
        const attention = createAttention(access([first, second], first.id));
        attention.touchPane(second.id);
        // Revert: in touched() of state/workbench/layout/open/attention.ts, answer the current page
        // always.
        expect(attention.touched().id).toBe(second.id);
    });

    it('is the page on screen when the page of that pane is drawn nowhere', () => {
        const first = newPage('one', bench(pane(['a'])));
        const second = newPage('two', bench(pane(['b'])));
        const attention = createAttention(access([first, second], first.id));
        attention.touchPane(second.id);
        // Revert: drop the showsPage condition from touched() in
        // state/workbench/layout/open/attention.ts and answer the page last touched whenever the
        // list still holds it.
        expect(attention.touched().id).toBe(first.id);
    });

    it('is not moved by a pane claimed for a page the strip does not hold', () => {
        const second = newPage('two', bench(pane(['b'])));
        const first = newPage(
            'one',
            bench(split('row', [0.5, 0.5], [pane(['a']), pageLeaf(second.id)]))
        );
        const attention = createAttention(access([first, second], first.id));
        attention.touchPane(second.id);
        attention.touchPane('a page that is gone');
        // Revert: drop the `access.pageOf(page) !== null` guard from touchPane in attention.ts,
        // which lets an id naming no page overwrite the pane the reader really acted in.
        expect(attention.touched().id).toBe(second.id);
    });

    it('goes back to the page on screen once the pane last acted in is forgotten', () => {
        const second = newPage('two', bench(pane(['b'])));
        const first = newPage(
            'one',
            bench(split('row', [0.5, 0.5], [pane(['a']), pageLeaf(second.id)]))
        );
        const attention = createAttention(access([first, second], first.id));
        attention.touchPane(second.id);
        attention.forgetTouched();
        // Revert: make forgetTouched of state/workbench/layout/open/attention.ts a no-op.
        expect(attention.touched().id).toBe(first.id);
    });
});

describe('the instance a page was left on', () => {
    it('is answered per page, and is forgotten with the page', () => {
        const first = newPage('one', bench(pane(['a'])));
        const second = newPage('two', bench(pane(['b'])));
        const attention = createAttention(access([first, second], first.id));
        attention.remembered('a', first.id);
        attention.remembered('b', second.id);
        expect(attention.active(first.id)).toBe('a');
        expect(attention.active(second.id)).toBe('b');
        attention.forgetPage(first.id);
        // Revert: drop the `delete lastActive[id]` line from forgetPage in attention.ts.
        expect(attention.active(first.id)).toBe(null);
        expect(attention.active(second.id)).toBe('b');
    });

    it('is forgotten on every page at once by a load', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        attention.remembered('a', page.id);
        attention.clear();
        // Revert: drop the loop over Object.keys(lastActive) from clear in attention.ts.
        expect(attention.active(page.id)).toBe(null);
    });

    it('keeps the tabs a page received that are still on it, newest last, each once', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        attention.rememberReceived(page.id, 'a', pane(['a']));
        attention.rememberReceived(page.id, 'b', pane(['a', 'b']));
        attention.rememberReceived(page.id, 'c', pane(['b', 'c']));
        attention.rememberReceived(page.id, 'b', pane(['b', 'c']));
        expect(attention.received(page.id)).toEqual(['c', 'b']);
    });

    it('forgets the tabs a page received with the page', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        attention.rememberReceived(page.id, 'a', pane(['a']));
        attention.forgetPage(page.id);
        expect(attention.received(page.id)).toEqual([]);
    });
});

describe('the pane the last openBeside made', () => {
    const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);

    it('is nothing on a page no view has been opened beside on', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        // Revert: drop the `if (held === undefined) return null;` line from besidePath in
        // state/workbench/layout/open/attention.ts.
        expect(attention.besidePath(tree, page.id)).toBe(null);
    });

    it('is the path of the instance that pane was made with', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        attention.rememberBeside(page.id, { made: 'b', from: 'a' });
        // Revert: answer null from besidePath of state/workbench/layout/open/attention.ts.
        expect(attention.besidePath(tree, page.id)).toEqual([1]);
        expect(attention.beside(page.id)).toEqual({ made: 'b', from: 'a' });
    });

    it('is nothing once the instance it was made with is gone from the page', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        attention.rememberBeside(page.id, { made: 'gone', from: 'a' });
        // Revert: drop the `if (made === null) return null;` line from besidePath in attention.ts.
        expect(attention.besidePath(tree, page.id)).toBe(null);
    });

    it('is nothing once the tab it was made for is back in the same pane', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        attention.rememberBeside(page.id, { made: 'b', from: 'a' });
        const together = split('row', [0.5, 0.5], [pane([]), pane(['a', 'b'])]);
        // Revert: drop the samePath check on `made` and `from` from besidePath in attention.ts.
        expect(attention.besidePath(together, page.id)).toBe(null);
    });

    it('is forgotten with its page', () => {
        const { pages, page } = onePage();
        const attention = createAttention(access(pages, page.id));
        attention.rememberBeside(page.id, { made: 'b', from: 'a' });
        attention.forgetPage(page.id);
        // Revert: drop the `lastBeside.delete(id)` line from forgetPage in attention.ts.
        expect(attention.besidePath(tree, page.id)).toBe(null);
    });
});
