// The requested-feed store with a stub endpoint and portfolio-version refreshes.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { feed, refetch } from '../../src/lib/state/feeds.svelte.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { attention } from '../../src/lib/state/feeds.ts';
import { NO_FEEDS } from '../entities-fixture.ts';
import type { Project, Snapshot } from '../../src/lib/data/model.ts';

afterEach(() => vi.unstubAllGlobals());

describe('feed state', () => {
    it("keeps the leads file's schema on the fetched state", async () => {
        const schema = [
            { field: 'title', type: 'text' },
            { field: 'status', type: 'select', options: ['open', 'applied', 'declined'] }
        ];
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        ok: true,
                        kind: 'leads',
                        file: 'feeds/leads.yml',
                        meta: {},
                        schema,
                        entries: []
                    })
                )
            )
        );
        await refetch('leads');
        expect(feed('leads')?.schema).toEqual(schema);
    });

    it('holds the last answer and refetches a fetched kind after a portfolio push', async () => {
        let calls = 0;
        vi.stubGlobal('fetch', (url: string) => {
            if (!url.includes('kind=radar')) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            ok: true,
                            kind: 'leads',
                            file: 'feeds/leads.yml',
                            meta: {},
                            entries: []
                        })
                    )
                );
            }
            calls += 1;
            expect(url).toBe('/api/feeds?kind=radar');
            return Promise.resolve(
                new Response(
                    JSON.stringify({
                        ok: true,
                        kind: 'radar',
                        file: 'feeds/radar.yml',
                        meta: { last_run: `run-${calls}` },
                        entries: [{ title: `Paper ${calls}` }]
                    })
                )
            );
        });
        receive({ channel: 'portfolio', version: 101, payload: { version: 101 } });
        await refetch('radar');
        expect(feed('radar')?.entries[0].title).toBe('Paper 1');
        receive({ channel: 'portfolio', version: 102, payload: { version: 102 } });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(feed('radar')?.entries[0].title).toBe('Paper 2');
    });

    it('queues a portfolio version that arrives while the kind is in flight', async () => {
        let leadCalls = 0;
        let release: (() => void) | undefined;
        vi.stubGlobal('fetch', (url: string) => {
            if (!url.includes('kind=leads')) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            ok: true,
                            kind: 'radar',
                            file: 'feeds/radar.yml',
                            meta: {},
                            entries: []
                        })
                    )
                );
            }
            leadCalls += 1;
            const response = () =>
                new Response(
                    JSON.stringify({
                        ok: true,
                        kind: 'leads',
                        file: 'feeds/leads.yml',
                        meta: {},
                        entries: [{ title: `Lead ${leadCalls}` }]
                    })
                );
            if (leadCalls > 1) return Promise.resolve(response());
            return new Promise<Response>((resolve) => {
                release = () => resolve(response());
            });
        });

        const first = refetch('leads');
        await Promise.resolve();
        receive({ channel: 'portfolio', version: 103, payload: { version: 103 } });
        expect(leadCalls).toBe(1);
        release?.();
        await first;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(leadCalls).toBe(2);
        expect(feed('leads')?.entries[0].title).toBe('Lead 2');
    });

    it('keeps the configured path and reason from an endpoint error', async () => {
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        error: 'bad YAML',
                        kind: 'inbox',
                        file: 'feeds/inbox.yml'
                    }),
                    { status: 500 }
                )
            )
        );
        await refetch('inbox');
        expect(feed('inbox')).toMatchObject({
            file: 'feeds/inbox.yml',
            error: 'bad YAML'
        });
    });
});

describe('attention lines', () => {
    function paper(id: string, venueId: string): Project {
        return {
            id,
            tier: 'active',
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
            programIds: [],
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
                programs: {},
                domains: {},
                funding: {},
                collections: {}
            },
            relations: {
                projectVenue: [],
                projectFunding: [],
                projectDataset: [],
                projectProgram: [],
                projectDomain: [],
                projectRelated: [],
                fundingProgram: []
            },
            findings: []
        };
        expect(attention(snapshot, { venue_conc_warn: 1 }, Date.now())).toEqual([
            { kind: 'venue', id: 'journal', count: 1, label: 'JN' },
            { kind: 'venue', id: 'journal-two', count: 1, label: 'JN' }
        ]);
    });
});
