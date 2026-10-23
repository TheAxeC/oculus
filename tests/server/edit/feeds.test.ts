// The feed writers over fixture files in a temporary hub, never the real feeds folder.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { describe, expect } from 'vitest';
import {
    addLead,
    addLinkedinIdea,
    addRadarEntry,
    deleteFeedEntry,
    markLinkedinPosted,
    writeFeedField
} from '../../../src/lib/server/edit/feeds/feeds.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { localDate } from '../../../src/lib/data/helpers/dates.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import type { FeedKind, PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const FILES: Record<FeedKind, string> = {
    radar: 'fixture/radar.yml',
    leads: 'fixture/leads.yml',
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

/** The checkout's configuration, read once: every case builds its own copy over it. */
let base: PortfolioConfig | undefined;

function fixture(): { hub: string; config: PortfolioConfig } {
    const hub = scratchDir('oculus-feeds-');
    base ??= portfolioConfigFrom(loadConfig(engineDir()).config);
    const config = { ...base, feeds: { ...FILES, linkedin: 'fixture/linkedin' } };
    for (const [kind, id] of [
        ['radar', 'Paper'],
        ['leads', 'Job']
    ] as const) {
        const identity = 'title';
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

describe('feed writes', () => {
    it(
        'adds a dated LinkedIn idea with a safe slug and numbered collision suffix',
        { tags: ['slow'] },
        () => {
            const into = fixture();
            const made = join(into.hub, FILES.linkedin, 'xx-easy-problems-2.md');
            expect(addLinkedinIdea(into.hub, into.config, 'Easy problems', 'research')).toEqual({
                found: true,
                changed: ['file'],
                refused: [],
                id: 'xx-easy-problems-2.md',
                records: [
                    {
                        file: made,
                        key: 'xx-easy-problems-2.md',
                        field: 'entries',
                        before: null,
                        after: { title: 'Easy problems', category: 'research' },
                        undo: 'none'
                    }
                ]
            });
            const file = made;
            expect(readFileSync(file, 'utf8')).toBe(
                `---\nlayout: post\ntitle: "Easy problems"\ncategory: "research"\npublish: True\ndate: ${localDate(Date.now())}\n---\n\n`
            );
        }
    );

    it('promotes an idea past 01-A and moves its same-basename sidecar', () => {
        const into = fixture();
        const folder = join(into.hub, FILES.linkedin);
        expect(markLinkedinPosted(into.hub, into.config, 'xx-easy-problems.md')).toEqual({
            found: true,
            changed: ['file'],
            refused: [],
            records: [
                {
                    file: join(folder, '02-easy-problems.md'),
                    key: 'xx-easy-problems.md',
                    field: 'entries',
                    before: ['xx-easy-problems.jpeg', 'xx-easy-problems.md'],
                    after: ['02-easy-problems.jpeg', '02-easy-problems.md'],
                    undo: 'none'
                }
            ]
        });
        expect(existsSync(join(folder, '02-easy-problems.md'))).toBe(true);
        expect(existsSync(join(folder, '02-easy-problems.jpeg'))).toBe(true);
        expect(existsSync(join(folder, 'xx-easy-problems.md'))).toBe(false);
        expect(existsSync(join(folder, 'xx-easy-problems.jpeg'))).toBe(false);
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
        ).toEqual({
            found: true,
            changed: ['entries'],
            refused: [],
            id: 'New role',
            records: [
                {
                    file: join(into.hub, FILES.leads),
                    key: 'New role',
                    field: 'entries',
                    before: null,
                    after: {
                        title: 'New role',
                        country: 'Belgium',
                        focus: 'Clinical AI',
                        status: 'open',
                        date: localDate(Date.now())
                    },
                    undo: 'create'
                }
            ]
        });
        const source = readFileSync(join(into.hub, FILES.leads), 'utf8');
        expect(source).toContain(
            `  - title: New role\n    country: Belgium\n    focus: Clinical AI\n    status: open\n    date: ${localDate(Date.now())}`
        );
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
            writeFeedField(into.hub, into.config, 'leads', 'Job', 'status', 'applied').changed
        ).toEqual(['status']);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Paper', 'status', 'closed').refused
        ).toHaveLength(1);
        expect(
            writeFeedField(into.hub, into.config, 'radar', 'Nobody', 'dismissed', true).found
        ).toBe(false);
    });

    it('writes the fields the feed file schema names and holds each to its type', () => {
        const into = fixture();
        const write = (field: string, value: string | number | boolean | null) =>
            writeFeedField(into.hub, into.config, 'leads', 'Job', field, value);
        expect(write('fit', 'a close fit').changed).toEqual(['fit']);
        expect(write('country', 'NL').changed).toEqual(['country']);
        expect(readFileSync(join(into.hub, FILES.leads), 'utf8')).toContain(
            '  - title: "Job"\n    fit: a close fit\n    country: NL\n'
        );
        expect(write('status', 'closed')).toMatchObject({
            changed: [],
            refused: [
                {
                    field: 'status',
                    reason: words(
                        into.config.text,
                        'server.entries.type_options',
                        'status',
                        'open, applied, declined'
                    )
                }
            ]
        });
        expect(write('date', 'tomorrow').refused).toHaveLength(1);
        expect(write('title', 'Another').refused).toEqual([
            {
                field: 'title',
                reason: words(into.config.text, 'server.feeds.field_not_allowed', 'leads')
            }
        ]);
        expect(write('invented', 'x').refused).toEqual([
            {
                field: 'invented',
                reason: words(into.config.text, 'server.feeds.field_not_allowed', 'leads')
            }
        ]);
    });

    it(
        'deletes leads and papers and refuses deletion of a LinkedIn idea',
        { tags: ['slow'] },
        () => {
            const into = fixture();
            expect(deleteFeedEntry(into.hub, into.config, 'leads', 'Job').changed).toEqual([
                'entries'
            ]);
            expect(readFileSync(join(into.hub, FILES.leads), 'utf8')).not.toContain('Job');
            expect(deleteFeedEntry(into.hub, into.config, 'radar', 'Paper').changed).toEqual([
                'entries'
            ]);
            expect(readFileSync(join(into.hub, FILES.radar), 'utf8')).not.toContain('Paper');
            expect(
                deleteFeedEntry(into.hub, into.config, 'linkedin', 'xx-easy-problems.md').refused
            ).toHaveLength(1);
        }
    );

    it('refuses a write and a deletion of an entry whose title another entry shares', () => {
        const into = fixture();
        const file = join(into.hub, FILES.leads);
        writeFileSync(file, readFileSync(file, 'utf8') + '  - title: "Job"\n');
        const before = readFileSync(file, 'utf8');
        const shared = words(into.config.text, 'server.entries.shared_identity', 'title', 'Job');
        expect(writeFeedField(into.hub, into.config, 'leads', 'Job', 'fit', 'x').refused).toEqual([
            { field: 'title', reason: shared }
        ]);
        expect(deleteFeedEntry(into.hub, into.config, 'leads', 'Job').refused).toEqual([
            { field: 'title', reason: shared }
        ]);
        expect(readFileSync(file, 'utf8')).toBe(before);
    });
});

describe('Lit Watch writes', () => {
    const BUCKETS = ['preemption', 'idea', 'cite_baseline', 'adjacent'];
    const HEAD = 'meta:\n  last_run: 2026-09-27\n';
    const OLD = `  - title: "Old paper"\n    authors: "A. Author"\n    url: "https://arxiv.org/abs/2601.00001"\n    bucket: adjacent\n    found: 2026-09-27\n`;
    const ADD = {
        title: 'Block term decomposition',
        authors: ['Ada Lovelace', 'Alan Turing'],
        venue: 'Journal of Tests',
        year: 2024,
        url: 'https://doi.org/10.1000/xyz',
        bucket: 'adjacent',
        project: 'bttd-source-eeg',
        relevance: 'med',
        why: 'The nearest baseline.'
    };

    function radarWith(text: string): { hub: string; config: PortfolioConfig; file: string } {
        const into = fixture();
        const file = join(into.hub, FILES.radar);
        writeFileSync(file, text);
        return { ...into, file };
    }

    const add = (into: { hub: string; config: PortfolioConfig }, fields: Record<string, unknown>) =>
        addRadarEntry(into.hub, into.config, fields, BUCKETS);

    it(
        'adds a Lit Watch entry in the order given and refuses one whose title or address is in the file',
        { tags: ['slow'] },
        () => {
            // A new entry, in the order given, after the entry the file holds.
            const into = radarWith(`${HEAD}entries:\n${OLD}`);
            const answer = add(into, ADD);
            expect(answer.found).toBe(true);
            expect(answer.changed).toStrictEqual(['entries']);
            expect(answer.refused).toStrictEqual([]);
            const source = readFileSync(into.file, 'utf8');
            expect(source).toBe(
                `${HEAD}entries:\n${OLD}\n` +
                    `  - title: Block term decomposition\n    authors: Ada Lovelace, Alan Turing\n    venue: Journal of Tests\n    year: 2024\n` +
                    `    url: https://doi.org/10.1000/xyz\n    bucket: adjacent\n    project: bttd-source-eeg\n    relevance: med\n` +
                    `    why: The nearest baseline.\n    found: ${localDate(Date.now())}\n`
            );
            expect(answer.records).toHaveLength(1);
            expect(answer.records?.[0]).toMatchObject({
                file: into.file,
                key: 'Block term decomposition',
                field: 'entries',
                before: null,
                undo: 'create'
            });
            expect(answer.records?.[0].replaced?.after).toContain(
                '  - title: Block term decomposition'
            );

            // A title that is there, whatever its case and spacing, and an address that is there,
            // whatever its case and trailing slash: refused, the file as it was.
            const again = add(into, { ...ADD, title: ' BLOCK TERM decomposition ', url: '' });
            expect(again.refused).toStrictEqual([
                { field: 'title', reason: words(into.config.text, 'server.feeds.paper_in_file') }
            ]);
            const byAddress = add(into, {
                ...ADD,
                title: 'Another title',
                url: 'HTTPS://arxiv.org/abs/2601.00001/'
            });
            expect(byAddress.refused).toStrictEqual([
                { field: 'url', reason: words(into.config.text, 'server.feeds.paper_in_file') }
            ]);
            expect(readFileSync(into.file, 'utf8')).toBe(source);

            // A bucket outside the vocabulary, a relevance outside the three words and a missing
            // title: refused by that field, the file as it was.
            const fresh = { ...ADD, title: 'A fresh title', url: 'https://example.org/fresh' };
            expect(add(into, { ...fresh, bucket: 'nonsense' }).refused[0].field).toBe('bucket');
            expect(add(into, { ...fresh, relevance: 'huge' }).refused[0].field).toBe('relevance');
            expect(add(into, { ...fresh, title: '  ' }).refused[0].field).toBe('title');
            expect(readFileSync(into.file, 'utf8')).toBe(source);

            // A missing file: not found, and none made.
            const missing = radarWith(`${HEAD}entries:\n${OLD}`);
            rmSync(missing.file);
            expect(add(missing, ADD)).toStrictEqual({ found: false, changed: [], refused: [] });
            expect(existsSync(missing.file)).toBe(false);

            // An empty list in each of its forms takes the entry as its first.
            for (const empty of [
                `${HEAD}entries: []\n`,
                `${HEAD}entries: [] # none yet\nother: 1\n`,
                `${HEAD}entries:\n`
            ]) {
                const held = radarWith(empty);
                const first = add(held, ADD);
                expect(first.refused, empty).toStrictEqual([]);
                expect(first.changed, empty).toStrictEqual(['entries']);
                const read = parse(readFileSync(held.file, 'utf8')) as {
                    entries: Record<string, unknown>[];
                };
                expect(read.entries, empty).toStrictEqual([
                    {
                        title: 'Block term decomposition',
                        authors: 'Ada Lovelace, Alan Turing',
                        venue: 'Journal of Tests',
                        year: 2024,
                        url: 'https://doi.org/10.1000/xyz',
                        bucket: 'adjacent',
                        project: 'bttd-source-eeg',
                        relevance: 'med',
                        why: 'The nearest baseline.',
                        found: localDate(Date.now())
                    }
                ]);
            }

            // A file that does not parse: refused, the bytes as they were.
            const broken = `${HEAD}entries:\n  - title: "open\n    broken: [\n`;
            const unread = radarWith(broken);
            expect(add(unread, ADD)).toStrictEqual({
                found: true,
                changed: [],
                refused: [
                    {
                        field: 'entries',
                        reason: words(unread.config.text, 'server.feeds.file_unread')
                    }
                ]
            });
            expect(readFileSync(unread.file, 'utf8')).toBe(broken);

            // A title with a quote, a colon, a hash and a newline, and curly characters: one line,
            // plain characters, the accented and Greek letters kept.
            const odd = radarWith(`${HEAD}entries:\n${OLD}`);
            const written = add(odd, {
                ...ADD,
                title: 'A "quoted": title # with\na newline',
                authors: 'Jos\u00e9 \u0391\u03b2',
                venue: '\u201cCurly\u201d \u2013 dash \u2014 dash\u2026 and\u00a0space \u2018single\u2019'
            });
            expect(written.refused).toStrictEqual([]);
            const read = parse(readFileSync(odd.file, 'utf8')) as {
                entries: Record<string, unknown>[];
            };
            const added = read.entries.at(-1);
            expect(added?.title).toBe('A "quoted": title # with a newline');
            expect(added?.authors).toBe('Jos\u00e9 \u0391\u03b2');
            expect(added?.venue).toBe('"Curly" - dash - dash... and space \'single\'');
            expect(read.entries).toHaveLength(2);
        }
    );
});
