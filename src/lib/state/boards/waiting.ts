// Layer 2, client state. What a `waiting-on:` value is called wherever it is drawn: the strip, the
// card helper line and the lane cards read one rule, so a project waited on is named the same way
// on every surface.

import type { Id, Project } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { keyOf } from '../../data/helpers/hub-names.ts';

/**
 * A person's id is drawn as that person's name, another project's id as that project's short name,
 * else its title, else its key, and a value that resolves against neither as its key, which
 * validate reports as a finding. The names are handed in rather than read from the snapshot here,
 * since state/boards/person.ts is the one rule that builds them.
 */
export function waitingLabel(
    id: Id,
    people: Record<Id, string>,
    projects: Record<Id, Project>
): string {
    const person = byKey(people, id);
    if (person !== undefined) return person;
    const project = byKey(projects, id);
    if (project === undefined) return keyOf(id);
    const short = project.short ?? '';
    const label = short === '' ? project.title : short;
    return label === '' ? keyOf(id) : label;
}
