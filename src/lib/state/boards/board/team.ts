// Layer 2, client state. A project's team: the people its `lead:` names, then those its
// `collaborators:` name, and the team as the views show it, without the person the workspace
// setting `self` names. The card's tags and its line, the Authors column, the Map's people, a joint
// work's projects and the search all read the team here, so one rule says who a project's people
// are. It imports no other state module, so the collection and the Map read it without a cycle.

import type { Id, Project, Snapshot } from '../../../data/model/index.ts';

/**
 * A project's team: the people its `lead:` names, then those its `collaborators:` name, each person
 * once, in that order.
 */
export function teamOf(project: Pick<Project, 'lead' | 'collaborators'>): Id[] {
    return [...new Set([...project.lead, ...project.collaborators])];
}

/** The ids of the people the workspace setting `self` names, the person who is the user. */
export function selfIds(snapshot: Snapshot | null): Set<Id> {
    const people = Object.values(snapshot?.entities.people ?? {});
    return new Set(people.filter((one) => one.self === true).map((one) => one.id));
}

/**
 * A project's team as the views show it: `teamOf` without the person the workspace setting `self`
 * names, since the user needs no telling that they are on their own projects.
 */
export function shownTeam(
    project: Pick<Project, 'lead' | 'collaborators'>,
    self: ReadonlySet<Id>
): Id[] {
    return teamOf(project).filter((id) => !self.has(id));
}
