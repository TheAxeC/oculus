// Layer 3, shell tests. Structural DOM stand-ins exercise target availability and scroll-region
// precedence without a browser. Actual focus, layout and event defaults are browser-suite checks.

import { describe, expect, it, vi } from 'vitest';
import {
    activateCursor,
    cardSelector,
    focusSearch,
    scrollContainer,
    scrollRegion
} from '../../src/lib/shell/key-dom.ts';

/** A queryable element with named matches and descendants supplied in document order. */
function element(
    matches: Record<string, unknown> = {},
    descendants: HTMLElement[] = [],
    scrollHeight = 0
): HTMLElement {
    return {
        scrollHeight,
        querySelector: (selector: string) => matches[selector] ?? null,
        querySelectorAll: () => descendants
    } as unknown as HTMLElement;
}

describe('optional keyboard actions', () => {
    it('leaves search unhandled when the pane or input is absent', () => {
        expect(focusSearch(null)).toBe(false);
        expect(focusSearch(element())).toBe(false);
    });

    it('focuses and selects an available search input', () => {
        const search = { focus: vi.fn(), select: vi.fn() };
        expect(focusSearch(element({ 'input[data-search]': search }))).toBe(true);
        expect(search.focus).toHaveBeenCalledOnce();
        expect(search.select).toHaveBeenCalledOnce();
    });

    it('leaves activation unhandled without a pane, cursor card, or control', () => {
        expect(activateCursor(null, 'one')).toBe(false);
        expect(activateCursor(element(), null)).toBe(false);
        expect(activateCursor(element(), 'one')).toBe(false);
        expect(activateCursor(element({ [cardSelector('one')]: element() }), 'one')).toBe(false);
    });

    it('clicks the available cursor control', () => {
        const control = { click: vi.fn() };
        const card = element({ '.title button, [data-card-toggle]': control });
        expect(activateCursor(element({ [cardSelector('one')]: card }), 'one')).toBe(true);
        expect(control.click).toHaveBeenCalledOnce();
    });

    it('leaves scrolling unhandled when no region exists', () => {
        expect(scrollRegion(null, 'top')).toBe(false);
        expect(scrollRegion(null, 'bottom')).toBe(false);
    });

    it.each(['top', 'bottom'] as const)('scrolls an available region to %s', (edge) => {
        const scroller = { scrollHeight: 400, scrollTo: vi.fn() };
        expect(scrollRegion(scroller, edge)).toBe(true);
        expect(scroller.scrollTo).toHaveBeenCalledWith({
            top: edge === 'top' ? 0 : 400,
            behavior: 'smooth'
        });
    });
});

describe('view scroll region', () => {
    it('prefers a mark nested inside the view body, the column a view scrolls itself', () => {
        const column = element({}, [], 9000);
        const board = element({ '[data-scroll]': column });
        const body = element({ '[data-scroll]': board });
        expect(scrollContainer(element({ '[data-pane-body]': body }))).toBe(column);
    });

    it('selects the marked view body before considering nested scroll ranges', () => {
        const board = element();
        const fileList = element({}, [], 10000);
        const body = element({ '[data-scroll]': board }, [fileList]);
        const overflow = vi.fn(() => 'auto');
        expect(scrollContainer(element({ '[data-pane-body]': body }), overflow)).toBe(board);
        expect(overflow).not.toHaveBeenCalled();
    });

    it('falls back to the first scrolling descendant in document order', () => {
        const clipped = element();
        const root = element({}, [], 400);
        const nested = element({}, [], 10000);
        const body = element({}, [clipped, root, nested]);
        expect(
            scrollContainer(element({ '[data-pane-body]': body }), (candidate) =>
                candidate === clipped ? 'hidden' : 'auto'
            )
        ).toBe(root);
    });

    it('returns no region when the pane, body, or scrolling descendant is absent', () => {
        expect(scrollContainer(null)).toBe(null);
        expect(scrollContainer(element())).toBe(null);
        const body = element({}, [element()]);
        expect(scrollContainer(element({ '[data-pane-body]': body }), () => 'hidden')).toBe(null);
    });
});
