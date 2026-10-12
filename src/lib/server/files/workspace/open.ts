// Layer 2, server. The open workspace: what `workspace.json` of the state folder names, read
// together with the workspace file it names. A workspace file is `.oculus/workspaces/<name>.yml` of
// a hub, holding `folders:` (a `name` and a `path` each) and an optional `primary:` naming one of
// the hub folders:
//
//     folders:
//       - { name: research-hub, path: ~/workspace/research-hub }
//       - { name: claude, path: ~/.claude }
//     primary: research-hub
//
// When the state names no file, or a file that is gone, that does not parse as a map, or that does
// not lie in a hub's `.oculus/workspaces/`, the workspace is unsaved and holds the folders the
// state keeps for it (none when the state names a file that cannot be used). Nothing here throws:
// every fault is a finding or the reason a write onto the open file is refused.
//
// The answer is read at the call, from two small files and the folders' own metadata, so it is
// never older than the files: the follower (workspace/follow.ts) calls it to tell a change.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { parse } from 'yaml';
import { ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { isHubFolder } from '../../../data/sources/manifests.ts';
import { realPath } from '../../core/paths.ts';
import {
    readFolders,
    rootsOf,
    stateEntries,
    type Root,
    type WorkspaceFinding,
    type WorkspaceFolder
} from './folders.ts';
import { readState, stateFileOf, type StateRead, type WorkspaceState } from './state.ts';

/** The folder of a hub that holds its workspace files, under `.oculus/`. */
export const WORKSPACES_FOLDER = 'workspaces';

/** The keys a workspace file takes. */
const FILE_KEYS = ['folders', 'primary'];

/** A workspace file the switcher offers: where it is, its name and the hub that holds it. */
type WorkspaceFileRef = { path: string; name: string; hub: string };

/** A file of the recent list, and whether it is gone. */
type RecentRef = WorkspaceFileRef & { missing: boolean };

/** The workspace in force. */
export type OpenWorkspace = {
    /** The open workspace file, or null while the workspace is unsaved. */
    file: string | null;
    /** The file's name without `.yml`, empty for the unsaved workspace. */
    name: string;
    /** The name of the hub folder the open file lies in, empty for the unsaved workspace. */
    hub: string;
    folders: WorkspaceFolder[];
    primary: string | null;
    /** The folder of the primary hub, or null with no primary. */
    primaryDir: string | null;
    /** The hubs among the folders, in the folders' order. */
    hubs: { name: string; dir: string }[];
    /** The folders as the roots the server serves. */
    roots: Root[];
    findings: WorkspaceFinding[];
    /** The file that does not read, which a write onto the open file or the state leaves alone. */
    unreadable: string | null;
    recent: RecentRef[];
    available: WorkspaceFileRef[];
    /** The state file, which the unsaved workspace and the recent list live in. */
    stateFile: string;
    /** The folder the state lives in. */
    stateFolder: string;
};

/** Whether a path is a workspace file of a hub: `<hub>/.oculus/workspaces/<name>.yml`. */
export function hubOfFile(file: string): string | null {
    if (!file.endsWith('.yml')) return null;
    const folder = dirname(file);
    if (basename(folder) !== WORKSPACES_FOLDER) return null;
    const oculus = dirname(folder);
    if (basename(oculus) !== ROOT_FOLDER) return null;
    const hub = dirname(oculus);
    return isHubFolder(hub) ? hub : null;
}

/** Whether the file is a file that lies where a workspace file lies. */
export function usable(file: string): boolean {
    try {
        return hubOfFile(file) !== null && statSync(file).isFile();
    } catch {
        return false;
    }
}

/** The name of the workspace file `file`: its name without `.yml`. */
function nameOfFile(file: string): string {
    return basename(file, '.yml');
}

/** The name of the hub folder `hub` among the folders, else its base name. */
function hubNameOf(hub: string, folders: readonly WorkspaceFolder[]): string {
    const real = realPath(hub, true) ?? hub;
    return folders.find((one) => one.real === real)?.name ?? basename(hub);
}

/** The workspace files of the hubs among the folders, by hub in folder order, then by name. */
function availableIn(folders: readonly WorkspaceFolder[]): WorkspaceFileRef[] {
    const found: WorkspaceFileRef[] = [];
    for (const folder of folders) {
        if (!folder.hub) continue;
        let names: string[];
        try {
            names = statSync(join(folder.dir, ROOT_FOLDER, WORKSPACES_FOLDER)).isDirectory()
                ? readdirSync(join(folder.dir, ROOT_FOLDER, WORKSPACES_FOLDER))
                : [];
        } catch {
            names = [];
        }
        for (const name of names.filter((one) => one.endsWith('.yml')).sort()) {
            found.push({
                path: join(folder.dir, ROOT_FOLDER, WORKSPACES_FOLDER, name),
                name: nameOfFile(name),
                hub: folder.name
            });
        }
    }
    return found;
}

/** The recent list as the switcher draws it. */
function recentOf(recent: readonly string[], folders: readonly WorkspaceFolder[]): RecentRef[] {
    return recent.map((path) => {
        const hub = hubOfFile(path);
        return {
            path,
            name: nameOfFile(path),
            hub: hub === null ? '' : hubNameOf(hub, folders),
            missing: !usable(path)
        };
    });
}

/** What reading a workspace file answers. */
type FileRead = {
    entries: unknown;
    primary: unknown;
    unreadable: string | null;
    findings: WorkspaceFinding[];
};

/** The parts of a workspace file: its entries and primary, or why it does not read. */
function readFile(file: string): FileRead {
    const none = { entries: undefined, primary: undefined };
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code ?? 'unknown';
        return {
            ...none,
            unreadable: file,
            findings: [{ file, key: '', id: 'findings.workspace.file_unreadable', args: [code] }]
        };
    }
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch {
        return {
            ...none,
            unreadable: file,
            findings: [{ file, key: '', id: 'findings.workspace.file_unparsed', args: [] }]
        };
    }
    const record = parsed ?? {};
    if (!isMap(record)) {
        return {
            ...none,
            unreadable: file,
            findings: [{ file, key: '', id: 'findings.workspace.file_not_a_map', args: [] }]
        };
    }
    const findings: WorkspaceFinding[] = Object.keys(record)
        .filter((key) => !FILE_KEYS.includes(key))
        .map((key) => ({ file, key, id: 'findings.workspace.unknown_key', args: [key] }));
    return {
        entries: record.folders,
        primary: record.primary,
        unreadable: null,
        findings
    };
}

/** The state-held parts of an unsaved workspace's reading. */
function unsavedFrom(read: StateRead): FileRead {
    const { state } = read;
    return {
        entries: stateEntries(state.unsaved.folders),
        primary: state.unsaved.primary,
        unreadable: read.unreadable,
        findings: []
    };
}

/**
 * The workspace in force for a state folder. Reads `workspace.json` of the folder and the file it
 * names, and answers with the folders served, the primary, the findings and the switcher's lists.
 */
export function openWorkspace(stateFolder: string): OpenWorkspace {
    const stateRead = readState(stateFolder);
    const state: WorkspaceState = stateRead.state;
    const stateFile = stateFileOf(stateFolder);
    const named = state.open !== null && usable(state.open) ? state.open : null;
    const unusable = state.open !== null && named === null;
    let file: FileRead;
    if (named !== null) file = readFile(named);
    else if (unusable) file = { entries: [], primary: undefined, unreadable: null, findings: [] };
    else file = unsavedFrom(stateRead);
    const where = named ?? stateFile;
    const read = readFolders(file.entries, file.primary, where);
    const findings = [...file.findings, ...read.findings];
    if (stateRead.unreadable !== null) {
        findings.push({
            file: stateFile,
            key: '',
            id: 'findings.workspace.state_unreadable',
            args: []
        });
    }
    const primaryDir =
        read.primary === null
            ? null
            : (read.folders.find((one) => one.name === read.primary)?.dir ?? null);
    const hubDir = named === null ? null : hubOfFile(named);
    const hubs = read.folders
        .filter((one) => one.hub)
        .map((one) => ({ name: one.name, dir: one.dir }));
    return {
        file: named,
        name: named === null ? '' : nameOfFile(named),
        hub: hubDir === null ? '' : hubNameOf(hubDir, read.folders),
        folders: read.folders,
        primary: read.primary,
        primaryDir,
        hubs,
        roots: rootsOf(read.folders),
        findings,
        unreadable: file.unreadable,
        recent: recentOf(state.recent, read.folders),
        available: availableIn(read.folders),
        stateFile,
        stateFolder
    };
}
