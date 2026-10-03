// The one rule for which file of the hub a view is drawn from, over the engine's own configuration
// and over configurations that name nothing.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { HUB_ROOT } from '../../../../src/lib/state/sources/fs.ts';
import { viewSourceFile } from '../../../../src/lib/state/sessions/view-source.ts';

const { config } = loadConfig(engineDir());

describe('the file a view is drawn from', () => {
    it('answers each feed kind the path its own configuration key names', () => {
        expect({
            leads: viewSourceFile('leads', config),
            radar: viewSourceFile('radar', config),
            linkedin: viewSourceFile('linkedin', config)
        }).toEqual({
            leads: { root: HUB_ROOT, path: config.leads_file },
            radar: { root: HUB_ROOT, path: config.radar_file },
            linkedin: { root: HUB_ROOT, path: config.linkedin_dir }
        });
    });

    it('answers each registry view the path its own configuration key names', () => {
        expect({
            people: viewSourceFile('people', config),
            venues: viewSourceFile('venues', config),
            datasets: viewSourceFile('datasets', config),
            pillars: viewSourceFile('pillars', config),
            domains: viewSourceFile('domains', config)
        }).toEqual({
            people: { root: HUB_ROOT, path: config.people_file },
            venues: { root: HUB_ROOT, path: config.venues_file },
            datasets: { root: HUB_ROOT, path: config.datasets_file },
            pillars: { root: HUB_ROOT, path: config.pillars_file },
            domains: { root: HUB_ROOT, path: config.domains_file }
        });
    });

    it('answers a collection key the file of its own entry, under the hub root', () => {
        expect(viewSourceFile('collection', config, 'funding')).toEqual({
            root: HUB_ROOT,
            path: 'funding/funding.yml'
        });
        expect(viewSourceFile('collection', config, 'venues')).toEqual({
            root: HUB_ROOT,
            path: 'registries/venues.yml'
        });
    });

    it('answers null for a configuration that names no file, and for an unknown collection', () => {
        expect(viewSourceFile('venues', {})).toBeNull();
        expect(viewSourceFile('datasets', { datasets_file: '  ' })).toBeNull();
        expect(viewSourceFile('pillars', { pillars_file: 12 })).toBeNull();
        expect(viewSourceFile('domains', {})).toBeNull();
        expect(viewSourceFile('radar', {})).toBeNull();
        expect(viewSourceFile('leads', { leads_file: '   ' })).toBeNull();
        expect(viewSourceFile('radar', { radar_file: 12 })).toBeNull();
        expect(viewSourceFile('collection', {}, 'funding')).toBeNull();
        expect(viewSourceFile('collection', config)).toBeNull();
        expect(viewSourceFile('collection', config, 'not-a-collection')).toBeNull();
    });

    it('reads past a collections list holding anything but entries with a key and a file', () => {
        expect(viewSourceFile('collection', { collections: 'one' }, 'funding')).toBeNull();
        expect(
            viewSourceFile(
                'collection',
                {
                    collections: [
                        null,
                        'one',
                        { key: 'funding' },
                        { key: 'funding', file: 'a.yml' }
                    ]
                },
                'funding'
            )
        ).toBeNull();
        expect(
            viewSourceFile(
                'collection',
                { collections: [null, 'one', { key: 'events', file: 'network/events.yml' }] },
                'events'
            )
        ).toEqual({ root: HUB_ROOT, path: 'network/events.yml' });
    });
});

describe('the file a view is drawn from, over a configuration of the wrong shape', () => {
    it('answers nothing for a collections key that is a map, and for a row that is a list', () => {
        expect(
            viewSourceFile('collection', { collections: { key: 'f', file: 'a.yml' } }, 'f')
        ).toBeNull();
        expect(viewSourceFile('collection', { collections: [['f', 'a.yml']] }, 'f')).toBeNull();
    });

    it('answers the file of the first row that carries the key, whether or not the file is a path', () => {
        const rows = [
            { key: 'f', file: 3 },
            { key: 'f', file: 'b.yml' }
        ];
        expect(viewSourceFile('collection', { collections: rows }, 'f')).toBeNull();
        expect(
            viewSourceFile('collection', { collections: [{ key: 'f', file: '' }] }, 'f')
        ).toBeNull();
    });

    it('trims a path, and reads an empty key like any other', () => {
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

    it('answers nothing for a feed path that is a list or null, or that sits behind an own __proto__ key', () => {
        expect(viewSourceFile('leads', { leads_file: ['a'] })).toBeNull();
        expect(viewSourceFile('leads', { leads_file: null })).toBeNull();
        expect(
            viewSourceFile(
                'leads',
                JSON.parse('{"__proto__":{"leads_file":"p"}}') as Record<string, unknown>
            )
        ).toBeNull();
    });
});
