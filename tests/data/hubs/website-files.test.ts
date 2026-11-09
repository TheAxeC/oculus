// Layer 2, data test. The website's three files the hub's files give (G139), built from the
// portfolio the watcher publishes for a fixture hub and read against a fixture website's own file:
// each row is one rule of the generated publications or CV, checked on the parsed files or, for
// what the file's text carries, on its text.
//
// The hub is a copy of tests/fixtures/hubs/demo/ (hubs-fixture.ts) with the manifests of the rows
// added under projects/manuscripts/, its `website.kinds`, `website.cv_sections` and
// `website.cv_words` in its settings file, a career file of its own, the user named by the copy's
// `local.yml` and given a family name in the copy's people file. A row about the user's names
// builds the files again from the same input with the user's people entry changed, and a row about
// the CV's sections or words builds them again with the setting, a career file or a source of its
// own. The settings file's lines, the manifests, the career file, the website's own file and the
// shipped paths are tests/fixtures/hubs/website-hub.ts's. The paths of `website.files` are read
// from the merged configuration of the copy and of the shipped defaults, and the watch list
// (`siteFiles`) is read over a website folder of its own.

import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect } from 'vitest';
import { parse } from 'yaml';
import { bareId, HUB_FILE, rootOf } from '../../../src/lib/data/helpers/hub-names.ts';
import type { Collection, Person, Project } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { localFile } from '../../../src/lib/data/sources/config/local.ts';
import {
    websiteSettings,
    type CvSection,
    type CvWords
} from '../../../src/lib/data/sources/config/settings/files.ts';
import type { SettingProblem } from '../../../src/lib/data/sources/config/settings/reader.ts';
import { auditRules } from '../../../src/lib/server/content/audit/rules.ts';
import {
    websiteFiles,
    type WebsiteInput
} from '../../../src/lib/server/content/audit/website/files.ts';
import {
    readSite,
    siteFiles,
    type Problem
} from '../../../src/lib/server/content/audit/website/site.ts';
import { foldsCase } from '../../../src/lib/server/core/paths.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';
import {
    CAREER,
    CV_PATH,
    DATED,
    INDUSTRY_PATH,
    MANIFESTS,
    PAPERS_PATH,
    SETTINGS,
    SHIPPED,
    SITE,
    SITE_PATH,
    siteWith,
    TEN,
    TEN_ROWS_CV,
    WORDS
} from '../../fixtures/hubs/website-hub.ts';
import { copyHub, published } from './hubs-fixture.ts';

/** What the rows read: each generated file's text and parse, and the problems, by manifest id. */
type Built = {
    texts: Record<string, string>;
    files: Record<string, Record<string, unknown>>;
    problems: [string, string, (string | number)[]][];
};

let input: WebsiteInput;
let built: Built;
let hubDir = '';
let config: Record<string, unknown> = {};

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
    const cv = from.files[CV_PATH].personal as Record<string, unknown>;
    const shared = from.files[INDUSTRY_PATH].shared as { personal: Record<string, unknown> };
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
    config = loadConfig(engineDir(), { hub }).config;
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
        cvSections: websiteSettings(config).cvSections,
        cvWords: websiteSettings(config).cvWords,
        rules: auditRules(config),
        site: readSite(parse(SITE), SITE_PATH),
        paths: SHIPPED
    };
    built = build(input);
    hubDir = hub;
});

/** The entries of a section of the publications file. */
function papersOf(section: string): Record<string, unknown>[] {
    const value = built.files[PAPERS_PATH][section] as { papers: Record<string, unknown>[] };
    return value.papers;
}

/** The entry of a manifest, found by its title, in a section of the publications file. */
function entryOf(section: string, id: string): Record<string, unknown> | undefined {
    return papersOf(section).find((one) => one.title === `The paper ${id}`);
}

/** A section of the CV as a row of the rows' tests reads it. */
type Section = { content: Record<string, unknown>[] };

/** The rows of the CV's section `key` in the files `from`. */
function rowsOf(from: Built, key: string): Record<string, unknown>[] {
    return (from.files[CV_PATH][key] as Section).content;
}

/** The problems of the files `from` saying the sentence `key`, each by its arguments. */
function saying(from: Built, key: string): (string | number)[][] {
    return from.problems.filter((one) => one[1] === key).map((one) => one[2]);
}

/** The files the input gives with the CV's sections `sections`. */
function withSections(sections: CvSection[]): Built {
    return build({ ...input, cvSections: sections });
}

/** The files the input gives with the career file's lists changed by `lists`. */
function withCareer(lists: Record<string, unknown>, over: Partial<WebsiteInput> = {}): Built {
    const career = input.career;
    if (career === null) throw new Error('the copy holds a career file');
    return build({
        ...input,
        ...over,
        career: { ...career, sections: { ...career.sections, ...lists } }
    });
}

/** The files of the career file holding the positions of `DATED`, under the words `words`. */
function withWords(words: Partial<CvWords>): Built {
    return withCareer({ positions: DATED }, { cvWords: { ...WORDS, ...words } });
}

/** The entry of a collection a row names a section with: `fields` under the key `an-entry`. */
function withEntry(fields: Record<string, unknown>): {
    collections: Collection[];
    place: string;
} {
    const [first, ...others] = input.collections;
    const entry = { ...first.entries[0], id: 'hub:an-entry', title: 'An entry', fields };
    return {
        collections: [{ ...first, entries: [entry] }, ...others],
        place: `${bareId(first)}.an-entry`
    };
}

/** What `websiteSettings` reads from the rows given as `website.cv_sections`, with its problems. */
function readRows(rows: unknown[]) {
    const problems: SettingProblem[] = [];
    const website = { ...(config.website as Record<string, unknown>), cv_sections: rows };
    return { read: websiteSettings({ ...config, website }, problems), problems };
}

/** The settings file's ten rows with the row `service` put after `academic`. */
function sectionsWithService(): CvSection[] {
    const at = TEN.findIndex((one) => one.key === 'academic') + 1;
    const service = { key: 'service', fields: ['title', 'about'] };
    return [...TEN.slice(0, at), service, ...TEN.slice(at)];
}

/** The titles of the entries of every section. */
function everyTitle(): unknown[] {
    const value = built.files[PAPERS_PATH];
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
            for (const name of [CV_PATH, PAPERS_PATH, INDUSTRY_PATH]) {
                expect(built.texts[name].split('\n')[0]).toBe(
                    "# Generated by oculus from the research hub. Change the hub's files and write the website again."
                );
            }
        }
    },
    {
        rule: "the sections come in the rows' order",
        check: () => {
            expect(Object.keys(built.files[PAPERS_PATH])).toEqual([
                'journal',
                'papers-in-review',
                'conference',
                'other-publications'
            ]);
        }
    },
    {
        rule: 'no section of the CV or the publications holds a title, and the publications hold none at the top',
        check: () => {
            const site = readSite(parse(siteWith('A title', 'A. Rivera')), SITE_PATH);
            const { files } = build({ ...input, site });
            expect('title' in files[PAPERS_PATH]).toBe(false);
            for (const [key, section] of Object.entries(files[PAPERS_PATH])) {
                expect([key, Object.keys(section as object)]).toEqual([key, ['papers']]);
            }
            for (const [key, section] of Object.entries(files[CV_PATH])) {
                if (key === 'personal') continue;
                expect([key, Object.keys(section as object)]).toEqual([key, ['content']]);
            }
        }
    },
    {
        rule: 'both person blocks hold the names and the links and nothing of the website file',
        check: () => {
            const site = readSite(parse(siteWith('A title', 'A. Rivera')), SITE_PATH);
            for (const personal of personals(build({ ...input, site }))) {
                expect(Object.keys(personal)).toEqual(['first-name', 'last-name', 'links']);
            }
        }
    },
    {
        rule: "a title or a CV value of the website's own file changes none of the three files",
        check: () => {
            const of = (title: string, author: string): Record<string, string> =>
                build({
                    ...input,
                    site: readSite(parse(siteWith(title, author)), SITE_PATH)
                }).texts;
            expect(of('Another title', 'Another author')).toEqual(of('A title', 'An author'));
        }
    },
    {
        rule: 'the files are named by the paths of website.files, in the order a write takes them',
        check: () => {
            const paths = { ...SHIPPED, papers: 'data/papers.yml' };
            expect(websiteFiles({ ...input, paths }).files.map((one) => one.name)).toEqual([
                CV_PATH,
                'data/papers.yml',
                INDUSTRY_PATH
            ]);
        }
    },
    {
        rule: 'a hub that sets no website.files reads the four shipped paths, from the merged shipped defaults',
        check: () => {
            expect(websiteSettings(loadConfig(engineDir()).config).files).toEqual(SHIPPED);
            expect(websiteSettings(loadConfig(engineDir(), { hub: hubDir }).config).files).toEqual(
                SHIPPED
            );
        }
    },
    {
        rule: 'a hub that sets one key of website.files reads it, and the shipped value of the others',
        check: () => {
            const hub = copyHub(scratchDir('oculus-website-files-one-'), 'hub');
            writeFileSync(
                join(hub, HUB_FILE),
                `${readFileSync(join(hub, HUB_FILE), 'utf8')}\nwebsite:\n  files:\n    cv: data/cv.yml\n`
            );
            expect(websiteSettings(loadConfig(engineDir(), { hub }).config).files).toEqual({
                ...SHIPPED,
                cv: 'data/cv.yml'
            });
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
        rule: 'cv_hide is written through, true and false alike, and absent when the manifest holds none',
        check: () => {
            expect(entryOf('conference', 'off-cv')?.cv_hide).toBe(true);
            expect(entryOf('conference', 'on-cv')?.cv_hide).toBe(false);
            expect(entryOf('journal', 'hidden')).not.toHaveProperty('cv_hide');
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
            expect(built.texts[CV_PATH]).toContain('date: 2018-01-01 15:59:00-0400\n');
            const old = parse(built.texts[CV_PATH], { schema: 'yaml-1.1' }) as {
                awards: { content: { date: unknown }[] };
            };
            expect(old.awards.content[0].date).toBe('2018-01-01 15:59:00-0400');
        }
    },
    {
        rule: 'a reference naming no person of the people file gives no row and a finding naming the row',
        check: () => {
            expect(
                built.problems.filter((one) => one[1] === 'audit.msg_cv_unknown_person')
            ).toEqual([['', 'audit.msg_cv_unknown_person', ['references.0', 'nobody-known']]]);
            expect((built.files[CV_PATH].references as { content: unknown[] }).content).toEqual([]);
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
            const profiles = built.files[INDUSTRY_PATH].profiles as Record<
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
            const profiles = built.files[INDUSTRY_PATH].profiles as Record<
                string,
                Record<string, { content: Record<string, unknown>[] }>
            >;
            expect(profiles.employer.experience.content).toEqual([
                { title: 'Researcher', location: 'A university', duration: '2024 - Current' }
            ]);
            expect(profiles.employer.projects.content).toEqual([
                { title: 'A tool', duration: '2024 - Current' }
            ]);
        }
    },
    {
        rule: "the settings' ten rows write the CV the hub gives: its sections in the rows' order and each row's fields",
        check: () => {
            expect(built.texts[CV_PATH]).toBe(TEN_ROWS_CV);
        }
    },
    {
        rule: 'a section only the setting names is written in its place with its own fields only',
        check: () => {
            const { collections } = withEntry({
                cv_section: 'service',
                title: 'A service',
                about: 'What it was',
                location: 'A place'
            });
            const out = build({ ...input, collections, cvSections: sectionsWithService() });
            const keys = Object.keys(out.files[CV_PATH]);
            expect(keys.slice(keys.indexOf('academic'), keys.indexOf('students') + 1)).toEqual([
                'academic',
                'service',
                'students'
            ]);
            expect(rowsOf(out, 'service')).toEqual([{ title: 'A service', about: 'What it was' }]);
            expect(saying(out, 'audit.msg_cv_unknown_section')).toEqual([]);
        }
    },
    {
        rule: 'an entry naming a section no row holds is written nowhere and is a finding naming its place and the section',
        check: () => {
            const { collections, place } = withEntry({ cv_section: 'servce', title: 'A service' });
            const out = build({ ...input, collections });
            expect(Object.keys(out.files[CV_PATH])).not.toContain('servce');
            expect(saying(out, 'audit.msg_cv_unknown_section')).toEqual([[place, 'servce']]);
        }
    },
    {
        rule: 'a career row naming a section no row holds is a finding naming its place',
        check: () => {
            const out = withCareer({ positions: [{ title: 'A post', cv_section: 'nowhere' }] });
            expect(saying(out, 'audit.msg_cv_unknown_section')).toEqual([
                ['positions.0', 'nowhere']
            ]);
        }
    },
    {
        rule: 'a manifest with a cv record while no row holds projects is a finding naming its place',
        check: () => {
            const project: Project = { ...input.projects[0], cv: { title: 'A tool' } };
            const place = `projects.${bareId(project)}`;
            const out = build({
                ...input,
                projects: [project],
                cvSections: TEN.filter((one) => one.key !== 'projects')
            });
            expect(saying(out, 'audit.msg_cv_unknown_section')).toEqual([[place, 'projects']]);
        }
    },
    {
        rule: 'a student while no row holds students is a finding naming its place',
        check: () => {
            const { collections } = withEntry({
                cv_section: 'academic',
                students: [{ person: 'rivera-lab', degree: 'MSc' }]
            });
            const out = build({
                ...input,
                collections,
                cvSections: TEN.filter((one) => one.key !== 'students')
            });
            expect(saying(out, 'audit.msg_cv_unknown_section')).toEqual([
                ['an-entry.students.0', 'students']
            ]);
        }
    },
    {
        rule: "a row's period: timestamp writes the period in date as the timestamp, on a row other than awards",
        check: () => {
            const out = withCareer(
                { positions: DATED },
                {
                    cvSections: [
                        { key: 'experience', fields: ['title', 'date'], period: 'timestamp' }
                    ]
                }
            );
            expect(rowsOf(out, 'experience')).toEqual([
                { title: 'A post', date: '2023-02-01 15:59:00-0400' }
            ]);
        }
    },
    {
        rule: 'a row of awards with no period, or the empty text the Settings view writes, writes the period in duration',
        check: () => {
            for (const row of [{}, { period: '' }]) {
                const fields = ['award', 'duration', 'date'];
                const { read } = readRows([{ key: 'awards', fields, ...row }]);
                const out = withCareer({}, { cvSections: read.cvSections });
                expect(rowsOf(out, 'awards')).toEqual([
                    { award: 'A best paper award', duration: 'Jan. 2018' }
                ]);
            }
        }
    },
    {
        rule: "an employer CV's awards row under period: timestamp writes the period text in date",
        check: () => {
            const out = withCareer({
                profiles: {
                    employer: { awards: { content: [{ award: 'A prize', when: '2019-03-02' }] } }
                }
            });
            const profile = out.files[INDUSTRY_PATH].profiles as Record<
                string,
                Record<string, Section>
            >;
            expect(profile.employer.awards.content).toEqual([
                { award: 'A prize', date: 'Mar. 2019' }
            ]);
        }
    },
    {
        rule: "a row's record_fields say what a profile row takes from its record",
        check: () => {
            const positions = [
                {
                    key: 'postdoc',
                    title: 'Postdoc',
                    location: 'A place',
                    url: 'https://a.example',
                    when: 2024
                }
            ];
            const profiles = {
                employer: { projects: { content: [{ title: 'A tool', records: ['postdoc'] }] } }
            };
            const shipped = withCareer({ positions, profiles }).files[INDUSTRY_PATH];
            const cut = withCareer(
                { positions, profiles },
                {
                    cvSections: [{ key: 'projects', fields: ['title'], record_fields: [] }]
                }
            ).files[INDUSTRY_PATH];
            const projects = (file: Record<string, unknown>): Record<string, unknown>[] =>
                (file.profiles as Record<string, Record<string, Section>>).employer.projects
                    .content;
            expect(projects(shipped)).toEqual([
                { title: 'A tool', url: 'https://a.example', duration: '2024' }
            ]);
            expect(projects(cut)).toEqual([{ title: 'A tool' }]);
        }
    },
    {
        rule: "an employer CV's section no row names takes the place and the period from its record and prints in duration",
        check: () => {
            const out = withCareer({
                profiles: {
                    employer: {
                        teaching: { content: [{ title: 'A course', records: ['postdoc'] }] }
                    }
                }
            });
            const profile = out.files[INDUSTRY_PATH].profiles as Record<
                string,
                Record<string, Section>
            >;
            expect(profile.employer.teaching.content).toEqual([
                { title: 'A course', location: 'A university', duration: '2024 - Current' }
            ]);
        }
    },
    {
        rule: 'a period prints the words of website.cv_words',
        check: () => {
            const months = 'one two three four five six seven eight nine ten eleven twelve'.split(
                ' '
            );
            const out = withWords({ months, open_end: 'Now' });
            expect(rowsOf(out, 'experience')).toEqual([
                { title: 'A post', duration: 'two 2023 - Now' }
            ]);
        }
    },
    {
        rule: 'months missing prints the year alone and one finding naming the key, however many rows print one',
        check: () => {
            const twice = [DATED[0], { title: 'Another post', when: '2022-05/2022-07' }];
            const out = withCareer({ positions: twice }, { cvWords: { ...WORDS, months: [] } });
            expect(rowsOf(out, 'experience').map((one) => one.duration)).toEqual([
                '2023 - Current',
                '2022'
            ]);
            expect(saying(out, 'audit.msg_cv_no_word')).toEqual([['website.cv_words.months']]);
        }
    },
    {
        rule: 'open_end empty prints the start of an open period alone and one finding naming the key',
        check: () => {
            const out = withWords({ open_end: '' });
            expect(rowsOf(out, 'experience')).toEqual([{ title: 'A post', duration: 'Feb. 2023' }]);
            expect(saying(out, 'audit.msg_cv_no_word')).toEqual([['website.cv_words.open_end']]);
        }
    },
    {
        rule: 'award_time empty prints the day alone and is no finding',
        check: () => {
            const out = withWords({ award_time: '' });
            expect(rowsOf(out, 'awards')[0].date).toBe('2018-01-01');
            expect(saying(out, 'audit.msg_cv_no_word')).toEqual([]);
        }
    },
    {
        rule: 'no row of the setting writes the person block alone and one finding per row of the CV',
        check: () => {
            const out = withSections([]);
            expect(Object.keys(out.files[CV_PATH])).toEqual(['personal']);
            expect(saying(out, 'audit.msg_cv_unknown_section')).toEqual([
                ['positions.0', 'experience'],
                ['positions.1', 'experience'],
                ['positions.2', 'experience'],
                ['awards.0', 'awards']
            ]);
        }
    },
    {
        rule: 'a row named personal, empty or __proto__ is left out with a shape problem at its row and the person block stands',
        check: () => {
            for (const key of ['personal', '', '__proto__']) {
                const { read, problems } = readRows([{ key, fields: ['title'] }]);
                expect(read.cvSections).toEqual([]);
                expect(problems).toEqual([
                    {
                        key: 'website.cv_sections',
                        where: 'row',
                        issue: { kind: 'shape', row: 'website.cv_sections[0]', at: '' }
                    }
                ]);
                const out = build({ ...input, cvSections: read.cvSections });
                expect(Object.keys(out.files[CV_PATH].personal as object)).toEqual([
                    'first-name',
                    'last-name',
                    'links'
                ]);
            }
        }
    },
    {
        rule: 'a key an earlier row holds is left out with a repeat problem naming it, the first standing',
        check: () => {
            const first = { key: 'news', fields: ['title'] };
            const { read, problems } = readRows([first, { key: 'news', fields: ['about'] }]);
            expect(read.cvSections).toEqual([first]);
            expect(problems).toEqual([
                { key: 'website.cv_sections', where: 'repeat', name: 'news' }
            ]);
        }
    },
    {
        rule: 'a row with no fields is left out with a field problem at its fields, and one with an empty list with a shape problem',
        check: () => {
            const none = readRows([{ key: 'news' }]);
            expect(none.read.cvSections).toEqual([]);
            expect(none.problems.map((one) => [one.key, one.where])).toEqual([
                ['website.cv_sections[0].fields', 'field']
            ]);
            const empty = readRows([{ key: 'news', fields: [] }]);
            expect(empty.read.cvSections).toEqual([]);
            expect(empty.problems).toEqual([
                {
                    key: 'website.cv_sections',
                    where: 'row',
                    issue: { kind: 'shape', row: 'website.cv_sections[0]', at: '' }
                }
            ]);
        }
    }
];

describe('the website files the hub gives', () => {
    for (const row of ROWS) it(row.rule, row.check);
});

/** The paths of `website.files` a row changes, and the keys it leaves out of the watch list. */
const WATCHED: { row: string; files: Partial<typeof SHIPPED>; out: (keyof typeof SHIPPED)[] }[] = [
    { row: 'the four shipped paths', files: {}, out: [] },
    { row: 'a path of a folder of the website', files: { papers: 'data/papers.yml' }, out: [] },
    { row: 'a path out of the folder', files: { cv: '../outside.yml' }, out: ['cv'] },
    { row: 'an absolute path', files: { site: '/data/own.yml' }, out: ['site'] },
    { row: 'an empty path', files: { industry: '' }, out: ['industry'] },
    { row: 'a link out of the folder', files: { papers: 'linked/papers.yml' }, out: ['papers'] },
    { row: 'two keys naming one file', files: { cv: PAPERS_PATH }, out: ['cv', 'papers'] },
    { row: "a path naming the website's folder itself", files: { papers: '.' }, out: ['papers'] },
    {
        row: 'two keys differing by letter case, one file where the file system folds it',
        files: { cv: 'data/Case.yml', papers: 'data/case.yml' },
        out: foldsCase(tmpdir()) ? ['cv', 'papers'] : []
    }
];

describe('the files the audit reads and the watcher hears', () => {
    for (const { row, files, out } of WATCHED) {
        it(`are the paths of website.files without the bad ones: ${row}`, () => {
            const outside = scratchDir('oculus-website-outside-');
            const dir = plantScratch('oculus-website-site-', {}, ['_data', 'data']);
            symlinkSync(outside, join(dir, 'linked'));
            const paths = { ...SHIPPED, ...files };
            const kept = Object.entries(paths).filter(([key]) => !(out as string[]).includes(key));
            expect(siteFiles(dir, paths)).toEqual(kept.map(([, path]) => join(dir, path)));
        });
    }

    it('are none while the setting names no folder', () => {
        expect(siteFiles('', SHIPPED)).toEqual([]);
    });
});
