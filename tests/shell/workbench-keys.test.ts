// Layer 3, shell tests. The DOM half of the workbench keyboard: the pane the keys act on is found
// from the document, its path is read off the element, and the tab the digit names is activated in
// the store. The document and the element are plain stand-ins, so this runs in the node
// environment; what it does NOT cover is focus, scrolling and event defaults in a browser, which
// tests/browser/keyboard.spec.ts presses for real, nor the other ways the handler finds its pane
// (the pane focused last, the maximised pane, the pane holding the active instance): every case
// here puts the pane under document.activeElement.

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkbenchKeys } from '../../src/lib/shell/workbench-keys.svelte.ts';
import { paneAt } from '../../src/lib/state/layout/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { pageLeaf } from '../../src/lib/state/layout/index.ts';
import { fakeStorage, instance, pane, split } from '../state/layout-fixture.ts';
import { createClientState, type ClientState } from '../client.ts';

/**
 * A pane element as the handler reads one: its dataset, and a closest() that finds itself. It is a
 * class because the handler asks whether the focused element is an HTMLElement, and the stand-in
 * installed under that name below is this one.
 */
class PaneStandin {
    dataset: Record<string, string>;
    isConnected = true;

    constructor(path: string, active: string, page?: string) {
        this.dataset = { panePath: path, paneActive: active, paneView: 'projects' };
        if (page !== undefined) this.dataset.panePage = page;
    }

    closest(): this {
        return this;
    }

    querySelectorAll(): PaneStandin[] {
        return [];
    }
}

function paneElement(path: string, active: string, page?: string): HTMLElement {
    return new PaneStandin(path, active, page) as unknown as HTMLElement;
}

/** A document holding one focused pane, which is all focusedPaneElement() reads. */
function fakeDocument(focused: HTMLElement): Document {
    return {
        activeElement: focused,
        querySelector: (): unknown => null,
        querySelectorAll: (): unknown[] => []
    } as unknown as Document;
}

const held = globalThis as unknown as { document?: Document; HTMLElement?: unknown };
const heldDocument = held.document;
const heldElement = held.HTMLElement;

afterAll(() => {
    held.document = heldDocument;
    held.HTMLElement = heldElement;
});

// loadLayout names the page it makes, and a page is named from the catalog like everything else.
setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

beforeEach(() => {
    held.HTMLElement = PaneStandin;
    held.document = fakeDocument(paneElement('', 'a'));
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    client.layout.apply({
        root: split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])])
    });
});

/** One key event as the handler reads one, beside the call that swallows it. */
function keyEvent(
    key: string,
    ctrlKey = true
): { event: KeyboardEvent; prevented: ReturnType<typeof vi.fn> } {
    const prevented = vi.fn();
    const event = {
        key,
        ctrlKey,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        defaultPrevented: false,
        target: null,
        preventDefault: prevented
    };
    return { event: event as unknown as KeyboardEvent, prevented };
}

/**
 * The handler, with the pane at `path` focused in a document of its own. The focus is reported to
 * the handler as the browser reports it, which is what tells it the page the reader is in.
 */
function handler(path: string, page?: string, focus: () => null = () => null) {
    const element = paneElement(path, 'b', page);
    held.document = fakeDocument(element);
    const keys = createWorkbenchKeys({
        drag: client.drag,
        layout: client.layout,
        ui: client.ui,
        navigation: () => ({ direct: [], all: [], chords: {} }),
        activeMain: () => null,
        focus,
        paletteOpen: () => false,
        updateOpen: () => false,
        sheetOpen: () => false,
        setPaletteOpen: noop,
        setUpdateOpen: noop,
        setSheetOpen: noop,
        openPalette: noop
    });
    keys.paneFocused({ target: element } as unknown as FocusEvent);
    return keys;
}

describe('the numbered tab of the focused pane', () => {
    it('activates the tab the digit counts to in the pane the element names', () => {
        const keys = handler('1');
        expect(paneAt(client.layout.layout(), [1])?.active).toBe('b');
        const { event, prevented } = keyEvent('2');
        keys.keys(event);
        expect(paneAt(client.layout.layout(), [1])?.active).toBe('c');
        expect(client.layout.activeInstance()).toEqual(instance('c'));
        expect(prevented).toHaveBeenCalledOnce();
    });

    it('leaves the key alone for a digit past the last tab of that pane', () => {
        const keys = handler('1');
        const { event, prevented } = keyEvent('3');
        keys.keys(event);
        expect(paneAt(client.layout.layout(), [1])?.active).toBe('b');
        expect(prevented).not.toHaveBeenCalled();
    });

    it('reads the root pane, whose path is the empty string', () => {
        client.layout.apply({ root: pane(['a', 'b']) });
        const keys = handler('');
        keys.keys(keyEvent('2').event);
        expect(paneAt(client.layout.layout(), [])?.active).toBe('b');
    });
});

// A pane of a page shown inside the page on screen carries that page beside its path, so the digit
// and the Escape act on the page the reader is in and not on the one the strip is on.
describe('a pane of a page shown inside another', () => {
    /** Page one showing page two, the strip on page one, with two tabs in page two's pane. */
    function nested(): string {
        client.layout.openPage('Two');
        const second = client.layout.currentPage().id;
        client.layout.apply({ root: pane(['d', 'e']) }, second);
        client.layout.switchPage(client.layout.pages()[0].id);
        client.layout.apply({
            root: split('row', [0.5, 0.5], [pane(['a']), pageLeaf(second)])
        });
        return second;
    }

    it('activates the numbered tab of the nested page, in that page tree', () => {
        const second = nested();
        const keys = handler('', second);
        keys.keys(keyEvent('2').event);
        expect(paneAt(client.layout.layout(second), [])?.active).toBe('e');
        expect(paneAt(client.layout.layout(), [0])?.active).toBe('a');
    });

    it('restores the panes of the nested page when Escape is pressed inside it', () => {
        const second = nested();
        client.layout.maximisePane([], second);
        expect(client.layout.focused(second)).not.toBe(null);
        const keys = handler('', second);
        const { event, prevented } = keyEvent('Escape', false);
        keys.keys(event);
        expect(client.layout.focused(second)).toBe(null);
        expect(prevented).toHaveBeenCalledOnce();
    });
});
