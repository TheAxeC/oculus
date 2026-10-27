// Layer 2, client-state tests. A board's offer of New project, and the board a name of the Focus
// board's Awaiting box opens: a board offers New project only when its rule takes the project the
// write makes (state/boards/board/new-project.ts), with the tier it writes and the person it names;
// the track record boards and the Awaiting box's board offer none. The Awaiting box's board takes
// exactly the projects the pressed name counts on the Focus page under the filter the tab carries
// (state/boards/focus/filter.ts `awaitingTake`, state/boards/board/presets.ts `awaitingPreset`),
// each once. The projects are synthetic, made by board-fixture.ts with the shipped config; the hub
// of the last row of New project is planted in a scratch folder. The rest of G124's tables are
// board-rules.test.ts's.
//
// It does not cover the box drawing its names as buttons, the tab a press opens or its title,
// which the look does.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Id, Person, Project, Snapshot, Venue } from '../../../../src/lib/data/model/index.ts';
import { portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { HUB_FILE, holdersOf } from '../../../../src/lib/data/helpers/hub-names.ts';
import { createIdea } from '../../../../src/lib/server/edit/writes/manifest.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { rolesOf } from '../../../../src/lib/data/shapes/boards/roles.ts';
import { takeContext } from '../../../../src/lib/data/shapes/boards/takes.ts';
import {
    awaitingPreset,
    boardIds,
    boardItems,
    presetFor,
    recordPreset
} from '../../../../src/lib/state/boards/board/index.ts';
import {
    newProjectPerson,
    newProjectTier,
    offersNewProject
} from '../../../../src/lib/state/boards/board/new-project.ts';
import type { AwaitingRow } from '../../../../src/lib/state/boards/focus.ts';
import {
    awaitingTab,
    awaitingTake,
    focusPage,
    type FocusFilter
} from '../../../../src/lib/state/boards/focus/filter.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { it as scratchIt, plantScratch } from '../../../fixtures/scratch.ts';
import { CATALOG, CONFIG, MINE, NOBODY, SELF, project, snapshotOf } from './board-fixture.ts';

setCatalog(CATALOG);

describe('New project on a board', () => {
    it.each([
        { name: 'with self named', self: MINE },
        { name: 'with no self', self: NOBODY }
    ])('is offered on the boards that take the project it writes, $name', (row) => {
        const offered = boardIds(CONFIG).filter((id) =>
            offersNewProject(presetFor(id, CONFIG).rule, takeContext(CONFIG, row.self))
        );
        expect(offered).toEqual(['projects', 'supervision', 'coauthor', 'personal', 'software']);
    });

    it.each([
        { name: 'with self named', self: MINE },
        { name: 'with no self', self: NOBODY }
    ])("is offered on no role's track record board, $name", (row) => {
        const offered = rolesOf(CONFIG).filter((role) =>
            offersNewProject(recordPreset(role.key, CONFIG).rule, takeContext(CONFIG, row.self))
        );
        expect(offered).toEqual([]);
    });

    it.each([
        { name: 'with self named', self: MINE },
        { name: 'with no self', self: NOBODY }
    ])("is offered on no Awaiting box's board, $name", (row) => {
        const rule = awaitingPreset(['c1', 'c9'], CONFIG).rule;
        expect(offersNewProject(rule, takeContext(CONFIG, row.self))).toBe(false);
    });

    it("leaves a role's track record board without a project while no self is named", () => {
        const projects = ['c1', 'c2', 'c3', 'c8'].map((id) => project(id));
        const preset = recordPreset('lead', CONFIG);
        const taken = (self: boolean) =>
            boardItems(snapshotOf(projects, self), preset).map((one) => one.id);
        expect(taken(true)).toEqual(['c1', 'c3']);
        expect(taken(false)).toEqual([]);
    });

    /** The shipped config with the tiers of `tiers` carrying `default`, and coauthor's `tier`. */
    function withTiers(defaults: string[], tier: unknown): Record<string, unknown> {
        const tiers = Object.fromEntries(
            Object.entries(CONFIG.tiers as Record<string, Record<string, unknown>>).map(
                ([word, row]) => [word, { ...row, default: defaults.includes(word) }]
            )
        );
        const boards = CONFIG.boards as Record<string, Record<string, unknown>>;
        const coauthor: Record<string, unknown> = { ...boards.coauthor, tier };
        if (tier === undefined) delete coauthor.tier;
        return { ...CONFIG, tiers, boards: { ...boards, coauthor } };
    }

    it.each([
        {
            name: 'case 8: several tiers with the default among them write the default',
            defaults: ['research'],
            tier: ['research', 'personal'],
            writes: 'research'
        },
        {
            name: 'case 8: several tiers without the default offer no New project',
            defaults: ['research'],
            tier: ['personal', 'software'],
            writes: undefined
        },
        {
            name: 'one tier writes it whatever the default',
            defaults: [],
            tier: 'personal',
            writes: 'personal'
        },
        {
            name: 'no tier writes the default',
            defaults: ['research'],
            tier: undefined,
            writes: 'research'
        },
        {
            name: 'no tier and no default offer no New project',
            defaults: [],
            tier: undefined,
            writes: undefined
        },
        {
            name: 'no tier and two defaults offer no New project',
            defaults: ['research', 'personal'],
            tier: undefined,
            writes: undefined
        }
    ])('$name', (row) => {
        const config = withTiers(row.defaults, row.tier);
        const rule = presetFor('coauthor', config).rule;
        expect(newProjectTier(rule, config)).toEqual(row.writes);
        const offered = offersNewProject(rule, takeContext(config, MINE));
        expect(offered).toBe(row.writes !== undefined);
    });

    it.each([
        { name: 'the role lead', keys: ['lead'], field: 'lead' },
        { name: 'the role supervisor', keys: ['supervisor'], field: 'supervisors' },
        {
            name: 'the roles collaborator and other',
            keys: ['collaborator', 'other'],
            field: 'collaborators'
        },
        { name: 'no role: key, every row in order', keys: null, field: 'lead' },
        { name: 'roles with no field', keys: ['other'], field: null }
    ])('names the user, for a board naming $name', (row) => {
        const person = newProjectPerson(rolesOf(CONFIG), row.keys, MINE);
        expect(person).toEqual(row.field === null ? null : { role_field: row.field, self: SELF });
        expect(newProjectPerson(rolesOf(CONFIG), row.keys, NOBODY)).toBeNull();
    });

    it.each([
        { board: 'personal', field: 'lead' },
        { board: 'software', field: 'lead' },
        { board: 'supervision', field: 'supervisors' }
    ])('names the user on $board from the shipped board row', (row) => {
        const rule = presetFor(row.board, CONFIG).rule;
        const person = newProjectPerson(rolesOf(CONFIG), rule.roles, MINE);
        expect(person).toEqual({ role_field: row.field, self: SELF });
    });

    it.each([
        { name: 'offers none for lab, which holds its own kim', labKim: true, person: null },
        {
            name: 'offers it for lab, which holds no kim, naming kim as lead',
            labKim: false,
            person: { role_field: 'lead', self: 'kim' }
        }
    ])('case 26: with self naming the primary kim, $name', (row) => {
        const self: ReadonlySet<Id> = new Set(['hub:kim']);
        const ids = ['hub:kim', ...(row.labKim ? ['lab:kim'] : [])];
        const holders = holdersOf(ids.map((id) => ({ id, root: id.split(':')[0] })));
        const context = { ...takeContext(CONFIG, self), people: { holders, primary: 'hub' } };
        const rule = presetFor('projects', CONFIG).rule;
        const where = { hub: 'lab', holders };
        expect(offersNewProject(rule, context, 'lab')).toBe(row.person !== null);
        expect(newProjectPerson(rolesOf(CONFIG), rule.roles, self, where)).toEqual(row.person);
        expect(offersNewProject(rule, context, 'hub')).toBe(true);
    });

    scratchIt(
        "reads the stage written and the boards that offer it in the chosen hub's words",
        () => {
            // `home` keeps `nascent` with no `new_idea` and adds `shelved`, a terminal stage
            // carrying it, so a new project of `home` is written at `shelved` and sits on the
            // archive board.
            const settings = [
                'scan: [ { dir: projects/ideas } ]',
                'new_project_dir: { research: projects/ideas }',
                'stages:',
                '  nascent: { label: nascent, icon: white, color: "#7c5cff", idea: true, on_map: true }',
                '  shelved: { label: shelved, icon: done, color: "#9ca3af", terminal: true, new_idea: true }',
                ''
            ].join('\n');
            const home = plantScratch('oculus-board-home-', { [HUB_FILE]: settings }, [
                'projects/ideas'
            ]);
            const read = loadConfig(engineDir(), { hub: home });
            expect(read.findings).toEqual([]);
            const homeWords = { config: read.config, roles: rolesOf(read.config) };
            const context = {
                ...takeContext(CONFIG, MINE),
                wordsOf: (hub: string) => (hub === 'home' ? homeWords : takeContext(CONFIG, MINE))
            };
            const offered = (hub?: string) =>
                boardIds(CONFIG).filter((id) =>
                    offersNewProject(presetFor(id, CONFIG).rule, context, hub)
                );
            expect(offered()).toEqual([
                'projects',
                'supervision',
                'coauthor',
                'personal',
                'software'
            ]);
            expect(offered('home')).toEqual([
                'supervision',
                'coauthor',
                'archive',
                'personal',
                'software'
            ]);
            const out = createIdea(home, portfolioConfigFrom(read.config, read.from), {
                id: 'new-idea',
                tier: 'research'
            });
            expect(out.refused).toEqual([]);
            const written = readFileSync(join(home, 'projects/ideas/new-idea/project.yml'), 'utf8');
            expect(written).toContain('\nstage: shelved\n');
        }
    );
});

describe("the Awaiting box's board", () => {
    /** The moment the Focus page is worked out at. */
    const NOW = Date.parse('2026-10-27T12:00:00Z');

    /** The Focus filter with Mine only off and everything ticked. */
    const EVERY: FocusFilter = { mine: false, roles: [], tiers: [], pillars: [], hubs: [] };

    /** A project the user leads on the research tier, with the fields given. */
    function lead(id: string, over: Partial<Project>): Project {
        return project(id, { tier: 'research', lead: [SELF], ...over });
    }

    /** A snapshot of the projects with the venue BSPC and the person Maryam beside the user. */
    function portfolio(projects: Project[]): Snapshot {
        const held = snapshotOf(projects);
        const venue: Venue = {
            id: 'bspc',
            name: 'Biomedical Signal Processing and Control',
            short: 'BSPC',
            themes: []
        };
        const maryam: Person = {
            id: 'maryam',
            name: 'Maryam',
            affiliations: [],
            links: [],
            projectIds: []
        };
        return {
            ...held,
            entities: {
                ...held.entities,
                venues: { bspc: venue },
                people: { ...held.entities.people, maryam }
            }
        };
    }

    const BSPC = [
        lead('a', { stage: 'submitted', venueId: 'bspc' }),
        lead('b', { stage: 'submitted', venueId: 'bspc', tier: 'software' }),
        lead('c', { stage: 'submitted' }),
        lead('d', { stage: 'exploring' })
    ];

    it.each([
        { name: 'the venue BSPC', projects: BSPC, row: 'review', key: 'BSPC', takes: ['a', 'b'] },
        { name: 'no venue', projects: BSPC, row: 'review', key: '', takes: ['c'] },
        {
            name: 'the person Maryam',
            projects: ['a', 'b', 'c', 'd'].map((id) =>
                lead(id, { stage: 'exploring', waitingOn: id === 'd' ? [] : ['maryam'] })
            ),
            row: 'people',
            key: 'Maryam',
            takes: ['a', 'b', 'c']
        },
        {
            name: 'the project Bee',
            projects: [
                lead('a', { stage: 'exploring', waitingOn: ['p'] }),
                lead('p', { stage: 'exploring', short: 'Bee' })
            ],
            row: 'people',
            key: 'Bee',
            takes: ['a']
        },
        {
            name: 'a waited-on value naming neither a person nor a project',
            projects: [lead('a', { stage: 'exploring', waitingOn: ['the ethics board'] })],
            row: 'people',
            key: 'the ethics board',
            takes: ['a']
        },
        {
            name: 'Blocked, a blocked project at a terminal stage on no awaiting lane',
            projects: [
                lead('a', { stage: 'exploring', chips: ['blocked'] }),
                lead('b', { stage: 'submitted', chips: ['blocked'] }),
                lead('c', { stage: 'published', chips: ['blocked'] })
            ],
            row: 'blocked',
            key: '',
            takes: ['a', 'b']
        },
        {
            name: 'the venue BSPC, one of its projects of a tier the Focus filter unticks',
            projects: BSPC,
            row: 'review',
            key: 'BSPC',
            filter: { ...EVERY, tiers: ['software'] },
            takes: ['a']
        },
        {
            name: 'the person Maryam, whom one project names twice',
            projects: [lead('a', { stage: 'exploring', waitingOn: ['maryam', 'maryam'] })],
            row: 'people',
            key: 'Maryam',
            takes: ['a']
        }
    ])('the board of the name for $name takes exactly the projects it counts, each once', (row) => {
        const snapshot = portfolio(row.projects);
        const scope = { self: MINE, hubs: [], wordsOf: () => CONFIG, lists: null };
        const tab = awaitingTab(row.row as AwaitingRow, row.key, '', row.filter ?? EVERY);
        const ids = awaitingTake(snapshot, CONFIG, NOW, tab, scope);
        expect([...ids].sort()).toEqual(row.takes);
        const items = boardItems(snapshot, awaitingPreset(ids, CONFIG));
        expect(items.map((one) => one.id).sort()).toEqual(row.takes);
    });

    it('a venue name counts and holds only the projects the Focus filter keeps', () => {
        const scope = { self: MINE, hubs: [], wordsOf: () => CONFIG, lists: null };
        const filter = { ...EVERY, tiers: ['software'] };
        const page = focusPage(portfolio(BSPC), CONFIG, NOW, filter, scope);
        expect(page.sections.strip.venues).toEqual([
            { label: '', count: 1, ids: ['c'] },
            { label: 'BSPC', count: 1, ids: ['a'] }
        ]);
    });

    it('a person one project names twice counts that project once', () => {
        const scope = { self: MINE, hubs: [], wordsOf: () => CONFIG, lists: null };
        const projects = [lead('a', { stage: 'exploring', waitingOn: ['maryam', 'maryam'] })];
        const page = focusPage(portfolio(projects), CONFIG, NOW, EVERY, scope);
        expect(page.sections.strip.people).toEqual([{ label: 'Maryam', count: 1, ids: ['a'] }]);
    });
});
