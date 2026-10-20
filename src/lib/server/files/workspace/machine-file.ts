// Layer 2, server. The machine's own files in an open workspace: the `.oculus/local.yml` of every
// hub among its folders. A path is one of them when the device and inode of what it leads to are
// those of one of the files, so any spelling of the path, a link included, names it, and a hub's
// `.oculus` folder listed as a workspace folder of its own does not make the file another one. The
// modules that ask here are the source tab's key check on a save or create (`source.ts`), the
// bytes a save writes (`source-bytes.ts`), an app's reach (`apps/reach/private.ts`), an app's
// language server (`lsp/relay/relay-apps.ts`) and the place of a Settings write
// (`edit/writes/config/config-place.ts`).

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
 * folders' order. This is the one list the checks of this module and its callers read.
 */
export function machineFilesOf(roots: MachineRoots): string[] {
    return roots
        .filter((one) => one.hub === true)
        .map((one) => join(one.dir, ROOT_FOLDER, LOCAL_NAME));
}

/** The identities of the machine's files that are there. */
function machineIdentities(roots: MachineRoots): Set<string> {
    const found = new Set<string>();
    for (const path of machineFilesOf(roots)) {
        const id = identityOf(path);
        if (id !== null) found.add(id);
    }
    return found;
}

/** Whether a path leads to one of the machine's files. */
export function isMachineFile(path: string, roots: MachineRoots): boolean {
    const id = identityOf(path);
    return id !== null && machineIdentities(roots).has(id);
}

/**
 * Whether a path is where one of the machine's files is or would be: the file itself, or a path
 * with nothing at it that is spelled as one of them, which a write would create.
 */
export function namesMachineFile(path: string, roots: MachineRoots): boolean {
    return isMachineFile(path, roots) || machineFilesOf(roots).includes(path);
}
