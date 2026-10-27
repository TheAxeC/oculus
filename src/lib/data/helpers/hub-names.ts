// Layer 1, data. The names of the hub's files and folders that the readers of data/sources, the
// schema generator of data/snapshot, the file server and the page all hold: the manifest's file
// name, the five tier words and the folder of a repository that holds oculus's own files, how a
// record of the merged portfolio names the hub it was read from, how each registry file names its
// entry list (an entry's id is its file's primary key, read from the file's schema), the targets a
// `foreign_key:` names that are no collection, and which folders the project scan walks: the scan
// reader (data/sources/manifests.ts), the `new_project_dir` check
// (data/sources/config/settings/scan.ts) and the new project form
// (state/boards/board/new-project.ts) share those, so they agree on what is scanned.
//
// A workspace lists folders, and the ones that hold `.oculus/config.yml` are hubs. Every record of
// the merged portfolio, the primary hub's included, carries the name of its hub in `root` and has
// the internal id `<hub>:<key>`, the key being what its own hub's file names it by; a project of a
// workspace folder that is no hub, in a workspace with no primary, has the folder's name for its
// hub. A reference names a key, and resolves in its own hub first, then in the other hubs: one
// other hub holding the key gives that hub's record, and two or more give none, which the merge
// reports. The joined id is internal: a file, a form, a finding, a label and an address name a
// record by its hub and its key apart, and a page shows the key with the hub chip.

import { z } from 'zod';
import { byKey, isMap } from './guards.ts';
import { findingText, type TextCatalog } from './finding-text.ts';
import {
    COLLECTION_FLAGS,
    REGISTRY_WORDS,
    type Collection,
    type CollectionEntry,
    type CollectionFlag,
    type Finding,
    type HubVocabs,
    type Id,
    type RegistryName,
    type RegistryWord,
    type Rooted
} from '../model/index.ts';

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

// The registry words and the flags of a `collections:` entry live in the model, whose collection
// types name them, and are read here with the helpers that find a collection by them.
export { COLLECTION_FLAGS, REGISTRY_WORDS, type CollectionFlag, type RegistryWord };

/**
 * The flags that name one file of a hub, a write's target: on a second entry of one list the flag
 * is a finding and the first entry is the one read.
 */
const SINGLE_FLAGS = ['lead_applications', 'tasks'] as const;

/** Take a single flag off an entry that a second entry of its list carried. */
function dropFlag(entry: CollectionEntry, flag: (typeof SINGLE_FLAGS)[number]): void {
    if (flag === 'tasks') delete entry.tasks;
    else delete entry.lead_applications;
}

/**
 * The registries one of oculus's own views draws, by that view's id. Their entries get no card-list
 * view, and a plain collection keyed by one of those ids gets none either, since its view would
 * take the id oculus's view holds.
 */
export const REGISTRY_VIEWS: Partial<Record<RegistryWord, string>> = {
    datasets: 'data',
    venues: 'venues',
    pillars: 'pillars',
    domains: 'domains',
    leads: 'leads',
    radar: 'radar'
};

/**
 * The registry words that name a YAML feed's file, which is read as a feed and is no collection.
 */
export const FEED_REGISTRIES = ['leads', 'radar'] as const;

/** One feed a `collections:` entry names. */
export type FeedRegistry = (typeof FEED_REGISTRIES)[number];

/** Whether a `collections:` entry names a YAML feed's file. */
export function isFeedEntry(entry: Pick<CollectionEntry, 'registry'>): boolean {
    return (FEED_REGISTRIES as readonly string[]).includes(entry.registry ?? '');
}

/** Whether a `collections:` entry's key is the id of the view of one of oculus's registries. */
function takesRegistryView(key: string): boolean {
    return Object.values(REGISTRY_VIEWS).includes(key);
}

/**
 * Whether the collection of a `collections:` entry is drawn as a card list of its own: a registry
 * no view of oculus's draws, or a plain collection whose key no such view holds.
 */
export function hasCardList(entry: Pick<CollectionEntry, 'key' | 'registry'>): boolean {
    if (entry.registry !== undefined) return !Object.hasOwn(REGISTRY_VIEWS, entry.registry);
    return !takesRegistryView(entry.key);
}

/**
 * The keys of the entries of a list whose collection view a page places, by the entry's `group:`:
 * a pane leaves out the tab of such a key while no hub of the workspace lists it.
 */
export function placedKeys(list: readonly CollectionEntry[]): string[] {
    return list
        .filter((one) => one.group !== undefined && !isFeedEntry(one) && hasCardList(one))
        .map((one) => one.key);
}

/**
 * The collections given in the portfolio's order of the hubs, and each hub's in the order of its
 * own `collections:` list.
 */
function inListOrder(collections: readonly Collection[]): Collection[] {
    const hubs: string[] = [];
    for (const one of collections) if (!hubs.includes(rootOf(one))) hubs.push(rootOf(one));
    return [...collections].sort(
        (one, two) =>
            hubs.indexOf(rootOf(one)) - hubs.indexOf(rootOf(two)) ||
            (one.index ?? 0) - (two.index ?? 0)
    );
}

/**
 * The collections of every hub whose entry carries the flag, the hubs in the portfolio's order and
 * each hub's in its list's order; none when no hub flags one.
 */
export function flaggedCollections(
    collections: Record<Id, Collection>,
    flag: CollectionFlag
): Collection[] {
    return inListOrder(Object.values(collections).filter((one) => one[flag] === true));
}

/** The entries of every collection carrying the flag, joined in `flaggedCollections`' order. */
export function flaggedEntries(
    collections: Record<Id, Collection>,
    flag: CollectionFlag
): Collection['entries'] {
    return flaggedCollections(collections, flag).flatMap((one) => one.entries);
}

/** The collection of every hub whose entry names the registry, in the portfolio's order. */
export function registryCollections(
    collections: Record<Id, Collection>,
    registry: RegistryWord
): Collection[] {
    return inListOrder(Object.values(collections).filter((one) => one.registry === registry));
}

/** The entries of the registry's collection of every hub, joined in the portfolio's order. */
export function registryEntries(
    collections: Record<Id, Collection>,
    registry: RegistryWord
): Collection['entries'] {
    return registryCollections(collections, registry).flatMap((one) => one.entries);
}

/** The registry's collection of the hub named `hub`, or undefined when that hub holds none. */
export function registryCollection(
    collections: Record<Id, Collection>,
    registry: RegistryWord,
    hub: string
): Collection | undefined {
    return registryCollections(collections, registry).find((one) => rootOf(one) === hub);
}

/**
 * The entry the hub named `hub` reads a registry by: its own list's entry of it, else oculus's own
 * entry of it, which names the file such a hub reads; undefined when neither list names the
 * registry.
 */
export function registryEntryOf(
    hubs: Pick<HubVocabs, 'lists' | 'ownCollections'> | null,
    hub: string,
    registry: RegistryWord
): CollectionEntry | undefined {
    const named = (one: CollectionEntry): boolean => one.registry === registry;
    const own = byKey(hubs?.lists ?? {}, hub)?.collections.find(named);
    return own ?? hubs?.ownCollections.find(named);
}

/**
 * The key the hub named `hub` gives a registry: the key of the entry it reads the registry by
 * (`registryEntryOf`); undefined when neither its list nor oculus's names the registry.
 */
export function registryKeyOf(
    hubs: Pick<HubVocabs, 'lists' | 'ownCollections'> | null,
    hub: string,
    registry: RegistryWord
): string | undefined {
    return registryEntryOf(hubs, hub, registry)?.key;
}

/** One entry of the `collections:` list as written: a key and a file, both texts, and the rest. */
const entryShape = z.looseObject({ key: z.string(), file: z.string() });

/** A condition of the `When` shape: each field a value or a list of values. */
const whenShape = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

/** A `ticker:` field: the category its lines carry, and whether an undated entry is a task. */
const tickerShape = z.strictObject({
    category: z.string().min(1),
    undated: z.boolean().optional()
});

/** A text with something in it. */
const wordShape = z.string().min(1);

/** A whole number. */
const orderShape = z.number().int();

/** What a shape makes of a value, or null when it refuses it. */
function parsed<T>(shape: z.ZodType<T>, value: unknown): T | null {
    const read = shape.safeParse(value);
    return read.success ? read.data : null;
}

/**
 * The words the fields of a list are checked against: the flat text catalog, the words of
 * `ticker_categories` and the ids of the view catalogue's groups (a rail page or a `nav_groups`
 * key).
 */
export type ListWords = {
    text: Readonly<Record<string, string>>;
    categories: readonly string[];
    groups: readonly string[];
};

/**
 * What is wrong with one field of one entry of a list: the entry's position, the field, and the
 * finding word of findings.yml with the values it names.
 */
export type ListProblem = { index: number; field: string; word: string; values: string[] };

/**
 * A list as its entries with the fields that read, the problems of those that do not, and the
 * problems of the entries whose card-list view a view of oculus's modules holds the key of.
 */
type ReadList = { entries: CollectionEntry[]; problems: ListProblem[]; taken: ListProblem[] };

/** Whether a value is one of the registry words. */
function isRegistryWord(value: unknown): value is RegistryWord {
    return (REGISTRY_WORDS as readonly unknown[]).includes(value);
}

/**
 * One entry with the fields that read. A field of the wrong kind (a flag that is not true, an
 * order that is no whole number) is left out here, and the options catalog's check of the list
 * words it; an unknown registry word, a `ticker:` or a `dissemination_skip:` that does not read,
 * and, when `words` is given, a word the catalog, the categories or the groups do not hold, is
 * left out with a problem.
 */
function entryOf(
    raw: z.infer<typeof entryShape>,
    index: number,
    words: ListWords | undefined,
    problems: ListProblem[]
): CollectionEntry {
    const entry: CollectionEntry = { key: raw.key, file: raw.file };
    const problem = (field: string, word: string, value: string): void => {
        problems.push({ index, field, word, values: [value] });
    };
    if (raw.registry !== undefined) {
        const named = raw.registry;
        if (isRegistryWord(named)) entry.registry = named;
        else {
            const shown = typeof named === 'string' ? named : JSON.stringify(named);
            problem('registry', 'findings.collections.registry_unknown', shown);
        }
    }
    for (const flag of COLLECTION_FLAGS) if (raw[flag] === true) entry[flag] = true;
    const unread = (field: string, word: string, value: unknown): void => {
        problems.push({ index, field, word, values: [JSON.stringify(value), raw.key] });
    };
    if (raw.dissemination_skip !== undefined) {
        const skip = parsed(whenShape, raw.dissemination_skip);
        if (skip !== null) entry.dissemination_skip = skip;
        else
            unread(
                'dissemination_skip',
                'findings.collections.skip_unread',
                raw.dissemination_skip
            );
    }
    if (raw.ticker !== undefined) {
        const ticker = parsed(tickerShape, raw.ticker);
        if (ticker === null) unread('ticker', 'findings.collections.ticker_unread', raw.ticker);
        else if (words === undefined || words.categories.includes(ticker.category)) {
            entry.ticker = { category: ticker.category };
            if (ticker.undated === true) entry.ticker.undated = true;
        } else problem('ticker.category', 'findings.collections.category_unknown', ticker.category);
    }
    const group = parsed(wordShape, raw.group);
    if (group !== null) {
        if (words === undefined || words.groups.includes(group)) entry.group = group;
        else problem('group', 'findings.collections.group_unknown', group);
    }
    const order = parsed(orderShape, raw.order);
    if (order !== null) entry.order = order;
    const primaryKey = parsed(wordShape, raw.primary_key);
    if (primaryKey !== null) entry.primary_key = primaryKey;
    for (const field of ['label', 'glyph', 'about'] as const) {
        const key = parsed(wordShape, raw[field]);
        if (key === null) continue;
        if (words === undefined || Object.hasOwn(words.text, key)) entry[field] = key;
        else problem(field, 'findings.collections.word_unknown', key);
    }
    return entry;
}

/** The `foreign_key:` target that names the project manifests, which no collection takes. */
export const PROJECTS_TARGET = 'projects';

/** The prefix of a `foreign_key:` target that names a list of config/catalogs/vocab.yml. */
export const VOCAB_PREFIX = 'vocab.';

/**
 * Whether a key is a `foreign_key:` target with a meaning of its own: `projects`, or a vocabulary
 * list. A collection keyed so is a problem of its list, and a foreign key naming the key names the
 * manifests or the list.
 */
export function reservedTarget(key: string): boolean {
    return key === PROJECTS_TARGET || key.startsWith(VOCAB_PREFIX);
}

/**
 * A `collections:` list as its entries. A registry word an earlier entry already names, and a flag
 * of `SINGLE_FLAGS` an earlier entry already carries, is left off the later entry, the first being
 * the one read; a plain collection keyed by the id of the view of one of oculus's registries, and a
 * collection keyed by a reserved `foreign_key:` target (`reservedTarget`), is kept, and is a
 * problem, since the one gets no card-list view and the other's key names the manifests or a list;
 * so is, in `taken`, an entry drawn as a card list under a key `views` holds. Anything that is no
 * list names no entry, and an item with no text key or file is none.
 */
function readList(value: unknown, words?: ListWords, views?: ReadonlySet<string>): ReadList {
    const entries: CollectionEntry[] = [];
    const problems: ListProblem[] = [];
    const taken: ListProblem[] = [];
    // The key of the first entry that names each registry word, and that carries each single flag.
    const registries = new Map<string, string>();
    const flags = new Map<string, string>();
    (Array.isArray(value) ? value : []).forEach((item: unknown, index) => {
        const raw = parsed(entryShape, item);
        if (raw === null) return;
        const entry = entryOf(raw, index, words, problems);
        const registry = entry.registry;
        if (registry !== undefined) {
            const first = registries.get(registry);
            if (first === undefined) registries.set(registry, entry.key);
            else {
                delete entry.registry;
                problems.push({
                    index,
                    field: 'registry',
                    word: 'findings.collections.registry_twice',
                    values: [registry, first]
                });
            }
        }
        for (const flag of SINGLE_FLAGS) {
            if (entry[flag] !== true) continue;
            const first = flags.get(flag);
            if (first === undefined) flags.set(flag, entry.key);
            else {
                dropFlag(entry, flag);
                problems.push({
                    index,
                    field: flag,
                    word: 'findings.collections.flag_twice',
                    values: [flag, first]
                });
            }
        }
        if (reservedTarget(entry.key)) {
            problems.push({
                index,
                field: 'key',
                word: 'findings.collections.reserved_key',
                values: [entry.key]
            });
        }
        const viewId = {
            index,
            field: 'key',
            word: 'findings.collections.view_id',
            values: [entry.key]
        };
        if (entry.registry === undefined && takesRegistryView(entry.key)) problems.push(viewId);
        else if (views?.has(entry.key) === true && hasCardList(entry)) taken.push(viewId);
        entries.push(entry);
    });
    return { entries, problems, taken };
}

/**
 * The problems of the entries of a `collections:` list that would be drawn as a card list
 * (`hasCardList`) under a key in `views`, the ids of the views oculus's modules register: such an
 * entry gets no view, as a plain collection keyed by the view of one of oculus's registries gets
 * none. Only the page knows those ids (routes/views.ts `moduleViewIds`), so it reads these and
 * the server reads the rest (`listProblems`).
 */
export function viewIdProblems(value: unknown, views: ReadonlySet<string>): ListProblem[] {
    return readList(value, undefined, views).taken;
}

/**
 * The problems of a `collections:` list as findings on `file`, each at its entry's field and
 * worded from the catalog.
 */
export function listFindings(
    problems: readonly ListProblem[],
    file: string,
    catalog: TextCatalog
): Finding[] {
    return problems.map((one) => ({
        file,
        key: `collections[${String(one.index)}].${one.field}`,
        message: findingText(catalog, one.word, ...one.values)
    }));
}

/**
 * A `collections:` list as its entries, each with the fields that read (`readList`); with `words`,
 * a word the catalog, the categories or the groups do not hold is left out.
 */
export function collectionFiles(value: unknown, words?: ListWords): CollectionEntry[] {
    return readList(value, words).entries;
}

/**
 * The primary key the `collections:` entry of the YAML feed `feed` names (`primary_key:`) in the
 * merged config's list `value`, which the feed's file is keyed by when it has no schema;
 * undefined when the list names none.
 */
export function feedPrimaryKey(value: unknown, feed: 'leads' | 'radar'): string | undefined {
    return collectionFiles(value).find((one) => one.registry === feed)?.primary_key;
}

/**
 * The problems of a `collections:` list: an unknown registry word, a `ticker:` or a
 * `dissemination_skip:` that does not read, a registry or a single flag an earlier entry already
 * has, a group, a label, glyph or about, or a ticker category `words` does not hold, and a plain
 * collection keyed by the id of the view of one of oculus's registries.
 */
export function listProblems(value: unknown, words: ListWords): ListProblem[] {
    return readList(value, words).problems;
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
 * The one key of the machine's own file a Settings write sets: the user's key, which names the
 * user's own person. The server places the write by it and the Settings view draws its row apart.
 */
export const USER_KEY = 'self';

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
 * the group the Settings view draws it in and the options file under config/options/ that describes
 * it. Each key is a dotted path into the hub file, and a key outside the list is a finding and is
 * not applied. A key of config/catalogs/vocab.yml is laid over oculus's value by its shape
 * (data/sources/config/merge/in-place.ts): a map by its words in oculus's place, `categories` by
 * its rows' `key`, `focus_clusters`, `focus_lanes`, `fund_stages`, `roles`, `venue_categories`,
 * `venue_tiers` and `radar_buckets` whole, and `rail_color` as a colour written `#rrggbb`;
 * `manifest_fields`, the fields the hub adds to the project form, is read row by row; every other
 * key replaces oculus's value whole. They are the keys that describe this hub rather than the
 * engine: its folders and the files of its records, which of its records a chat's index holds,
 * where the reader's bookmarks, the schedules and the machine's apps are kept, the cluster its jobs
 * run on, the files its writing rules skip or let draw arrows, the conventions its audit holds its
 * projects to (`audit:`: the files and sections it requires, the folders a stage keeps a project in
 * and its website's feed), the values its apps' settings hold, the counts its tabs draw, its
 * vocabulary (every list of vocab.yml) and the fields it adds to the project form. Its domains and
 * theme words are its own registry files'.
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
    { key: 'palette', file: 'catalogs/vocab.yml' },
    { key: 'stages', file: 'catalogs/vocab.yml' },
    { key: 'forms', file: 'catalogs/vocab.yml' },
    { key: 'chips', file: 'catalogs/vocab.yml' },
    { key: 'statuses', file: 'catalogs/vocab.yml' },
    { key: 'lead_statuses', file: 'catalogs/vocab.yml' },
    { key: 'focus_clusters', file: 'catalogs/vocab.yml' },
    { key: 'focus_lanes', file: 'catalogs/vocab.yml' },
    { key: 'fund_stages', file: 'catalogs/vocab.yml' },
    { key: 'focus_lane_tones', file: 'catalogs/vocab.yml' },
    { key: 'facet_tones', file: 'catalogs/vocab.yml' },
    { key: 'tiers', file: 'catalogs/vocab.yml' },
    { key: 'research_audit', file: 'catalogs/vocab.yml' },
    { key: 'roles', file: 'catalogs/vocab.yml' },
    { key: 'categories', file: 'catalogs/vocab.yml' },
    { key: 'rail_color', file: 'catalogs/vocab.yml' },
    { key: 'leads_fit', file: 'catalogs/vocab.yml' },
    { key: 'data_access', file: 'catalogs/vocab.yml' },
    { key: 'venue_categories', file: 'catalogs/vocab.yml' },
    { key: 'venue_tiers', file: 'catalogs/vocab.yml' },
    { key: 'radar_buckets', file: 'catalogs/vocab.yml' },
    { key: 'ticker_categories', file: 'catalogs/vocab.yml' },
    { key: 'manifest_fields', file: 'schemas/manifest-schema.yml' },
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
 * How each registry's file names its entry list, and whether an entry without a value of the
 * file's primary key is a finding (`idRequired`), whatever the schema marks. The field an entry is
 * keyed by is the file's primary key (`primaryKeyOf` of data/model), not a column of this table.
 */
export const REGISTRY_SHAPES: Record<RegistryName, { list: string; idRequired: boolean }> = {
    venues: { list: 'entries', idRequired: true },
    datasets: { list: 'datasets', idRequired: true },
    pillars: { list: 'entries', idRequired: true },
    domains: { list: 'entries', idRequired: true },
    funding: { list: 'entries', idRequired: true },
    people: { list: 'entries', idRequired: true },
    organisations: { list: 'entries', idRequired: true },
    resources: { list: 'entries', idRequired: true }
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
