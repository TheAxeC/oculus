// Layer 3, view tests. What the commit box does with git's prepared message for a merge or a cherry
// pick in progress (views/shared/changes/prepared-message.ts): when it fills the field, when it
// empties it, and when a message the reader typed stays.
//
// It does not cover the field the box draws, which the look does.

import { describe, expect, it } from 'vitest';
import { followPrepared } from '../../../../src/lib/views/shared/changes/prepared-message.ts';

const SIDE = "Merge branch 'side'";
const SIDE2 = "Merge branch 'side2'";

const ROWS = [
    {
        row: 'an empty field takes the prepared message',
        prepared: SIDE,
        offered: '',
        held: '',
        followed: { put: SIDE, offered: SIDE }
    },
    {
        row: 'a field still holding the message offered before takes the new one',
        prepared: SIDE2,
        offered: SIDE,
        held: SIDE,
        followed: { put: SIDE2, offered: SIDE2 }
    },
    {
        row: 'a message the reader typed stays when the prepared message changes',
        prepared: SIDE2,
        offered: SIDE,
        held: 'Take the side branch',
        followed: { put: null, offered: SIDE2 }
    },
    {
        row: 'a message the reader typed stays when a merge starts',
        prepared: SIDE,
        offered: '',
        held: 'Take the side branch',
        followed: { put: null, offered: SIDE }
    },
    {
        row: 'the same prepared message again leaves the field',
        prepared: SIDE,
        offered: SIDE,
        held: '',
        followed: { put: null, offered: SIDE }
    },
    {
        row: 'the field still holding the offered message is emptied when the merge ends',
        prepared: '',
        offered: SIDE,
        held: SIDE,
        followed: { put: '', offered: '' }
    },
    {
        row: 'a message the reader changed stays when the merge ends',
        prepared: '',
        offered: SIDE,
        held: `${SIDE}, by hand`,
        followed: { put: null, offered: '' }
    }
];

describe("the commit box and git's prepared message", () => {
    it.each(ROWS)('$row', ({ prepared, offered, held, followed }) => {
        expect(followPrepared(prepared, offered, held)).toEqual(followed);
    });
});
