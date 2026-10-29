// Layer 2, client state. What the Settings view knows of the configuration files by name: the
// extension they carry, the machine's own file, the open workspace file, the folders of the
// defaults files, of the vocabulary catalogs and of the schemas, and the one-line description each
// file has in the text catalog.

import { joinPath, pathUnder } from '../../../data/helpers/files/paths.ts';
import { OCULUS_CONFIG_ROOT } from '../../../data/helpers/files/address.ts';
import { ROOT_FOLDER, WORKSPACES_FOLDER } from '../../../data/helpers/hub-names.ts';
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
 * Where a file of a Settings line or row is opened in an editor: a file of oculus's own `config/`
 * folder (`OCULUS_CONFIG_ROOT`) through the workspace folder that holds it, a file of the primary
 * hub (`PRIMARY_ROOT`) through the primary's folder, and a file of any other served root, such as
 * the open workspace file, there. Null when no folder of the workspace holds the file (a root or a
 * path that is null), which is when Settings offers no open and says why.
 */
export function openTarget(
    root: string | null,
    file: string | null,
    saved: { primary: string | null; engine: { root: string; path: string } | null }
): { root: string; path: string } | null {
    if (root === null || file === null) return null;
    if (root === PRIMARY_ROOT) {
        return saved.primary === null ? null : { root: saved.primary, path: file };
    }
    if (root !== OCULUS_CONFIG_ROOT) return { root, path: file };
    if (saved.engine === null) return null;
    return { root: saved.engine.root, path: joinPath(saved.engine.path, file) };
}

/**
 * The open workspace file as the Settings view reads and opens it: the served root of the hub
 * folder that holds it, null when no folder of the workspace is that hub, and its path in the hub.
 * Null for the unsaved workspace, which has no file.
 */
export function workspaceFilePlace(saved: {
    open: { name: string; hub: string } | null;
    folders: readonly { key: string }[];
}): { root: string | null; path: string } | null {
    const { open } = saved;
    if (open === null) return null;
    const served = saved.folders.some((one) => one.key === open.hub);
    return {
        root: served ? open.hub : null,
        path: `${ROOT_FOLDER}/${WORKSPACES_FOLDER}/${open.name}${CONFIG_SUFFIX}`
    };
}

/** The path of a hub's machine file inside the hub's folder. */
export const LOCAL_PATH = `${ROOT_FOLDER}/${LOCAL_NAME}`;

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

/** The folder under config/ that holds oculus's defaults files, which Show Defaults opens. */
const DEFAULTS = 'defaults';

/** The options file of the workspace's own words, whose default is the whole text catalog. */
const TEXT_OPTIONS = 'text.yml';

/**
 * The file under config/ Show Defaults opens for an options file the Settings view lists: the
 * defaults file of the same name for a defaults file (`defaults/appearance.yml`), the catalog or
 * schema file itself for one of a subfolder (`catalogs/vocab.yml`), and none for `text.yml`, whose
 * default is the whole text catalog of config/text/.
 */
export function defaultsOf(file: string): string | null {
    if (file === TEXT_OPTIONS) return null;
    return file.includes('/') ? file : `${DEFAULTS}/${file}`;
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
