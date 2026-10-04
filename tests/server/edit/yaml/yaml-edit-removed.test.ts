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
import { setFields } from '../../../../src/lib/server/edit/yaml/yaml-edit.ts';
import { insertRemoved } from '../../../../src/lib/server/edit/writes/restore.ts';

/** The value a field held in a document, read the way the change record keeps it. */
function held(source: string, field: string): unknown {
    const data = parse(source) as Record<string, unknown>;
    const path = field.split('.');
    if (path.length === 1) return data[field];
    return (data[path[0]] as Record<string, unknown>)[path[1]];
}

/** A field cleared and put back, with the text it came back as. */
function roundTrip(source: string, field: string, clear: unknown = null): string {
    const cleared = setFields(source, { [field]: clear });
    const back = insertRemoved(cleared.text, field, held(source, field), cleared.removed[field]);
    expect(back.refused).toEqual([]);
    expect(back.changed).toEqual([field]);
    return back.text;
}

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
});
