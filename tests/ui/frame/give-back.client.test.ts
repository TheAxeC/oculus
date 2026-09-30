// Layer 4, test. The focus a dialog gives back when it goes, run in Svelte's client runtime
// (tests/ui/frame/client-runtime.ts): the cleanup of an effect is where the dialog gives it, and a
// browser runs the focus handlers of the control it lands on at once. Inside a teardown Svelte
// answers every read of state changed in the same flush with the value from before the change, so
// a handler run there that writes the arrangement writes the one from before the close. The cases
// here are the pane menu's Close pane answered yes, where the focus goes back to the menu opener of
// the pane just closed, and the palette answered by showing a tab in another pane, where it goes
// back to a control in the pane the reader was in; each control's focus handler activates its
// pane's tab, as PaneView.svelte's entered does. The remaining cases are the conditions under which
// the focus is given back at all.
//
// It does not cover Modal.svelte: the component is not mounted, drawDialog stands for its cleanup.
// `document` and `HTMLElement` are stubs with only what the give-back reads, and bits-ui's focus
// scope, which also moves the focus while a dialog closes, is not reached.

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../../src/lib/state/client/context.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { LAYOUT_KEY } from '../../../src/lib/state/workbench/layout.svelte.ts';
import { focusIsFree } from '../../../src/lib/ui/frame/quiet-focus.ts';
import { bench, fakeStorage, pane, split } from '../../state/workbench/layout/layout-fixture.ts';
import { drawDialog } from './give-back.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The page's document with only what the give-back reads: the body and what holds the focus. */
const page: { body: Control; activeElement: Control | null } = {
    body: undefined as unknown as Control,
    activeElement: null
};

/** The page's element with only what the give-back uses: a focus lands on it, runs its handler. */
class Control {
    isConnected = true;
    focused = 0;
    constructor(private readonly onfocus: () => void = () => undefined) {}
    setAttribute = (): void => undefined;
    removeAttribute = (): void => undefined;
    focus(): void {
        this.focused += 1;
        page.activeElement = this;
        this.onfocus();
    }
}

/** A control as the give-back takes it, which is an element. */
function asElement(control: Control): Element {
    return control as unknown as Element;
}

beforeEach(() => {
    vi.stubGlobal('HTMLElement', Control);
    page.body = new Control();
    page.activeElement = page.body;
    vi.stubGlobal('document', page);
});
afterEach(() => vi.unstubAllGlobals());

/** A page of two panes, the second holding two tabs with `b` shown, saved to its own storage. */
function twoPanes() {
    const client = createClientState();
    const storage = fakeStorage();
    client.layout.loadLayout(storage);
    client.layout.apply(bench(split('row', [0.5, 0.5], [pane(['c']), pane(['a', 'b'], 'b')])));
    return { client, storage, id: client.layout.currentPage().id };
}

/** Flush the effects, then let the queued give-back run. */
async function settle(): Promise<void> {
    flushSync();
    await Promise.resolve();
}

describe('the focus a dialog gives back', () => {
    it('leaves a pane closed from its own menu closed, in memory and in storage', async () => {
        const { client, storage, id } = twoPanes();
        // The pane's menu opener: its focus handler is the pane's entered().
        const opener = new Control(() => {
            client.layout.touchPane(id);
            client.layout.activateInstance('b', id);
        });
        const dialog = drawDialog(asElement(opener));
        flushSync();
        dialog.answer(() => client.layout.closePane([1], id));
        await settle();
        expect(opener.focused).toBe(1);
        expect(JSON.stringify(client.layout.layout(id))).not.toContain('"b"');
        expect(storage.held[LAYOUT_KEY]).not.toContain('"b"');
    });

    it('keeps the tab an answer activated in another pane active', async () => {
        const { client, storage, id } = twoPanes();
        // The palette's shape: opened with the focus in the first pane, answered by showing tab a.
        const opener = new Control(() => {
            client.layout.touchPane(id);
            client.layout.activateInstance('c', id);
        });
        const dialog = drawDialog(asElement(opener));
        flushSync();
        dialog.answer(() => client.layout.activateInstance('a', id));
        await settle();
        expect(opener.focused).toBe(1);
        expect(JSON.stringify(client.layout.layout(id))).toContain('"active":"a"');
        expect(storage.held[LAYOUT_KEY]).toContain('"active":"a"');
    });

    it('gives the focus back once the dialog is gone, while the control is on the page', async () => {
        const opener = new Control();
        const dialog = drawDialog(asElement(opener));
        flushSync();
        dialog.answer(() => undefined);
        await settle();
        expect(opener.focused).toBe(1);
    });

    it('leaves the focus with a control that took it before the dialog could give it back', async () => {
        const opener = new Control();
        const dialog = drawDialog(asElement(opener));
        flushSync();
        dialog.answer(() => undefined);
        flushSync();
        page.activeElement = new Control();
        await Promise.resolve();
        expect(opener.focused).toBe(0);
    });

    it('gives no focus to a control taken off the page before it could', async () => {
        const opener = new Control();
        const dialog = drawDialog(asElement(opener));
        flushSync();
        dialog.answer(() => undefined);
        flushSync();
        opener.isConnected = false;
        await Promise.resolve();
        expect(opener.focused).toBe(0);
    });

    it('gives nothing back when the answer draws a second dialog that takes the focus', async () => {
        const handler = vi.fn();
        const opener = new Control(handler);
        const inner = new Control();
        const first = drawDialog(asElement(opener));
        flushSync();
        first.answer(() => {
            drawDialog(asElement(page.body), () => inner.focus());
        });
        await settle();
        expect(page.activeElement).toBe(inner);
        expect(opener.focused).toBe(0);
        expect(handler).not.toHaveBeenCalled();
    });

    it('counts a control taken off the page as holding nothing', async () => {
        const opener = new Control();
        const dialog = drawDialog(asElement(opener));
        flushSync();
        dialog.answer(() => undefined);
        flushSync();
        const gone = new Control();
        gone.isConnected = false;
        page.activeElement = gone;
        await Promise.resolve();
        expect(opener.focused).toBe(1);
    });

    it('counts the document holding no element as holding nothing', async () => {
        const opener = new Control();
        const dialog = drawDialog(asElement(opener));
        flushSync();
        dialog.answer(() => undefined);
        flushSync();
        page.activeElement = null;
        await Promise.resolve();
        expect(opener.focused).toBe(1);
    });

    it('lets the first of two dialogs taken away together take the focus and the second find it held', async () => {
        const first = new Control();
        const second = new Control();
        const one = drawDialog(asElement(first));
        const two = drawDialog(asElement(second));
        flushSync();
        one.answer(() => undefined);
        two.answer(() => undefined);
        await settle();
        expect(first.focused).toBe(1);
        expect(second.focused).toBe(0);
        expect(page.activeElement).toBe(first);
    });

    it('gives the focus back to the body when the dialog was opened with the body focused', async () => {
        const dialog = drawDialog(asElement(page.body));
        flushSync();
        dialog.answer(() => undefined);
        await settle();
        expect(page.body.focused).toBe(1);
    });
});

describe('focusIsFree', () => {
    it('is true for no focused element, the body and a control off the page, false for a control on it', () => {
        const off = new Control();
        off.isConnected = false;
        const answers = [null, page.body, off, new Control()].map((held) => {
            page.activeElement = held;
            return focusIsFree();
        });
        expect(answers).toEqual([true, true, true, false]);
    });
});
