// Layer 3, primitive test. How a dialog takes the keyboard when it opens (focusOnOpen in
// ui/frame/quiet-focus.ts) and where it stands (portal in ui/shown.ts), over stubs of the page's
// elements: the box is found only once the flush after it was drawn has finished, the dialog's
// own `onopen` is answered in place of the first control, and the box is moved to the body and
// taken out of it again.
//
// What this does NOT cover: bits-ui calling the handler, Svelte setting `bind:this` in the flush
// after the box is drawn, and the box standing over a float, which need a browser and are seen at
// the look (a key sheet and a Confirm opened over a float take the keyboard and are drawn over it).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusOnOpen } from '../../../src/lib/ui/frame/quiet-focus.ts';
import { portal } from '../../../src/lib/ui/shown.ts';

/** An element with only what the focus helpers and the portal read. */
class Box {
    focused = 0;
    removed = 0;
    isConnected = true;
    tabIndex = -1;
    constructor(readonly inside: Box[] = []) {}
    setAttribute = (): void => undefined;
    removeAttribute = (): void => undefined;
    matches = (): boolean => false;
    closest = (): null => null;
    querySelectorAll = (): Box[] => this.inside;
    focus(): void {
        this.focused += 1;
    }
    remove(): void {
        this.removed += 1;
    }
}

afterEach(() => vi.unstubAllGlobals());

describe('focusOnOpen', () => {
    // Revert: find the box when the handler runs, before the bindings it is found through are set.
    it('finds the box once the flush has finished, not when bits-ui calls the handler', async () => {
        vi.stubGlobal('HTMLElement', Box);
        const box = new Box();
        const bound: { ground?: Box } = {};
        const prevented = vi.fn();
        let flushed!: () => void;
        const settled = new Promise<void>((done) => (flushed = done));
        focusOnOpen(
            { preventDefault: prevented } as unknown as Event,
            settled,
            undefined,
            () => bound.ground as unknown as HTMLElement | undefined
        );
        expect(prevented).toHaveBeenCalledOnce();
        bound.ground = box;
        flushed();
        await settled;
        await Promise.resolve();
        expect(box.focused).toBe(1);
    });

    // Revert: run `find` even when the dialog asks for its own focus.
    it('answers the dialog its own onopen and looks for no box', async () => {
        const find = vi.fn();
        const onopen = vi.fn();
        focusOnOpen(
            { preventDefault: vi.fn() } as unknown as Event,
            Promise.resolve(),
            onopen,
            find
        );
        await Promise.resolve();
        await Promise.resolve();
        expect(onopen).toHaveBeenCalledOnce();
        expect(find).not.toHaveBeenCalled();
    });

    it('does nothing when no box was drawn', async () => {
        const prevented = vi.fn();
        focusOnOpen(
            { preventDefault: prevented } as unknown as Event,
            Promise.resolve(),
            undefined,
            () => null
        );
        await Promise.resolve();
        await Promise.resolve();
        expect(prevented).toHaveBeenCalledOnce();
    });
});

describe('portal', () => {
    // Revert: leave the element where its caller drew it.
    it('moves the element to the body and takes it out again when it goes', () => {
        const appended: unknown[] = [];
        vi.stubGlobal('document', {
            body: { appendChild: (node: unknown) => appended.push(node) }
        });
        const node = new Box();
        const action = portal(node as unknown as HTMLElement);
        expect(appended).toEqual([node]);
        action.destroy();
        expect(node.removed).toBe(1);
    });

    it('leaves the element in place where there is no document', () => {
        vi.stubGlobal('document', undefined);
        const node = new Box();
        expect(() => portal(node as unknown as HTMLElement)).not.toThrow();
    });
});
