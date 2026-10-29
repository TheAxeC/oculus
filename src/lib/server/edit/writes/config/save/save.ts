// Layer 2, server. The Save of one Settings scope (data/shapes/config-save.ts), sent to the writer
// of its kind of file: the open workspace file or a hub's `.oculus/config.yml` (settings-save.ts),
// a hub's `.oculus/local.yml` (local-save.ts) and a repository's `.oculus/settings.yml`
// (repo-save.ts). Each writes its one file once and records the save as one change, whose undo
// goes back through the same writer: `savedNow` reads what the file holds at the record's keys,
// and `undoSaved` writes the record's `before` back.

import { readAs } from '../../../../../data/shapes/shapes.ts';
import { saveShape, type SaveBody } from '../../../../../data/shapes/config-save.ts';
import type { Change } from '../../../../core/changes.ts';
import type { WriteTarget } from '../../../writes.ts';
import type { ConfigKeyOutcome } from '../config-place.ts';
import { localNow, saveLocal, undoLocal } from './local-save.ts';
import { repoNow, saveRepo, undoRepo } from './repo-save.ts';
import { saveSettings, settingsNow, undoSettings } from './settings-save.ts';

/** The body as a Save, or null when it is not one. */
export function readSave(body: unknown): SaveBody | null {
    return readAs(saveShape, body);
}

/** Write a Save into the file of its scope. A file that cannot be read or written throws. */
export function writeSave(into: WriteTarget, save: SaveBody): ConfigKeyOutcome {
    if (save.scope === 'local') return saveLocal(into, save.root, save.digest, save.changes);
    if (save.scope === 'repo') return saveRepo(into, save.root, save.digest, save.changes);
    return saveSettings(into, save.root, save.digest, save.changes);
}

/** What the file of a Save record holds now at the record's keys, by the record's scope. */
export function savedNow(into: WriteTarget, change: Change): { found: boolean; value: unknown } {
    if (change.key === 'local') return localNow(change);
    if (change.key === 'repo') return repoNow(change);
    return settingsNow(into, change);
}

/** The write that takes a Save back, or null when there is nothing to write. */
export function undoSaved(into: WriteTarget, change: Change): ConfigKeyOutcome | null {
    if (change.key === 'local') return undoLocal(into, change);
    if (change.key === 'repo') return undoRepo(into, change);
    return undoSettings(into, change);
}
