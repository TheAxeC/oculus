// Layer 2, server. The things the person does to the open workspace as a whole: Save Workspace As,
// which writes the workspace's folders and primary into a new file `.oculus/workspaces/<name>.yml`
// of the primary hub (the first hub when there is no primary) and opens it, New Workspace, which
// does the same with no folder, Switch Workspace, which opens another workspace file, and Close
// Workspace, which leaves the open file for the unsaved workspace with no folder. Each changes
// `workspace.json` of the state folder; the folders of an open file are edited by the writes of
// server/edit (writes/config/lists/folders.ts).
//
// A name is accepted by the rule of a folder's name (letters, digits, `.`, `_`, `-`), and the empty
// name, `..` and a name with a slash are refused. A file that exists is never written over, and a
// state that is there and does not read is never written over: both are refused with the reason.

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT_FOLDER, WORKSPACES_FOLDER } from '../../../data/helpers/hub-names.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { SCAN_DEPTH } from '../../../data/sources/config/merge/workspace-file.ts';
import { scalarText, validName, valueText } from './folders.ts';
import { openWorkspace, usable, type OpenWorkspace } from './open.ts';
import { readState, withRecent, writeState } from './state.ts';

/** Why an action was refused. */
type ActionRefusal =
    'no-name' | 'bad-name' | 'name-held' | 'no-hub' | 'gone' | 'unreadable' | 'unwritable';

/**
 * The answer of an action: done, with the workspace file a Save As or a New made when it made one,
 * or the word refusing it, with the file that does not read.
 */
export type ActionOutcome = { ok: true; file?: string } | { error: ActionRefusal; reason?: string };

/** The text of a workspace file holding these folders and this primary. */
function workspaceText(
    folders: readonly { name: string; path: string; writtenDepth?: unknown }[],
    primary: string | null
): string {
    const lines =
        folders.length === 0
            ? ['folders: []']
            : [
                  'folders:',
                  ...folders.map((one) => {
                      const depth =
                          one.writtenDepth === undefined
                              ? ''
                              : `, ${SCAN_DEPTH}: ${valueText(one.writtenDepth)}`;
                      return `  - { name: ${scalarText(one.name)}, path: ${scalarText(one.path)}${depth} }`;
                  })
              ];
    if (primary !== null) lines.push(`primary: ${scalarText(primary)}`);
    return `${lines.join('\n')}\n`;
}

/** The folder of the hub a new workspace file is written in: the primary, else the first hub. */
function savingHub(open: OpenWorkspace): string | null {
    return open.primaryDir ?? open.hubs.at(0)?.dir ?? null;
}

/**
 * Write `text` as `.oculus/workspaces/<name>.yml` of the hub the open workspace saves into and open
 * that file, putting it first in the recent list. The unsaved folders are emptied when the file
 * holds them (`takesUnsaved`) and are left as they were otherwise. Refused when the name is no
 * name, when the workspace lists no hub to hold the file, when the file exists, and when the state
 * does not read.
 */
function makeWorkspace(
    stateFolder: string,
    typed: string,
    textOf: (open: OpenWorkspace) => string,
    takesUnsaved: boolean
): ActionOutcome {
    const name = typed.trim();
    if (name === '') return { error: 'no-name' };
    if (!validName(name)) return { error: 'bad-name' };
    const open = openWorkspace(stateFolder);
    const read = readState(stateFolder);
    if (read.unreadable !== null) return { error: 'unreadable', reason: read.unreadable };
    const hub = savingHub(open);
    if (hub === null) return { error: 'no-hub' };
    const file = join(hub, ROOT_FOLDER, WORKSPACES_FOLDER, `${name}.yml`);
    if (existsSync(file)) return { error: 'name-held' };
    try {
        mkdirSync(join(hub, ROOT_FOLDER, WORKSPACES_FOLDER), { recursive: true });
        writeTextAtomic(file, textOf(open));
        writeState(stateFolder, {
            open: file,
            recent: withRecent(read.state.recent, file),
            unsaved: takesUnsaved ? { folders: [] } : read.state.unsaved
        });
    } catch {
        return { error: 'unwritable' };
    }
    return { ok: true, file };
}

/**
 * Save the open workspace's folders and primary as `.oculus/workspaces/<name>.yml` and open that
 * file.
 */
export function saveWorkspaceAs(stateFolder: string, typed: string): ActionOutcome {
    return makeWorkspace(
        stateFolder,
        typed,
        (open) => workspaceText(open.folders, open.primary),
        true
    );
}

/**
 * Make a workspace with no folder, `.oculus/workspaces/<name>.yml` holding `folders: []`, and open
 * it. The file goes in the primary hub of the open workspace, the first hub when it has no primary.
 */
export function newWorkspace(stateFolder: string, typed: string): ActionOutcome {
    return makeWorkspace(stateFolder, typed, () => workspaceText([], null), false);
}

/**
 * Close the open workspace file: the workspace becomes the unsaved one with no folder, and the file
 * is not touched. A state that does not read is refused with the reason.
 */
export function closeWorkspace(stateFolder: string): ActionOutcome {
    const read = readState(stateFolder);
    if (read.unreadable !== null) return { error: 'unreadable', reason: read.unreadable };
    try {
        writeState(stateFolder, { ...read.state, open: null, unsaved: { folders: [] } });
    } catch {
        return { error: 'unwritable' };
    }
    return { ok: true };
}

/**
 * Open the workspace file `file`, putting it first in the recent list. A file that is gone, or that
 * lies where no workspace file lies, is taken out of the recent list and refused `gone`.
 */
export function selectWorkspace(stateFolder: string, file: string): ActionOutcome {
    const read = readState(stateFolder);
    if (read.unreadable !== null) return { error: 'unreadable', reason: read.unreadable };
    const { state } = read;
    try {
        if (!usable(file)) {
            writeState(stateFolder, {
                ...state,
                recent: state.recent.filter((one) => one !== file)
            });
            return { error: 'gone' };
        }
        writeState(stateFolder, { ...state, open: file, recent: withRecent(state.recent, file) });
    } catch {
        return { error: 'unwritable' };
    }
    return { ok: true };
}
