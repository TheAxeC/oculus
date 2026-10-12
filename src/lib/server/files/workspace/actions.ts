// Layer 2, server. The two things the person does to the open workspace as a whole: Save Workspace
// As, which writes the workspace's folders and primary into a new file
// `.oculus/workspaces/<name>.yml` of the primary hub (the first hub when there is no primary) and
// opens it, and Switch Workspace, which opens another workspace file. Both change `workspace.json`
// of the state folder; the folders of an open file are edited by the writes of server/edit
// (writes/config/lists/folders.ts).
//
// A name is accepted by the rule of a folder's name (letters, digits, `.`, `_`, `-`), and the empty
// name, `..` and a name with a slash are refused. A file that exists is never written over, and a
// state that is there and does not read is never written over: both are refused with the reason.

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { scalarText, validName } from './folders.ts';
import { WORKSPACES_FOLDER, openWorkspace, usable, type OpenWorkspace } from './open.ts';
import { readState, withRecent, writeState } from './state.ts';

/** Why an action was refused. */
type ActionRefusal =
    'no-name' | 'bad-name' | 'name-held' | 'no-hub' | 'gone' | 'unreadable' | 'unwritable';

/** The answer of an action: done, or the word refusing it, with the file that does not read. */
export type ActionOutcome = { ok: true } | { error: ActionRefusal; reason?: string };

/** The text of a workspace file holding these folders and this primary. */
function workspaceText(
    folders: readonly { name: string; path: string }[],
    primary: string | null
): string {
    const lines =
        folders.length === 0
            ? ['folders: []']
            : [
                  'folders:',
                  ...folders.map(
                      (one) =>
                          `  - { name: ${scalarText(one.name)}, path: ${scalarText(one.path)} }`
                  )
              ];
    if (primary !== null) lines.push(`primary: ${scalarText(primary)}`);
    return `${lines.join('\n')}\n`;
}

/** The folder of the hub a new workspace file is written in: the primary, else the first hub. */
function savingHub(open: OpenWorkspace): string | null {
    return open.primaryDir ?? open.hubs.at(0)?.dir ?? null;
}

/**
 * Save the open workspace's folders and primary as `.oculus/workspaces/<name>.yml` and open that
 * file, putting it first in the recent list. Refused when the name is no name, when the workspace
 * lists no hub to hold the file, when the file exists, and when the state does not read.
 */
export function saveWorkspaceAs(stateFolder: string, typed: string): ActionOutcome {
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
        writeTextAtomic(file, workspaceText(open.folders, open.primary));
        writeState(stateFolder, {
            open: file,
            recent: withRecent(read.state.recent, file),
            unsaved: { folders: [] }
        });
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
