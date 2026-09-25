// Layer 2, client state. What a `waiting-on:` value is called wherever it is drawn: the strip, the
// card helper line and the lane cards read one rule, so a project waited on is named the same way
// on every surface.

import type { Id, Project } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';

/**
 * A key of the people registry is drawn as that person's name, another project's id as that
 * project's short name, else its title, and a value that resolves against neither as written, which
 * validate reports as a finding. The names are handed in rather than read from the snapshot here,
 * since state/boards/person.ts is the one rule that builds them.
 */
export function waitingLabel(
    key: Id,
    people: Record<Id, string>,
    projects: Record<Id, Project>
): string {
    const person = byKey(people, key);
    if (person !== undefined) return person;
    const project = byKey(projects, key);
    if (project === undefined) return key;
    const short = project.short ?? '';
    const label = short === '' ? project.title : short;
    return label === '' ? key : label;
}
