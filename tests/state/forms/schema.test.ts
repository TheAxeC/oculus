// Layer 2, client-state tests. The edit form as config/catalogs/manifest-schema.yml describes it:
// every field has a widget and a section, and every widget that offers choices can find them.
//
// The schema read here is the real config, so this is the gate on that file: a field added without
// a type, or put in a section that does not exist, fails here rather than rendering as a blank row.
// The snapshot is synthetic, since what is checked is the resolution and not the hub.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS, RESOURCES, fixtureProject } from '../../fixtures/entities-fixture.ts';
import {
    NOT_IN_MODEL,
    asList,
    asText,
    choicesFor,
    fieldValues,
    formFields,
    formSections,
    type FormField
} from '../../../src/lib/state/forms/schema.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import type { Id, Project, Snapshot } from '../../../src/lib/data/model/index.ts';
import { present } from '../../fixtures/present.ts';
import { fieldsOfSection } from '../../../src/lib/state/forms/schema.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
const fields = formFields(config);
const sections = formSections(config);

/** The widgets ui/ has a control for, and `keymap`, which the form shows and does not edit. */
const TYPES = [
    'readonly',
    'text',
    'textarea',
    'lines',
    'select',
    'chips',
    'tags',
    'date',
    'checkbox',
    'keymap'
];

/** Where a widget's choices may come from. */
const SOURCES = [
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources',
    'projects',
    'type_order',
    'status_legend',
    'focus_lanes',
    'priority_levels'
];

function project(over: Partial<Project> = {}): Project {
    return fixtureProject({
        id: 'alpha',
        tier: 'manuscripts',
        title: 'A title',
        chips: ['submitted'],
        statusLine: 'the line',
        results: ['one'],
        resourceIds: ['utwente'],
        relatedIds: ['bravo'],
        fundingIds: ['ZonMw'],
        pillarIds: ['tensor'],
        domainIds: ['method'],
        folder: 'projects/manuscripts/alpha',
        file: '/hub/projects/manuscripts/alpha/project.yml',
        ...over
    });
}

function snapshot(): Snapshot {
    const projects: Record<Id, Project> = { alpha: project() };
    return {
        version: 1,
        entities: {
            personal: {},
            feeds: NO_FEEDS,
            career: null,
            projects,
            venues: {
                bspc: {
                    id: 'bspc',
                    name: 'Biomedical Signal Processing',
                    short: 'BSPC',
                    themes: []
                }
            },
            datasets: { mimic: { id: 'mimic', name: 'MIMIC', themes: [], projectIds: [] } },
            pillars: {
                tensor: { id: 'tensor', title: 'Tensors', fundingIds: [], projectIds: [] }
            },
            domains: { method: { id: 'method', title: 'Methods', projectIds: [] } },
            funding: {
                ZonMw: {
                    id: 'ZonMw',
                    title: 'ZonMw AI',
                    followups: [],
                    subtasks: [],
                    tags: [],
                    projectIds: [],
                    pillarIds: []
                }
            },
            people: {
                someone: {
                    id: 'someone',
                    name: 'Someone Else',
                    affiliations: ['twente'],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            },
            organisations: {
                twente: {
                    id: 'twente',
                    name: 'University of Twente',
                    kind: 'university',
                    links: [],
                    personIds: ['someone'],
                    fundingIds: []
                }
            },
            resources: RESOURCES,
            collections: {}
        },
        relations: {
            projectVenue: [],
            projectFunding: [],
            projectDataset: [],
            projectPillar: [],
            projectDomain: [],
            projectRelated: [],
            fundingPillar: [],
            projectPerson: [],
            jointWorkPerson: [],
            personOrganisation: [],
            fundingOrganisation: []
        },
        findings: []
    };
}

describe('the form the schema describes', () => {
    it('puts every field in one of the sections', () => {
        const stray = fields.filter((one) => !sections.includes(one.section));
        expect(stray.map((one) => `${one.field}: ${one.section}`)).toEqual([]);
    });

    it('gives every field a widget the interface has', () => {
        const stray = fields.filter((one) => !TYPES.includes(one.type));
        expect(stray.map((one) => `${one.field}: ${one.type}`)).toEqual([]);
    });

    it('gives every field its words', () => {
        const nameless = fields.filter((one) => one.label === '' || one.label === one.field);
        expect(nameless.map((one) => one.field)).toEqual(['id']);
    });

    it('gives every widget of choices somewhere to get them', () => {
        const choosers = fields.filter((one) => one.type === 'select' || one.type === 'chips');
        const stray = choosers.filter((one) => one.from === undefined && one.options === undefined);
        expect(stray.map((one) => one.field)).toEqual([]);
        const unknown = choosers.filter(
            (one) => one.from !== undefined && !SOURCES.includes(one.from)
        );
        expect(unknown.map((one) => `${one.field}: ${one.from}`)).toEqual([]);
    });
});

describe('where the choices come from', () => {
    const held = snapshot();
    const choicesOf = (name: string) => {
        const field = fields.find((one) => one.field === name);
        expect(field).toBeDefined();
        return choicesFor(present(field, `field ${name}`), held, config);
    };

    it('resolves each registry to its own entities', () => {
        expect(choicesOf('venue_id')).toEqual([{ id: 'bspc', label: 'BSPC' }]);
        expect(choicesOf('datasets')).toEqual([{ id: 'mimic', label: 'MIMIC' }]);
        expect(choicesOf('pillar')).toEqual([{ id: 'tensor', label: 'Tensors' }]);
        expect(choicesOf('domain')).toEqual([{ id: 'method', label: 'Methods' }]);
        expect(choicesOf('funding')).toEqual([{ id: 'ZonMw', label: 'ZonMw AI' }]);
    });

    it('resolves the people registry and the projects themselves', () => {
        expect(choicesOf('collaborators')).toEqual([{ id: 'someone', label: 'Someone Else' }]);
        expect(choicesOf('related')).toEqual([{ id: 'alpha', label: 'A title' }]);
    });

    it('resolves a vocabulary key of config/catalogs/vocab.yml', () => {
        expect(choicesOf('focus').map((one) => one.id)).toContain('run');
        expect(choicesOf('priority').map((one) => one.id)).toEqual(['high', 'med', 'low']);
        expect(choicesOf('type').map((one) => one.id)).toContain('manuscript');
        expect(choicesOf('status.chips').map((one) => one.id)).toContain('submitted');
    });

    it('resolves the resources registry to every resource by its name', () => {
        expect(choicesOf('compute')).toEqual([
            { id: 'data', label: 'Local data', glyph: 'data' },
            { id: 'this-mac', label: 'This Mac', glyph: 'host' },
            { id: 'utwente', label: 'UTwente HPC', glyph: 'hpc' }
        ]);
    });

    it('has no choices before the snapshot arrives, rather than an error', () => {
        const field = fields.find((one) => one.field === 'venue_id');
        expect(choicesFor(present(field, 'field venue_id'), null, config)).toEqual([]);
    });
});

describe('the values a form opens with', () => {
    const values = fieldValues(project());

    it('reads the model under the names the manifest uses', () => {
        expect(values.title).toBe('A title');
        expect(values['status.line']).toBe('the line');
        expect(values['status.chips']).toEqual(['submitted']);
        expect(values.domain).toBe('method');
        expect(values.pillar).toEqual(['tensor']);
        expect(values.related).toEqual(['bravo']);
    });

    it('opens the compute field with the keys of the resources the project names', () => {
        expect(values.compute).toEqual(['utwente']);
    });

    it('has nothing for the fields the model does not carry', () => {
        const missing = fields.filter((one) => !(one.field in values)).map((one) => one.field);
        expect(missing.sort()).toEqual([...NOT_IN_MODEL].sort());
    });
});

describe('the fields of one section of the manifest form', () => {
    it('are the fields that name it, in file order', () => {
        const fields = [
            { field: 'a', section: 'one' },
            { field: 'b', section: 'two' },
            { field: 'c', section: 'one' }
        ] as unknown as Parameters<typeof fieldsOfSection>[0];
        expect(fieldsOfSection(fields, 'one').map((one) => one.field)).toEqual(['a', 'c']);
    });
});

/** A merged config holding only this `manifest_schema`. */
function withSchema(schema: unknown): Record<string, unknown> {
    return { manifest_schema: schema };
}

/** The field of a schema row that says nothing: every key present, the empty ones undefined. */
function bare(field: string, over: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        field,
        label: field,
        help: undefined,
        type: '',
        section: '',
        from: undefined,
        options: undefined,
        ...over
    };
}

describe('the sections of a schema of the wrong shape', () => {
    it.each([
        ['no manifest_schema', {}, []],
        ['a manifest_schema that is a list', withSchema([]), []],
        ['a manifest_schema that is a string', withSchema('x'), []],
        ['a manifest_schema that is null', withSchema(null), []],
        ['no sections', withSchema({}), []],
        ['sections that are an empty list', withSchema({ sections: [] }), []],
        ['sections that are a list of names', withSchema({ sections: ['a', 'b'] }), []],
        ['sections that are a string', withSchema({ sections: 'x' }), []],
        ['sections that are null', withSchema({ sections: null }), []],
        [
            'sections naming some words and some not',
            withSchema({ sections: { a: 'A', b: 3, c: null, d: ['D'], e: 'E', f: '' } }),
            ['A', 'E', '']
        ],
        [
            'a section keyed __proto__',
            withSchema({ sections: parsed('{"__proto__":"Proto","a":"A"}') }),
            ['Proto', 'A']
        ]
    ])('reads %s', (_name, config, expected) => {
        expect(formSections(config)).toStrictEqual(expected);
    });
});

describe('the fields of a schema of the wrong shape', () => {
    it.each([
        ['no manifest_schema', {}],
        ['a manifest_schema that is a list', withSchema([])],
        ['no fields', withSchema({})],
        ['fields that are an empty list', withSchema({ fields: [] })],
        ['fields that are a list of rows', withSchema({ fields: [{ label: 'A' }] })],
        ['fields that are a string', withSchema({ fields: 'x' })],
        ['fields that are null', withSchema({ fields: null })]
    ])('reads %s as no fields', (_name, config) => {
        expect(formFields(config)).toStrictEqual([]);
    });

    it('leaves out a field row that is no map, and keeps the order of the rest', () => {
        const found = formFields(
            withSchema({ fields: { a: 'x', b: [], c: null, d: {}, e: 3, f: { label: 'F' } } })
        );
        expect(found).toStrictEqual([bare('d'), bare('f', { label: 'F' })]);
    });

    it('reads a key of the wrong type as the key it leaves out', () => {
        const row = { label: 3, help: 4, type: 5, section: 6, from: 7, options: 8 };
        expect(formFields(withSchema({ fields: { e: row } }))).toStrictEqual([bare('e')]);
    });

    it('reads an empty word as no word, a label as the field name', () => {
        const row = { label: '', help: '', type: '', section: '', from: '', options: [] };
        expect(formFields(withSchema({ fields: { f: row } }))).toStrictEqual([
            bare('f', { options: [] })
        ]);
    });

    it('keeps every word a field row carries', () => {
        const row = { label: 'G', help: 'H', type: 'text', section: 's', from: 'venues' };
        expect(formFields(withSchema({ fields: { g: row } }))).toStrictEqual([
            bare('g', { label: 'G', help: 'H', type: 'text', section: 's', from: 'venues' })
        ]);
    });

    it.each([
        ['strings and other things', ['a', 1, null, 'b', {}, ['c'], ''], ['a', 'b', '']],
        ['a number', [1], []],
        ['nothing', [], []],
        ['a map', { 0: 'a' }, undefined],
        ['a number instead of a list', 1, undefined],
        ['a string instead of a list', 'a', undefined],
        ['null', null, undefined]
    ])('reads options holding %s', (_name, options, expected) => {
        const found = formFields(withSchema({ fields: { f: { options } } }));
        expect(found).toStrictEqual([bare('f', { options: expected })]);
    });

    it('keeps a field named __proto__', () => {
        const fields = parsed('{"__proto__":{"label":"P","type":"text"},"a":{}}');
        expect(formFields(withSchema({ fields })).map((one) => one.field)).toStrictEqual([
            '__proto__',
            'a'
        ]);
    });
});

describe('the choices of a vocabulary of the wrong shape', () => {
    const field = (over: Partial<FormField> = {}): FormField => ({
        field: 'f',
        label: 'f',
        type: 'select',
        section: 's',
        ...over
    });

    it('reads a vocabulary list item by item', () => {
        const vocab = [
            'a',
            3,
            null,
            { key: 'k' },
            { key: 'k2', label: '' },
            { key: 3, label: 'x' },
            { label: 'only' },
            { key: 'k3', label: 'L3' },
            ['k4'],
            'a',
            { key: 'k5', label: 5 }
        ];
        const found = choicesFor(field({ from: 'vocab' }), null, { vocab });
        expect(found).toStrictEqual([
            { id: 'a', label: 'a' },
            { id: 'k', label: 'k' },
            { id: 'k2', label: 'k2' },
            { id: 'k3', label: 'L3' },
            { id: 'a', label: 'a' },
            { id: 'k5', label: 'k5' }
        ]);
    });

    it.each([
        ['a map', { a: 'b' }],
        ['a string', 'a'],
        ['null', null],
        ['a number', 3],
        ['nothing', undefined]
    ])('offers nothing for a vocabulary that is %s', (_name, vocab) => {
        expect(choicesFor(field({ from: 'vocab' }), null, { vocab })).toStrictEqual([]);
    });

    it.each([['__proto__'], ['constructor'], ['toString'], ['missing']])(
        'offers nothing for a source named %s',
        (from) => {
            expect(choicesFor(field({ from }), null, {})).toStrictEqual([]);
        }
    );

    it('offers a literal list of options before any source, an empty list included', () => {
        expect(choicesFor(field({ options: [], from: 'venues' }), snapshot(), {})).toStrictEqual(
            []
        );
        expect(choicesFor(field({ options: ['a'], from: 'vocab' }), null, {})).toStrictEqual([
            { id: 'a', label: 'a' }
        ]);
    });

    it('labels an entity by the first of its keys that is a word, and else by its id', () => {
        const held = snapshot();
        held.entities.venues = {
            c: { id: 'c', short: 'S', name: 'x' },
            b: { id: 'b', short: 3, name: 'N' },
            a: { id: 'a', short: '', name: '' }
        } as unknown as Snapshot['entities']['venues'];
        expect(choicesFor(field({ from: 'venues' }), held, {})).toStrictEqual([
            { id: 'a', label: 'a' },
            { id: 'b', label: 'N' },
            { id: 'c', label: 'S' }
        ]);
    });
});

describe('the values and the text of a form over the wrong type', () => {
    it.each([
        ['true', true, true],
        ['false', false, false],
        ['the text true', 'true', false],
        ['the number 1', 1, false],
        ['nothing', undefined, false]
    ])('opens a pin as ticked only when the project says true, for %s', (_name, pin, expected) => {
        expect(fieldValues(project({ pin } as Partial<Project>)).pin).toBe(expected);
    });

    it('opens the fields of a project without code availability or a domain as undefined', () => {
        const values = fieldValues(project({ domainIds: [] }));
        expect(values.domain).toBeUndefined();
        expect('domain' in values).toBe(true);
        expect(values['code_availability.status']).toBeUndefined();
        expect('code_availability.status' in values).toBe(true);
        expect(values['reproduced.date']).toBeUndefined();
    });

    it.each([
        [
            ['a', 1, null, 'b', {}, ['c']],
            ['a', 'b']
        ],
        [[], []],
        ['', []],
        ['a', ['a']],
        [3, []],
        [{}, []],
        [null, []],
        [undefined, []],
        [true, []]
    ])('reads %j as a list of %j', (value, expected) => {
        expect(asList(value)).toStrictEqual(expected);
    });

    it.each([
        [undefined, ''],
        [null, ''],
        ['a', 'a'],
        [3, '3'],
        [Number.NaN, 'NaN'],
        [Number.POSITIVE_INFINITY, 'Infinity'],
        [true, 'true'],
        [{}, ''],
        [{ a: 'b' }, ''],
        [[], ''],
        [['a', 1, null, {}, true, ['b'], undefined], 'a\n1\n\n\ntrue\n\n']
    ])('shows %j as the text %j', (value, expected) => {
        expect(asText(value)).toStrictEqual(expected);
    });
});

/** A JSON text read as the unknown value a saved record or a config holds. */
function parsed(text: string): unknown {
    return JSON.parse(text) as unknown;
}
