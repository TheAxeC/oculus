// Layer 1, data. The names of the hub's files and folders that the readers of data/sources, the
// schema generator of data/snapshot, the file server and the page all hold: the manifest's file
// name, the five tier words and the folder of a repository that holds oculus's own files, how a
// record of the merged portfolio names the hub it was read from, how each registry file names its
// entry list and its id field, and which folders the project scan walks: the scan reader
// (data/sources/manifests.ts), the `new_project_dir` check (data/sources/config/settings/scan.ts)
// and the new project form (state/boards/board/new-project.ts) share those, so they agree on what
// is scanned.
//
// A workspace lists folders, and the ones that hold `.oculus/config.yml` are hubs. Every record of
// the merged portfolio, the primary hub's included, carries the name of its hub in `root` and has
// the internal id `<hub>:<key>`, the key being what its own hub's file names it by; a project of a
// workspace folder that is no hub, in a workspace with no primary, has the folder's name for its
// hub. A reference names a key, and resolves in its own hub first, then in the other hubs: one
// other hub holding the key gives that hub's record, and two or more give none, which the merge
// reports. The joined id is internal: a file, a form, a finding, a label and an address name a
// record by its hub and its key apart, and a page shows the key with the hub chip.

import { isMap } from './guards.ts';
import type { Collection, Id, RegistryName, Rooted } from '../model/index.ts';

/** The name of the hub a record was read from: the `root` it carries, the empty name for none. */
export function rootOf(record: Rooted): string {
    return record.root ?? '';
}

/**
 * The internal id of the record `key` of the hub named `root`: the hub's name, a colon and the key.
 * A record of no hub keeps its key.
 */
export function hubId(root: string, key: string): string {
    return root === '' ? key : `${root}:${key}`;
}

/**
 * The hub an internal id belongs to and the key inside that hub, given the names of the hubs:
 * `lab:alpha` under the names `lab` is `{ root: 'lab', id: 'alpha' }`. The longest name the id
 * begins with, then a colon, is the hub, so a key that itself holds a colon stays whole; an id that
 * begins with no name is of no hub, the empty name.
 */
export function splitHubId(id: string, keys: readonly string[]): { root: string; id: string } {
    let root = '';
    for (const key of keys) {
        if (key.length > root.length && id.startsWith(`${key}:`)) root = key;
    }
    return root === '' ? { root, id } : { root, id: id.slice(root.length + 1) };
}

/**
 * The hub and the key of an internal id, read from the id alone. A hub's name is the name of a
 * workspace folder, which holds no colon (`validName` of server/files/workspace/folders.ts), so the
 * first colon ends it and the key is the rest, colons included; an id with no colon is a key of no
 * hub. `hubId` of the two gives the id back, whatever text it was.
 */
export function addressOfId(id: string): RecordAddress {
    const colon = id.indexOf(':');
    return colon < 0 ? { hub: '', key: id } : { hub: id.slice(0, colon), key: id.slice(colon + 1) };
}

/** The key of an internal id, read from the id alone (`addressOfId`). */
export function keyOf(id: string): string {
    return addressOfId(id).key;
}

/** The key a record has inside its own hub's files: its internal id with the hub's name off. */
export function bareId(record: Rooted & { id: string }): string {
    const { root } = record;
    return root === undefined ? record.id : splitHubId(record.id, [root]).id;
}

/** Where a record is: the name of its hub and its key, the two fields a file names it by. */
export type RecordAddress = { hub: string; key: string };

/** The hub and the key of a record. */
export function addressOf(record: Rooted & { id: string }): RecordAddress {
    return { hub: rootOf(record), key: bareId(record) };
}

/**
 * The records of the hub named `key`, each with the id its own hub's files give it: the records of
 * the merged portfolio of that hub, the hub's name taken off their ids.
 */
export function ofHub<T extends { id: string; root?: string }>(records: T[], key: string): T[] {
    return records
        .filter((record) => rootOf(record) === key)
        .map((record) => ({ ...record, id: bareId(record) }));
}

/**
 * The collections of the key `key` across the hubs, in the order the portfolio holds them, which
 * is the order of the workspace's folders; none when no hub holds such a file.
 */
export function collectionsOf(collections: Record<Id, Collection>, key: string): Collection[] {
    return Object.values(collections).filter((one) => bareId(one) === key);
}

/** The entries of the collection `key` across the hubs, and none when no hub holds one. */
export function joinedEntries(
    collections: Record<Id, Collection>,
    key: string
): Collection['entries'] {
    return collectionsOf(collections, key).flatMap((one) => one.entries);
}

/** The hubs that hold each key of one kind of record, each key's hubs in the workspace's order. */
export type Holders = ReadonlyMap<string, readonly string[]>;

/** The holders of the keys of one kind of record of the merged portfolio. */
export function holdersOf(records: Iterable<Rooted & { id: string }>): Holders {
    const held = new Map<string, string[]>();
    for (const record of records) {
        const key = bareId(record);
        const hubs = held.get(key) ?? [];
        if (!hubs.includes(rootOf(record))) hubs.push(rootOf(record));
        held.set(key, hubs);
    }
    return held;
}

/**
 * What a reference to `key` read in the hub `own` names: the record of its own hub when that hub
 * holds the key, else the record of the one other hub that holds it. Two or more other hubs holding
 * it name none, and the answer lists them, in the workspace's order; a key no hub holds is null.
 */
export function resolveKey(
    holders: Holders,
    own: string,
    key: string
): { id: string } | { hubs: readonly string[] } | null {
    const hubs = holders.get(key) ?? [];
    if (hubs.includes(own)) return { id: hubId(own, key) };
    if (hubs.length === 1) return { id: hubId(hubs[0], key) };
    return hubs.length === 0 ? null : { hubs };
}

/** The internal id a reference to `key` read in the hub `own` names, or null for none. */
export function resolvedId(holders: Holders, own: string, key: string): string | null {
    const found = resolveKey(holders, own, key);
    return found !== null && 'id' in found ? found.id : null;
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

/**
 * The folder, relative to a hub, that holds the hub's collection files at oculus's default paths
 * (config/defaults/sources.yml), one subfolder per kind.
 */
export const DATA_FOLDER = '.oculus/data';

/** The one filename a scan tier's folder is read for. */
export const MANIFEST = 'project.yml';

/**
 * The tier a manifest's `tier` value names, one of `tiers` (the words of vocab.yml's `tiers:` in
 * the merged config), and undefined when it names none of them.
 */
export function tierOf(value: unknown, tiers: readonly string[]): string | undefined {
    return tiers.find((one) => one === value);
}

/** The folder of a repository that holds its project manifest. */
export const ROOT_FOLDER = '.oculus';

/** The folder of a hub that holds its workspace files, under `.oculus/`. */
export const WORKSPACES_FOLDER = 'workspaces';

/**
 * The hub's own settings file, `<hub>/.oculus/config.yml`: one map of the keys of HUB_LIST, read
 * after the engine's config. A folder that holds it is a hub.
 */
export const HUB_FILE = `${ROOT_FOLDER}/config.yml`;

/**
 * The configuration files a repository keeps in its `.oculus` folder, by the name Add Repository
 * Configuration... and its request call each, in the order its dialog lists them.
 */
export const REPOSITORY_FILES = [
    ['settings', `${ROOT_FOLDER}/settings.yml`],
    ['commands', `${ROOT_FOLDER}/commands.yml`],
    ['launch', `${ROOT_FOLDER}/launch.yml`],
    ['cpp', `${ROOT_FOLDER}/cpp.yml`]
] as const;

/** The machine's own file of a hub, which holds its secrets and stays out of git. */
export const LOCAL_FILE = `${ROOT_FOLDER}/local.yml`;

/**
 * The hub files Make Folder a Hub... may write besides `config.yml`, by the name its request and
 * its dialog give each choice, with the files each choice writes: `local.yml` with the
 * `.gitignore` that keeps it out of git, and `schedules.yml`.
 */
export const HUB_CHOICES = [
    ['local', [LOCAL_FILE, `${ROOT_FOLDER}/.gitignore`]],
    ['schedules', [`${ROOT_FOLDER}/schedules.yml`]]
] as const;

/**
 * What a folder holds that the make items of the Files view are offered by: `hub` a
 * `.oculus/config.yml`, `project` a project manifest (`.oculus/project.yml` or `project.yml`),
 * `home` that it is the home folder, `state` that it is the home folder's `.oculus`, oculus's own
 * state folder, or a folder under it, `git` a `.git` file or folder of its own, `inGit` that it
 * lies inside a `.git` folder, and `configured` that it holds all four repository configuration
 * files (REPOSITORY_FILES). The file server reads them (server/files/project/make.ts), and the page
 * holds them in its listings, so a menu knows what a folder offers as it opens.
 */
export type FolderMarks = {
    hub?: true;
    project?: true;
    home?: true;
    state?: true;
    git?: true;
    inGit?: true;
    configured?: true;
};

/**
 * Which of the four make items a folder offers: Make Folder a Hub..., Make Folder a Project, Make
 * Folder a Git Repository and Add Repository Configuration....
 */
export type MakeItems = { hub: boolean; project: boolean; git: boolean; repository: boolean };

/**
 * Which make items a folder offers, from its marks, whether a folder above it, up to the home
 * folder and not including it, holds a `.oculus/config.yml` (`above`), and whether it is a served
 * root (`root`). The home folder, the state folder and every folder under the state folder offer
 * none. Make Folder a Hub... is offered when neither the folder nor a folder above it is a hub and
 * it is no project, so a folder inside a hub is never made a hub of its own; Make Folder a Project
 * when it is no hub and no project, since a hub is never a project; Make Folder a Git Repository
 * when it has no `.git` of its own and lies inside no `.git` folder; Add Repository
 * Configuration... on a repository (a served root, or a folder holding `.git`) that lacks one of
 * the four configuration files.
 */
export function makeOffer(marks: FolderMarks, above: boolean, root: boolean): MakeItems {
    const closed = marks.home === true || marks.state === true;
    const made = closed || marks.project === true;
    return {
        hub: !made && !above && marks.hub !== true,
        project: !made && marks.hub !== true,
        git: !closed && marks.git !== true && marks.inGit !== true,
        repository: !closed && (root || marks.git === true) && marks.configured !== true
    };
}

/**
 * What a folder offers, read down a tree: the marks of the folder of the workspace it lies in and
 * whether a hub is above that folder (`above`), then the marks of each folder on the way down to
 * it, its own last; the folder of the workspace itself, with nothing below, is a served root. A
 * folder has a hub above it when the folder over it is a hub or has one above it, except below
 * the home folder, where the walk up stops.
 */
export function offerAlong(
    top: FolderMarks,
    above: boolean,
    below: readonly FolderMarks[]
): MakeItems {
    let marks = top;
    let over = above;
    for (const next of below) {
        over = marks.home !== true && (over || marks.hub === true);
        marks = next;
    }
    return makeOffer(marks, over, below.length === 0);
}

/**
 * The keys the hub's settings file may set, each with the name of oculus's config file it belongs
 * to (`sources.yml` for config/defaults/sources.yml, `catalogs/vocab.yml` for a catalog), which is
 * the group the Settings view draws it in. Each key is a dotted path into the hub file; a value the
 * file holds at one of these paths replaces oculus's value whole, and a key outside the list is a
 * finding and is not applied. They are the keys that describe this hub rather than the engine: its
 * folders and the files of its records, which of its records a chat's index holds, where the
 * reader's bookmarks, the schedules and the machine's apps are kept, the cluster its jobs run on,
 * the files its writing rules skip or let draw arrows, the conventions its audit holds its projects
 * to (`audit:`: the files and sections it requires, the folders a stage keeps a project in and its
 * website's feed), the values its apps' settings hold, the counts its tabs draw, its entry
 * statuses, project chips and Position Lead statuses, and its own words, which oculus ships none
 * of: the fit colours of its Position Leads. Its domains and theme words are its own registry
 * files'.
 */
const HUB_LIST: readonly { key: string; file: string }[] = [
    { key: 'scan', file: 'sources.yml' },
    { key: 'portfolio_deck', file: 'sources.yml' },
    { key: 'collections', file: 'sources.yml' },
    { key: 'chat_context', file: 'sources.yml' },
    { key: 'new_project_dir', file: 'sources.yml' },
    { key: 'linkedin_dir', file: 'sources.yml' },
    { key: 'career_file', file: 'sources.yml' },
    { key: 'memories_dir', file: 'sources.yml' },
    { key: 'wallpaper_dir', file: 'sources.yml' },
    { key: 'bookmarks', file: 'sources.yml' },
    { key: 'schedules', file: 'sources.yml' },
    { key: 'apps_dir', file: 'sources.yml' },
    { key: 'wallpaper.image', file: 'appearance.yml' },
    { key: 'docs', file: 'layout.yml' },
    { key: 'counts', file: 'layout.yml' },
    { key: 'statuses', file: 'catalogs/vocab.yml' },
    { key: 'chips', file: 'catalogs/vocab.yml' },
    { key: 'lead_statuses', file: 'catalogs/vocab.yml' },
    { key: 'leads_fit', file: 'catalogs/vocab.yml' },
    { key: 'slurm.resource', file: 'behavior.yml' },
    { key: 'lint.writing_skip', file: 'behavior.yml' },
    { key: 'lint.writing_glyphs', file: 'behavior.yml' },
    { key: 'audit.required_files', file: 'behavior.yml' },
    { key: 'audit.required_sections', file: 'behavior.yml' },
    { key: 'audit.stage_folders', file: 'behavior.yml' },
    { key: 'audit.website.file', file: 'behavior.yml' },
    { key: 'audit.website.list', file: 'behavior.yml' },
    { key: 'audit.website.title', file: 'behavior.yml' },
    { key: 'audit.website.kinds', file: 'behavior.yml' },
    { key: 'app_settings', file: 'behavior.yml' }
];

/**
 * The `wallpaper.image` value of a merged config as text, empty when it holds none: the image the
 * wallpaper route serves, and the key the page's wallpaper layer asks for it by.
 */
export function wallpaperValue(config: Record<string, unknown> | undefined): string {
    const block = config !== undefined && isMap(config.wallpaper) ? config.wallpaper : {};
    return typeof block.image === 'string' ? block.image.trim() : '';
}

/** Every dotted key the hub list names, in the list's order. */
export function hubKeys(): string[] {
    return HUB_LIST.map((one) => one.key);
}

/** The dotted keys the hub list binds to one config file, or undefined for a file with none. */
export function hubKeysOf(name: string): readonly string[] | undefined {
    const keys = HUB_LIST.filter((one) => one.file === name).map((one) => one.key);
    return keys.length === 0 ? undefined : keys;
}

/** The config file of the engine a key of the hub list belongs to, or undefined for another key. */
export function hubFileOf(key: string): string | undefined {
    return HUB_LIST.find((one) => one.key === key)?.file;
}

/** Whether a `from` value (see loadConfig) names the hub's settings file. */
export function fromHubFile(file: string): boolean {
    return file === HUB_FILE;
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
