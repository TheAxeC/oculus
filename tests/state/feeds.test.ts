// The requested-feed store with a stub endpoint and portfolio-version refreshes.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { feed, refetch } from '../../src/lib/state/feeds.svelte.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';

afterEach(() => vi.unstubAllGlobals());

describe('feed state', () => {
    it('holds the last answer and refetches a fetched kind after a portfolio push', async () => {
        let calls = 0;
        vi.stubGlobal('fetch', (url: string) => {
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
