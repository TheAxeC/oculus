// Layer 2, server. The write of an app's store: `{ store: <value> }` sent by the app's frame with
// the headers of an app, written to the one file the app's view id names.
//
// The file is found from the held row alone (`row.storeFile`), never from the body, and the folder
// it lies in must resolve inside the base the store module was given: the app data folder for a
// machine app and the root's own folder for a root app. A value equal to the file's, key order
// aside, writes nothing. Otherwise the file is written by rename, read back, and refused unless
// the read-back is equal to the value; a file that was there is put back as it was when it is not.
//
// The record names the store file, the view id as the key, the field `store`, and the byte sizes
// as `before` and `after`; the values themselves go with it as `kept`, which the change log writes
// to its undo folder (server/core/changes.ts). The undo puts the value before back through this
// writer while the file still holds the value after. After a write the apps watcher is told to read
// the stores' sizes and versions, so the push of the new version does not wait for the folder
// watch.

import { readFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { HeldApp } from '../../machine/apps/held.ts';
import { readStore, storeFolderInside } from '../../machine/apps/store.ts';
import { writeTextAtomic } from '../../core/json.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { WriteOutcome, WriteTarget } from '../writes.ts';

/** The kind the change log files a store write under. */
export const APP_STORE = 'app-store';

/** The mode a store file is made with: it is this machine's own data. */
const MODE = 0o600;

/** The base a store file's folder must resolve inside, or null while the target names none. */
function baseOf(into: WriteTarget, app: HeldApp): string | null {
    if (into.apps === undefined) return null;
    return app.row.root === '' ? into.apps.data : app.rootDir;
}

/** A refusal that wrote nothing. */
function refused(reason: string): WriteOutcome {
    return { found: true, changed: [], refused: [{ field: 'store', reason }] };
}

/**
 * Write the value as the store of the app, or say why not. The throw of a file that cannot be
 * written is the caller's: it answers `unwritable` as every writer does.
 */
export function writeAppStore(
    into: WriteTarget,
    app: HeldApp,
    value: unknown
): WriteOutcome | { error: 'unwritable' } {
    const base = baseOf(into, app);
    if (base === null || into.apps === undefined) return { error: 'unwritable' };
    const file = app.row.storeFile;
    if (!storeFolderInside(dirname(file), base)) return refused('outside');

    const text = JSON.stringify(value);
    const bytes = Buffer.byteLength(text, 'utf8');
    const limit = into.apps.maxKb;
    if (bytes > limit * 1024) return refused('too_large');

    const now = readStore(file, limit);
    if (now.bytes > 0 && now.value === null && now.version !== '') {
        // A file that is there but does not parse, or is over the limit, holds no value to compare.
    } else if (isDeepStrictEqual(now.value, value)) {
        return { found: true, changed: [], refused: [] };
    }

    let before: Buffer | null;
    try {
        before = readFileSync(file);
    } catch {
        before = null;
    }
    writeTextAtomic(file, text, MODE);
    const back = readStore(file, limit);
    if (!isDeepStrictEqual(back.value, value)) {
        if (before === null) rmSync(file, { force: true });
        else writeTextAtomic(file, before.toString('utf8'), MODE);
        return refused('readback');
    }

    const record: ChangeRecord = {
        file,
        key: app.id,
        field: 'store',
        before: now.bytes,
        after: bytes,
        undo: 'field',
        kept: { before: now.value, after: value }
    };
    into.apps.stored?.();
    return { found: true, changed: ['store'], refused: [], records: [record] };
}

/** The value the store of the app holds now, which is what an undo compares with the record. */
export function storeNow(into: WriteTarget, app: HeldApp): unknown {
    return readStore(app.row.storeFile, into.apps?.maxKb ?? 0).value;
}
