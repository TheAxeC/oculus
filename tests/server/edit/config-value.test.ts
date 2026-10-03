// Layer 4, server test. The config-value writer: one list option or one family of a tracked config
// file set in place, the refusals that leave the file as it was, and the bytes it keeps.
//
// Every case runs over a scratch engine, a copy of the checkout's config/ folder with the machine's
// own file left out (tests/routes/edit/write-fixture.ts), so the writer reads the catalog, the text
// and the other files from the copy and writes the copy. What this does NOT cover: the route that
// carries the writer, History and Undo (tests/routes/edit/config-value.test.ts), the render itself
// (tests/server/edit/yaml/block-edit.test.ts) and the editors that send the write.

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, vi } from 'vitest';
import { parse } from 'yaml';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { writeConfigValue } from '../../../src/lib/server/edit/writes/config/config-value.ts';
import { it } from '../../fixtures/scratch.ts';
import { engineFile, refusalOf, scratchEngine } from '../../routes/edit/write-fixture.ts';

/** Every path the writer's module graph read through `readFileSync`, newest last. */
const reads = vi.hoisted(() => ({ paths: [] as string[] }));

// The node:fs module as it is, with the paths read through readFileSync recorded, so a case can
// say which files a refusal did and did not open.
vi.mock('node:fs', async (original) => {
    const actual = await original<typeof import('node:fs')>();
    return {
        ...actual,
        readFileSync: ((path: unknown, ...rest: unknown[]) => {
            reads.paths.push(String(path));
            return (actual.readFileSync as (...args: unknown[]) => unknown)(path, ...rest);
        }) as typeof actual.readFileSync
    };
});

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** One of the writer's own reason sentences, out of config/text/server.yml. */
function why(key: string, ...args: string[]): string {
    return words(CATALOG, `server.config_value.${key}`, ...args);
}

/** One file of a scratch engine, as it is now. */
function held(engine: string, file: string): string {
    return readFileSync(engineFile(engine, file), 'utf8');
}

/** The value a scratch engine's file holds at a dotted key path. */
function valueOf(engine: string, file: string, key: string): unknown {
    let node: unknown = parse(held(engine, file));
    for (const segment of key.split('.')) node = (node as Record<string, unknown>)[segment];
    return node;
}

/** A write with the value the file holds now as its base. */
function write(engine: string, file: string, key: string, value: unknown) {
    return writeConfigValue(engine, file, key, value, valueOf(engine, file, key));
}

const WAITING = 'behavior.yml:waiting_status';

describe('a list written in place', () => {
    it('adds one item, removes one and swaps two, and keeps every other line', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const next = ['pending', 'submitted', 'under-review', 'queued'];
        const outcome = write(engine, 'behavior.yml', 'waiting_status', next);
        expect(outcome.refused).toEqual([]);
        expect(outcome.changed).toEqual([WAITING]);
        expect(held(engine, 'behavior.yml')).toBe(
            before.replace(
                '[submitted, pending, under review, under-review]',
                '[pending, submitted, under-review, queued]'
            )
        );
        expect(valueOf(engine, 'behavior.yml', 'waiting_status')).toEqual(next);
        expect(outcome.records).toHaveLength(1);
        expect(outcome.records?.[0]).toMatchObject({
            key: 'behavior.yml',
            field: 'waiting_status',
            before: ['submitted', 'pending', 'under review', 'under-review'],
            after: next,
            undo: 'field'
        });
    });

    it('is taken back by writing the earlier list with the later one as its base', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const original = valueOf(engine, 'behavior.yml', 'waiting_status');
        const next = ['pending', 'submitted', 'under-review', 'queued'];
        write(engine, 'behavior.yml', 'waiting_status', next);
        const back = writeConfigValue(engine, 'behavior.yml', 'waiting_status', original, next);
        expect(back.refused).toEqual([]);
        expect(held(engine, 'behavior.yml')).toBe(before);
    });

    it('writes an empty list given one item as a list of one, and a list emptied as []', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        write(engine, 'behavior.yml', 'audit_ignore', ['0123456789ab']);
        expect(held(engine, 'behavior.yml')).toBe(
            before.replace('audit_ignore: []', 'audit_ignore: [0123456789ab]')
        );
        write(engine, 'behavior.yml', 'audit_ignore', []);
        expect(held(engine, 'behavior.yml')).toBe(before);
        write(engine, 'behavior.yml', 'waiting_status', []);
        expect(held(engine, 'behavior.yml')).toBe(
            before.replace(
                'waiting_status: [submitted, pending, under review, under-review]',
                'waiting_status: []'
            )
        );
    });

    it('writes nothing and records nothing for the value the file already holds', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const outcome = write(
            engine,
            'behavior.yml',
            'waiting_status',
            valueOf(engine, 'behavior.yml', 'waiting_status')
        );
        expect(outcome).toEqual({ changed: [], refused: [] });
        expect(held(engine, 'behavior.yml')).toBe(before);
    });
});

describe('a family written in place', () => {
    it('writes a family whose keys only changed order, and reads the new order back', () => {
        const engine = scratchEngine();
        const groups = valueOf(engine, 'layout.yml', 'nav_groups') as Record<string, unknown>;
        const reversed = Object.fromEntries(Object.entries(groups).reverse());
        const outcome = write(engine, 'layout.yml', 'nav_groups', reversed);
        expect(outcome.refused).toEqual([]);
        expect(outcome.changed).toEqual(['layout.yml:nav_groups']);
        const after = valueOf(engine, 'layout.yml', 'nav_groups') as Record<string, unknown>;
        expect(Object.keys(after)).toEqual(Object.keys(reversed));
    });

    it('changes the chord of one record and adds a record, keeping the others as written', () => {
        const engine = scratchEngine();
        const before = held(engine, 'layout.yml');
        const groups = valueOf(engine, 'layout.yml', 'nav_groups') as Record<
            string,
            Record<string, unknown>
        >;
        const next = {
            ...groups,
            help: { ...groups.help, chord: 'q' },
            extra: { label: 'Extra', glyph: 'page', chord: 'x' }
        };
        const outcome = write(engine, 'layout.yml', 'nav_groups', next);
        expect(outcome.refused).toEqual([]);
        const added = '  extra: { label: Extra, glyph: page, chord: x }\n';
        const chord = before.replace(
            'help: { label: "Help", glyph: page, chord: h }',
            'help: { label: "Help", glyph: page, chord: q }'
        );
        const last = '  views: { label: "System", glyph: settings, chord: y }\n';
        expect(held(engine, 'layout.yml')).toBe(chord.replace(last, last + added));
    });

    it('gives a language one more ending and leaves the other languages padded as they were', () => {
        const engine = scratchEngine();
        const before = held(engine, 'sources.yml');
        const languages = valueOf(engine, 'sources.yml', 'languages') as Record<string, string[]>;
        const next = { ...languages, bash: [...languages.bash, '.zzz'] };
        const outcome = write(engine, 'sources.yml', 'languages', next);
        expect(outcome.refused).toEqual([]);
        expect(held(engine, 'sources.yml')).toBe(
            before.replace('[.sh, .bash, .zsh, .slurm]', '[.sh, .bash, .zsh, .slurm, .zzz]')
        );
    });

    it('writes a number as a number', () => {
        const engine = scratchEngine();
        const limits = valueOf(engine, 'behavior.yml', 'read_limits') as Record<string, number>;
        const outcome = write(engine, 'behavior.yml', 'read_limits', { ...limits, next: 301 });
        expect(outcome.refused).toEqual([]);
        expect(valueOf(engine, 'behavior.yml', 'read_limits')).toEqual({ ...limits, next: 301 });
        expect(held(engine, 'behavior.yml')).toContain('next: 301,');
    });

    it('writes a family emptied as {} and a list family emptied as []', () => {
        const engine = scratchEngine();
        const outcome = write(engine, 'layout.yml', 'tab_split', {});
        expect(outcome.refused).toEqual([]);
        expect(held(engine, 'layout.yml')).toContain('tab_split: {}');
        write(engine, 'sources.yml', 'roots', []);
        expect(valueOf(engine, 'sources.yml', 'roots')).toEqual([]);
    });

    it('takes the map of lists of tab_rollup, and refuses a list of text in a list of records', () => {
        const engine = scratchEngine();
        const rollup = valueOf(engine, 'layout.yml', 'tab_rollup') as Record<
            string,
            { label: string }[]
        >;
        const next = structuredClone(rollup);
        next.projects[0].label = 'under way';
        expect(write(engine, 'layout.yml', 'tab_rollup', next).refused).toEqual([]);
        expect(valueOf(engine, 'layout.yml', 'tab_rollup')).toEqual(next);
        const bad = { ...next, projects: ['in progress'] };
        const outcome = write(engine, 'layout.yml', 'tab_rollup', bad);
        expect(outcome.changed).toEqual([]);
        expect(outcome.refused).toHaveLength(1);
    });
});

describe('strings and keys that YAML would read as something else', () => {
    it('writes strings with reserved characters or another type so they read back as the same strings', () => {
        const engine = scratchEngine();
        const strings = ['a: b', '#x', 'yes', '20', 'null', '~', '- x', '[a', '*a', 'plain'];
        const outcome = write(engine, 'behavior.yml', 'waiting_status', strings);
        expect(outcome.refused).toEqual([]);
        expect(valueOf(engine, 'behavior.yml', 'waiting_status')).toEqual(strings);
    });

    it('writes keys with a dot, a digit, a space or nothing so they read back as the same keys', () => {
        const engine = scratchEngine();
        const next = { 'status.line': 220, '1': 5, '': 6, 'two words': 7, 'a: b': 8, next: 300 };
        const outcome = write(engine, 'behavior.yml', 'read_limits', next);
        expect(outcome.refused).toEqual([]);
        expect(valueOf(engine, 'behavior.yml', 'read_limits')).toEqual(next);
    });

    it('writes an item holding a line break, added and changed, double-quoted so it reads back', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const original = valueOf(engine, 'behavior.yml', 'waiting_status') as string[];
        const added = [...original, 'a\nb'];
        expect(write(engine, 'behavior.yml', 'waiting_status', added).refused).toEqual([]);
        expect(held(engine, 'behavior.yml')).toBe(
            before.replace(
                '[submitted, pending, under review, under-review]',
                '[submitted, pending, under review, under-review, "a\\nb"]'
            )
        );
        expect(valueOf(engine, 'behavior.yml', 'waiting_status')).toEqual(added);
        const changed = ['a\nb', ...original.slice(1)];
        expect(write(engine, 'behavior.yml', 'waiting_status', changed).refused).toEqual([]);
        expect(held(engine, 'behavior.yml')).toBe(
            before.replace(
                '[submitted, pending, under review, under-review]',
                '["a\\nb", pending, under review, under-review]'
            )
        );
        expect(valueOf(engine, 'behavior.yml', 'waiting_status')).toEqual(changed);
    });

    it('writes a key of a flow map holding a comma double-quoted so it reads back', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const limits = valueOf(engine, 'behavior.yml', 'read_limits') as Record<string, number>;
        const next = { ...limits, 'a,b': 7 };
        expect(write(engine, 'behavior.yml', 'read_limits', next).refused).toEqual([]);
        expect(held(engine, 'behavior.yml')).toBe(
            before.replace('results: 300 }', 'results: 300, "a,b": 7 }')
        );
        expect(valueOf(engine, 'behavior.yml', 'read_limits')).toEqual(next);
    });

    it('refuses a reserved name as a key anywhere inside the value', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const limits = valueOf(engine, 'behavior.yml', 'read_limits') as Record<string, unknown>;
        for (const name of ['__proto__', 'constructor', 'prototype']) {
            const poisoned = JSON.parse(`{"${name}": 1}`) as Record<string, unknown>;
            const top = write(engine, 'behavior.yml', 'read_limits', { ...limits, ...poisoned });
            expect(refusalOf(top, 'behavior.yml:read_limits')).toBe(why('reserved', name));
            const nested = write(engine, 'sources.yml', 'languages', {
                bash: [],
                nested: JSON.parse(`{"deep": {"${name}": 1}}`) as Record<string, unknown>
            });
            expect(nested.changed).toEqual([]);
            expect(nested.refused).toHaveLength(1);
        }
        expect(held(engine, 'behavior.yml')).toBe(before);
    });
});

describe('a write refused with nothing written', () => {
    it('refuses local.yml before any file is read', () => {
        const engine = scratchEngine();
        reads.paths.length = 0;
        const outcome = writeConfigValue(engine, 'local.yml', 'hub', ['x'], []);
        expect(refusalOf(outcome, 'local.yml:hub')).toBe(why('local'));
        expect(reads.paths.filter((path) => path.endsWith('local.yml'))).toEqual([]);
    });

    it('refuses the rail, the arrangements, a single value and a key the catalog lacks', () => {
        const engine = scratchEngine();
        const before = held(engine, 'layout.yml');
        const rail = writeConfigValue(engine, 'layout.yml', 'rail', [], []);
        expect(refusalOf(rail, 'layout.yml:rail')).toBe(why('own_write'));
        const arrangements = writeConfigValue(engine, 'layout.yml', 'arrangements', {}, {});
        expect(refusalOf(arrangements, 'layout.yml:arrangements')).toBe(why('own_write'));
        const single = writeConfigValue(engine, 'behavior.yml', 'changes.keep', [1], 500);
        expect(refusalOf(single, 'behavior.yml:changes.keep')).toBe(why('single'));
        const missing = writeConfigValue(engine, 'behavior.yml', 'no.such.key', [], []);
        expect(refusalOf(missing, 'behavior.yml:no.such.key')).toBe(why('no_entry'));
        const other = writeConfigValue(engine, 'missing.yml', 'waiting_status', [], []);
        expect(refusalOf(other, 'missing.yml:waiting_status')).toBe(why('no_entry'));
        expect(held(engine, 'layout.yml')).toBe(before);
    });

    it('refuses a key segment named like an object member as a key the catalog lacks', () => {
        const engine = scratchEngine();
        for (const key of ['__proto__', 'constructor', 'toString', 'waiting_status.__proto__']) {
            const outcome = writeConfigValue(engine, 'behavior.yml', key, [], []);
            expect(refusalOf(outcome, `behavior.yml:${key}`)).toBe(why('no_entry'));
        }
        const proto = writeConfigValue(engine, '__proto__', 'waiting_status', [], []);
        expect(refusalOf(proto, '__proto__:waiting_status')).toBe(why('no_entry'));
    });

    it('refuses a base the file no longer holds, with the sentence that it changed since it was read', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const stale = ['submitted', 'pending'];
        const outcome = writeConfigValue(engine, 'behavior.yml', 'waiting_status', ['x'], stale);
        expect(refusalOf(outcome, WAITING)).toBe(why('changed'));
        expect(held(engine, 'behavior.yml')).toBe(before);
    });

    it('refuses a list sent as a map, a map sent as a list, and a list option holding a number', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const asMap = write(engine, 'behavior.yml', 'waiting_status', { a: 'b' });
        expect(refusalOf(asMap, WAITING)).toBe(why('not_strings'));
        const number = write(engine, 'behavior.yml', 'waiting_status', ['a', 1]);
        expect(refusalOf(number, WAITING)).toBe(why('not_strings'));
        const asList = write(engine, 'behavior.yml', 'read_limits', ['a']);
        expect(refusalOf(asList, 'behavior.yml:read_limits')).toBe(why('wrong_map'));
        expect(held(engine, 'behavior.yml')).toBe(before);
    });

    it('refuses a record with a field the catalog does not name, and one that is not a map', () => {
        const engine = scratchEngine();
        const groups = valueOf(engine, 'layout.yml', 'nav_groups') as Record<
            string,
            Record<string, unknown>
        >;
        const extra = write(engine, 'layout.yml', 'nav_groups', {
            ...groups,
            help: { ...groups.help, colour: 'red' }
        });
        expect(refusalOf(extra, 'layout.yml:nav_groups')).toBe(why('bad_field', 'help', 'colour'));
        const flat = write(engine, 'layout.yml', 'nav_groups', { ...groups, help: 'Help' });
        expect(refusalOf(flat, 'layout.yml:nav_groups')).toBe(why('bad_record', 'help'));
    });

    it('refuses a key holding a list in a family of records, naming the key, and writes nothing', () => {
        const engine = scratchEngine();
        const before = held(engine, 'layout.yml');
        const groups = valueOf(engine, 'layout.yml', 'nav_groups') as Record<
            string,
            Record<string, unknown>
        >;
        const listed = write(engine, 'layout.yml', 'nav_groups', {
            ...groups,
            help: [{ label: 'Help', glyph: 'page', chord: 'h' }]
        });
        expect(refusalOf(listed, 'layout.yml:nav_groups')).toBe(why('wants_record', 'help'));
        expect(held(engine, 'layout.yml')).toBe(before);
    });

    it('refuses a key holding one record in a family that holds lists, naming the key', () => {
        const engine = scratchEngine();
        const before = held(engine, 'layout.yml');
        const rollup = valueOf(engine, 'layout.yml', 'tab_rollup') as Record<string, unknown[]>;
        const single = write(engine, 'layout.yml', 'tab_rollup', {
            ...rollup,
            projects: { label: 'x', keys: ['active'], color: '#16a34a' }
        });
        expect(refusalOf(single, 'layout.yml:tab_rollup')).toBe(why('wants_list', 'projects'));
        expect(held(engine, 'layout.yml')).toBe(before);
        const emptied = write(engine, 'layout.yml', 'tab_rollup', {});
        expect(emptied.refused).toEqual([]);
        const refilled = writeConfigValue(
            engine,
            'layout.yml',
            'tab_rollup',
            { projects: { label: 'x', keys: ['a'], color: 'red' } },
            {}
        );
        expect(refusalOf(refilled, 'layout.yml:tab_rollup')).toBe(why('wants_list', 'projects'));
        expect(valueOf(engine, 'layout.yml', 'tab_rollup')).toEqual({});
    });

    it('refuses a record where a key/value family takes a single value, and keeps lists of endings', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const limits = valueOf(engine, 'behavior.yml', 'read_limits') as Record<string, number>;
        const record = write(engine, 'behavior.yml', 'read_limits', {
            ...limits,
            next: { a: 1 }
        });
        expect(refusalOf(record, 'behavior.yml:read_limits')).toBe(why('wants_value', 'next'));
        expect(held(engine, 'behavior.yml')).toBe(before);
        const languages = valueOf(engine, 'sources.yml', 'languages') as Record<string, string[]>;
        const kept = write(engine, 'sources.yml', 'languages', {
            ...languages,
            bash: [...languages.bash, '.zzz']
        });
        expect(kept.refused).toEqual([]);
    });

    it('refuses a list in a key/value family whose entries are single values, naming the key', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const limits = valueOf(engine, 'behavior.yml', 'read_limits') as Record<string, number>;
        const listed = write(engine, 'behavior.yml', 'read_limits', { ...limits, next: [1, 2] });
        expect(refusalOf(listed, 'behavior.yml:read_limits')).toBe(why('wants_value', 'next'));
        expect(held(engine, 'behavior.yml')).toBe(before);
        const present = held(engine, 'present.yml');
        const tones = valueOf(engine, 'present.yml', 'deck.tag_tones') as Record<string, string>;
        const toned = write(engine, 'present.yml', 'deck.tag_tones', { ...tones, x: ['a'] });
        expect(refusalOf(toned, 'present.yml:deck.tag_tones')).toBe(why('wants_value', 'x'));
        expect(held(engine, 'present.yml')).toBe(present);
    });

    // Revert: decide a table's list values from the file's entries in misfit of config-value.ts.
    it('refuses a list in an emptied key/value family whose catalog entry holds single values', () => {
        const engine = scratchEngine();
        const emptied: [string, string, string][] = [
            ['behavior.yml', 'read_limits', 'next'],
            ['present.yml', 'deck.tag_tones', 'x'],
            ['layout.yml', 'tab_split', 'active']
        ];
        for (const [file, key, name] of emptied) {
            expect(write(engine, file, key, {}).refused).toEqual([]);
            const before = held(engine, file);
            const listed = write(engine, file, key, { [name]: ['a', 'b'] });
            expect(refusalOf(listed, `${file}:${key}`)).toBe(why('wants_value', name));
            expect(held(engine, file)).toBe(before);
        }
    });

    it('takes a list of endings in languages, and again after the family was emptied', () => {
        const engine = scratchEngine();
        const languages = valueOf(engine, 'sources.yml', 'languages') as Record<string, string[]>;
        const longer = { ...languages, bash: [...languages.bash, '.zzz'] };
        expect(write(engine, 'sources.yml', 'languages', longer).refused).toEqual([]);
        expect(valueOf(engine, 'sources.yml', 'languages')).toEqual(longer);
        const record = write(engine, 'sources.yml', 'languages', {
            ...longer,
            bash: { a: 1 }
        });
        expect(refusalOf(record, 'sources.yml:languages')).toBe(why('wants_scalar', 'bash'));
        expect(write(engine, 'sources.yml', 'languages', {}).refused).toEqual([]);
        const back = write(engine, 'sources.yml', 'languages', languages);
        expect(back.refused).toEqual([]);
        expect(valueOf(engine, 'sources.yml', 'languages')).toEqual(languages);
    });

    it('accepts a record field the catalog does not name when the file already holds it there', () => {
        const engine = scratchEngine();
        const path = engineFile(engine, 'sources.yml');
        writeFileSync(
            path,
            held(engine, 'sources.yml').replace(
                '{ key: cathedra,    dir: ~/workspace/cathedra }',
                '{ key: cathedra,    dir: ~/workspace/cathedra, note: kept }'
            )
        );
        const roots = valueOf(engine, 'sources.yml', 'roots') as Record<string, string>[];
        const kept = structuredClone(roots);
        kept[1].dir = '~/workspace/engine-two';
        expect(write(engine, 'sources.yml', 'roots', kept).refused).toEqual([]);
        expect(valueOf(engine, 'sources.yml', 'roots')).toEqual(kept);
        const unheld = structuredClone(kept);
        unheld[1].other = 'new';
        const outcome = write(engine, 'sources.yml', 'roots', unheld);
        expect(refusalOf(outcome, 'sources.yml:roots')).toBe(why('bad_field', '2', 'other'));
    });

    it('refuses a key the file holds as an alias, a tagged value, a scalar, or not at all', () => {
        const engine = scratchEngine();
        const path = engineFile(engine, 'behavior.yml');
        const original = held(engine, 'behavior.yml');
        const line = 'waiting_status: [submitted, pending, under review, under-review]';
        const domains = 'data_domains: [heart, liver, liverfl, liversurv, immune, brain, brainbci]';
        const cases: [string, string][][] = [
            [
                [domains, 'data_domains: &d [heart]'],
                [line, 'waiting_status: *d']
            ],
            [[line, 'waiting_status: !!seq [a]']],
            [[line, 'waiting_status: text']],
            [[line, 'waiting_status:']],
            [[line, 'other: 1']]
        ];
        for (const replacements of cases) {
            const text = replacements.reduce(
                (made, [from, to]) => made.replace(from, to),
                original
            );
            writeFileSync(path, text);
            const outcome = writeConfigValue(engine, 'behavior.yml', 'waiting_status', ['x'], []);
            expect(refusalOf(outcome, WAITING)).toBe(why('not_in_file'));
            expect(held(engine, 'behavior.yml')).toBe(text);
        }
    });

    it('refuses a file that does not parse', () => {
        const engine = scratchEngine();
        const path = engineFile(engine, 'behavior.yml');
        const broken = `${held(engine, 'behavior.yml')}\nbroken: [unclosed\n`;
        writeFileSync(path, broken);
        const outcome = writeConfigValue(engine, 'behavior.yml', 'waiting_status', ['x'], []);
        expect(refusalOf(outcome, WAITING)).toBe(why('not_parsed'));
        expect(held(engine, 'behavior.yml')).toBe(broken);
    });

    it("refuses a value a reader of the merged configuration would refuse, with the reader's words", () => {
        const engine = scratchEngine();
        const before = held(engine, 'layout.yml');
        const groups = valueOf(engine, 'layout.yml', 'nav_groups') as Record<string, unknown>;
        const { help: _dropped, ...without } = groups;
        const outcome = write(engine, 'layout.yml', 'nav_groups', without);
        expect(refusalOf(outcome, 'layout.yml:nav_groups')).toBe(
            'nav_groups names no group help; this document trails the groups'
        );
        expect(held(engine, 'layout.yml')).toBe(before);
    });

    it("refuses a theme naming a glyph glyphs.yml does not hold, with the finding's words", () => {
        const engine = scratchEngine();
        const before = held(engine, 'appearance.yml');
        const themes = valueOf(engine, 'appearance.yml', 'themes') as Record<string, string>[];
        const next = themes.map((theme) =>
            theme.name === 'light' ? { ...theme, glyph: 'no_such_glyph' } : theme
        );
        const outcome = write(engine, 'appearance.yml', 'themes', next);
        expect(refusalOf(outcome, 'appearance.yml:themes')).toBe(
            'the theme light names a glyph glyphs.yml does not hold; it is offered with its words alone'
        );
        expect(held(engine, 'appearance.yml')).toBe(before);
    });

    it("refuses a tier name that is a number, with the usage tiers reader's sentence, and leaves usage_tiers as it was", () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const tiers = valueOf(engine, 'behavior.yml', 'usage_tiers') as Record<string, unknown>;
        const outcome = write(engine, 'behavior.yml', 'usage_tiers', { ...tiers, prolite: 20 });
        expect(refusalOf(outcome, 'behavior.yml:usage_tiers')).toBe(
            'config/behavior.yml: usage_tiers.prolite must be a string'
        );
        expect(held(engine, 'behavior.yml')).toBe(before);
        expect(valueOf(engine, 'behavior.yml', 'usage_tiers')).toEqual(tiers);
    });

    it('refuses an open.program_ext key without a dot, which the opener refuses to read', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const ext = valueOf(engine, 'behavior.yml', 'open.program_ext') as Record<string, string>;
        const outcome = write(engine, 'behavior.yml', 'open.program_ext', { ...ext, docx: 'x' });
        expect(refusalOf(outcome, 'behavior.yml:open.program_ext')).toContain('open.program_ext');
        expect(held(engine, 'behavior.yml')).toBe(before);
    });
});

describe('two writes of one file', () => {
    it('lets a second write of the same key with the same base through only once', () => {
        const engine = scratchEngine();
        const base = valueOf(engine, 'behavior.yml', 'waiting_status');
        const first = writeConfigValue(engine, 'behavior.yml', 'waiting_status', ['a'], base);
        expect(first.refused).toEqual([]);
        const second = writeConfigValue(engine, 'behavior.yml', 'waiting_status', ['b'], base);
        expect(refusalOf(second, WAITING)).toBe(why('changed'));
        expect(valueOf(engine, 'behavior.yml', 'waiting_status')).toEqual(['a']);
    });

    it('lands two different keys of one file, each over the file the other left', () => {
        const engine = scratchEngine();
        const domains = valueOf(engine, 'behavior.yml', 'data_domains');
        const waiting = valueOf(engine, 'behavior.yml', 'waiting_status');
        writeConfigValue(engine, 'behavior.yml', 'data_domains', ['one'], domains);
        writeConfigValue(engine, 'behavior.yml', 'waiting_status', ['two'], waiting);
        expect(valueOf(engine, 'behavior.yml', 'data_domains')).toEqual(['one']);
        expect(valueOf(engine, 'behavior.yml', 'waiting_status')).toEqual(['two']);
    });
});

describe('a file written with CRLF line endings', () => {
    it('gives the lines it adds the same line ending', () => {
        const engine = scratchEngine();
        const path = engineFile(engine, 'sources.yml');
        writeFileSync(path, held(engine, 'sources.yml').replaceAll('\n', '\r\n'));
        const roots = valueOf(engine, 'sources.yml', 'roots') as Record<string, string>[];
        const next = [...roots, { key: 'lab', dir: '/srv/lab' }];
        expect(write(engine, 'sources.yml', 'roots', next).refused).toEqual([]);
        const text = held(engine, 'sources.yml');
        expect(text).toContain('{ key: lab, dir: /srv/lab }');
        expect(/(?<!\r)\n/.test(text)).toBe(false);
        expect(valueOf(engine, 'sources.yml', 'roots')).toEqual(next);
    });
});
