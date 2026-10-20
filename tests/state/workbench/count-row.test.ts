// Layer 2, client state tests. One view's row of the `counts` map of config/defaults/layout.yml as
// the page reads it: its flags, its statuses trimmed and in lower case with a status written alone
// read as one, and its days.

import { describe, expect, it } from 'vitest';
import { countRow } from '../../../src/lib/state/workbench/rail-badges/rail-badges.ts';

describe('countRow', () => {
    it('reads a row as its flags, its statuses trimmed and in lower case, and its days', () => {
        const config = {
            counts: {
                funding: { match: [' In-Prep ', 3], label: 'undecided', tab: true, rail: 'x' },
                leads: { days: 14, tab: true, rail: false },
                events: { match: 'Planned', tab: true, rail: true }
            }
        };
        expect(countRow(config, 'funding')).toEqual({
            tab: true,
            rail: false,
            match: ['in-prep'],
            label: 'undecided',
            tone: '',
            days: null
        });
        expect(countRow(config, 'leads')?.days).toBe(14);
        expect(countRow(config, 'events')?.match).toEqual(['planned']);
        expect(countRow(config, 'inbox')).toBeNull();
    });
});
