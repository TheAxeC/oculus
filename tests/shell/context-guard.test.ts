// Layer 3, shell test. Whether the page-wide right-click handler cancels the browser's own menu
// (shell/context-guard.ts, `shouldCancel`): not when something already took the event, not over a
// text input, a textarea, a contenteditable element, the code editor or the terminal grid, and
// yes everywhere else, a blank area included. The listener that calls it is read as source in
// tests/routes/page.test.ts.
//
// What this does NOT cover: the browser showing or not showing its menu, which needs a browser.
// The elements here are structural stand-ins that answer `closest` for the simple selectors the
// guard uses (a tag, a class, an attribute), since the suite has no DOM.

import { describe, expect, it } from 'vitest';
import { shouldCancel } from '../../src/lib/shell/context-guard.ts';

type Stand = {
    tag: string;
    classes?: string[];
    attrs?: Record<string, string | undefined>;
    parent?: Stand;
};

/** Whether one simple selector (a tag, `.class`, `[attr]` or `[attr="value"]`) matches. */
function matches(node: Stand, selector: string): boolean {
    const text = selector.trim();
    if (text.startsWith('.')) return (node.classes ?? []).includes(text.slice(1));
    if (text.startsWith('[')) {
        const [name, value] = text.slice(1, -1).split('=');
        const held = node.attrs?.[name];
        if (held === undefined) return false;
        return (value as string | undefined) === undefined || held === value.replaceAll('"', '');
    }
    return node.tag === text;
}

/** An event over `node` with the `closest` the DOM gives it. */
function over(node: Stand | null, prevented = false): MouseEvent {
    const closest = (selector: string): unknown => {
        for (let at: Stand | undefined = node ?? undefined; at !== undefined; at = at.parent) {
            if (selector.split(',').some((part) => matches(at, part))) return at;
        }
        return null;
    };
    const target = node === null ? null : { closest };
    return { defaultPrevented: prevented, target } as unknown as MouseEvent;
}

const BLANK: Stand = { tag: 'div' };

describe('the right-click the page cancels', () => {
    // Revert: return false for every target.
    it('cancels a right-click on a blank area', () => {
        expect(shouldCancel(over(BLANK))).toBe(true);
    });

    it('cancels a right-click on a button and on a label', () => {
        expect(shouldCancel(over({ tag: 'button', parent: BLANK }))).toBe(true);
        expect(shouldCancel(over({ tag: 'span', parent: { tag: 'li', parent: BLANK } }))).toBe(
            true
        );
    });

    it('cancels when the event has no element under it', () => {
        expect(shouldCancel(over(null))).toBe(true);
    });
});

describe('the right-click the page leaves alone', () => {
    // Revert: leave the defaultPrevented test out.
    it('leaves one that something already took', () => {
        expect(shouldCancel(over(BLANK, true))).toBe(false);
    });

    // Revert: leave input out of the list.
    it('leaves one in a text input and in a textarea', () => {
        expect(shouldCancel(over({ tag: 'input', parent: BLANK }))).toBe(false);
        expect(shouldCancel(over({ tag: 'textarea', parent: BLANK }))).toBe(false);
    });

    // Revert: leave contenteditable out of the list.
    it('leaves one in a contenteditable element, written with or without a value', () => {
        expect(shouldCancel(over({ tag: 'div', attrs: { contenteditable: '' } }))).toBe(false);
        expect(shouldCancel(over({ tag: 'div', attrs: { contenteditable: 'true' } }))).toBe(false);
    });

    // Revert: leave the editor's class out of the list.
    it('leaves one anywhere inside the code editor', () => {
        const editor: Stand = { tag: 'div', classes: ['monaco-editor'], parent: BLANK };
        expect(shouldCancel(over({ tag: 'span', classes: ['view-line'], parent: editor }))).toBe(
            false
        );
    });

    // Revert: leave the terminal grid out of the list.
    it('leaves one anywhere inside the terminal grid', () => {
        const grid: Stand = { tag: 'div', attrs: { 'data-terminal': 'abc' }, parent: BLANK };
        expect(shouldCancel(over({ tag: 'canvas', parent: grid }))).toBe(false);
    });
});
