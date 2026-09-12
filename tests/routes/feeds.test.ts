// The GET feed route handler over fixture files and a LinkedIn folder in a temporary hub.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleFeeds } from '../../src/lib/server/feeds.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';

const LEAD_SCHEMA = `schema:
  - { field: title, type: text }
  - { field: inst, type: text }
  - { field: country, type: text }
  - { field: typ, type: text }
  - { field: focus, type: textarea }
  - { field: fit, type: textarea }
  - { field: status, type: select, options: [open, applied, declined] }
  - { field: date, type: date }
  - { field: deadline, type: text }
  - { field: url, type: text }
`;

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
        const schema = file === feeds.leads ? LEAD_SCHEMA : '';
        writeFileSync(join(hub, file), `meta: {}\n${schema}entries:\n  - title: One\n`);
    }
    mkdirSync(join(hub, feeds.linkedin), { recursive: true });
    writeFileSync(
        join(hub, feeds.linkedin, '01-post.md'),
        '---\ntitle: "One post"\ndate: 2026-09-01\ncategory: research\n---\n\nBody.\n'
    );
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
        for (const kind of ['radar', 'leads', 'inbox', 'linkedin']) {
            const response = handleFeeds(request(kind), target());
            expect(response.status).toBe(200);
            expect(await response.json()).toMatchObject({ ok: true, kind });
        }
    });

    it('answers LinkedIn entries with the configured cadence', async () => {
        const response = handleFeeds(request('linkedin'), target());
        expect(await response.json()).toMatchObject({
            ok: true,
            kind: 'linkedin',
            cadenceDays: 30,
            entries: [{ file: '01-post.md', title: 'One post', idea: false }]
        });
    });

    it("answers the leads file's schema in its own order", async () => {
        const response = handleFeeds(request('leads'), target());
        const body = await response.json();
        expect(body.schema.map((field: { field: string }) => field.field)).toEqual([
            'title',
            'inst',
            'country',
            'typ',
            'focus',
            'fit',
            'status',
            'date',
            'deadline',
            'url'
        ]);
        expect(body.schema[6].options).toEqual(['open', 'applied', 'declined']);
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

    it('answers an empty LinkedIn list, cadence, and missing marker when its folder is absent', async () => {
        const into = target();
        into.config.feeds.linkedin = 'fixture/missing-linkedin';
        const response = handleFeeds(request('linkedin'), into);
        expect(await response.json()).toEqual({
            ok: true,
            kind: 'linkedin',
            file: 'fixture/missing-linkedin',
            missing: true,
            entries: [],
            cadenceDays: 30
        });
    });

    it('answers the missing marker when linkedin_dir names a regular file', async () => {
        const into = target();
        into.config.feeds.linkedin = 'fixture/not-a-folder';
        writeFileSync(join(into.hub, into.config.feeds.linkedin), 'regular file\n');
        const response = handleFeeds(request('linkedin'), into);
        expect(await response.json()).toEqual({
            ok: true,
            kind: 'linkedin',
            file: 'fixture/not-a-folder',
            missing: true,
            entries: [],
            cadenceDays: 30
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
