// Layer 2, route tests. The audit's research rules (the open markers of a README, the length of
// a manifest's glance fields, the website's publication list) run over a project of the tier
// `research` and skip a project of the tier `personal`, which the research rules do not cover.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { Project } from '../../../src/lib/data/model/index.ts';
import { auditFindings } from '../../../src/lib/server/content/audit/scan.ts';
import { auditRules } from '../../../src/lib/server/content/audit/rules.ts';
import { holdersOf } from '../../../src/lib/data/helpers/hub-names.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';
import { it, plantFile, scratchDir } from '../../fixtures/scratch.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const EIGHT_HUNDRED = 'a'.repeat(800);

/** A hub holding one README with an open marker for each project, and a website feed. */
function hubWith(projects: Project[]): string {
    const hub = scratchDir('oculus-audit-');
    for (const project of projects) {
        plantFile(hub, `${project.folder}/README.md`, '# A project\n\nTODO write this\n');
    }
    plantFile(
        hub,
        'publications.yml',
        'journal:\n  papers:\n    - title: A paper the hub does not hold\n'
    );
    return hub;
}

/** The project of a tier, with an open marker, a long `eli5` and the stage of a published paper. */
function projectOf(tier: 'research' | 'personal'): Project {
    return fixtureProject({
        id: `hub:${tier}`,
        root: 'hub',
        tier,
        stage: 'published',
        title: `Title of ${tier}`,
        folder: `projects/${tier}`,
        file: `projects/${tier}/project.yml`,
        eli5: EIGHT_HUNDRED
    });
}

describe('the research rules of the audit', () => {
    const projects = [projectOf('research'), projectOf('personal')];
    const hub = hubWith(projects);
    const rules = { ...auditRules(config), publicationsFile: 'publications.yml' };
    const held = holdersOf(projects);
    const own = { hub, root: 'hub', primary: true, held, self: new Set<string>() };
    const found = auditFindings({ ...own, projects, collections: [], rules, catalog });
    const kinds = (scope: string): string[] =>
        found
            .filter((one) => one.scope === scope)
            .map((one) => one.kind)
            .sort();

    it('raise a marker, a readability and a publication row for a project of the tier research', () => {
        const kindsOfProjects = kinds('projects/research');
        expect(kindsOfProjects).toContain('todo');
        expect(kindsOfProjects).toContain('readability');
        expect(kindsOfProjects).toContain('publink');
    });

    it('raise none of the three for a project of the tier personal', () => {
        const kindsOfPersonal = kinds('projects/personal');
        expect(kindsOfPersonal).not.toContain('todo');
        expect(kindsOfPersonal).not.toContain('readability');
        expect(kindsOfPersonal).not.toContain('publink');
    });
});

describe('the Deposit rules of the audit', () => {
    it('ask a project read from a workspace folder the order of its deposit and its reproduction, and the README of its code folder', () => {
        const hub = scratchDir('oculus-audit-hub-');
        const folder = scratchDir('oculus-audit-folder-');
        plantFile(folder, 'code/main.py', 'print(1)\n');
        const project = fixtureProject({
            id: 'hub:inside',
            root: 'hub',
            tier: 'research',
            stage: 'exploring',
            title: 'Inside',
            folder: '',
            file: '.oculus/project.yml',
            workspaceFolder: { root: folder, dir: folder },
            codeAvailability: { status: 'deposited', date: '2026-01-01' },
            reproduced: { date: '2026-02-01' }
        });
        const rules = { ...auditRules(config), publicationsFile: 'publications.yml' };
        const found = auditFindings({
            hub,
            root: 'hub',
            primary: true,
            held: holdersOf([project]),
            self: new Set<string>(),
            projects: [project],
            collections: [],
            rules,
            catalog
        });
        const messages = found.filter((one) => one.scope === folder).map((one) => one.message);
        expect(messages).toContain(
            catalog['audit.msg_deposit_before_reproduction']
                .replace('{0}', '2026-01-01')
                .replace('{1}', '2026-02-01')
        );
        expect(messages).toContain(catalog['audit.msg_code_no_readme']);
    });
});
