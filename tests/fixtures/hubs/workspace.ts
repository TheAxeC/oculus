// Layer 4, test helper. An open workspace for a case, made of a scratch state folder that holds the
// unsaved workspace the case names, or opens a saved workspace file the case plants, so a server
// object under test reads folders the same way the server reads them: from `workspace.json` of a
// state folder, never from the machine of the person running the test. A folder is a hub when it
// holds `.oculus/config.yml`, as it is for the server.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import { engineDir } from '../../../src/lib/data/places/engine-dir.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleFsWrite, ignoredCache } from '../../../src/lib/server/files/fs.ts';
import { writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { openWorkspace, type OpenWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import type { Workspace } from '../../../src/lib/server/files/workspace/follow.ts';
import {
    workspacesAnswer as readWorkspaces,
    type WorkspacesState
} from '../../../src/lib/state/sources/fs-transport.ts';
import { scratchDir } from '../scratch.ts';
import { noop } from '../doubles.ts';

/** A folder of a case's workspace: the name it is served under and where it lies. */
export type FolderSpec = { name: string; dir: string };

/**
 * The workspaces answer `body` as the page reads it (state/sources/fs-transport.ts
 * `workspacesAnswer`), sent through JSON by a fetch that answers it, as the route sends it.
 */
export async function pageWorkspaces(body: unknown): Promise<WorkspacesState> {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json(body)));
    try {
        return await readWorkspaces();
    } finally {
        vi.unstubAllGlobals();
    }
}

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

/**
 * A hub folder: a folder holding `.oculus/config.yml`, so the workspace reads it as a hub. The file
 * holds `settings` when given, else the empty map, and a file the folder already holds is kept.
 */
export function plantHub(dir: string, settings?: string): string {
    mkdirSync(join(dir, '.oculus'), { recursive: true });
    if (settings !== undefined || !existsSync(join(dir, HUB_FILE))) {
        writeFileSync(join(dir, HUB_FILE), settings ?? '{}\n');
    }
    return dir;
}

/** A saved workspace a case opens: its file, the state folder that opens it, and the workspace. */
export type SavedWorkspace = { file: string; state: string; open: OpenWorkspace };

/**
 * A saved workspace over one hub: the hub planted (`plantHub`), the workspace file
 * `<hub>/.oculus/workspaces/main.yml` naming the hub as its one folder and its primary, followed by
 * `settings` (the file's `settings:` block as YAML text, or nothing), and a state folder whose
 * state opens that file.
 */
export function plantSaved(hub: string, settings = ''): SavedWorkspace {
    plantHub(hub);
    const folder = join(hub, '.oculus', 'workspaces');
    mkdirSync(folder, { recursive: true });
    const file = join(folder, 'main.yml');
    writeFileSync(file, `folders:\n  - { name: hub, path: ${hub} }\nprimary: hub\n${settings}`);
    const state = scratchDir('oculus-workspace-state-');
    writeState(state, { open: file, recent: [file], unsaved: { folders: [] } });
    return { file, state, open: openWorkspace(state) };
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

/** The write token the requests of `writeFs` carry. */
const FS_TOKEN = 'a-write-token';

/** One write of `action` to /api/fs over the workspace of the state folder `state`. */
export async function writeFs(
    state: string,
    action: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
    const host = '127.0.0.1:8791';
    const request = new Request(`http://${host}/api/fs`, {
        method: 'POST',
        headers: {
            host,
            origin: `http://${host}`,
            'content-type': 'application/json',
            'x-oculus-token': FS_TOKEN
        },
        body: JSON.stringify(action)
    });
    const response = await handleFsWrite(request, FS_TOKEN, {
        engine: engineDir(),
        workspace: workspaceOf(state),
        machine: { set: [], defaults: {}, values: {}, hubs: {}, portRefused: null },
        bookmarks: null,
        writes: fsWrites(),
        ignored: ignoredCache()
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}
