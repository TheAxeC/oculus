// What the portfolio watcher watches, as pure arithmetic over a config and a list of roots: which
// file names are relevant, which files the config names, and which directories are opened. Nothing
// is read or written outside temporary directories.

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    namedByConfig,
    relevant,
    watchedDirectories
} from '../../../../../src/lib/server/root/watch/portfolio.ts';

describe('relevant', () => {
    it('takes a yaml file outside every code and attic folder', () => {
        expect(relevant('active/loewner/project.yml')).toBe(true);
        expect(relevant('venues.yml')).toBe(true);
        expect(relevant('active/loewner/code/results.yml')).toBe(false);
        expect(relevant('archive/nogo/thing/attic/old.yml')).toBe(false);
        expect(relevant('active/loewner/.project.yml.swp')).toBe(false);
        expect(relevant(null)).toBe(false);
    });

    it('takes the documents and folders the audit scan reads off the disk', () => {
        expect(relevant('active/loewner/README.md')).toBe(true);
        expect(relevant('active/loewner/PRESENT.md')).toBe(true);
        expect(relevant('active/loewner/DATA.md')).toBe(true);
        expect(relevant('active/loewner/IDEA.md')).toBe(true);
        expect(relevant('active/loewner/notes/METHOD_NOTES.md')).toBe(true);
        expect(relevant('active/loewner/paper')).toBe(true);
        expect(relevant('active/loewner/paper/main.tex')).toBe(true);
    });

    it('takes the deposit README and nothing else out of a code folder', () => {
        expect(relevant('active/loewner/code/README.md')).toBe(true);
        expect(relevant('active/loewner/code/train.py')).toBe(false);
        expect(relevant('active/loewner/code/notes/README.md')).toBe(false);
        expect(relevant('active/loewner/attic/README.md')).toBe(false);
    });

    it('leaves a document the audit does not read alone', () => {
        expect(relevant('active/loewner/NOTES.md')).toBe(false);
        expect(relevant('active/loewner/manuscript/main.tex')).toBe(false);
    });

    it('takes a PRESENT.md, whose front matter is in the snapshot, and no other markdown', () => {
        expect(relevant('active/loewner/PRESENT.md')).toBe(true);
        expect(relevant('active/loewner/code/PRESENT.md')).toBe(false);
        expect(relevant('active/loewner/present.md')).toBe(false);
        expect(relevant('active/loewner/NOTES.md')).toBe(false);
    });
});

describe('namedByConfig', () => {
    const config = {
        scan: [{ dir: 'projects/active' }],
        feeds: {
            leads: 'feeds/position-leads.yml',
            radar: 'feeds/literature-radar.yml',
            linkedin: 'site/_linkedin'
        },
        linkedinCadenceDays: 30,
        career: 'registries/career.yml',
        registries: {
            venues: 'registries/venues.yml',
            datasets: 'registries/data.yml',
            pillars: 'registries/pillars.yml',
            domains: 'registries/domains.yml',
            funding: 'funding/funding.yml',
            people: 'registries/people.yml',
            organisations: 'registries/organisations.yml',
            resources: 'registries/resources.yml'
        },
        collections: [{ key: 'events', file: 'network/events.yml' }],
        schema: undefined,
        vocab: { types: [], statuses: [] },
        deck: undefined,
        deckFile: '/hub/config/present.yml',
        text: {}
    };

    it('names a manifest, a PRESENT.md and what the audit reads under a scan tier', () => {
        const named = namedByConfig('/hub', config);
        expect(named(join('/hub', 'projects/active/loewner/project.yml'))).toBe(true);
        expect(named(join('/hub', 'projects/active/loewner/PRESENT.md'))).toBe(true);
        expect(named(join('/hub', 'projects/ideas/other/PRESENT.md'))).toBe(false);
        expect(named(join('/hub', 'projects/active/loewner/README.md'))).toBe(true);
        expect(named(join('/hub', 'projects/active/loewner/code/README.md'))).toBe(true);
        expect(named(join('/hub', 'projects/active/loewner/paper'))).toBe(true);
        expect(named(join('/hub', 'registries/venues.yml'))).toBe(true);
    });

    it('names no document of the hub above a tier, and none the audit does not read', () => {
        const named = namedByConfig('/hub', config);
        expect(named(join('/hub', 'README.md'))).toBe(false);
        expect(named(join('/hub', 'projects/ideas/other/README.md'))).toBe(false);
        expect(named(join('/hub', 'projects/active/loewner/NOTES.md'))).toBe(false);
    });

    it('names the manifest of a root in its .oculus folder and nothing else of the root', () => {
        const named = namedByConfig('/hub', config, [{ key: 'tool', dir: '/work/tool' }]);
        expect(named(join('/work/tool', '.oculus/project.yml'))).toBe(true);
        expect(named(join('/work/tool', '.oculus/other.yml'))).toBe(false);
        expect(named(join('/work/tool', 'project.yml'))).toBe(false);
        expect(named(join('/work/tool', 'README.md'))).toBe(false);
        expect(named(join('/work/other', '.oculus/project.yml'))).toBe(false);
        // With no root given the same path is no manifest of the build.
        expect(namedByConfig('/hub', config)(join('/work/tool', '.oculus/project.yml'))).toBe(
            false
        );
    });
});

describe('watchedDirectories', () => {
    it('names every scan tier and the folder of every registry, collection and feed file', () => {
        const dirs = watchedDirectories('/hub', {
            scan: [{ dir: 'projects/active' }],
            feeds: {
                leads: 'feeds/position-leads.yml',
                radar: 'feeds/literature-radar.yml',
                linkedin: 'theaxec.github.io/_linkedin'
            },
            linkedinCadenceDays: 30,
            career: 'registries/career.yml',
            registries: {
                venues: 'registries/venues.yml',
                datasets: 'registries/data.yml',
                pillars: 'registries/pillars.yml',
                domains: 'registries/domains.yml',
                funding: 'funding/funding.yml',
                people: 'registries/people.yml',
                organisations: 'registries/organisations.yml',
                resources: 'registries/resources.yml'
            },
            collections: [{ key: 'events', file: 'network/events.yml' }],
            schema: undefined,
            vocab: { types: [], statuses: [] },
            deck: undefined,
            deckFile: '/hub/config/present.yml',
            text: {}
        });
        expect(dirs.sort()).toEqual([
            join('/hub', 'feeds'),
            join('/hub', 'funding'),
            join('/hub', 'network'),
            join('/hub', 'projects/active'),
            join('/hub', 'registries'),
            join('/hub', 'theaxec.github.io/_linkedin')
        ]);
    });

    it('names the .oculus folder of every root once, however many keys reach one directory', () => {
        const config = {
            scan: [{ dir: 'projects/active' }],
            feeds: { leads: 'feeds/a.yml', radar: 'feeds/b.yml', linkedin: 'site/_linkedin' },
            linkedinCadenceDays: 30,
            career: 'registries/career.yml',
            registries: {
                venues: 'registries/venues.yml',
                datasets: 'registries/data.yml',
                pillars: 'registries/pillars.yml',
                domains: 'registries/domains.yml',
                funding: 'funding/funding.yml',
                people: 'registries/people.yml',
                organisations: 'registries/organisations.yml',
                resources: 'registries/resources.yml'
            },
            collections: [],
            schema: undefined,
            vocab: { types: [], statuses: [] },
            deck: undefined,
            deckFile: '/hub/config/present.yml',
            text: {}
        };
        const roots = [
            { key: 'tool', dir: '/work/tool' },
            { key: 'again', dir: '/work/tool' },
            { key: 'other', dir: '/work/other' }
        ];
        const dirs = watchedDirectories('/hub', config, roots);
        expect(dirs.filter((dir) => dir.endsWith('.oculus')).sort()).toEqual([
            join('/work/other', '.oculus'),
            join('/work/tool', '.oculus')
        ]);
        expect(watchedDirectories('/hub', config).some((dir) => dir.endsWith('.oculus'))).toBe(
            false
        );
    });
});
