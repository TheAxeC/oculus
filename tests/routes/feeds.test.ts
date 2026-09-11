// The GET feed route handler over three fixture files in a temporary hub.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleFeeds } from '../../src/lib/server/feeds.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';

function target() {
    const hub = mkdtempSync(join(tmpdir(), 'oculus-feed-route-'));
    mkdirSync(join(hub, 'fixture'), { recursive: true });
    const feeds = {
        radar: 'fixture/radar.yml',
        leads: 'fixture/leads.yml',
        inbox: 'fixture/inbox.yml',
        linkedin: 'fixture/linkedin'
    };
    for (const file of [feeds.radar, feeds.leads, feeds.inbox]) {
        writeFileSync(join(hub, file), 'meta: {}\nentries:\n  - title: One\n');
    }
    return { hub, config: { ...portfolioConfigFrom(loadConfig(engineDir()).config), feeds } };
}

function request(kind: string, origin = 'http://127.0.0.1:8790'): Request {
    return new Request(`http://127.0.0.1:8790/api/feeds?kind=${kind}`, {
        headers: {
            host: '127.0.0.1:8790',
            origin,
            'sec-fetch-site': origin.includes('127.0.0.1') ? 'same-origin' : 'cross-site'
        }
    });
}

describe('the feed endpoint', () => {
    it('answers every known kind', async () => {
        for (const kind of ['radar', 'leads', 'inbox']) {
            const response = handleFeeds(request(kind), target());
            expect(response.status).toBe(200);
            expect(await response.json()).toMatchObject({ ok: true, kind });
        }
    });

    it('answers 400 for an unknown kind and 403 for another origin', () => {
        expect(handleFeeds(request('other'), target()).status).toBe(400);
        expect(handleFeeds(request('radar', 'http://evil.invalid'), target()).status).toBe(403);
    });

    it('answers the configured path and missing marker when the feed is absent', async () => {
        const into = target();
        into.config.feeds.radar = 'fixture/missing.yml';
        const response = handleFeeds(request('radar'), into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            kind: 'radar',
            file: 'fixture/missing.yml',
            missing: true
        });
    });

    it('answers 500 with the configured path and parse reason', async () => {
        const into = target();
        writeFileSync(join(into.hub, into.config.feeds.radar), 'entries: [broken: yaml');
        const response = handleFeeds(request('radar'), into);
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body).toMatchObject({
            kind: 'radar',
            file: 'fixture/radar.yml'
        });
        expect(String(body.error).length).toBeGreaterThan(0);
    });
});
