// Layer 1, data. The entry point: read, validate, normalise, and nothing else. Composition only, so
// the order of the three steps is the whole content of this file and every rule lives in the module
// it belongs to. Each hub is read (`readHub`) and built on its own (`builtHub`), and
// server/root/watch/build.ts builds the hubs of a workspace as one portfolio from those steps and
// the merge of snapshot/hubs/merge.ts.
//
// Server side only, because the sources read the filesystem. What comes back is JSON-safe and is
// what the socket carries; the caller owns the version number and increments it on every rebuild.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { focusBlock, isMap, str, strings } from './helpers/guards.ts';
import { MEMORIES_DIR, WALLPAPER_DIR } from './helpers/files/paths.ts';
import { filledTextShape, mapShape, readAs, readOr, rowsShape } from './shapes/shapes.ts';
import {
    MANIFEST_FIELDS_KEY,
    coloredWords,
    vocabKeys,
    withManifestFields,
    wordsWith
} from './shapes/vocab-keys.ts';
import { manifestDir, readHubManifests } from './sources/manifests.ts';
import { REGISTRY_LIST_KEYS, readRegistries, registryFiles } from './sources/registries.ts';
import {
    LITERATURE_KEY,
    collectionFiles,
    engineDefaults,
    readCollections,
    unnamedCollection,
    type EngineDefaults
} from './sources/collections.ts';
import { readCareer } from './sources/documents/career.ts';
import { readFeeds } from './sources/documents/feeds.ts';
import { projectDocs } from './sources/documents/docs.ts';
import type { TextCatalog } from './helpers/finding-text.ts';
import { DATA_FOLDER, HUB_FILE, fromHubFile, tierOf } from './helpers/hub-names.ts';
import { createReader } from './sources/deck/read.ts';
import type { DeckProject } from './sources/deck/kinds.ts';
import { textCatalog, type loadConfig } from './sources/config.ts';
import { VOCAB_SHAPES } from './sources/config/merge/in-place.ts';
import { readYamlMap } from './sources/yaml-file.ts';
import {
    newProjectDirs,
    pictureFolderFindings,
    scanFindings,
    scanRules
} from './sources/config/settings/scan.ts';
import { fieldsOf } from './snapshot/schema/field.ts';
import {
    FEED_COLLECTION_KEYS,
    isFeedCollection,
    normalise,
    selfKey
} from './snapshot/normalise.ts';
import { sortFindings, validate, withoutValidated } from './snapshot/validate.ts';
import type { Checker } from './snapshot/schema/check.ts';
import { REGISTRIES, unreadSources } from './snapshot/schema/lists.ts';
import { listedFields } from './snapshot/schema/manifest.ts';
import { runSchemas } from './snapshot/schema/run.ts';
import {
    emptySchemaSet,
    resolvedSchemas,
    withSchemas,
    type EngineConfigAt,
    type SchemaSet
} from './snapshot/schema/set.ts';
import { engineSchemas } from './sources/config/catalog/schemas/engine.ts';
import { catalogOf } from './sources/config/catalog/options.ts';
import { optionFiles, settingsNode } from './sources/config/catalog/schemas/references.ts';
import { DECK_FILE } from './sources/deck/read.ts';
import {
    buildReferences,
    type EngineConfigFolder,
    type SettingsFile
} from './snapshot/references/build.ts';
import type { ReferenceIndex } from './snapshot/references/model.ts';
import { domainColorOf, optionKeys, optionLabel } from './model/index.ts';
import type {
    CollectionFile,
    DocPresence,
    FeedFiles,
    Finding,
    HubVocab,
    HubVocabs,
    Id,
    PortfolioConfig,
    RawDeck,
    RawManifest,
    RawPortfolio,
    RegistryName,
    RepositoryRoot,
    Snapshot,
    Vocabulary
} from './model/index.ts';

/**
 * The sources files the values of `scan:`, `new_project_dir:` and the picture folders came from.
 */
export type SourcesFiles = {
    scan: string;
    newProjectDir: string;
    memoriesDir: string;
    wallpaperDir: string;
};

/**
 * What is wrong with the values `scan:`, `new_project_dir:`, `wallpaper_dir:` and `memories_dir:`
 * hold in a merged config of the hub folder `hub`, each finding filed on the sources file its value
 * was read from.
 */
export function sourcesFindings(
    merged: Record<string, unknown>,
    files: SourcesFiles,
    hub: string
): Finding[] {
    const text = textCatalog(merged);
    const scan = scanRules(merged.scan);
    return [
        ...scanFindings(merged.scan, files.scan, text),
        ...newProjectDirs(
            merged.new_project_dir,
            scan,
            vocabKeys(merged.tiers),
            files.newProjectDir,
            text
        ).findings,
        ...pictureFolderFindings(
            merged,
            hub,
            'wallpaper_dir',
            WALLPAPER_DIR,
            files.wallpaperDir,
            text
        ),
        ...pictureFolderFindings(merged, hub, 'memories_dir', MEMORIES_DIR, files.memoriesDir, text)
    ];
}

/** A key of the `collections:` list that names a YAML feed's file. */
type FeedKey = (typeof FEED_COLLECTION_KEYS)[number];

/** The `tag_tones` of the engine's `defaults:`, each class with the hue name it wears. */
function tagTones(defaults: unknown): Record<string, string> {
    const held = isMap(defaults) && isMap(defaults.tag_tones) ? defaults.tag_tones : {};
    return Object.fromEntries(
        Object.entries(held).flatMap(([name, tone]) =>
            typeof tone === 'string' && tone !== '' ? [[name, tone]] : []
        )
    );
}

/** A config path: the text the key holds. */
const pathShape = z.string();

/**
 * The portfolio's half of the merged config. The `collections:` list gives the eight registry
 * paths, each registry being the first entry of the list under its fixed key
 * (`REGISTRY_LIST_KEYS`), and the two YAML feeds' paths, under the keys `leads` and `radar`, which
 * are no collection. A registry, feed or career file the merged config does not name is read from
 * oculus's own path in config/defaults/sources.yml (`engineDefaults`, read only then), so a config
 * that leaves one of them out builds. The text catalog travels with it, since every reader
 * words its findings from config/text/findings.yml.
 */
export function portfolioConfigFrom(
    merged: Record<string, unknown>,
    from?: Readonly<Partial<Record<string, string>>>
): PortfolioConfig {
    const path = (key: string, fallback: string): string =>
        readOr(pathShape, merged[key], fallback);
    const listed = collectionFiles(merged.collections);
    const unnamed = from === undefined ? undefined : unnamedBy(from, listed);
    let engine: EngineDefaults | undefined;
    const defaults = (): EngineDefaults => (engine ??= engineDefaults());
    const engineFile = (key: string): CollectionFile[] =>
        defaults()
            .collections.filter((file) => file.key === key)
            .slice(0, 1);
    const collections = [
        ...listed.filter((file) => !isFeedCollection(file.key)),
        ...(unnamed?.literature === true ? engineFile(LITERATURE_KEY) : [])
    ];
    const registries = registryFiles(collections, () => defaults().collections);
    const feedFile = (key: FeedKey): string =>
        listed.find((file) => file.key === key)?.file ?? engineFile(key).at(0)?.file ?? '';

    const vocab: Vocabulary = {
        statuses: coloredWords(merged.statuses),
        acknowledged: wordsWith(merged, 'statuses', 'acknowledged'),
        stages: vocabKeys(merged.stages),
        forms: vocabKeys(merged.forms)
    };

    // The LinkedIn folder is the hub's own, so a config that names none has no LinkedIn feed.
    const feeds: FeedFiles = {
        leads: feedFile('leads'),
        radar: feedFile('radar'),
        linkedin: path('linkedin_dir', '')
    };

    const scan = scanRules(merged.scan);
    const text = textCatalog(merged);
    return {
        scan,
        repositories: [],
        ...(unnamed === undefined ? {} : { unnamed }),
        newProjectDir: newProjectDirs(
            merged.new_project_dir,
            scan,
            vocabKeys(merged.tiers),
            '',
            text
        ).dirs,
        registries,
        collections,
        feeds,
        linkedinCadenceDays: Number(focusBlock(merged).linkedin_cadence_days),
        career: readAs(pathShape, merged.career_file) ?? defaults().career,
        schema: withManifestFields(merged.manifest_schema, merged[MANIFEST_FIELDS_KEY]),
        vocab,
        merged,
        portfolioDeck: readAs(filledTextShape, merged.portfolio_deck) ?? null,
        tagTones: tagTones(merged.defaults),
        text
    };
}

/** Whether the hub's own settings file holds a key, by the `from` that loadConfig returned. */
function named(from: Readonly<Partial<Record<string, string>>>, key: string): boolean {
    const file = from[key];
    return file !== undefined && fromHubFile(file);
}

/**
 * What the hub's own settings file leaves to the engine's defaults, see `PortfolioConfig.unnamed`.
 * A registry is named when the hub's `collections:` list holds its key.
 */
function unnamedBy(
    from: Readonly<Partial<Record<string, string>>>,
    collections: readonly CollectionFile[]
): NonNullable<PortfolioConfig['unnamed']> {
    const listed = named(from, 'collections');
    const registries = (Object.keys(REGISTRY_LIST_KEYS) as RegistryName[]).filter(
        (name) => !listed || !collections.some((file) => file.key === REGISTRY_LIST_KEYS[name])
    );
    const feeds = FEED_COLLECTION_KEYS.filter(
        (key) => !listed || !collections.some((file) => file.key === key)
    );
    const literature = listed && !collections.some((file) => file.key === LITERATURE_KEY);
    return {
        registries,
        feeds,
        collections: !listed,
        literature,
        deck: !named(from, 'portfolio_deck')
    };
}

/**
 * What a hub leaves unnamed, read against its folder `hub`: a hub that names no `collections:`
 * list and holds the `.oculus/data/` folder keeps its collection files at oculus's paths there, so
 * every registry, feed and collection of the list counts as named and a missing file of it is a
 * finding, as it is for a hub that names its list.
 */
function heldUnnamed(hub: string, unnamed: PortfolioConfig['unnamed']): PortfolioConfig['unnamed'] {
    if (unnamed?.collections !== true || !existsSync(join(hub, DATA_FOLDER))) return unnamed;
    return { ...unnamed, registries: [], feeds: [], collections: false };
}

/**
 * Which of the fixed documents each project folder holds, by project id. It is existence only, four
 * `stat` calls per folder, so it runs on every rebuild beside the manifests themselves.
 */
function documents(hub: string, manifests: RawManifest[]): Record<Id, DocPresence[]> {
    const found: Record<Id, DocPresence[]> = {};
    for (const manifest of manifests) found[manifest.id] = projectDocs(manifestDir(hub, manifest));
    return found;
}

/** What the deck reader needs to know of each project: where it is and what it is called. */
function deckProjects(manifests: RawManifest[], tiers: readonly string[]): DeckProject[] {
    return manifests.map((manifest) => {
        const status = isMap(manifest.status) ? manifest.status : {};
        const project: DeckProject = {
            id: manifest.id,
            file: manifest.file,
            folder: manifest.folder,
            chips: strings(status.chips),
            short: str(manifest.short) ?? '',
            title: str(manifest.title) ?? manifest.id
        };
        if (manifest.workspaceFolder !== undefined)
            project.workspaceFolder = manifest.workspaceFolder;
        const tier = tierOf(manifest.tier, tiers);
        if (tier !== undefined) project.tier = tier;
        const stage = str(manifest.stage);
        if (stage !== undefined) project.stage = stage;
        const form = str(manifest.form);
        if (form !== undefined) project.form = form;
        const domain = str(manifest.domain);
        if (domain !== undefined && domain !== '') project.domain = domain;
        return project;
    });
}

/**
 * The portfolio deck and every project deck read, with what was wrong in them. `domains` are the
 * keys of the hub's domains registry, which a project's `domain:` is checked against.
 */
function decks(
    hub: string,
    name: string,
    manifests: RawManifest[],
    config: PortfolioConfig,
    domains: string[]
): { decks: Record<Id, RawDeck>; findings: Finding[] } {
    const root = { key: name, dir: hub };
    const reader = createReader({
        hub: root,
        projects: deckProjects(manifests, vocabKeys(config.merged.tiers)),
        domains,
        tagTones: config.tagTones,
        catalog: config.text
    });
    const found: Record<Id, RawDeck> = {};
    for (const one of reader.projectDecks()) found[one.id] = { path: one.path, tags: one.tags };
    if (config.portfolioDeck !== null) {
        const deck = join(hub, config.portfolioDeck);
        if (!(config.unnamed?.deck === true && !existsSync(deck))) {
            reader.read(root, config.portfolioDeck);
        }
    }
    return { decks: found, findings: reader.findings() };
}

/**
 * The snapshot of one build, the schemas it was checked against and the index of the hub keys it
 * names and defines, for the editor.
 */
export type PortfolioBuild = { snapshot: Snapshot; schemas: SchemaSet; references: ReferenceIndex };

/**
 * Where oculus's own config folder lies in the workspace: the folder on disk, and the workspace
 * folders that hold it, each with the path of the config folder inside it. The first of them names
 * the config files in the reference index and every one of them governs them by schema.
 */
export type EngineConfigIn = { dir: string; held: readonly EngineConfigAt[] };

/** The reference index's view of it: the first folder that holds the config folder, or null. */
function configFolder(engine: EngineConfigIn | null): EngineConfigFolder | null {
    const first = engine?.held.at(0);
    return engine === null || first === undefined ? null : { dir: engine.dir, ...first };
}

/**
 * One hub as its files were read, before any check: its folder, its name, settings and records.
 */
type HubRead = { hub: string; root: string; config: PortfolioConfig; raw: RawPortfolio };

/**
 * Read the hub at `hub` under the name `root`, the name of the workspace folder its files are named
 * under: its manifests, registries, collections, feeds, career, documents and decks, with the
 * findings of their readers. `roots` are the directories whose `project.yml` or
 * `.oculus/project.yml` is read, as handed, each a project of the hub (`readHubManifests`);
 * `repositoriesOf` of server/files/roots.ts decides which roots of the file browser they are.
 */
export function readHub(
    hub: string,
    config: PortfolioConfig,
    roots: RepositoryRoot[],
    root: string
): HubRead {
    const manifests = readHubManifests(hub, config.scan, roots, config.text);
    const unnamed = heldUnnamed(hub, config.unnamed);
    const registries = readRegistries(hub, config.registries, config.text, unnamed?.registries);
    // The engine's Literature, which the hub's list does not name, is read once the hub holds it.
    const read = config.collections.filter(
        (file) =>
            file.key !== LITERATURE_KEY ||
            unnamed?.literature !== true ||
            existsSync(join(hub, file.file))
    );
    const collections = readCollections(hub, read, config.text, (key) =>
        unnamedCollection(unnamed, key)
    );
    const feeds = readFeeds(hub, config.feeds, config.text, config.merged, unnamed?.feeds);
    const career =
        config.career === null
            ? { career: null, findings: [] }
            : readCareer(hub, config.career, config.text);
    const domainKeys = registries.domains.entries.map((entry) => entry.key);
    const deck = decks(hub, root, manifests.manifests, config, domainKeys);
    const raw: RawPortfolio = {
        manifests: manifests.manifests,
        registries,
        collections: collections.collections,
        feeds: feeds.feeds,
        career: career.career,
        docs: documents(hub, manifests.manifests),
        decks: deck.decks,
        findings: [
            ...manifests.findings,
            ...registries.findings,
            ...collections.findings,
            ...feeds.findings,
            ...career.findings,
            ...deck.findings
        ]
    };
    return { hub, root, config, raw };
}

/** What a hub's build takes besides the hub as read. */
type BuildOptions = {
    /** The version number of the snapshot, which the caller increments on every rebuild. */
    version: number;
    /**
     * The compiled validators, kept from one build to the next, so a rebuild whose schemas did not
     * change compiles nothing.
     */
    checker: Checker;
    /**
     * Oculus's own config folder and the workspace folders that hold it, whose files that carry a
     * reference are indexed beside the hub's and governed by schema where the workspace holds them;
     * none when it is null.
     */
    engine: EngineConfigIn | null;
    /**
     * The open workspace file, whose `settings:` the index reads for the keys they name; none for
     * the unsaved workspace and for a hub other than the primary.
     */
    workspace: SettingsFile | null;
    /** The keys the other hubs of the workspace hold, by source. */
    others: Readonly<Record<string, readonly string[]>>;
};

/**
 * The build of a hub as read: what is wrong with it, from validate and the schemas, the reference
 * index over its files and the snapshot normalise turns it into, the wire model with the findings
 * carried inside it and its records under the keys its files give them, which the merge of the hubs
 * of a workspace (`buildHubs` of server/root/watch/build.ts) gives their ids. A reference to a key
 * `others` holds is kept for the merge.
 */
export function builtHub(read: HubRead, options: BuildOptions): PortfolioBuild {
    const { hub, root, config, raw } = read;
    const { engine } = options;
    const unread = unreadSources(raw, hub, config.registries);
    const run = runSchemas(hub, config, raw, options.checker, unread, options.others);
    const findings = sortFindings([
        ...validate(raw, {
            vocab: config.vocab,
            listed: listedFields(config.schema, unread),
            text: config.text,
            self: {
                key: selfKey(config.merged),
                file: join(hub, config.registries.people),
                read: !unread.has('people')
            }
        }),
        ...withoutValidated(run.findings, raw, config.vocab)
    ]);
    const catalog = catalogOf(config.merged);
    const references = buildReferences({
        hub,
        root,
        config,
        engine: configFolder(engine),
        read: run.read,
        manifests: raw.manifests,
        decks: raw.decks,
        options: optionFiles(catalog),
        workspace: options.workspace,
        settings: settingsNode(catalog),
        deckFile: DECK_FILE
    });
    return {
        snapshot: normalise(raw, findings, config.merged, options.version, options.others),
        schemas: resolvedSchemas(
            withSchemas(run.set, engineSchemas(raw, config)),
            root,
            engine?.held ?? []
        ),
        references
    };
}

/**
 * The projects of the workspace folders that are no hub, in a workspace with no primary hub, read
 * as one portfolio with no registry, collection, feed or career. Its build has the schemas of
 * oculus's own config folder where the workspace holds it and checks nothing a hub's files are
 * checked for, since there are none; a reference to a key `others` holds is kept for the merge of
 * the hubs.
 */
export function readFolders(config: PortfolioConfig): RawPortfolio {
    const manifests = readHubManifests('', [], config.repositories, config.text);
    const registries = Object.fromEntries(
        REGISTRIES.map((name) => [name, { entries: [], meta: {} }])
    ) as unknown as RawPortfolio['registries'];
    return {
        manifests: manifests.manifests,
        registries,
        collections: {},
        feeds: { leads: null, radar: null, scout: null, linkedin: null },
        career: null,
        docs: documents('', manifests.manifests),
        decks: {},
        findings: manifests.findings
    };
}

/** The build of the project folders as `readFolders` read them. */
export function buildFolderProjects(
    raw: RawPortfolio,
    config: PortfolioConfig,
    options: Omit<BuildOptions, 'checker' | 'workspace'>
): PortfolioBuild {
    const findings = sortFindings(raw.findings);
    return {
        snapshot: normalise(raw, findings, config.merged, options.version, options.others),
        schemas: resolvedSchemas(
            withSchemas(emptySchemaSet(), engineSchemas(raw, config)),
            '',
            options.engine?.held ?? []
        ),
        references: { files: [] }
    };
}

/** A hub other than the primary as the build needs it: its key and where it is. */
export type HubRoot = { key: string; dir: string };

/**
 * The parse of the engine's config folder under the settings file of the hub at `dir`, as
 * `loadConfig(engine, { hub: dir })` gives it. The server answers it from the parse it keeps for
 * that hub (server/root/process/config-cache.ts), so a reader of another hub's settings is handed
 * this function and never parses the folder itself.
 */
export type HubSettings = (dir: string) => ReturnType<typeof loadConfig>;

/**
 * A hub other than the primary, read with its own settings: the engine's defaults under the hub's
 * own `.oculus/config.yml`. Its career and its portfolio deck are the primary hub's alone, so they
 * are not read, and the findings of its settings file ride along for the caller to report.
 */
export type OtherHub = HubRoot & {
    portfolio: PortfolioConfig;
    findings: Finding[];
    vocab: HubVocab;
};

/** The settings of a hub other than the primary, from the parse `loaded` of its settings. */
export function readOtherHub(root: HubRoot, loaded: ReturnType<typeof loadConfig>): OtherHub {
    const { config, findings, from } = loaded;
    const portfolio = { ...portfolioConfigFrom(config, from), career: null, portfolioDeck: null };
    const sources = join(root.dir, HUB_FILE);
    return {
        ...root,
        portfolio,
        vocab: hubVocabOf(root.dir, portfolio),
        findings: [
            ...findings,
            ...sourcesFindings(
                config,
                {
                    scan: sources,
                    newProjectDir: sources,
                    memoriesDir: sources,
                    wallpaperDir: sources
                },
                root.dir
            )
        ]
    };
}

/** The maps of a registry file's `entries:` list. */
const entryMapsShape = rowsShape(mapShape);
/** A hub file read as a map, or null when it cannot be read or holds no map. */
function hubMap(hub: string, file: string, catalog: TextCatalog): Record<string, unknown> | null {
    return readYamlMap(join(hub, file), catalog, [], () => null);
}

/** The options of the `themes` field of a registry file's schema, each as a key and a label. */
function themeRows(file: Record<string, unknown> | null): HubVocab['venue_themes'] {
    const themes = fieldsOf(file?.schema)?.find((field) => field.field === 'themes');
    return optionKeys(themes).map((key) => ({ key, label: optionLabel(themes, key) }));
}

/**
 * The domains one hub gives its own projects, read from its domains registry: each entry by key,
 * with its `#rrggbb` colour and its title (its key when it has none). A file that does not read
 * gives none; its reader reports why. The vocabulary (`hubVocabOf`) and the deck reader, which
 * checks a project's `domain:` against these keys, both read the registry here.
 */
export function hubDomainsOf(hub: string, config: PortfolioConfig): HubVocab['domains'] {
    const domains: HubVocab['domains'] = {};
    const held = hubMap(hub, config.registries.domains, config.text);
    for (const entry of readOr(entryMapsShape, held?.entries, [])) {
        const key = str(entry.key);
        if (key === undefined || key === '') continue;
        const color = domainColorOf(entry);
        const title = str(entry.title);
        domains[key] = {
            ...(color === undefined ? {} : { color }),
            label: title === undefined || title === '' ? key : title
        };
    }
    return domains;
}

/**
 * The words a merged config gives a hub's records: the value of each key of
 * config/catalogs/vocab.yml a hub's settings set (`VOCAB_SHAPES`) and of `manifest_fields`, as
 * the config holds it. A key the config does not hold is left out.
 */
function hubWords(merged: Readonly<Record<string, unknown>>): Record<string, unknown> {
    const keys = [...Object.keys(VOCAB_SHAPES), MANIFEST_FIELDS_KEY];
    return Object.fromEntries(
        keys.filter((key) => Object.hasOwn(merged, key)).map((key) => [key, merged[key]])
    );
}

/**
 * The words one hub gives its own records, read from its own files: its domains (`hubDomainsOf`)
 * and the `themes` options of its venue and dataset registries. A file that does not read gives
 * none; its reader reports why. Its collections are the keys its own `collections:` names; a hub
 * whose settings name no list has the engine's list, and lists every key of it when it holds the
 * `.oculus/data/` folder, else the keys whose file it holds. Its `words` are those of the hub's
 * merged config (`hubWords`).
 */
export function hubVocabOf(hub: string, config: PortfolioConfig): HubVocab {
    const unnamed = heldUnnamed(hub, config.unnamed);
    const held = config.collections.filter(
        (file) => !unnamedCollection(unnamed, file.key) || existsSync(join(hub, file.file))
    );
    return {
        domains: hubDomainsOf(hub, config),
        venue_themes: themeRows(hubMap(hub, config.registries.venues, config.text)),
        data_themes: themeRows(hubMap(hub, config.registries.datasets, config.text)),
        collections: held.map((file) => file.key),
        words: hubWords(config.merged)
    };
}

/**
 * The files `hubVocabOf` reads for one hub, absolute, with the `.oculus/data/` folder and the
 * collection files whose presence says what a hub that names no `collections:` list lists.
 */
function hubVocabFiles(hub: string, config: PortfolioConfig): string[] {
    const { domains, venues, datasets } = config.registries;
    const looked = config.collections.filter((file) => unnamedCollection(config.unnamed, file.key));
    const folder = config.unnamed?.collections === true ? [DATA_FOLDER] : [];
    return [domains, venues, datasets, ...folder, ...looked.map((one) => one.file)].map((file) =>
        join(hub, file)
    );
}

/**
 * Where the records of a workspace come from, for its vocabulary: the name of the primary hub
 * (null in a workspace with none), the names of its folders in the workspace's order, and oculus's
 * own merged config, whose words a folder that is no hub is read under.
 */
export type VocabPlaces = {
    primary: string | null;
    folders: readonly string[];
    own: Readonly<Record<string, unknown>>;
};

/**
 * The vocabulary of every hub of the workspace: the primary's (none in a workspace with no
 * primary, whose name is then null) and each other hub's, each read from that hub's own files.
 * `order` is the primary, then the other hubs in the workspace's order, and with no primary each
 * folder that is no hub at its place among them, since its records carry the folder's name; with a
 * primary such a folder's records are the primary's; a hub no folder names comes last. `own` is
 * oculus's own words.
 */
export function hubVocabs(
    places: VocabPlaces,
    primaryVocab: HubVocab | null,
    others: readonly { key: string; vocab: HubVocab }[]
): HubVocabs {
    const { primary } = places;
    const lists: Record<string, HubVocab> = {};
    if (primary !== null && primaryVocab !== null) lists[primary] = primaryVocab;
    for (const one of others) lists[one.key] = one.vocab;
    const rest = places.folders.filter(
        (name) => name !== primary && (primary === null || Object.hasOwn(lists, name))
    );
    const named = [...(primary !== null && primaryVocab !== null ? [primary] : []), ...rest];
    const order = [...named, ...Object.keys(lists).filter((name) => !named.includes(name))];
    return { primary, lists, order, own: hubWords(places.own) };
}

/**
 * The vocabulary of the hub at `root` and the files it was read from, by its own settings.
 */
function readHubVocab(root: HubRoot, settings: HubSettings): { vocab: HubVocab; files: string[] } {
    const { config, from } = settings(root.dir);
    const portfolio = portfolioConfigFrom(config, from);
    return { vocab: hubVocabOf(root.dir, portfolio), files: hubVocabFiles(root.dir, portfolio) };
}

/**
 * The vocabulary of a workspace and every file it was read from: the primary hub's, read from its
 * folder `dir` by the settings `read` holds (none when the workspace has no primary folder), and
 * each other hub's, read by its own settings as `settings` gives them; `places` names the folders
 * and oculus's own config (`hubVocabs`).
 */
export function workspaceVocabs(
    primary: { name: string | null; dir: string | null },
    read: { config: Record<string, unknown>; from?: ReturnType<typeof loadConfig>['from'] },
    others: readonly HubRoot[],
    settings: HubSettings,
    places: Omit<VocabPlaces, 'primary'>
): { vocabs: HubVocabs; files: string[] } {
    const own = portfolioConfigFrom(read.config, read.from);
    const vocab = primary.dir === null ? null : hubVocabOf(primary.dir, own);
    const held = others.map((one) => ({ key: one.key, ...readHubVocab(one, settings) }));
    return {
        vocabs: hubVocabs({ ...places, primary: primary.name }, vocab, held),
        files: [
            ...(primary.dir === null ? [] : hubVocabFiles(primary.dir, own)),
            ...held.flatMap((one) => one.files)
        ]
    };
}
