// Layer 2, server. The files of this machine that are never put on a language server (the YAML
// server and the Markdown server): every file under the `secrets` folder of any hub or under
// `~/.oculus`, the folders the library rules withhold beside the engine's config folder. A folder
// is compared as library/rules.ts compares one, as written and as resolved.

import { homedir } from 'node:os';
import { hubDirs, privateFolders } from '../../../../../data/helpers/files/private-folders.ts';
import { under } from '../../../../core/paths.ts';
import type { ServedRoot } from '../../uris.ts';

/** The served roots as the folders of the workspace the private folders are looked for in. */
function foldersOf(roots: readonly ServedRoot[]): { dir: string; hub?: boolean }[] {
    return roots.map((root) => ({ dir: root.real, hub: root.hub }));
}

/** Whether a real path lies in the `secrets` folder of any hub or in `~/.oculus`. */
export function isPrivateFile(real: string, roots: readonly ServedRoot[]): boolean {
    return under(real, privateFolders(hubDirs(foldersOf(roots)), homedir()));
}
