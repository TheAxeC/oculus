// Layer 1, data. The names of the hub's files and folders that the readers of data/sources, the
// schema generator of data/snapshot, the file server and the page all hold: the manifest's file
// name, the side-projects tier and the folder of a repository that holds oculus's own files, the
// two keys the hub and the engine's config folder are served under, and how each registry file
// names its entry list and its id field.

import type { RegistryName, ScanRule } from '../model/index.ts';

/** The key the hub itself is served under, so a collection's `link` to a file in the hub opens. */
export const HUB_ROOT = 'hub';

/**
 * The key the engine's own `config/` folder is served under. The Settings view lists that folder's
 * files and opens one in a source tab, and an edit saved there is an ordinary write under a root,
 * which the config watcher sees like any other. `local.yml` is a file of that folder and is
 * served, read and saved like the tracked ones. Nothing above the folder is served: the root is the
 * folder itself, so the rest of the engine directory stays outside every route.
 */
export const ENGINE_ROOT = 'engine';

/** Where the engine's config folder lies inside the hub, its files served there under `hub`. */
export const ENGINE_IN_HUB = 'tools/oculus/config';

/** A file named by the root it is served under and its path inside that root. */
export type FileName = { root: string; path: string };

/** A served root as the decision of one disk file needs it: its key and its folders. */
export type RootFolder = { key: string; dir: string; real?: string };

/**
 * The name a file has under `hub` when it lies in the engine's config folder of the hub itself,
 * else its own. It is the whole decision while no root is known.
 */
function byPrefix(file: FileName): FileName {
    const prefix = `${ENGINE_IN_HUB}/`;
    if (file.root !== HUB_ROOT || !file.path.startsWith(prefix)) return file;
    return { root: ENGINE_ROOT, path: file.path.slice(prefix.length) };
}

/**
 * The path of a named file on disk: its root's real folder (the root's `dir` when it carries no
 * `real`) joined with its path. Null for a name whose root is not among the roots, and for a root
 * whose real folder is empty, a folder that does not exist.
 */
export function diskPath(file: FileName, roots: readonly RootFolder[]): string | null {
    const root = roots.find((one) => one.key === file.root);
    const folder = root === undefined ? '' : (root.real ?? root.dir);
    if (folder === '') return null;
    const base = folder.replace(/\/+$/, '');
    return file.path === '' ? base : `${base}/${file.path}`;
}

/**
 * Whether two names are one file on disk. Each name stands for its root's folder joined with its
 * path, so the engine's config folder reached as `engine:layout.yml` and as
 * `hub:tools/oculus/config/layout.yml` is one file when the engine root is served from the hub's
 * own config folder, and two files when it is served from another checkout's. A name that stands
 * for no path on disk (see `diskPath`) is one file with itself alone. While the roots are not
 * known, the engine's config folder inside the hub counts as the engine root's. A file reached
 * through a symbolic link inside a root is another file than its target.
 */
export function sameDiskFile(
    one: FileName,
    other: FileName,
    roots: readonly RootFolder[]
): boolean {
    if (roots.length === 0) {
        const [first, second] = [byPrefix(one), byPrefix(other)];
        return first.root === second.root && first.path === second.path;
    }
    const [first, second] = [diskPath(one, roots), diskPath(other, roots)];
    if (first !== null && second !== null) return first === second;
    return one.root === other.root && one.path === other.path;
}

/** The career file's path in the hub, which the config falls back to when it names none. */
export const CAREER_FILE = 'registries/career.yml';

/** The one filename a scan tier's folder is read for. */
export const MANIFEST = 'project.yml';

/** The tier whose folders are side projects, which only the Personal board reads. */
const SIDE_TIER = 'side-projects';

/** The folder of a repository that holds its side-project manifest. */
export const ROOT_FOLDER = '.oculus';

/** Whether a scan rule names the side-projects tier, by the last segment of its `dir`. */
export function isSideTier(rule: ScanRule): boolean {
    return (rule.dir.split('/').pop() ?? rule.dir) === SIDE_TIER;
}

/**
 * How each file names its entry list and its id field. The seven registries keyed by `key` and the
 * venue registry keyed by `id` are what the files hold, and `idRequired` in this table, whatever a
 * file's schema marks, is what makes an entry without its id a finding. Funding's `key` is also the
 * cross-link anchor a manifest names.
 */
export const REGISTRY_SHAPES: Record<
    RegistryName,
    { list: string; idField: string; idRequired: boolean }
> = {
    venues: { list: 'entries', idField: 'id', idRequired: true },
    datasets: { list: 'datasets', idField: 'key', idRequired: true },
    pillars: { list: 'entries', idField: 'key', idRequired: true },
    domains: { list: 'entries', idField: 'key', idRequired: true },
    funding: { list: 'entries', idField: 'key', idRequired: true },
    people: { list: 'entries', idField: 'key', idRequired: true },
    organisations: { list: 'entries', idField: 'key', idRequired: true },
    resources: { list: 'entries', idField: 'key', idRequired: true }
};

/**
 * A manifest key that has been renamed, and the name it is written under now. One word for a thing
 * means the reader takes the new key alone, so a manifest still carrying the old one is a finding
 * that names both rather than a value quietly read under two names.
 */
export const RENAMED_FIELDS: Record<string, string> = { program: 'pillar' };
