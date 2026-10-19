// Layer 1, data. The entry point: read, validate, normalise, and nothing else. Composition only,
// so the order of the three steps is the whole content of this file and every rule lives in the
// module it belongs to.
//
// Server side only, because the sources read the filesystem. What comes back is JSON-safe and is
// what the socket carries; the caller owns the version number and increments it on every rebuild.

import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { z } from 'zod';
import { focusBlock, isMap, str, strings } from './helpers/guards.ts';
import { MEMORIES_DIR, WALLPAPER_DIR, hubFolderIn } from './helpers/files/paths.ts';
import { filledTextShape, mapShape, readAs, readOr, rowsShape } from './shapes/shapes.ts';
import { coloredWords, wordsWith } from './shapes/vocab-keys.ts';
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
import { feedItems, readFeeds } from './sources/documents/feeds.ts';
import { projectDocs } from './sources/documents/docs.ts';
import { findingText, type TextCatalog } from './helpers/finding-text.ts';
import {
    DATA_FOLDER,
    HUB_FILE,
    TIERS,
    folderOf,
    fromHubFile,
    inScan,
    tierOf
} from './helpers/hub-names.ts';
import { createReader } from './sources/deck/read.ts';
import type { DeckProject } from './sources/deck/kinds.ts';
import { textCatalog, type loadConfig } from './sources/config.ts';
import { readYamlMap } from './sources/yaml-file.ts';
import { fieldsOf } from './snapshot/schema/field.ts';
import { mergeHubs, type HubSnapshot } from './snapshot/hubs/merge.ts';
import { FEED_COLLECTION_KEYS, isFeedCollection, normalise } from './snapshot/normalise.ts';
import { sortFindings, validate } from './snapshot/validate.ts';
import { createChecker, type Checker } from './snapshot/schema/check.ts';
import { REGISTRIES, unreadSources } from './snapshot/schema/lists.ts';
import { listedFields } from './snapshot/schema/manifest.ts';
import { runSchemas } from './snapshot/schema/run.ts';
import {
    emptySchemaSet,
    joinedSchemas,
    resolvedSchemas,
    scopedSchemas,
    withSchemas,
    type EngineConfigAt,
    type SchemaSet
} from './snapshot/schema/set.ts';
import { engineSchemas } from './sources/config/catalog/schemas/engine.ts';
import { catalogOf } from './sources/config/catalog/options.ts';
import { optionFiles } from './sources/config/catalog/schemas/references.ts';
import { DECK_FILE } from './sources/deck/read.ts';
import { buildReferences, type EngineConfigFolder } from './snapshot/references/build.ts';
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
    ScanRule,
    Snapshot,
    Tier,
    Vocabulary
} from './model/index.ts';

/** The keys a `scan:` entry takes. */
const SCAN_KEYS = ['dir', 'optional'];

/**
 * One `scan:` rule: a map with a `dir` that is a text, carrying its `optional` mark when it is
 * true. Any other key is not read; `scanFindings` names it.
 */
const scanRuleShape = z
    .object({
        dir: z.string(),
        optional: z.literal(true).optional().catch(undefined)
    })
    .transform((item): ScanRule => {
        const rule: ScanRule = { dir: item.dir };
        if (item.optional !== undefined) rule.optional = item.optional;
        return rule;
    }) satisfies z.ZodType<ScanRule>;

/** The `scan:` list, the rules that name a directory. */
const scanRulesShape = rowsShape(scanRuleShape);

/**
 * The `scan:` rules of the layout config. A rule with no `dir` names no directory and is dropped.
 */
function scanRules(value: unknown): ScanRule[] {
    return readOr(scanRulesShape, value, []);
}

/**
 * What is wrong with the `scan:` value, each finding filed on `file`, the sources file that holds
 * it: a value that is no list, an entry that is no map or names no `dir`, and every key of an entry
 * besides `dir` and `optional`, which the entry is read without.
 */
function scanFindings(value: unknown, file: string, text: TextCatalog): Finding[] {
    const found: Finding[] = [];
    const raise = (id: string, ...args: (string | number)[]): void => {
        found.push({ file, key: 'scan', message: findingText(text, id, ...args) });
    };
    if (value === undefined) return found;
    if (!Array.isArray(value)) {
        raise('findings.manifests.scan_not_a_list');
        return found;
    }
    for (const [index, entry] of value.entries()) {
        if (!isMap(entry) || typeof entry.dir !== 'string') {
            raise('findings.manifests.scan_no_dir', index + 1);
            continue;
        }
        for (const key of Object.keys(entry)) {
            if (!SCAN_KEYS.includes(key)) raise('findings.manifests.scan_key', entry.dir, key);
        }
    }
    return found;
}

/**
 * The sources files the values of `scan:`, `new_project_dir:` and the picture folders came from.
 */
export type SourcesFiles = {
    scan: string;
    newProjectDir: string;
    memoriesDir: string;
    wallpaperDir: string;
};

/** What is wrong with a picture folder key of a hub: no text, or a folder outside the hub. */
function pictureFolderFindings(
    merged: Record<string, unknown>,
    hub: string,
    key: string,
    fallback: string,
    file: string,
    text: TextCatalog
): Finding[] {
    const { problem } = hubFolderIn(hub, merged[key], fallback);
    if (problem === null) return [];
    const message =
        problem === 'text'
            ? findingText(text, 'findings.manifests.picture_folder_text', key, fallback)
            : findingText(
                  text,
                  'findings.manifests.picture_folder_outside',
                  key,
                  String(merged[key]),
                  fallback
              );
    return [{ file, key, message }];
}

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
        ...newProjectDirs(merged.new_project_dir, scan, files.newProjectDir, text).findings,
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

/**
 * The `new_project_dir:` value read as the folder a new project of each tier is made in, with a
 * finding naming the key of every entry that is not used: a value that is no map, a key that is not
 * one of the five tiers, a value that is no folder text, and a folder outside every scan folder.
 */
function newProjectDirs(
    value: unknown,
    scan: ScanRule[],
    file: string,
    text: TextCatalog
): { dirs: Partial<Record<Tier, string>>; findings: Finding[] } {
    const dirs: Partial<Record<Tier, string>> = {};
    const findings: Finding[] = [];
    const raise = (id: string, ...args: (string | number)[]): void => {
        findings.push({ file, key: 'new_project_dir', message: findingText(text, id, ...args) });
    };
    if (value === undefined) return { dirs, findings };
    if (!isMap(value)) {
        raise('findings.manifests.new_project_dir_not_a_map');
        return { dirs, findings };
    }
    for (const [key, folder] of Object.entries(value)) {
        const tier = TIERS.find((one) => one === key);
        if (tier === undefined) {
            raise('findings.manifests.new_project_dir_tier', key, TIERS.join(', '));
        } else if (typeof folder !== 'string' || folderOf(folder) === '') {
            raise('findings.manifests.new_project_dir_folder', key);
        } else if (
            !inScan(
                folder,
                scan.map((rule) => rule.dir)
            )
        ) {
            raise('findings.manifests.new_project_dir_outside', key, folder);
        } else {
            dirs[tier] = folderOf(folder);
        }
    }
    return { dirs, findings };
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
 * oculus's own path in config/sources.yml (`engineDefaults`, read only then), so a config that has
 * moved on in one place still builds. The text catalog travels with it, since every reader words
 * its findings from config/text/findings.yml.
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
        acknowledged: wordsWith(merged, 'statuses', 'acknowledged')
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
        newProjectDir: newProjectDirs(merged.new_project_dir, scan, '', text).dirs,
        registries,
        collections,
        feeds,
        linkedinCadenceDays: Number(focusBlock(merged).linkedin_cadence_days),
        career: readAs(pathShape, merged.career_file) ?? defaults().career,
        schema: merged.manifest_schema,
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
function deckProjects(manifests: RawManifest[]): DeckProject[] {
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
        const tier = tierOf(manifest.tier);
        if (tier !== undefined) project.tier = tier;
        const type = str(manifest.type);
        if (type !== undefined) project.type = type;
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
        projects: deckProjects(manifests),
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
 * Read the hub, check what was read, and hand back the snapshot with the schemas the check used.
 * The steps are the modules: the sources say what is on disk, validate and the schemas say what is
 * wrong with it, and normalise turns it into the wire model with the findings carried inside it.
 * `roots` are the directories whose `project.yml` or `.oculus/project.yml` is read, as handed, each
 * a project of the hub (`readHubManifests`); `repositoriesOf` of server/files/roots.ts decides
 * which roots of the file browser they are. `checker` keeps the compiled validators from one build
 * to the next, so a rebuild whose schemas did not change compiles nothing. `engine` is oculus's own
 * config folder and the workspace folders that hold it, whose files that carry a reference are
 * indexed beside the hub's and governed by schema where the workspace holds them; none when it is
 * null. `root` is the name of the workspace folder the hub's files are named under; the folder's
 * base name when it is not given.
 */
export function buildPortfolioWithSchemas(
    hub: string,
    config: PortfolioConfig,
    version = 0,
    roots: RepositoryRoot[] = [],
    checker: Checker = createChecker(),
    engine: EngineConfigIn | null = null,
    root: string = basename(hub)
): PortfolioBuild {
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

    const unread = unreadSources(raw, hub, config.registries);
    const run = runSchemas(hub, config, raw, checker, unread);
    const findings = sortFindings([
        ...validate(raw, {
            vocab: config.vocab,
            listed: listedFields(config.schema, unread),
            text: config.text
        }),
        ...run.findings
    ]);
    const references = buildReferences({
        hub,
        root,
        config,
        engine: configFolder(engine),
        read: run.read,
        manifests: raw.manifests,
        decks: raw.decks,
        options: optionFiles(catalogOf(config.merged)),
        deckFile: DECK_FILE
    });
    return {
        snapshot: normalise(raw, findings, config.merged, version),
        schemas: resolvedSchemas(
            withSchemas(run.set, engineSchemas(raw, config)),
            root,
            engine?.held ?? []
        ),
        references
    };
}

/**
 * The build of a workspace with no primary hub: the project folders of the workspace read as
 * projects, no registry, collection, feed or career, and the schemas of oculus's own config folder
 * where the workspace holds it. It checks nothing a hub's files are checked for, since there are
 * none.
 */
export function buildFolderProjects(
    config: PortfolioConfig,
    version = 0,
    engine: EngineConfigIn | null = null
): PortfolioBuild {
    const manifests = readHubManifests('', [], config.repositories, config.text);
    const registries = Object.fromEntries(
        REGISTRIES.map((name) => [name, { entries: [], meta: {} }])
    ) as unknown as RawPortfolio['registries'];
    const raw: RawPortfolio = {
        manifests: manifests.manifests,
        registries,
        collections: {},
        feeds: { leads: null, radar: null, scout: null, linkedin: null },
        career: null,
        docs: documents('', manifests.manifests),
        decks: {},
        findings: manifests.findings
    };
    const findings = sortFindings(manifests.findings);
    return {
        snapshot: normalise(raw, findings, config.merged, version),
        schemas: resolvedSchemas(
            withSchemas(emptySchemaSet(), engineSchemas(raw, config)),
            '',
            engine?.held ?? []
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
 * The words one hub gives its own records, read from its own files: its domains (`hubDomainsOf`)
 * and the `themes` options of its venue and dataset registries. A file that does not read gives
 * none; its reader reports why. Its collections are the keys its own `collections:` names; a hub
 * whose settings name no list has the engine's list, and lists every key of it when it holds the
 * `.oculus/data/` folder, else the keys whose file it holds.
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
        collections: held.map((file) => file.key)
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
 * The vocabulary of every hub of the workspace: the primary's (none in a workspace with no
 * primary, whose name is then null) and each other hub's, each read from that hub's own files.
 */
export function hubVocabs(
    primary: string | null,
    primaryVocab: HubVocab | null,
    others: readonly { key: string; vocab: HubVocab }[]
): HubVocabs {
    const lists: Record<string, HubVocab> = {};
    if (primary !== null && primaryVocab !== null) lists[primary] = primaryVocab;
    for (const one of others) lists[one.key] = one.vocab;
    return { primary, lists };
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
 * each other hub's, read by its own settings as `settings` gives them.
 */
export function workspaceVocabs(
    primary: { name: string | null; dir: string | null },
    read: { config: Record<string, unknown>; from?: ReturnType<typeof loadConfig>['from'] },
    others: readonly HubRoot[],
    settings: HubSettings
): { vocabs: HubVocabs; files: string[] } {
    const own = portfolioConfigFrom(read.config, read.from);
    const vocab = primary.dir === null ? null : hubVocabOf(primary.dir, own);
    const held = others.map((one) => ({ key: one.key, ...readHubVocab(one, settings) }));
    return {
        vocabs: hubVocabs(primary.name, vocab, held),
        files: [
            ...(primary.dir === null ? [] : hubVocabFiles(primary.dir, own)),
            ...held.flatMap((one) => one.files)
        ]
    };
}

/** The merged build and each hub's own snapshot, the primary's under its name (empty with none). */
export type HubsBuild = PortfolioBuild & { parts: HubSnapshot[] };

/**
 * The first build joined with every hub beside it as one build: each other hub is built on its own
 * with its own settings and the snapshots are merged (snapshot/hubs/merge.ts), the YAML server's
 * schemas and reference index joined with each hub's files under its own root. The first build is
 * the primary hub's, or the build of the project folders of a workspace with no primary
 * (`first.hub` and `first.name` are then null). With no other hub it is the first build as it is.
 * `parts` hold the snapshots the hubs were built into before the merge, which the audit scans each
 * hub by.
 */
export function joinHubs(
    base: PortfolioBuild,
    first: { hub: string | null; name: string | null; config: PortfolioConfig },
    others: readonly OtherHub[],
    version: number,
    checker: Checker
): HubsBuild {
    const own: HubSnapshot = { key: first.name ?? '', snapshot: base.snapshot };
    if (others.length === 0) return { ...base, parts: [own] };
    const built = others.map((one) => ({
        key: one.key,
        peopleFile: join(one.dir, one.portfolio.registries.people),
        build: buildPortfolioWithSchemas(
            one.dir,
            one.portfolio,
            version,
            [],
            checker,
            null,
            one.key
        )
    }));
    const registryFiles = Object.fromEntries(
        REGISTRIES.map((name) => [
            name,
            first.hub === null ? '' : join(first.hub, first.config.registries[name])
        ])
    ) as Record<RegistryName, string>;
    const snapshot = mergeHubs(
        {
            snapshot: base.snapshot,
            registryFiles,
            feedItems:
                first.hub === null
                    ? []
                    : feedItems(first.hub, first.config.feeds, first.config.text)
        },
        built.map((one) => ({
            key: one.key,
            snapshot: one.build.snapshot,
            peopleFile: one.peopleFile
        })),
        first.config.text
    );
    return {
        snapshot,
        schemas: joinedSchemas([
            base.schemas,
            ...built.map((one) => scopedSchemas(one.key, one.build.schemas))
        ]),
        references: {
            files: [base, ...built.map((one) => one.build)].flatMap((one) => one.references.files)
        },
        parts: [own, ...built.map((one) => ({ key: one.key, snapshot: one.build.snapshot }))]
    };
}
