// Layer 2, client state. What the new-project form starts with and sends beyond its fields: the
// folder, the `new_project_dir` entry of the board's tier when it is a folder inside a scan folder
// (an entry that is not, which the hub reports as a finding, is not used, and the form starts with
// an empty folder), and the person the new manifest names, the user in the field of the first of
// the board's roles that has one, or of the first row of `roles:` that has one on a board naming no
// `role:`, and the tier it is written in: the board's one tier, else the default tier of `tiers`
// when the board names none or names it among several. A board offers New project only when it has
// that tier and the project that write makes is one the board's rule takes
// (data/shapes/boards/takes.ts), so a new project is on the board it was made on. The tiers, the
// stages and the roles read are those of the hub the project is written to.

import type { Id, Project } from '../../../data/model/index.ts';
import { byKey, fields, text as str } from '../../../data/helpers/guards.ts';
import { folderOf, inScan, keyOf } from '../../../data/helpers/hub-names.ts';
import { selfField, type Role } from '../../../data/shapes/boards/roles.ts';
import {
    boardTakes,
    takeWordsOf,
    type BoardRule,
    type TakeContext
} from '../../../data/shapes/boards/takes.ts';
import { oneWordWith } from '../../../data/shapes/vocab-keys.ts';
import { readAs, rowsShape, wordShape } from '../../../data/shapes/shapes.ts';
import { z } from 'zod';

/** One `scan:` entry: its folder. */
const scanDirShape = z.object({ dir: wordShape });

/** The folders of the `scan:` list of the merged config. */
const scanDirsShape = rowsShape(scanDirShape);

/**
 * The folder the form of one tier starts with, or the empty text when the tier has no usable
 * `new_project_dir` entry.
 */
export function newProjectFolder(config: Record<string, unknown>, tier: string): string {
    const folder = folderOf(str(byKey(fields(config.new_project_dir), tier)));
    if (folder === '') return '';
    const dirs = (readAs(scanDirsShape, config.scan) ?? []).map((row) => row.dir);
    return inScan(folder, dirs) ? folder : '';
}

/** The field a new project names the user in, and the user's key, as the write sends them. */
export type NewProjectPerson = { role_field: string; self: string };

/**
 * The person a new project names: the user, the first of the people the workspace setting `self`
 * names, in the field of the first of `keys` (a board's `role:`, in its order) whose role has a
 * field; `keys` null, a board naming no `role:` or Lit Watch, reads every row of `roles:` in
 * order, so the user is named as lead. None with no `self`, and none when the roles named have no
 * field.
 */
export function newProjectPerson(
    roles: readonly Role[],
    keys: readonly string[] | null,
    self: ReadonlySet<Id>
): NewProjectPerson | null {
    const user = [...self].at(0);
    const field = selfField(roles, keys ?? roles.map((role) => role.key));
    return user === undefined || field === undefined
        ? null
        : { role_field: field, self: keyOf(user) };
}

/**
 * The tier a board's new project is written in, read by the words `config` of the hub it is written
 * to: the one tier of a board naming one; the default tier, the one word of `tiers` carrying
 * `default`, for a board naming several when it is among them and for a board naming none; and none
 * otherwise, so the board offers no New project.
 */
export function newProjectTier(
    rule: BoardRule,
    config: Record<string, unknown>
): string | undefined {
    const named = rule.tiers ?? [];
    if (named.length === 1) return named[0];
    const tier = oneWordWith(config, 'tiers', 'default');
    return named.length === 0 || (tier !== undefined && named.includes(tier)) ? tier : undefined;
}

/**
 * Whether a board offers New project: whether it has a tier to write (`newProjectTier`) and its
 * rule takes the project the board's write makes, of that tier, naming the user in the field
 * `newProjectPerson` gives, at the one stage carrying `new_idea`, with no chip, no form and no
 * other field, in no hub the board names. With `hub`, the hub the project is written to, the tiers,
 * the stages and the roles are that hub's; without, the context's own.
 */
export function offersNewProject(rule: BoardRule, context: TakeContext, hub?: string): boolean {
    const words = hub === undefined ? context : takeWordsOf(context, hub);
    const { config, roles } = words;
    const tier = newProjectTier(rule, config);
    if (tier === undefined) return false;
    const { self } = context;
    const person = newProjectPerson(roles, rule.roles, self);
    const user = [...self].at(0);
    const named = (field: string): Id[] =>
        person !== null && user !== undefined && person.role_field === field ? [user] : [];
    const project: Project = {
        id: '',
        title: '',
        tier,
        stage: oneWordWith(config, 'stages', 'new_idea'),
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        resourceIds: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        lead: named('lead'),
        collaborators: named('collaborators'),
        supervisors: named('supervisors'),
        docs: [],
        folder: '',
        file: ''
    };
    return boardTakes(rule, project, { ...words, self, wordsOf: () => words });
}
