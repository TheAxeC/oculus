// Layer 1, data tests. The relation fields of a manifest that the generated schemas accept in a
// form the board does not read: a bare `key:` on a field that holds a list or one id, and
// `waiting-on` written as one text. A hub planted in a scratch directory and built through
// buildPortfolioWithSchemas gives one finding for each, with the catalog's sentence.

import { describe, expect } from 'vitest';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

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
    { row: 'a bare pillar', written: 'pillar:', field: 'pillar', wanted: 'list', got: NULL },
    { row: 'a bare datasets', written: 'datasets:', field: 'datasets', wanted: 'list', got: NULL },
    { row: 'a bare related', written: 'related:', field: 'related', wanted: 'list', got: NULL },
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
                'projects/active/alpha/project.yml': `id: alpha\ntier: projects\ntype: active\ntitle: alpha\n${written}\n`
            },
            ['.oculus/data/people']
        );
        const found = buildPortfolioWithSchemas(hub, CONFIG).snapshot.findings.filter((one) =>
            one.file.endsWith('/alpha/project.yml')
        );
        expect(found.map((one) => [one.key, one.message])).toEqual([
            [field, typeSentence(field, wanted, got)]
        ]);
    });

    it('gives none for a bare venue_id, funding or compute, which may be empty', () => {
        const hub = plantScratch(
            'oculus-relation-shapes-',
            {
                'projects/active/alpha/project.yml':
                    'id: alpha\ntier: projects\ntype: active\ntitle: alpha\nvenue_id:\nfunding:\ncompute:\n'
            },
            ['.oculus/data/people']
        );
        const found = buildPortfolioWithSchemas(hub, CONFIG).snapshot.findings.filter((one) =>
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
                    'id: alpha\ntier: projects\ntype: active\ntitle: alpha\nwaiting-on: ada\n',
                'projects/active/beta/project.yml':
                    'id: beta\ntier: projects\ntype: active\ntitle: beta\nwaiting-on: [ada, alpha]\n'
            },
            ['.oculus/data/people']
        );
        const found = buildPortfolioWithSchemas(hub, CONFIG).snapshot.findings;
        const of = (name: string) =>
            found.filter((one) => one.file.endsWith(`/${name}/project.yml`));
        expect(of('alpha').map((one) => [one.key, one.message])).toEqual([
            ['waiting-on', typeSentence('waiting-on', 'list', TEXT)]
        ]);
        expect(of('beta')).toEqual([]);
    });
});
