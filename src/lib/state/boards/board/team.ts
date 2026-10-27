// Layer 2, client state. A project's team: the people its `lead:` names, then those its
// `collaborators:` name, then those its `supervisors:` name, so a supervisor comes last as the last
// author, and the team as the views show it, without the user, the person the key `self` of the
// primary hub's `local.yml` names. The card's tags, the list's With column, the Map's people, a
// joint work's projects and the search all read the team here, so one rule says who a project's
// people are. It imports no other state module, so the collection and the Map read it without a
// cycle.

import type { Id, Project, Snapshot } from '../../../data/model/index.ts';
import { selfOf } from '../../../data/shapes/boards/roles.ts';

/** The fields of a project that name its team. */
type Team = Pick<Project, 'lead' | 'collaborators' | 'supervisors'>;

/**
 * A project's team: the people its `lead:` names, then those its `collaborators:` name, then
 * those its `supervisors:` name, each person once, in that order.
 */
export function teamOf(project: Team): Id[] {
    return [...new Set([...project.lead, ...project.collaborators, ...project.supervisors])];
}

/** The ids of the people marked `self: true`: the user, or nobody. */
export function selfIds(snapshot: Snapshot | null): Set<Id> {
    return selfOf(Object.values(snapshot?.entities.people ?? {}));
}

/**
 * A project's team as the views show it: `teamOf` without the user (`self`, the ids `selfIds`
 * gives), since the user needs no telling that they are on their own projects.
 */
export function shownTeam(project: Team, self: ReadonlySet<Id>): Id[] {
    return teamOf(project).filter((id) => !self.has(id));
}
