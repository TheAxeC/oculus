// Layer 4, test helper. What the website's three files are built from in the test of G139
// (tests/data/hubs/website-files.test.ts, tests/data/website/paper-fields.test.ts): the lines of
// the hub's settings file, the CV and the publications those lines write, the manifests and the
// career file a copy of the demo hub is given, the website's own file and the build over the copy.
// It holds the rows' inputs apart from the rows, which read them.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { rootOf } from '../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { localFile } from '../../../src/lib/data/sources/config/local.ts';
import {
    websiteSettings,
    type CvEntryField,
    type CvFields,
    type CvList,
    type CvSection,
    type CvWords,
    type WebsiteSettings
} from '../../../src/lib/data/sources/config/settings/files.ts';
import { auditRules } from '../../../src/lib/server/content/audit/rules.ts';
import {
    websiteFiles,
    type WebsiteInput
} from '../../../src/lib/server/content/audit/website/files.ts';
import { readSite, type Problem } from '../../../src/lib/server/content/audit/website/site.ts';
import { copyHub, published } from '../../data/hubs/hubs-fixture.ts';
import { scratchDir } from '../scratch.ts';

/** The website's own file, as `website.files.site` ships it. */
export const SITE_PATH = '_data/website.yml';

/** The CV's file, as `website.files.cv` ships it. */
export const CV_PATH = '_data/data.yml';

/** The publications' file, as `website.files.papers` ships it. */
export const PAPERS_PATH = '_data/publications.yml';

/** The employer CVs' file, as `website.files.industry` ships it. */
export const INDUSTRY_PATH = '_data/industry.yml';

/** The four shipped paths, by their key of `website.files`. */
export const SHIPPED = {
    site: SITE_PATH,
    cv: CV_PATH,
    papers: PAPERS_PATH,
    industry: INDUSTRY_PATH
};

/** The words the settings file gives the CV. */
export const WORDS: CvWords = {
    months: 'Jan. Feb. Mar. Apr. May Jun. Jul. Aug. Sep. Oct. Nov. Dec.'.split(' '),
    open_end: 'Current',
    award_time: '15:59:00-0400'
};

/** The positions a row about the CV's period words reads: one of a month and an open end. */
export const DATED = [{ title: 'A post', when: '2023-02/..' }];

/** The lines of `website:` the publications' entries are written with. */
const PAPER_SETTINGS = `  paper_list: papers
  code_link_name: Code
  author_places: { lead: first, supervisor: senior, collaborator: coauthor }
  paper_fields:
    - { key: authors }
    - { key: title, from: project_title }
    - { key: order, from: author_place }
    - { key: program }
    - { key: book }
    - { key: pub_pre, from: kind_pre }
    - { key: pub_post, from: kind_post }
    - { key: pub_date, from: project_year }
    - { key: url }
    - { key: links, from: links_with_code }
    - { key: abstract }
    - { key: pub_last }
    - { key: hide }
    - { key: cv_hide }
`;

/** The lines of `website:` that name the fields of the CV and of the hub's records. */
const FIELD_SETTINGS = `  cv_lists:
    - { list: references, section: references, reference: true }
    - { list: positions, section: experience }
    - { list: degrees, section: education }
    - { list: awards, section: awards }
  cv_entry_fields:
    - { key: title, from: cv_title }
    - { key: url, from: cv_url }
    - { key: status, from: cv_status, own: false }
  cv_fields:
    period: when
    section: cv_section
    rank: cv_rank
    record_key: key
    students: students
    student_person: person
    student_topic: topic
    student_degree: degree
    reference_person: person
    reference_reason: reason
    reference_name: name
    reference_email: email
    funding: funding
    funding_title: title
    funding_place: location
    funding_about: about
    records: records
    record_place: location
    period_text: duration
    timestamp: date
    row_title: title
    row_place: location
    award_title: award
    award_place: location
    award_content: content
    rows: content
    person_block: personal
    first_name: first-name
    last_name: last-name
    person_links: links
    link_email: email
    link_orcid: orcid
    link_place: location
    profiles: profiles
    profile_shared: shared
    shared_place: location
    shared_email: email
    shared_links: links
    students_section: students
    projects_section: projects
  code_statuses: { deposited: deposited, review_copy: review-anon }
  site_programs: programs
`;

/** The website's sections of the hub's settings file, the row of an accepted paper first. */
export const SETTINGS = `
website:
  folder: site
  kinds:
    - { kind: journal, stages: [accepted], forms: [journal], order: true, pub_pre: '', pub_post: '(Accepted)' }
    - { kind: journal, stages: [published], forms: [journal], order: true, pub_pre: 'In: ' }
    - { kind: papers-in-review, stages: [submitted, revision], pub_post: '(Under review)' }
    - { kind: conference, stages: [published], forms: [conference] }
    - { kind: other-publications, forms: [tech-report] }
  cv_sections:
    - { key: references, fields: [name, email, reason] }
    - { key: experience, fields: [title, location, duration, url, about, hide] }
    - { key: academic, fields: [title, location, duration, url, about, hide] }
    - { key: students, fields: [title, location, duration] }
    - { key: news, fields: [title, location, duration, url, about, hide] }
    - { key: education, fields: [title, location, duration, url, about, hide] }
    - { key: grants, fields: [title, url, duration, role, status, about, hide] }
    - { key: projects, fields: [title, url, duration, role, hide, about], record_fields: [url, when] }
    - { key: awards, fields: [award, event, date, location, content, hide], period: timestamp }
    - { key: extracurricular, fields: [title, location, duration, url, about, hide] }
${PAPER_SETTINGS}${FIELD_SETTINGS}  cv_words:
    months: [Jan., Feb., Mar., Apr., May, Jun., Jul., Aug., Sep., Oct., Nov., Dec.]
    open_end: Current
    award_time: '15:59:00-0400'
`;

/** The settings file's `website:` block, read. */
const WEBSITE = (
    parse(SETTINGS) as {
        website: {
            cv_sections: CvSection[];
            cv_lists: CvList[];
            cv_entry_fields: CvEntryField[];
            cv_fields: CvFields;
        };
    }
).website;

/** The ten rows of `website.cv_sections` of the settings file. */
export const TEN = WEBSITE.cv_sections;

/** The words of `website.cv_fields` of the settings file, one per role. */
export const CV_FIELDS = WEBSITE.cv_fields;

/** The lines of `website:` a test of a hub's settings file adds, each field's word given. */
export const FIELD_LINES = FIELD_SETTINGS;

/**
 * The settings of a build a test hands the builder itself: a short list of an entry's fields, the
 * place words and the list key, and the words of the settings file for every other name.
 */
export const paperSettings: Pick<
    WebsiteSettings,
    | 'paperFields'
    | 'paperList'
    | 'codeLinkName'
    | 'authorPlaces'
    | 'codeStatuses'
    | 'doiOrigin'
    | 'fileHeader'
    | 'sitePrograms'
    | 'cvLists'
    | 'cvEntryFields'
    | 'cvFields'
> = {
    paperFields: [
        { key: 'authors' },
        { key: 'title', from: 'project_title' },
        { key: 'order', from: 'author_place' },
        { key: 'book' },
        { key: 'pub_date', from: 'project_year' },
        { key: 'links', from: 'links_with_code' }
    ],
    paperList: 'papers',
    codeLinkName: 'Code',
    authorPlaces: { lead: 'first', supervisor: 'senior', collaborator: 'coauthor' },
    codeStatuses: { deposited: 'deposited', review_copy: 'review-anon' },
    doiOrigin: 'https://doi.org/',
    fileHeader:
        "Generated by oculus from the research hub. Change the hub's files and write the website again.",
    sitePrograms: 'programs',
    cvLists: WEBSITE.cv_lists,
    cvEntryFields: WEBSITE.cv_entry_fields,
    cvFields: WEBSITE.cv_fields
};

/** The text of the CV the settings file's ten rows write over the hub of the test. */
export const TEN_ROWS_CV = [
    "# Generated by oculus from the research hub. Change the hub's files and write the website again.",
    '',
    'personal:',
    '  first-name: Ana',
    '  last-name: Rivera',
    '  links: {}',
    'references:',
    '  content: []',
    'experience:',
    '  content:',
    '    - title: Postdoc',
    '      location: A university',
    '      duration: 2024 - Current',
    '    - title: A visit',
    '      location: A lab',
    '      duration: "2023"',
    '    - title: A visiting post',
    'academic:',
    '  content: []',
    'students:',
    '  content: []',
    'news:',
    '  content: []',
    'education:',
    '  content: []',
    'grants:',
    '  content: []',
    'projects:',
    '  content: []',
    'awards:',
    '  content:',
    '    - award: A best paper award',
    '      event: A conference',
    '      date: 2018-01-01 15:59:00-0400',
    '      location: A city',
    'extracurricular:',
    '  content: []',
    ''
].join('\n');

/** The text of the publications `PAPER_SETTINGS` write over the hub of the test. */
export const PAPERS_TEXT = [
    "# Generated by oculus from the research hub. Change the hub's files and write the website again.",
    '',
    'journal:',
    '  papers:',
    '    - authors: A. Rivera',
    '      title: The paper deposited',
    '      order: first',
    '      book: A journal',
    '      pub_pre: "In: "',
    '      pub_date: 2024',
    '      url: https://example.org/paper',
    '      links:',
    '        Slides: https://example.org/slides',
    '        Code: https://doi.org/10.5281/zenodo.123',
    '    - authors: A. Rivera',
    '      title: The paper hidden',
    '      order: first',
    '      pub_pre: "In: "',
    '      pub_date: 2024',
    '      hide: true',
    '    - authors: A. Rivera',
    '      title: The paper shown',
    '      order: first',
    '      pub_pre: "In: "',
    '      pub_date: 2024',
    '      hide: false',
    '    - authors: A. Rivera',
    '      title: The paper accepted',
    '      order: first',
    '      book: Another journal',
    '      pub_pre: ""',
    '      pub_post: (Accepted)',
    '      pub_date: 2024',
    'papers-in-review:',
    '  papers:',
    '    - authors: A. Rivera',
    '      title: The paper reviewed',
    '      pub_post: (Under review)',
    '      pub_date: 2024',
    '      url: https://example.org/reviewed',
    'conference:',
    '  papers:',
    '    - authors: A. Rivera',
    '      title: The paper doi-alone',
    '      pub_date: 2024',
    '      links:',
    '        Code: https://doi.org/10.6084/m9.figshare.400',
    '    - authors: A. Rivera',
    '      title: The paper doi-none',
    '      pub_date: 2024',
    '      links:',
    '        Code: https://doi.org/10.17605/osf.io/abcde',
    '    - authors: A. Rivera',
    '      title: The paper doi-private',
    '      pub_date: 2024',
    '    - authors: A. Rivera',
    '      title: The paper empty-doi',
    '      pub_date: 2024',
    '      links:',
    '        Code: https://example.org/empty-doi',
    '    - authors: A. Rivera',
    '      title: The paper lines',
    '      program:',
    '        - federated',
    '        - unknown-line',
    '      book: A symposium',
    '      pub_date: 2024',
    '    - authors: A. Rivera',
    '      title: The paper null-doi',
    '      pub_date: 2024',
    '      links:',
    '        Code: https://example.org/null-doi',
    '    - authors: A. Rivera',
    '      title: The paper off-cv',
    '      pub_date: 2024',
    '      cv_hide: true',
    '    - authors: A. Rivera',
    '      title: The paper on-cv',
    '      pub_date: 2024',
    '      cv_hide: false',
    '    - authors: A. Rivera',
    '      title: The paper zenodo-only',
    '      pub_date: 2024',
    '      links:',
    '        Code: https://doi.org/10.5281/zenodo.300',
    '    - authors: A. Rivera',
    '      title: The paper zenodo-review',
    '      pub_date: 2024',
    '      links:',
    '        Code: https://example.org/zenodo-review',
    'other-publications:',
    '  papers:',
    '    - authors: A. Rivera',
    '      title: The paper report',
    '      pub_date: 2017',
    ''
].join('\n');

/** A manifest of a paper: its stage, form and year, then the YAML lines of its records. */
function manifest(id: string, stage: string, form: string, lead: string, more: string): string {
    return `id: ${id}\nstage: ${stage}\ntier: research\nform: ${form}\nyear: 2024\ntitle: The paper ${id}\nlead: [${lead}]\n${more}`;
}

/** The manifests of the rows, by their folder under projects/manuscripts/. */
export const MANIFESTS: Record<string, string> = {
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
    'off-cv': manifest(
        'off-cv',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  cv_hide: true\n'
    ),
    'on-cv': manifest(
        'on-cv',
        'published',
        'conference',
        'rivera-lab',
        'publication:\n  authors: A. Rivera\n  cv_hide: false\n'
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
 * profile row naming each of the first two, and one award with a day, which the CV writes with
 * the time of day the website parses.
 */
export const CAREER = `references:
  - { person: nobody-known, reason: A reason }
positions:
  - { key: postdoc, title: Postdoc, location: A university, when: "2024/.." }
  - { key: neurips-attending, title: A visit, location: A lab, when: 2023 }
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
    when: "2018-01-01"
    location: A city
`;

/** The website's own file. */
export const SITE = `programs:
  federated: { title: Federated learning }
`;

/** The website's own file with its own words, the title of a section and a part of the CV. */
export function siteWith(title: string, author: string): string {
    return `${SITE}sections:\n  awards: ${title}\n  publications: ${title}\ncv:\n  author: ${author}\n  titles: [${title}]\n`;
}

/** What a row reads: each generated file's text and parse, and the problems, by manifest id. */
export type Built = {
    texts: Record<string, string>;
    files: Record<string, Record<string, unknown>>;
    problems: [string, string, (string | number)[]][];
};

/** The files and the problems the input gives. */
export function build(from: WebsiteInput): Built {
    const out = websiteFiles(from);
    return {
        texts: Object.fromEntries(out.files.map((file) => [file.name, file.text])),
        files: Object.fromEntries(
            out.files.map((file) => [file.name, parse(file.text) as Record<string, unknown>])
        ),
        problems: out.problems.map((one: Problem) => [one.about?.id ?? '', one.key, one.args])
    };
}

/** The problems of the files `from` saying the sentence `key`, each by its arguments. */
export function saying(from: Built, key: string): (string | number)[][] {
    return from.problems.filter((one) => one[1] === key).map((one) => one[2]);
}

/** The copy of the demo hub, its merged configuration and what its files are built from. */
type WebsiteWorld = {
    hub: string;
    config: Record<string, unknown>;
    input: WebsiteInput;
};

/**
 * A copy of the demo hub given the manifests of the rows, the career file, the settings file's
 * website sections, a family name for the user and the user named by its `local.yml`, and the
 * input of the three files as the watcher publishes the copy and `websiteSettings` reads it.
 */
export function websiteWorld(): WebsiteWorld {
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
    const { config } = loadConfig(engineDir(), { hub });
    const { entities } = snapshot;
    const ours = <T extends { root?: string }>(all: Record<string, T>): T[] =>
        Object.values(all).filter((one) => rootOf(one) === 'hub');
    const people = Object.values(entities.people);
    const setting = websiteSettings(config);
    return {
        hub,
        config,
        input: {
            projects: ours(entities.projects),
            collections: ours(entities.collections),
            people,
            career: entities.career,
            self: new Set(people.filter((one) => one.self === true).map((one) => one.id)),
            ...setting,
            rules: auditRules(config),
            site: readSite(parse(SITE), SITE_PATH, setting.sitePrograms),
            paths: SHIPPED
        }
    };
}
