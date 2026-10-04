// Layer 2, client-state tests. The board's `more` state: the ids of the cards whose long
// description is drawn whole rather than cut to its clamp, as a saved board state is read back.
// Each id is a card's project id, kept apart from the ids of the open cards (`expanded`) it may
// share.
//
// What this does NOT cover: the clamp's control and the state surviving a tab switch, which need a
// page, and the rendering of an open or cut card, which is tests/views/boards/projects.test.ts.

import { describe, expect, it } from 'vitest';
import { parseBoardState } from '../../../../src/lib/state/boards/board/index.ts';

describe('the cards drawn whole', () => {
    it('keeps the ids it wrote, and drops a value that is not a string', () => {
        expect(parseBoardState({ more: ['alpha', 'bravo'] }).more).toEqual(['alpha', 'bravo']);
        expect(parseBoardState({ more: ['alpha', 7, null] }).more).toEqual(['alpha']);
        expect(parseBoardState({ more: 'alpha' }).more).toEqual([]);
    });

    it('keeps an id that is also an open card apart from the open cards', () => {
        const state = parseBoardState({ more: ['alpha'], expanded: ['alpha', 'bravo'] });
        expect(state.more).toEqual(['alpha']);
        expect(state.expanded).toEqual(['alpha', 'bravo']);
        expect(parseBoardState({ expanded: ['alpha'] }).more).toEqual([]);
    });
});
