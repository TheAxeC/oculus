// Layer 2, client state. What the Settings view knows of the engine's configuration files by name:
// the extension they carry, the machine's own file, the folders of the vocabulary catalogs and of
// the schemas, and the one-line description each file has in the text catalog.

import { joinPath, pathUnder } from '../../../data/helpers/files/paths.ts';
import { privateFolders } from '../../../data/helpers/files/private-folders.ts';
import { hasText, lookup } from '../../shared/words/text.ts';
import { ENGINE_ROOT, HUB_ROOT } from '../../sources/explorer/view/place.ts';

/** The extension a configuration file carries. */
const CONFIG_SUFFIX = '.yml';

/**
 * The machine's own file inside the config folder. It is the client's half of the name
 * data/sources/config.ts leaves out of the merge, since nothing client-side may import a server
 * module.
 */
export const LOCAL_NAME = 'local.yml';

/**
 * Whether a file of a served root is one no YAML language server is given: the machine's own
 * `local.yml`, a file under the hub's `secrets` folder or a file under `~/.oculus`. The folders are
 * the relay's (data/helpers/files/private-folders.ts); the roots are as the file listing answers
 * them, with absolute folders, and `home` is the machine's home folder as that listing gives it.
 */
export function isWithheldFile(
    file: { root: string; path: string },
    roots: readonly { key: string; dir: string }[],
    home: string
): boolean {
    if (file.root === ENGINE_ROOT && file.path === LOCAL_NAME) return true;
    const root = roots.find((one) => one.key === file.root);
    if (root === undefined) return false;
    const hub = roots.find((one) => one.key === HUB_ROOT);
    const absolute = joinPath(root.dir, file.path);
    return privateFolders(hub?.dir ?? null, home).some(
        (folder) => pathUnder(folder, absolute) !== null
    );
}

/** The folder under config/ that holds the vocabulary catalogs. */
export const CATALOGS = 'catalogs';

/** The folder under config/ that holds the schemas the editor checks the hub's files by. */
export const SCHEMAS = 'schemas';

/** The catalog key one file's one-line description is written under. */
export function descriptionKey(path: string): string {
    const name = path.slice(path.lastIndexOf('/') + 1);
    return `settings.desc_${name.slice(0, -CONFIG_SUFFIX.length).replace(/-/g, '_')}`;
}

/** The description of a file, or the empty string for a file the catalog has no word for. */
export function describedAs(path: string): string {
    return hasText(descriptionKey(path)) ? lookup(descriptionKey(path)) : '';
}
