// Layer 2, client state, pure. The ui store key a project card keeps its file tree's state under.
//
// A card's tree is the Files view's tree, whose state is a record of the same shape
// (files-view.ts). The record is not the tab's own, which the project view keeps its `{ hub, key, doc }`
// under, and one tab draws many cards, so each card has a record of its own: the tab's id,
// `#files:`, the project's hub and its key, the two parts joined by `/`. A hub's name and a key are
// folder names that may hold `#`, `:` or `/`, so each is percent-encoded, which leaves no such
// character in either part and keeps one project's key from reaching another's. A Files tab's Notes
// section keeps its tree in a record under the same prefix (`notesTreeKey`), whose `#` no encoded
// part holds. The tab's close clears every record under `cardTreePrefix(tab)`
// (state/client/context.ts), and a rename or a move restates them with the tab's own
// (explorer/ops.svelte.ts).

import { isMap } from '../../../../data/helpers/guards.ts';
import { addressOfId } from '../../../../data/helpers/hub-names.ts';

/** The marker between a tab's id and the project's hub and key in a card tree's key. */
const CARD_TREE = '#files:';

/** The key of the record the card of the project of internal id `project` keeps its tree under. */
export function cardTreeKey(tab: string, project: string): string {
    const { hub, key } = addressOfId(project);
    return `${tab}${CARD_TREE}${encodeURIComponent(hub)}/${encodeURIComponent(key)}`;
}

/**
 * Whether a card's tree record has never been opened: none is saved, or one is saved holding
 * something other than the open folders (the finder text of a card whose tree was not drawn yet).
 * Such a card draws the folder of its project open. A record of the wrong shape is not this: it
 * reads as an empty tree.
 */
export function unopened(record: unknown): boolean {
    return record === undefined || (isMap(record) && !('expanded' in record));
}

/** The key of the record a Files tab's Notes section keeps its tree under. */
export function notesTreeKey(tab: string): string {
    return `${tab}${CARD_TREE}#notes`;
}

/** The start of every key a tab's cards keep their trees under. */
export function cardTreePrefix(tab: string): string {
    return `${tab}${CARD_TREE}`;
}
