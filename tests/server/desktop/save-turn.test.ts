// Layer 2, server (the desktop host). The turn that lets one window at a time save an arrangement:
// it is kept for each key, so the arrangements of two workspaces are two turns.

import { describe, expect, it } from 'vitest';
import { createSaveTurn } from '../../../src/desktop/decide/save-turn.ts';

describe('the save turn', () => {
    it('admits a first save and a save made from the envelope it admitted last', () => {
        const turn = createSaveTurn();
        expect(turn('k', 'one', null)).toEqual({ admitted: true });
        expect(turn('k', 'two', 'one')).toEqual({ admitted: true });
    });

    it('answers a save made from another envelope with the envelope it holds', () => {
        const turn = createSaveTurn();
        turn('k', 'one', null);
        turn('k', 'two', 'one');
        expect(turn('k', 'three', 'one')).toEqual({ admitted: false, held: 'two' });
        expect(turn('k', 'three', null)).toEqual({ admitted: false, held: 'two' });
    });

    it('holds an envelope for each key', () => {
        const turn = createSaveTurn();
        turn('a', 'one', null);
        expect(turn('b', 'other', null)).toEqual({ admitted: true });
        expect(turn('a', 'two', 'one')).toEqual({ admitted: true });
        expect(turn('b', 'later', 'one')).toEqual({ admitted: false, held: 'other' });
    });
});
