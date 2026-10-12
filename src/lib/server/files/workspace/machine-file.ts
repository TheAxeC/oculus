// Layer 2, server. The machine's own files in an open workspace: the `.oculus/local.yml` of every
// hub among its folders and oculus's own `config/local.yml`. A path is one of them when the device
// and inode of what it leads to are those of one of the files, so any spelling of the path, a link
// included, names it, and a hub's `.oculus` folder listed as a workspace folder of its own, or
// oculus's folder listed as a folder of the workspace, does not make the file another one. Every
// module that keeps a request away from the file (the file route, the source tab, the file
// operations, the language servers, the writing rules, an app's reach) asks here.

import { statSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_NAME } from '../../../data/sources/config.ts';
import { ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';

/**
 * The folders of a workspace as the machine's files need them: where they are and whether a hub.
 */
export type MachineRoots = readonly { dir: string; hub?: boolean }[];

/** The device and inode of what is at a path, a link followed, or null when nothing is there. */
function identityOf(path: string): string | null {
    try {
        const info = statSync(path, { bigint: true });
        return `${info.dev}:${info.ino}`;
    } catch {
        return null;
    }
}

/**
 * The paths of the machine's files: the `.oculus/local.yml` of each hub among the folders, in the
 * folders' order, and `local.yml` of oculus's own config folder `config`. This is the one list
 * every guard reads, so no guard names only part of the set.
 */
export function machineFilesOf(roots: MachineRoots, config: string): string[] {
    return [
        ...roots
            .filter((one) => one.hub === true)
            .map((one) => join(one.dir, ROOT_FOLDER, LOCAL_NAME)),
        join(config, LOCAL_NAME)
    ];
}

/** The identities of the machine's files that are there. */
function machineIdentities(roots: MachineRoots, config: string): Set<string> {
    const found = new Set<string>();
    for (const path of machineFilesOf(roots, config)) {
        const id = identityOf(path);
        if (id !== null) found.add(id);
    }
    return found;
}

/** Whether a path leads to one of the machine's files. */
export function isMachineFile(path: string, roots: MachineRoots, config: string): boolean {
    const id = identityOf(path);
    return id !== null && machineIdentities(roots, config).has(id);
}

/**
 * Whether a path is where one of the machine's files is or would be: the file itself, or a path
 * with nothing at it that is spelled as one of them, which a write would create.
 */
export function namesMachineFile(path: string, roots: MachineRoots, config: string): boolean {
    return isMachineFile(path, roots, config) || machineFilesOf(roots, config).includes(path);
}
