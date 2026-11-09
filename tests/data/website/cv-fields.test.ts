// Layer 2, data test. The field names of the website's CV, of its employer CVs and of the hub's
// records they are built from come from the hub's settings (G139): the rows of `website.cv_lists`
// and `website.cv_entry_fields`, the words of `website.cv_fields`, the code statuses
// `website.code_statuses`, the DOI address `website.doi_origin` and the key of the website's own
// file `website.site_programs`, and the record a manifest's `cv:` reads as. The rows run over the
// copy of the demo hub tests/fixtures/hubs/website-hub.ts builds, with every word changed to
// another, so a name left in the code reads or writes the old field.

import { beforeAll, describe, expect } from 'vitest';
import { parse } from 'yaml';
import { bareId } from '../../../src/lib/data/helpers/hub-names.ts';
import type { Career, Collection, Person, Project } from '../../../src/lib/data/model/index.ts';
import { projectCv } from '../../../src/lib/data/snapshot/normalise-parts/publication.ts';
import {
    websiteSettings,
    type CvFields,
    type CvSection
} from '../../../src/lib/data/sources/config/settings/files.ts';
import type { SettingProblem } from '../../../src/lib/data/sources/config/settings/reader.ts';
import type { WebsiteInput } from '../../../src/lib/server/content/audit/website/files.ts';
import { readSite } from '../../../src/lib/server/content/audit/website/site.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    build,
    CV_FIELDS,
    CV_PATH,
    INDUSTRY_PATH,
    PAPERS_PATH,
    saying,
    websiteWorld,
    type Built
} from '../../fixtures/hubs/website-hub.ts';

/** What the rows read over the copy of the demo hub. */
let input: WebsiteInput;
let config: Record<string, unknown> = {};
let renamed: Built;

/** The words of `website.cv_fields` with each changed to another. */
const OTHER = Object.fromEntries(
    Object.entries(CV_FIELDS).map(([role, word]) => [role, `x-${word}`])
) as CvFields;

/** The CV's sections over the changed words. */
const SECTIONS: CvSection[] = [
    { key: 'refs', fields: ['x-name', 'x-email', 'x-reason'] },
    { key: 'jobs', fields: ['x-title', 'x-location', 'x-duration'] },
    {
        key: 'prizes',
        fields: ['x-award', 'x-location', 'x-content', 'x-date'],
        period: 'timestamp'
    },
    { key: 'x-students', fields: ['x-title', 'x-location', 'x-duration'] },
    { key: 'x-projects', fields: ['x-title', 'x-duration', 'cv_hide', 'venue_note'] },
    { key: 'talks', fields: ['heading', 'link', 'state', 'x-title', 'x-duration'] }
];

/** A collection of the entries a row reads, under the changed words. */
const COLLECTION = {
    id: 'talks',
    entries: [
        {
            id: 'talk-one',
            fields: {
                'x-cv_section': 'talks',
                heading: 'Its own heading',
                site_heading: 'The heading shown',
                link: 'its-own-link',
                state: 'left out',
                'x-when': '2021'
            }
        },
        { id: 'talk-two', fields: { 'x-cv_section': 'talks', site_state: 'shown' } },
        {
            id: 'grant-one',
            fields: { 'x-title': 'A grant', 'x-location': 'A town', 'x-about': 'What it paid' }
        },
        {
            id: 'supervised',
            fields: {
                'x-cv_section': 'x-students',
                'x-students': [
                    {
                        'x-person': 'dana-example',
                        'x-topic': 'A topic',
                        'x-degree': 'PhD',
                        'x-when': '2022'
                    }
                ]
            }
        }
    ]
} as unknown as Collection;

/** The career file under the changed words. */
const SECTIONS_OF_CAREER = {
    named: [{ 'x-person': 'dana-example', 'x-reason': 'A reason' }],
    held: [
        {
            'x-key': 'job-one',
            'x-title': 'A job',
            'x-location': 'A place',
            'x-when': '2020',
            'x-cv_rank': 2
        },
        { 'x-title': 'Moved', 'x-cv_section': 'talks' },
        { 'x-title': 'First', 'x-cv_rank': 0 }
    ],
    won: [{ 'x-funding': 'grant-one', 'x-when': '2018-01-01' }],
    'x-profiles': {
        'x-shared': { 'x-location': 'A city', 'x-email': 'a@example.org', 'x-links': ['Site'] },
        employer: {
            title: 'kept',
            jobs: { 'x-content': [{ 'x-title': 'A role', 'x-records': ['job-one'] }] }
        }
    }
};

/** The people with the user's and a reference's address details set. */
function peopleOf(people: readonly Person[]): Person[] {
    return people.map((one): Person => {
        if (bareId(one) === 'dana-example') return { ...one, email: 'dana@example.org' };
        if (one.self !== true) return one;
        const links = [{ name: 'Site', url: 'https://example.org', handle: 'ana' }];
        return { ...one, email: 'ana@example.org', orcid: '0000-0001', links };
    });
}

/** The manifests with the first given a `cv:` record under the changed words. */
function projectsOf(projects: readonly Project[]): Project[] {
    const cv = { title: 'A CV title', 'x-when': '2019', cv_hide: true, venue_note: 'A note' };
    return projects.map((one, index) => (index === 0 ? { ...one, cv } : one));
}

/** The input with every word changed and the records read under the changed words. */
function renamedInput(): WebsiteInput {
    return {
        ...input,
        cvFields: OTHER,
        cvLists: [
            { list: 'named', section: 'refs', reference: true },
            { list: 'held', section: 'jobs' },
            { list: 'won', section: 'prizes' }
        ],
        cvEntryFields: [
            { key: 'heading', from: 'site_heading' },
            { key: 'link', from: 'site_link' },
            { key: 'state', from: 'site_state', own: false }
        ],
        cvSections: SECTIONS,
        collections: [COLLECTION],
        people: peopleOf(input.people),
        projects: projectsOf(input.projects),
        career: { ...input.career, sections: SECTIONS_OF_CAREER } as Career
    };
}

beforeAll(() => {
    const world = websiteWorld();
    input = world.input;
    config = world.config;
    renamed = build(renamedInput());
});

/** The rows of a section of the CV the changed words write. */
function rowsOf(section: string): unknown {
    return (renamed.files[CV_PATH][section] as Record<string, unknown>)['x-content'];
}

/** Every key a parsed file holds, at any depth. */
function keysOf(value: unknown): string[] {
    if (Array.isArray(value)) return value.flatMap(keysOf);
    if (typeof value !== 'object' || value === null) return [];
    return Object.entries(value).flatMap(([key, one]) => [key, ...keysOf(one)]);
}

/** The input with the manifest `id` given the code deposit `deposit`. */
function withDeposit(id: string, deposit: Project['codeAvailability']): Partial<WebsiteInput> {
    const projects = input.projects.map((one): Project =>
        one.id === `hub:${id}` ? { ...one, codeAvailability: deposit } : one
    );
    return { projects };
}

/** The links of the entry of the manifest `id` in the journal section. */
function linksOf(from: Built, id: string): unknown {
    const list = from.files[PAPERS_PATH].journal as { papers: Record<string, unknown>[] };
    return list.papers.find((one) => one.title === `The paper ${id}`)?.links;
}

/** What `websiteSettings` reads with `over` laid over the hub's website block, with problems. */
function readWith(over: Record<string, unknown>) {
    const problems: SettingProblem[] = [];
    const website = { ...(config.website as Record<string, unknown>), ...over };
    return { read: websiteSettings({ ...config, website }, problems), problems };
}

const ROWS: { rule: string; check: () => void }[] = [
    {
        rule: 'the rows of cv_lists say the lists read and their sections, and reference: true builds from a person',
        check: () => {
            expect(rowsOf('refs')).toEqual([
                {
                    'x-name': 'Dr. Dana Example',
                    'x-email': 'dana@example.org',
                    'x-reason': 'A reason'
                }
            ]);
            expect(rowsOf('jobs')).toEqual([
                { 'x-title': 'First' },
                { 'x-title': 'A job', 'x-location': 'A place', 'x-duration': '2020' }
            ]);
        }
    },
    {
        rule: 'the rows of cv_entry_fields write the from field as the key, and own: false leaves the own field out',
        check: () => {
            expect(rowsOf('talks')).toEqual([
                { 'x-title': 'Moved' },
                { heading: 'The heading shown', link: 'its-own-link', 'x-duration': '2021' },
                { state: 'shown' }
            ]);
        }
    },
    {
        rule: 'the words of cv_fields read a supervision entry and write its student rows',
        check: () => {
            expect(rowsOf('x-students')).toEqual([
                {
                    'x-title': 'Dr. Dana Example',
                    'x-location': 'A topic',
                    'x-duration': 'PhD (2022)'
                }
            ]);
        }
    },
    {
        rule: 'the words of cv_fields read a funding entry and write the award and the timestamp',
        check: () => {
            expect(rowsOf('prizes')).toEqual([
                {
                    'x-award': 'A grant',
                    'x-location': 'A town',
                    'x-content': 'What it paid',
                    'x-date': '2018-01-01 15:59:00-0400'
                }
            ]);
        }
    },
    {
        rule: "the words of cv_fields read a manifest's cv record and name the projects' section",
        check: () => {
            expect(rowsOf('x-projects')).toEqual([
                {
                    'x-title': 'A CV title',
                    'x-duration': '2019',
                    cv_hide: true,
                    venue_note: 'A note'
                }
            ]);
        }
    },
    {
        rule: "the words of cv_fields name the CV's person block and its links",
        check: () => {
            expect(renamed.files[CV_PATH]['x-personal']).toEqual({
                'x-first-name': 'Ana',
                'x-last-name': 'Rivera',
                'x-links': {
                    'x-email': 'ana@example.org',
                    Site: 'ana',
                    'x-orcid': '0000-0001'
                }
            });
        }
    },
    {
        rule: "the words of cv_fields read the career file's profiles and name the employer CVs' file",
        check: () => {
            expect(renamed.files[INDUSTRY_PATH]).toEqual({
                'x-shared': {
                    'x-personal': {
                        'x-first-name': 'Ana',
                        'x-last-name': 'Rivera',
                        'x-links': {
                            'x-location': 'A city',
                            'x-email': 'a@example.org',
                            Site: 'ana'
                        }
                    }
                },
                'x-profiles': {
                    employer: {
                        title: 'kept',
                        jobs: {
                            'x-content': [
                                {
                                    'x-title': 'A role',
                                    'x-location': 'A place',
                                    'x-duration': '2020'
                                }
                            ]
                        }
                    }
                }
            });
        }
    },
    {
        rule: 'with every word set, no problem names a word of cv_fields',
        check: () => {
            expect(saying(renamed, 'audit.msg_cv_no_word')).toEqual([]);
        }
    },
    {
        rule: 'a role left empty is one problem naming it, and no file holds an empty key',
        check: () => {
            for (const role of Object.keys(CV_FIELDS)) {
                const out = build({ ...renamedInput(), cvFields: { ...OTHER, [role]: '' } });
                expect(saying(out, 'audit.msg_cv_no_word')).toEqual([
                    [`website.cv_fields.${role}`]
                ]);
                expect(saying(out, 'audit.msg_cv_unknown_section')).toEqual([]);
                expect(keysOf(out.files)).not.toContain('');
            }
        }
    },
    {
        rule: 'a period role left empty reads no period and a rows role left empty writes no rows',
        check: () => {
            const noPeriod = build({
                ...renamedInput(),
                cvFields: { ...OTHER, period: '' }
            }).files[CV_PATH].jobs as Record<string, unknown>;
            expect(noPeriod['x-content']).toEqual([
                { 'x-title': 'First' },
                { 'x-title': 'A job', 'x-location': 'A place' }
            ]);
            const noRows = build({ ...renamedInput(), cvFields: { ...OTHER, rows: '' } });
            expect(noRows.files[CV_PATH].jobs).toEqual({});
        }
    },
    {
        rule: 'no problem names a role left empty while cv_sections holds no row',
        check: () => {
            const out = build({
                ...renamedInput(),
                cvSections: [],
                cvFields: { ...OTHER, period: '' }
            });
            expect(saying(out, 'audit.msg_cv_no_word')).toEqual([]);
        }
    },
    {
        rule: "a manifest's cv_hide and a key no setting names are held by projectCv, a null is not",
        check: () => {
            expect(
                projectCv({
                    cv_hide: true,
                    venue_note: 'A note',
                    nothing: null,
                    when: '2019',
                    title: 'A title',
                    rank: '2'
                })
            ).toEqual({
                cv_hide: true,
                venue_note: 'A note',
                when: '2019',
                title: 'A title',
                rank: 2
            });
        }
    },
    {
        rule: 'a title and a rank not of their shape are left out of the record',
        check: () => {
            expect(projectCv({ title: 4, rank: 'first', about: 5 })).toEqual({ about: 5 });
        }
    },
    {
        rule: 'a code status set to another word links by that word, at the address of doi_origin',
        check: () => {
            const deposit = { status: 'public', doi: '10.1/x', url: 'https://example.org/c' };
            const out = build({
                ...input,
                ...withDeposit('deposited', deposit),
                codeStatuses: { deposited: 'public', review_copy: 'blind' },
                doiOrigin: 'https://resolver.example/'
            });
            expect(linksOf(out, 'deposited')).toEqual({
                Slides: 'https://example.org/slides',
                Code: 'https://resolver.example/10.1/x'
            });
        }
    },
    {
        rule: 'an empty doi_origin gives no link by DOI and one problem naming it',
        check: () => {
            const deposit = { status: 'deposited', doi: '10.1/x', url: 'https://example.org/c' };
            const out = build({ ...input, ...withDeposit('deposited', deposit), doiOrigin: '' });
            expect(linksOf(out, 'deposited')).toEqual({ Slides: 'https://example.org/slides' });
            expect(saying(out, 'audit.msg_site_no_word')).toEqual([['website.doi_origin']]);
        }
    },
    {
        rule: 'cv_lists holding no row beside a section is one problem naming it',
        check: () => {
            const out = build({ ...input, cvLists: [] });
            expect(saying(out, 'audit.msg_cv_no_word')).toEqual([['website.cv_lists']]);
        }
    },
    {
        rule: 'the review copy status set to another word keeps its DOI off the website',
        check: () => {
            const deposit = {
                status: 'public',
                doi: '10.1/x',
                url: 'https://example.org/c',
                zenodoStatus: 'blind'
            };
            const out = build({
                ...input,
                ...withDeposit('deposited', deposit),
                codeStatuses: { deposited: 'public', review_copy: 'blind' }
            });
            expect(linksOf(out, 'deposited')).toEqual({
                Slides: 'https://example.org/slides',
                Code: 'https://example.org/c'
            });
        }
    },
    {
        rule: 'a code status left empty gives no code link and one problem naming it',
        check: () => {
            for (const key of ['deposited', 'review_copy'] as const) {
                const out = build({
                    ...input,
                    codeStatuses: { deposited: 'deposited', review_copy: 'x', [key]: '' }
                });
                expect(linksOf(out, 'deposited')).toEqual({
                    Slides: 'https://example.org/slides'
                });
                expect(saying(out, 'audit.msg_site_no_word')).toEqual([
                    [`website.code_statuses.${key}`]
                ]);
            }
        }
    },
    {
        rule: "the research lines are read from the key site_programs names of the website's file",
        check: () => {
            const site = readSite(
                parse('lines:\n  federated: {}\nprograms:\n  other: {}\n'),
                'p',
                'lines'
            );
            expect(site.programs).toEqual(['federated']);
            expect(
                readSite(parse('programs:\n  other: {}\n'), 'p', 'constructor').programs
            ).toEqual([]);
        }
    },
    {
        rule: 'site_programs left empty is one problem naming it and no problem of a research line',
        check: () => {
            const out = build({ ...input, sitePrograms: '' });
            expect(saying(out, 'audit.msg_site_no_word')).toEqual([['website.site_programs']]);
            expect(saying(out, 'audit.msg_site_program')).toEqual([]);
        }
    },
    {
        rule: 'a repeated list of cv_lists is a repeat problem naming it, the first row standing',
        check: () => {
            const rows = [
                { list: 'one', section: 'first' },
                { list: 'one', section: 'second' }
            ];
            const { read, problems } = readWith({ cv_lists: rows });
            expect(read.cvLists).toEqual([rows[0]]);
            expect(problems).toContainEqual({
                key: 'website.cv_lists',
                where: 'repeat',
                name: 'one'
            });
        }
    },
    {
        rule: 'a row of cv_entry_fields with no from is left out with a problem naming the field',
        check: () => {
            const { read, problems } = readWith({ cv_entry_fields: [{ key: 'title' }] });
            expect(read.cvEntryFields).toEqual([]);
            expect(problems.map((one) => one.key)).toContain('website.cv_entry_fields[0].from');
        }
    },
    {
        rule: 'a CV section may not take the key person_block names, whatever the word',
        check: () => {
            const { read } = readWith({
                cv_fields: { ...CV_FIELDS, person_block: 'me' },
                cv_sections: [
                    { key: 'me', fields: ['title'] },
                    { key: 'personal', fields: ['title'] }
                ]
            });
            expect(read.cvSections.map((row) => row.key)).toEqual(['personal']);
        }
    }
];

describe('the field names of the website CV come from the settings', () => {
    for (const { rule, check } of ROWS) it(rule, check);
});
