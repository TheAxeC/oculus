// Layer 2, server. The sessions payload: scan both stores, group what came back, and stop.
// Composition only, so the order of the two steps is the whole content of this file.

import { join } from 'node:path';
import type { SessionsPayload, Snapshot, Terminal } from '../../data/model/index.ts';
import { group, type ProjectFolder } from './group.ts';
import { HookStore, mergeHooks } from './stores/hooks.ts';
import { defaultOverridesPath } from './overrides.ts';
import { scan, type ScanOptions } from './stores/transcripts.ts';

export type SessionsOptions = ScanOptions & {
    /** Absolute path of the research hub, which is what a project's folder is relative to. */
    hub?: string;
    /** The portfolio, from which every project's folder and title is taken. */
    snapshot?: Snapshot;
    /** Project folders given directly, when there is no snapshot to read them from. */
    projectFolders?: ProjectFolder[];
    roots?: string[];
    /** The sessions oculus drives itself, rather than only reading their transcripts. */
    attachedIds?: string[];
    /** hooks.ts's HookStore to merge each record's `hook` field from. */
    hooks?: HookStore;
    /** The tmux terminals, which the payload carries so the page sees one the moment it exists. */
    terminals?: Terminal[];
};

// The payload's own shape lives in data/model/index.ts with the rest of the wire, since the
// `sessions` channel carries it and the client state reads it there.
export type { SessionsPayload };

/** Every project's absolute folder with its title, which is what the area scoring is given. */
export function projectFolders(hub: string, snapshot: Snapshot): ProjectFolder[] {
    const folders: ProjectFolder[] = [];
    for (const project of Object.values(snapshot.entities.projects)) {
        if (typeof project.folder !== 'string' || !project.folder) continue;
        folders.push([join(hub, project.folder), project.title]);
    }
    return folders;
}

/** The records, newest first, and the tree they group into. */
export function sessions(options: SessionsOptions = {}): SessionsPayload {
    const records = mergeHooks(scan(options), options.hooks ?? new HookStore(), Date.now());
    const folders =
        options.projectFolders ??
        (options.snapshot !== undefined && options.hub !== undefined
            ? projectFolders(options.hub, options.snapshot)
            : []);
    const workspaces = group(
        records,
        folders,
        options.roots ?? null,
        options.attachedIds ?? [],
        options.overridesPath ?? defaultOverridesPath()
    );
    return { records, workspaces, terminals: options.terminals ?? [] };
}
