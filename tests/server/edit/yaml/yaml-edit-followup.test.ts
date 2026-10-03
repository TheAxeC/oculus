// Writing the `followup` of a manifest in each shape the hub holds it: a bare note, a map of `do`
// and `after`, and a list of notes. A key set under a bare note or under a list of exactly one note
// rewrites the parent as the map; a list of two or more is refused, since the schema's two fields
// address one note.
//
// The documents are synthetic; the result is compared as text and as the parsed document, since
// the file must end holding the map and no list.

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { setFields } from '../../../../src/lib/server/edit/yaml/yaml-edit.ts';

/** A manifest around one `followup` text, so the lines either side must come back unchanged. */
function manifest(followup: string): string {
    return `id: a\n${followup}last: end\n`;
}

describe('a bare note', () => {
    it('is written as the map when the date is set, keeping the note', () => {
        const source = manifest('followup: "Register for FLTA 2026"\n');
        const out = setFields(source, { 'followup.after': '2026-11-01' });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            manifest('followup:\n  do: "Register for FLTA 2026"\n  after: 2026-11-01\n')
        );
        expect(parse(out.text)).toEqual({
            id: 'a',
            followup: { do: 'Register for FLTA 2026', after: '2026-11-01' },
            last: 'end'
        });
    });

    it('is refused, the file as it was, when it holds a value that is not text', () => {
        for (const held of ['followup: 5\n', 'followup: true\n']) {
            const out = setFields(manifest(held), { 'followup.after': '2026-11-01' });
            expect(out.changed).toEqual([]);
            expect(out.text).toBe(manifest(held));
            expect(out.refused).toHaveLength(1);
        }
    });
});

describe('a list of one note', () => {
    it('is written as the map when the date of a bare note is set', () => {
        for (const list of [
            'followup:\n  - "Register for FLTA 2026"\n',
            'followup: ["Register for FLTA 2026"]\n'
        ]) {
            const out = setFields(manifest(list), { 'followup.after': '2026-11-01' });
            expect(out.refused).toEqual([]);
            expect(out.changed).toEqual(['followup.after']);
            expect(out.text).not.toMatch(/^\s*-/m);
            expect(out.text).not.toContain('[');
            expect(parse(out.text)).toEqual({
                id: 'a',
                followup: { do: 'Register for FLTA 2026', after: '2026-11-01' },
                last: 'end'
            });
        }
    });

    it('is written as the map when the text of a bare note is set', () => {
        const out = setFields(manifest('followup:\n  - old note\n'), { 'followup.do': 'new note' });
        expect(out.refused).toEqual([]);
        expect(parse(out.text)).toEqual({ id: 'a', followup: { do: 'new note' }, last: 'end' });
    });

    it('keeps the other key of a map note and sets the one asked', () => {
        const held = 'followup:\n  - do: call\n    after: 2026-10-01\n';
        const out = setFields(manifest(held), { 'followup.after': '2026-12-01' });
        expect(out.refused).toEqual([]);
        expect(out.text).not.toMatch(/^\s*-/m);
        expect(parse(out.text)).toEqual({
            id: 'a',
            followup: { do: 'call', after: '2026-12-01' },
            last: 'end'
        });
        const flow = setFields(manifest('followup: [{ do: call, after: 2026-10-01 }]\n'), {
            'followup.do': 'call again'
        });
        expect(flow.refused).toEqual([]);
        expect(parse(flow.text)).toEqual({
            id: 'a',
            followup: { do: 'call again', after: '2026-10-01' },
            last: 'end'
        });
    });

    it('leaves the lines around it as they were', () => {
        const source = 'id: a\n# before\nfollowup:\n  - ask\nlast: end  # after\n';
        const out = setFields(source, { 'followup.after': '2026-11-01' });
        expect(out.changed).toEqual(['followup.after']);
        expect(out.text.startsWith('id: a\n# before\nfollowup:')).toBe(true);
        expect(out.text.endsWith('last: end  # after\n')).toBe(true);
    });

    it('writes nothing when the key already holds the value asked', () => {
        const held = 'followup:\n  - do: call\n    after: 2026-10-01\n';
        const out = setFields(manifest(held), { 'followup.do': 'call' });
        expect(out.refused).toEqual([]);
        expect(out.changed).toEqual([]);
        expect(out.text).toBe(manifest(held));
    });
});

describe('the comments of a list of one note', () => {
    const DATE = { 'followup.after': '2026-12-01' };

    it('keeps a comment after the key on the key line', () => {
        const out = setFields(manifest('followup:  # waiting on the reply\n  - call\n'), DATE);
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            manifest('followup:  # waiting on the reply\n  do: call\n  after: 2026-12-01\n')
        );
    });

    it('keeps a comment line before the item above the first key', () => {
        const out = setFields(manifest('followup:\n  # a comment\n  - call\n'), DATE);
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            manifest('followup:\n  # a comment\n  do: call\n  after: 2026-12-01\n')
        );
    });

    it('keeps a comment after a value after that value, whether the key is set or not', () => {
        const held =
            'followup:\n  - do: call Stephanie  # about the estimator\n    after: 2026-10-01  # chase\n';
        const out = setFields(manifest(held), DATE);
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            manifest(
                'followup:\n  do: call Stephanie  # about the estimator\n  after: 2026-12-01  # chase\n'
            )
        );
        const bare = setFields(manifest('followup:\n  - call  # note\n'), DATE);
        expect(bare.text).toBe(manifest('followup:\n  do: call  # note\n  after: 2026-12-01\n'));
    });

    it('keeps the comments of a bare note: after the key, before it and after its text', () => {
        const key = setFields(manifest('followup: call  # the note\n'), DATE);
        expect(key.refused).toEqual([]);
        expect(key.text).toBe(manifest('followup:\n  do: call  # the note\n  after: 2026-12-01\n'));
        const above = setFields(manifest('followup:  # waiting\n  call\n'), DATE);
        expect(above.text).toBe(
            manifest('followup:  # waiting\n  do: call\n  after: 2026-12-01\n')
        );
    });

    it('keeps a comment between the keys above the key that follows it', () => {
        const held = 'followup:\n  - do: call\n    # the date\n    after: 2026-10-01\n';
        const out = setFields(manifest(held), { 'followup.do': 'ring' });
        expect(out.text).toBe(
            manifest('followup:\n  do: ring\n  # the date\n  after: 2026-10-01\n')
        );
    });

    it('keeps a comment after a flow list after its last value', () => {
        const out = setFields(manifest('followup: [{ do: call, after: 2026-10-01 }]  # flow\n'), {
            'followup.do': 'ring'
        });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(manifest('followup:\n  do: ring\n  after: 2026-10-01  # flow\n'));
    });

    it('keeps the comments of a key that is cleared as comment lines', () => {
        const held = 'followup:\n  - do: call  # the text\n    after: 2026-10-01  # chase\n';
        const out = setFields(manifest(held), { 'followup.after': null });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(manifest('followup:\n  do: call  # the text\n  # chase\n'));
    });

    it('refuses, writing nothing, when a comment stands inside a multi-line value', () => {
        const held =
            'followup:\n  - do: |  # why\n      first\n      second\n    after: 2026-10-01\n';
        const out = setFields(manifest(held), DATE);
        expect(out.changed).toEqual([]);
        expect(out.text).toBe(manifest(held));
        expect(out.refused).toHaveLength(1);
        expect(out.refused[0].reason).toMatch(/comment/);
    });
});

describe('a list of two notes', () => {
    it('is refused, and the file is returned as it was', () => {
        const source = manifest('followup:\n  - first\n  - second\n');
        const out = setFields(source, { 'followup.after': '2026-11-01' });
        expect(out.refused).toEqual([{ field: 'followup.after', reason: 'followup is not a map' }]);
        expect(out.changed).toEqual([]);
        expect(out.text).toBe(source);
    });
});
