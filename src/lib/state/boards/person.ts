// Layer 2, client state. One person, joined to everything the hub knows about them: the registry
// entry, the organisations they are affiliated to, the joint work that names them, the projects
// whose `collaborators:` name them, the projects whose `waiting-on:` names them, and a student's
// supervision folder.
//
// Pure, so the Person view is tested without a browser: every join reads the snapshot it is given
// and nothing else. The joins go through the relation tables rather than by scanning, since the
// tables are what data/snapshot/normalise.ts already wrote from both sides and a second scan here
// could disagree with them.

import type { Entry, Id, Organisation, Person, Project, Snapshot } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { joinedEntries, keyOf } from '../../data/helpers/hub-names.ts';
import { JOINT_WORK } from './collection.ts';

/**
 * One person and what they are joined to; every join is empty for an id the registry does not hold.
 */
export type PersonJoin = {
    person: Person | null;
    /** The organisations the entry names, in its own order, so the primary one is first. */
    organisations: Organisation[];
    /** The joint-work entries whose `person:` names this person, in the file's order. */
    jointWork: Entry[];
    /** The projects whose `collaborators:` name this person, by project id. */
    projects: Project[];
    /** The projects whose `waiting-on:` names this person, by project id. */
    waitingOn: Project[];
    /** A student's supervision folder, hub-relative, and the empty string for anyone else. */
    folder: string;
};

/**
 * Every person's name by their id, the key their file gives them for a person with no name. It is
 * what a collaborator tag, the waiting line, a lane card and the Map's node all draw, so the four
 * of them read this one rule and a person renamed in the registry is renamed on every surface at
 * once.
 */
export function personNames(snapshot: Snapshot | null): Record<Id, string> {
    const names: Record<Id, string> = {};
    for (const one of Object.values(snapshot?.entities.people ?? {})) {
        names[one.id] = one.name === '' ? keyOf(one.id) : one.name;
    }
    return names;
}

/**
 * One person's name by their id, and the key the id holds when the registry holds no such person
 * or the person has no name.
 */
export function personName(snapshot: Snapshot | null, id: Id): string {
    const held = snapshot === null ? undefined : byKey(snapshot.entities.people, id);
    return held === undefined || held.name === '' ? keyOf(id) : held.name;
}

/** The joint-work entries naming one person, in the order the collection file writes them. */
function jointWorkOf(snapshot: Snapshot, id: Id): Entry[] {
    const entries = joinedEntries(snapshot.entities.collections, JOINT_WORK);
    const ids = new Set(
        snapshot.relations.jointWorkPerson.filter((pair) => pair[1] === id).map((pair) => pair[0])
    );
    return entries.filter((entry) => ids.has(entry.id));
}

/** One person, by their id, joined to their organisations, joint work, projects and folder. */
export function personJoin(snapshot: Snapshot | null, id: Id): PersonJoin {
    const person = snapshot === null ? undefined : byKey(snapshot.entities.people, id);
    if (snapshot === null || person === undefined) {
        return {
            person: null,
            organisations: [],
            jointWork: [],
            projects: [],
            waitingOn: [],
            folder: ''
        };
    }
    const organisations = person.affiliations
        .map((one) => byKey(snapshot.entities.organisations, one))
        .filter((held): held is Organisation => held !== undefined);
    const projects = person.projectIds
        .map((id) => byKey(snapshot.entities.projects, id))
        .filter((project): project is Project => project !== undefined);
    return {
        person,
        organisations,
        jointWork: jointWorkOf(snapshot, id),
        projects,
        waitingOn: Object.values(snapshot.entities.projects).filter((project) =>
            project.waitingOn.includes(id)
        ),
        folder: person.folder ?? ''
    };
}
