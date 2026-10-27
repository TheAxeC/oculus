// Layer 2, client state. One person, joined to everything the hub knows about them: the registry
// entry, the organisations they are affiliated to, the joint work that names them, the projects of
// whose team they are (whose `lead:`, `collaborators:` or `supervisors:` name them), the projects
// whose `waiting-on:` names them, and a student's supervision folder; and what the person's "this
// is me" button can do, which the key `self` of the primary hub's `local.yml` decides
// (`selfStanding`).
//
// Pure, so the Person view is tested without a browser: every join reads the snapshot it is given
// and nothing else. The joins go through the relation tables rather than by scanning, since the
// tables are what data/snapshot/normalise.ts already wrote from both sides and a second scan here
// could disagree with them.

import type { Entry, Id, Organisation, Person, Project, Snapshot } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import {
    flaggedEntries,
    holdersOf,
    keyOf,
    resolveKey,
    rootOf
} from '../../data/helpers/hub-names.ts';

/**
 * One person and what they are joined to; every join is empty for an id the registry does not hold.
 */
export type PersonJoin = {
    person: Person | null;
    /** The organisations the entry names, in its own order, so the primary one is first. */
    organisations: Organisation[];
    /** The joint-work entries whose `person:` names this person, in the file's order. */
    jointWork: Entry[];
    /** The projects whose `lead:`, `collaborators:` or `supervisors:` name this person. */
    projects: Project[];
    /** The projects whose `waiting-on:` names this person, by project id. */
    waitingOn: Project[];
    /** A student's supervision folder, hub-relative, and the empty string for anyone else. */
    folder: string;
};

/**
 * Every person's name by their id, the key their file gives them for a person with no name. It is
 * what a team tag, the team line, the waiting line, a lane card and the Map's node all draw, so
 * they read this one rule and a person renamed in the registry is renamed on every surface at once.
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

/**
 * The joint-work entries naming one person, those of the collections flagged `joint_work` of every
 * hub, in the order the collection files write them.
 */
function jointWorkOf(snapshot: Snapshot, id: Id): Entry[] {
    const entries = flaggedEntries(snapshot.entities.collections, 'joint_work');
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

/**
 * What a person's "this is me" button can do. The key `self` of the primary hub's `local.yml` is
 * read from the primary hub, as every reference is (data/snapshot/hubs/self.ts), so the person's
 * key marks them only when it resolves to them from there: `mark`, a press writing the key; `named`
 * when the key names another person first, the primary's own or the one other hub's, with their
 * name and hub; `ambiguous` when two or more hubs other than the primary hold the key, which then
 * names nobody, with those hubs; and `no_primary` in a workspace with no primary hub, which has no
 * `local.yml` to write.
 */
export type SelfStanding =
    | { kind: 'mark' }
    | { kind: 'named'; name: string; hub: string }
    | { kind: 'ambiguous'; hubs: readonly string[] }
    | { kind: 'no_primary' };

/** What the "this is me" button of `person` can do, with `primary` the primary hub's name. */
export function selfStanding(
    snapshot: Snapshot | null,
    person: Person,
    primary: string | null
): SelfStanding {
    if (primary === null) return { kind: 'no_primary' };
    const people = snapshot?.entities.people ?? {};
    const found = resolveKey(holdersOf(Object.values(people)), primary, keyOf(person.id));
    if (found === null) return { kind: 'mark' };
    if ('hubs' in found) return { kind: 'ambiguous', hubs: found.hubs };
    if (found.id === person.id) return { kind: 'mark' };
    const other = byKey(people, found.id);
    return {
        kind: 'named',
        name: personName(snapshot, found.id),
        hub: other === undefined ? primary : rootOf(other)
    };
}
