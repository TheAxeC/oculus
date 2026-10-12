// Layer 2, client state. The workbench a page takes with it when it follows its server to another
// port. A browser keeps `localStorage` per origin, so the page at the new address starts with none
// of the arrangement and the "This browser" settings the page at the old address held. The page
// that leaves writes both into `window.name`, which a navigation of the same tab keeps whatever
// the origin, and the page that arrives writes them into its own storage and clears the name.
//
// The name holds one JSON object under CARRY_KEY: the origin it was written for, the time it was
// written and the values. The page that arrives takes it only at that origin and within
// CARRY_MS of the writing, so a name another page of the tab left behind long ago, or one written
// for another address, is not taken. A name that is anything else, as a tab the viewer named or
// another tool set, is left as it was and nothing is written from it.

import { mapShape, readAs } from '../../../../data/shapes/shapes.ts';
import { UI_KEY } from '../../ui.svelte.ts';
import { LAYOUT_PREFIX } from './storage.ts';

/** The key of the one object `window.name` holds while a page is on its way to the new address. */
export const CARRY_KEY = 'oculus.carry.v1';

/** How long after its writing a carry is taken, in milliseconds: the time a navigation takes. */
export const CARRY_MS = 60_000;

/**
 * Whether a storage key travels: the arrangement of any workspace and the viewer's settings for
 * this browser.
 */
function travels(key: string): boolean {
    return key === UI_KEY || key.startsWith(LAYOUT_PREFIX);
}

/** The part of a window the carry needs. */
export type Named = { name: string };

/**
 * Write what the storage holds under the carried keys (`travels`) into the window's name, for the
 * page at origin `to`, stamped with `now`. A storage that refuses to be read carries nothing; with
 * nothing to carry the name is not touched.
 */
export function carryWorkbench(
    storage: Pick<Storage, 'getItem' | 'key' | 'length'>,
    win: Named,
    to: string,
    now: number = Date.now()
): void {
    const held: Record<string, string> = {};
    try {
        for (let at = 0; at < storage.length; at += 1) {
            const key = storage.key(at);
            if (key === null || !travels(key)) continue;
            const value = storage.getItem(key);
            if (value !== null) held[key] = value;
        }
    } catch {
        // A storage that refuses to be read carries nothing.
    }
    if (Object.keys(held).length === 0) return;
    win.name = JSON.stringify({ [CARRY_KEY]: { to, at: now, values: held } });
}

/**
 * Write what the window's name carries into the storage and clear the name, when the name is the
 * object `carryWorkbench` writes for the page's own origin `here` no longer than CARRY_MS before
 * `now`. Each carried key is written when its value is a string; a name of any other shape, for
 * another origin, or older, is left alone.
 */
export function takeCarried(
    storage: Pick<Storage, 'setItem'>,
    win: Named,
    here: string,
    now: number = Date.now()
): void {
    let parsed: unknown;
    try {
        parsed = JSON.parse(win.name);
    } catch {
        return;
    }
    const carried = readAs(mapShape, readAs(mapShape, parsed)?.[CARRY_KEY]);
    if (carried?.to !== here) return;
    const at = carried.at;
    if (typeof at !== 'number' || now < at || now - at > CARRY_MS) return;
    const held = readAs(mapShape, carried.values);
    if (held === null) return;
    for (const [key, value] of Object.entries(held)) {
        if (!travels(key) || typeof value !== 'string') continue;
        try {
            storage.setItem(key, value);
        } catch {
            // A storage that refuses a write forgets the arrangement, as at any load.
        }
    }
    win.name = '';
}
