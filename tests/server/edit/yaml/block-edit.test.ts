// Layer 4, server test. The block rewrite, `setBlock`: the value at a dotted key path of a YAML
// text replaced in place, with every byte outside the lines that changed left as the author wrote
// it.
//
// The cases run over the engine's own tracked files as the checkout holds them, so the shapes are
// the ones the Settings editors will write: every list option and every family of
// config/catalogs/options.yml, a scalar of one item changed, and the lines compared with the
// source. The render is called directly, so the writer's equal-value rule is not on the path of a
// case that changes a scalar. What this does NOT cover: the checks a write makes around the render
// (tests/server/edit/config-value.test.ts) and a file written with CRLF (the same file).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LineCounter, isMap, isSeq, parse, parseDocument } from 'yaml';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { setBlock } from '../../../../src/lib/server/edit/block-edit.ts';

const TRACKED = ['appearance.yml', 'behavior.yml', 'layout.yml', 'present.yml', 'sources.yml'];

/** The two families that keep a write of their own. */
const OWN_WRITE = ['rail', 'arrangements'];

type Block = { file: string; key: string; source: string; value: unknown; list: boolean };

/** The value at a dotted key path of a parsed file. */
function at(parsed: unknown, path: string[]): unknown {
    let node = parsed;
    for (const segment of path) node = (node as Record<string, unknown>)[segment];
    return node;
}

/** Every list option and family the catalog describes in a tracked file, with its text. */
function blocks(): Block[] {
    const catalog = catalogOf(loadConfig(engineDir()).config);
    const found: Block[] = [];
    for (const file of TRACKED) {
        const source = readFileSync(join(engineDir(), 'config', file), 'utf8');
        const parsed: unknown = parse(source);
        for (const [key, entry] of Object.entries(catalog[file])) {
            const collection = entry.fields !== undefined || entry.control === 'list';
            if (!collection || OWN_WRITE.includes(key)) continue;
            const list = entry.control === 'list';
            found.push({ file, key, source, value: at(parsed, key.split('.')), list });
        }
    }
    return found;
}

type Step = string | number;

/** The path of the first string or number leaf of a value, or null when it holds none. */
function firstLeaf(node: unknown, path: Step[] = []): Step[] | null {
    if (Array.isArray(node)) {
        for (const [index, item] of node.entries()) {
            const found = firstLeaf(item, [...path, index]);
            if (found !== null) return found;
        }
        return null;
    }
    if (node !== null && typeof node === 'object') {
        for (const [name, item] of Object.entries(node)) {
            const found = firstLeaf(item, [...path, name]);
            if (found !== null) return found;
        }
        return null;
    }
    return typeof node === 'string' || typeof node === 'number' ? path : null;
}

/** A copy of a value with the leaf at a path changed: a string gets an X, a number one more. */
function changedAt(node: unknown, path: Step[]): unknown {
    if (path.length === 0) return typeof node === 'number' ? node + 1 : `${String(node)}X`;
    const [head, ...rest] = path;
    if (Array.isArray(node)) {
        const items: unknown[] = node;
        return items.map((item, index) => (index === head ? changedAt(item, rest) : item));
    }
    const entries = Object.entries(node as Record<string, unknown>);
    return Object.fromEntries(
        entries.map(([name, item]) => [name, name === head ? changedAt(item, rest) : item])
    );
}

/** The 1-based first and last line of the item of a collection that a path starts with. */
function itemLines(source: string, key: string, first: Step): [number, number] {
    const counter = new LineCounter();
    const doc = parseDocument(source, { lineCounter: counter });
    let node: unknown = doc.contents;
    for (const segment of key.split('.')) {
        if (!isMap(node)) throw new Error(`${key} is not under maps`);
        node = node.items.find(
            (pair) => String((pair.key as { value: unknown }).value) === segment
        )?.value;
    }
    let from: number;
    let to: number;
    if (isSeq(node)) {
        const item = node.items[first as number] as { range: [number, number, number] };
        [from, to] = [item.range[0], item.range[1]];
    } else if (isMap(node)) {
        const pair = node.items.find(
            (one) => String((one.key as { value: unknown }).value) === first
        );
        const range = (pair?.value as { range: [number, number, number] }).range;
        from = (pair?.key as { range: [number, number, number] }).range[0];
        to = range[1];
    } else {
        throw new Error(`${key} is not a collection`);
    }
    const last = counter.linePos(Math.max(from, to - 1)).line;
    return [counter.linePos(from).line, last];
}

/** The 1-based numbers of the lines two texts do not share, which must be as many lines each. */
function differing(before: string, after: string): number[] {
    const left = before.split('\n');
    const right = after.split('\n');
    expect(right.length).toBe(left.length);
    return left.flatMap((line, index) => (line === right[index] ? [] : [index + 1]));
}

describe('the block rewrite over every list and family the files hold', () => {
    const all = blocks();

    // `all` is read once, with the catalog loaded once for every list and family; the case itself
    // only counts it and runs in 1 ms (npx vitest run <this file> -t "finds the 7 lists").
    it('finds the 7 lists and the 21 families of the five tracked files', () => {
        const lists = all.filter((one) => Array.isArray(one.value) && one.list);
        expect(lists.length).toBeGreaterThanOrEqual(7);
        expect(all.length).toBeGreaterThanOrEqual(28);
    });

    for (const block of all) {
        const path = block.key.split('.');
        const leaf = firstLeaf(block.value);
        if (leaf === null) {
            it(`${block.file} ${block.key} holds no item to change, and is written back as it is`, () => {
                expect(setBlock(block.source, path, block.value)).toBe(block.source);
            });
            continue;
        }

        it(`${block.file} ${block.key}: one scalar of one item changed leaves every other line`, () => {
            const changed = changedAt(block.value, leaf);
            const written = blockOf(block.source, path, changed);
            const lines = itemLines(block.source, block.key, leaf[0]);
            const moved = differing(block.source, written);
            expect(moved.length).toBeGreaterThan(0);
            expect(moved.every((line) => line >= lines[0] && line <= lines[1])).toBe(true);
            expect(at(parse(written), path)).toEqual(changed);
        });

        it(`${block.file} ${block.key}: the value as it stands is written back byte for byte`, () => {
            expect(setBlock(block.source, path, block.value)).toBe(block.source);
        });
    }
});

/** A shipped file as text. */
function shipped(file: string): string {
    return readFileSync(join(engineDir(), 'config', file), 'utf8');
}

describe('a comment inside a block and after it', () => {
    const COMMENT = '        # the engine slide, after the title\n';
    const ENGINE = '        - { slide: framing, ref: engine }\n';

    it('stays above the item it was written above when an item is added at the end', () => {
        const source = shipped('present.yml').replace(ENGINE, COMMENT + ENGINE);
        expect(source).toContain(COMMENT + ENGINE);
        const order = at(parse(source), ['deck', 'order']) as unknown[];
        const written = setBlock(
            source,
            ['deck', 'order'],
            [...order, { slide: 'project', ref: 'added' }]
        );
        const closing = '        - { slide: closing }\n';
        expect(written).toBe(
            source.replace(closing, `${closing}        - { slide: project, ref: added }\n`)
        );
        expect(written).toContain('    # Section slides');
    });

    it('stays above its item when that item is moved up', () => {
        const source = shipped('present.yml').replace(ENGINE, COMMENT + ENGINE);
        const order = at(parse(source), ['deck', 'order']) as unknown[];
        const moved = [order[1], order[0], ...order.slice(2)];
        const written = blockOf(source, ['deck', 'order'], moved);
        const lines = written.split('\n');
        const marker = lines.findIndex((line) => line.includes('the engine slide'));
        expect(lines[marker + 1]).toBe('        - { slide: framing, ref: engine }');
        expect(at(parse(written), ['deck', 'order'])).toEqual(moved);
    });
});

/** The text `setBlock` gives, failing the case when it answers null. */
function blockOf(source: string, path: string[], value: unknown): string {
    const written = setBlock(source, path, value);
    if (written === null) throw new Error(`setBlock refused ${path.join('.')}`);
    return written;
}

/** The value at a top-level key of a YAML text. */
function parsedKey(text: string, key: string): unknown {
    return (parse(text) as Record<string, unknown>)[key];
}

describe('the nested lists of a card', () => {
    it('changes only the line of one title in deck.framing', () => {
        const source = shipped('present.yml');
        const framing = at(parse(source), ['deck', 'framing']) as {
            engine: { cards: { title: string }[] };
        };
        const next = structuredClone(framing);
        next.engine.cards[0].title = 'Changed title.';
        const written = setBlock(source, ['deck', 'framing'], next);
        expect(written).toBe(
            source.replace("title: 'Interpretable by construction.',", "title: 'Changed title.',")
        );
    });
});

describe('flow collections written over several lines or with their own padding', () => {
    it('keeps the line breaks of file_index.ext when another item is edited', () => {
        const source = shipped('behavior.yml');
        const list = at(parse(source), ['file_index', 'ext']) as string[];
        const next = list.map((one) => (one === '.csv' ? '.tsv' : one));
        const written = setBlock(source, ['file_index', 'ext'], next);
        expect(written).toBe(source.replace('".csv"', '".tsv"'));
    });

    it('keeps the line breaks of an idea item that spans lines when another item is edited', () => {
        const source = shipped('present.yml');
        const items = at(parse(source), ['deck', 'ideas', 'items']) as Record<string, string>[];
        const next = structuredClone(items);
        next[0].maturity = 'nascent';
        const written = setBlock(source, ['deck', 'ideas', 'items'], next);
        expect(written).toBe(
            source.replace(
                'maturity: scoping\n              }',
                'maturity: nascent\n              }'
            )
        );
    });

    it('keeps the padding of the other nav_live entries when one scalar is edited', () => {
        const source = shipped('layout.yml');
        const live = at(parse(source), ['nav_live']) as Record<string, { label: string }>;
        const next = structuredClone(live);
        next.education.label = 'running';
        const written = setBlock(source, ['nav_live'], next);
        expect(written).toBe(source.replace('label: ongoing }', 'label: running }'));
    });

    it('keeps the other floats padding when the one float is edited', () => {
        const source = shipped('layout.yml');
        const floats = at(parse(source), ['floats']) as { size: number }[];
        const next = structuredClone(floats);
        next[0].size = 0.4;
        const written = setBlock(source, ['floats'], next);
        expect(written).toBe(source.replace('size: 0.3 }', 'size: 0.4 }'));
    });
});

describe('items added, removed and moved', () => {
    it('adds one item to a flow list, removes one and swaps two', () => {
        const source = shipped('behavior.yml');
        const written = setBlock(
            source,
            ['waiting_status'],
            ['pending', 'submitted', 'under-review', 'queued']
        );
        expect(written).toBe(
            source.replace(
                '[submitted, pending, under review, under-review]',
                '[pending, submitted, under-review, queued]'
            )
        );
    });

    it('writes an empty list given one item as a flow list of one, and a list emptied as []', () => {
        const source = shipped('behavior.yml');
        const filled = blockOf(source, ['audit_ignore'], ['0123456789ab']);
        expect(filled).toBe(source.replace('audit_ignore: []', 'audit_ignore: [0123456789ab]'));
        const emptied = blockOf(source, ['waiting_status'], []);
        expect(emptied).toBe(
            source.replace(
                'waiting_status: [submitted, pending, under review, under-review]',
                'waiting_status: []'
            )
        );
    });

    it('writes a new record in the style of the records it joins', () => {
        const source = shipped('layout.yml');
        const groups = at(parse(source), ['nav_groups']) as Record<string, unknown>;
        const next = { ...groups, extra: { label: 'Extra', glyph: 'page', chord: 'x' } };
        const written = blockOf(source, ['nav_groups'], next);
        expect(written).toContain('  extra: { label: Extra, glyph: page, chord: x }\n');
        expect(at(parse(written), ['nav_groups'])).toEqual(next);
    });

    it('writes a new row of a block-style list in the style of the rows around it', () => {
        const source = shipped('sources.yml');
        const roots = at(parse(source), ['roots']) as Record<string, string>[];
        const next = [...roots, { key: 'lab', dir: '/srv/lab' }];
        const written = blockOf(source, ['roots'], next);
        expect(written).toContain('  - { key: lab, dir: /srv/lab }\n');
        expect(at(parse(written), ['roots'])).toEqual(next);
    });
});

describe('strings and keys that YAML would read as something else', () => {
    const SOURCE = 'tiers:\n    one: a\n';

    it('reads back every string that needs quoting, set over a scalar of each style and added', () => {
        const strings = [
            '-x',
            '- x',
            'a: b',
            'a:b',
            '#x',
            'a #x',
            'yes',
            'no',
            'null',
            '~',
            '20',
            '012',
            '{a',
            '*a',
            '&a',
            '!a',
            ' a',
            ' lead',
            'x,y',
            "it's"
        ];
        const styles = [
            'list: [a]\n',
            'list: ["a"]\n',
            "list: ['a']\n",
            'list:\n  - a\n',
            'list:\n  - "a"\n'
        ];
        for (const source of styles) {
            for (const text of strings) {
                const changed = blockOf(source, ['list'], [text]);
                expect(parsedKey(changed, 'list')).toEqual([text]);
                const added = blockOf(source, ['list'], ['a', text]);
                expect(parsedKey(added, 'list')).toEqual(['a', text]);
            }
        }
    });

    it('writes a string holding a line break double-quoted, whatever place it stands in', () => {
        expect(blockOf('list: [a]\n', ['list'], ['a\nb'])).toBe('list: ["a\\nb"]\n');
        expect(blockOf('list: [a]\n', ['list'], ['a', 'a\nb'])).toBe('list: [a, "a\\nb"]\n');
        expect(blockOf('list:\n  - a\n', ['list'], ['a', 'a\nb'])).toBe(
            'list:\n  - a\n  - "a\\nb"\n'
        );
        expect(blockOf('m:\n  x: v\n', ['m'], { x: 'a\nb' })).toBe('m:\n  x: "a\\nb"\n');
        expect(blockOf("list: ['a']\n", ['list'], ['a\r\nb'])).toBe('list: ["a\\r\\nb"]\n');
        const source = 'w: [a, b]\nafter: 1\n';
        const written = blockOf(source, ['w'], ['a\nb', 'b']);
        expect(written).toBe('w: ["a\\nb", b]\nafter: 1\n');
        expect(parsedKey(written, 'w')).toEqual(['a\nb', 'b']);
    });

    it('writes a key of a flow map double-quoted when a flow map would read it as more than one', () => {
        for (const key of ['a,b', 'a[b', 'a]b', 'a{b', 'a}b', 'a: b']) {
            const written = blockOf('m: { a: 1 }\n', ['m'], { a: 1, [key]: 2 });
            expect(written).toBe(`m: { a: 1, ${JSON.stringify(key)}: 2 }\n`);
            expect(parsedKey(written, 'm')).toEqual({ a: 1, [key]: 2 });
        }
        const rebuilt = blockOf('m: { a: 1 }\n', ['m'], { 'x,y': 1 });
        expect(rebuilt).toBe('m: { "x,y": 1 }\n');
        expect(parsedKey(rebuilt, 'm')).toEqual({ 'x,y': 1 });
        const empty = blockOf('m: {}\n', ['m'], { 'x,y': 1 });
        expect(parsedKey(empty, 'm')).toEqual({ 'x,y': 1 });
    });

    it('writes a value of a flow map double-quoted when a flow map would read it as more than one', () => {
        for (const text of ['a,b', 'a]b', 'a}b', 'a: b', 'a\nb']) {
            const written = blockOf('m: { a: 1 }\n', ['m'], { a: text });
            expect(parsedKey(written, 'm')).toEqual({ a: text });
        }
    });

    it('keeps the quote style of the scalar it changes and writes an added string plain where it can', () => {
        expect(blockOf('list: ["a", \'b\']\n', ['list'], ['c', 'd'])).toBe('list: ["c", \'d\']\n');
        expect(blockOf('list: [a]\n', ['list'], ['a', 'two words'])).toBe('list: [a, two words]\n');
        expect(blockOf('m: {}\n', ['m'], { 'a b': 1 })).toBe('m:\n    a b: 1\n');
    });

    it('writes a key with a space, a colon, a dot, a digit or nothing quoted so it reads back', () => {
        const next = { 'a b': 1, 'c: d': 2, 'status.line': 3, '1': 4, '': 5, plain: 6 };
        const written = blockOf(SOURCE, ['tiers'], next);
        expect(parsedKey(written, 'tiers')).toEqual(next);
    });

    it('keeps the type of a number given as a number', () => {
        const written = blockOf('limits: { next: 300 }\n', ['limits'], { next: 20 });
        expect(written).toBe('limits: { next: 20 }\n');
        expect((parsedKey(written, 'limits') as { next: number }).next).toBe(20);
    });
});

describe('a value the block cannot be put into', () => {
    it('answers null for a path the text does not hold or holds as a scalar', () => {
        expect(setBlock('a: 1\n', ['b'], [])).toBeNull();
        expect(setBlock('a: 1\n', ['a'], [])).toBeNull();
        expect(setBlock('a: [1\n', ['a'], [])).toBeNull();
    });

    it('answers null for a block holding an alias, an anchor or a tag', () => {
        expect(setBlock('base: &x [a]\nlist: *x\n', ['list'], ['b'])).toBeNull();
        expect(setBlock('list: &x [a]\n', ['list'], ['b'])).toBeNull();
        expect(setBlock('list: !!seq [a]\n', ['list'], ['b'])).toBeNull();
    });
});

describe('a block list rebuilt from the lines of its items', () => {
    const SOURCE =
        'top: 1\n\n# Where\nscan:\n  # first one\n  - { dir: a, type: x }   # why a\n\n  # second\n  - { dir: b, type: y }\n  - { dir: c, type: z }\n# after\nnext: 2\n';
    const A = { dir: 'a', type: 'x' };
    const B = { dir: 'b', type: 'y' };
    const C = { dir: 'c', type: 'z' };

    it('takes an item out with the comment above it and the comment beside it, and no other line', () => {
        expect(setBlock(SOURCE, ['scan'], [B, C])).toBe(
            'top: 1\n\n# Where\nscan:\n\n  # second\n  - { dir: b, type: y }\n  - { dir: c, type: z }\n# after\nnext: 2\n'
        );
    });

    it('moves an item with the comment above it and the comment beside it', () => {
        expect(setBlock(SOURCE, ['scan'], [C, A, B])).toBe(
            'top: 1\n\n# Where\nscan:\n  - { dir: c, type: z }\n  # first one\n  - { dir: a, type: x }   # why a\n\n  # second\n  - { dir: b, type: y }\n# after\nnext: 2\n'
        );
    });

    it('writes a list emptied as [] on the key line and leaves the comment after the block', () => {
        expect(setBlock(SOURCE, ['scan'], [])).toBe(
            'top: 1\n\n# Where\nscan: []\n# after\nnext: 2\n'
        );
    });

    it('adds a block map item in the style of the block map items around it', () => {
        const source = 'cards:\n    - title: A\n      n: 1\n    - title: B\n      n: 2\n';
        const next = [
            { title: 'A', n: 1 },
            { title: 'B', n: 2 },
            { title: 'C', n: 3 }
        ];
        const written = blockOf(source, ['cards'], next);
        expect(written.startsWith(source)).toBe(true);
        expect(written.slice(source.length)).toMatch(/^ {4}- title: C\n {6}"?n"?: 3\n$/);
        expect(parsedKey(written, 'cards')).toEqual(next);
    });

    it('moves a block map item as the lines it is written in', () => {
        const source = 'cards:\n    - title: A\n      n: 1\n    - title: B\n      n: 2\n';
        const written = setBlock(
            source,
            ['cards'],
            [
                { title: 'B', n: 2 },
                { title: 'A', n: 1 }
            ]
        );
        expect(written).toBe('cards:\n    - title: B\n      n: 2\n    - title: A\n      n: 1\n');
    });

    it('moves the pairs of a block map with the lines they are written in', () => {
        const source = 'm:\n    a: 1\n    b: 2\n    c: 3\n';
        expect(setBlock(source, ['m'], { c: 3, b: 2, a: 1 })).toBe(
            'm:\n    c: 3\n    b: 2\n    a: 1\n'
        );
        expect(setBlock(source, ['m'], { a: 1, c: 3 })).toBe('m:\n    a: 1\n    c: 3\n');
        expect(setBlock(source, ['m'], {})).toBe('m: {}\n');
    });

    it('fills a collection written empty, inline for strings and in lines for records', () => {
        expect(setBlock('scan: []\nz: 1\n', ['scan'], [{ dir: 'a' }, { dir: 'b' }])).toBe(
            'scan:\n    - { dir: a }\n    - { dir: b }\nz: 1\n'
        );
        expect(setBlock('m: {}\nz: 1\n', ['m'], { a: 1, b: 'x y' })).toBe(
            'm:\n    a: 1\n    b: x y\nz: 1\n'
        );
        expect(setBlock('l: []\n', ['l'], ['a', 'b'])).toBe('l: [a, b]\n');
    });

    it('uses the line ending of the file for the lines it adds, and no other', () => {
        expect(setBlock('l:\r\n  - a\r\n  - b\r\n', ['l'], ['a', 'b', 'c'])).toBe(
            'l:\r\n  - a\r\n  - b\r\n  - c\r\n'
        );
        expect(setBlock('l:\r\n  - a\r\n  - b\r\n', ['l'], ['b', 'a'])).toBe(
            'l:\r\n  - b\r\n  - a\r\n'
        );
    });

    it('rebuilds a list nested under maps without touching the lines around it', () => {
        expect(
            setBlock(
                'root:\n  inner:\n    - a\n    - b\n  other: 1\n',
                ['root', 'inner'],
                ['b', 'a', 'c']
            )
        ).toBe('root:\n  inner:\n    - b\n    - a\n    - c\n  other: 1\n');
    });

    it('answers null when a flow list to rebuild holds a comment between its items', () => {
        const source = 'l: [a,  # note\n    b]\n';
        expect(setBlock(source, ['l'], ['b', 'a'])).toBeNull();
        expect(setBlock(source, ['l'], ['a', 'bb'])).toBe('l: [a,  # note\n    bb]\n');
    });
});
