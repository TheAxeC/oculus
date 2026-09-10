// The write rule of package O11: a write changes the bytes of the field it writes and no others.
//
// The synthetic documents below carry every shape the tree has: a plain scalar and a quoted one, a
// flow list and a block list, a nested map and a flow map, an empty value, comments on the edited
// line and elsewhere. What each case checks is the text itself, line by line, because the whole
// point of the module is which bytes moved.
//
// The last describe reads the real hub, read only, exactly as tests/integrity.test.ts does and for
// the same reason: the manifests are the thing this has to be safe on, and a rule that holds on
// three fixtures and not on the ninety-one is not a rule. Nothing there is written; when the hub is
// not on this machine the whole block skips and says so.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { setFields } from '../../src/lib/server/yaml-edit.ts';
import { engineDir, loadConfig, loadLocal } from '../../src/lib/data/sources/config.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';

const DOC = [
    'id: alpha',
    'title: "A title"',
    'venue_id:',
    'program: [tensor, sciml]',
    'results:',
    '  - "one"',
    '  - "two"',
    'status:',
    '  chips: [submitted, lead]',
    '  line: "the line"   # a comment',
    'followup: { do: "note", after: "2026-09-18" }',
    'compute: hpc      # trailing',
    ''
].join('\n');

/** The document with one line replaced, which is what most of these cases expect to come back. */
function withLine(at: number, line: string): string {
    const lines = DOC.split('\n');
    lines[at] = line;
    return lines.join('\n');
}

/** The lines of the source that the result does not hold in the same place. */
function movedLines(source: string, result: string): number {
    const a = source.split('\n');
    const b = result.split('\n');
    let at = 0;
    while (at < a.length && a[at] === b[at]) at += 1;
    if (b.length === a.length && a.slice(at + 1).join('\n') === b.slice(at + 1).join('\n'))
        return 1;
    if (b.length === a.length + 1 && a.slice(at).join('\n') === b.slice(at + 1).join('\n'))
        return 1;
    return Math.max(a.length, b.length);
}

describe('setting a scalar', () => {
    it('writes a plain value in place and keeps the comment on its line', () => {
        const out = setFields(DOC, { compute: 'local' });
        expect(out.changed).toEqual(['compute']);
        expect(out.text).toBe(withLine(11, 'compute: local      # trailing'));
    });

    it('keeps the quoting the file had', () => {
        const out = setFields(DOC, { title: 'Another title' });
        expect(out.text).toBe(withLine(1, 'title: "Another title"'));
    });

    it('fills a key that has no value, giving it the space the colon has not got', () => {
        const out = setFields(DOC, { venue_id: 'bspc' });
        expect(out.text).toBe(withLine(2, 'venue_id: bspc'));
    });

    it('writes a value with a newline in it as one double-quoted line', () => {
        const out = setFields(DOC, { title: 'two\nlines' });
        expect(out.text).toBe(withLine(1, 'title: "two\\nlines"'));
    });

    it('leaves every other line of the file untouched', () => {
        const out = setFields(DOC, { compute: 'local' });
        expect(movedLines(DOC, out.text)).toBe(1);
    });
});

describe('setting a list', () => {
    it('keeps a flow list flow', () => {
        const out = setFields(DOC, { program: ['tensor', 'hcc'] });
        expect(out.text).toBe(withLine(3, 'program: [tensor, hcc]'));
    });

    it('keeps a block list block, at its own indentation and quoting', () => {
        const out = setFields(DOC, { results: ['one', 'two', 'three'] });
        expect(out.text).toBe(
            DOC.replace('  - "one"\n  - "two"', '  - "one"\n  - "two"\n  - "three"')
        );
    });

    it('writes an empty list as the empty flow list', () => {
        const out = setFields(DOC, { program: [] });
        expect(out.text).toBe(withLine(3, 'program: []'));
    });
});

describe('the nested fields', () => {
    it('writes a key of a block map in place, comment and all', () => {
        const out = setFields(DOC, { 'status.line': 'x' });
        expect(out.text).toBe(withLine(9, '  line: "x"   # a comment'));
    });

    it('adds a key to a block map at the map indentation', () => {
        const out = setFields(DOC, { 'status.note': 'later' });
        expect(out.text).toBe(
            DOC.replace(
                '  line: "the line"   # a comment',
                '  line: "the line"   # a comment\n  note: later'
            )
        );
    });

    it('writes a key of a flow map without unfolding it', () => {
        const out = setFields(DOC, { 'followup.after': '2026-10-01' });
        expect(out.text).toBe(withLine(10, 'followup: { do: "note", after: "2026-10-01" }'));
    });

    it('adds a key to a flow map after its last one', () => {
        const out = setFields(DOC, { 'followup.why': 'because' });
        expect(out.text).toBe(
            withLine(10, 'followup: { do: "note", after: "2026-09-18", why: because }')
        );
    });

    it('creates the map when neither key is there', () => {
        const out = setFields(DOC, { 'reproduced.date': '2026-01-01' });
        expect(out.text).toBe(`${DOC.trimEnd()}\nreproduced:\n  date: 2026-01-01\n`);
    });

    it('expands the dual-shape followup, keeping the note it stood for', () => {
        const source = 'id: a\nfollowup: "Register for FLTA"\nlast: end\n';
        const out = setFields(source, { 'followup.after': '2026-01-01' });
        expect(out.text).toBe(
            'id: a\nfollowup:\n  do: "Register for FLTA"\n  after: 2026-01-01\nlast: end\n'
        );
    });

    it('replaces the dual-shape followup when the note itself is what is set', () => {
        const source = 'id: a\nfollowup: "Register for FLTA"\nlast: end\n';
        const out = setFields(source, { 'followup.do': 'something else' });
        expect(out.text).toBe('id: a\nfollowup:\n  do: something else\nlast: end\n');
    });
});

describe('adding a key the file does not have', () => {
    it('appends it after the last top-level key', () => {
        const out = setFields(DOC, { deadline: '2026-10-02' });
        expect(out.text).toBe(`${DOC.trimEnd()}\ndeadline: 2026-10-02\n`);
    });

    it('appends a block list as a block list', () => {
        const out = setFields(DOC, { ideas: ['an avenue'] });
        expect(out.text).toBe(`${DOC.trimEnd()}\nideas:\n  - "an avenue"\n`);
    });

    it('appends a relation list as a flow list', () => {
        const out = setFields(DOC, { datasets: ['mimic', 'ptbxl'] });
        expect(out.text).toBe(`${DOC.trimEnd()}\ndatasets: [mimic, ptbxl]\n`);
    });
});

describe('clearing a key', () => {
    it('removes the line, its comment with it', () => {
        const out = setFields(DOC, { compute: null });
        expect(out.text).toBe(DOC.replace('compute: hpc      # trailing\n', ''));
    });

    it('removes a block list whole', () => {
        const out = setFields(DOC, { results: null });
        expect(out.text).toBe(DOC.replace('results:\n  - "one"\n  - "two"\n', ''));
    });

    it('removes one key of a flow map with the comma that joined it', () => {
        const out = setFields(DOC, { 'followup.after': null });
        expect(out.text).toBe(withLine(10, 'followup: { do: "note" }'));
    });

    it('removes the map itself when its last key goes', () => {
        const out = setFields(DOC, { 'status.chips': null, 'status.line': null });
        expect(out.text).toBe(
            DOC.replace(
                'status:\n  chips: [submitted, lead]\n  line: "the line"   # a comment\n',
                ''
            )
        );
    });

    it('says a key that is not there is not there, and writes nothing', () => {
        const out = setFields(DOC, { doi: null });
        expect(out).toEqual({ text: DOC, changed: [], refused: [] });
    });
});

describe('what is not written', () => {
    it('leaves a value the file already holds out of changed', () => {
        const out = setFields(DOC, {
            title: 'A title',
            compute: 'hpc',
            program: ['tensor', 'sciml'],
            'status.line': 'the line'
        });
        expect(out).toEqual({ text: DOC, changed: [], refused: [] });
    });

    it('refuses id, tier and type', () => {
        const out = setFields(DOC, { id: 'other', tier: 'projects', type: 'idea' });
        expect(out.text).toBe(DOC);
        expect(out.refused.map((one) => one.field)).toEqual(['id', 'tier', 'type']);
    });

    it('refuses a path deeper than one level, and one with an empty segment', () => {
        const out = setFields(DOC, { 'a.b.c': 'x', 'a.': 'y' });
        expect(out.refused.map((one) => one.reason)).toEqual([
            'not a field name',
            'not a field name'
        ]);
    });

    it('refuses a value that is not a scalar, a list of strings or null', () => {
        const out = setFields(DOC, { title: { a: 1 }, program: [1, 2] });
        expect(out.text).toBe(DOC);
        expect(out.refused.map((one) => one.field)).toEqual(['title', 'program']);
    });

    it('refuses everything when the file does not parse', () => {
        const out = setFields('id: [unclosed\n', { title: 'x' });
        expect(out.refused).toEqual([{ field: 'title', reason: 'the manifest does not parse' }]);
    });
});

describe('the self-verification', () => {
    // An anchored value is one value in two places: writing the bytes of `title` writes `short` with
    // it, which is more than the field that was asked for. The guard is what turns that into a
    // refusal, and the document is a real one rather than a broken function.
    const anchored = 'id: a\ntitle: &t one\nshort: *t\n';

    it('refuses an edit that would change a second field with the one it was given', () => {
        const out = setFields(anchored, { title: 'two' });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            { field: 'title', reason: 'the edit did not verify; nothing was written' }
        ]);
    });

    it('leaves the document it refused to edit byte for byte', () => {
        expect(setFields(anchored, { title: 'two' }).text).toBe(anchored);
    });

    it('refuses a document with the same key twice before it edits anything', () => {
        const twice = 'id: a\ntitle: one\ntitle: two\n';
        const out = setFields(twice, { title: 'three' });
        expect(out.text).toBe(twice);
        expect(out.refused).toEqual([{ field: 'title', reason: 'the manifest does not parse' }]);
    });
});

const engine = engineDir();
const hub = loadLocal(engine).hub;
const present = existsSync(hub);
if (!present) {
    console.warn(`yaml-edit: skipped the real hub, ${hub} does not exist on this machine`);
}

/** Every project.yml under a scan directory, by a plain walk; nothing here writes. */
function manifestFiles(dir: string): string[] {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return [];
    }
    const found: string[] = [];
    for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'code' || entry.name === 'attic') continue;
        if (entry.isFile() && entry.name === 'project.yml') found.push(join(dir, entry.name));
        if (entry.isDirectory()) found.push(...manifestFiles(join(dir, entry.name)));
    }
    return found;
}

describe.skipIf(!present)('every manifest of the real hub, read only', () => {
    const config = portfolioConfigFrom(loadConfig(engine).config);
    const files = config.scan.flatMap((rule) => manifestFiles(join(hub, rule.dir))).sort();

    it('finds the manifests at all', () => {
        console.log(`yaml-edit: ${files.length} manifests read from ${hub}`);
        expect(files.length).toBeGreaterThan(50);
    });

    it('writes nothing when each is given back its own title', () => {
        const wrong: string[] = [];
        for (const file of files) {
            const source = readFileSync(file, 'utf8');
            const title = (parse(source) as Record<string, unknown>).title;
            if (typeof title !== 'string') {
                wrong.push(`${file}: no title to give back`);
                continue;
            }
            const out = setFields(source, { title });
            if (out.text !== source || out.changed.length > 0 || out.refused.length > 0) {
                wrong.push(
                    `${file}: ${JSON.stringify(out.changed)} ${JSON.stringify(out.refused)}`
                );
            }
        }
        expect(wrong).toEqual([]);
    });

    it('touches one line of each when the status line is set', () => {
        const wrong: string[] = [];
        for (const file of files) {
            const source = readFileSync(file, 'utf8');
            const out = setFields(source, { 'status.line': 'x' });
            if (out.changed.length !== 1 || out.refused.length > 0) {
                wrong.push(`${file}: ${JSON.stringify(out.refused)}`);
                continue;
            }
            if (movedLines(source, out.text) !== 1) wrong.push(`${file}: more than one line moved`);
        }
        expect(wrong).toEqual([]);
    });
});
