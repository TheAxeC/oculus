// Layer 1, data, pure. Which projects a board of `boards:` in config/defaults/layout.yml takes. A
// board names `tier:` (a word of `tiers:` or a list), and may name `role:` (a key of `roles:` or a
// list), `stages:`, `chips:` and `forms:` (word blocks, words.ts beside this file), `hub:` (a hub's
// root) and `match:` (a manifest field to a list of values); a project is on the board when it
// meets every key the board names. `role:` is applied only when the workspace names a `self`,
// since without one no project has a role. The boards, the page's choice of the board a project
// opens on, a board's offer of New project (state/boards/board/new-project.ts) and the audit's
// finding of a project no board takes all read a board through this module, so a board takes the
// same projects everywhere. A project's stage, chips, form and role are held to the words of its
// own hub when the context gives them (`wordsOf`), and to the context's config otherwise.

import type { Id, Project } from '../../model/index.ts';
import { fields, isMap } from '../../helpers/guards.ts';
import { keyOf, rootOf } from '../../helpers/hub-names.ts';
import { readAs } from '../shapes.ts';
import { blockHolds, blockOf, wordList, wordsShape, type WordBlock } from './words.ts';
import { roleOf, rolesOf, type PeopleOf, type Role } from './roles.ts';

/** What one board takes, read out of its row; a key the row leaves out is null. */
export type BoardRule = {
    tiers: string[] | null;
    roles: string[] | null;
    stages: WordBlock | null;
    chips: WordBlock | null;
    forms: WordBlock | null;
    hub: string | null;
    match: Record<string, string[]> | null;
};

/** A text or a list of texts in a row, or null when the row leaves the key out. */
function listOf(row: Record<string, unknown>, key: string): string[] | null {
    return Object.hasOwn(row, key) ? (readAs(wordsShape, row[key]) ?? []) : null;
}

/** A board's `match:`: each manifest field with the values it holds to, a value read as text. */
function matchOf(value: unknown): Record<string, string[]> | null {
    if (!isMap(value)) return null;
    const match: Record<string, string[]> = {};
    for (const [field, values] of Object.entries(value)) {
        match[field] = readAs(wordsShape, values) ?? [];
    }
    return match;
}

/** The rule of one board's row. */
export function boardRuleOf(row: Record<string, unknown>): BoardRule {
    const hub = typeof row.hub === 'string' && row.hub.trim() !== '' ? row.hub.trim() : null;
    return {
        tiers: listOf(row, 'tier'),
        roles: listOf(row, 'role'),
        stages: Object.hasOwn(row, 'stages') ? blockOf(row.stages) : null,
        chips: Object.hasOwn(row, 'chips') ? blockOf(row.chips) : null,
        forms: Object.hasOwn(row, 'forms') ? blockOf(row.forms) : null,
        hub,
        match: matchOf(row.match)
    };
}

/** The keys of a list of record ids, each without its hub. */
function keysOf(ids: readonly Id[]): string[] {
    return ids.map(keyOf);
}

/**
 * The manifest fields a board's `match:` may name, each read off the project as the keys or words
 * the manifest writes: a record a field names is its key, without the hub.
 */
const MATCH_FIELDS: Readonly<Record<string, (project: Project) => string[]>> = {
    tier: (project) => wordList(project.tier),
    stage: (project) => wordList(project.stage),
    form: (project) => wordList(project.form),
    chips: (project) => project.chips,
    domain: (project) => keysOf(project.domainIds),
    pillars: (project) => keysOf(project.pillarIds),
    funding: (project) => keysOf(project.fundingIds),
    datasets: (project) => keysOf(project.datasetIds),
    venue: (project) => (project.venueId === undefined ? [] : [keyOf(project.venueId)]),
    compute: (project) => keysOf(project.resourceIds),
    related: (project) => keysOf(project.relatedIds),
    lead: (project) => keysOf(project.lead),
    collaborators: (project) => keysOf(project.collaborators),
    supervisors: (project) => keysOf(project.supervisors),
    tags: (project) => project.tags ?? [],
    year: (project) => (project.year === undefined ? [] : [String(project.year)])
};

/** The people fields of a project, by the manifest field a role names. */
const PEOPLE: Readonly<Record<string, (project: Project) => readonly Id[]>> = {
    lead: (project) => project.lead,
    collaborators: (project) => project.collaborators,
    supervisors: (project) => project.supervisors
};

/** The people a project names in a field of a role, as the ids of the people registry. */
export function projectPeople(project: Project): PeopleOf {
    return (field) => (Object.hasOwn(PEOPLE, field) ? PEOPLE[field](project) : []);
}

/** The user's role on a project, the people with `self: true` being `self`. */
export function projectRole(
    project: Project,
    roles: readonly Role[],
    self: ReadonlySet<Id>
): Role | undefined {
    return roleOf(projectPeople(project), roles, (id) => self.has(id));
}

/** The words a project is held to: a config's `stages`, `chips`, `forms`, `tiers` and roles. */
export type TakeWords = { config: Record<string, unknown>; roles: readonly Role[] };

/**
 * What a board's rule is read with: the merged config, its roles and the user's ids, and, where the
 * records of several hubs are read, the words of the records of the hub `hub` (`wordsOf`).
 */
export type TakeContext = TakeWords & {
    self: ReadonlySet<Id>;
    wordsOf?: (hub: string) => TakeWords;
};

/** The context of the merged config and the user's ids. */
export function takeContext(config: Record<string, unknown>, self: ReadonlySet<Id>): TakeContext {
    return { config, roles: rolesOf(config), self };
}

/** The words a project of the hub `hub` is held to under a context. */
export function takeWordsOf(context: TakeContext, hub: string): TakeWords {
    return context.wordsOf?.(hub) ?? context;
}

/** Whether a project meets every key of a board's rule, under the words of the project's hub. */
export function boardTakes(rule: BoardRule, project: Project, context: TakeContext): boolean {
    const { config, roles } = takeWordsOf(context, rootOf(project));
    if (rule.tiers !== null && (project.tier === undefined || !rule.tiers.includes(project.tier)))
        return false;
    if (rule.roles !== null && context.self.size > 0) {
        const role = projectRole(project, roles, context.self);
        if (role === undefined || !rule.roles.includes(role.key)) return false;
    }
    if (!blockHolds(rule.stages, wordList(project.stage), config.stages)) return false;
    if (!blockHolds(rule.chips, project.chips, config.chips)) return false;
    if (!blockHolds(rule.forms, wordList(project.form), config.forms)) return false;
    if (rule.hub !== null && project.root !== rule.hub) return false;
    for (const [field, values] of Object.entries(rule.match ?? {})) {
        const read = Object.hasOwn(MATCH_FIELDS, field) ? MATCH_FIELDS[field](project) : [];
        if (!read.some((one) => values.includes(one))) return false;
    }
    return true;
}

/**
 * The boards of `boards` of the merged config, each id with its row, in the file's order. A row
 * that is not a map is no board.
 */
export function boardRows(config: Record<string, unknown>): [string, Record<string, unknown>][] {
    return Object.entries(fields(config.boards)).flatMap(([id, row]) =>
        isMap(row) ? [[id, row] as [string, Record<string, unknown>]] : []
    );
}

/** The ids of the boards that take a project, in the order of `boards`. */
export function boardsTaking(project: Project, context: TakeContext): string[] {
    return boardRows(context.config)
        .filter(([, row]) => boardTakes(boardRuleOf(row), project, context))
        .map(([id]) => id);
}
