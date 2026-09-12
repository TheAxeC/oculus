// The feed reader and writers over fixture files in a temporary hub, never the real feeds folder.

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    addLead,
    deleteFeedEntry,
    readFeedFile,
    writeFeedField
} from '../../src/lib/server/feeds.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { localDate } from '../../src/lib/data/dates.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { FeedKind, PortfolioConfig } from '../../src/lib/data/model.ts';

const FILES: Record<FeedKind, string> = {
    radar: 'fixture/radar.yml',
    leads: 'fixture/leads.yml',
    inbox: 'fixture/inbox.yml'
};

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

function fixture(): { hub: string; config: PortfolioConfig } {
    const hub = mkdtempSync(join(tmpdir(), 'oculus-feeds-'));
    expect(resolve(hub).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const config = {
        ...portfolioConfigFrom(loadConfig(engineDir()).config),
        feeds: { ...FILES, linkedin: 'fixture/linkedin' }
    };
    for (const [kind, id] of [
        ['radar', 'Paper'],
        ['leads', 'Job'],
        ['inbox', 'mail-1']
    ] as const) {
        const identity = kind === 'inbox' ? 'id' : 'title';
        const file = join(hub, FILES[kind]);
        expect(resolve(file).startsWith(resolve(hub) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        const schema = kind === 'leads' ? LEAD_SCHEMA : '';
        writeFileSync(
            file,
            `meta:\n  last_run: 2026-09-11\n${schema}entries:\n  - ${identity}: "${id}"\n`
        );
    }
    return { hub, config };
}

describe('feed files', () => {
    it('reads radar, leads, and inbox with map entries', () => {
        const into = fixture();
        for (const kind of ['radar', 'leads', 'inbox'] as const) {
            expect(readFeedFile(into.hub, into.config, kind)).toMatchObject({
                kind,
                file: FILES[kind],
                meta: { last_run: '2026-09-11' }
            });
        }
    });

    it('reads the lead file schema with all ten fields and its status options', () => {
        const into = fixture();
        const found = readFeedFile(into.hub, into.config, 'leads');
        expect(found?.schema?.map((field) => field.field)).toEqual([
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
        expect(found?.schema?.find((field) => field.field === 'status')?.options).toEqual([
            'open',
            'applied',
            'declined'
        ]);
    });

    it('returns null for a missing file and throws for invalid YAML or a non-map entry', () => {
        const into = fixture();
        into.config.feeds.radar = 'fixture/missing.yml';
        expect(readFeedFile(into.hub, into.config, 'radar')).toBe(null);
        into.config.feeds.radar = FILES.radar;
        writeFileSync(join(into.hub, FILES.radar), 'entries: [broken: yaml');
        expect(() => readFeedFile(into.hub, into.config, 'radar')).toThrow();
        writeFileSync(join(into.hub, FILES.radar), 'entries: [word]\n');
        expect(() => readFeedFile(into.hub, into.config, 'radar')).toThrow('every entry');
    });
});

describe('feed writes', () => {
    it('adds a lead in schema order with date and status defaults', () => {
        const into = fixture();
        expect(
            addLead(into.hub, into.config, {
                title: 'New role',
                country: 'Belgium',
                focus: 'Clinical AI',
                date: null,
                status: ''
            })
        ).toEqual({ found: true, changed: ['entries'], refused: [] });
        const source = readFileSync(join(into.hub, FILES.leads), 'utf8');
        expect(source).toContain(
            `  - title: New role\n    country: Belgium\n    focus: Clinical AI\n    status: open\n    date: ${localDate(Date.now())}`
        );
    });

    it('refuses a title the file holds already and leaves the feed unchanged', () => {
        const into = fixture();
        const file = join(into.hub, FILES.leads);
        const before = readFileSync(file, 'utf8');
        expect(addLead(into.hub, into.config, { title: 'Job' })).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'title', reason: 'a lead with this title is in the file already' }]
        });
        expect(readFileSync(file, 'utf8')).toBe(before);
    });

    it('refuses a lead without a title and leaves the feed unchanged', () => {
        const into = fixture();
        const file = join(into.hub, FILES.leads);
        const before = readFileSync(file, 'utf8');
        expect(addLead(into.hub, into.config, { title: '   ', status: 'open' })).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'title', reason: 'a lead needs a title' }]
        });
        expect(readFileSync(file, 'utf8')).toBe(before);
    });

    it('uses each feed identity and allows only its field', () => {
        const into = fixture();
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Paper', 'dismissed', true).changed
        ).toEqual(['dismissed']);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Paper', 'dismissed', null).changed
        ).toEqual(['dismissed']);
        expect(readFileSync(join(into.hub, FILES.radar), 'utf8')).not.toContain('dismissed:');
        expect(
            writeFeedField(into.hub, into.config, 'inbox', 'mail-1', 'triaged', true).changed
        ).toEqual(['triaged']);
        expect(
            writeFeedField(into.hub, into.config, 'leads', 'Job', 'status', 'closed').changed
        ).toEqual(['status']);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Paper', 'status', 'closed').refused
        ).toHaveLength(1);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Nobody', 'dismissed', true).found
        ).toBe(false);
    });

    it('deletes leads and refuses deletion from the other feeds', () => {
        const into = fixture();
        expect(deleteFeedEntry(into.hub, into.config, 'leads', 'Job').changed).toEqual(['entries']);
        expect(readFileSync(join(into.hub, FILES.leads), 'utf8')).not.toContain('Job');
        expect(deleteFeedEntry(into.hub, into.config, 'radar', 'Paper').refused).toHaveLength(1);
        expect(deleteFeedEntry(into.hub, into.config, 'inbox', 'mail-1').refused).toHaveLength(1);
    });
});
