// Layer 2, route tests. The audit holds a hub to the conventions its own `audit:` setting names in
// its `.oculus/config.yml`, and to none it does not name: the files a project must hold, the
// headings a file must hold while a manifest key has a value, the website's feed and the sections a
// project is expected in, and the folders a project at a stage is kept under. Each row is a hub in
// a scratch folder holding the setting, the projects' files and the feed, scanned with the setting
// read from that file. A project of the tier `personal`, which `research_audit.skip_tiers` names,
// is held to none of them, and a part of the setting that is not of its shape is a finding of the
// hub while the rest of the setting runs.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { findingText } from '../../../src/lib/data/helpers/finding-text.ts';
import type { AuditFinding, Project } from '../../../src/lib/data/model/index.ts';
import { auditFindings, hubAuditSetting } from '../../../src/lib/server/content/audit/scan.ts';
import { auditRules } from '../../../src/lib/server/content/audit/rules.ts';
import { holdersOf } from '../../../src/lib/data/helpers/hub-names.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);

/** A hub in a scratch folder: its `.oculus/config.yml` holding `audit`, and the files given. */
function hubOf(audit: string, files: Record<string, string> = {}, folders: string[] = []): string {
    const setting: Record<string, string> = audit === '' ? {} : { '.oculus/config.yml': audit };
    return plantScratch('oculus-audit-', { ...setting, ...files }, folders);
}

/** A project of the hub at a folder, of the tier research unless `over` says otherwise. */
function projectAt(folder: string, over: Partial<Project> = {}): Project {
    return fixtureProject({
        id: `hub:${folder}`,
        root: 'hub',
        tier: 'research',
        title: `Title of ${folder}`,
        folder,
        file: `${folder}/project.yml`,
        ...over
    });
}

/** A project read from a workspace repository in its own scratch folder holding the files given. */
function repositoryProject(files: Record<string, string>, folders: string[] = []): Project {
    const folder = plantScratch('oculus-audit-repo-', files, folders);
    return fixtureProject({
        id: 'hub:repository',
        root: 'hub',
        tier: 'research',
        stage: 'exploring',
        title: 'The repository',
        folder: '',
        file: '.oculus/project.yml',
        workspaceFolder: { root: folder, dir: folder }
    });
}

/** The audit of a hub over its projects, with the setting its own settings file holds. */
function findingsOf(hub: string, projects: Project[], primary = true): AuditFinding[] {
    return auditFindings({
        hub,
        root: 'hub',
        primary,
        held: holdersOf(projects),
        self: new Set<string>(),
        projects,
        collections: [],
        rules: auditRules(config),
        setting: hubAuditSetting(hub),
        catalog
    });
}

/** The sentence of a finding, worded from the catalog as the audit words it. */
function said(key: string, ...args: string[]): string {
    return findingText(catalog, key, ...args);
}

/** The scopes of the findings saying one sentence, sorted. */
function scopesSaying(found: AuditFinding[], message: string): string[] {
    return found
        .filter((one) => one.message === message)
        .map((one) => one.scope)
        .sort();
}

/** The findings of a hub's projects of the kinds the setting raises, by scope. */
function settingFindings(found: AuditFinding[], scope: string): AuditFinding[] {
    const ofSetting = [
        'audit.msg_required_file',
        'audit.msg_required_section',
        'audit.msg_stage_folder',
        'audit.msg_site_wrong_section',
        'audit.msg_site_missing',
        'audit.msg_site_title_differs'
    ];
    const prefixes = ofSetting.map((key) => catalog[key].split('{')[0]);
    return found.filter(
        (one) => one.scope === scope && prefixes.some((prefix) => one.message.startsWith(prefix))
    );
}

/**
 * The hub's `website.kinds`: a thesis, the papers in review, in preparation and abandoned by stage,
 * and the abstracts, posters, conference and journal papers by form, the last row catching the
 * rest.
 */
const KINDS = `
    kinds:
      - { kind: [thesis], forms: [thesis] }
      - { kind: [papers-in-review], stages: [submitted, revision] }
      - { kind: [papers-in-preparation], stages: [in-prep, submit-ready] }
      - { kind: [abandoned-papers], stages: [stopped] }
      - { kind: [abstracts], forms: [abstract] }
      - { kind: [posters], forms: [poster] }
      - { kind: [conference], forms: [conference] }
      - { kind: [journal, other-publications], forms: [journal] }
      - { kind: [abstracts, conference, journal, other-publications, posters, thesis] }
`;

describe('the required files of the audit', () => {
    const readme =
        'audit:\n  required_files:\n    - { file: README.md, stages: { not_flags: [terminal] } }\n';

    it('require a README of a project at a stage without the flag terminal, and of none at published or holding one', () => {
        const hub = hubOf(readme, { 'projects/c/README.md': '# C\n' });
        const projects = [
            projectAt('projects/a', { stage: 'nascent' }),
            projectAt('projects/b', { stage: 'published' }),
            projectAt('projects/c', { stage: 'nascent' })
        ];
        const found = findingsOf(hub, projects);
        expect(scopesSaying(found, said('audit.msg_required_file', 'README.md'))).toEqual([
            'projects/a'
        ]);
    });

    it('require a file of a project at a stage a words list names, and of none at another stage', () => {
        const hub = hubOf(
            'audit:\n  required_files:\n    - { file: NOTES.md, stages: { words: [exploring] } }\n'
        );
        const projects = [
            projectAt('projects/a', { stage: 'exploring' }),
            projectAt('projects/b', { stage: 'nascent' })
        ];
        const found = findingsOf(hub, projects);
        expect(scopesSaying(found, said('audit.msg_required_file', 'NOTES.md'))).toEqual([
            'projects/a'
        ]);
    });

    it('require a file a row with no condition names of every project lacking it', () => {
        const hub = hubOf('audit:\n  required_files:\n    - { file: LICENSE }\n', {
            'projects/c/LICENSE': 'MIT\n'
        });
        const projects = [
            projectAt('projects/a', { stage: 'nascent' }),
            projectAt('projects/b', { stage: 'published' }),
            projectAt('projects/c', { stage: 'nascent' })
        ];
        const found = findingsOf(hub, projects);
        expect(scopesSaying(found, said('audit.msg_required_file', 'LICENSE'))).toEqual([
            'projects/a',
            'projects/b'
        ]);
    });

    it('require a file of a project at a flagged stage only while the project holds the folder the row names', () => {
        const hub = hubOf(
            'audit:\n  required_files:\n    - { file: code/README.md, stages: { flags: [live] }, folder: code }\n',
            {},
            ['projects/a/code', 'projects/c/code']
        );
        const projects = [
            projectAt('projects/a', { stage: 'exploring' }),
            projectAt('projects/b', { stage: 'exploring' }),
            projectAt('projects/c', { stage: 'nascent' })
        ];
        const found = findingsOf(hub, projects);
        expect(scopesSaying(found, said('audit.msg_required_file', 'code/README.md'))).toEqual([
            'projects/a'
        ]);
    });

    it('require a file inside a folder of a hub project and of a workspace repository project holding the folder', () => {
        const hub = hubOf(
            'audit:\n  required_files:\n    - { file: code/README.md, folder: code }\n',
            {},
            ['projects/a/code']
        );
        const repository = repositoryProject({ 'code/main.py': 'print(1)\n' });
        const projects = [
            projectAt('projects/a', { stage: 'nascent' }),
            projectAt('projects/b', { stage: 'nascent' }),
            repository
        ];
        const found = findingsOf(hub, projects);
        expect(scopesSaying(found, said('audit.msg_required_file', 'code/README.md'))).toEqual(
            [repository.workspaceFolder?.root ?? '', 'projects/a'].sort()
        );
    });

    it('require a file only of the hub projects under the folders a row names, and of no workspace repository project', () => {
        const hub = hubOf(
            'audit:\n  required_files:\n    - { file: README.md, folders: [projects/manuscripts] }\n'
        );
        const projects = [
            projectAt('projects/manuscripts/x', { stage: 'nascent' }),
            projectAt('projects/coauthor/y', { stage: 'nascent' }),
            repositoryProject({ 'code/main.py': 'print(1)\n' })
        ];
        const found = findingsOf(hub, projects);
        expect(scopesSaying(found, said('audit.msg_required_file', 'README.md'))).toEqual([
            'projects/manuscripts/x'
        ]);
    });

    it('require a file of a project with no stage under a block that names only a not_ list', () => {
        const hub = hubOf(readme);
        const found = findingsOf(hub, [projectAt('projects/a')]);
        expect(scopesSaying(found, said('audit.msg_required_file', 'README.md'))).toEqual([
            'projects/a'
        ]);
    });

    it('require no file of a project of the tier personal', () => {
        const hub = hubOf(readme);
        const found = findingsOf(hub, [
            projectAt('projects/a', { stage: 'nascent', tier: 'personal' })
        ]);
        expect(scopesSaying(found, said('audit.msg_required_file', 'README.md'))).toEqual([]);
    });
});

describe('the required sections of the audit', () => {
    const data =
        'audit:\n  required_sections:\n    - { file: README.md, heading: "## Data", key: datasets }\n';
    const message = said('audit.msg_required_section', 'datasets', 'README.md', '## Data');

    /** The scopes a datasets manifest and a README of the given text give the finding for. */
    function sectionScopes(readmes: Record<string, string | null>, manifest: string): string[] {
        const files: Record<string, string> = {};
        for (const [folder, text] of Object.entries(readmes)) {
            files[`${folder}/project.yml`] = manifest;
            if (text !== null) files[`${folder}/README.md`] = text;
        }
        const hub = hubOf(data, files);
        const projects = Object.keys(readmes).map((folder) =>
            projectAt(folder, { stage: 'nascent' })
        );
        return scopesSaying(findingsOf(hub, projects), message);
    }

    it('require the heading of a project whose manifest lists datasets, a line that is the heading or starts with it and a space holding it', () => {
        const scopes = sectionScopes(
            {
                'projects/none': null,
                'projects/other': '# Title\n\nNo data here.\n',
                'projects/exact': '# Title\n\n## Data\n',
                'projects/longer': '# Title\n\n## Data + reproduction\n',
                'projects/database': '# Title\n\n## Database\n',
                'projects/deeper': '# Title\n\n### Data notes\n'
            },
            'datasets: [d1]\n'
        );
        expect(scopes).toEqual([
            'projects/database',
            'projects/deeper',
            'projects/none',
            'projects/other'
        ]);
    });

    it('require no heading of a project whose manifest lists no dataset or does not parse', () => {
        expect(sectionScopes({ 'projects/a': '# A\n' }, 'datasets: []\n')).toEqual([]);
        expect(sectionScopes({ 'projects/a': '# A\n' }, 'title: A\n')).toEqual([]);
        expect(sectionScopes({ 'projects/a': '# A\n' }, 'datasets: [d1\n  : :\n')).toEqual([]);
    });

    it('require the heading by a dotted key holding a text, a number or true, and not false, a map or an empty text', () => {
        const row =
            'audit:\n  required_sections:\n    - { file: README.md, heading: "## Code", key: code_availability.status }\n';
        const values: Record<string, string> = {
            deposited: 'deposited',
            empty: '""',
            number: '3',
            yes: 'true',
            no: 'false',
            map: '{ at: x }'
        };
        const files: Record<string, string> = {};
        for (const [name, value] of Object.entries(values)) {
            files[`projects/${name}/project.yml`] = `code_availability:\n  status: ${value}\n`;
        }
        const hub = hubOf(row, files);
        const projects = Object.keys(values).map((name) =>
            projectAt(`projects/${name}`, { stage: 'nascent' })
        );
        const found = findingsOf(hub, projects);
        const key = said(
            'audit.msg_required_section',
            'code_availability.status',
            'README.md',
            '## Code'
        );
        expect(scopesSaying(found, key)).toEqual([
            'projects/deposited',
            'projects/number',
            'projects/yes'
        ]);
    });

    it('require the heading only of the projects under the folders a row names', () => {
        const row =
            'audit:\n  required_sections:\n    - { file: README.md, heading: "## Data", key: datasets, folders: [projects/manuscripts, projects/archive] }\n';
        const hub = hubOf(row, {
            'projects/coauthor/published/2025/x/project.yml': 'datasets: [d1]\n',
            'projects/manuscripts/x/project.yml': 'datasets: [d1]\n'
        });
        const projects = [
            projectAt('projects/coauthor/published/2025/x', { stage: 'published' }),
            projectAt('projects/manuscripts/x', { stage: 'published' })
        ];
        expect(scopesSaying(findingsOf(hub, projects), message)).toEqual([
            'projects/manuscripts/x'
        ]);
    });

    it('require no heading of a project of the tier personal', () => {
        const hub = hubOf(data, { 'projects/a/project.yml': 'datasets: [d1]\n' });
        const project = projectAt('projects/a', { stage: 'nascent', tier: 'personal' });
        expect(scopesSaying(findingsOf(hub, [project]), message)).toEqual([]);
    });
});

describe('the website of the audit', () => {
    const website = `audit:\n  website:\n    file: site/pubs.yml\n    list: papers\n    title: title\n${KINDS}`;
    const project = projectAt('projects/paper', { stage: 'published', form: 'journal' });
    const feedOf = (section: string, list = 'papers', title = 'title'): string =>
        `${section}:\n  ${list}:\n    - ${title}: ${project.title}\n`;
    const wrong = (sections: string, expected: string): string =>
        said('audit.msg_site_wrong_section', sections, 'published', expected);
    const journal = "['journal', 'other-publications']";

    it('find a published journal paper under journal, and name the section a paper under thesis sits in and the sections its form expects', () => {
        const right = findingsOf(hubOf(website, { 'site/pubs.yml': feedOf('journal') }), [project]);
        expect(right.filter((one) => one.kind === 'publink')).toEqual([]);
        const found = findingsOf(hubOf(website, { 'site/pubs.yml': feedOf('thesis') }), [project]);
        expect(scopesSaying(found, wrong("['thesis']", journal))).toEqual(['projects/paper']);
    });

    it('read the entries and the titles under the keys list and title name', () => {
        const named = website
            .replace('list: papers', 'list: items')
            .replace('title: title', 'title: name');
        const right = findingsOf(
            hubOf(named, { 'site/pubs.yml': feedOf('journal', 'items', 'name') }),
            [project]
        );
        expect(right.filter((one) => one.kind === 'publink')).toEqual([]);
        const found = findingsOf(
            hubOf(named, { 'site/pubs.yml': feedOf('thesis', 'items', 'name') }),
            [project]
        );
        expect(scopesSaying(found, wrong("['thesis']", journal))).toEqual(['projects/paper']);
    });

    it('expect a project in the sections of the first kinds row its form meets', () => {
        const own = `audit:\n  website:\n    file: site/pubs.yml\n    list: papers\n    title: title\n    kinds:\n      - { kind: [articles], forms: [journal] }\n`;
        const found = findingsOf(hubOf(own, { 'site/pubs.yml': feedOf('journal') }), [project]);
        expect(scopesSaying(found, wrong("['journal']", "['articles']"))).toEqual([
            'projects/paper'
        ]);
    });

    it('say nothing of a feed that is not there, and name a feed that does not parse', () => {
        const missing = findingsOf(hubOf(website), [project]);
        expect(missing.filter((one) => one.kind === 'publink')).toEqual([]);
        const broken = findingsOf(hubOf(website, { 'site/pubs.yml': 'journal: [a\n  : :\n' }), [
            project
        ]);
        const unreadable = broken.filter((one) => one.kind === 'publink');
        expect(unreadable.map((one) => one.where)).toEqual(['site/pubs.yml']);
        expect(
            unreadable[0].message.startsWith(said('audit.msg_site_unreadable', 'site/pubs.yml', ''))
        ).toBe(true);
    });

    it('check the projects of each hub against its own feed, the primary or not', () => {
        const first = projectAt('projects/first', { stage: 'published', form: 'journal' });
        const second = projectAt('projects/second', { stage: 'published', form: 'journal' });
        const feed = (one: Project): string => `thesis:\n  papers:\n    - title: ${one.title}\n`;
        const primary = findingsOf(hubOf(website, { 'site/pubs.yml': feed(first) }), [first], true);
        const other = findingsOf(
            hubOf(website, { 'site/pubs.yml': feed(second) }),
            [second],
            false
        );
        expect(scopesSaying(primary, wrong("['thesis']", journal))).toEqual(['projects/first']);
        expect(scopesSaying(other, wrong("['thesis']", journal))).toEqual(['projects/second']);
    });

    it('check no project of the tier personal against the feed', () => {
        const personal = projectAt('projects/paper', {
            stage: 'published',
            form: 'journal',
            tier: 'personal'
        });
        const found = findingsOf(hubOf(website, { 'site/pubs.yml': feedOf('thesis') }), [personal]);
        expect(settingFindings(found, 'projects/paper')).toEqual([]);
    });

    it('count the paper only a project of the tier personal matches as matched, and give no finding of any scope', () => {
        const personal = projectAt('projects/paper', {
            stage: 'published',
            form: 'journal',
            tier: 'personal',
            lead: ['hub:someone']
        });
        const found = findingsOf(hubOf(website, { 'site/pubs.yml': feedOf('journal') }), [
            personal
        ]);
        expect(found).toEqual([]);
    });
});

describe('the stage folders of the audit', () => {
    const row = (folder: string): string =>
        `audit:\n  stage_folders:\n    - { stages: { words: [published] }, folders: [${folder}, projects/coauthor] }\n`;
    const message = said(
        'audit.msg_stage_folder',
        'published',
        "['projects/archive/published', 'projects/coauthor']"
    );

    it('name a published project under none of the folders, matched by whole path segments, with the folder written with or without its trailing slash', () => {
        for (const folder of ['projects/archive/published', 'projects/archive/published/']) {
            const projects = [
                projectAt('projects/active/x', { stage: 'published' }),
                projectAt('projects/archive/published/x', { stage: 'published' }),
                projectAt('projects/coauthor/published/2025/x', { stage: 'published' }),
                projectAt('projects/archive/published-old/x', { stage: 'published' })
            ];
            expect(scopesSaying(findingsOf(hubOf(row(folder)), projects), message)).toEqual([
                'projects/active/x',
                'projects/archive/published-old/x'
            ]);
        }
    });

    it('name no project at a stage the row does not name, and no workspace repository project', () => {
        const projects = [
            projectAt('projects/active/x', { stage: 'submitted' }),
            { ...repositoryProject({ 'README.md': '# R\n' }), stage: 'published' }
        ];
        const found = findingsOf(hubOf(row('projects/archive/published')), projects);
        const folders = "['projects/archive/published', 'projects/coauthor']";
        for (const stage of ['submitted', 'published']) {
            expect(scopesSaying(found, said('audit.msg_stage_folder', stage, folders))).toEqual([]);
        }
    });

    it('name no project of the tier personal', () => {
        const project = projectAt('projects/active/x', { stage: 'published', tier: 'personal' });
        expect(
            scopesSaying(findingsOf(hubOf(row('projects/archive/published')), [project]), message)
        ).toEqual([]);
    });
});

describe('the shape of the audit setting', () => {
    const broken = `audit:
  required_files:
    - { stages: { flags: [live] } }
    - { file: README.md }
  required_sections: x
  website: { file: f }
  stage_folders:
    - { stages: { words: [published] } }
  colour: 1
`;
    const keys = [
        'audit.required_files.0.file',
        'audit.required_sections',
        'audit.website.list',
        'audit.website.title',
        'audit.website.kinds',
        'audit.stage_folders.0.folders',
        'audit.colour'
    ];

    /** The dotted keys the hub's shape findings name, each saying the hub's settings file. */
    function shapeKeys(found: AuditFinding[]): string[] {
        const shaped = found.filter((one) => one.scope === '.oculus/config.yml');
        for (const one of shaped) {
            expect(one.message).toBe(
                said('audit.msg_setting_shape', '.oculus/config.yml', one.where)
            );
        }
        return shaped.map((one) => one.where).sort();
    }

    it('give a hub that sets no audit: none of the findings of the setting', () => {
        const hub = hubOf('', { 'projects/a/project.yml': 'datasets: [d1]\n' }, [
            'projects/a/code'
        ]);
        const projects = [
            projectAt('projects/a', { stage: 'nascent' }),
            projectAt('projects/active/b', { stage: 'published' })
        ];
        const found = findingsOf(hub, projects);
        expect(found.filter((one) => one.kind === 'conform' || one.kind === 'publink')).toEqual([]);
        expect(settingFindings(found, 'projects/a')).toEqual([]);
        expect(settingFindings(found, 'projects/active/b')).toEqual([]);
    });

    it('name each part that is not of its shape in the hub settings file and run the rows that are, on the primary hub and on another', () => {
        for (const primary of [true, false]) {
            const hub = hubOf(broken);
            const found = findingsOf(hub, [projectAt('projects/a', { stage: 'nascent' })], primary);
            expect(shapeKeys(found)).toEqual([...keys].sort());
            expect(scopesSaying(found, said('audit.msg_required_file', 'README.md'))).toEqual([
                'projects/a'
            ]);
        }
    });

    it('name an empty kinds and check no feed', () => {
        const hub = hubOf(
            'audit:\n  website: { file: site/pubs.yml, list: papers, title: title, kinds: [] }\n',
            {
                'site/pubs.yml': 'thesis:\n  papers:\n    - title: Title of projects/a\n'
            }
        );
        const found = findingsOf(hub, [
            projectAt('projects/a', { stage: 'published', form: 'journal' })
        ]);
        expect(shapeKeys(found)).toEqual(['audit.website.kinds']);
        expect(found.filter((one) => one.kind === 'publink')).toEqual([]);
    });

    it('hold a project of the tier personal to no key of the setting set at once', () => {
        const all = `audit:
  required_files:
    - { file: README.md, stages: { not_flags: [terminal] } }
    - { file: LICENSE }
    - { file: code/README.md, folder: code }
  required_sections:
    - { file: README.md, heading: "## Data", key: datasets }
  stage_folders:
    - { stages: { words: [published] }, folders: [projects/archive] }
  website:
    file: site/pubs.yml
    list: papers
    title: title
${KINDS}`;
        const hub = hubOf(
            all,
            {
                'projects/active/x/project.yml': 'datasets: [d1]\n',
                'site/pubs.yml': 'thesis:\n  papers:\n    - title: Title of projects/active/x\n'
            },
            ['projects/active/x/code']
        );
        const personal = projectAt('projects/active/x', {
            stage: 'published',
            form: 'journal',
            tier: 'personal'
        });
        expect(settingFindings(findingsOf(hub, [personal]), 'projects/active/x')).toEqual([]);
    });
});
