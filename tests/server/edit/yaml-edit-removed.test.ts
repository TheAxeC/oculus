// The text a clear takes out of a manifest, and putting it back: setFields answers, for each field
// it cleared, the characters it removed, the index they stood at in the text it left and the rest
// of that line; insertRemoved puts the characters back at the place of that line which keeps the
// document what the value says it was. For whole lines, when no place of that line passes, every
// other line start is tried, nearest first; text taken from inside a line tries only the places of
// that line.
//
// The documents are synthetic, one per shape a clear takes text out in. What each case compares is
// the whole text, since the point of both functions is which bytes moved.

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { insertRemoved, setFields } from '../../../src/lib/server/edit/yaml-edit.ts';
import type { RemovedText } from '../../../src/lib/server/core/changes.ts';

/** The value a field held in a document, read the way the change record keeps it. */
function held(source: string, field: string): unknown {
    const data = parse(source) as Record<string, unknown>;
    const path = field.split('.');
    if (path.length === 1) return data[field];
    return (data[path[0]] as Record<string, unknown>)[path[1]];
}

/** The entry `setFields` made for one cleared field, which must exist. */
function removal(source: string, field: string): RemovedText {
    const entry = setFields(source, { [field]: null }).removed[field];
    expect(entry).toBeDefined();
    return entry;
}

/** A field cleared and put back, with the text it came back as. */
function roundTrip(source: string, field: string, clear: unknown = null): string {
    const cleared = setFields(source, { [field]: clear });
    const back = insertRemoved(cleared.text, field, held(source, field), cleared.removed[field]);
    expect(back.refused).toEqual([]);
    expect(back.changed).toEqual([field]);
    return back.text;
}

describe('the removal setFields reports', () => {
    it('keeps a whole line with its comment, and the line that follows', () => {
        const source = 'id: alpha\ntitle: "A title"  # the name\nstatus:\n  line: "the line"\n';
        expect(removal(source, 'title')).toEqual({
            offset: 10,
            text: 'title: "A title"  # the name\n',
            next: 'status:'
        });
    });

    it('keeps the parent of the only child of a map with it', () => {
        const source = 'id: alpha\ntitle: "A title"\nstatus:\n  line: "the line"\nnext: go\n';
        expect(removal(source, 'status.line')).toEqual({
            offset: 27,
            text: 'status:\n  line: "the line"\n',
            next: 'next: go'
        });
    });

    it('keeps a block list whole', () => {
        const source = 'id: alpha\nrelated:\n  - a\n  - b\nnext: go\n';
        expect(removal(source, 'related')).toEqual({
            offset: 10,
            text: 'related:\n  - a\n  - b\n',
            next: 'next: go'
        });
    });

    it('keeps a group cleared whole', () => {
        const source = 'id: alpha\nfollowup:\n  do: call\n  after: 2026-10-01\nnext: go\n';
        expect(removal(source, 'followup')).toEqual({
            offset: 10,
            text: 'followup:\n  do: call\n  after: 2026-10-01\n',
            next: 'next: go'
        });
    });

    it('keeps part of a line for a key of a flow map', () => {
        const source = 'id: alpha\nstatus: { line: "x", chips: [a] }\n';
        expect(removal(source, 'status.line')).toEqual({
            offset: 20,
            text: 'line: "x", ',
            next: 'chips: [a] }'
        });
    });

    it('keeps the comma before a later key of a flow map', () => {
        const source = 'id: alpha\nstatus: { line: "x", chips: [a] }\n';
        expect(removal(source, 'status.chips')).toEqual({
            offset: 29,
            text: ', chips: [a]',
            next: ' }'
        });
    });

    it('gives each of two cleared fields its own entry, in the text the write left', () => {
        const source = 'id: alpha\ntitle: T\nnext: go\nshort: s\n';
        const out = setFields(source, { title: null, short: null });
        expect(out.text).toBe('id: alpha\nnext: go\n');
        expect(out.removed).toEqual({
            title: { offset: 10, text: 'title: T\n', next: 'next: go' },
            short: { offset: 19, text: 'short: s\n', next: '' }
        });
    });

    it('moves a point by the change in length of an edit above it', () => {
        const source = 'id: alpha\ntitle: T\nshort: s\nnext: go\n';
        const out = setFields(source, { short: null, title: 'a much longer title' });
        expect(out.text).toBe('id: alpha\ntitle: a much longer title\nnext: go\n');
        expect(out.removed).toEqual({
            short: { offset: 37, text: 'short: s\n', next: 'next: go' }
        });
    });

    it('moves a point to the start of a later removal that holds it', () => {
        const source = 'id: alpha\nstatus:\n  chips: [a]\n  line: "x"\nnext: go\n';
        const out = setFields(source, { 'status.chips': null, 'status.line': null });
        expect(out.text).toBe('id: alpha\nnext: go\n');
        expect(out.removed).toEqual({
            'status.chips': { offset: 10, text: '  chips: [a]\n', next: 'next: go' },
            'status.line': { offset: 10, text: 'status:\n  line: "x"\n', next: 'next: go' }
        });
    });

    it('reports nothing for a field that was replaced or added', () => {
        const source = 'id: alpha\ntitle: T\n';
        expect(setFields(source, { title: 'U', year: 2025 }).removed).toEqual({});
    });

    it('reports only the fields that were written', () => {
        const out = setFields('id: alpha\ntitle: T\n', { title: null, tier: 'x' });
        expect(out.refused).toEqual([
            { field: 'tier', reason: 'tier is set by the folder, never by a write' }
        ]);
        expect(Object.keys(out.removed)).toEqual(['title']);
    });

    it('reports nothing for a manifest that does not parse', () => {
        const out = setFields('id: [alpha\n', { title: null });
        expect(out.changed).toEqual([]);
        expect(out.removed).toEqual({});
    });

    it('reports nothing when the result did not verify and nothing was written', () => {
        // The anchor makes the write of `title` change `short` too, which the check refuses.
        const anchored = 'id: a\ntitle: &t one\nshort: *t\nnote: n\n';
        const out = setFields(anchored, { note: null, title: 'two' });
        expect(out.text).toBe(anchored);
        expect(out.changed).toEqual([]);
        expect(out.removed).toEqual({});
    });

    it('reports the lines of a file with CRLF line ends, the carriage return with its line', () => {
        const source = 'id: alpha\r\ntitle: T\r\nnext: go\r\n';
        expect(removal(source, 'title')).toEqual({
            offset: 11,
            text: 'title: T\r\n',
            next: 'next: go\r'
        });
        expect(roundTrip(source, 'title')).toBe(source);
    });

    it('reports a last line that has no line break', () => {
        const source = 'id: alpha\ntitle: T';
        expect(removal(source, 'title')).toEqual({ offset: 10, text: 'title: T', next: '' });
        expect(roundTrip(source, 'title')).toBe(source);
    });

    it('counts the offset in UTF-16 code units, past a character outside the BMP', () => {
        const source = 'id: alpha\nnote: "\ud83d\ude00"\ntitle: T\nnext: go\n';
        expect(removal(source, 'title')).toEqual({
            offset: 21,
            text: 'title: T\n',
            next: 'next: go'
        });
        expect(roundTrip(source, 'title')).toBe(source);
    });
});

describe('putting removed text back', () => {
    it('gives back every shape a clear takes text out in', () => {
        const sources: [string, string, unknown?][] = [
            ['title', 'id: alpha\ntitle: "A title"  # the name\nstatus:\n  line: "the line"\n'],
            ['status.line', 'id: alpha\ntitle: "A title"\nstatus:\n  line: "the line"\nnext: go\n'],
            ['related', 'id: alpha\nrelated:\n  - a\n  - b\nnext: go\n'],
            ['followup', 'id: alpha\nfollowup:\n  do: call\n  after: 2026-10-01\nnext: go\n'],
            ['status.line', 'id: alpha\nstatus: { line: "x", chips: [a] }\n'],
            ['status.chips', 'id: alpha\nstatus: { line: "x", chips: [a] }\n']
        ];
        for (const [field, source] of sources) expect(roundTrip(source, field)).toBe(source);
    });

    it('gives a block scalar back with the line breaks it keeps', () => {
        const keep = 'id: alpha\nabstract: |+\n  one\n\nnext: go\n';
        expect(roundTrip(keep, 'abstract')).toBe(keep);
        const clip = 'id: alpha\nabstract: |\n  one\n  two\n\nnext: go\n';
        expect(removal(clip, 'abstract').next).toBe('');
        expect(roundTrip(clip, 'abstract')).toBe(clip);
    });

    it('gives back a list of maps cleared by an empty list, and a map cleared by an empty map', () => {
        const list = 'id: alpha\nmeta:\n  - { a: "1" }\n  - { a: "2" }\nnext: go\n';
        expect(setFields(list, { meta: [] }).removed.meta).toBeDefined();
        expect(roundTrip(list, 'meta', [])).toBe(list);
        const map = 'id: alpha\nmeta:\n  a: "1"\n  b: "2"\nnext: go\n';
        expect(setFields(map, { meta: {} }).removed.meta).toBeDefined();
        expect(roundTrip(map, 'meta', {})).toBe(map);
    });

    it('tries the place of the following line nearest the recorded index first', () => {
        const source = 'id: alpha\n# --\ntitle: T\n# --\nnext: go\n';
        const cleared = setFields(source, { title: null });
        const near = cleared.removed.title;
        const text = cleared.text;
        expect(insertRemoved(text, 'title', 'T', { ...near, offset: 0 }).text).toBe(
            'id: alpha\ntitle: T\n# --\n# --\nnext: go\n'
        );
        expect(insertRemoved(text, 'title', 'T', near).text).toBe(source);
    });

    it('tries the earlier of two places at the same distance', () => {
        // The places of `# --` are 5 and 15, each 5 from the recorded index.
        const text = 'a: 1\n# --\nx: 2\n# --\n';
        const removed = { offset: 10, text: 'b: 2\n', next: '# --' };
        expect(insertRemoved(text, 'b', 2, removed).text).toBe('a: 1\nb: 2\n# --\nx: 2\n# --\n');
    });

    it('falls to the nearest line start when the following line is gone', () => {
        const text = 'id: alpha\nnext: go\nlast: end\n';
        const removed = { offset: 19, text: 'title: T\n', next: 'no such line' };
        expect(insertRemoved(text, 'title', 'T', removed).text).toBe(
            'id: alpha\nnext: go\ntitle: T\nlast: end\n'
        );
    });

    it('never tries an index between the two halves of a surrogate pair', () => {
        // Text put inside a comment leaves the document as it was, so a place inside the comment
        // passes the check wherever it is; only the place between the halves of the pair is one
        // the function must not try.
        const source = 'id: alpha\ntitle: T\n# \ud83d\ude00\n';
        const whole = insertRemoved(source, 'title', 'T', {
            offset: 0,
            text: ' x',
            next: '\ud83d\ude00'
        });
        expect(whole.text).toBe('id: alpha\ntitle: T\n#  x\ud83d\ude00\n');
        const split = insertRemoved(source, 'title', 'T', {
            offset: 0,
            text: ' x',
            next: '\ude00'
        });
        expect(split.changed).toEqual([]);
        expect(split.text).toBe(source);
    });

    it('answers the source unchanged when no place keeps the document right', () => {
        const source = 'id: alpha\nstatus:\n  line: x\n';
        const out = insertRemoved(source, 'title', 'A title', {
            offset: 10,
            text: 'title: "A title"',
            next: 'nowhere'
        });
        expect(out).toEqual({
            text: source,
            changed: [],
            refused: [{ field: 'title', reason: 'the removed text does not fit the file' }]
        });
    });

    it('refuses the fields a write never sets, and a name that is not a field', () => {
        const source = 'id: alpha\nnext: go\n';
        const removed = { offset: 10, text: 'tier: x\n', next: 'next: go' };
        expect(insertRemoved(source, 'tier', 'x', removed).refused).toEqual([
            { field: 'tier', reason: 'tier is set by the folder, never by a write' }
        ]);
        expect(insertRemoved(source, 'a.b.c', 'x', removed).refused).toEqual([
            { field: 'a.b.c', reason: 'not a field name' }
        ]);
        expect(insertRemoved('id: [alpha', 'title', 'x', removed).refused).toEqual([
            { field: 'title', reason: 'the manifest does not parse' }
        ]);
    });

    it('does not insert a key the file already holds', () => {
        const source = 'id: alpha\ntitle: U\n';
        const removed = { offset: 10, text: 'title: T\n', next: 'title: U' };
        expect(insertRemoved(source, 'title', 'T', removed).changed).toEqual([]);
    });
});
