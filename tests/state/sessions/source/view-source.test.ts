// Layer 2, client-state tests. The rule for which file of the hub a view is drawn from, over the
// engine's own configuration and over configurations that name nothing or are of the wrong shape.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { HUB_ROOT } from '../../../../src/lib/state/sources/fs.ts';
import { viewSourceFile } from '../../../../src/lib/state/sessions/view-source.ts';

const { config } = loadConfig(engineDir());

describe('the file a view is drawn from', () => {
    it.each([
        ['leads', 'leads_file'],
        ['radar', 'radar_file'],
        ['linkedin', 'linkedin_dir'],
        ['people', 'people_file'],
        ['venues', 'venues_file'],
        ['datasets', 'datasets_file'],
        ['pillars', 'pillars_file'],
        ['domains', 'domains_file']
    ] as const)('answers the %s view the path its configuration key %s names', (kind, key) => {
        expect(viewSourceFile(kind, config)).toEqual({ root: HUB_ROOT, path: config[key] });
    });

    it('answers a collection key the file of the entry that carries it, reading past other rows', () => {
        expect(
            viewSourceFile(
                'collection',
                { collections: [null, 'one', { key: 'events', file: 'network/events.yml' }] },
                'events'
            )
        ).toEqual({ root: HUB_ROOT, path: 'network/events.yml' });
    });

    it.each([
        ['no collections list', {}, 'funding'],
        ['no key asked for', { collections: [{ key: 'f', file: 'a.yml' }] }, undefined],
        ['a key no entry carries', { collections: [{ key: 'f', file: 'a.yml' }] }, 'g'],
        ['a collections list that is a string', { collections: 'one' }, 'f'],
        ['a collections key that is a map', { collections: { key: 'f', file: 'a.yml' } }, 'f'],
        ['a row that is a list', { collections: [['f', 'a.yml']] }, 'f'],
        ['an entry with no file', { collections: [null, 'one', { key: 'f' }] }, 'f'],
        ['an entry whose file is an empty string', { collections: [{ key: 'f', file: '' }] }, 'f'],
        [
            'a first entry whose file is not a path, before one that is',
            {
                collections: [
                    { key: 'f', file: 3 },
                    { key: 'f', file: 'b.yml' }
                ]
            },
            'f'
        ]
    ])('answers null for a collection with %s', (_name, held, key) => {
        expect(viewSourceFile('collection', held, key)).toBeNull();
    });

    it.each([
        ['a feed with no key', {}],
        ['a blank feed path', { leads_file: '   ' }],
        ['a feed path that is a number', { leads_file: 12 }],
        ['a feed path that is a list', { leads_file: ['a'] }],
        ['a feed path that is null', { leads_file: null }],
        ['a feed path behind an own __proto__ key', JSON.parse('{"__proto__":{"leads_file":"p"}}')]
    ] as [string, Record<string, unknown>][])('answers null for %s', (_name, held) => {
        expect(viewSourceFile('leads', held)).toBeNull();
    });

    it('trims a path, and reads an empty collection key like any other', () => {
        expect(
            viewSourceFile('collection', { collections: [{ key: 'f', file: ' a.yml ' }] }, 'f')
        ).toEqual({ root: HUB_ROOT, path: 'a.yml' });
        expect(
            viewSourceFile('collection', { collections: [{ key: '', file: 'z.yml' }] }, '')
        ).toEqual({ root: HUB_ROOT, path: 'z.yml' });
        expect(viewSourceFile('leads', { leads_file: ' a.yml ' })).toEqual({
            root: HUB_ROOT,
            path: 'a.yml'
        });
    });
});
