// Layer 2, client-state tests. Which boards a project is on, its category and the user's role on
// it, read from the shipped vocabulary and boards: a project is on every board whose keys it meets
// (data/shapes/boards/takes.ts), in the category of the first row of `categories:` holding it
// (categories.ts), and its role is the first row of `roles:` whose field holds the person the
// workspace setting `self` names (roles.ts). One table per unit: the boards that take a project,
// the category, the role with the Lead badge and Mine only, the board items with the Mine only
// filter and the Role facet, the card sections, the rail count, the Archival band with the real
// projects and the Orphans card, the Focus lanes with their clusters and the moves onto them, the
// audit's placement findings, the board keys with the config check, a saved slice filter, New
// project with the tier it writes and the track record boards that offer none, and the roles of a
// collection. The projects are synthetic, made by board-fixture.ts with the shipped config; the
// collection is planted in a scratch hub and built through buildOneHub. The board views registered
// from `boards:` are board-views.test.ts's.
//
// It does not cover the views drawing the toggle, the badge, the facet or the sections, which the
// look does.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AuditFinding, Pillar } from '../../../../src/lib/data/model/index.ts';
import { portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import { createIdea } from '../../../../src/lib/server/edit/writes/manifest.ts';
import { findingText } from '../../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { boardsFindings } from '../../../../src/lib/data/sources/config/sections/boards.ts';
import {
    categoriesOf,
    categoryOf,
    railCount
} from '../../../../src/lib/data/shapes/boards/categories.ts';
import {
    entryRoles,
    isLead,
    isMine,
    rolesOf
} from '../../../../src/lib/data/shapes/boards/roles.ts';
import {
    boardsTaking,
    projectPeople,
    projectRole,
    takeContext
} from '../../../../src/lib/data/shapes/boards/takes.ts';
import { guardrails } from '../../../../src/lib/server/content/audit/projects.ts';
import { hubAuditSetting } from '../../../../src/lib/server/content/audit/setting.ts';
import {
    auditRules,
    collector,
    signatureOf
} from '../../../../src/lib/server/content/audit/rules.ts';
import {
    applyFilters,
    boardIds,
    boardItems,
    cardSections,
    facets,
    parseBoardState,
    presetFor,
    recordPreset,
    sliceGroups
} from '../../../../src/lib/state/boards/board/index.ts';
import {
    newProjectPerson,
    newProjectTier,
    offersNewProject
} from '../../../../src/lib/state/boards/board/new-project.ts';
import {
    clusters,
    hubMovable,
    hubMoveOnto,
    lanes,
    lanesIn,
    projectLane,
    unplaced
} from '../../../../src/lib/state/boards/focus.ts';
import { archival, orphans } from '../../../../src/lib/state/boards/structure/lines.ts';
import { realProjects } from '../../../../src/lib/state/sources/registries/venues.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { buildOneHub } from '../../../fixtures/hubs/hub-build.ts';
import { it as scratchIt, plantScratch } from '../../../fixtures/scratch.ts';
import {
    CASES,
    CATALOG,
    CONFIG,
    MINE,
    NOBODY,
    SELF,
    project,
    snapshotOf,
    withBoards
} from './board-fixture.ts';

setCatalog(CATALOG);

describe('the boards a project is on', () => {
    it.each([
        { name: 'case 1, a lead at revision', id: 'c1', self: MINE, boards: ['projects'] },
        { name: 'case 2, role other', id: 'c2', self: MINE, boards: ['coauthor'] },
        { name: 'case 3, a published thesis', id: 'c3', self: MINE, boards: ['archive'] },
        { name: 'case 4, stopped', id: 'c4', self: MINE, boards: ['archive'] },
        { name: 'case 5, software', id: 'c5', self: MINE, boards: ['software'] },
        { name: 'case 6, personal', id: 'c6', self: MINE, boards: ['personal'] },
        { name: 'case 7, software of another', id: 'c7', self: MINE, boards: ['software'] },
        { name: 'case 8, a supervisor', id: 'c8', self: MINE, boards: ['supervision'] },
        { name: 'case 9, lead and supervisor', id: 'c9', self: MINE, boards: ['projects'] },
        { name: 'case 10, a word tiers does not hold', id: 'c10', self: MINE, boards: [] },
        { name: 'case 11, no tier', id: 'c11', self: MINE, boards: [] },
        { name: 'case 12, no lead', id: 'c12', self: MINE, boards: [] },
        { name: 'case 13, stopped and parked', id: 'c13', self: MINE, boards: ['archive'] },
        { name: 'case 14, published, no form', id: 'c14', self: MINE, boards: ['archive'] },
        {
            name: 'case 15, no self, live',
            id: 'c8',
            self: NOBODY,
            boards: ['projects', 'supervision', 'coauthor']
        },
        {
            name: 'case 15, no self, terminal',
            id: 'c4',
            self: NOBODY,
            boards: ['supervision', 'coauthor', 'archive']
        },
        {
            name: 'case 15, no self, no lead',
            id: 'c12',
            self: NOBODY,
            boards: ['projects', 'supervision', 'coauthor']
        }
    ])('$name', (row) => {
        expect(boardsTaking(project(row.id), takeContext(CONFIG, row.self))).toEqual(row.boards);
    });
});

describe('the category of a project', () => {
    it('reads a row naming no color with no colour', () => {
        const config = { ...CONFIG, categories: [{ key: 'x', stages: { words: ['exploring'] } }] };
        const categories = categoriesOf(config);
        expect(categories.map((one) => [one.key, one.color])).toEqual([['x', '']]);
        expect(categoryOf(project('c1', { stage: 'exploring' }), categories, config)?.key).toBe(
            'x'
        );
    });

    /** The shipped `categories:` without the row `dead-ends`. */
    const NO_DEAD_ENDS = {
        ...CONFIG,
        categories: (CONFIG.categories as { key: string }[]).filter(
            (row) => row.key !== 'dead-ends'
        )
    };

    it.each([
        { name: 'case 1, revision', id: 'c1', config: CONFIG, category: 'in-flight' },
        { name: 'case 2, submitted', id: 'c2', config: CONFIG, category: 'in-review' },
        { name: 'case 3, a published thesis', id: 'c3', config: CONFIG, category: 'other-outputs' },
        { name: 'case 4, stopped', id: 'c4', config: CONFIG, category: 'dead-ends' },
        { name: 'case 5, nascent', id: 'c5', config: CONFIG, category: 'idea' },
        { name: 'case 7, released', id: 'c7', config: CONFIG, category: 'released' },
        { name: 'case 14, published, no form', id: 'c14', config: CONFIG, category: undefined },
        { name: 'case 16, no dead-ends row', id: 'c4', config: NO_DEAD_ENDS, category: undefined }
    ])('$name', (row) => {
        const categories = categoriesOf(row.config);
        expect(categoryOf(project(row.id), categories, row.config)?.key).toEqual(row.category);
    });
});

describe("the user's role on a project", () => {
    const ROLES = rolesOf(CONFIG);
    const isSelf = (person: string): boolean => MINE.has(person);

    it.each([
        { name: 'case 1, the lead', id: 'c1', role: 'lead', lead: true, mine: true },
        { name: 'case 2, named nowhere', id: 'c2', role: 'other', lead: false, mine: false },
        { name: 'case 7, a collaborator', id: 'c7', role: 'collaborator', lead: false, mine: true },
        { name: 'case 8, the supervisor', id: 'c8', role: 'supervisor', lead: false, mine: true },
        { name: 'case 9, lead and supervisor', id: 'c9', role: 'lead', lead: true, mine: true },
        { name: 'case 12, naming no one', id: 'c12', role: undefined, lead: false, mine: true }
    ])('$name', (row) => {
        const one = project(row.id);
        expect(projectRole(one, ROLES, MINE)?.key).toEqual(row.role);
        expect(isLead(projectPeople(one), ROLES, isSelf)).toBe(row.lead);
        expect(isMine(projectPeople(one), ROLES, isSelf)).toBe(row.mine);
    });
});

describe("a board's items, the Mine only filter and the Role facet", () => {
    const ALL = Object.keys(CASES).map((id) => project(id));
    const PAPER = project('paper', { tier: 'research', lead: [SELF], relatedIds: ['c7'] });

    it.each([
        { name: 'case 1 on Projects', board: 'projects', id: 'c1', category: 'in-flight' },
        { name: 'case 2 on Coauthor', board: 'coauthor', id: 'c2', category: 'in-review' },
        { name: 'case 8 on Supervision', board: 'supervision', id: 'c8', category: 'in-flight' }
    ])('$name: the item carries its category, role, Lead badge and Mine only', (row) => {
        const item = boardItems(snapshotOf(ALL), presetFor(row.board, CONFIG)).find(
            (one) => one.id === row.id
        );
        const one = project(row.id);
        const roles = rolesOf(CONFIG);
        const isSelf = (person: string): boolean => MINE.has(person);
        expect(item?.category).toBe(row.category);
        expect(item?.role).toBe(projectRole(one, roles, MINE)?.key);
        expect(item?.lead).toBe(isLead(projectPeople(one), roles, isSelf));
        expect(item?.mine).toBe(isMine(projectPeople(one), roles, isSelf));
    });

    it('case 2: Mine only hides a project naming others, and shows it when off', () => {
        const items = boardItems(snapshotOf(ALL), presetFor('coauthor', CONFIG));
        expect(applyFilters(items, {}, '', { mine: true }).map((one) => one.id)).toEqual([]);
        expect(applyFilters(items, {}, '', { mine: false }).map((one) => one.id)).toEqual(['c2']);
    });

    it('case 8: the Role facet lists every role, the supervisor counted', () => {
        const preset = presetFor('supervision', CONFIG);
        const role = facets(boardItems(snapshotOf(ALL), preset), preset, true).find(
            (one) => one.key === 'role'
        );
        expect(role?.values.map((one) => [one.value, one.count])).toEqual([
            ['lead', 0],
            ['supervisor', 1],
            ['collaborator', 0],
            ['other', 0]
        ]);
    });

    it('case 15: with no self no project has a role and no Role facet is offered', () => {
        const preset = presetFor('projects', CONFIG);
        const items = boardItems(snapshotOf(ALL, false), preset);
        expect(items.map((one) => one.role).every((role) => role === '')).toBe(true);
        expect(facets(items, preset, false).some((one) => one.key === 'role')).toBe(false);
    });

    it("case 7: the software project's Related line holds the paper naming it", () => {
        const items = boardItems(
            snapshotOf([project('c7'), PAPER], true, [['paper', 'c7']]),
            presetFor('software', CONFIG)
        );
        expect(items.find((one) => one.id === 'c7')?.related).toEqual([
            { id: 'paper', label: 'paper', held: true }
        ]);
    });
});

describe('the card sections', () => {
    it.each([
        {
            name: 'case 14: a project in no category is in the other section, last',
            board: 'archive',
            projects: [project('c14'), project('c3')],
            sections: [
                ['other-outputs', ['c3']],
                ['', ['c14']]
            ]
        },
        {
            name: "case 31: an idea and an in-flight project, in the list's order",
            board: 'projects',
            projects: [project('idea', { ...CASES.c1, stage: 'nascent' }), project('c1')],
            sections: [
                ['in-flight', ['c1']],
                ['idea', ['idea']]
            ]
        }
    ])('$name', (row) => {
        const preset = presetFor(row.board, CONFIG);
        const items = boardItems(snapshotOf(row.projects), preset);
        const drawn = cardSections(items, preset).map((one) => [
            one.key,
            one.items.map((item) => item.id)
        ]);
        expect(drawn).toEqual(row.sections);
    });

    it.each([
        { name: 'case 26: a board with cards: grid', row: { cards: 'grid' }, cards: 'grid' },
        { name: 'case 26: a board with no cards key', row: {}, cards: 'sections' }
    ])('$name', (row) => {
        expect(presetFor('ws', withBoards({ ws: row.row })).cards).toBe(row.cards);
    });
});

describe('the rail count of a board', () => {
    it.each([
        { name: 'case 1: a project at revision', projects: [project('c1')], count: 1 },
        {
            name: 'case 28: two in flight and one in review',
            projects: [
                project('r1', { stage: 'exploring' }),
                project('r2', { stage: 'building' }),
                project('r3', { stage: 'submitted' })
            ],
            count: 2
        }
    ])('$name', (row) => {
        expect(railCount(row.projects, categoriesOf(CONFIG), CONFIG)).toEqual({
            count: row.count,
            color: '#16a34a'
        });
    });

    it.each([
        { name: 'case 14: a rail_color of #2563eb', color: '#2563eb', drawn: '#2563eb' },
        { name: 'a rail_color that is no #rrggbb', color: 'green', drawn: '' },
        { name: 'no rail_color', color: undefined, drawn: '' }
    ])('is drawn in the colour rail_color gives, $name', (row) => {
        const config = { ...CONFIG, rail_color: row.color };
        const one = [project('c1')];
        expect(railCount(one, categoriesOf(config), config)).toEqual({
            count: 1,
            color: row.drawn
        });
    });

    it('takes no colour from the rows carrying rail: true', () => {
        const categories = (CONFIG.categories as Record<string, unknown>[]).map((row) =>
            row.rail === true ? { ...row, color: '#dc2626' } : row
        );
        const config = { ...CONFIG, categories };
        expect(railCount([project('c1')], categoriesOf(config), config).color).toBe('#16a34a');
    });
});

describe('the Archival band, the real projects and the Orphans card', () => {
    const NO_DEAD_ENDS = {
        ...CONFIG,
        categories: (CONFIG.categories as { key: string }[]).filter(
            (row) => row.key !== 'dead-ends'
        )
    };
    const NO_PILLARS: Pillar[] = [];

    it.each([
        { name: 'case 3', id: 'c3', config: CONFIG, band: [], real: true, orphan: true },
        { name: 'case 4', id: 'c4', config: CONFIG, band: ['stopped'], real: false, orphan: false },
        { name: 'case 6', id: 'c6', config: CONFIG, band: [], real: true, orphan: false },
        { name: 'case 7', id: 'c7', config: CONFIG, band: [], real: true, orphan: true },
        { name: 'case 16', id: 'c4', config: NO_DEAD_ENDS, band: [], real: true, orphan: true }
    ])('$name', (row) => {
        const one = [project(row.id)];
        expect(archival(one, row.config).map((group) => group.stage)).toEqual(row.band);
        expect(realProjects(one, row.config).length === 1).toBe(row.real);
        expect(orphans(NO_PILLARS, one, row.config).length === 1).toBe(row.orphan);
    });
});

describe('the Focus lanes', () => {
    it.each([
        { name: 'case 5: software at nascent', id: 'c5', lane: 'idea' },
        { name: 'case 6: personal at nascent', id: 'c6', lane: 'idea' },
        { name: 'case 13: stopped and parked', id: 'c13', lane: undefined }
    ])('$name', (row) => {
        const one = project(row.id);
        expect(projectLane(one, () => CONFIG)?.key).toEqual(row.lane);
        expect(unplaced([one], CONFIG)).toEqual([]);
    });

    /** The shipped config with the lane `key` of `focus_lanes` given the fields `over`. */
    function withLane(key: string, over: Record<string, unknown>): Record<string, unknown> {
        const rows = (CONFIG.focus_lanes as Record<string, unknown>[]).map((row) => {
            if (row.key !== key) return row;
            const fields = Object.entries({ ...row, ...over });
            return Object.fromEntries(fields.filter(([, value]) => value !== undefined));
        });
        return { ...CONFIG, focus_lanes: rows };
    }

    it.each([
        {
            name: 'case 10: a project at exploring is written the stage of move_writes',
            from: { stage: 'exploring' },
            writes: { stage: 'submit-ready' }
        },
        {
            name: 'case 10: a project at in-prep is on the lane already and is written nothing',
            from: { stage: 'in-prep' },
            writes: null
        },
        {
            name: 'a blocked project at in-prep keeps its stage and loses its chip',
            from: { stage: 'in-prep', chips: ['blocked'] },
            writes: { 'status.chips': [] }
        }
    ])('moves onto a stage lane by its move_writes: $name', (row) => {
        const config = withLane('push', {
            stages: ['in-prep', 'submit-ready'],
            move_writes: { stage: 'submit-ready' }
        });
        const moved = project('m', { tier: 'research', chips: [], ...row.from });
        expect(hubMoveOnto(moved, { key: 'push' }, () => config)).toEqual(row.writes);
    });

    it.each([
        {
            name: 'adds the chip of move_writes and takes off the chip of the other chip lane',
            chips: ['parked'],
            writes: { 'status.chips': ['blocked'] }
        },
        {
            name: "keeps a chip of the lane's own and writes nothing",
            chips: ['blocked'],
            writes: null
        }
    ])('case 11: moves onto a chip lane, $name', (row) => {
        const moved = project('m', { tier: 'research', stage: 'exploring', chips: row.chips });
        expect(hubMoveOnto(moved, { key: 'blocked' }, () => CONFIG)).toEqual(row.writes);
    });

    it("case 11: a move onto a chip lane listing two chips adds the chip of move_writes, not the lane's first", () => {
        const config = withLane('blocked', {
            chips: ['admin-prep', 'blocked'],
            move_writes: { chip: 'blocked' }
        });
        const moved = project('m', { tier: 'research', stage: 'exploring', chips: [] });
        expect(hubMoveOnto(moved, { key: 'blocked' }, () => config)).toEqual({
            'status.chips': ['blocked']
        });
    });

    it('takes no move onto a lane without move_writes', () => {
        const config = withLane('review', { move_writes: undefined });
        const moved = project('m', { tier: 'research', stage: 'exploring', chips: [] });
        expect(hubMovable(moved, { key: 'review' }, () => config)).toBe(false);
        expect(hubMoveOnto(moved, { key: 'review' }, () => config)).toBeNull();
        expect(hubMovable(moved, { key: 'revise' }, () => config)).toBe(true);
    });

    it('case 5: a cluster added after incubate is a fourth columns cluster drawn after it, holding the lane naming it', () => {
        const later = {
            key: 'later',
            label: 'focus.cluster_parked',
            muted: true,
            layout: 'columns'
        };
        const rows = CONFIG.focus_clusters as Record<string, unknown>[];
        const config = {
            ...withLane('review', { cluster: 'later' }),
            focus_clusters: [...rows.slice(0, 3), later, ...rows.slice(3)]
        };
        expect(clusters(config).map((one) => [one.key, one.layout, one.muted])).toEqual([
            ['now', 'columns', false],
            ['parked', 'columns', true],
            ['incubate', 'columns', true],
            ['later', 'columns', true],
            ['idea', 'full_width', true]
        ]);
        expect(clusters(config)[3].label).toBe('focus.cluster_parked');
        const board = lanes(config);
        expect(lanesIn(board, 'later').map((lane) => lane.key)).toEqual(['review']);
        expect(lanesIn(board, 'parked').map((lane) => lane.key)).toEqual(['blocked', 'backburner']);
    });
});

describe("the audit's placement findings", () => {
    const say = (key: string, ...args: string[]): string => findingText(CATALOG, key, ...args);

    /** The findings of the status guardrails over one project of the cases. */
    function placed(id: string): AuditFinding[] {
        const { found, add } = collector(CATALOG, 'hub', true);
        const input = {
            hub: '/hub',
            root: 'hub',
            primary: true,
            projects: [project(id)],
            collections: [],
            held: new Map(),
            self: MINE,
            rules: auditRules(CONFIG),
            // `/hub` holds no settings file, so its setting names none of the checks.
            setting: hubAuditSetting('/hub'),
            catalog: CATALOG
        };
        guardrails(input, add);
        return found;
    }

    it.each([
        {
            name: 'case 10, a word tiers does not hold',
            id: 'c10',
            messages: [
                say('audit.msg_no_board', say('audit.no_tier'), 'lead', 'exploring'),
                say('audit.msg_missing')
            ]
        },
        {
            name: 'case 11, no tier',
            id: 'c11',
            messages: [
                say('audit.msg_no_board', say('audit.no_tier'), 'lead', 'exploring'),
                say('audit.msg_missing')
            ]
        },
        {
            name: 'case 12, no lead',
            id: 'c12',
            messages: [
                say('audit.msg_no_lead'),
                say('audit.msg_no_board', 'research', say('audit.no_role'), 'exploring'),
                say('audit.msg_missing')
            ]
        },
        {
            name: 'case 13, a terminal project carrying parked',
            id: 'c13',
            messages: [say('audit.msg_terminal_lane_chip', 'stopped', 'parked')]
        },
        { name: 'case 1, placed', id: 'c1', messages: [say('audit.msg_missing')] }
    ])('$name', (row) => {
        expect(placed(row.id).map((one) => one.message)).toEqual(row.messages);
    });

    it('case 10: the no-board signature reads the missing tier as empty, not as its words', () => {
        const board = placed('c10').find((one) => one.where === 'tier');
        expect(board?.signature).toBe(
            signatureOf('c10', 'tier', 'manifest', 'audit.msg_no_board', ['', 'lead', 'exploring'])
        );
    });
});

describe("a board's keys", () => {
    const ECG = project('ecg', { tier: 'research', lead: [SELF], stage: 'exploring' });
    /** The words a board's view is named by and draws, which every board names. */
    const WORDS = { label: 'views.projects', glyph: 'views.projects_glyph' };
    const KEYED = {
        hubbed: { ...WORDS, tier: 'research', hub: 'look-hub2' },
        matched: { ...WORDS, tier: 'research', match: { domain: ['ecg'] } },
        blocked: {
            ...WORDS,
            tier: ['research', 'personal'],
            chips: { not_words: ['parked'] },
            forms: { words: ['journal'] }
        }
    };
    const CONFIGURED = withBoards(KEYED);

    it('case 29: the config check takes every key', () => {
        const found = boardsFindings(CONFIGURED, () => 'layout.yml', CATALOG);
        expect(found).toEqual([]);
    });

    it.each([
        { name: 'another hub', over: { root: 'look-hub2' }, boards: ['projects', 'hubbed'] },
        { name: 'the primary hub', over: {}, boards: ['projects'] },
        { name: 'the domain ecg', over: { domainIds: ['ecg'] }, boards: ['projects', 'matched'] },
        {
            name: 'a journal paper',
            over: { form: 'journal' },
            boards: ['projects', 'blocked']
        },
        {
            name: 'a parked journal paper',
            over: { form: 'journal', chips: ['parked'] },
            boards: ['projects']
        },
        {
            name: 'a personal journal paper',
            over: { form: 'journal', tier: 'personal' },
            boards: ['personal', 'blocked']
        }
    ])('case 29: $name is on the boards whose every key it meets', (row) => {
        const one = { ...ECG, ...row.over };
        expect(boardsTaking(one, takeContext(CONFIGURED, MINE))).toEqual(row.boards);
    });

    it("case 30: a project on two boards opens on the first in boards' order", () => {
        const one = { ...ECG, domainIds: ['ecg'] };
        const second = withBoards({ ecg: { tier: 'research', match: { domain: ['ecg'] } } });
        expect(boardsTaking(one, takeContext(second, MINE)).at(0)).toBe('projects');
    });
});

describe('a saved slice filter', () => {
    it('case 32: a slice the board holds is kept and a slice it does not hold is dropped', () => {
        const preset = presetFor('projects', CONFIG);
        const submitted = project('sub', { tier: 'research', lead: [SELF], stage: 'submitted' });
        const items = boardItems(snapshotOf([project('c1'), project('c9'), submitted]), preset);
        const values = sliceGroups(items, preset).flatMap((group) =>
            group.slices.map((slice) => slice.value)
        );
        const saved = { filters: { slice: ['in-review/submitted', 'publications/poster'] } };
        const held = parseBoardState(saved, 'short', [], values);
        expect(held.filters).toEqual({ slice: ['in-review/submitted'] });
        expect(applyFilters(items, held.filters, '').map((one) => one.id)).toEqual(['sub']);
    });
});

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

describe('the roles of a collection', () => {
    /** A tasks file whose schema declares `lead`, required or not, with the entries given. */
    function tasks(required: boolean, entries: string[]): string {
        return [
            'schema:',
            '  - { field: title, type: text }',
            '  - { field: status, type: text }',
            `  - { field: lead, type: tags, from: people${required ? ', required: true' : ''} }`,
            'entries:',
            ...entries,
            ''
        ].join('\n');
    }

    /** The collection `tasks` of a hub holding the file, and the findings on it. */
    function built(text: string): {
        entries: { fields: Record<string, unknown> }[];
        found: number;
    } {
        const file = '.oculus/data/academic/tasks.yml';
        const hub = plantScratch('oculus-roles-', { [file]: text }, ['projects/active']);
        const { snapshot } = buildOneHub(hub, portfolioConfigFrom(CONFIG));
        const collection = Object.values(snapshot.entities.collections).find(
            (one) => one.id === 'tasks'
        );
        const found = snapshot.findings.filter((one) => one.file.endsWith(`/${file}`)).length;
        return { entries: collection?.entries ?? [], found };
    }

    const SCHEMA_LEAD = [{ field: 'title' }, { field: 'lead' }];
    const SCHEMA_NONE = [{ field: 'title' }, { field: 'status' }];
    const ON = { mine: true, picked: [] };

    scratchIt('case 20: the Lead badge, Mine only and the Role facet', () => {
        const { entries } = built(
            tasks(false, [
                `  - { title: One, status: todo, lead: [${SELF}] }`,
                '  - { title: Two, status: todo, lead: [someone] }'
            ])
        );
        const roles = entryRoles(CONFIG, [SCHEMA_LEAD], MINE, entries, ON);
        expect(roles.drawn).toBe(true);
        expect(entries.map((one) => roles.lead(one))).toEqual([true, false]);
        expect(entries.map((one) => roles.keeps(one))).toEqual([true, false]);
        expect(roles.facet.map((one) => [one.label, one.count])).toEqual([
            ['Lead', 1],
            ['Supervisor', 0],
            ['Collaborator', 0],
            ['Other', 1]
        ]);
    });

    it.each([
        { name: 'case 21: a collection declaring no role field', schema: SCHEMA_NONE, self: MINE },
        { name: 'case 15: a workspace with no self', schema: SCHEMA_LEAD, self: NOBODY }
    ])('$name draws no toggle, badge or facet', (row) => {
        const entries = [{ fields: { title: 'One', lead: [SELF] } }];
        const roles = entryRoles(CONFIG, [row.schema], row.self, entries, ON);
        expect(roles.drawn).toBe(false);
        expect(roles.facet).toEqual([]);
        expect(roles.lead(entries[0])).toBe(false);
        expect(roles.keeps(entries[0])).toBe(true);
    });

    scratchIt('case 21a: an entry naming no one is no finding and is kept by Mine only', () => {
        const { entries, found } = built(tasks(false, ['  - { title: One, status: todo }']));
        expect(found).toBe(0);
        const roles = entryRoles(CONFIG, [SCHEMA_LEAD], MINE, entries, ON);
        expect(entries.map((one) => roles.keeps(one))).toEqual([true]);
    });
});
