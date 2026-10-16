// Layer 2, client state. The tabs a pane leaves out: a tab of a collection view oculus's pages
// place (`COLLECTION_PLACES`) whose key no hub of the workspace lists under `collections:`. The tab
// stays in the layout and is drawn again when a hub lists the key, so a page's arrangement holds
// every collection oculus knows and a hub that keeps no such collection shows no tab for it. A key
// no table here holds and no registration knows still draws as an unknown view.
//
// The strip's indices count the tabs drawn, and the layout's count the tabs held, so a drop index
// is carried between the two here.

import type { HubVocabs } from '../../../../data/model/index.ts';
import type { Instance } from '../model.ts';

/**
 * Where each collection view sits in the catalogue, which is the rail page it is placed on: the
 * Academic Life page's six, the Literature page's Literature after the Literature search and Lit
 * Watch, and the Registries page's four. A collection a hub adds that no placement names goes to
 * the Registries group after them.
 */
export const COLLECTION_PLACES: Readonly<Record<string, { group: string; order: number }>> = {
    funding: { group: 'academic', order: 0 },
    events: { group: 'academic', order: 1 },
    education: { group: 'academic', order: 2 },
    applications: { group: 'academic', order: 3 },
    'joint-work': { group: 'academic', order: 4 },
    tasks: { group: 'academic', order: 5 },
    literature: { group: 'literature', order: 2 },
    statements: { group: 'registries', order: 3 },
    people: { group: 'registries', order: 4 },
    organisations: { group: 'registries', order: 5 },
    resources: { group: 'registries', order: 6 }
};

/** Whether a view is a placed collection's, by its id. */
export function isPlacedCollection(view: string): boolean {
    return Object.hasOwn(COLLECTION_PLACES, view);
}

/** A pane's tabs: the ones it holds, the ones it draws, and the keys of the ones it leaves out. */
export type PaneTabs = { held: Instance[]; drawn: Instance[]; left: string[] };

/**
 * A pane's tabs split by the keys the hubs of the workspace list under `collections:`, every
 * hub's together, each list in the pane's order.
 */
export function leftOutTabs(tabs: Instance[], hubs: HubVocabs | null): PaneTabs {
    const listed = new Set(Object.values(hubs?.lists ?? {}).flatMap((one) => one.collections));
    const out = (tab: Instance): boolean => isPlacedCollection(tab.view) && !listed.has(tab.view);
    return {
        held: tabs,
        drawn: tabs.filter((tab) => !out(tab)),
        left: tabs.filter(out).map((tab) => tab.view)
    };
}

/**
 * A strip index carried between the tabs a pane draws and the tabs it holds, the tab being dragged
 * (the drawn tab at `own`, -1 for none) taken out of both: `toHeld` turns an index among the drawn
 * tabs into the index of the same place among the held ones, and the other way counts the drawn
 * tabs before a held index.
 */
export function carriedIndex(tabs: PaneTabs, index: number, own: number, toHeld: boolean): number {
    const carried = own < 0 ? undefined : tabs.drawn.at(own)?.id;
    const held = tabs.held.filter((tab) => tab.id !== carried);
    const drawn = tabs.drawn.filter((tab) => tab.id !== carried);
    if (!toHeld) return held.slice(0, index).filter((tab) => drawn.includes(tab)).length;
    const next = drawn.at(index);
    return next === undefined ? held.length : held.indexOf(next);
}
