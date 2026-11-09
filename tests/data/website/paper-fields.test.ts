// Layer 2, data test. The fields of an entry of the website's publications file come from the hub's
// settings (G139): the rows of `website.paper_fields`, the list key `website.paper_list`, the code
// link's name `website.code_link_name` and the place words `website.author_places`, read over the
// copy of the demo hub tests/fixtures/hubs/website-hub.ts builds, and the record a manifest's
// `publication:` reads as. Each row is one rule, checked on the parsed publications file or on the
// settings as `websiteSettings` reads them, the settings given straight to the builder where a row
// changes one.

import { beforeAll, describe, expect } from 'vitest';
import { stringify } from 'yaml';
import type { Project } from '../../../src/lib/data/model/index.ts';
import { publication } from '../../../src/lib/data/snapshot/normalise-parts/publication.ts';
import {
    websiteSettings,
    type PaperField
} from '../../../src/lib/data/sources/config/settings/files.ts';
import type { SettingProblem } from '../../../src/lib/data/sources/config/settings/reader.ts';
import {
    differences,
    type WebsiteInput
} from '../../../src/lib/server/content/audit/website/files.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    build,
    PAPERS_PATH,
    PAPERS_TEXT,
    saying,
    websiteWorld,
    type Built
} from '../../fixtures/hubs/website-hub.ts';

/** What the rows read over the copy of the demo hub. */
let input: WebsiteInput;
let built: Built;
let config: Record<string, unknown> = {};

beforeAll(() => {
    const world = websiteWorld();
    input = world.input;
    config = world.config;
    built = build(input);
});

/** The rows of `website.paper_fields` a row builds with, the title first so an entry is found. */
function withRows(rows: PaperField[], over: Partial<WebsiteInput> = {}): Built {
    return build({ ...input, ...over, paperFields: [TITLE, ...rows] });
}

/** The row every entry a row finds is found by. */
const TITLE: PaperField = { key: 'title', from: 'project_title' };

/** The entries of a section of the publications file in the files `from`. */
function papers(from: Built, section: string): Record<string, unknown>[] {
    const list = from.files[PAPERS_PATH][section] as { papers: Record<string, unknown>[] };
    return list.papers;
}

/** The entry of the manifest `id` in a section of the files `from`, found by its title. */
function entry(from: Built, section: string, id: string): Record<string, unknown> {
    const found = papers(from, section).find((one) => one.title === `The paper ${id}`);
    if (found === undefined) throw new Error(`no entry of ${id} in ${section}`);
    return found;
}

/** The input with the manifest `id`'s record given more keys. */
function withRecord(id: string, more: Record<string, unknown>): Partial<WebsiteInput> {
    const projects = input.projects.map((one): Project =>
        one.id === `hub:${id}` ? { ...one, publication: { ...one.publication, ...more } } : one
    );
    return { projects };
}

/** What `websiteSettings` reads from the rows given as `website.paper_fields`, with problems. */
function readRows(rows: unknown[]) {
    const problems: SettingProblem[] = [];
    const website = { ...(config.website as Record<string, unknown>), paper_fields: rows };
    return { read: websiteSettings({ ...config, website }, problems), problems };
}

const ROWS: { rule: string; check: () => void }[] = [
    {
        rule: 'the lines of the settings file write the publications file of the hub',
        check: () => {
            expect(built.texts[PAPERS_PATH]).toBe(PAPERS_TEXT);
        }
    },
    {
        rule: "an entry holds the rows' keys in the rows' order and no other",
        check: () => {
            const out = build({
                ...input,
                paperFields: [{ key: 'title', from: 'project_title' }, { key: 'authors' }]
            });
            for (const one of papers(out, 'journal')) {
                expect(Object.keys(one)).toEqual(['title', 'authors']);
            }
        }
    },
    {
        rule: "a row with no from takes the record's field of its key",
        check: () => {
            const out = withRows(
                [{ key: 'venue_note' }],
                withRecord('deposited', { venue_note: 'x' })
            );
            expect(entry(out, 'journal', 'deposited').venue_note).toBe('x');
        }
    },
    {
        rule: 'a row naming a field the record does not own writes no key',
        check: () => {
            const out = withRows([{ key: 'venue_note' }, { key: 'constructor' }]);
            expect(Object.keys(entry(out, 'journal', 'deposited'))).toEqual(['title']);
        }
    },
    {
        rule: "a from of project_title writes the manifest's title under the row's key alone",
        check: () => {
            const out = build({
                ...input,
                paperFields: [{ key: 'paper_title', from: 'project_title' }]
            });
            const [first] = papers(out, 'journal');
            expect(Object.keys(first)).toEqual(['paper_title']);
            expect(first.paper_title).toBe('The paper deposited');
        }
    },
    {
        rule: "the froms project_year, kind_pre and kind_post write the manifest's year and the words of its kinds row",
        check: () => {
            const out = withRows([
                { key: 'year_note', from: 'project_year' },
                { key: 'before', from: 'kind_pre' },
                { key: 'after', from: 'kind_post' }
            ]);
            for (const [section, id] of [
                ['journal', 'accepted'],
                ['papers-in-review', 'reviewed'],
                ['other-publications', 'report']
            ]) {
                const held = entry(built, section, id);
                const one = entry(out, section, id);
                expect([one.year_note, one.before, one.after]).toEqual([
                    held.pub_date,
                    held.pub_pre,
                    held.pub_post
                ]);
            }
        }
    },
    {
        rule: 'a from of author_place writes no key under a kinds row without order, and the setting of the place under one with it',
        check: () => {
            const rows: PaperField[] = [{ key: 'order', from: 'author_place' }];
            const places = { lead: 'main', supervisor: 'senior', collaborator: 'coauthor' };
            const out = withRows(rows, { authorPlaces: places });
            expect(Object.keys(entry(out, 'conference', 'lines'))).toEqual(['title']);
            expect(entry(out, 'journal', 'deposited').order).toBe('main');
        }
    },
    {
        rule: "a from of links_with_code writes the record's links then the code link last under website.code_link_name, and a changed order of that map is a difference",
        check: () => {
            const rows: PaperField[] = [TITLE, { key: 'web_links', from: 'links_with_code' }];
            const out = build({ ...input, paperFields: rows, codeLinkName: 'Repository' });
            const links = entry(out, 'journal', 'deposited').web_links as Record<string, string>;
            expect(Object.entries(links)).toEqual([
                ['Slides', 'https://example.org/slides'],
                ['Repository', 'https://doi.org/10.5281/zenodo.123']
            ]);
            const turned = structuredClone(out.files[PAPERS_PATH]);
            const journal = turned.journal as { papers: Record<string, unknown>[] };
            journal.papers[0].web_links = { Repository: links.Repository, Slides: links.Slides };
            const text = out.texts[PAPERS_PATH];
            expect(differences(text, stringify(turned), rows)).toHaveLength(1);
            expect(differences(text, stringify(turned), [TITLE])).toEqual([]);
        }
    },
    {
        rule: "a row of the key links with no from writes the record's list as held",
        check: () => {
            const out = withRows([{ key: 'links' }]);
            expect(entry(out, 'journal', 'deposited').links).toEqual([
                { name: 'Slides', url: 'https://example.org/slides' }
            ]);
        }
    },
    {
        rule: 'website.paper_list names the key a section holds its entries under',
        check: () => {
            const out = build({ ...input, paperList: 'items' });
            for (const section of Object.values(out.files[PAPERS_PATH])) {
                expect(Object.keys(section as object)).toEqual(['items']);
            }
        }
    },
    {
        rule: 'website.code_link_name empty over a deposited project writes no code link and one problem naming the key',
        check: () => {
            const out = build({ ...input, codeLinkName: '' });
            expect(entry(out, 'journal', 'deposited').links).toEqual({
                Slides: 'https://example.org/slides'
            });
            expect(entry(out, 'conference', 'zenodo-only')).not.toHaveProperty('links');
            expect(saying(out, 'audit.msg_site_no_word')).toEqual([['website.code_link_name']]);
        }
    },
    {
        rule: 'a word of website.author_places empty where an entry needs it writes no key and one problem naming that key, however many entries need it',
        check: () => {
            const out = build({
                ...input,
                authorPlaces: { ...input.authorPlaces, lead: '' }
            });
            expect(papers(out, 'journal').map((one) => 'order' in one)).toEqual([
                false,
                false,
                false,
                false
            ]);
            expect(saying(out, 'audit.msg_site_no_word')).toEqual([['website.author_places.lead']]);
        }
    },
    {
        rule: "a from of the empty text keeps the row, which reads the record's own field",
        check: () => {
            const { read, problems } = readRows([{ key: 'url', from: '' }]);
            expect(problems).toEqual([]);
            expect(read.paperFields).toEqual([{ key: 'url' }]);
            const out = build({ ...input, paperFields: read.paperFields });
            expect(papers(out, 'journal')[0].url).toBe('https://example.org/paper');
        }
    },
    {
        rule: 'a from no word names leaves the row out with one finding',
        check: () => {
            const { read, problems } = readRows([{ key: 'url', from: 'nothing' }]);
            expect(read.paperFields).toEqual([]);
            expect(problems).toHaveLength(1);
        }
    },
    {
        rule: 'a key that is empty or __proto__ leaves the row out with its finding',
        check: () => {
            for (const key of ['__proto__', '']) {
                const { read, problems } = readRows([{ key }]);
                expect(read.paperFields).toEqual([]);
                expect(problems).toEqual([
                    {
                        key: 'website.paper_fields',
                        where: 'row',
                        issue: { kind: 'shape', row: 'website.paper_fields[0]', at: '' }
                    }
                ]);
            }
        }
    },
    {
        rule: 'a key an earlier row holds is left out with a repeat problem naming it, the first standing',
        check: () => {
            const { read, problems } = readRows([
                { key: 'url', from: 'project_title' },
                { key: 'url' }
            ]);
            expect(read.paperFields).toEqual([{ key: 'url', from: 'project_title' }]);
            expect(problems).toEqual([
                { key: 'website.paper_fields', where: 'repeat', name: 'url' }
            ]);
        }
    },
    {
        rule: 'the record of a manifest holds a key of the file that is not null as the file gives it, and reads rank and links in their shapes',
        check: () => {
            const held = publication({
                abstract: null,
                hide: 'yes',
                book: 2024,
                rank: '3',
                links: [{ name: 'A', url: 'https://a.example' }, { name: '' }, 'a text']
            });
            expect(held).toEqual({
                hide: 'yes',
                book: 2024,
                rank: 3,
                links: [{ name: 'A', url: 'https://a.example' }]
            });
            expect(held).not.toHaveProperty('abstract');
        }
    },
    {
        rule: 'a key __proto__ of a record is held as an own key of the record',
        check: () => {
            const held = publication(JSON.parse('{"__proto__": "x"}'));
            expect(Object.keys(held ?? {})).toEqual(['__proto__']);
            expect(Object.getPrototypeOf(held)).toBe(Object.prototype);
        }
    }
];

describe('the fields of an entry of the publications file', () => {
    for (const row of ROWS) it(row.rule, row.check);
});
