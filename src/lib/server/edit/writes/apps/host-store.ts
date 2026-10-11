// Layer 2, server. The store of an app as its host writes it: one key at a time, as VS Code's
// Memento does. The store is the one file a frame's `getStore` and `setStore` read and write whole;
// an `update` reads the map the file holds, changes the one key, keeps every other key as it was
// read, and writes the map back through the frame's own writer (`writeAppStore`), so the host's
// write is bounded by `apps.store_max_kb`, recorded in the change log, undoable and announced to
// every tab as a frame's is. It waits on the same chain per store file as the frame's write
// (`queuedStore`), so a host update and a frame write made at the same moment both land.
//
// A file that holds a value that is not a map, or none, is replaced by a map holding the one key.
// `undefined` deletes the key. The refusal words are `too_large` for a store over its limit and
// `refused:<reason>` for the others.

import { isMap } from '../../../../data/helpers/guards.ts';
import type { HeldApp } from '../../../machine/apps/read/held.ts';
import { readStore } from '../../../machine/apps/store/store.ts';
import { recordWrite, type WriteTarget } from '../../writes.ts';
import { APP_STORE, queuedStore, writeAppStore } from './store.ts';

/** What an update came to: done, or the word it is refused with. */
export type StoreUpdate = { ok: true } | { ok: false; word: string };

/** The map the store holds now, or an empty one for any other value. */
function mapOf(into: WriteTarget, app: HeldApp): Record<string, unknown> {
    const now = readStore(app.row.storeFile, into.apps?.maxKb ?? 0);
    return isMap(now.value) ? now.value : {};
}

/** The map with the key set to the value, in the key's place when it has one, else last. */
function withKey(
    map: Record<string, unknown>,
    key: string,
    value: unknown
): Record<string, unknown> {
    const entries = Object.entries(map);
    const at = entries.findIndex(([name]) => name === key);
    if (value === undefined) return Object.fromEntries(entries.filter(([name]) => name !== key));
    if (at < 0) return Object.fromEntries([...entries, [key, value]]);
    return Object.fromEntries(entries.map((one, index) => (index === at ? [key, value] : one)));
}

/** Set one key of the app's store to a value, or delete it with `undefined`. */
export function updateHostStore(
    into: WriteTarget,
    app: HeldApp,
    key: unknown,
    value: unknown
): Promise<StoreUpdate> {
    if (typeof key !== 'string' || key === '')
        return Promise.resolve({ ok: false, word: 'refused:key' });
    return queuedStore(into, app, async (): Promise<StoreUpdate> => {
        let outcome;
        try {
            outcome = writeAppStore(into, app, withKey(mapOf(into, app), key, value));
        } catch {
            return { ok: false, word: 'refused:unwritable' };
        }
        if ('error' in outcome) return { ok: false, word: 'refused:unwritable' };
        const refused = outcome.refused.at(0);
        if (refused !== undefined) {
            return {
                ok: false,
                word: refused.reason === 'too_large' ? 'too_large' : `refused:${refused.reason}`
            };
        }
        await recordWrite(outcome, APP_STORE, into, undefined, app);
        return { ok: true };
    });
}
