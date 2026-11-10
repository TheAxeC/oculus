// Layer 2, server. The files of this machine that are never put on a language server (the YAML
// server and the Markdown server): every file under the folder of secrets of any hub (its
// `secrets_dir`, which the served roots carry) or under `~/.oculus`, the folders the library rules
// withhold beside the engine's config folder. A folder is compared as library/rules.ts compares
// one, as written and as resolved.

import { homedir } from 'node:os';
import {
    privateFolders,
    type HubMarked
} from '../../../../../data/helpers/files/private-folders.ts';
import { under } from '../../../../core/paths.ts';
import type { ServedRoot } from '../../uris.ts';

/** The served roots as the folders of the workspace the private folders are looked for in. */
function foldersOf(roots: readonly ServedRoot[]): HubMarked[] {
    return roots.map((root) => ({ dir: root.real, hub: root.hub, secrets: root.secrets }));
}

/** Whether a real path lies in the folder of secrets of any hub or in `~/.oculus`. */
export function isPrivateFile(real: string, roots: readonly ServedRoot[]): boolean {
    return under(real, privateFolders(foldersOf(roots), homedir()));
}
