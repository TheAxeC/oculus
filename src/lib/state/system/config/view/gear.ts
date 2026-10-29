// Layer 2, client state. What the gear of a Settings item offers. Reset Setting holds the taking
// out of the user's value of an option from the file of the scope on screen as an unsaved change,
// and the scope's Save writes it, so the defaults file's value is in force again: it is offered on
// every row whose file holds the key, a list or a family as much as a single value.
// Copy Setting ID is offered on a row of a defaults file and on a setting an app declares, which
// alone have a key to copy. A setting an app declares is reset by writing its default.

import type { Row } from '../groups.ts';

/** One entry of the gear. */
export type GearEntry = 'reset' | 'copy';

/** The entries of a row's gear, in the order they are drawn; none draws no gear. */
export function gearEntries(row: Row): GearEntry[] {
    if (row.kind === 'app') return row.modified ? ['reset', 'copy'] : ['copy'];
    if (row.kind !== 'config') return [];
    return row.own ? ['reset', 'copy'] : ['copy'];
}
