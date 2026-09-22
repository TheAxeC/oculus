// The edit form as config/catalogs/manifest-schema.yml describes it: every field has a widget and a
// section, and every widget that offers choices can find them.
//
// The schema read here is the real config, so this is the gate on that file: a field added without
// a type, or put in a section that does not exist, fails here rather than rendering as a blank row.
// The snapshot is synthetic, since what is checked is the resolution and not the hub.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import {
    NOT_IN_MODEL,
    asList,
    asText,
    choicesFor,
    fieldValues,
    formFields,
    formSections
} from '../../../src/lib/state/forms/schema.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { Id, Project, Snapshot } from '../../../src/lib/data/model.ts';
import { present } from '../../fixtures/present.ts';

const { config } = loadConfig(engineDir());
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
    'projects',
    'type_order',
    'status_legend',
    'focus_lanes',
    'priority_levels'
];

function project(over: Partial<Project> = {}): Project {
    return {
        id: 'alpha',
        tier: 'manuscripts',
        ghost: false,
        title: 'A title',
        chips: ['submitted'],
        statusLine: 'the line',
        results: ['one'],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: ['bravo'],
        fundingIds: ['ZonMw'],
        datasetIds: [],
        pillarIds: ['tensor'],
        domainIds: ['method'],
        collaborators: [],
        docs: [],
        folder: 'projects/manuscripts/alpha',
        file: '/hub/projects/manuscripts/alpha/project.yml',
        ...over
    };
}

function snapshot(): Snapshot {
    const projects: Record<Id, Project> = { alpha: project() };
    return {
        version: 1,
        entities: {
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
    it('holds the whole manifest, one field at a time', () => {
        expect(fields.length).toBe(46);
    });

    it('names seven sections and puts every field in one of them', () => {
        expect(sections.length).toBe(7);
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

    it('keeps the order the file has', () => {
        expect(fields.slice(0, 3).map((one) => one.field)).toEqual(['id', 'tier', 'type']);
        expect(fields[fields.length - 1].field).toBe('subtasks');
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

    it('resolves a literal list to itself', () => {
        expect(choicesOf('compute')).toEqual([
            { id: 'hpc', label: 'hpc' },
            { id: 'local', label: 'local' }
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

    it('has nothing for the fields the model does not carry', () => {
        const missing = fields.filter((one) => !(one.field in values)).map((one) => one.field);
        expect(missing.sort()).toEqual([...NOT_IN_MODEL].sort());
    });

    it('shows a list as one item per line and reads it back as a list', () => {
        expect(asText(['one', 'two'])).toBe('one\ntwo');
        expect(asList(['one'])).toEqual(['one']);
        expect(asList('one')).toEqual(['one']);
        expect(asText(undefined)).toBe('');
    });
});
