// Layer 1, data. The names of the hub's files and folders that the readers of data/sources, the
// schema generator of data/snapshot, the file server and the page all hold: the manifest's file
// name, the five tier words and the folder of a repository that holds oculus's own files, how a
// record of the merged portfolio names the hub it was read from, how each registry file names its
// entry list and its id field, and which folders the project scan walks: the scan reader
// (data/sources/manifests.ts), the `new_project_dir` check (data/index.ts) and the new project form
// (state/boards/board/new-project.ts) share those, so they agree on what is scanned.
//
// A workspace lists folders, and the ones that hold `.oculus/config/` are hubs. The primary is the
// hub named by the workspace file's `primary` key: its records carry no `root` and keep their bare
// ids, and a record of every other hub carries the hub's folder name in `root` and in front of its
// id. With no primary every hub's records are prefixed. Each function below that tells a record's
// hub or id apart takes the primary's name, or null when the workspace names none.

import type { Collection, Id, RegistryName, Rooted, Tier } from '../model/index.ts';

/**
 * The name of the hub a record was read from: the `root` it carries, else the primary, else the
 * empty name for a record of no hub (a project folder of a workspace with no primary).
 */
export function rootOf(record: Rooted, primary: string | null): string {
    return record.root ?? primary ?? '';
}

/**
 * The id a record of the hub named `root` has in the merged portfolio: a record of the primary
 * keeps its id, and one of another hub has the hub's name and a colon in front of it.
 */
export function hubId(root: string, id: string, primary: string | null): string {
    return root === primary || root === '' ? id : `${root}:${id}`;
}

/**
 * The id a value naming a record has in the merged portfolio, read inside the hub of the record
 * `holder` that holds it: a value of a hub other than the primary gets that hub's name in front
 * unless it carries it already (the merge prefixed a field whose `from:` names the record's
 * source), so a reference in a field the schema gives no `from:` never resolves to another hub's
 * record.
 */
export function inHubOf(holder: Rooted, value: string, primary: string | null): string {
    const root = rootOf(holder, primary);
    return root === primary || root === '' || value.startsWith(`${root}:`)
        ? value
        : hubId(root, value, primary);
}

/**
 * The hub an id of the merged portfolio belongs to and the id inside that hub, given the names of
 * the hubs other than the primary: `lab:alpha` under the names `lab` is
 * `{ root: 'lab', id: 'alpha' }` and any other id is the primary's own, whose name is `primary`
 * (the empty name with none).
 */
export function splitHubId(
    id: string,
    keys: readonly string[],
    primary: string | null
): { root: string; id: string } {
    const key = keys.find((one) => id.startsWith(`${one}:`));
    return key === undefined
        ? { root: primary ?? '', id }
        : { root: key, id: id.slice(key.length + 1) };
}

/** The id a record has inside its own hub's files: its merged id with the hub's prefix off. */
export function bareId(record: Rooted & { id: string }): string {
    const { root } = record;
    return root === undefined ? record.id : splitHubId(record.id, [root], null).id;
}

/**
 * The records of the hub named `key`, each with the id its own hub's files give it: the records of
 * the merged portfolio of that hub, the hub's prefix taken off their ids.
 */
export function ofHub<T extends { id: string; root?: string }>(
    records: T[],
    key: string,
    primary: string | null
): T[] {
    return records
        .filter((record) => rootOf(record, primary) === key)
        .map((record) => ({ ...record, id: bareId(record) }));
}

/**
 * The collections of the key `key` across the hubs: the primary's, then each other hub's
 * (`<hub name>:<key>` in the merged portfolio) in the order of the workspace's folders. A portfolio
 * of one hub answers its own collection alone, and none when it holds no such file.
 */
export function collectionsOf(collections: Record<Id, Collection>, key: string): Collection[] {
    const first = Object.hasOwn(collections, key) ? [collections[key]] : [];
    const others = Object.values(collections).filter(
        (one) => one.root !== undefined && bareId(one) === key
    );
    return [...first, ...others];
}

/** The entries of the collection `key` across the hubs, and none when no hub holds one. */
export function joinedEntries(
    collections: Record<Id, Collection>,
    key: string
): Collection['entries'] {
    return collectionsOf(collections, key).flatMap((one) => one.entries);
}

/** A file named by the root it is served under and its path inside that root. */
export type FileName = { root: string; path: string };

/** A served root as the decision of one disk file needs it: its key and its folders. */
export type RootFolder = { key: string; dir: string; real?: string };

/**
 * The name of a file that lies under one of the roots: the root whose folder holds it most closely
 * and the path under that root, or null when no root holds it. A path that is not absolute is
 * already relative to the primary's folder, and names no file when the workspace has no primary.
 */
export function fileUnder(
    file: string,
    roots: readonly RootFolder[],
    primary: string | null
): FileName | null {
    if (!file.startsWith('/')) return primary === null ? null : { root: primary, path: file };
    let best: FileName | null = null;
    let depth = -1;
    for (const root of roots) {
        const base = (root.real ?? root.dir).replace(/\/+$/, '');
        if (base === '' || !file.startsWith(`${base}/`) || base.length <= depth) continue;
        best = { root: root.key, path: file.slice(base.length + 1) };
        depth = base.length;
    }
    return best;
}

/**
 * The name of the file an absolute path stands for in a record: its name under a root, or while no
 * root is read a name under no root, which `diskRelation` then answers `unread` against every other
 * name. Null for a path no root holds once the roots are read.
 */
export function fileNamed(
    file: string,
    roots: readonly RootFolder[],
    primary: string | null
): FileName | null {
    const under = fileUnder(file, roots, primary);
    if (under !== null) return under;
    return roots.length === 0 && file.startsWith('/') ? { root: '', path: file } : null;
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
 * path, so a folder listed twice under two names, or inside another listed folder, reaches one file
 * by two names. A name that stands for no path on disk (see `diskPath`) is one file with itself
 * alone. A file reached through a symbolic link inside a root is another file than its target.
 */
export function sameDiskFile(
    one: FileName,
    other: FileName,
    roots: readonly RootFolder[]
): boolean {
    const [first, second] = [diskPath(one, roots), diskPath(other, roots)];
    if (first !== null && second !== null) return first === second;
    return one.root === other.root && one.path === other.path;
}

/** How two names stand to each other on disk: one file, two files, or not yet knowable. */
export type DiskRelation = 'same' | 'other' | 'unread';

/**
 * Whether two names are one file on disk, as `sameDiskFile` decides, with a third answer for the
 * time before the roots are read: with no root listed no name reaches a folder, so two different
 * names may still be one file, and `unread` says that is not known.
 */
export function diskRelation(
    one: FileName,
    other: FileName,
    roots: readonly RootFolder[]
): DiskRelation {
    if (sameDiskFile(one, other, roots)) return 'same';
    return roots.length === 0 ? 'unread' : 'other';
}

/** The career file's path in the hub, which the config falls back to when it names none. */
export const CAREER_FILE = 'registries/career.yml';

/** The one filename a scan tier's folder is read for. */
export const MANIFEST = 'project.yml';

/** The five tiers a manifest's `tier` may name, in the order the tier select offers them. */
export const TIERS: readonly Tier[] = ['projects', 'coauthor', 'archive', 'personal', 'software'];

/** The tier a manifest's `tier` value names, and undefined when it names none of the five. */
export function tierOf(value: unknown): Tier | undefined {
    return TIERS.find((one) => one === value);
}

/** The folder of a repository that holds its project manifest. */
export const ROOT_FOLDER = '.oculus';

/** The hub's own config folder under `.oculus`, which holds the second layer of the settings. */
export const HUB_LAYER = `${ROOT_FOLDER}/config`;

/**
 * The keys the hub's own config layer (`<hub>/.oculus/config/`) may set, by the config file they
 * are set in (named relative to config/). Each is a dotted path into that file; a value the layer
 * holds at one of these paths replaces the engine's value whole, and a key outside the list is a
 * finding and is not applied. They are the keys that describe this hub rather than the engine: its
 * folders and registries, its domains and themes, the cluster its jobs run on, and the values its
 * apps' settings hold.
 */
export const HUB_LIST: Readonly<Record<string, readonly string[]>> = {
    'sources.yml': [
        'scan',
        'portfolio_deck',
        'venues_file',
        'datasets_file',
        'pillars_file',
        'domains_file',
        'people_file',
        'organisations_file',
        'resources_file',
        'collections',
        'new_project_dir',
        'leads_file',
        'radar_file',
        'publications_file',
        'linkedin_dir',
        'career_file',
        'memories_dir',
        'wallpaper_dir'
    ],
    'appearance.yml': ['wallpaper.image'],
    'layout.yml': ['docs'],
    'behavior.yml': ['slurm.resource', 'data_domains', 'app_settings'],
    'catalogs/vocab.yml': ['domains', 'venue_themes', 'data_themes']
};

/** The dotted keys the hub list names for a config file, or undefined for a file outside it. */
export function hubKeysOf(name: string): readonly string[] | undefined {
    return Object.hasOwn(HUB_LIST, name) ? HUB_LIST[name] : undefined;
}

/** The path, inside the hub, of a file of the hub's config layer (`.oculus/config/sources.yml`). */
export function hubLayerPath(name: string): string {
    return `${HUB_LAYER}/${name}`;
}

/** Whether a `from` value (see loadConfig) names a file of the hub's layer. */
export function fromHubLayer(file: string): boolean {
    return file.startsWith(`${HUB_LAYER}/`);
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

/** The folder name no walk enters besides the dot folders: a package tree holds no project. */
const PACKAGES = 'node_modules';

/** Whether the walk enters a folder of this name: not a dot folder and not a package tree. */
export function entersFolder(name: string): boolean {
    return !name.startsWith('.') && name !== PACKAGES;
}

/** A folder as the scan rules write it: no leading `./` and no trailing slash. */
export function folderOf(path: string): string {
    return path.replace(/^\.\//, '').replace(/\/+$/, '');
}

/**
 * Whether a hub-relative folder is one of the scan folders, or lies inside one on a path the scan
 * walks, so a project made there is read.
 */
export function inScan(folder: string, dirs: readonly string[]): boolean {
    const path = folderOf(folder);
    return dirs.some((entry) => {
        const dir = folderOf(entry);
        if (path === dir) return true;
        if (!path.startsWith(`${dir}/`)) return false;
        return path
            .slice(dir.length + 1)
            .split('/')
            .every(entersFolder);
    });
}
