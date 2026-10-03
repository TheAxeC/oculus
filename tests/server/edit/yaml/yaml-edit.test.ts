// The manifest write rule: a write changes the bytes of the field it writes and no others.
//
// The synthetic documents below carry every shape the tree has: a plain scalar and a quoted one, a
// flow list and a block list, a nested map and a flow map, an empty value, comments on the edited
// line and elsewhere. What each case checks is the text itself, line by line, because the whole
// point of the module is which bytes moved.
//
// The last describe reads the real hub, read only, exactly as tests/checks/config/integrity.test.ts
// does and for the same reason: the manifests are the thing this has to be safe on, and a rule that
// holds on three fixtures and not on the ninety-one is not a rule. Nothing there is written; when
// the hub is not on this machine the whole block skips and says so.

import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
    NOT_A_FIELD_VALUE,
    asFieldValue,
    renameKey,
    sameValue,
    setFields
} from '../../../../src/lib/server/edit/yaml/yaml-edit.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { isSideTier } from '../../../../src/lib/data/sources/manifests.ts';
import { realHub } from '../../../fixtures/real-hub.ts';

const DOC = [
    'id: alpha',
    'title: "A title"',
    'venue_id:',
    'pillar: [tensor, sciml]',
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
});

describe('setting a metalist', () => {
    const source = [
        'title: Things',
        'meta:',
        '  - { label: Scheme, value: Old }',
        '  - { label: Host, value: UT }',
        'after: kept',
        ''
    ].join('\n');

    it('replaces the whole block and keeps the bytes around it', () => {
        const out = setFields(source, {
            meta: [
                { label: 'Scheme', value: 'NWO Veni' },
                { label: 'Stage', value: 'submitted' }
            ]
        });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            [
                'title: Things',
                'meta:',
                '  - { label: Scheme, value: "NWO Veni" }',
                '  - { label: Stage, value: "submitted" }',
                'after: kept',
                ''
            ].join('\n')
        );
    });

    it('appends a metalist as block flow maps', () => {
        const out = setFields('title: Things\nafter: kept\n', {
            meta: [{ label: 'Scheme', value: 'NWO Veni' }]
        });
        expect(out.text).toBe(
            'title: Things\nafter: kept\nmeta:\n  - { label: Scheme, value: "NWO Veni" }\n'
        );
    });

    it('clears an existing metalist with an empty list', () => {
        const out = setFields(source, { meta: [] });
        expect(out.text).toBe('title: Things\nafter: kept\n');
    });
});

describe('setting a block map', () => {
    const source = [
        'title: Dataset',
        'retrieval:',
        '  method: curl',
        '  retries: 2',
        'after: kept',
        ''
    ].join('\n');

    it('replaces the whole block and leaves the bytes around it untouched', () => {
        const out = setFields(source, {
            retrieval: { method: 'wget', verified: true, token: null }
        });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe(
            [
                'title: Dataset',
                'retrieval:',
                '  method: wget',
                '  verified: true',
                '  token: null',
                'after: kept',
                ''
            ].join('\n')
        );
    });

    it('clears the whole key when given an empty map', () => {
        const out = setFields(source, { retrieval: {} });
        expect(out.refused).toEqual([]);
        expect(out.text).toBe('title: Dataset\nafter: kept\n');
    });

    it('writes a block holding a list, a nested map and a list of maps, and reads it back equal', () => {
        const value = {
            method: 'curl',
            priority_first: ['one', 'two'],
            files: [
                { name: 'a.zip', sha: 'aaa' },
                { name: 'b.zip', sha: 'bbb' }
            ],
            auth: { kind: 'token', env: 'TOKEN' }
        };
        const out = setFields(source, { retrieval: value });
        expect(out.refused).toEqual([]);
        expect(out.changed).toEqual(['retrieval']);
        expect(out.text).toBe(
            [
                'title: Dataset',
                'retrieval:',
                '  method: curl',
                '  priority_first:',
                '  - one',
                '  - two',
                '  files:',
                '  - name: a.zip',
                '    sha: aaa',
                '  - name: b.zip',
                '    sha: bbb',
                '  auth:',
                '    kind: token',
                '    env: TOKEN',
                'after: kept',
                ''
            ].join('\n')
        );
        expect(parse(out.text)).toEqual({ title: 'Dataset', retrieval: value, after: 'kept' });
    });

    it('refuses a map holding something that is no scalar, list or map', () => {
        const out = setFields(source, { retrieval: { method: () => 'wget' } });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([{ field: 'retrieval', reason: NOT_A_FIELD_VALUE }]);
        expect(out.text).toBe(source);
    });
});

describe('setting a list', () => {
    it('keeps a flow list flow', () => {
        const out = setFields(DOC, { pillar: ['tensor', 'hcc'] });
        expect(out.text).toBe(withLine(3, 'pillar: [tensor, hcc]'));
    });

    it('keeps a block list block, at its own indentation and quoting', () => {
        const out = setFields(DOC, { results: ['one', 'two', 'three'] });
        expect(out.text).toBe(
            DOC.replace('  - "one"\n  - "two"', '  - "one"\n  - "two"\n  - "three"')
        );
    });

    it('writes an empty list as the empty flow list', () => {
        const out = setFields(DOC, { pillar: [] });
        expect(out.text).toBe(withLine(3, 'pillar: []'));
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

describe('a flow list with a comment after it', () => {
    it('adds an item to a flow list and keeps the comment after it', () => {
        const source = 'id: a\ncompute: [utwente]  # BraTS caches\nlast: end\n';
        const out = setFields(source, { compute: ['utwente', 'this-mac'] });
        expect(out.text).toBe('id: a\ncompute: [utwente, this-mac]  # BraTS caches\nlast: end\n');
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
        expect(out).toEqual({ text: DOC, changed: [], refused: [], removed: {}, replaced: {} });
    });
});

describe('what is not written', () => {
    it('leaves a value the file already holds out of changed', () => {
        const out = setFields(DOC, {
            title: 'A title',
            compute: 'hpc',
            pillar: ['tensor', 'sciml'],
            'status.line': 'the line'
        });
        expect(out).toEqual({ text: DOC, changed: [], refused: [], removed: {}, replaced: {} });
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

    it('refuses a list that is neither strings nor maps of strings', () => {
        const out = setFields(DOC, { pillar: [1, 2] });
        expect(out.text).toBe(DOC);
        expect(out.refused).toEqual([{ field: 'pillar', reason: NOT_A_FIELD_VALUE }]);
    });

    it('refuses everything when the file does not parse', () => {
        const out = setFields('id: [unclosed\n', { title: 'x' });
        expect(out.refused).toEqual([{ field: 'title', reason: 'the manifest does not parse' }]);
    });
});

describe('renaming a key', () => {
    it('writes the new name over the old one and moves no other line', () => {
        const out = renameKey(DOC, 'pillar', 'strand');
        expect(out.changed).toEqual(['pillar']);
        expect(out.text).toBe(withLine(3, 'strand: [tensor, sciml]'));
        expect(movedLines(DOC, out.text)).toBe(1);
    });

    it('keeps a block list and a nested map under their key', () => {
        const out = renameKey(DOC, 'results', 'findings');
        expect(out.text).toBe(withLine(4, 'findings:'));
        expect(parse(out.text)).toMatchObject({ findings: ['one', 'two'] });
    });

    it('changes nothing when the file does not hold the old key', () => {
        const out = renameKey(DOC, 'nothing', 'something');
        expect(out).toEqual({ text: DOC, changed: [], refused: [] });
    });

    it('refuses a rename onto a key the file already holds', () => {
        const out = renameKey(DOC, 'pillar', 'title');
        expect(out.text).toBe(DOC);
        expect(out.refused).toEqual([
            { field: 'pillar', reason: 'title is already a key of the manifest' }
        ]);
    });

    it('refuses a file that does not parse', () => {
        const out = renameKey('id: [\n', 'id', 'key');
        expect(out.refused).toEqual([{ field: 'id', reason: 'the manifest does not parse' }]);
    });
});

describe('the self-verification', () => {
    // An anchored value is one value in two places: writing the bytes of `title` writes `short`
    // with it, which is more than the field that was asked for. The guard is what turns that into a
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
const { hub, present } = realHub(engine);
if (!present) {
    console.warn(
        `yaml-edit: skipped the real hub, ${hub} carries no hub data (not on this machine, or a sparse checkout)`
    );
}

/** Every project.yml under a scan directory, by a plain walk; nothing here writes. */
function manifestFiles(dir: string): string[] {
    return globSync('**/project.yml', { cwd: dir, exclude: ['**/code', '**/attic'] }).map((rel) =>
        join(dir, rel)
    );
}

describe.skipIf(!present)('every manifest of the real hub, read only', () => {
    const config = portfolioConfigFrom(loadConfig(engine).config, engine);
    // A side project's manifest is never written (config/sources.yml), and its `status` is a word.
    const files = config.scan
        .filter((rule) => !isSideTier(rule))
        .flatMap((rule) => manifestFiles(join(hub, rule.dir)))
        .sort();

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

// Whether a value a write carries is the one the file already holds: the data compared deeply,
// with absent and null one thing.
describe('sameValue', () => {
    it('takes null and absent as one thing', () => {
        expect(sameValue(null, undefined)).toBe(true);
        expect(sameValue(undefined, null)).toBe(true);
        expect(sameValue(null, 'held')).toBe(false);
    });

    it('compares lists and maps by their contents', () => {
        expect(sameValue(['a'], ['a'])).toBe(true);
        expect(sameValue(['a'], ['a', 'b'])).toBe(false);
        expect(sameValue({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(sameValue({ a: 1, b: [2] }, { b: [2], a: 1 })).toBe(true);
    });
});

// The shapes a write may carry, told apart from a value that is none of them.
describe('asFieldValue', () => {
    it('answers a scalar as itself and a non-finite number or nothing as undefined', () => {
        for (const value of [null, 's', true, false, 2.5, 0]) {
            expect(asFieldValue(value)).toBe(value);
        }
        for (const value of [NaN, Infinity, -Infinity, undefined]) {
            expect(asFieldValue(value)).toBeUndefined();
        }
    });

    it('answers a list of strings and a list of string maps as the input itself', () => {
        const words = ['a', 'b'];
        const rows = [{ k: 'v' }];
        expect(asFieldValue(words)).toBe(words);
        expect(asFieldValue(rows)).toBe(rows);
        expect(asFieldValue(['a', 1])).toBeUndefined();
        expect(asFieldValue([{ k: 1 }])).toBeUndefined();
    });

    it('answers a date, a list of dates and a block map as the input itself', () => {
        const date = new Date(0);
        const list = [date];
        const block = { a: 1, b: ['x', { c: null }], d: { e: true } };
        expect(asFieldValue(date)).toBe(date);
        expect(asFieldValue(list)).toBe(list);
        expect(asFieldValue(block)).toBe(block);
    });
});
