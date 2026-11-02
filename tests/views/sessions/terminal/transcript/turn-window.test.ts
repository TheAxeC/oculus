// Layer 4, test. Which rows a selection in a Transcript keeps drawn (G149): a wrong answer leaves a
// row out of the page and so out of what Copy carries, with nothing to show it.

import { describe, expect, it } from 'vitest';
import {
    AFTER_LIST,
    BEFORE_LIST,
    selectionRows,
    type RowSelection
} from '../../../../../src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts';

/** A list: a turn, a run's press with one call open, a turn, and a turn past a closed stretch. */
const rows = [
    { key: '0', at: 0 },
    { key: 'run:1', at: 1 },
    { key: '1', at: 1 },
    { key: '2', at: 2 },
    { key: '5', at: 5 }
];

const spanning = (from: string, to: string): RowSelection => ({ from, to, collapsed: false });

const table: { name: string; selection: RowSelection | null; kept: number[] }[] = [
    { name: 'forward', selection: spanning('run:1', '2'), kept: [1, 2, 3] },
    { name: 'backward', selection: spanning('2', 'run:1'), kept: [1, 2, 3] },
    { name: 'one row', selection: spanning('1', '1'), kept: [2] },
    { name: 'an end before the list', selection: spanning(BEFORE_LIST, '1'), kept: [0, 1, 2] },
    { name: 'an end after the list', selection: spanning(AFTER_LIST, '2'), kept: [3, 4] },
    { name: 'a key gone', selection: spanning('0', '4'), kept: [0, 1, 2, 3] },
    { name: 'a press key gone', selection: spanning('run:3', '5'), kept: [3, 4] },
    { name: 'a key above every row', selection: spanning('-3', '1'), kept: [0, 1, 2] },
    {
        name: 'a collapsed selection',
        selection: { from: '2', to: '2', collapsed: true },
        kept: []
    },
    {
        name: 'covering the list',
        selection: spanning(BEFORE_LIST, AFTER_LIST),
        kept: [0, 1, 2, 3, 4]
    },
    { name: 'wholly before the list', selection: spanning(BEFORE_LIST, BEFORE_LIST), kept: [] },
    { name: 'wholly after the list', selection: spanning(AFTER_LIST, AFTER_LIST), kept: [] },
    { name: 'no selection', selection: null, kept: [] }
];

describe('turn-window', () => {
    it('Transcript selection keeps its rows', () => {
        const answers = table.map(({ name, selection }) => ({
            name,
            kept: selectionRows(selection, rows)
        }));
        expect(answers).toEqual(table.map(({ name, kept }) => ({ name, kept })));
        expect(selectionRows(spanning(BEFORE_LIST, AFTER_LIST), [])).toEqual([]);
    });
});
