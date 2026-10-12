// Layer 2, server. The open workspace as the server's objects hold it, and the polls that tell
// them it moved. Every part of the server that follows the workspace (the portfolio, the git watch,
// the language-server relay, the open-files poll, the app hosts and the apps watcher, the watch on
// the hubs' `local.yml`) asks this object for the workspace and listens to it for a change.
//
// The workspace is read when something it is read from changed and held until the next change: a
// request or a watcher that asks gets the held value and reads no disk. What it is read from is
// polled once a tick by a stat each: `workspace.json` of the state folder, the open workspace file,
// each folder of the workspace, the folder's `.oculus/config`, `.oculus/workspaces`, `project.yml`
// and `.oculus/project.yml` (which decide whether it is a hub, which files the switcher offers and
// whether it is a project), and each file of the recent list. A write the server made itself calls
// `changed()` so the listeners hear of it at once, and the next tick finds no difference.
//
// A change is a difference in what the workspace serves: its file, folders (name, path, whether a
// hub and its own scan depth), primary and findings.

import { isDeepStrictEqual } from 'node:util';
import { join } from 'node:path';
import { HUB_LAYER, MANIFEST, ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { POLL, pollFile, systemClock, type Clock, type FilePoll } from '../../core/file-poll.ts';
import { WORKSPACES_FOLDER, openWorkspace, type OpenWorkspace } from './open.ts';
import { stateFileOf } from './state.ts';

/** What the parts of the server are told: the workspace now and the one before. */
type WorkspaceListener = (now: OpenWorkspace, before: OpenWorkspace) => void;

/** The server's handle on the open workspace. */
export type Workspace = {
    /** The state folder the workspace is read from. */
    stateFolder: string;
    /** The workspace in force, as the last read of it holds it. */
    open(): OpenWorkspace;
    /** Call `listener` when the workspace in force changes; the answer takes the call away. */
    subscribe(listener: WorkspaceListener): () => void;
    /**
     * Read the workspace now and tell the listeners if it differs from the last one told. A write
     * of the workspace file or the state calls it, so the held value is never older than the write.
     */
    changed(): void;
    close(): void;
};

/** What of a workspace the listeners follow. */
function shape(open: OpenWorkspace): unknown {
    return {
        file: open.file,
        folders: open.folders.map((one) => [
            one.name,
            one.dir,
            one.hub,
            one.noProject ?? false,
            one.scanDepth ?? null
        ]),
        primary: open.primary,
        findings: open.findings,
        unreadable: open.unreadable
    };
}

/** The places a workspace's reading depends on, besides the state file and the open file. */
function placesOf(open: OpenWorkspace): string[] {
    const places: string[] = [];
    for (const folder of open.folders) {
        places.push(
            folder.dir,
            join(folder.dir, HUB_LAYER),
            join(folder.dir, ROOT_FOLDER, WORKSPACES_FOLDER),
            join(folder.dir, MANIFEST),
            join(folder.dir, ROOT_FOLDER, MANIFEST)
        );
    }
    places.push(...open.recent.map((one) => one.path));
    return places;
}

/**
 * Hold the workspace of a state folder. `clock` drives the poll, so a test says when a tick runs.
 */
export function createWorkspace(
    stateFolder: string,
    clock: Clock = systemClock,
    every: number = POLL
): Workspace {
    const listeners = new Set<WorkspaceListener>();
    let last = openWorkspace(stateFolder);
    let closed = false;
    const fixed: FilePoll[] = [];
    let placed: FilePoll[] = [];
    const place = (open: OpenWorkspace): void => {
        for (const poll of placed) poll.close();
        placed = placesOf(open).map((path) => pollFile(path, { clock, every }, check));
        for (const poll of placed) poll.reading();
    };
    function check(): void {
        if (closed) return;
        for (const poll of [...fixed, ...placed]) poll.reading();
        const now = openWorkspace(stateFolder);
        const before = last;
        last = now;
        place(now);
        if (isDeepStrictEqual(shape(now), shape(before))) return;
        for (const listener of [...listeners]) listener(now, before);
    }
    fixed.push(
        pollFile(stateFileOf(stateFolder), { clock, every }, check),
        pollFile(() => last.file, { clock, every }, check)
    );
    for (const poll of fixed) poll.reading();
    place(last);
    return {
        stateFolder,
        open: () => last,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        changed: check,
        close(): void {
            closed = true;
            for (const poll of [...fixed, ...placed]) poll.close();
            listeners.clear();
        }
    };
}
