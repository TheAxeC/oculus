// Layer 4, tree check. The options catalog, config/catalogs/options.yml, against the five tracked
// config files and the machine-local file's key list. The findings are computed by findingsOf
// (options-findings.ts) over an engine directory, so the cases below run the same code over fixture
// catalogs and fixture files in a temporary folder, and the first block runs it over the shipped
// tree. The machine's own local.yml is never opened: its keys come from LOCAL_KEYS, which the
// server's reader of that file holds.
//
// What it does not cover: whether a description says what its option does, which a person reads,
// and whether a default is still the value the tracked file holds, since a default is the value
// the file is shipped with and a write to the file changes the file and not the default.

import { stringify } from 'yaml';
import { describe, expect } from 'vitest';
import { LOCAL_NAME, engineDir } from '../../../src/lib/data/sources/config.ts';
import { LOCAL_KEYS } from '../../../src/lib/data/sources/config/local.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { findingsOf, shown, type Entries } from './options-findings.ts';

/** What a fixture engine holds: each tracked file's content, the catalog, and the local keys. */
type Fixture = {
    files: Record<string, unknown>;
    catalog: Record<string, unknown>;
    local: string[];
    /** The catalog file's own text, for a file that is not one YAML can write. */
    text?: string;
};

/** A catalog entry for an option, as the catalog holds it. */
function option(control: string, fallback: unknown, more: Entries = {}): Entries {
    return { description: 'What it does.', default: fallback, control, ...more };
}

/** A catalog entry for a family. */
function family(fields: Record<string, unknown>): Entries {
    return { description: 'What the records are.', fields };
}

/** A fixture every rule passes: one key of each kind the catalog describes. */
function sound(): Fixture {
    return {
        files: {
            'appearance.yml': { crt: { default: false } },
            'behavior.yml': {
                slurm: { host: 'utwente', poll_min: 20 },
                waiting_status: ['submitted', 'pending'],
                audit_ignore: [],
                usage_tiers: { prolite: 'Plus' }
            },
            'layout.yml': {
                map_label_mode: 'short',
                rail: [{ label: 'Focus', glyph: 'compass', page: 'focus' }]
            },
            'present.yml': { deck: { meta: { kicker: 'Briefing' } } },
            'sources.yml': { indexes: [] }
        },
        catalog: {
            'appearance.yml': { 'crt.default': option('toggle', false) },
            'behavior.yml': {
                'slurm.host': option('text', 'utwente'),
                'slurm.poll_min': option('number', 20),
                waiting_status: option('list', ['submitted', 'pending']),
                audit_ignore: option('list', []),
                usage_tiers: family({ key: 'a tier name', value: 'the words shown for it' })
            },
            'layout.yml': {
                map_label_mode: option('choice', 'short', { values: ['short', 'full'] }),
                rail: family({ label: 'the words', glyph: 'a glyph name', page: 'a page key' })
            },
            'present.yml': { 'deck.meta.kicker': option('text', 'Briefing') },
            'sources.yml': { indexes: family({ key: 'the tab key', dir: 'the folder scanned' }) },
            [LOCAL_NAME]: { hub: { description: 'The hub.' }, port: { description: 'The port.' } }
        },
        local: ['hub', 'port']
    };
}

/** The entries of one file of a fixture's catalog, for a case to change. */
function entriesOf(fixture: Fixture, file: string): Entries {
    return fixture.catalog[file] as Entries;
}

/** The findings over a fixture written to a temporary folder. */
function run(fixture: Fixture, more: Record<string, string> = {}): string[] {
    const files: Record<string, string> = {
        ...more,
        'config/catalogs/options.yml':
            fixture.text ?? stringify({ options: fixture.catalog }, { indent: 4 })
    };
    for (const [name, content] of Object.entries(fixture.files)) {
        files[`config/${name}`] = stringify(content);
    }
    return findingsOf(plantScratch('oculus-options-', files), fixture.local);
}

/** One case: the fixture changed, and the finding the change earns. */
type Case = [name: string, change: (fixture: Fixture) => void, finding: string];

/** Each case changes `sound()` in one way and expects that finding among those it gives. */
function eachCase(rows: Case[]): void {
    for (const [name, change, finding] of rows) {
        it(name, () => {
            const fixture = sound();
            change(fixture);
            expect(run(fixture)).toContain(finding);
        });
    }
}

describe('the catalog over the shipped tree', () => {
    it('holds an entry for every option of the five config files and every machine-local key', () => {
        expect(findingsOf(engineDir(), LOCAL_KEYS)).toEqual([]);
    });
});

describe('a catalog the rules accept', () => {
    it('raises nothing over a fixture that has one key of each kind', () => {
        expect(run(sound())).toEqual([]);
    });

    it('accepts an empty list as a family and as a list', () => {
        const fixture = sound();
        expect(fixture.files['sources.yml']).toEqual({ indexes: [] });
        expect(fixture.files['behavior.yml']).toMatchObject({ audit_ignore: [] });
        expect(run(fixture)).toEqual([]);
    });
});

describe('an option and an entry that do not match', () => {
    eachCase([
        [
            'a key with no entry',
            (fixture) => {
                (fixture.files['behavior.yml'] as Entries).extra = 1;
            },
            'behavior.yml: extra: has no catalog entry'
        ],
        [
            'an entry whose key is in no file',
            (fixture) => {
                entriesOf(fixture, 'behavior.yml').ghost = option('number', 1);
            },
            'behavior.yml: ghost: names no option of the file'
        ],
        [
            'a rail list whose entry is removed',
            (fixture) => {
                delete entriesOf(fixture, 'layout.yml').rail;
            },
            'layout.yml: rail: has no catalog entry'
        ],
        [
            'an entry for a key that holds a map rather than an option',
            (fixture) => {
                entriesOf(fixture, 'behavior.yml').slurm = option('text', 'x');
            },
            'behavior.yml: slurm: names no option of the file'
        ],
        [
            'an entry beside the family it sits under',
            (fixture) => {
                entriesOf(fixture, 'behavior.yml')['usage_tiers.prolite'] = option('text', 'Plus');
            },
            'behavior.yml: usage_tiers.prolite: sits under the family usage_tiers, which is described by its fields'
        ]
    ]);

    it('names a map whose entries are all missing once, at its own path', () => {
        const fixture = sound();
        delete entriesOf(fixture, 'behavior.yml')['slurm.host'];
        delete entriesOf(fixture, 'behavior.yml')['slurm.poll_min'];
        const found = run(fixture).filter((line) => line.includes('slurm'));
        expect(found).toEqual(['behavior.yml: slurm: has no catalog entry']);
    });

    it('names each key of a map that keeps an entry of its own', () => {
        const fixture = sound();
        delete entriesOf(fixture, 'behavior.yml')['slurm.host'];
        expect(run(fixture)).toContain('behavior.yml: slurm.host: has no catalog entry');
    });

    it('names a key and an entry that are reserved names of objects', () => {
        const fixture = sound();
        Object.assign(fixture.files['behavior.yml'] as Entries, { constructor: 3 });
        Object.assign(entriesOf(fixture, 'behavior.yml'), { toString: option('number', 3) });
        const found = run(fixture);
        expect(found).toContain('behavior.yml: constructor: has no catalog entry');
        expect(found).toContain('behavior.yml: toString: names no option of the file');
    });
});

describe('a description', () => {
    eachCase([
        [
            'that is missing',
            (fixture) => {
                delete (entriesOf(fixture, 'behavior.yml')['slurm.host'] as Entries).description;
            },
            'behavior.yml: slurm.host: description is missing, empty or not a string'
        ],
        [
            'that is empty',
            (fixture) => {
                (entriesOf(fixture, 'behavior.yml')['slurm.host'] as Entries).description = '';
            },
            'behavior.yml: slurm.host: description is missing, empty or not a string'
        ],
        [
            'that is a number',
            (fixture) => {
                (entriesOf(fixture, 'behavior.yml')['slurm.host'] as Entries).description = 3;
            },
            'behavior.yml: slurm.host: description is missing, empty or not a string'
        ]
    ]);
});

describe('a leaf option', () => {
    const at = (fixture: Fixture): Entries =>
        entriesOf(fixture, 'behavior.yml')['slurm.poll_min'] as Entries;
    const choice = (fixture: Fixture): Entries =>
        entriesOf(fixture, 'layout.yml').map_label_mode as Entries;

    eachCase([
        [
            'with no default',
            (fixture) => {
                delete at(fixture).default;
            },
            'behavior.yml: slurm.poll_min: no default'
        ],
        [
            'with no control',
            (fixture) => {
                delete at(fixture).control;
            },
            'behavior.yml: slurm.poll_min: no control'
        ],
        [
            'with a control outside the five',
            (fixture) => {
                at(fixture).control = 'slider';
            },
            'behavior.yml: slurm.poll_min: control slider is not one of toggle, number, text, choice, list'
        ],
        [
            'that is a choice with no values',
            (fixture) => {
                delete choice(fixture).values;
            },
            'layout.yml: map_label_mode: a choice needs values: a non-empty list of distinct strings'
        ],
        [
            'that is a choice with an empty list of values',
            (fixture) => {
                choice(fixture).values = [];
            },
            'layout.yml: map_label_mode: a choice needs values: a non-empty list of distinct strings'
        ],
        [
            'that is a choice with a repeated value',
            (fixture) => {
                choice(fixture).values = ['short', 'short'];
            },
            'layout.yml: map_label_mode: a choice needs values: a non-empty list of distinct strings'
        ],
        [
            'that is a choice with a value that is not a string',
            (fixture) => {
                choice(fixture).values = ['short', 3];
            },
            'layout.yml: map_label_mode: a choice needs values: a non-empty list of distinct strings'
        ],
        [
            'that is a number with values',
            (fixture) => {
                at(fixture).values = ['a'];
            },
            'behavior.yml: slurm.poll_min: values belong to a choice and to nothing else'
        ],
        [
            'that is a choice whose default is outside its values',
            (fixture) => {
                choice(fixture).default = 'huge';
            },
            'layout.yml: map_label_mode: default does not fit control choice'
        ],
        [
            'that is a toggle defaulting to a word',
            (fixture) => {
                (entriesOf(fixture, 'appearance.yml')['crt.default'] as Entries).default = 'yes';
            },
            'appearance.yml: crt.default: default does not fit control toggle'
        ],
        [
            'that is a number defaulting to text',
            (fixture) => {
                at(fixture).default = '2';
            },
            'behavior.yml: slurm.poll_min: default does not fit control number'
        ],
        [
            'that is a text defaulting to a number',
            (fixture) => {
                (entriesOf(fixture, 'behavior.yml')['slurm.host'] as Entries).default = 3;
            },
            'behavior.yml: slurm.host: default does not fit control text'
        ],
        [
            'that is a list defaulting to a list of records',
            (fixture) => {
                (entriesOf(fixture, 'behavior.yml').waiting_status as Entries).default = [{ a: 1 }];
            },
            'behavior.yml: waiting_status: default does not fit control list'
        ],
        [
            'that is a number defaulting to infinity',
            (fixture) => {
                at(fixture).default = Number.POSITIVE_INFINITY;
            },
            'behavior.yml: slurm.poll_min: default does not fit control number'
        ],
        [
            'that is set as text where the file holds a number',
            (fixture) => {
                at(fixture).control = 'text';
                at(fixture).default = '20';
            },
            'behavior.yml: slurm.poll_min: the value the file holds does not fit control text'
        ],
        [
            'that is set as a list where the file holds text',
            (fixture) => {
                const host = entriesOf(fixture, 'behavior.yml')['slurm.host'] as Entries;
                host.control = 'list';
                host.default = ['utwente'];
            },
            'behavior.yml: slurm.host: the value the file holds does not fit control list'
        ],
        [
            'that is a choice where the file holds a word outside the values',
            (fixture) => {
                choice(fixture).values = ['full', 'long'];
                choice(fixture).default = 'full';
            },
            'layout.yml: map_label_mode: the value the file holds does not fit control choice'
        ],
        [
            'with a misspelt field',
            (fixture) => {
                const entry = at(fixture);
                entry.defualt = entry.default;
            },
            'behavior.yml: slurm.poll_min: field defualt is not allowed here'
        ],
        [
            'with a minimum, which no entry has',
            (fixture) => {
                at(fixture).min = 1;
            },
            'behavior.yml: slurm.poll_min: field min is not allowed here'
        ],
        [
            'with an empty section',
            (fixture) => {
                at(fixture).section = '';
            },
            'behavior.yml: slurm.poll_min: section is not a non-empty string'
        ],
        [
            'with a section that is not text',
            (fixture) => {
                at(fixture).section = 4;
            },
            'behavior.yml: slurm.poll_min: section is not a non-empty string'
        ]
    ]);

    it('takes a section that is a heading of its own', () => {
        const fixture = sound();
        at(fixture).section = 'Cluster';
        expect(run(fixture)).toEqual([]);
    });
});

describe('a family', () => {
    const tiers = (fixture: Fixture): Entries =>
        entriesOf(fixture, 'behavior.yml').usage_tiers as Entries;

    eachCase([
        [
            'that carries a default',
            (fixture) => {
                tiers(fixture).default = {};
            },
            'behavior.yml: usage_tiers: a family has no default'
        ],
        [
            'that carries a control',
            (fixture) => {
                tiers(fixture).control = 'list';
            },
            'behavior.yml: usage_tiers: a family has no control'
        ],
        [
            'that carries values',
            (fixture) => {
                tiers(fixture).values = ['a'];
            },
            'behavior.yml: usage_tiers: a family has no values'
        ],
        [
            'with no fields in it',
            (fixture) => {
                tiers(fixture).fields = {};
            },
            'behavior.yml: usage_tiers: fields is missing, empty or holds a line that is not a string'
        ],
        [
            'with a field line that is not text',
            (fixture) => {
                tiers(fixture).fields = { key: 'a tier', value: 3 };
            },
            'behavior.yml: usage_tiers: fields is missing, empty or holds a line that is not a string'
        ],
        [
            'given to a scalar',
            (fixture) => {
                entriesOf(fixture, 'appearance.yml')['crt.default'] = family({ key: 'x' });
            },
            'appearance.yml: crt.default: the file holds a scalar or a list of scalars here, which is not a family'
        ],
        [
            'given to a list of scalars',
            (fixture) => {
                entriesOf(fixture, 'behavior.yml').waiting_status = family({ key: 'x' });
            },
            'behavior.yml: waiting_status: the file holds a scalar or a list of scalars here, which is not a family'
        ],
        [
            'given to a key that holds nothing',
            (fixture) => {
                (fixture.files['sources.yml'] as Entries).indexes = null;
            },
            'sources.yml: indexes: the file holds a scalar or a list of scalars here, which is not a family'
        ]
    ]);
});

describe('a key path that cannot be a key of a file', () => {
    eachCase(
        ['', '.slurm', 'slurm.', 'slurm..poll_min'].map((path): Case => {
            return [
                `written ${JSON.stringify(path)}`,
                (fixture) => {
                    entriesOf(fixture, 'behavior.yml')[path] = option('number', 1);
                },
                `behavior.yml: ${shown(path)}: key path is empty or has a leading, trailing or doubled dot`
            ];
        })
    );

    it('is named when two keys of a file give the same path', () => {
        const fixture = sound();
        fixture.files['behavior.yml'] = { 'a.b': 1, a: { b: 2 } };
        entriesOf(fixture, 'behavior.yml')['a.b'] = option('number', 1);
        expect(run(fixture)).toContain('behavior.yml: a.b: two keys of the file give this path');
    });
});

describe('the machine-local keys', () => {
    eachCase([
        [
            'an entry for a key its reader does not take',
            (fixture) => {
                (fixture.catalog[LOCAL_NAME] as Entries).colour = { description: 'A colour.' };
            },
            'local.yml: colour: is not a key the machine-local file reads'
        ],
        [
            'a key its reader takes that has no entry',
            (fixture) => {
                fixture.local.push('mail_dir');
            },
            'local.yml: mail_dir: has no catalog entry'
        ],
        [
            'an entry that carries a default',
            (fixture) => {
                (entriesOf(fixture, LOCAL_NAME).port as Entries).default = 8790;
            },
            'local.yml: port: field default is not allowed here'
        ],
        [
            'an entry that carries a section',
            (fixture) => {
                (entriesOf(fixture, LOCAL_NAME).port as Entries).section = 'Server';
            },
            'local.yml: port: field section is not allowed here'
        ],
        [
            'an entry that carries fields',
            (fixture) => {
                (entriesOf(fixture, LOCAL_NAME).port as Entries).fields = { key: 'x' };
            },
            'local.yml: port: field fields is not allowed here'
        ],
        [
            'an entry with no description',
            (fixture) => {
                entriesOf(fixture, LOCAL_NAME).port = {};
            },
            'local.yml: port: description is missing, empty or not a string'
        ]
    ]);

    it('come from the reader of the file and are not read from a local.yml of the engine', () => {
        expect(run(sound(), { [`config/${LOCAL_NAME}`]: 'hub: /x\nnot_a_key: 1\n' })).toEqual([]);
    });
});

describe('a catalog that is not the shape the types say', () => {
    const cases: [string, (fixture: Fixture) => void, string][] = [
        [
            'an entry of a file given as a number',
            (fixture) => {
                entriesOf(fixture, 'behavior.yml')['slurm.poll_min'] = 20;
            },
            'behavior.yml: slurm.poll_min: entry is not a map'
        ],
        [
            'a file name the catalog does not describe',
            (fixture) => {
                fixture.catalog['glyphs.yml'] = { a: option('text', 'a') };
            },
            'glyphs.yml: not a config file the catalog describes'
        ],
        [
            'a file mapped to null',
            (fixture) => {
                fixture.catalog['behavior.yml'] = null;
            },
            'behavior.yml: not a map of key paths to entries'
        ],
        [
            'a file mapped to a list',
            (fixture) => {
                fixture.catalog['layout.yml'] = [1];
            },
            'layout.yml: not a map of key paths to entries'
        ]
    ];
    for (const [name, change, finding] of cases) {
        it(`names ${name} and does not throw`, () => {
            const fixture = sound();
            change(fixture);
            expect(run(fixture)).toContain(finding);
        });
    }

    it('names an `options` that is a list', () => {
        const fixture = sound();
        fixture.text = stringify({ options: [1, 2] });
        expect(run(fixture)).toEqual(['options: missing or not a map of config file names']);
    });

    it('names a catalog with no `options` key', () => {
        const fixture = sound();
        fixture.text = stringify({ other: {} });
        expect(run(fixture)).toEqual(['options: missing or not a map of config file names']);
    });

    it('names a catalog that holds one key path twice, which the parser refuses', () => {
        const fixture = sound();
        fixture.text =
            'options:\n    behavior.yml:\n        a: { description: x }\n        a: { description: y }\n';
        expect(run(fixture)).toEqual(['options: missing or not a map of config file names']);
    });
});
