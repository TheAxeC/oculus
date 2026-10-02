// Layer 3, shell tests. The DOM half of the workbench keyboard: the pane the keys act on is found
// from the document, its path is read off the element, and the tab the digit names, or the one Ctrl
// and a bracket counts to, is activated in the store. A bare Tab is left to the browser here as it
// is in the resolver. The document and the element are plain stand-ins, so this runs in node
// environment; what it does NOT cover is focus, scrolling and event defaults in a browser, nor the
// other ways the handler finds its pane (the pane focused last, the maximised pane, the pane
// holding the active instance): every case here puts the pane under document.activeElement.

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createWorkbenchKeys,
    typingIn
} from '../../../src/lib/shell/keys/workbench-keys.svelte.ts';
import { paneAt, serialiseLayout } from '../../../src/lib/state/workbench/layout/index.ts';
import { readTab } from '../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { pageLeaf } from '../../../src/lib/state/workbench/layout/index.ts';
import {
    fakeStorage,
    floating,
    heldPages,
    instance,
    pageAround,
    pane,
    split
} from '../../state/workbench/layout/layout-fixture.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

/**
 * A pane element as the handler reads one: its dataset, and a closest() that finds itself. It is a
 * class because the handler asks whether the focused element is an HTMLElement, and the stand-in
 * installed under that name below is this one.
 */
class PaneStandin {
    dataset: Record<string, string>;
    isConnected = true;
    field: boolean;

    constructor(path: string, active: string, page?: string, field = false) {
        this.dataset = { panePath: path, paneActive: active };
        if (page !== undefined) this.dataset.panePage = page;
        this.field = field;
    }

    closest(): this {
        return this;
    }

    /** The handler asks a key target whether it is a field keeping ordinary typing for itself. */
    matches(): boolean {
        return this.field;
    }

    querySelectorAll(): PaneStandin[] {
        return [];
    }
}

function paneElement(path: string, active: string, page?: string): HTMLElement {
    return new PaneStandin(path, active, page) as unknown as HTMLElement;
}

/**
 * A focused element inside no pane: it carries no path, which is what the handler reads for one.
 */
function strayElement(): HTMLElement {
    const element = new PaneStandin('', '');
    delete element.dataset.panePath;
    return element as unknown as HTMLElement;
}

/** A key target the handler reads as a text field, which keeps the keyboard for itself. */
function fieldElement(): HTMLElement {
    return new PaneStandin('', '', undefined, true) as unknown as HTMLElement;
}

/**
 * A document holding one focused pane, which is all focusedPaneElement() reads, and an answer for
 * the one query the handler makes of it: whether a confirmation is open, as a dialog inside no
 * hidden tab view.
 */
function fakeDocument(focused: HTMLElement | null, confirming = false): Document {
    const dialog = { closest: (): unknown => null };
    return {
        activeElement: focused,
        querySelector: (): unknown => (confirming ? dialog : null),
        querySelectorAll: (selector: string): unknown[] =>
            confirming && selector.includes('alertdialog') ? [dialog] : []
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
    ctrlKey = true,
    held: { shiftKey?: boolean; target?: HTMLElement; defaultPrevented?: boolean } = {}
): { event: KeyboardEvent; prevented: ReturnType<typeof vi.fn> } {
    const prevented = vi.fn();
    const event = {
        key,
        ctrlKey,
        metaKey: false,
        altKey: false,
        shiftKey: held.shiftKey === true,
        defaultPrevented: held.defaultPrevented === true,
        target: held.target ?? null,
        preventDefault: prevented
    };
    return { event: event as unknown as KeyboardEvent, prevented };
}

/** The overlays the handler asks about, every one closed unless a case opens it. */
type Overlays = { palette?: boolean; tray?: boolean; sheet?: boolean; confirm?: boolean };

/**
 * The handler, with the pane at `path` focused in a document of its own. The focus is reported to
 * the handler as the browser reports it, which is what tells it the page the reader is in.
 */
function handler(
    path: string,
    page?: string,
    focus: () => null = () => null,
    overlays: Overlays = {},
    setUpdateOpen: (open: boolean) => void = noop,
    railPage: (index: number) => boolean = () => false,
    composeIn: (page: string) => void = noop
) {
    const element = paneElement(path, 'b', page);
    held.document = fakeDocument(element, overlays.confirm === true);
    const keys = createWorkbenchKeys({
        drag: client.drag,
        layout: client.layout,
        ui: client.ui,
        navigation: () => ({ direct: [], chords: {} }),
        activeMain: () => null,
        focus,
        paletteOpen: () => overlays.palette === true,
        updateOpen: () => overlays.tray === true,
        sheetOpen: () => overlays.sheet === true,
        setPaletteOpen: noop,
        setUpdateOpen,
        setSheetOpen: noop,
        openPalette: noop,
        openDoc: noop,
        composeIn,
        railPage
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

describe('cycling the tabs of the focused pane', () => {
    it('carries the pane one tab along on Ctrl and the right bracket, wrapping at the last', () => {
        client.layout.apply({ root: pane(['a', 'b', 'c']) });
        const keys = handler('');
        expect(paneAt(client.layout.layout(), [])?.active).toBe('a');
        const first = keyEvent(']');
        keys.keys(first.event);
        expect(paneAt(client.layout.layout(), [])?.active).toBe('b');
        expect(first.prevented).toHaveBeenCalledOnce();
        keys.keys(keyEvent(']').event);
        keys.keys(keyEvent(']').event);
        expect(paneAt(client.layout.layout(), [])?.active).toBe('a');
    });

    it('carries it back on Ctrl and the left bracket, wrapping at the first', () => {
        client.layout.apply({ root: pane(['a', 'b', 'c']) });
        const keys = handler('');
        keys.keys(keyEvent('[').event);
        expect(paneAt(client.layout.layout(), [])?.active).toBe('c');
        keys.keys(keyEvent('[').event);
        expect(paneAt(client.layout.layout(), [])?.active).toBe('b');
    });

    it('starts at the first tab when the pane shows one its tab list does not hold', () => {
        client.layout.apply({ root: pane(['a', 'b', 'c'], 'gone') });
        const keys = handler('');
        keys.keys(keyEvent(']').event);
        expect(paneAt(client.layout.layout(), [])?.active).toBe('b');
    });

    it.each([false, true])('leaves a bare Tab to the browser with shift=%s', (shiftKey) => {
        const keys = handler('1');
        const { event, prevented } = keyEvent('Tab', false, { shiftKey });
        keys.keys(event);
        expect(paneAt(client.layout.layout(), [1])?.active).toBe('b');
        expect(prevented).not.toHaveBeenCalled();
    });

    it('leaves a bare Tab to the browser while the key sheet is open', () => {
        const keys = handler('1', undefined, () => null, { sheet: true });
        const { event, prevented } = keyEvent('Tab', false);
        keys.keys(event);
        expect(paneAt(client.layout.layout(), [1])?.active).toBe('b');
        expect(prevented).not.toHaveBeenCalled();
    });

    it.each([
        { name: 'a field', overlays: {}, target: fieldElement() },
        { name: 'the palette', overlays: { palette: true }, target: undefined },
        { name: 'the update tray', overlays: { tray: true }, target: undefined },
        { name: 'a confirmation', overlays: { confirm: true }, target: undefined }
    ])('leaves the chord alone while $name holds the keyboard', ({ overlays, target }) => {
        const keys = handler('1', undefined, () => null, overlays);
        const { event, prevented } = keyEvent(']', true, { target });
        keys.keys(event);
        expect(paneAt(client.layout.layout(), [1])?.active).toBe('b');
        expect(prevented).not.toHaveBeenCalled();
    });

    it('leaves the chord alone when the focused element names no pane', () => {
        const keys = handler('1');
        held.document = fakeDocument(strayElement());
        const { event, prevented } = keyEvent(']');
        keys.keys(event);
        expect(paneAt(client.layout.layout(), [1])?.active).toBe('b');
        expect(prevented).not.toHaveBeenCalled();
    });

    it('leaves the chord alone in a pane that holds no tab', () => {
        client.layout.apply({ root: split('row', [0.5, 0.5], [pane(['a']), pane([])]) });
        const keys = handler('1');
        const { event, prevented } = keyEvent(']');
        keys.keys(event);
        expect(paneAt(client.layout.layout(), [1])?.tabs).toEqual([]);
        expect(prevented).not.toHaveBeenCalled();
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

    it('cycles the tabs of the nested page, in that page tree', () => {
        const second = nested();
        const keys = handler('', second);
        keys.keys(keyEvent(']').event);
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

// A float is a host a pane can name by id, as a nested page is: the pane's `data-pane-page` is the
// float's id, and the digit and the bracket act on the float's own pane.
describe('a pane of a float', () => {
    function withFloat(): void {
        const held = heldPages(
            [pageAround('main', pane(['a']))],
            [floating('fl', ['x', 'y', 'z'])]
        );
        client = createClientState();
        client.layout.loadLayout(fakeStorage(serialiseLayout(held)));
    }

    it('activates the numbered tab of the float, in the float pane', () => {
        withFloat();
        const keys = handler('', 'fl');
        keys.keys(keyEvent('2').event);
        expect(paneAt(client.layout.layout('fl'), [])?.active).toBe('y');
        expect(client.layout.floats()[0].pane.active).toBe('y');
        expect(paneAt(client.layout.layout('main'), [])?.active).toBe('a');
    });

    it('cycles the tabs of the float, in the float pane', () => {
        withFloat();
        const keys = handler('', 'fl');
        keys.keys(keyEvent(']').event);
        expect(client.layout.floats()[0].pane.active).toBe('y');
    });
});

// The update tray, the palette and the key sheet close on Escape through their own bits-ui dialog,
// which takes the key on the document before it reaches the window's handler, as a confirm drawn
// inside the tray takes the first Escape. Whether the key closes the tray is the dialog's, seen at
// the page; these cases hold that the shell's handler leaves the tray to it.
describe('Escape while the update tray is open', () => {
    // Red when the shell's own Escape branch for the tray comes back.
    it('leaves the tray to its dialog on an Escape no dialog has taken', () => {
        const closed = vi.fn();
        const keys = handler('', undefined, () => null, { tray: true }, closed);
        const { event } = keyEvent('Escape', false);
        keys.keys(event);
        expect(closed).not.toHaveBeenCalled();
    });

    // An audit of the key handler: it passes over an Escape a dialog has taken. Red when the
    // handler closes the tray or restores the pane on an Escape whose default is prevented.
    it('restores no pane on the Escape the dialog has taken', () => {
        client.layout.maximisePane([1]);
        expect(client.layout.focused()).not.toBe(null);
        const closed = vi.fn();
        const keys = handler('1', undefined, () => null, { tray: true }, closed);
        const { event, prevented } = keyEvent('Escape', false, { defaultPrevented: true });
        keys.keys(event);
        expect(closed).not.toHaveBeenCalled();
        expect(client.layout.focused()).not.toBe(null);
        expect(prevented).not.toHaveBeenCalled();
    });
});

describe('a bare digit', () => {
    it('shows the rail page of its place, and is swallowed only when there was one', () => {
        const asked: number[] = [];
        const keys = handler(
            '1',
            undefined,
            () => null,
            {},
            noop,
            (index) => {
                asked.push(index);
                return index <= 2;
            }
        );
        const first = keyEvent('2', false);
        keys.keys(first.event);
        expect(first.prevented).toHaveBeenCalledOnce();
        const past = keyEvent('7', false);
        keys.keys(past.event);
        expect(past.prevented).not.toHaveBeenCalled();
        expect(asked).toEqual([2, 7]);
    });
});

describe('the n key', () => {
    /** A pane holding Projects and a Terminal tab in the state the case names. */
    function withTerminal(state: unknown): void {
        client.layout.apply({
            root: {
                kind: 'pane',
                tabs: [instance('a'), { id: 't', view: 'terminal', state }],
                active: 'a'
            }
        });
    }

    /** The handler with the terminals store's own New handed in, as the workbench hands it. */
    function withNew(): ReturnType<typeof handler> {
        return handler('', undefined, undefined, {}, noop, undefined, (page) =>
            client.terminals.composeIn(page)
        );
    }

    it('calls the New it was handed, for the page the focused pane is in', () => {
        const asked: string[] = [];
        const keys = handler('', 'page-two', undefined, {}, noop, undefined, (page) =>
            asked.push(page)
        );
        const { event, prevented } = keyEvent('n', false);
        keys.keys(event);
        expect(prevented).toHaveBeenCalledOnce();
        expect(asked).toEqual(['page-two']);
    });

    it("shows the composer in the page's Terminal tab, which keeps the terminals it owns", () => {
        withTerminal({ session: 'a1b2c3-shell' });
        const keys = withNew();
        const { event, prevented } = keyEvent('n', false);
        keys.keys(event);
        expect(prevented).toHaveBeenCalledOnce();
        const tabs = paneAt(client.layout.layout(), [])?.tabs ?? [];
        expect(tabs.filter((one) => one.view === 'terminal')).toHaveLength(1);
        expect(readTab(tabs.find((one) => one.id === 't')?.state)).toMatchObject({
            terminals: ['a1b2c3-shell'],
            composing: true
        });
        expect(client.layout.activeInstance()?.id).toBe('t');
    });

    it('opens a new Terminal tab showing the composer when the page has none', () => {
        client.layout.apply({ root: { kind: 'pane', tabs: [instance('a')], active: 'a' } });
        const keys = withNew();
        keys.keys(keyEvent('n', false).event);
        const tabs = paneAt(client.layout.layout(), [])?.tabs ?? [];
        const fresh = tabs.filter((one) => one.view === 'terminal');
        expect(fresh).toHaveLength(1);
        expect(readTab(fresh[0].state)).toMatchObject({ terminals: [], composing: true });
    });
});

/**
 * An element with a tag, its classes, its attributes and a parent, answering the three selectors
 * typingIn asks: a comma list of tag names, one class, and the content-editable attribute.
 */
class NodeStandin extends PaneStandin {
    readonly tag: string;
    readonly classes: string[];
    readonly attributes: Record<string, string>;
    readonly parent: NodeStandin | null;
    readonly isContentEditable: boolean;

    constructor(
        tag: string,
        parent: NodeStandin | null = null,
        classes: string[] = [],
        attributes: Record<string, string> = {}
    ) {
        super('', '');
        this.tag = tag;
        this.parent = parent;
        this.classes = classes;
        this.attributes = attributes;
        this.isContentEditable = attributes.contenteditable === 'true';
    }

    override matches(selector?: string): boolean {
        return (selector ?? '').split(',').some((one) => {
            const part = one.trim();
            if (part.startsWith('.')) return this.classes.includes(part.slice(1));
            const attribute = /^\[([a-z-]+)="([^"]*)"\]$/.exec(part);
            if (attribute !== null) return this.attributes[attribute[1]] === attribute[2];
            return part === this.tag;
        });
    }

    override closest(selector?: string): this {
        if (this.matches(selector)) return this;
        return (this.parent?.closest(selector) ?? null) as unknown as this;
    }
}

describe('typing inside the editor', () => {
    const editor = new NodeStandin('div', null, ['monaco-editor']);
    const lines = new NodeStandin('div', editor, ['view-lines']);

    // Red when typingIn leaves out an element inside `.monaco-editor`.
    it('counts the edit context, the input area and any element of the editor as typing', () => {
        const context = new NodeStandin('div', lines, ['native-edit-context'], {
            contenteditable: 'false'
        });
        const area = new NodeStandin('textarea', lines, ['inputarea']);
        expect(typingIn(context as unknown as HTMLElement)).toBe(true);
        expect(typingIn(area as unknown as HTMLElement)).toBe(true);
        expect(typingIn(lines as unknown as HTMLElement)).toBe(true);
    });

    // Red when typingIn counts every element as typing, or no longer counts a form field.
    it('counts a div outside the editor as none, and an input anywhere as typing', () => {
        const outside = new NodeStandin('div', new NodeStandin('div', null, ['pane']));
        expect(typingIn(outside as unknown as HTMLElement)).toBe(false);
        expect(typingIn(new NodeStandin('input', null) as unknown as HTMLElement)).toBe(true);
        expect(typingIn(null)).toBe(false);
    });

    // Red when the key handler reads a key typed in the editor as the shell's.
    it('leaves a digit and a colon typed in the editor to the editor', () => {
        const context = new NodeStandin('div', lines, ['native-edit-context']);
        const railPage = vi.fn(() => true);
        const keys = handler('', undefined, () => null, {}, noop, railPage);
        const digit = keyEvent('1', false, { target: context as unknown as HTMLElement });
        keys.keys(digit.event);
        const colon = keyEvent(':', false, { target: context as unknown as HTMLElement });
        keys.keys(colon.event);
        expect(railPage).not.toHaveBeenCalled();
        expect(digit.prevented).not.toHaveBeenCalled();
        expect(colon.prevented).not.toHaveBeenCalled();
    });
});
