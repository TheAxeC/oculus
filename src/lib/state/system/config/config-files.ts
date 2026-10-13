// Layer 2, client state. What the Settings view knows of oculus's configuration files by name: the
// extension they carry, the machine's own file, the folders of the vocabulary catalogs and of the
// schemas, and the one-line description each file has in the text catalog.

import { joinPath, pathUnder } from '../../../data/helpers/files/paths.ts';
import { ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { hubDirs, privateFolders } from '../../../data/helpers/files/private-folders.ts';
import { hasText, lookup } from '../../shared/words/text.ts';

/** The extension a configuration file carries. */
const CONFIG_SUFFIX = '.yml';

/**
 * The name of the machine's own file, which each hub keeps in its `.oculus` folder. It is the
 * client's half of the name data/sources/config/local.ts reads, since nothing client-side may
 * import a server module.
 */
export const LOCAL_NAME = 'local.yml';

/**
 * The root a Settings line names for the primary hub's settings file. The primary's folder name
 * is the workspace's, so the line holds this placeholder and `openTarget` puts the name in.
 */
export const PRIMARY_ROOT = '';

/**
 * Where a file of a Settings line is opened in an editor: a file of oculus's own `config/` folder
 * through the workspace folder that holds it, the primary hub's settings file through the
 * primary's folder. Null when no folder of the workspace holds the file, which is when Settings
 * offers no open and says why.
 */
export function openTarget(
    root: string,
    file: string,
    saved: { primary: string | null; engine: { root: string; path: string } | null }
): { root: string; path: string } | null {
    if (root === PRIMARY_ROOT)
        return saved.primary === null ? null : { root: saved.primary, path: file };
    if (saved.engine === null) return null;
    return { root: saved.engine.root, path: joinPath(saved.engine.path, file) };
}

/** The path of a hub's machine file inside the hub's folder. */
export const LOCAL_PATH = `${ROOT_FOLDER}/${LOCAL_NAME}`;

/**
 * Where the machine file of the hub named `hub` is opened in an editor: through the workspace
 * folder of that name. Null when no folder of the workspace has the name.
 */
export function hubFileTarget(
    hub: string,
    saved: { folders: readonly { key: string }[] }
): { root: string; path: string } | null {
    return saved.folders.some((one) => one.key === hub) ? { root: hub, path: LOCAL_PATH } : null;
}

/**
 * Whether a file of a served root is in a folder that is private to the machine: under the
 * `secrets` folder of any hub or under `~/.oculus`. The folders are the relay's
 * (data/helpers/files/private-folders.ts); the roots are as the file listing answers them, with
 * absolute folders, and `home` is the machine's home folder as that listing gives it. A root whose
 * file system folds letter case (`folds`, which the listing reports) reads `Secrets` as `secrets`,
 * so the file is compared with the folders in one letter case. No edit of a language server is made
 * in such a file.
 */
export function isPrivateFile(
    file: { root: string; path: string },
    roots: readonly { key: string; dir: string; hub?: boolean; folds?: boolean }[],
    home: string
): boolean {
    const root = roots.find((one) => one.key === file.root);
    if (root === undefined) return false;
    const same = (path: string): string => (root.folds === true ? path.toLowerCase() : path);
    const absolute = same(joinPath(root.dir, file.path));
    return privateFolders(hubDirs(roots), home).some(
        (folder) => pathUnder(same(folder), absolute) !== null
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
