// Layer 2, server. The files of this machine that are never put on the YAML language server: its
// own `local.yml`, and every file under the `secrets` folder of any hub or under `~/.oculus`, the
// folders the library rules withhold beside the engine's config folder (the engine's config folder
// itself is served). `local.yml` is told apart from every other file by the device and inode of
// what a path leads to, so any spelling of the path, a link included, names it; a folder is
// compared as library/rules.ts compares one, as written and as resolved.

import { statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { hubDirs, privateFolders } from '../../../../../data/helpers/files/private-folders.ts';
import { ENGINE_ROOT, HUB_ROOT } from '../../../../../data/helpers/hub-names.ts';
import { LOCAL_NAME } from '../../../../../data/sources/config.ts';
import { under } from '../../../../core/paths.ts';
import type { ServedRoot } from '../../uris.ts';

/** The device and inode of a path, or null when nothing is there. */
function identityOf(path: string): string | null {
    try {
        const info = statSync(path, { bigint: true });
        return `${info.dev}:${info.ino}`;
    } catch {
        return null;
    }
}

/** Whether a real path is the machine's own file, which lies in the engine's config folder. */
export function isMachineFile(real: string, roots: readonly ServedRoot[]): boolean {
    const engine = roots.find((root) => root.key === ENGINE_ROOT);
    if (engine === undefined) return false;
    const own = identityOf(join(engine.real, LOCAL_NAME));
    return own !== null && own === identityOf(real);
}

/** Whether a real path lies in the `secrets` folder of any hub or in `~/.oculus`. */
export function isPrivateFile(real: string, roots: readonly ServedRoot[]): boolean {
    const first = roots.find((root) => root.key === HUB_ROOT);
    const hubs = hubDirs(
        first?.real ?? null,
        roots.map((root) => ({ dir: root.real, hub: root.hub }))
    );
    return under(real, privateFolders(hubs, homedir()));
}
