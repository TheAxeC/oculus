// The feed reader and writers over fixture files in a temporary hub, never the real feeds folder.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    addLead,
    addLinkedinIdea,
    buildFeeds,
    deleteFeedEntry,
    isLinkedinFile,
    markLinkedinPosted,
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
    inbox: 'fixture/inbox.yml',
    linkedin: 'fixture/linkedin'
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
    const linkedin = join(hub, FILES.linkedin);
    expect(resolve(linkedin).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(linkedin, { recursive: true });
    writeFileSync(
        join(linkedin, '01-A-reflection.md'),
        '---\ntitle: "A quoted title"\ncategory: reflection\ndate: 2026-08-01\n---\n\nPosted body.\n'
    );
    writeFileSync(
        join(linkedin, 'xx-easy-problems.md'),
        '---\ntitle: "Easy problems"\ncategory: research\ndate: 2026-09-12\n---\n\nIdea body.\n'
    );
    writeFileSync(join(linkedin, 'README.md'), 'Not a post.\n');
    writeFileSync(join(linkedin, 'draft-another.md'), 'Not a numbered post.\n');
    writeFileSync(join(linkedin, 'xx-easy-problems.jpeg'), 'image');
    return { hub, config };
}

describe('feed files', () => {
    it('uses one flat post filename rule for both Markdown suffix cases', () => {
        expect(isLinkedinFile('01-post.md')).toBe(true);
        expect(isLinkedinFile('01-post.MD')).toBe(true);
        expect(isLinkedinFile('xx-idea.mD')).toBe(true);
        expect(isLinkedinFile('nested/01-post.md')).toBe(false);
        expect(isLinkedinFile('README.md')).toBe(false);
        expect(isLinkedinFile(null)).toBe(false);
        const into = fixture();
        const file = join(into.hub, FILES.linkedin, '02-upper.MD');
        expect(resolve(file).startsWith(resolve(into.hub) + sep)).toBe(true);
        writeFileSync(file, '---\ntitle: Uppercase\n---\n');
        expect(buildFeeds(into.hub, into.config).linkedin.entries).toContainEqual(
            expect.objectContaining({ file: '02-upper.MD', title: 'Uppercase' })
        );
    });

    it('carries an empty date and category for a post whose front matter names neither', () => {
        const into = fixture();
        const file = join(into.hub, FILES.linkedin, '03-bare.md');
        expect(resolve(file).startsWith(resolve(into.hub) + sep)).toBe(true);
        writeFileSync(file, '---\ntitle: Bare\n---\n\nA body and nothing else.\n');
        const entry = buildFeeds(into.hub, into.config).linkedin.entries.find(
            (one) => one.file === '03-bare.md'
        );
        expect(entry).toMatchObject({ title: 'Bare', date: '', category: '' });
    });

    it('builds one payload with all four feeds', () => {
        const into = fixture();
        const payload = buildFeeds(into.hub, into.config);
        expect(Object.keys(payload)).toEqual(['radar', 'leads', 'inbox', 'linkedin']);
        expect(payload.radar).toMatchObject({
            ok: true,
            kind: 'radar',
            file: FILES.radar,
            entries: [{ title: 'Paper' }]
        });
        expect(payload.linkedin.entries.map((entry) => entry.file)).toEqual([
            '01-A-reflection.md',
            'xx-easy-problems.md'
        ]);
    });

    it('marks a missing feed in the payload without dropping the other feeds', () => {
        const into = fixture();
        into.config.feeds.radar = 'fixture/missing.yml';
        const payload = buildFeeds(into.hub, into.config);
        expect(payload.radar).toMatchObject({
            ok: true,
            kind: 'radar',
            file: 'fixture/missing.yml',
            meta: {},
            entries: [],
            missing: true
        });
        expect(payload.leads.entries).toHaveLength(1);
    });

    it('keeps an unreadable feed error in the payload without dropping the other feeds', () => {
        const into = fixture();
        writeFileSync(join(into.hub, FILES.radar), 'entries: [broken: yaml');
        const payload = buildFeeds(into.hub, into.config);
        expect(payload.radar).toMatchObject({
            ok: true,
            kind: 'radar',
            file: FILES.radar,
            meta: {},
            entries: []
        });
        expect(payload.radar.error).toBeTruthy();
        expect(payload.inbox.entries).toHaveLength(1);
    });

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

    it('scans the LinkedIn folder and strips one pair of title quotes', () => {
        const into = fixture();
        const found = readFeedFile(into.hub, into.config, 'linkedin');
        expect(found).toMatchObject({
            kind: 'linkedin',
            file: FILES.linkedin,
            cadenceDays: 30,
            entries: [
                {
                    file: '01-A-reflection.md',
                    title: 'A quoted title',
                    date: '2026-08-01',
                    category: 'reflection',
                    body: 'Posted body.',
                    idea: false
                },
                {
                    file: 'xx-easy-problems.md',
                    title: 'Easy problems',
                    body: 'Idea body.',
                    idea: true
                }
            ]
        });
        expect(found?.entries.map((entry) => entry.file)).toEqual([
            '01-A-reflection.md',
            'xx-easy-problems.md'
        ]);
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
    it('adds a dated LinkedIn idea with a safe slug and numbered collision suffix', () => {
        const into = fixture();
        expect(addLinkedinIdea(into.hub, into.config, 'Easy problems', 'research')).toEqual({
            found: true,
            changed: ['file'],
            refused: []
        });
        const file = join(into.hub, FILES.linkedin, 'xx-easy-problems-2.md');
        expect(readFileSync(file, 'utf8')).toBe(
            `---\nlayout: post\ntitle: "Easy problems"\ncategory: "research"\npublish: True\ndate: ${localDate(Date.now())}\n---\n\n`
        );
    });

    it('bounds the filename of an idea with a very long title', () => {
        const into = fixture();
        expect(addLinkedinIdea(into.hub, into.config, 'a'.repeat(256), '').refused).toEqual([]);
        const found = readFeedFile(into.hub, into.config, 'linkedin');
        const added = found?.entries.find((entry) => String(entry.title) === 'a'.repeat(256));
        expect(added?.file).toBe(`xx-${'a'.repeat(80)}.md`);
    });

    it('reads an escaped double-quoted title back from a newly written idea', () => {
        const into = fixture();
        expect(
            addLinkedinIdea(into.hub, into.config, 'He said "yes"', 'reflection').refused
        ).toEqual([]);
        const found = readFeedFile(into.hub, into.config, 'linkedin');
        expect(found?.entries.find((entry) => entry.file === 'xx-he-said-yes.md')).toMatchObject({
            title: 'He said "yes"',
            category: 'reflection',
            idea: true
        });
    });

    it('promotes an idea past 01-A and moves its same-basename sidecar', () => {
        const into = fixture();
        expect(markLinkedinPosted(into.hub, into.config, 'xx-easy-problems.md')).toEqual({
            found: true,
            changed: ['file'],
            refused: []
        });
        const folder = join(into.hub, FILES.linkedin);
        expect(existsSync(join(folder, '02-easy-problems.md'))).toBe(true);
        expect(existsSync(join(folder, '02-easy-problems.jpeg'))).toBe(true);
        expect(existsSync(join(folder, 'xx-easy-problems.md'))).toBe(false);
        expect(existsSync(join(folder, 'xx-easy-problems.jpeg'))).toBe(false);
    });

    it('refuses missing titles, non-idea names, missing ideas, and paths outside the hub', () => {
        const into = fixture();
        expect(addLinkedinIdea(into.hub, into.config, '   ', 'research').refused).toEqual([
            { field: 'title', reason: 'a LinkedIn idea needs a title' }
        ]);
        expect(markLinkedinPosted(into.hub, into.config, '01-A-reflection.md').refused).toEqual([
            { field: 'file', reason: 'a LinkedIn post must name an xx-*.md idea' }
        ]);
        expect(markLinkedinPosted(into.hub, into.config, '../xx-easy-problems.md').refused).toEqual(
            [{ field: 'file', reason: 'a LinkedIn post must name an xx-*.md idea' }]
        );
        expect(markLinkedinPosted(into.hub, into.config, 'xx-missing.md').found).toBe(false);
        into.config.feeds.linkedin = '../outside';
        expect(addLinkedinIdea(into.hub, into.config, 'Outside', 'research').found).toBe(false);
        expect(existsSync(resolve(into.hub, '../outside', 'xx-outside.md'))).toBe(false);
    });

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
