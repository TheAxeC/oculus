// Layer 1, data tests. The options reader, over entries of every wrong type and over the `groups:`
// of an options file, and the findings over what it cannot read: an entry, a group with no help
// line or an empty one, a line for no group, and a `groups:` that is no map, each one finding that
// names the options file and the key, from the whole-file shape or the reader and never both, the
// rest of the file read. Compared whole.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
    catalogOf,
    readCatalog
} from '../../../../../src/lib/data/sources/config/catalog/options.ts';
import { optionFindings } from '../../../../../src/lib/data/sources/config/catalog/option-findings.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';

describe('catalogOf', () => {
    it.each([[{ options: 'x' }]])('answers an empty catalog for %j', (config) => {
        expect(catalogOf(config)).toStrictEqual({});
    });
});

describe('optionFindings', () => {
    const WORDS = loadConfig(engineDir()).config.text;
    const ENGINE = '/engine';
    const FILE = join(ENGINE, 'config', 'options', 'behavior.yml');

    /** The entry every row starts from, a text option under a heading the vocabulary holds. */
    const SOUND = {
        help: 'A sound entry.',
        heading: 'editor',
        control: 'text',
        default: ''
    };

    /** A config whose options hold one entry of behavior.yml under the key `probe`. */
    function holding(entry: Record<string, unknown>): Record<string, unknown> {
        return { text: WORDS, options: { 'behavior.yml': { probe: entry } } };
    }

    const { heading: _heading, ...HEADLESS } = SOUND;

    // Each row fails when optionFindings leaves its entry out, or when catalogOf passes an unknown
    // control, source, missing heading or inverted range through unchanged.
    it('names the key of each entry it cannot read and reads its control as text', () => {
        const rows: [Record<string, unknown>, string, string, string][] = [
            [{ ...SOUND, control: 'colours' }, 'probe', 'text', 'editor'],
            [{ ...SOUND, control: 'choice', from: 'planets' }, 'probe', 'text', 'editor'],
            [{ ...SOUND, control: 'choice' }, 'probe', 'text', 'editor'],
            [
                {
                    help: 'A family.',
                    heading: 'editor',
                    fields: { name: { control: 'text' } }
                },
                'probe.name',
                'text',
                'editor'
            ],
            [HEADLESS, 'probe', 'text', 'unheaded'],
            [{ ...SOUND, heading: 'kitchen' }, 'probe', 'text', 'unheaded'],
            [{ ...SOUND, control: 'number', default: 3, min: 5, max: 1 }, 'probe', 'text', 'editor']
        ];
        for (const [entry, key, control, heading] of rows) {
            const config = holding(entry);
            const found = optionFindings(ENGINE, config);
            expect(found.map((one) => [one.file, one.key])).toEqual([[FILE, key]]);
            const read = catalogOf(config)['behavior.yml'].probe;
            const field = read.fields?.name;
            expect((field ?? read).control).toBe(control);
            expect(read.heading).toBe(heading);
        }
    });

    // Fails when catalogOf keeps `holds: lists` on a family of record fields, a shape no editor
    // draws and no write fits, or drops it from a key/value family.
    it('refuses holds: lists on a family of record fields and keeps it on a key/value family', () => {
        const family = { help: 'A family.', heading: 'editor', holds: 'lists' };
        const records = holding({ ...family, fields: { name: 'a name', size: 'a size' } });
        expect(optionFindings(ENGINE, records).map((one) => [one.key, one.message])).toEqual([
            [
                'probe',
                'holds: lists is taken only by a family whose fields are key and value; the entry is read without it'
            ]
        ]);
        expect(catalogOf(records)['behavior.yml'].probe.holds).toBeUndefined();
        const table = holding({ ...family, fields: { key: 'a key', value: 'a value' } });
        expect(optionFindings(ENGINE, table)).toEqual([]);
        expect(catalogOf(table)['behavior.yml'].probe.holds).toBe('lists');
    });
});

/** The findings of loadConfig and of the options reader that name one options file. */
function findingsOf(name: string, text: string) {
    const read = loadConfig(engineDir(), { instead: { name, text, layer: 'engine' } });
    const all = [...read.findings, ...optionFindings(engineDir(), read.config)];
    return {
        config: read.config,
        said: all
            .filter((one) => one.file.endsWith(`/config/${name}`))
            .map((one) => `${one.key}: ${one.message}`)
    };
}

describe('the options file shape in loadConfig', () => {
    it('names a key an entry does not take, and leaves a control to optionFindings', () => {
        const name = 'options/behavior.yml';
        const entry = (lines: string) => `options:\n    probe:\n${lines}groups: {}\n`;
        const sound = '        help: A sound entry.\n        control: text\n';
        const read = loadConfig(engineDir(), {
            instead: { name, text: entry(`${sound}        bogus: 1\n`), layer: 'engine' }
        });
        const found = read.findings.filter((one) => one.file.endsWith(name));
        expect(
            found.map((one) => [one.file.endsWith('/config/options/behavior.yml'), one.key])
        ).toEqual([[true, 'options.probe.bogus']]);
        expect(found[0].message).toBe('key options.probe.bogus is not a key this file takes');
        const colours = loadConfig(engineDir(), {
            instead: {
                name,
                text: entry('        help: A sound entry.\n        control: colours\n'),
                layer: 'engine'
            }
        });
        expect(colours.findings.filter((one) => one.file.endsWith(name))).toEqual([]);
    });
});

describe('the groups of an options file', () => {
    const ENGINE = engineDir();

    /** An options file's text as shipped, its part before `groups:`, and its group lines. */
    function shipped(name: string) {
        const text = readFileSync(join(ENGINE, 'config', name), 'utf8');
        const [head] = text.split(/^groups:/m);
        const groups = (parse(text) as { groups: Record<string, unknown> }).groups;
        return { text, head, groups };
    }

    /** The file's text with `groups:` replaced, or left out when `groups` is undefined. */
    function withGroups(name: string, groups: unknown): string {
        const { head } = shipped(name);
        return groups === undefined ? head : `${head}${stringify({ groups })}`;
    }

    const NO_HELP =
        'the group {0} has no help line in groups:; the editor shows no description for it';
    const UNKNOWN =
        "{0} is no group of this file's options, since no option lies under it or it is an option itself; the line is not read";
    const missing = (group: string) => `groups.${group}: ${NO_HELP.replace('{0}', group)}`;
    const unknown = (group: string) => `groups.${group}: ${UNKNOWN.replace('{0}', group)}`;

    it('reads every shipped options file with no finding and every group described', () => {
        const { config, findings } = loadConfig(ENGINE);
        expect(findings).toEqual([]);
        expect(optionFindings(ENGINE, config)).toEqual([]);
        const { groups } = readCatalog(config);
        expect(groups['appearance.yml']).toHaveProperty('wallpaper');
        expect(groups['behavior.yml']).toHaveProperty(['focus.refresh_stale_days']);
    });

    it.each([
        [
            'a group with no line',
            'options/appearance.yml',
            (lines: Record<string, unknown>) => {
                const { wallpaper: _gone, ...rest } = lines;
                return rest;
            },
            [missing('wallpaper')],
            ['appearance.yml', 'wallpaper']
        ],
        [
            'a line under which no option lies',
            'options/behavior.yml',
            (lines: Record<string, unknown>) => ({ ...lines, nothing_here: 'A line.' }),
            [unknown('nothing_here')],
            null
        ],
        [
            'a line for a path that is an option',
            'options/behavior.yml',
            (lines: Record<string, unknown>) => ({ ...lines, 'slurm.poll_min': 'A line.' }),
            [unknown('slurm.poll_min')],
            null
        ],
        [
            'an empty line',
            'options/behavior.yml',
            (lines: Record<string, unknown>) => ({ ...lines, slurm: '' }),
            [missing('slurm')],
            ['behavior.yml', 'slurm']
        ],
        [
            'a line that is a number',
            'options/behavior.yml',
            (lines: Record<string, unknown>) => ({ ...lines, slurm: 3 }),
            [missing('slurm')],
            ['behavior.yml', 'slurm']
        ],
        [
            'a line for a group named like a word of an entry',
            'options/behavior.yml',
            (lines: Record<string, unknown>) => ({ ...lines, help: 3 }),
            [unknown('help')],
            null
        ]
    ])(
        'words %s once, naming the file and the group, and reads the rest',
        (_name, name, edit, said, gone) => {
            const before = shipped(name);
            const found = findingsOf(name, withGroups(name, edit(before.groups)));
            expect(found.said).toEqual(said);
            const { catalog, groups } = readCatalog(found.config);
            const file = name.replace('options/', '');
            expect(Object.keys(catalog[file])).toEqual(
                Object.keys(catalogOf(loadConfig(ENGINE).config)[file])
            );
            if (gone !== null) expect(groups[gone[0]]).not.toHaveProperty([gone[1]]);
        }
    );

    it('words a groups: that is no map once and describes no group of the file', () => {
        const name = 'options/behavior.yml';
        const found = findingsOf(name, withGroups(name, 3));
        expect(found.said).toEqual([
            'groups: groups is not a map of group paths to help lines; no group of the file is described'
        ]);
        const { catalog, groups } = readCatalog(found.config);
        expect(groups['behavior.yml']).toEqual({});
        expect(Object.keys(catalog['behavior.yml']).length).toBeGreaterThan(0);
    });

    it('words every group of a file with no groups: and describes none of them', () => {
        const name = 'options/behavior.yml';
        const lines = Object.keys(shipped(name).groups);
        const found = findingsOf(name, withGroups(name, undefined));
        expect([...found.said].sort()).toEqual(lines.map(missing).sort());
        expect(readCatalog(found.config).groups['behavior.yml']).toEqual({});
    });
});
