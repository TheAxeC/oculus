// Layer 3, primitive test. The multi-choice field mounted in Svelte's client runtime
// (tests/ui/frame/client-runtime.ts) over the fake document: which choice is drawn active as the
// filter box gains and loses focus and as the arrow keys and Escape move the cursor, and the choice
// of typed text, active only while the box has focus.
//
// The fake document runs no listener, so the handlers the field attached to the box are called
// with the event objects the field reads. The buttons are replaced by a component that records the
// props it was handed. What this does NOT cover: real focus, which a browser moves.

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MultiSelect from '../../../src/lib/ui/forms/choice/MultiSelect.svelte';
import { installDom, removeDom, FakeElement } from '../frame/fake-dom.ts';

const { drawn, around } = vi.hoisted(() => ({
    drawn: [] as { label: string; active?: boolean }[],
    around: (anchor: unknown, props: { children?: (anchor: unknown) => void }) => {
        props.children?.(anchor);
    }
}));

vi.mock('../../../src/lib/ui/controls/ToolButton.svelte', () => ({
    default: (_anchor: unknown, props: { label: string; active?: boolean }) => {
        drawn.push(props);
    }
}));
vi.mock('../../../src/lib/ui/controls/Tag.svelte', () => ({ default: () => undefined }));
vi.mock('../../../src/lib/ui/controls/text/TextBoxMenu.svelte', () => ({ default: around }));

const CHOICES = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' }
];

let root: FakeElement;

beforeEach(() => {
    root = installDom();
    drawn.length = 0;
    // The field tells an input from other elements by its class.
    vi.stubGlobal('HTMLInputElement', FakeElement);
});

afterEach(() => removeDom());

/** The filter box as the test drives it. */
type Box = FakeElement & { value: string };

/**
 * Call the handler the field attached to an element for a delegated event. Svelte keeps these in
 * a map under a symbol of the element, since a delegated event has one listener on the document.
 */
function fire(box: Box, event: string, detail: object = {}): void {
    const symbol = Object.getOwnPropertySymbols(box).find((one) => one.description === 'events');
    const held = (
        symbol === undefined ? undefined : (box as unknown as Record<symbol, unknown>)[symbol]
    ) as Record<string, ((event: unknown) => void) | undefined> | undefined;
    const handler = held?.[event];
    if (handler === undefined) throw new Error(`the box has no ${event} handler`);
    handler(detail);
}

/** The field mounted, with the filter box it drew. */
function field(free = false): { box: Box; app: ReturnType<typeof mount> } {
    const app = mount(MultiSelect, {
        target: root as unknown as Element,
        props: {
            values: [],
            label: 'Choices',
            choices: CHOICES,
            onchange: () => undefined,
            search: 'Search',
            remove: 'remove',
            removeGlyph: 'dismiss',
            free,
            none: 'nothing'
        }
    });
    flushSync();
    const box = root.all('type')[0] as Box;
    return { box, app };
}

/** The choices that are drawn active, by their words. */
function actives(): string[] {
    return drawn.filter((props) => props.active === true).map((props) => props.label);
}

const key = (name: string) => ({ key: name, preventDefault: () => undefined });

describe('the active choice of the multi-choice field', () => {
    // Revert: draw `active={index === at}` without the focus condition.
    it('is none until the filter box has focus, and the one at the cursor while it has', () => {
        const { box, app } = field();
        expect(actives()).toEqual([]);

        fire(box, 'focusin');
        flushSync();
        expect(actives()).toEqual(['Alpha']);

        void unmount(app);
    });

    it('moves with the arrow keys while the box has focus and goes when it loses it', () => {
        const { box, app } = field();
        fire(box, 'focusin');
        fire(box, 'keydown', key('ArrowDown'));
        flushSync();
        expect(actives()).toEqual(['Beta']);

        fire(box, 'keydown', key('ArrowUp'));
        fire(box, 'keydown', key('ArrowUp'));
        flushSync();
        expect(actives()).toEqual(['Gamma']);

        fire(box, 'focusout');
        flushSync();
        expect(actives()).toEqual([]);

        fire(box, 'focusin');
        flushSync();
        expect(actives()).toEqual(['Gamma']);
        void unmount(app);
    });

    it('goes back to the first choice on Escape while the box has focus', () => {
        const { box, app } = field();
        fire(box, 'focusin');
        fire(box, 'keydown', key('ArrowDown'));
        fire(box, 'keydown', key('Escape'));
        flushSync();
        expect(actives()).toEqual(['Alpha']);
        void unmount(app);
    });
});

describe('the choice of typed text', () => {
    // Revert: draw the typed-text choice `active` whatever the focus.
    it('is active only while the filter box has focus', () => {
        const { box, app } = field(true);
        box.value = 'zzz';
        fire(box, 'input', { currentTarget: box });
        flushSync();
        const typed = () => drawn.filter((props) => props.label === 'zzz').at(-1);
        expect(typed()).toBeDefined();
        expect(typed()?.active).toBe(false);

        fire(box, 'focusin');
        flushSync();
        expect(typed()?.active).toBe(true);

        fire(box, 'focusout');
        flushSync();
        expect(typed()?.active).toBe(false);
        void unmount(app);
    });
});
