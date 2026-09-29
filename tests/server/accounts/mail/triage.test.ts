// The triage notes file: what the page writes into it, what the skill writes into it from outside,
// the thirty-day prune, and what it never carries.
//
// Every path is inside a directory this file made under mkdtemp and asserted first; nothing under
// the reader's own home is read or written, and no provider is called at all.

import { readFileSync, writeFileSync } from 'node:fs';
import { afterEach, describe, expect } from 'vitest';
import {
    KEEP_DAYS,
    pruneNotes,
    readTriage,
    triageFile,
    writeNote
} from '../../../../src/lib/server/accounts/mail/triage.ts';
import { cleanup, scratch } from './fixture.ts';
import { it } from '../../../fixtures/scratch.ts';

afterEach(cleanup);

const WHEN = new Date('2026-09-16T12:00:00.000Z');
const now = (): Date => WHEN;

describe('the triage notes', () => {
    it('answers an empty set for a folder with no file in it yet', () => {
        expect(readTriage(scratch())).toEqual({ run: null, notes: {} });
    });

    it('writes one thread fields and leaves every other field of the note alone', () => {
        const dir = scratch();
        writeNote(dir, 'google-work-one', { kind: 'reply', what: 'Needs an answer' }, now);
        writeNote(dir, 'google-work-one', { draft: 'Beste Ada,' }, now);
        expect(readTriage(dir).notes['google-work-one']).toEqual({
            kind: 'reply',
            what: 'Needs an answer',
            draft: 'Beste Ada,',
            written: WHEN.toISOString()
        });
    });

    it('takes a field off the note when it is cleared, triaged included', () => {
        const dir = scratch();
        writeNote(dir, 'one', { draft: 'a draft', triaged: true }, now);
        expect(readTriage(dir).notes.one).toMatchObject({ draft: 'a draft', triaged: true });
        writeNote(dir, 'one', { draft: '', triaged: false }, now);
        expect(readTriage(dir).notes.one).toEqual({ written: WHEN.toISOString() });
    });

    it('leaves the file readable by its owner alone', () => {
        const dir = scratch();
        writeNote(dir, 'one', { triaged: true }, now);
        const held: unknown = JSON.parse(readFileSync(triageFile(dir), 'utf8'));
        expect(held).toMatchObject({ run: null });
    });

    it('reads what the triage skill wrote from outside, its run date included', () => {
        const dir = scratch();
        writeFileSync(
            triageFile(dir),
            JSON.stringify({
                run: '2026-09-16',
                notes: {
                    'google-work-one': {
                        kind: 'action',
                        what: 'Upload the form',
                        written: '2026-09-16T09:00:00.000Z'
                    },
                    'google-work-bad': 'not a note'
                }
            })
        );
        const held = readTriage(dir);
        expect(held.run).toBe('2026-09-16');
        expect(held.notes['google-work-one']).toMatchObject({ kind: 'action' });
        // One entry that is not a note costs that entry and not the rest of the file.
        expect(held.notes['google-work-bad']).toBeUndefined();
    });

    it('throws one sentence naming the file, and nothing of it, when it does not parse', () => {
        const dir = scratch();
        writeFileSync(triageFile(dir), '{not json');
        expect(() => readTriage(dir)).toThrow(/is not JSON$/);
    });

    it('keeps a note off the plate for thirty days and drops it after', () => {
        const dir = scratch();
        const day = 86400000;
        writeFileSync(
            triageFile(dir),
            JSON.stringify({
                run: '2026-09-16',
                notes: {
                    'on-plate': { triaged: true, written: '2020-01-01T00:00:00.000Z' },
                    recent: {
                        what: 'a week ago',
                        written: new Date(WHEN.getTime() - 7 * day).toISOString()
                    },
                    stale: {
                        what: 'over a month ago',
                        written: new Date(WHEN.getTime() - (KEEP_DAYS + 1) * day).toISOString()
                    }
                }
            })
        );
        const held = pruneNotes(dir, new Set(['on-plate']), WHEN.getTime());
        expect(Object.keys(held.notes).sort()).toEqual(['on-plate', 'recent']);
        // The prune is what the file now holds, not only what was answered.
        expect(Object.keys(readTriage(dir).notes).sort()).toEqual(['on-plate', 'recent']);
    });

    it('writes nothing when the prune drops nothing', () => {
        const dir = scratch();
        writeNote(dir, 'one', { triaged: true }, now);
        const before = readFileSync(triageFile(dir), 'utf8');
        pruneNotes(dir, new Set(['one']), WHEN.getTime());
        expect(readFileSync(triageFile(dir), 'utf8')).toBe(before);
    });
});
