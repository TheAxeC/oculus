// Layer 2, client state. How a tab's saved state names a record. A tab's state is written to the
// files of the state folder (`layouts.json`, `views.json`), and a field of it that names a record
// holds the record's hub and its key, two fields, never the internal id `<hub>:<key>` the portfolio
// gives it. Every layer of state that opens a tab on a record, and the shell's rows, write and read
// it through these, so it sits with the page addresses every layer of state shares.

import { addressOfId, hubId, type RecordAddress } from '../../../data/helpers/hub-names.ts';
import { mapShape, readAs, wordShape } from '../../../data/shapes/shapes.ts';

/**
 * A field of a saved state that names the record of the internal id `id`: its hub and its key, the
 * two fields the state's file holds (`addressOfId`). An id of a card that is no record's, which a
 * view gives a card of its own, is written the same way and reads back the same.
 */
export function recordField(id: string): RecordAddress {
    return addressOfId(id);
}

/**
 * The state of a tab on the record of the internal id `id`: its hub, its key and the tab's label.
 */
export function recordState(id: string, label: string): RecordAddress & { label: string } {
    return { ...recordField(id), label };
}

/** The internal id of the record a tab's state names by its `hub` and `key`; empty for none. */
export function stateRecord(state: unknown): string {
    const held = readAs(mapShape, state);
    const key = wordShape.parse(held?.key);
    return key === '' ? '' : hubId(wordShape.parse(held?.hub), key);
}
