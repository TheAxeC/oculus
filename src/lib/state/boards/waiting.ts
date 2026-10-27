// Layer 2, client state. What a `waiting-on:` value is called wherever it is drawn, and the value a
// project board's Waiting on group filters by: the strip, the project card's WAITING ON line, the
// lane cards and the group read one rule, so a project waited on is named the same way on every
// surface.

import type { Id, Project } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { keyOf } from '../../data/helpers/hub-names.ts';

/**
 * A person's id is drawn as that person's name, another project's id as that project's short name,
 * else its title, else its key, and a value that resolves against neither as it is written, which
 * validate reports as a finding: such a value is never given a hub's prefix, so its words are never
 * cut at a colon. The names are handed in rather than read from the snapshot here, since
 * state/boards/person.ts is the one rule that builds them.
 */
export function waitingLabel(
    id: Id,
    people: Record<Id, string>,
    projects: Record<Id, Project>
): string {
    const person = byKey(people, id);
    if (person !== undefined) return person;
    const project = byKey(projects, id);
    if (project === undefined) return id;
    const short = project.short ?? '';
    const label = short === '' ? project.title : short;
    return label === '' ? keyOf(id) : label;
}

/**
 * One `waiting-on:` value as a card draws it: the id, the words `waitingLabel` gives it, and what
 * it names, a person, a project or neither, which decides what a press on it opens.
 */
export type WaitedOn = { id: Id; label: string; kind: 'person' | 'project' | 'none' };

/**
 * Each value of a project's `waiting-on:`, in its order, named by `waitingLabel`, each value once:
 * a value empty after trimming is left out, and a value listed again is drawn at its first place,
 * so every value a card draws is one tag with a key of its own.
 */
export function waitedOn(
    ids: readonly Id[],
    people: Record<Id, string>,
    projects: Record<Id, Project>
): WaitedOn[] {
    const values = [...new Set(ids.map((id) => id.trim()).filter((id) => id !== ''))];
    return values.map((id) => ({
        id,
        label: waitingLabel(id, people, projects),
        kind:
            byKey(people, id) !== undefined
                ? 'person'
                : byKey(projects, id) !== undefined
                  ? 'project'
                  : 'none'
    }));
}

/**
 * The value a project board's Waiting on group lists and its filter stores for one waited-on thing:
 * a person's or a project's key, its internal id with the hub's name off, so one key two hubs hold
 * is one value counted over both; and a value that names neither as it is written, trimmed.
 */
export function waitingValue(one: WaitedOn): string {
    return one.kind === 'none' ? one.id.trim() : keyOf(one.id);
}
