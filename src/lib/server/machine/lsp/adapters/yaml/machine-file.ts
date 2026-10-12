// Layer 2, server. The files of this machine that are never put on the YAML language server: the
// `.oculus/local.yml` of each hub of the open workspace, the `local.yml` of oculus's own config
// folder, and every file under the `secrets` folder of any hub or under `~/.oculus`, the folders
// the library rules withhold beside the engine's config folder. A `local.yml` is told apart from
// every other file by the device and inode of what a path leads to (workspace/machine-file.ts), so
// any spelling of the path, a link included, names it; a folder is compared as library/rules.ts
// compares one, as written and as resolved.

import { homedir } from 'node:os';
import { hubDirs, privateFolders } from '../../../../../data/helpers/files/private-folders.ts';
import { under } from '../../../../core/paths.ts';
import { isMachineFile as leadsToMachineFile } from '../../../../files/workspace/machine-file.ts';
import type { ServedRoot } from '../../uris.ts';

/** The served roots as the folders of the workspace the machine's files are looked for in. */
function foldersOf(roots: readonly ServedRoot[]): { dir: string; hub?: boolean }[] {
    return roots.map((root) => ({ dir: root.real, hub: root.hub }));
}

/**
 * Whether a real path is one of the machine's `local.yml` files: a hub's among the served roots or
 * the one in oculus's own config folder `config`.
 */
export function isMachineFile(real: string, roots: readonly ServedRoot[], config: string): boolean {
    return leadsToMachineFile(real, foldersOf(roots), config);
}

/** Whether a real path lies in the `secrets` folder of any hub or in `~/.oculus`. */
export function isPrivateFile(real: string, roots: readonly ServedRoot[]): boolean {
    return under(real, privateFolders(hubDirs(foldersOf(roots)), homedir()));
}
