// Layer 1, data. The names of the hub's files and folders that the readers of data/sources, the
// schema generator of data/snapshot, the file server and the page all hold: the manifest's file
// name, the side-projects tier and the folder of a repository that holds oculus's own files, the
// two keys the hub and the engine's config folder are served under, and how each registry file
// names its entry list and its id field.

import type {
    Collection,
    Id,
    RegistryName,
    RepositoryTier,
    Rooted,
    ScanRule
} from '../model/index.ts';

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

/**
 * The key of the hub a record was read from: the `root` it carries, and `hub` for a record that
 * carries none, which is a record of the first hub or of a portfolio of one hub.
 */
export function rootOf(record: Rooted): string {
    return record.root ?? HUB_ROOT;
}

/**
 * The id a record of the hub served under `root` has in the merged portfolio: a record of the first
 * hub keeps its id, and one of another hub has the hub's key and a colon in front of it.
 */
export function hubId(root: string, id: string): string {
    return root === HUB_ROOT ? id : `${root}:${id}`;
}

/**
 * The id a value naming a record has in the merged portfolio, read inside the hub of the record
 * `holder` that holds it: a value of a hub other than the first gets that hub's key in front unless
 * it carries it already (the merge prefixed a field whose `from:` names the record's source), so a
 * reference in a field the schema gives no `from:` never resolves to another hub's record.
 */
export function inHubOf(holder: Rooted, value: string): string {
    const root = rootOf(holder);
    return root === HUB_ROOT || value.startsWith(`${root}:`) ? value : hubId(root, value);
}

/**
 * The hub an id of the merged portfolio belongs to and the id inside that hub, given the keys of
 * the hubs other than the first: `lab:alpha` under the keys `lab` is `{ root: 'lab', id: 'alpha' }`
 * and any other id is the first hub's own.
 */
export function splitHubId(id: string, keys: readonly string[]): { root: string; id: string } {
    const key = keys.find((one) => id.startsWith(`${one}:`));
    return key === undefined ? { root: HUB_ROOT, id } : { root: key, id: id.slice(key.length + 1) };
}

/** The id a record has inside its own hub's files: its merged id with the hub's prefix off. */
export function bareId(record: Rooted & { id: string }): string {
    const root = rootOf(record);
    return root === HUB_ROOT ? record.id : splitHubId(record.id, [root]).id;
}

/**
 * The records of the hub served under `key`, each with the id its own hub's files give it: the
 * records of the merged portfolio that carry the key, the hub's prefix taken off their ids.
 */
export function ofHub<T extends { id: string; root?: string }>(records: T[], key: string): T[] {
    return records
        .filter((record) => rootOf(record) === key)
        .map((record) => ({ ...record, id: bareId(record) }));
}

/**
 * The collections of the key `key` across the hubs: the first hub's, then each other hub's
 * (`<root key>:<key>` in the merged portfolio) in the order of `roots:`. A portfolio of one hub
 * answers its own collection alone, and none when it holds no such file.
 */
export function collectionsOf(collections: Record<Id, Collection>, key: string): Collection[] {
    const first = Object.hasOwn(collections, key) ? [collections[key]] : [];
    const others = Object.values(collections).filter(
        (one) => rootOf(one) !== HUB_ROOT && bareId(one) === key
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

/** Where the engine's config folder lies inside the hub, its files served there under `hub`. */
export const ENGINE_IN_HUB = 'tools/oculus/config';

/** A file named by the root it is served under and its path inside that root. */
export type FileName = { root: string; path: string };

/** A served root as the decision of one disk file needs it: its key and its folders. */
export type RootFolder = { key: string; dir: string; real?: string };

/**
 * The name of a file that lies under one of the roots: the root whose folder holds it most closely
 * and the path under that root, or null when no root holds it. A path that is not absolute is
 * already relative to the hub.
 */
export function fileUnder(file: string, roots: readonly RootFolder[]): FileName | null {
    if (!file.startsWith('/')) return { root: HUB_ROOT, path: file };
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

/** The tier whose folders are side projects, which the Personal board and the Focus ticker read. */
const SIDE_TIER = 'side-projects';

/** The folder of a repository that holds its side-project manifest. */
export const ROOT_FOLDER = '.oculus';

/**
 * The tiers a `roots:` entry may read its repository in as a research project of the first hub,
 * beside `personal`, which reads it as a side project exactly as an entry with no `tier` does.
 */
export const REPOSITORY_TIERS: readonly RepositoryTier[] = ['projects', 'coauthor', 'archive'];

/** The hub's own config folder under `.oculus`, which holds the second layer of the settings. */
export const HUB_LAYER = `${ROOT_FOLDER}/config`;

/**
 * The keys the hub's own config layer (`<hub>/.oculus/config/`) may set, by the config file they
 * are set in (named relative to config/). Each is a dotted path into that file; a value the layer
 * holds at one of these paths replaces the engine's value whole, and a key outside the list is a
 * finding and is not applied. They are the keys that describe this hub rather than the engine: its
 * folders and registries, its domains and themes, and the cluster its jobs run on.
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
        'leads_file',
        'radar_file',
        'publications_file',
        'linkedin_dir',
        'career_file',
        'roots'
    ],
    'layout.yml': ['docs'],
    'behavior.yml': ['slurm.resource', 'data_domains'],
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
