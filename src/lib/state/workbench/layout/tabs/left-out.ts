// Layer 2, client state. The tabs a pane leaves out: a tab of a collection view oculus's pages
// place, an entry of oculus's own `collections:` list with a `group:` (`placedKeys`), whose key no
// hub of the workspace lists under `collections:`. The tab stays in the layout and is drawn again
// when a hub lists the key, so a page's arrangement holds every collection oculus knows and a hub
// that keeps no such collection shows no tab for it. A key no list holds and no registration knows
// still draws as an unknown view.
//
// The strip's indices count the tabs drawn, and the layout's count the tabs held, so a drop index
// is carried between the two here.

import { placedKeys } from '../../../../data/helpers/hub-names.ts';
import type { HubVocabs } from '../../../../data/model/index.ts';
import type { Instance } from '../model.ts';

/** A pane's tabs: the ones it holds, the ones it draws, and the keys of the ones it leaves out. */
export type PaneTabs = { held: Instance[]; drawn: Instance[]; left: string[] };

/**
 * A pane's tabs split by the keys the hubs of the workspace list under `collections:`, every
 * hub's together, each list in the pane's order.
 */
export function leftOutTabs(tabs: Instance[], hubs: HubVocabs | null): PaneTabs {
    const placed = new Set(placedKeys(hubs?.ownCollections ?? []));
    const listed = new Set(
        Object.values(hubs?.lists ?? {}).flatMap((one) => one.collections.map((entry) => entry.key))
    );
    const out = (tab: Instance): boolean => placed.has(tab.view) && !listed.has(tab.view);
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
