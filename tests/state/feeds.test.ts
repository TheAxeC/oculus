// The feed reader over the latest complete socket payload, plus feed-summary attention lines.

import { beforeEach, describe, expect, it } from 'vitest';
import { attention } from '../../src/lib/state/feeds.ts';
import { NO_FEEDS } from '../entities-fixture.ts';
import type { FeedsPayload, Project, Snapshot } from '../../src/lib/data/model.ts';
import { createClientState, type ClientState } from '../client.ts';

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
            inbox: {
                ok: true,
                kind: 'inbox',
                file: 'feeds/inbox.yml',
                meta: {},
                entries: [{ id: 'mail' }]
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
        expect(feed('inbox')?.entries[0].id).toBe('mail');
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
        expect(attention(snapshot, { venue_conc_warn: 1 }, Date.now())).toEqual([
            { kind: 'venue', id: 'journal', count: 1, label: 'JN' },
            { kind: 'venue', id: 'journal-two', count: 1, label: 'JN' }
        ]);
    });
});
