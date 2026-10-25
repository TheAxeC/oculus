// Layer 1, data tests. The relation fields of a manifest that the generated schemas accept in a
// form the board does not read: a bare `key:` on a field that holds a list or one id, and
// `waiting-on` written as one text. A hub planted in a scratch directory and built through
// buildOneHub gives one finding for each, with the catalog's sentence.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { buildOneHub } from '../../fixtures/hubs/hub-build.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';

const LOADED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(LOADED);
const CONFIG = portfolioConfigFrom(LOADED);

/** The sentence a field of the wrong shape is reported in. */
function typeSentence(field: string, wanted: 'list' | 'text', got: string): string {
    return findingText(
        CATALOG,
        'findings.schema.type',
        field,
        findingText(
            CATALOG,
            wanted === 'list' ? 'findings.schema.is_list' : 'findings.schema.is_text'
        ),
        got
    );
}

const NULL = findingText(CATALOG, 'findings.shape.is_null');
const TEXT = findingText(CATALOG, 'findings.shape.is_other', 'string');

const ROWS = [
    { row: 'a bare domain', written: 'domain:', field: 'domain', wanted: 'text', got: NULL },
    { row: 'a bare pillars', written: 'pillars:', field: 'pillars', wanted: 'list', got: NULL },
    { row: 'a bare datasets', written: 'datasets:', field: 'datasets', wanted: 'list', got: NULL },
    { row: 'a bare related', written: 'related:', field: 'related', wanted: 'list', got: NULL },
    { row: 'a bare lead', written: 'lead:', field: 'lead', wanted: 'list', got: NULL },
    {
        row: 'a bare collaborators',
        written: 'collaborators:',
        field: 'collaborators',
        wanted: 'list',
        got: NULL
    },
    {
        row: 'a bare waiting-on',
        written: 'waiting-on:',
        field: 'waiting-on',
        wanted: 'list',
        got: NULL
    },
    {
        row: 'a waiting-on written as one text',
        written: 'waiting-on: someone',
        field: 'waiting-on',
        wanted: 'list',
        got: TEXT
    }
] as const;

describe('the relation fields of a manifest', () => {
    it.each(ROWS)('gives one finding for $row', ({ written, field, wanted, got }) => {
        const hub = plantScratch(
            'oculus-relation-shapes-',
            {
                'projects/active/alpha/project.yml': `id: alpha\ntier: research\nstage: exploring\ntitle: alpha\n${written}\n`
            },
            ['.oculus/data/people']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings.filter((one) =>
            one.file.endsWith('/alpha/project.yml')
        );
        expect(found.map((one) => [one.key, one.message])).toEqual([
            [field, typeSentence(field, wanted, got)]
        ]);
    });

    it('gives none for a bare venue, funding or compute, which may be empty', () => {
        const hub = plantScratch(
            'oculus-relation-shapes-',
            {
                'projects/active/alpha/project.yml':
                    'id: alpha\ntier: research\nstage: exploring\ntitle: alpha\nvenue:\nfunding:\ncompute:\n'
            },
            ['.oculus/data/people']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings.filter((one) =>
            one.file.endsWith('/alpha/project.yml')
        );
        expect(found).toEqual([]);
    });

    it('gives one finding for a waiting-on written as one text when the people file reads, and none for a person key', () => {
        const hub = plantScratch(
            'oculus-relation-shapes-',
            {
                '.oculus/data/people/people.yml':
                    'schema:\n  - { field: key, type: text, required: true, help: The person key. }\n  - { field: name, type: text, required: true, help: The name. }\nentries:\n  - { key: ada, name: Ada }\n',
                'projects/active/alpha/project.yml':
                    'id: alpha\ntier: research\nstage: exploring\ntitle: alpha\nwaiting-on: ada\n',
                'projects/active/beta/project.yml':
                    'id: beta\ntier: research\nstage: exploring\ntitle: beta\nwaiting-on: [ada, alpha]\n'
            },
            ['.oculus/data/people']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings;
        const of = (name: string) =>
            found.filter((one) => one.file.endsWith(`/${name}/project.yml`));
        expect(of('alpha').map((one) => [one.key, one.message])).toEqual([
            ['waiting-on', typeSentence('waiting-on', 'list', TEXT)]
        ]);
        expect(of('beta')).toEqual([]);
    });

    it('gives one finding for a lead written as one text when the people file reads, and none for a list of person keys', () => {
        const hub = plantScratch(
            'oculus-relation-shapes-',
            {
                '.oculus/data/people/people.yml':
                    'schema:\n  - { field: key, type: text, required: true, help: The person key. }\n  - { field: name, type: text, required: true, help: The name. }\nentries:\n  - { key: ada, name: Ada }\n',
                'projects/active/alpha/project.yml':
                    'id: alpha\ntier: research\nstage: exploring\ntitle: alpha\nlead: Faes\n',
                'projects/active/beta/project.yml':
                    'id: beta\ntier: research\nstage: exploring\ntitle: beta\nlead: [ada]\n'
            },
            ['.oculus/data/people']
        );
        const found = buildOneHub(hub, CONFIG).snapshot.findings;
        const of = (name: string) =>
            found.filter((one) => one.file.endsWith(`/${name}/project.yml`));
        expect(of('alpha').map((one) => [one.key, one.message])).toEqual([
            ['lead', typeSentence('lead', 'list', TEXT)]
        ]);
        expect(of('beta')).toEqual([]);
    });

    it('knows a field the hub adds to its form, and gives the unknown-key finding where no hub adds it', () => {
        const manifest =
            'id: alpha\ntier: research\nstage: exploring\ntitle: alpha\ngrant_id: X1\n';
        const files = { 'projects/active/alpha/project.yml': manifest };
        const added = plantScratch('oculus-relation-shapes-', {
            ...files,
            [HUB_FILE]:
                'manifest_fields: [ { field: grant_id, label: Grant, type: text, section: Core, help: "The grant number." } ]\n'
        });
        const read = loadConfig(engineDir(), { hub: added });
        const config = portfolioConfigFrom(read.config, read.from);
        const on = (hub: string, settings: typeof CONFIG) =>
            buildOneHub(hub, settings).snapshot.findings.filter(
                (one) => one.file.endsWith('/alpha/project.yml') && one.key === 'grant_id'
            );
        expect(on(added, config)).toEqual([]);
        const plain = plantScratch('oculus-relation-shapes-', files);
        expect(on(plain, CONFIG)).toHaveLength(1);
    });
});
