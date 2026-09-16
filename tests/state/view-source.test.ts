// The one rule for which file of the hub a view is drawn from, over the engine's own configuration
// and over configurations that name nothing.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { HUB_ROOT } from '../../src/lib/state/collection.ts';
import { viewSourceFile } from '../../src/lib/state/view-source.ts';

const { config } = loadConfig(engineDir());

describe('the file a view is drawn from', () => {
    it('answers each feed kind the path its own configuration key names', () => {
        expect({
            inbox: viewSourceFile('inbox', config),
            leads: viewSourceFile('leads', config),
            radar: viewSourceFile('radar', config),
            linkedin: viewSourceFile('linkedin', config)
        }).toEqual({
            inbox: { root: HUB_ROOT, path: config.inbox_file },
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
        expect(viewSourceFile('inbox', {})).toBeNull();
        expect(viewSourceFile('venues', {})).toBeNull();
        expect(viewSourceFile('datasets', { datasets_file: '  ' })).toBeNull();
        expect(viewSourceFile('pillars', { pillars_file: 12 })).toBeNull();
        expect(viewSourceFile('domains', {})).toBeNull();
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
