// Layer 4, test helper. An open workspace for a case, made of a scratch state folder that holds the
// unsaved workspace the case names, so a server object under test reads folders the same way the
// server reads them: from `workspace.json` of a state folder, never from the machine of the person
// running the test. A folder is a hub when it holds `.oculus/config/`, as it is for the server.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { openWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import type { Workspace } from '../../../src/lib/server/files/workspace/follow.ts';
import { scratchDir } from '../scratch.ts';
import { noop } from '../doubles.ts';

/** A folder of a case's workspace: the name it is served under and where it lies. */
export type FolderSpec = { name: string; dir: string };

/** The state folder of an unsaved workspace with these folders and this primary. */
export function plantState(folders: readonly FolderSpec[], primary?: string): string {
    const state = scratchDir('oculus-workspace-state-');
    writeState(state, {
        open: null,
        recent: [],
        unsaved: {
            folders: folders.map((one) => ({ name: one.name, path: one.dir })),
            ...(primary === undefined ? {} : { primary })
        }
    });
    return state;
}

/** A hub folder: a folder holding `.oculus/config/`, so the workspace reads it as a hub. */
export function plantHub(dir: string): string {
    mkdirSync(join(dir, '.oculus', 'config'), { recursive: true });
    return dir;
}

/**
 * The workspace of a state folder, read at each call and never polled, so a case that changes the
 * folder or the state sees the change at its next `open()`.
 */
export function workspaceOf(stateFolder: string): Workspace {
    return {
        stateFolder,
        open: () => openWorkspace(stateFolder),
        subscribe: () => noop,
        changed: noop,
        close: noop
    };
}

/** The workspace of an unsaved state with these folders and this primary. */
export function workspaceWith(folders: readonly FolderSpec[], primary?: string): Workspace {
    return workspaceOf(plantState(folders, primary));
}
