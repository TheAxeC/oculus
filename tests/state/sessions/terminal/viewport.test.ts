// Layer 2, client state test. The viewport a terminal keeps while its grid is torn down by Float
// or Return to Page (state/sessions/terminal/viewport.ts): the line the viewport sat at, from the
// top, and whether it sat at the end; the line the grid scrolls to once the scrollback it is sent
// has been written; and the store that keeps one per terminal.
//
// What this does NOT cover: xterm's own scrolling and the grid mounting twice, which need a DOM and
// are seen at the look (a floated terminal scrolled to its first line comes back there).

import { describe, expect, it } from 'vitest';
import {
    createViewports,
    scrollTarget,
    viewportOf
} from '../../../../src/lib/state/sessions/terminal/viewport.ts';
import { createClientState } from '../../../fixtures/client.ts';

describe('the viewport kept for a terminal', () => {
    // Revert: answer the end whatever the viewport line is.
    it('is line 0, not at the end, for a terminal scrolled to its first line', () => {
        expect(viewportOf(0, 120)).toEqual({ line: 0, atEnd: false });
    });

    // Revert: answer not at the end for a viewport on the last line.
    it('is at the end for a terminal whose viewport sits on the last line', () => {
        expect(viewportOf(120, 120)).toEqual({ line: 120, atEnd: true });
    });

    it('is at the end for a terminal with no scrollback', () => {
        expect(viewportOf(0, 0).atEnd).toBe(true);
    });
});

describe('the line a grid scrolls to once its scrollback is written', () => {
    // Revert: scroll to the end whatever was kept.
    it('is the kept line for a terminal that was not at the end', () => {
        expect(scrollTarget({ line: 0, atEnd: false }, 120)).toBe(0);
        expect(scrollTarget({ line: 40, atEnd: false }, 120)).toBe(40);
    });

    it('is the end for a terminal that sat at the end, and for one with nothing kept', () => {
        expect(scrollTarget({ line: 100, atEnd: true }, 150)).toBe(150);
        expect(scrollTarget(undefined, 150)).toBe(150);
    });

    it('is never past the end of what was written', () => {
        expect(scrollTarget({ line: 90, atEnd: false }, 30)).toBe(30);
    });
});

describe('the store of kept viewports', () => {
    // Revert: keep one viewport for every terminal.
    it('keeps one per terminal and hands each over once', () => {
        const kept = createViewports();
        kept.keep('a', { line: 0, atEnd: false });
        kept.keep('b', { line: 9, atEnd: true });
        expect(kept.take('a')).toEqual({ line: 0, atEnd: false });
        expect(kept.take('a')).toBeUndefined();
        expect(kept.take('b')).toEqual({ line: 9, atEnd: true });
    });

    it('forgets the viewport of a terminal that ended', () => {
        const kept = createViewports();
        kept.keep('a', { line: 3, atEnd: false });
        kept.drop('a');
        expect(kept.take('a')).toBeUndefined();
    });
});

describe('the terminal state', () => {
    // Revert: leave keepViewport and takeViewport out of the terminals store.
    it('keeps the viewport of a terminal when its grid is torn down and hands it to the next grid', () => {
        const { terminals } = createClientState();
        terminals.keepViewport('45a932-shell', viewportOf(0, 120));
        expect(terminals.takeViewport('45a932-shell')).toEqual({ line: 0, atEnd: false });
        expect(terminals.takeViewport('45a932-shell')).toBeUndefined();
    });
});
