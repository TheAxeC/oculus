// Layer 2, client state. One person, joined to everything the hub knows about them: the registry
// entry, the organisations they are affiliated to, the projects of whose team they are (whose
// `lead:`, `collaborators:` or `supervisors:` name them), the projects whose `waiting-on:` names
// them, and a student's supervision folder; what the person's "this is me" button can do, which the
// key `self` of the primary hub's `local.yml` decides (`selfStanding`); and the names of the people
// a dated line names (`lineNames`).
//
// Pure, so the Person view is tested without a browser: every join reads the snapshot it is given
// and nothing else. The joins go through the relation tables rather than by scanning, since the
// tables are what data/snapshot/normalise.ts already wrote from both sides and a second scan here
// could disagree with them.

import type {
    Id,
    LinePeople,
    Organisation,
    Person,
    Project,
    Snapshot
} from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { LINE_PEOPLE } from '../../data/shapes/shapes.ts';
import { holdersOf, keyOf, resolveKey, rootOf } from '../../data/helpers/hub-names.ts';

/**
 * One person and what they are joined to; every join is empty for an id the registry does not hold.
 */
export type PersonJoin = {
    person: Person | null;
    /** The organisations the entry names, in its own order, so the primary one is first. */
    organisations: Organisation[];
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
 * The names of the people a dated line of a record names, for the record's hub: lead first, then
 * supervisors, then collaborators, each person once. A key is read in the record's hub first, then
 * in the one other hub that holds it (`resolveKey`), as a record's own `lead:` is; a key no hub
 * resolves is drawn as the key. The answer is a function of the hub and the line, so the registry
 * is indexed once for every line of a board.
 */
export function lineNames(snapshot: Snapshot | null): (root: string, line: LinePeople) => string[] {
    const people = Object.values(snapshot?.entities.people ?? {});
    const holders = holdersOf(people);
    const names = personNames(snapshot);
    return (root, line) => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const field of LINE_PEOPLE) {
            for (const key of line[field] ?? []) {
                const found = resolveKey(holders, root, key);
                const id = found !== null && 'id' in found ? found.id : key;
                if (seen.has(id)) continue;
                seen.add(id);
                out.push(names[id] ?? key);
            }
        }
        return out;
    };
}

/**
 * One person's name by their id, and the key the id holds when the registry holds no such person
 * or the person has no name.
 */
export function personName(snapshot: Snapshot | null, id: Id): string {
    const held = snapshot === null ? undefined : byKey(snapshot.entities.people, id);
    return held === undefined || held.name === '' ? keyOf(id) : held.name;
}

/** One person, by their id, joined to their organisations, projects and folder. */
export function personJoin(snapshot: Snapshot | null, id: Id): PersonJoin {
    const person = snapshot === null ? undefined : byKey(snapshot.entities.people, id);
    if (snapshot === null || person === undefined) {
        return {
            person: null,
            organisations: [],
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
