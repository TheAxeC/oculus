// The audit scan, one case per rule, over a synthetic hub under the system temporary directory.
// Nothing outside that directory is read or written and every write asserts its path is inside it
// first, so no case reads the real hub or the engine's own configuration.
//
// The words are the engine's own catalog, read through loadConfig, so a case asserts the message
// the reader sees rather than a copy of it typed here. What this does NOT cover: the watcher
// publishing the scan, which is tests/server/root/watch/portfolio/portfolio.test.ts, and the view
// drawing it, which is tests/views/system/audit.test.ts.

import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    auditFindings,
    auditRules,
    firstMarker,
    jaccard,
    mutedSignatures,
    normalTitle,
    signatureOf,
    titleWords
} from '../../../src/lib/server/content/audit.ts';
import { scalarShape } from '../../../src/lib/server/content/audit/rules.ts';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { AuditFinding, Collection, Project } from '../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

/** The rules a case runs under unless it names its own. */
const RULES = auditRules({
    read_limits: { 'status.line': 20, next: 20, latest: 20, eli5: 20, results: 20 },
    stale_lag_days: 1,
    data_domains: ['heart'],
    waiting_status: ['submitted', 'under review'],
    publications_file: 'site/publications.yml',
    lifecycle: {
        live_chips: ['submit-ready', 'submitted', 'blocked'],
        terminal_types: ['published', 'nogo'],
        author_chips: ['lead', 'coauthor'],
        contradictory_chips: [
            ['submit-ready', 'submitted'],
            ['submit-ready', 'blocked']
        ]
    }
});

function scratch(): string {
    const dir = scratchDir('oculus-audit-');
    return dir;
}

function write(root: string, rel: string, body: string): void {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

function folder(root: string, rel: string): void {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(full, { recursive: true });
}

/** One project of the snapshot, with only the fields a rule reads set. */
function project(over: Partial<Project> = {}): Project {
    return fixtureProject({
        id: 'alpha',
        tier: 'active',
        type: 'active',
        title: 'A title',
        eli5: 'what it is',
        results: ['a result'],
        folder: 'projects/active/alpha',
        file: 'projects/active/alpha/project.yml',
        ...over
    });
}

/** One collection of the snapshot. */
function collection(hub: string, over: Partial<Collection> = {}): Collection {
    return {
        id: 'tasks',
        title: 'Tasks',
        file: join(hub, 'tasks/tasks.yml'),
        entries: [],
        ...over
    };
}

/** The scan over one hub, with the fixture's projects and collections. */
function scan(
    hub: string,
    projects: Project[],
    collections: Collection[] = [],
    rules = RULES
): AuditFinding[] {
    return auditFindings({ hub, projects, collections, rules, catalog });
}

/** The findings of one kind, as `where: message` lines. */
function lines(found: AuditFinding[], kind: string): string[] {
    return found.filter((one) => one.kind === kind).map((one) => `${one.where}: ${one.message}`);
}

describe('the open markers', () => {
    it('counts them per document and quotes the first line', () => {
        const hub = scratch();
        write(hub, 'projects/active/alpha/README.md', '# Alpha\n\nTODO: write the method\nTBD\n');
        write(hub, 'projects/active/alpha/code/README.md', 'FIXME: the loader\n');
        const found = scan(hub, [project()]);
        expect(lines(found, 'todo')).toEqual([
            'code/README.md: 1 open marker(s), the first "FIXME: the loader"',
            'README.md: 2 open marker(s), the first "TODO: write the method"'
        ]);
    });

    it('reads PRESENT.md and no other document of the folder', () => {
        const hub = scratch();
        write(
            hub,
            'projects/active/alpha/PRESENT.md',
            '---\ntitle: x\n---\n\n%VERIFY the number\n'
        );
        write(hub, 'projects/active/alpha/NOTES.md', 'TODO not scanned\n');
        expect(lines(scan(hub, [project()]), 'todo')).toEqual([
            'PRESENT.md: 1 open marker(s), the first "%VERIFY the number"'
        ]);
    });

    it('takes a marker only as a whole word', () => {
        const hub = scratch();
        write(hub, 'projects/active/alpha/README.md', 'TODOS are not markers, nor is ATBD.\n');
        expect(lines(scan(hub, [project()]), 'todo')).toEqual([]);
    });

    it('reads a collection intro and each entry', () => {
        const hub = scratch();
        write(hub, 'tasks/tasks.yml', 'title: Tasks\nentries: []\n');
        const found = scan(
            hub,
            [],
            [
                collection(hub, {
                    intro: 'TODO: describe the list',
                    entries: [
                        {
                            id: 'one',
                            title: 'A task',
                            fields: { note: 'FIXME: the wording' },
                            file: join(hub, 'tasks/tasks.yml'),
                            index: 0
                        }
                    ]
                })
            ]
        );
        expect(lines(found, 'todo')).toEqual([
            'A task: open marker: "note: "FIXME: the wording""',
            'tasks/tasks.yml: intro: "TODO: describe the list"'
        ]);
    });
});

describe('firstMarker', () => {
    it('collapses the line and leaves letters and ASCII alone', () => {
        expect(firstMarker('nothing here\n  TODO   the   thing  \nmore\n')).toBe('TODO the thing');
        expect(firstMarker('TODO wei\u00df \u2014 done')).toBe('TODO wei\u00df done');
        expect(firstMarker('nothing at all')).toBe('');
    });

    it('cuts the quoted line at 110 characters', () => {
        expect(firstMarker(`TODO ${'x'.repeat(200)}`)).toHaveLength(110);
    });
});

describe('the data gaps', () => {
    it('asks a published project for a venue', () => {
        const hub = scratch();
        const found = scan(hub, [project({ type: 'published', results: ['one'] })]);
        expect(lines(found, 'data')).toContain(
            'venue_id: published/submitted but no venue_id (no venue renders on the card)'
        );
    });

    it('asks a live project for results, and for a dataset in a data domain', () => {
        const hub = scratch();
        const bare = scan(hub, [project({ results: [] })]);
        expect(lines(bare, 'data')).toEqual(['project.yml: missing `results`']);
        const domain = scan(hub, [project({ results: [], domainIds: ['heart'] })]);
        expect(lines(domain, 'data')).toEqual([
            'project.yml: missing `datasets`',
            'project.yml: missing `results`'
        ]);
    });

    it('counts a result the author has tagged as provisional', () => {
        const hub = scratch();
        const found = scan(hub, [project({ results: ['[PROVISIONAL] 0.81 AUC', 'final'] })]);
        expect(lines(found, 'data')).toContain(
            'project.yml: 1 provisional result(s): the numbers are not final'
        );
    });

    it('asks a project with datasets for a Data section, and takes either place it lives', () => {
        const hub = scratch();
        const found = scan(hub, [project({ datasetIds: ['mimic'] })]);
        expect(lines(found, 'data')).toContain(
            'project: has `datasets` but no Data section (README.md `## Data` or DATA.md)'
        );

        const withSection = scratch();
        write(withSection, 'projects/active/alpha/README.md', '# Alpha\n\n## Data\n\nmimic.\n');
        expect(lines(scan(withSection, [project({ datasetIds: ['mimic'] })]), 'data')).toEqual([]);

        const withFile = scratch();
        write(withFile, 'projects/active/alpha/DATA.md', 'mimic.\n');
        expect(lines(scan(withFile, [project({ datasetIds: ['mimic'] })]), 'data')).toEqual([]);
    });

    it('reports a manifest the documents have run ahead of, with the date and the lag', () => {
        const hub = scratch();
        const when = Date.UTC(2026, 8, 14, 12);
        const found = scan(hub, [
            project({
                staleDays: 3,
                docs: [
                    { name: 'README.md', label: 'README', present: true, human: false, mtime: when }
                ]
            })
        ]);
        expect(lines(found, 'data')).toContain(
            `project.yml: docs changed ${new Date(when).getFullYear()}-09-${String(new Date(when).getDate()).padStart(2, '0')}, 3d after the manifest; refresh project.yml`
        );
    });

    it('reports a deposit pushed before the reproduction that validated it', () => {
        const hub = scratch();
        const found = scan(hub, [
            project({
                codeAvailability: { status: 'deposited', date: '2026-05-01' },
                reproduced: { date: '2026-06-01' }
            })
        ]);
        expect(lines(found, 'data')).toContain(
            'project.yml: deposit dated 2026-05-01 predates the from-scratch reproduction 2026-06-01: the reproduced code may not be what was pushed; re-push code/ and bump `code_availability.date`'
        );
    });

    it('says nothing about a deposit pushed after its reproduction', () => {
        const hub = scratch();
        const found = scan(hub, [
            project({
                codeAvailability: { status: 'deposited', date: '2026-07-01' },
                reproduced: { date: '2026-06-01' }
            })
        ]);
        expect(lines(found, 'data')).toEqual([]);
    });
});

describe('the collection invariants', () => {
    it('reports a collection file that is not there', () => {
        const hub = scratch();
        expect(lines(scan(hub, [], [collection(hub)]), 'data')).toEqual([
            'tasks/tasks.yml: collection file missing'
        ]);
    });

    it('asks for a status only where the file schema tracks one', () => {
        const hub = scratch();
        write(hub, 'tasks/tasks.yml', 'title: Tasks\nentries: []\n');
        const entries = [
            {
                id: 'one',
                title: 'A venue',
                fields: { name: 'A venue' },
                file: join(hub, 'tasks/tasks.yml'),
                index: 0
            }
        ];
        const untracked = collection(hub, {
            schema: [{ field: 'name', type: 'text' }],
            entries
        });
        expect(lines(scan(hub, [], [untracked]), 'data')).toEqual([]);

        const tracked = collection(hub, {
            schema: [{ field: 'status', type: 'select' }],
            entries
        });
        expect(lines(scan(hub, [], [tracked]), 'data')).toEqual(['A venue: missing status']);
    });

    it('asks an entry for a title, a status, a date when it waits, and real references', () => {
        const hub = scratch();
        write(hub, 'tasks/tasks.yml', 'title: Tasks\nentries: []\n');
        const found = scan(
            hub,
            [project()],
            [
                collection(hub, {
                    schema: [{ field: 'status', type: 'select' }],
                    entries: [
                        {
                            id: 'one',
                            title: '',
                            fields: {},
                            file: join(hub, 'tasks/tasks.yml'),
                            index: 0
                        },
                        {
                            id: 'two',
                            title: 'Waiting',
                            fields: { status: 'submitted' },
                            file: join(hub, 'tasks/tasks.yml'),
                            index: 1
                        },
                        {
                            id: 'three',
                            title: 'Linked',
                            fields: {
                                status: 'open',
                                related: ['alpha', 'nobody'],
                                link: 'nothing/here.md'
                            },
                            file: join(hub, 'tasks/tasks.yml'),
                            index: 2
                        }
                    ]
                })
            ]
        );
        expect(lines(found, 'data')).toEqual([
            'entry #1: missing status',
            'entry #1: missing title',
            'Linked: link path missing: nothing/here.md',
            'Linked: related id `nobody` is not a known project',
            'Waiting: status "submitted" but no date tracked'
        ]);
    });

    // A link the card opens as a web page is not looked for on disk; one it opens as a file of the
    // hub is, trimmed, and is reported only when nothing is there; one above the hub is not read.
    it('looks for a hub path on disk and leaves a web address alone', () => {
        const hub = scratch();
        write(hub, 'tasks/tasks.yml', 'title: Tasks\nentries: []\n');
        folder(hub, 'network/flta-2025');
        const entry = (index: number, title: string, link: string) => ({
            id: `e${index}`,
            title,
            fields: { status: 'open', link },
            file: join(hub, 'tasks/tasks.yml'),
            index
        });
        const found = scan(
            hub,
            [],
            [
                collection(hub, {
                    schema: [{ field: 'status', type: 'select' }],
                    entries: [
                        entry(0, 'Addressed', 'https://www.embs.org/jbhi/'),
                        entry(1, 'On disk', 'network/flta-2025'),
                        entry(2, 'Missing', 'nothing/here.md'),
                        entry(3, 'Padded', ' network/flta-2025 '),
                        // A name above the hub no other run makes, so nothing is there to find.
                        entry(4, 'Above', `../${basename(hub)}-above.md`)
                    ]
                })
            ]
        );
        expect(lines(found, 'data')).toEqual(['Missing: link path missing: nothing/here.md']);
    });
});

describe('the tier conformance', () => {
    it('asks an idea, an active and a manuscript project for the one README', () => {
        const hub = scratch();
        expect(lines(scan(hub, [project({ type: 'idea' })]), 'conform')).toEqual([
            'README.md: missing: the one private doc every project needs'
        ]);
        expect(lines(scan(hub, [project({ type: 'published' })]), 'conform')).toEqual([]);
    });

    it('reports a retired document, a non-canonical folder and a code folder with no README', () => {
        const hub = scratch();
        write(hub, 'projects/active/alpha/README.md', '# Alpha\n');
        write(hub, 'projects/active/alpha/IDEA.md', 'the idea\n');
        write(hub, 'projects/active/alpha/notes/METHOD_NOTES.md', 'notes\n');
        folder(hub, 'projects/active/alpha/paper');
        folder(hub, 'projects/active/alpha/code');
        expect(lines(scan(hub, [project()]), 'conform')).toEqual([
            'code/: code/ has no README.md (the deposit root)',
            'IDEA.md: retired doc: fold it into README.md',
            `notes${sep}METHOD_NOTES.md: retired doc: fold it into README.md`,
            'paper/: non-canonical folder: rename to manuscript/'
        ]);
    });
});

describe('the status guardrails', () => {
    it('asks finished work for the chip that names the author role', () => {
        const hub = scratch();
        const bare = project({ tier: 'archive', type: 'published', chips: [] });
        expect(lines(scan(hub, [bare]), 'manifest')).toContain(
            'status.chips: archive/coauthor entry has no author-role chip (lead / coauthor)'
        );
        const named = project({ tier: 'coauthor', type: 'published', chips: ['coauthor'] });
        expect(lines(scan(hub, [named]), 'manifest')).not.toContain(
            'status.chips: archive/coauthor entry has no author-role chip (lead / coauthor)'
        );
        // An open project is not asked: the role is a thing finished work records.
        expect(lines(scan(hub, [project({ chips: [] })]), 'manifest')).toEqual([]);
    });

    it('reports a terminal project still carrying the chips of work in flight', () => {
        const hub = scratch();
        const stale = project({
            tier: 'archive',
            type: 'published',
            chips: ['lead', 'submitted', 'blocked']
        });
        expect(lines(scan(hub, [stale]), 'manifest')).toContain(
            "status.chips: terminal (published) but still carries live chip(s) ['blocked', 'submitted']: stale; clear them or re-open the project"
        );
    });

    it('reports an open project carrying the published chip', () => {
        const hub = scratch();
        const accepted = project({ tier: 'manuscripts', type: 'manuscript', chips: ['published'] });
        expect(lines(scan(hub, [accepted]), 'manifest')).toContain(
            'status.chips: projects-tier carries `published`: it got accepted; move the folder to archive/published/'
        );
        // Archived work carrying it is where it belongs, so nothing is said there.
        const archived = project({
            tier: 'archive',
            type: 'published',
            chips: ['lead', 'published']
        });
        expect(lines(scan(hub, [archived]), 'manifest')).toEqual([]);
    });

    it('reports a pair of chips that cannot both be true', () => {
        const hub = scratch();
        const both = project({ chips: ['submit-ready', 'blocked'] });
        expect(lines(scan(hub, [both]), 'manifest')).toContain(
            'status.chips: contradictory status chips `submit-ready` + `blocked`'
        );
        expect(lines(scan(hub, [project({ chips: ['submit-ready'] })]), 'manifest')).toEqual([]);
    });

    it('asks a live project for an eli5 and takes one that is there', () => {
        const hub = scratch();
        expect(lines(scan(hub, [project({ eli5: undefined })]), 'manifest')).toEqual([
            'eli5: missing'
        ]);
        expect(lines(scan(hub, [project({ eli5: '' })]), 'manifest')).toEqual(['eli5: missing']);
        expect(lines(scan(hub, [project()]), 'manifest')).toEqual([]);
        // A finished project is not asked for one.
        const done = project({
            tier: 'archive',
            type: 'published',
            chips: ['lead'],
            eli5: undefined
        });
        expect(lines(scan(hub, [done]), 'manifest')).toEqual([]);
    });

    it('reads the chip vocabularies from the configuration and says nothing without them', () => {
        const hub = scratch();
        const bare = auditRules({});
        const stale = project({ tier: 'archive', type: 'published', chips: ['submitted'] });
        expect(lines(scan(hub, [stale], [], bare), 'manifest')).toEqual([]);
    });

    it('is drawn after the conformance findings and before the readability ones', () => {
        const hub = scratch();
        const one = project({
            tier: 'archive',
            type: 'published',
            venueId: 'jmlr',
            chips: [],
            statusLine: 'x'.repeat(30)
        });
        expect(scan(hub, [one]).map((finding) => finding.kind)).toEqual([
            'manifest',
            'readability'
        ]);
    });
});

describe('the readability limits', () => {
    it('reports a field that has grown past its limit, and each result of its own', () => {
        const hub = scratch();
        const long = 'x'.repeat(30);
        const found = scan(hub, [
            project({ statusLine: long, next: long, results: [long, 'short'] })
        ]);
        expect(lines(found, 'readability')).toEqual([
            '`next`: 30 chars (>20): trim to a glance; detail belongs in the prose docs',
            '`status.line`: 30 chars (>20): trim to a glance; detail belongs in the prose docs',
            'results[0]: 30 chars (>20): headline only'
        ]);
    });

    it('says nothing about a field inside its limit', () => {
        const hub = scratch();
        expect(lines(scan(hub, [project({ statusLine: 'short' })]), 'readability')).toEqual([]);
    });
});

describe('the website sync', () => {
    const site = [
        'journal:',
        '  papers:',
        '    - { title: "A published paper" }',
        'papers-in-preparation:',
        '  papers:',
        '    - { title: "A paper being drafted" }',
        'abandoned-papers:',
        '  papers:',
        '    - { title: "A dead end that is public" }',
        ''
    ].join('\n');

    function hubWithSite(): string {
        const hub = scratch();
        write(hub, 'site/publications.yml', site);
        return hub;
    }

    it('is skipped without a word when the site repository is not checked out', () => {
        expect(lines(scan(scratch(), [project({ type: 'published' })]), 'publink')).toEqual([]);
    });

    it('reports a public work with no entry on the site', () => {
        const hub = hubWithSite();
        const found = scan(hub, [
            project({ type: 'published', title: 'Something else entirely', chips: ['journal'] })
        ]);
        expect(lines(found, 'publink')).toContain(
            'publications.yml: public (`published`) but no website entry: add it (likely section journal/other-publications)'
        );
    });

    it('reports a public work listed in a section its type does not expect', () => {
        const hub = hubWithSite();
        const found = scan(hub, [
            project({ type: 'published', title: 'A paper being drafted', chips: ['journal'] })
        ]);
        expect(lines(found, 'publink')).toContain(
            "publications.yml: on the website under ['papers-in-preparation'] but hub type `published` expects ['journal', 'other-publications']: wrong section?"
        );
    });

    it('reports a near match whose title differs', () => {
        const hub = hubWithSite();
        const found = scan(hub, [
            project({ type: 'published', title: 'A published paper trial', chips: ['journal'] })
        ]);
        expect(lines(found, 'publink')).toContain(
            'publications.yml: likely on the website as "A published paper" (section [\'journal\']) but the titles differ: reconcile them'
        );
    });

    it('reports a hub-private negative result that reached the public site', () => {
        const hub = hubWithSite();
        const found = scan(hub, [project({ type: 'nogo', title: 'A published paper' })]);
        expect(lines(found, 'publink')).toContain(
            "publications.yml: hub-private negative result (`nogo`) but appears on the PUBLIC website under ['journal']: remove it (null/negative results never leave the hub)"
        );
    });

    it('reports a dead end that is public as one to reconcile', () => {
        const hub = hubWithSite();
        const found = scan(hub, [project({ type: 'dropped', title: 'A dead end that is public' })]);
        expect(lines(found, 'publink')).toContain(
            "publications.yml: hub marks this `dropped` but it appears on the PUBLIC website under ['abandoned-papers']; retype to `published` if it is a real publication, else remove it from the site (or mute if intentional)"
        );
    });

    it('counts the site papers no project claims', () => {
        const hub = hubWithSite();
        const found = scan(hub, [
            project({ type: 'published', title: 'A published paper', chips: ['journal'] })
        ]);
        expect(lines(found, 'publink')).toContain(
            'publications.yml: 2 website paper(s) not matched to any hub project, expected for pre-hub work; verify none are stale or duplicated: "A paper being drafted"; "A dead end that is public"'
        );
    });

    it('says what it could not parse', () => {
        const hub = scratch();
        write(hub, 'site/publications.yml', 'journal:\n  papers: [\n');
        const found = scan(hub, []).find((one) => one.kind === 'publink');
        expect(found?.message.startsWith('could not parse publications.yml: ')).toBe(true);
    });
});

describe('the title matching behind the website sync', () => {
    it('folds a title to its letters and digits', () => {
        expect(normalTitle('Block-Term, Revisited!')).toBe('blocktermrevisited');
    });

    it('drops the stopwords and the single letters', () => {
        expect([...titleWords('A Study of the ECoG Signals')].sort()).toEqual([
            'ecog',
            'signals',
            'study'
        ]);
    });

    it('measures the overlap of two word sets', () => {
        expect(jaccard(new Set(['a', 'b']), new Set(['a', 'b']))).toBe(1);
        expect(jaccard(new Set(['a', 'b']), new Set(['b', 'c']))).toBeCloseTo(1 / 3);
        expect(jaccard(new Set(), new Set(['a']))).toBe(0);
    });
});

describe('the signature', () => {
    it('is twelve hex characters of a sha1 over the scope, place, kind, key and arguments', () => {
        const one = signatureOf('projects/active/alpha', 'README.md', 'todo', 'audit.msg_markers', [
            1,
            'TODO one'
        ]);
        expect(one).toMatch(/^[0-9a-f]{12}$/);
        expect(
            signatureOf('projects/active/alpha', 'README.md', 'todo', 'audit.msg_markers', [
                1,
                'TODO one'
            ])
        ).toBe(one);
        expect(
            signatureOf('projects/active/alpha', 'README.md', 'todo', 'audit.msg_markers', [
                2,
                'TODO one'
            ])
        ).not.toBe(one);
        expect(
            signatureOf('projects/active/beta', 'README.md', 'todo', 'audit.msg_markers', [
                1,
                'TODO one'
            ])
        ).not.toBe(one);
        expect(
            signatureOf('projects/active/alpha', 'README.md', 'todo', 'audit.msg_intro_marker', [
                1,
                'TODO one'
            ])
        ).not.toBe(one);
    });

    it('is carried by every finding the scan reports, twelve hex characters each', () => {
        const hub = scratch();
        write(hub, 'projects/active/alpha/README.md', 'TODO one\n');
        const found = scan(hub, [project()]);
        expect(found.length).toBeGreaterThan(0);
        for (const finding of found) expect(finding.signature).toMatch(/^[0-9a-f]{12}$/);
    });

    it('is stable across two scans of the same hub', () => {
        const hub = scratch();
        write(hub, 'projects/active/alpha/README.md', 'TODO one\n');
        expect(scan(hub, [project()]).map((one) => one.signature)).toEqual(
            scan(hub, [project()]).map((one) => one.signature)
        );
    });

    it('survives a reworded catalog sentence, so a mute made before the reword still holds', () => {
        const hub = scratch();
        write(hub, 'projects/active/alpha/README.md', 'TODO one\n');
        const before = scan(hub, [project()]);
        const reworded = { ...catalog, 'audit.msg_markers': 'REWORDED {0} and {1}' };
        const after = auditFindings({
            hub,
            projects: [project()],
            collections: [],
            rules: RULES,
            catalog: reworded
        });
        expect(after.map((one) => one.signature)).toEqual(before.map((one) => one.signature));
        expect(after.map((one) => one.message)).not.toEqual(before.map((one) => one.message));
        expect(after.some((one) => one.message.startsWith('REWORDED'))).toBe(true);
    });
});

describe('the rules and the mute list read out of the configuration', () => {
    it("holds the two chip vocabularies in the engine's own config, so the rules are on", () => {
        // A key absent from the shipped file would turn its rule off with a green suite.
        const shipped = auditRules(loadConfig(engineDir()).config);
        expect(shipped.authorChips).toEqual(['lead', 'coauthor']);
        expect(shipped.contradictory).toHaveLength(3);
        expect(shipped.liveChips.size).toBeGreaterThan(0);
        expect(shipped.terminalTypes.has('published')).toBe(true);
    });

    it('takes the limits, the lag, the domains, the statuses and the site file', () => {
        expect(RULES.staleLagDays).toBe(1);
        expect(RULES.readLimits.next).toBe(20);
        expect([...RULES.dataDomains]).toEqual(['heart']);
        expect([...RULES.waitingStatus]).toEqual(['submitted', 'under review']);
        expect(RULES.publicationsFile).toBe('site/publications.yml');
    });

    it('falls back where a key is absent or of the wrong shape', () => {
        const bare = auditRules({});
        expect(bare.staleLagDays).toBe(1);
        expect(bare.readLimits).toEqual({});
        expect(bare.publicationsFile).toBe('');
        expect([...bare.dataDomains]).toEqual([]);
    });

    it('takes only the signatures the mute list holds', () => {
        expect(mutedSignatures({ audit_ignore: ['0123456789ab', 'nonsense', 7] })).toEqual([
            '0123456789ab'
        ]);
        expect(mutedSignatures({})).toEqual([]);
    });
});

describe('a ghost project', () => {
    it('is scanned by no rule, since it has no manifest to be missing anything', () => {
        const hub = scratch();
        write(hub, 'projects/active/alpha/README.md', 'TODO one\n');
        expect(scan(hub, [project({ ghost: true, type: undefined })])).toEqual([]);
    });
});

describe('the rules read out of a configuration of the wrong shape', () => {
    it('keeps the read limits that are finite numbers and the stale lag that is one', () => {
        const rules = auditRules({
            read_limits: { a: 1, b: '2', c: NaN, d: Infinity },
            stale_lag_days: Infinity,
            publications_file: 3
        });
        expect(rules.readLimits).toStrictEqual({ a: 1 });
        expect(rules.staleLagDays).toBe(1);
        expect(rules.publicationsFile).toBe('');
        expect(auditRules({ stale_lag_days: 5, read_limits: [] })).toMatchObject({
            readLimits: {},
            staleLagDays: 5
        });
    });

    it('reads the vocabularies as the strings they hold, and a lifecycle that is a list as empty', () => {
        const rules = auditRules({ data_domains: ['A ', 3], waiting_status: 'x', lifecycle: [] });
        expect([...rules.dataDomains]).toEqual(['a']);
        expect(rules.waitingStatus.size).toBe(0);
        expect(rules.liveChips.size).toBe(0);
        expect(rules.contradictory).toStrictEqual([]);
        const chips = auditRules({
            lifecycle: {
                live_chips: ['a', '', 3],
                terminal_types: 'x',
                author_chips: ['b'],
                contradictory_chips: [['a', 'b'], ['a'], 'ab', ['a', 3, 'b'], ['', 'b']]
            }
        });
        expect([...chips.liveChips]).toEqual(['a']);
        expect(chips.terminalTypes.size).toBe(0);
        expect(chips.authorChips).toStrictEqual(['b']);
        expect(chips.contradictory).toStrictEqual([
            ['a', 'b'],
            ['a', 'b']
        ]);
    });

    it('keeps the muted signatures that are twelve lowercase hex characters, in order', () => {
        const held = [
            '0123456789ab',
            3,
            'xyz',
            'ABCDEF012345',
            '0123456789abc',
            null,
            'fedcba987654'
        ];
        expect(mutedSignatures({ audit_ignore: held })).toStrictEqual([
            '0123456789ab',
            'fedcba987654'
        ]);
        expect(mutedSignatures({ audit_ignore: 'x' })).toStrictEqual([]);
    });
});

describe('the website feed of the wrong shape', () => {
    const NO_ENTRY =
        'publications.yml: public (`published`) but no website entry: add it (likely section journal/other-publications)';

    /** The website findings for one published paper over a feed holding this text. */
    function findingsOver(feed: string): string[] {
        const hub = scratch();
        write(hub, 'site/publications.yml', feed);
        const found = scan(hub, [
            project({ type: 'published', title: 'A published paper', chips: ['journal'] })
        ]);
        return lines(found, 'publink');
    }

    it('reads a feed that is a list, a block that is a list and papers that are a map as holding none', () => {
        expect(findingsOver('- a\n- b\n')).toStrictEqual([NO_ENTRY]);
        expect(findingsOver('journal:\n  - x\n')).toStrictEqual([NO_ENTRY]);
        expect(findingsOver('journal:\n  papers:\n    a: 1\n')).toStrictEqual([NO_ENTRY]);
    });

    it('skips a paper that is a string and matches the one beside it', () => {
        const feed =
            'journal:\n  papers:\n    - just a string\n    - { title: "A published paper" }\n';
        expect(findingsOver(feed)).toStrictEqual([]);
    });

    it('reads a section named __proto__ as a section', () => {
        const feed = '"__proto__":\n  papers:\n    - { title: "A published paper" }\n';
        expect(findingsOver(feed)).toStrictEqual([
            "publications.yml: on the website under ['__proto__'] but hub type `published` expects ['journal', 'other-publications']: wrong section?"
        ]);
    });
});

describe('a scalar field read as text', () => {
    it('answers what the shared scalar helper answers, for every kind of value', () => {
        const values: unknown[] = [
            'a',
            '',
            0,
            5,
            -1.5,
            Number.NaN,
            Number.POSITIVE_INFINITY,
            true,
            false,
            null,
            undefined,
            [],
            {},
            [1],
            10n
        ];
        for (const value of values) {
            expect(scalarShape.parse(value), String(value)).toBe(scalar(value, ''));
        }
    });
});
