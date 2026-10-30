// Layer 2, data test. The website's three files the hub's files give (G139), built from the
// portfolio the watcher publishes for a fixture hub and read against a fixture website's own file:
// each row is one rule of the generated publications or CV, checked on the parsed files or, for
// what the file's text carries, on its text.
//
// The hub is a copy of tests/fixtures/hubs/demo/ (hubs-fixture.ts) with the manifests of the rows
// added under projects/manuscripts/, its `website.kinds` in its settings file, a career file of its
// own, the user named by the copy's `local.yml` and given a family name in the copy's people file.
// The website's own file is a text of this file. A row about the user's names builds the files
// again from the same input with the user's people entry changed.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect } from 'vitest';
import { parse } from 'yaml';
import { rootOf } from '../../../src/lib/data/helpers/hub-names.ts';
import type { Person } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { localFile } from '../../../src/lib/data/sources/config/local.ts';
import { websiteSettings } from '../../../src/lib/data/sources/config/settings/files.ts';
import { auditRules } from '../../../src/lib/server/content/audit/rules.ts';
import {
    websiteFiles,
    type WebsiteInput
} from '../../../src/lib/server/content/audit/website/files.ts';
import {
    CV_FILE,
    INDUSTRY_FILE,
    PAPERS_FILE,
    readSite,
    type Problem
} from '../../../src/lib/server/content/audit/website/site.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { copyHub, published } from './hubs-fixture.ts';

/** The website's sections of the hub's settings file, the row of an accepted paper first. */
const SETTINGS = `
website:
  folder: site
  kinds:
    - { kind: journal, title: Journal papers, stages: [accepted], forms: [journal], order: true, pub_pre: '', pub_post: '(Accepted)' }
    - { kind: journal, stages: [published], forms: [journal], order: true, pub_pre: 'In: ' }
    - { kind: papers-in-review, title: Papers in review, stages: [submitted, revision], pub_post: '(Under review)' }
    - { kind: conference, title: Conference papers, stages: [published], forms: [conference] }
    - { kind: other-publications, title: Other publications, forms: [tech-report] }
`;

/** A manifest of a paper: its stage, form and year, then the YAML lines of its records. */
function manifest(id: string, stage: string, form: string, lead: string, more: string): string {
    return `id: ${id}\nstage: ${stage}\ntier: research\nform: ${form}\nyear: 2024\ntitle: The paper ${id}\nlead: [${lead}]\n${more}`;
}

/** The manifests of the rows, by their folder under projects/manuscripts/. */
const MANIFESTS: Record<string, string> = {
    deposited: manifest(
        'deposited',
        'published',
        'journal',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  book: A journal\n  url: https://example.org/paper\n  links:\n    - { name: Slides, url: https://example.org/slides }\n  rank: 1\ncode_availability:\n  status: deposited\n  doi: 10.5281/zenodo.123\n  url: https://example.org/code\n'
    ),
    'zenodo-review': manifest(
        'zenodo-review',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\ncode_availability:\n  status: deposited\n  url: https://example.org/zenodo-review\n  doi: 10.5281/zenodo.200\n  zenodo_status: review-anon\n'
    ),
    'zenodo-only': manifest(
        'zenodo-only',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\ncode_availability:\n  status: none\n  doi: 10.5281/zenodo.300\n  zenodo_status: deposited\n'
    ),
    'doi-alone': manifest(
        'doi-alone',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\ncode_availability:\n  status: deposited\n  url: https://example.org/doi-alone\n  doi: 10.6084/m9.figshare.400\n'
    ),
    'doi-none': manifest(
        'doi-none',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\ncode_availability:\n  status: deposited\n  url: https://example.org/doi-none\n  doi: 10.17605/osf.io/abcde\n  zenodo_status: none\n'
    ),
    'doi-private': manifest(
        'doi-private',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\ncode_availability:\n  status: review-anon\n  url: https://example.org/doi-private\n  doi: 10.6084/m9.figshare.500\n'
    ),
    reviewed: manifest(
        'reviewed',
        'submitted',
        'journal',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  url: https://example.org/reviewed\ncode_availability:\n  status: review-anon\n  url: https://example.org/anonymous\n'
    ),
    accepted: manifest(
        'accepted',
        'accepted',
        'journal',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  book: Another journal\n'
    ),
    lines: manifest(
        'lines',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  book: A symposium\n  program: [federated, unknown-line]\n'
    ),
    hidden: manifest(
        'hidden',
        'published',
        'journal',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  hide: true\n  rank: "2"\n'
    ),
    shown: manifest(
        'shown',
        'published',
        'journal',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  hide: false\n  rank: 3\n'
    ),
    stopped: manifest(
        'stopped',
        'stopped',
        'journal',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n'
    ),
    others: manifest(
        'others',
        'published',
        'journal',
        'dana-example',
        'publication:\n  authors: D. Example\n'
    ),
    'empty-doi': manifest(
        'empty-doi',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\ncode_availability:\n  status: deposited\n  doi: ""\n  url: https://example.org/empty-doi\n'
    ),
    'null-doi': manifest(
        'null-doi',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\ncode_availability:\n  status: deposited\n  doi: null\n  url: https://example.org/null-doi\n'
    ),
    report: manifest(
        'report',
        'published',
        'tech-report',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n'
    ).replace('year: 2024', 'year: 2017')
};

/**
 * The career file of the copy: a reference naming no person of the people file, a position, a
 * position keyed as an entry of the demo hub's events file is, a position with an empty key, a
 * profile row naming each of the first two, and one award with a day and a time of day.
 */
const CAREER = `references:
  - { person: nobody-known, reason: A reason }
positions:
  - { key: postdoc, title: Postdoc, location: A university, duration: 2024 - now }
  - { key: neurips-attending, title: A visit, location: A lab, duration: 2023 }
  - { key: '', title: A visiting post }
profiles:
  shared: { location: A city }
  employer:
    experience:
      content:
        - { title: Researcher, records: [postdoc] }
    projects:
      content:
        - { title: A tool, records: [postdoc] }
  visiting:
    experience:
      content:
        - { title: Visiting, records: [neurips-attending] }
awards:
  - award: A best paper award
    event: A conference
    date: 2018-01-01 15:59:00-0400
    location: A city
`;

/** The website's own file. */
const SITE = `programs:
  federated: { title: Federated learning }
sections:
  awards: Awards
`;

/** What the rows read: each generated file's text and parse, and the problems, by manifest id. */
type Built = {
    texts: Record<string, string>;
    files: Record<string, Record<string, unknown>>;
    problems: [string, string, (string | number)[]][];
};

let input: WebsiteInput;
let built: Built;

/** The files and the problems the input gives. */
function build(from: WebsiteInput): Built {
    const out = websiteFiles(from);
    return {
        texts: Object.fromEntries(out.files.map((file) => [file.name, file.text])),
        files: Object.fromEntries(
            out.files.map((file) => [file.name, parse(file.text) as Record<string, unknown>])
        ),
        problems: out.problems.map((one: Problem) => [one.about?.id ?? '', one.key, one.args])
    };
}

/** The files and the problems the input gives with the user's people entry changed. */
function withSelf(change: (person: Person) => Person): Built {
    const people = input.people.map((one) => (one.self === true ? change(one) : one));
    return build({ ...input, people });
}

/** The person block of the CV and the shared one of the employer CVs, in that order. */
function personals(from: Built): Record<string, unknown>[] {
    const cv = from.files[CV_FILE].personal as Record<string, unknown>;
    const shared = from.files[INDUSTRY_FILE].shared as { personal: Record<string, unknown> };
    return [cv, shared.personal];
}

beforeAll(() => {
    const hub = copyHub(scratchDir('oculus-website-files-'), 'hub');
    for (const [folder, text] of Object.entries(MANIFESTS)) {
        const dir = join(hub, 'projects', 'manuscripts', folder);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'project.yml'), text);
    }
    writeFileSync(join(hub, '.oculus', 'data', 'academic', 'career.yml'), CAREER);
    const peopleFile = join(hub, '.oculus', 'data', 'people', 'people.yml');
    const named = readFileSync(peopleFile, 'utf8').replace(
        '    name: "Ana Rivera"\n',
        '    name: "Ana Rivera"\n    family: "Rivera"\n'
    );
    writeFileSync(peopleFile, named);
    writeFileSync(localFile(hub), 'self: rivera-lab\n');
    writeFileSync(join(hub, '.oculus', 'config.yml'), SETTINGS, { flag: 'a' });
    const { snapshot } = published([{ name: 'hub', dir: hub }], 'hub');
    const config = loadConfig(engineDir(), { hub }).config;
    const { entities } = snapshot;
    const ours = <T extends { root?: string }>(all: Record<string, T>): T[] =>
        Object.values(all).filter((one) => rootOf(one) === 'hub');
    const people = Object.values(entities.people);
    input = {
        projects: ours(entities.projects),
        collections: ours(entities.collections),
        people,
        career: entities.career,
        self: new Set(people.filter((one) => one.self === true).map((one) => one.id)),
        kinds: websiteSettings(config).kinds,
        rules: auditRules(config),
        site: readSite(parse(SITE))
    };
    built = build(input);
});

/** The entries of a section of the publications file. */
function papersOf(section: string): Record<string, unknown>[] {
    const value = built.files[PAPERS_FILE][section] as { papers: Record<string, unknown>[] };
    return value.papers;
}

/** The entry of a manifest, found by its title, in a section of the publications file. */
function entryOf(section: string, id: string): Record<string, unknown> | undefined {
    return papersOf(section).find((one) => one.title === `The paper ${id}`);
}

/** The titles of the entries of every section. */
function everyTitle(): unknown[] {
    const value = built.files[PAPERS_FILE];
    return Object.values(value).flatMap((one) =>
        typeof one === 'object' && one !== null && 'papers' in one
            ? (one as { papers: { title: unknown }[] }).papers.map((entry) => entry.title)
            : []
    );
}

/** One rule of the generated files and the check that reads it. */
const ROWS: { rule: string; check: () => void }[] = [
    {
        rule: 'each of the three files opens with the comment line saying it is generated',
        check: () => {
            for (const name of [CV_FILE, PAPERS_FILE, INDUSTRY_FILE]) {
                expect(built.texts[name].split('\n')[0]).toBe(
                    "# Generated by oculus from the research hub. Change the hub's files and write the website again."
                );
            }
        }
    },
    {
        rule: "the sections come in the rows' order, each with the title its first row gives",
        check: () => {
            const value = built.files[PAPERS_FILE];
            expect(Object.keys(value)).toEqual([
                'journal',
                'papers-in-review',
                'conference',
                'other-publications'
            ]);
            expect((value.journal as { title: string }).title).toBe('Journal papers');
        }
    },
    {
        rule: "the entries of a section come by the record's rank, a rank of digits read as a number, the unranked last",
        check: () => {
            expect(papersOf('journal').map((one) => one.title)).toEqual([
                'The paper deposited',
                'The paper hidden',
                'The paper shown',
                'The paper accepted'
            ]);
        }
    },
    {
        rule: "a record's venue is written as it holds it, and a row with no pub_post writes none",
        check: () => {
            const entry = entryOf('conference', 'lines');
            expect(entry?.book).toBe('A symposium');
            expect(entry !== undefined && 'pub_post' in entry).toBe(false);
        }
    },
    {
        rule: "a paper in review takes the row's pub_post",
        check: () => {
            expect(entryOf('papers-in-review', 'reviewed')?.pub_post).toBe('(Under review)');
        }
    },
    {
        rule: "the entry's pub_date is the manifest's year",
        check: () => {
            expect(entryOf('other-publications', 'report')?.pub_date).toBe(2017);
        }
    },
    {
        rule: "a deposit with a DOI links its code at the DOI's address, after the record's links",
        check: () => {
            expect(entryOf('journal', 'deposited')?.links).toEqual({
                Slides: 'https://example.org/slides',
                Code: 'https://doi.org/10.5281/zenodo.123'
            });
            expect(Object.keys(entryOf('journal', 'deposited')?.links as object)).toEqual([
                'Slides',
                'Code'
            ]);
        }
    },
    {
        rule: "a Zenodo deposit with no GitHub deposit links its code at the DOI's address",
        check: () => {
            expect(entryOf('conference', 'zenodo-only')?.links).toEqual({
                Code: 'https://doi.org/10.5281/zenodo.300'
            });
        }
    },
    {
        rule: 'a DOI under anonymous review on Zenodo is not linked, and the GitHub address is',
        check: () => {
            expect(entryOf('conference', 'zenodo-review')?.links).toEqual({
                Code: 'https://example.org/zenodo-review'
            });
        }
    },
    {
        rule: "a deposit with a DOI of another service and no Zenodo status links its code at the DOI's address",
        check: () => {
            expect(entryOf('conference', 'doi-alone')?.links).toEqual({
                Code: 'https://doi.org/10.6084/m9.figshare.400'
            });
            expect(entryOf('conference', 'doi-none')?.links).toEqual({
                Code: 'https://doi.org/10.17605/osf.io/abcde'
            });
        }
    },
    {
        rule: 'a DOI with no Zenodo status is not linked while the deposit is not public',
        check: () => {
            const entry = entryOf('conference', 'doi-private');
            expect(entry !== undefined && 'links' in entry).toBe(false);
        }
    },
    {
        rule: 'code under anonymous review is not linked',
        check: () => {
            const entry = entryOf('papers-in-review', 'reviewed');
            expect(entry?.url).toBe('https://example.org/reviewed');
            expect(entry !== undefined && 'links' in entry).toBe(false);
        }
    },
    {
        rule: "an accepted journal paper is in journal with the accepted row's words around the venue",
        check: () => {
            const entry = entryOf('journal', 'accepted');
            expect([entry?.pub_pre, entry?.pub_post, entry?.order]).toEqual([
                '',
                '(Accepted)',
                'first'
            ]);
        }
    },
    {
        rule: "a research line the website's file lacks is a finding naming the manifest and the word",
        check: () => {
            expect(built.problems.filter((one) => one[1] === 'audit.msg_site_program')).toEqual([
                ['hub:lines', 'audit.msg_site_program', ['unknown-line', '_data/website.yml']]
            ]);
            expect(entryOf('conference', 'lines')?.program).toEqual(['federated', 'unknown-line']);
        }
    },
    {
        rule: 'hide is written through, true and false alike',
        check: () => {
            expect(entryOf('journal', 'hidden')?.hide).toBe(true);
            expect(entryOf('journal', 'shown')?.hide).toBe(false);
        }
    },
    {
        rule: 'a stopped paper and a paper that names the user in none of its teams give no entry and a finding each',
        check: () => {
            expect(everyTitle()).not.toContain('The paper stopped');
            expect(everyTitle()).not.toContain('The paper others');
            const keys = built.problems
                .filter((one) => one[0] === 'hub:stopped' || one[0] === 'hub:others')
                .map((one) => `${one[0]} ${one[1]}`)
                .sort();
            expect(keys).toEqual([
                'hub:others audit.msg_site_no_self',
                'hub:stopped audit.msg_site_stage'
            ]);
        }
    },
    {
        rule: 'a deposit whose DOI is empty or null links its code at its address',
        check: () => {
            expect(entryOf('conference', 'empty-doi')?.links).toEqual({
                Code: 'https://example.org/empty-doi'
            });
            expect(entryOf('conference', 'null-doi')?.links).toEqual({
                Code: 'https://example.org/null-doi'
            });
        }
    },
    {
        rule: "an award's day and time are written unquoted, as the career file and the website write them",
        check: () => {
            expect(built.texts[CV_FILE]).toContain('date: 2018-01-01 15:59:00-0400\n');
            const old = parse(built.texts[CV_FILE], { schema: 'yaml-1.1' }) as {
                awards: { content: { date: unknown }[] };
            };
            expect(old.awards.content[0].date).toBe('2018-01-01 15:59:00-0400');
            expect((built.files[CV_FILE].awards as { title: string }).title).toBe('Awards');
        }
    },
    {
        rule: 'a reference naming no person of the people file gives no row and a finding naming the row',
        check: () => {
            expect(
                built.problems.filter((one) => one[1] === 'audit.msg_cv_unknown_person')
            ).toEqual([['', 'audit.msg_cv_unknown_person', ['references.0', 'nobody-known']]]);
            expect((built.files[CV_FILE].references as { content: unknown[] }).content).toEqual([]);
        }
    },
    {
        rule: "both person blocks carry the user's people entry's names: its name with the family name taken off, and the family name",
        check: () => {
            for (const personal of personals(built)) {
                expect([personal['first-name'], personal['last-name']]).toEqual(['Ana', 'Rivera']);
            }
            expect(built.problems.filter((one) => one[1] === 'audit.msg_cv_self_names')).toEqual(
                []
            );
        }
    },
    {
        rule: "a user's people entry with no family name gives no names and a finding naming the entry",
        check: () => {
            const changed = withSelf(({ family: _family, ...rest }) => rest);
            for (const personal of personals(changed)) {
                expect('first-name' in personal || 'last-name' in personal).toBe(false);
            }
            expect(changed.problems.filter((one) => one[1] === 'audit.msg_cv_self_names')).toEqual([
                ['', 'audit.msg_cv_self_names', ['rivera-lab']]
            ]);
        }
    },
    {
        rule: "a user's people entry whose name does not end with a space and the family name gives no names and a finding naming the entry",
        check: () => {
            for (const family of ['Smith', 'Ana Rivera']) {
                const changed = withSelf((person) => ({ ...person, family }));
                for (const personal of personals(changed)) {
                    expect('first-name' in personal || 'last-name' in personal).toBe(false);
                }
                expect(
                    changed.problems.filter((one) => one[1] === 'audit.msg_cv_self_names')
                ).toEqual([['', 'audit.msg_cv_self_names', ['rivera-lab']]]);
            }
        }
    },
    {
        rule: 'a profile row naming a key two records hold is a finding naming the key, both places and the row, and takes nothing from either; a key two records hold that no row names is none',
        check: () => {
            expect(built.problems.filter((one) => one[1] === 'audit.msg_cv_key_twice')).toEqual([
                [
                    '',
                    'audit.msg_cv_key_twice',
                    [
                        'neurips-attending',
                        'events.neurips-attending',
                        'positions.1',
                        'profiles.visiting.experience.0'
                    ]
                ]
            ]);
            const profiles = built.files[INDUSTRY_FILE].profiles as Record<
                string,
                Record<string, { content: Record<string, unknown>[] }>
            >;
            expect(profiles.visiting.experience.content).toEqual([{ title: 'Visiting' }]);
            expect(
                built.problems.filter(
                    (one) =>
                        one[1] === 'audit.msg_cv_unknown_record' &&
                        one[2][1] === 'neurips-attending'
                )
            ).toEqual([]);
        }
    },
    {
        rule: 'a career row whose key is the empty text is a finding naming the row',
        check: () => {
            expect(built.problems.filter((one) => one[1] === 'audit.msg_cv_empty_key')).toEqual([
                ['', 'audit.msg_cv_empty_key', ['positions.2']]
            ]);
        }
    },
    {
        rule: 'a profile row takes from its record the place and the period its section prints, and no other',
        check: () => {
            const profiles = built.files[INDUSTRY_FILE].profiles as Record<
                string,
                Record<string, { content: Record<string, unknown>[] }>
            >;
            expect(profiles.employer.experience.content).toEqual([
                { title: 'Researcher', location: 'A university', duration: '2024 - now' }
            ]);
            expect(profiles.employer.projects.content).toEqual([
                { title: 'A tool', duration: '2024 - now' }
            ]);
        }
    }
];

describe('the website files the hub gives', () => {
    for (const row of ROWS) it(row.rule, row.check);
});
