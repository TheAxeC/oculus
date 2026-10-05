// Layer 2, client state. What the gear of a Settings item offers. Reset Setting writes the default
// back: it is offered on a Modified single value, on a Modified list, multi or parked list (whose
// default is the shipped list), and on a Modified "This browser" value, whose reset makes the
// browser forget its own. A family has no default and no Reset. Copy Setting ID is offered on a row
// of a config file, which alone has a key path in a file.

import type { Row } from '../groups.ts';

/** One entry of the gear. */
export type GearEntry = 'reset' | 'copy';

/** The controls whose rows hold one value with a default. */
const SINGLE = [
    'toggle',
    'number',
    'text',
    'long',
    'choice',
    'glyph',
    'hue',
    'colour',
    'folder',
    'file',
    'path'
];

/** The controls whose rows hold a list with a default, which the editors' write resets. */
const LISTED = ['list', 'multi', 'parked'];

/** The entries of a row's gear, in the order they are drawn; none draws no gear. */
export function gearEntries(row: Row): GearEntry[] {
    if (row.kind === 'browser') return row.modified ? ['reset'] : [];
    if (row.kind !== 'config') return [];
    const resettable =
        row.state === 'set' && (SINGLE.includes(row.control) || LISTED.includes(row.control));
    return row.modified && resettable ? ['reset', 'copy'] : ['copy'];
}
