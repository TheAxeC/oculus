// Layer 2, server. The sessions payload: scan both stores, group what came back, and stop.
// Composition only, so the order of the two steps is the whole content of this file.

import { rootOf } from '../../data/helpers/hub-names.ts';
import { folderOnDisk } from '../../data/places/folder-on-disk.ts';
import type { SessionsPayload, Snapshot, Terminal } from '../../data/model/index.ts';
import { group, type ProjectFolder } from './group.ts';
import { HookStore, mergeHooks } from './stores/hooks.ts';
import { defaultOverridesPath } from './overrides.ts';
import { scan, type ScanOptions } from './stores/transcripts.ts';

export type SessionsOptions = ScanOptions & {
    /**
     * The hubs of the open workspace by name, the primary's among them, which a project's folder is
     * relative to; with a `snapshot`, the projects' folders are taken from them.
     */
    hubs?: Readonly<Record<string, string>>;
    /** The portfolio, from which every project's folder and title is taken. */
    snapshot?: Snapshot;
    /** Project folders given directly, when there is no snapshot to read them from. */
    projectFolders?: ProjectFolder[];
    roots?: string[];
    /** The sessions oculus drives itself, rather than only reading their transcripts. */
    attachedIds?: string[];
    /** hooks.ts's HookStore to merge each record's `hook` field from. */
    hooks?: HookStore;
    /**
     * The tmux terminals, which the payload carries so the page sees one the moment it exists; null
     * while tmux's list has not been read yet, and then the payload carries no list at all.
     */
    terminals?: Terminal[] | null;
};

// The payload's own shape lives in data/model/index.ts with the rest of the wire, since the
// `sessions` channel carries it and the client state reads it there.
export type { SessionsPayload };

/**
 * Every project's absolute folder with its title, which is what the area scoring is given. A
 * project's folder is relative to its own hub unless it is a workspace folder's, so `hubs` names
 * the folder of each hub by its name; a project of a hub not named there has no folder to give.
 */
export function projectFolders(
    hubs: Readonly<Record<string, string>>,
    snapshot: Snapshot
): ProjectFolder[] {
    const folders: ProjectFolder[] = [];
    for (const project of Object.values(snapshot.entities.projects)) {
        const name = rootOf(project);
        const hub = Object.hasOwn(hubs, name) ? hubs[name] : undefined;
        if (hub === undefined || typeof project.folder !== 'string' || !project.folder) continue;
        folders.push([folderOnDisk(hub, project), project.title]);
    }
    return folders;
}

/** The records, newest first, and the tree they group into. */
export function sessions(options: SessionsOptions = {}): SessionsPayload {
    const records = mergeHooks(scan(options), options.hooks ?? new HookStore(), Date.now());
    const folders =
        options.projectFolders ??
        (options.snapshot !== undefined && options.hubs !== undefined
            ? projectFolders(options.hubs, options.snapshot)
            : []);
    const workspaces = group(
        records,
        folders,
        options.roots ?? null,
        options.attachedIds ?? [],
        options.overridesPath ?? defaultOverridesPath()
    );
    if (options.terminals === null) return { records, workspaces };
    return { records, workspaces, terminals: options.terminals ?? [] };
}
