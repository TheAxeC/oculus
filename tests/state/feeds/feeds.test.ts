// The feed reader over the latest complete socket payload, plus feed-summary attention lines.

import { beforeEach, describe, expect, it } from 'vitest';
import { attention, refresh, staleAfter } from '../../../src/lib/state/feeds/feeds.ts';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import type { Feeds, FeedsPayload, Project, Snapshot } from '../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let feed: ClientState['feeds']['feed'];
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ feed } = client.feeds);
    ({ receive } = client.entities);
});

describe('feed state', () => {
    it('is null before the first feeds message', () => {
        expect(feed('radar')).toBe(null);
    });

    it('reads every kind and its schema from one received feeds message', () => {
        const schema = [
            { field: 'title', type: 'text' },
            { field: 'status', type: 'select', options: ['open', 'applied', 'declined'] }
        ];
        const payload: FeedsPayload = {
            radar: {
                ok: true,
                kind: 'radar',
                file: 'feeds/radar.yml',
                meta: {},
                entries: [{ title: 'Paper' }]
            },
            leads: {
                ok: true,
                kind: 'leads',
                file: 'feeds/leads.yml',
                meta: {},
                schema,
                entries: [{ title: 'Lead' }]
            },
            linkedin: {
                ok: true,
                kind: 'linkedin',
                file: 'theaxec.github.io/_linkedin',
                meta: {},
                entries: [{ file: 'xx-post.md' }],
                cadenceDays: 30
            }
        };
        receive({ channel: 'feeds', version: 1, payload });
        expect(feed('radar')?.entries[0].title).toBe('Paper');
        expect(feed('leads')?.schema).toEqual(schema);
        expect(feed('linkedin')?.cadenceDays).toBe(30);
    });
});

describe('attention lines', () => {
    function paper(id: string, venueId: string): Project {
        return {
            id,
            tier: 'active',
            ghost: false,
            title: id,
            chips: [],
            results: [],
            ideas: [],
            waitingOn: [],
            followups: [],
            subtasks: [],
            relatedIds: [],
            fundingIds: [],
            datasetIds: [],
            pillarIds: [],
            domainIds: [],
            collaborators: [],
            docs: [],
            folder: `projects/active/${id}`,
            file: `/hub/projects/active/${id}/project.yml`,
            venueId
        };
    }

    it('carries registry ids and keeps two venues with one label separate', () => {
        const snapshot: Snapshot = {
            version: 1,
            entities: {
                feeds: NO_FEEDS,
                career: null,
                projects: {
                    first: paper('first', 'journal'),
                    second: paper('second', 'journal-two')
                },
                venues: {
                    journal: { id: 'journal', name: 'Journal Name', short: 'JN', themes: [] },
                    'journal-two': {
                        id: 'journal-two',
                        name: 'Other Journal',
                        short: 'JN',
                        themes: []
                    }
                },
                datasets: {},
                pillars: {},
                domains: {},
                funding: {},
                people: {},
                organisations: {},
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
        expect(attention(snapshot, { venue_conc_warn: 1 }, Date.now(), 0)).toEqual([
            { kind: 'venue', id: 'journal', count: 1, label: 'JN' },
            { kind: 'venue', id: 'journal-two', count: 1, label: 'JN' }
        ]);
    });
});

describe('the refresh thresholds', () => {
    const now = Date.UTC(2026, 8, 11, 12);

    /** `refresh` reads the feeds of a snapshot and nothing else, so a case hands it those alone. */
    function holding(feeds: Feeds): Snapshot {
        return { entities: { feeds } } as unknown as Snapshot;
    }

    const old = holding({
        ...NO_FEEDS,
        radar: { lastRun: '2020-01-01' },
        scout: { lastRun: '2020-01-01' }
    });
    const radarNeverRun = holding({ ...NO_FEEDS, radar: { lastRun: null } });

    it('takes a feed its threshold from refresh_stale_days and none from anywhere else', () => {
        const only = { refresh_stale_days: { inbox: 2 } };
        expect(staleAfter(only, 'inbox')).toBe(2);
        expect(staleAfter({}, 'scout')).toBe(Infinity);
        expect(staleAfter({ refresh_stale_days: { scout: 'soon' } }, 'scout')).toBe(Infinity);
        expect(staleAfter({ ...only, stale_days: { inbox: 30, litwatch: 14 } }, 'inbox')).toBe(2);
    });

    it('never nudges a feed that the key does not name', () => {
        const only = { refresh_stale_days: { inbox: 2 } };
        expect(staleAfter(only, 'litwatch')).toBe(Infinity);
        expect(staleAfter({ ...only, stale_days: { litwatch: 14 } }, 'litwatch')).toBe(Infinity);
    });

    it('nudges only the feeds the key names, however old the others are', () => {
        const nudged = refresh(old, { refresh_stale_days: { scout: 7 } }, now, '2020-01-01');
        expect(nudged.map((one) => one.feed)).toEqual(['scout']);
    });

    it('nudges a radar that has never run when the key names litwatch', () => {
        const nudged = refresh(radarNeverRun, { refresh_stale_days: { litwatch: 14 } }, now, null);
        expect(nudged).toEqual([{ feed: 'litwatch', days: null }]);
    });

    it('leaves a radar that has never run alone when the key does not name litwatch', () => {
        const nudged = refresh(radarNeverRun, { refresh_stale_days: { scout: 7 } }, now, null);
        expect(nudged).toEqual([]);
    });
});

describe('the thresholds of a config whose values are of the wrong type', () => {
    const now = Date.UTC(2026, 8, 11, 12);

    it.each([
        [{ refresh_stale_days: { inbox: 3 } }, 3],
        [{ refresh_stale_days: { inbox: -2 } }, -2],
        [{ refresh_stale_days: { inbox: 0 } }, 0],
        [{ refresh_stale_days: { inbox: '3' } }, Infinity],
        [{ refresh_stale_days: { inbox: Infinity } }, Infinity],
        [{ refresh_stale_days: { inbox: -Infinity } }, Infinity],
        [{ refresh_stale_days: { inbox: NaN } }, Infinity],
        [{ refresh_stale_days: { inbox: [3] } }, Infinity],
        [{ refresh_stale_days: { inbox: null } }, Infinity],
        [{ refresh_stale_days: [] }, Infinity],
        [{ refresh_stale_days: null }, Infinity],
        [{ refresh_stale_days: 'inbox' }, Infinity],
        [{ refresh_stale_days: { scout: 3 } }, Infinity],
        [JSON.parse('{"refresh_stale_days":{"__proto__":4,"inbox":2}}'), 2]
    ])('reads the limit of the inbox feed from %j as %j', (config, limit) => {
        expect(staleAfter(config as Record<string, unknown>, 'inbox')).toBe(limit);
    });

    it('nudges a feed whose limit is a finite number the feed is past, and never one given as text', () => {
        const radar = { entities: { feeds: { ...NO_FEEDS, radar: { lastRun: '2026-09-01' } } } };
        const held = radar as unknown as Snapshot;
        const nudged = (limit: unknown): string[] =>
            refresh(held, { refresh_stale_days: { litwatch: limit } }, now, null).map(
                (one) => one.feed
            );
        expect(nudged(3)).toEqual(['litwatch']);
        expect(nudged(0)).toEqual(['litwatch']);
        expect(nudged(-2)).toEqual(['litwatch']);
        expect(nudged(30)).toEqual([]);
        for (const limit of ['3', Infinity, NaN, [3], null]) expect(nudged(limit)).toEqual([]);
    });

    /** `attention` reads the feeds, the projects and the venues of a snapshot and nothing else. */
    function holding(venued: number): Snapshot {
        const projects = Object.fromEntries(
            Array.from({ length: venued }, (_, at) => [
                `p${at}`,
                { id: `p${at}`, tier: 'active', venueId: 'journal' }
            ])
        );
        const venues = { journal: { id: 'journal', name: 'Journal', short: 'J', themes: [] } };
        const feeds = { ...NO_FEEDS, linkedin: { lastPost: '2026-08-01' } };
        return { entities: { feeds, projects, venues } } as unknown as Snapshot;
    }
    const kinds = (config: Record<string, unknown>, venued: number): string[] =>
        attention(holding(venued), config, now, 0).map((one) => one.kind);

    it('counts the days since the last post against the cadence only when it is a finite number', () => {
        expect(kinds({}, 0)).toEqual(['linkedin']);
        expect(kinds({ linkedin_cadence_days: 45 }, 0)).toEqual([]);
        expect(kinds({ linkedin_cadence_days: 41 }, 0)).toEqual([]);
        expect(kinds({ linkedin_cadence_days: 40 }, 0)).toEqual(['linkedin']);
        for (const cadence of ['45', Infinity, NaN, [45], null]) {
            expect(kinds({ linkedin_cadence_days: cadence }, 0)).toEqual(['linkedin']);
        }
    });

    it('warns of a venue at the limit only when the limit is a finite number', () => {
        expect(kinds({}, 3)).toEqual(['linkedin']);
        expect(kinds({}, 4)).toEqual(['linkedin', 'venue']);
        expect(kinds({ venue_conc_warn: 2 }, 3)).toEqual(['linkedin', 'venue']);
        expect(kinds({ venue_conc_warn: 6 }, 5)).toEqual(['linkedin']);
        for (const warn of ['2', Infinity, NaN, [2], null]) {
            expect(kinds({ venue_conc_warn: warn }, 3)).toEqual(['linkedin']);
            expect(kinds({ venue_conc_warn: warn }, 4)).toEqual(['linkedin', 'venue']);
        }
    });
});
