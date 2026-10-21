// Layer 2, server. The folders of a workspace: what a workspace file's `folders:` entries and
// `primary:` key are checked against, and what a folder is once the entries are read. A workspace
// file and the unsaved workspace of the state read through this one function, so a folder is
// accepted by one rule whichever holds it.
//
// An entry is a map with a `name` (letters, digits, `.`, `_` and `-`, not `.` or `..`, once per
// workspace) and a `path` (`~/...`, `~` or absolute). An entry that fails a check is left out with
// a finding naming the file and the entry, and the entries around it are read: a name an earlier
// entry holds leaves the later one out, and so does a folder whose real path an earlier entry holds
// (a symbolic link to it included). A folder that is not on this machine is kept, with a finding,
// so it is served as a root with nothing in it. A folder that holds `.oculus/config.yml` is a hub.
// `primary` names a hub among the folders, and a `primary` naming anything else is a finding and
// leaves the workspace with no primary.
//
// An entry may carry `repository_scan_depth`, a whole number of at least -1: how many levels below
// the folder the Repositories view looks for repositories, -1 meaning no limit. Any other value is
// a finding on the entry and the global `repository_scan_depth` applies to the folder.
//
// A folder that is no hub and holds `project.yml` or `.oculus/project.yml` is a project of the
// workspace wherever it lies, inside a hub or holding one included; a manifest the scan of a hub
// reads too is that hub's one project (`readHubManifests` of data/sources/manifests.ts for the
// primary's scan, `repositoriesOf` of server/files/roots.ts for another hub's).

import { statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { EngineConfigIn } from '../../../data/index.ts';
import { SCAN_DEPTH } from '../../../data/sources/config/merge/workspace-file.ts';
import { isHubFolder } from '../../../data/sources/manifests.ts';
import { below, realPath } from '../../core/paths.ts';
import type { StateFolder } from './state.ts';

/** A finding before its words are known: the catalog id and the values its placeholders take. */
export type WorkspaceFinding = { file: string; key: string; id: string; args: string[] };

/**
 * One directory the server may serve files from: the name a URL names it by, and where it is. A
 * root marked `hub` holds `.oculus/config.yml`. A root that is no hub and holds `project.yml` or
 * `.oculus/project.yml` is a project of the workspace, read once whether or not it lies in a hub
 * (`readHubManifests` of data/sources/manifests.ts, `repositoriesOf` of server/files/roots.ts).
 */
export type Root = {
    key: string;
    dir: string;
    hub?: true;
    /** The entry's own `repository_scan_depth`; the global depth applies when it is absent. */
    scanDepth?: number;
};

/** One folder of an open workspace. */
export type WorkspaceFolder = {
    name: string;
    /** The path as the workspace writes it. */
    path: string;
    /** The path with a leading `~` expanded. */
    dir: string;
    /** The folder with every link resolved, the folder as resolved when it is not there. */
    real: string;
    /** Whether the folder holds `.oculus/config.yml`. */
    hub: boolean;
    /** The entry's own `repository_scan_depth`, a whole number of at least -1. */
    scanDepth?: number;
    /**
     * The entry's `repository_scan_depth` exactly as the file wrote it, a value that is no depth
     * included, which a copy of the workspace carries over so the finding that names it stays.
     */
    writtenDepth?: unknown;
};

/** The least a scan depth may be: -1 is no limit. */
const UNLIMITED = -1;

/** The characters a folder name may hold. */
const NAME = /^[A-Za-z0-9._-]+$/;

/** Whether a text is a folder name: the allowed characters, and not `.` or `..`. */
export function validName(name: string): boolean {
    return NAME.test(name) && name !== '.' && name !== '..';
}

/** A path written as `~` or `~/...` with the home folder in place of the tilde. */
export function expandHome(dir: string): string {
    if (dir === '~') return homedir();
    if (dir.startsWith('~/')) return join(homedir(), dir.slice(2));
    return dir;
}

/** A folder as the workspace file writes it: `~/...` under the home folder, else the whole path. */
export function pathAsWritten(dir: string): string {
    const home = homedir();
    if (dir === home) return '~';
    return dir.startsWith(`${home}/`) ? `~/${dir.slice(home.length + 1)}` : dir;
}

/**
 * The name a folder added to a workspace is filed under: its base name reduced to the characters a
 * name may hold, with a number added while the name is taken. A folder whose base name reduces to
 * nothing is filed under `folder`.
 */
export function folderName(dir: string, taken: readonly string[]): string {
    const reduced = basename(dir)
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^[-.]+|-+$/g, '');
    const stem = reduced === '' || !validName(reduced) ? 'folder' : reduced;
    if (!taken.includes(stem)) return stem;
    for (let at = 2; ; at += 1) {
        const candidate = `${stem}-${at}`;
        if (!taken.includes(candidate)) return candidate;
    }
}

/**
 * A directory's place on disk, links followed, or the directory as resolved when it is not there.
 */
function placeOf(dir: string): string {
    return realPath(dir, true) ?? resolve(dir);
}

/** What reading the folders of a workspace answers. */
export type FoldersRead = {
    folders: WorkspaceFolder[];
    primary: string | null;
    findings: WorkspaceFinding[];
};

/**
 * Read the entries and the `primary` value a workspace holds, as parsed. `file` labels the
 * findings: the workspace file, or the state file for the unsaved workspace.
 */
export function readFolders(entries: unknown, primary: unknown, file: string): FoldersRead {
    const findings: WorkspaceFinding[] = [];
    const raise = (key: string, id: string, ...args: string[]): void => {
        findings.push({ file, key, id, args });
    };
    const folders: WorkspaceFolder[] = [];
    const list = entries === undefined ? [] : entries;
    if (!Array.isArray(list)) {
        raise('folders', 'findings.workspace.not_a_list');
        return { folders, primary: null, findings };
    }
    list.forEach((item, index) => {
        const at = `folders[${index}]`;
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            raise(at, 'findings.workspace.not_a_map');
            return;
        }
        const entry = item as Record<string, unknown>;
        const name = entry.name;
        const path = entry.path;
        if (typeof name !== 'string' || name === '') {
            raise(at, 'findings.workspace.no_name');
            return;
        }
        if (typeof path !== 'string' || path === '') {
            raise(name, 'findings.workspace.no_path');
            return;
        }
        if (!validName(name)) {
            raise(name, 'findings.workspace.bad_name', name);
            return;
        }
        if (folders.some((one) => one.name === name)) {
            raise(name, 'findings.workspace.repeated_name', name);
            return;
        }
        const dir = expandHome(path);
        if (!isAbsolute(dir)) {
            raise(name, 'findings.workspace.relative', path);
            return;
        }
        const real = placeOf(dir);
        const twin = folders.find((one) => one.real === real);
        if (twin !== undefined) {
            raise(name, 'findings.workspace.same_dir', twin.name);
            return;
        }
        if (realPath(dir) === null) raise(name, 'findings.workspace.missing_dir', dir);
        const depth = entry[SCAN_DEPTH];
        const wrongDepth =
            depth !== undefined && !(Number.isInteger(depth) && (depth as number) >= UNLIMITED);
        if (wrongDepth) raise(name, 'findings.workspace.bad_scan_depth', name);
        folders.push({
            name,
            path,
            dir,
            real,
            hub: realPath(dir) !== null && isHubFolder(dir),
            ...(depth !== undefined && !wrongDepth ? { scanDepth: depth as number } : {}),
            ...(depth === undefined ? {} : { writtenDepth: depth })
        });
    });
    if (primary === undefined || primary === null) return { folders, primary: null, findings };
    const named = typeof primary === 'string' ? folders.find((one) => one.name === primary) : null;
    if (named === undefined || named === null) {
        raise(
            'primary',
            'findings.workspace.primary_unknown',
            typeof primary === 'string' ? primary : JSON.stringify(primary)
        );
        return { folders, primary: null, findings };
    }
    if (!named.hub) {
        raise('primary', 'findings.workspace.primary_not_hub', named.name);
        return { folders, primary: null, findings };
    }
    return { folders, primary: named.name, findings };
}

/** The roots a list of folders serves, in the folders' order. */
export function rootsOf(folders: readonly WorkspaceFolder[]): Root[] {
    return folders.map((one) => ({
        key: one.name,
        dir: one.dir,
        ...(one.hub ? { hub: true as const } : {}),
        ...(one.scanDepth === undefined ? {} : { scanDepth: one.scanDepth })
    }));
}

/** The entries of the unsaved workspace as the reader takes them. */
export function stateEntries(folders: readonly StateFolder[]): unknown[] {
    return folders.map((one) => ({ name: one.name, path: one.path }));
}

/** Why a folder cannot be added to a workspace: the words the writes answer. */
export type FolderRefusal =
    'no-dir' | 'not-absolute' | 'no-such-dir' | 'not-a-directory' | 'root-held';

/**
 * The folder a typed path names, by its real path, or why it cannot be added: nothing typed, a
 * relative path, nothing there, a file, or a folder the workspace already lists. The real paths are
 * compared, so the same folder reached through a trailing slash or a link is the folder it already
 * is rather than a second entry under a second name.
 */
export function folderToAdd(
    typed: string,
    held: readonly { dir: string }[]
): { dir: string } | { error: FolderRefusal } {
    const text = typed.trim();
    if (text === '') return { error: 'no-dir' };
    const expanded = expandHome(text);
    if (!isAbsolute(expanded)) return { error: 'not-absolute' };
    const dir = realPath(expanded);
    if (dir === null) return { error: 'no-such-dir' };
    try {
        if (!statSync(dir).isDirectory()) return { error: 'not-a-directory' };
    } catch {
        return { error: 'no-such-dir' };
    }
    if (held.some((one) => realPath(one.dir) === dir)) return { error: 'root-held' };
    return { dir };
}

/**
 * Where oculus's own config folder lies in the workspace: the folders whose real path is, or holds,
 * that folder, each with the path of the config folder inside it. Null when no folder does, in
 * which case the config files are not indexed or governed by schema.
 */
export function engineConfigIn(
    folders: readonly WorkspaceFolder[],
    configFolder: string
): EngineConfigIn | null {
    const config = realPath(configFolder, true);
    if (config === null) return null;
    const held = folders.flatMap((one) => {
        if (config !== one.real && !below(config, one.real)) return [];
        return [
            { root: one.name, path: config === one.real ? '' : config.slice(one.real.length + 1) }
        ];
    });
    return held.length === 0 ? null : { dir: configFolder, held };
}

/** A value of a workspace file written so it reads back as the same value. */
export function valueText(value: unknown): string {
    return typeof value === 'string' ? scalarText(value) : JSON.stringify(value);
}

/** A scalar written plainly where that reads back as the same text, and quoted otherwise. */
export function scalarText(value: string): string {
    if (/^[A-Za-z0-9_./~-]+$/.test(value) && parse(value) === value) return value;
    return JSON.stringify(value);
}
