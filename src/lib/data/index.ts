// Layer 1, data. The entry point: read, validate, normalise, and nothing else. Composition only,
// so the order of the three steps is the whole content of this file and every rule lives in the
// module it belongs to.
//
// Server side only, because the sources read the filesystem. What comes back is JSON-safe and is
// what the socket carries; the caller owns the version number and increments it on every rebuild.

import { join } from 'node:path';
import { z } from 'zod';
import { isMap, str, strings } from './helpers/guards.ts';
import { filledTextShape, keysOfShape, readAs, readOr, rowsShape } from './shapes/shapes.ts';
import { manifestDir, readHubManifests } from './sources/manifests.ts';
import { REGISTRY_FILES, readRegistries } from './sources/registries.ts';
import { readCollections } from './sources/collections.ts';
import { readCareer } from './sources/career.ts';
import { feedItems, readFeeds } from './sources/feeds.ts';
import { projectDocs } from './sources/docs.ts';
import { findingText, type TextCatalog } from './helpers/finding-text.ts';
import {
    CAREER_FILE,
    HUB_ROOT,
    TIERS,
    folderOf,
    hubLayerPath,
    inScan,
    tierOf
} from './helpers/hub-names.ts';
import { createReader } from './sources/deck/read.ts';
import type { DeckProject } from './sources/deck/kinds.ts';
import { loadConfig, textCatalog } from './sources/config.ts';
import { mergeHubs, type HubSnapshot } from './snapshot/hubs/merge.ts';
import { normalise } from './snapshot/normalise.ts';
import { sortFindings, validate } from './snapshot/validate.ts';
import { createChecker, type Checker } from './snapshot/schema/check.ts';
import { REGISTRIES, unreadSources } from './snapshot/schema/lists.ts';
import { listedFields } from './snapshot/schema/manifest.ts';
import { runSchemas } from './snapshot/schema/run.ts';
import {
    joinedSchemas,
    scopedSchemas,
    withSchemas,
    type SchemaSet
} from './snapshot/schema/set.ts';
import { engineSchemas } from './sources/config/catalog/schemas/engine.ts';
import { catalogOf } from './sources/config/catalog/options.ts';
import { optionFiles } from './sources/config/catalog/schemas/references.ts';
import { DECK_FILE } from './sources/deck/read.ts';
import { buildReferences } from './snapshot/references/build.ts';
import type { ReferenceIndex } from './snapshot/references/model.ts';
import type {
    CollectionFile,
    DocPresence,
    FeedFiles,
    Finding,
    Id,
    PortfolioConfig,
    RawDeck,
    RawManifest,
    RawPortfolio,
    RegistryFiles,
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

/** The sources files the values of `scan:` and `new_project_dir:` were read from. */
export type SourcesFiles = { scan: string; newProjectDir: string };

/**
 * What is wrong with the values `scan:` and `new_project_dir:` hold in a merged config, each
 * finding filed on the sources file its value was read from.
 */
export function sourcesFindings(merged: Record<string, unknown>, files: SourcesFiles): Finding[] {
    const text = textCatalog(merged);
    const scan = scanRules(merged.scan);
    return [
        ...scanFindings(merged.scan, files.scan, text),
        ...newProjectDirs(merged.new_project_dir, scan, files.newProjectDir, text).findings
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

/** One entry of the `collections:` list: a key and a hub-relative file, both texts. */
const collectionFileShape = z.object({
    key: z.string(),
    file: z.string()
}) satisfies z.ZodType<CollectionFile>;

/** The `collections:` list, each entry a key and a hub-relative file. */
const collectionFilesShape = rowsShape(collectionFileShape);

/** The `collections:` list as the files it names. */
function collectionFiles(value: unknown): CollectionFile[] {
    return readOr(collectionFilesShape, value, []);
}

/**
 * The feed paths for a config that names none of them. The LinkedIn folder is the hub's own, so a
 * config that names none has no LinkedIn feed, and its path is empty.
 */
const FEED_FILES: FeedFiles = {
    leads: 'feeds/position-leads.yml',
    radar: 'feeds/literature-radar.yml',
    linkedin: ''
};

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
 * The portfolio's half of the merged config. The six `*_file` keys give six registry paths and the
 * `collections:` list gives the seventh, since funding/funding.yml is named there and nowhere else.
 * A key the config does not hold falls back to the path the hub uses today, so a config that has
 * moved on in one place still builds. The text catalog travels with it, since every reader words
 * its findings from config/text/findings.yml.
 */
export function portfolioConfigFrom(merged: Record<string, unknown>): PortfolioConfig {
    const path = (key: string, fallback: string): string =>
        readOr(pathShape, merged[key], fallback);
    const collections = collectionFiles(merged.collections);
    const fundingFile = collections.find((file) => file.key === 'funding')?.file;

    const registries: RegistryFiles = {
        venues: path('venues_file', REGISTRY_FILES.venues),
        datasets: path('datasets_file', REGISTRY_FILES.datasets),
        pillars: path('pillars_file', REGISTRY_FILES.pillars),
        domains: path('domains_file', REGISTRY_FILES.domains),
        funding: fundingFile ?? REGISTRY_FILES.funding,
        people: path('people_file', REGISTRY_FILES.people),
        organisations: path('organisations_file', REGISTRY_FILES.organisations),
        resources: path('resources_file', REGISTRY_FILES.resources)
    };

    const vocab: Vocabulary = { statuses: readOr(keysOfShape, merged.status_palette, []) };

    const feeds: FeedFiles = {
        leads: path('leads_file', FEED_FILES.leads),
        radar: path('radar_file', FEED_FILES.radar),
        linkedin: path('linkedin_dir', FEED_FILES.linkedin)
    };

    const scan = scanRules(merged.scan);
    const text = textCatalog(merged);
    return {
        scan,
        repositories: [],
        newProjectDir: newProjectDirs(merged.new_project_dir, scan, '', text).dirs,
        registries,
        collections,
        feeds,
        linkedinCadenceDays: Number(merged.linkedin_cadence_days),
        career: path('career_file', CAREER_FILE),
        schema: merged.manifest_schema,
        vocab,
        merged,
        portfolioDeck: readAs(filledTextShape, merged.portfolio_deck) ?? null,
        tagTones: tagTones(merged.defaults),
        domains: readOr(keysOfShape, merged.domains, []),
        text
    };
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
        if (manifest.repository !== undefined) project.repository = manifest.repository;
        const tier = tierOf(manifest.tier);
        if (tier !== undefined) project.tier = tier;
        const type = str(manifest.type);
        if (type !== undefined) project.type = type;
        const domain = str(manifest.domain);
        if (domain !== undefined && domain !== '') project.domain = domain;
        return project;
    });
}

/** The portfolio deck and every project deck read, with what was wrong in them. */
function decks(
    hub: string,
    manifests: RawManifest[],
    config: PortfolioConfig
): { decks: Record<Id, RawDeck>; findings: Finding[] } {
    const root = { key: HUB_ROOT, dir: hub };
    const reader = createReader({
        hub: root,
        projects: deckProjects(manifests),
        domains: config.domains,
        tagTones: config.tagTones,
        catalog: config.text
    });
    const found: Record<Id, RawDeck> = {};
    for (const one of reader.projectDecks()) found[one.id] = { path: one.path, tags: one.tags };
    if (config.portfolioDeck !== null) reader.read(root, config.portfolioDeck);
    return { decks: found, findings: reader.findings() };
}

/**
 * The snapshot of one build, the schemas it was checked against and the index of the hub keys it
 * names and defines, for the editor.
 */
export type PortfolioBuild = { snapshot: Snapshot; schemas: SchemaSet; references: ReferenceIndex };

/**
 * Read the hub, check what was read, and hand back the snapshot with the schemas the check used.
 * The steps are the modules: the sources say what is on disk, validate and the schemas say what is
 * wrong with it, and normalise turns it into the wire model with the findings carried inside it.
 * `roots` are the directories whose `.oculus/project.yml` is read, as handed, each a project of the
 * hub (`readHubManifests`); `repositoriesOf` of server/files/roots.ts decides which roots of the
 * file browser they are. `checker` keeps the compiled validators from one build to the next,
 * so a rebuild whose schemas did not change compiles nothing. `engine` is the engine's config
 * folder, whose files that carry a reference are indexed beside the hub's; none when it is null.
 * `root` is the key the hub's files are named under in the reference index: `hub` for the first
 * hub, the key of its root for another.
 */
export function buildPortfolioWithSchemas(
    hub: string,
    config: PortfolioConfig,
    version = 0,
    roots: RepositoryRoot[] = [],
    checker: Checker = createChecker(),
    engine: string | null = null,
    root: string = HUB_ROOT
): PortfolioBuild {
    const manifests = readHubManifests(hub, config.scan, roots, config.text);
    const registries = readRegistries(hub, config.registries, config.text);
    const collections = readCollections(hub, config.collections, config.text);
    const feeds = readFeeds(hub, config.feeds, config.text);
    const career =
        config.career === null
            ? { career: null, findings: [] }
            : readCareer(hub, config.career, config.text);
    const deck = decks(hub, manifests.manifests, config);

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
            datasetsFile: join(hub, config.registries.datasets),
            listed: listedFields(config.schema, unread),
            text: config.text
        }),
        ...run.findings
    ]);
    const references = buildReferences({
        hub,
        root,
        config,
        engine,
        read: run.read,
        manifests: raw.manifests,
        decks: raw.decks,
        options: optionFiles(catalogOf(config.merged)),
        deckFile: DECK_FILE
    });
    return {
        snapshot: normalise(raw, findings, version),
        schemas: withSchemas(run.set, engineSchemas(raw, config)),
        references
    };
}

/** A hub other than the first as the build needs it: its key and where it is. */
export type HubRoot = { key: string; dir: string };

/**
 * A hub other than the first, read with its own settings: the engine's defaults under the hub's own
 * `.oculus/config/`. Its career and its portfolio deck are the first hub's alone, so they are not
 * read, and the findings of its settings layer ride along for the caller to report.
 */
export type SecondHub = HubRoot & { portfolio: PortfolioConfig; findings: Finding[] };

/**
 * The portfolio settings of a hub other than the first. Its `roots:` is the first hub's list to
 * read, so the settings are made without it and no reader of them finds a repository there.
 */
export function portfolioConfigOfOther(merged: Record<string, unknown>): PortfolioConfig {
    const { roots: _unread, ...rest } = merged;
    return portfolioConfigFrom(rest);
}

/** The settings of a hub other than the first. */
export function readSecondHub(engine: string, root: HubRoot): SecondHub {
    const { config, findings } = loadConfig(engine, { hub: root.dir });
    const portfolio = { ...portfolioConfigOfOther(config), career: null, portfolioDeck: null };
    const sources = join(root.dir, hubLayerPath('sources.yml'));
    return {
        ...root,
        portfolio,
        findings: [
            ...findings,
            ...sourcesFindings(config, { scan: sources, newProjectDir: sources })
        ]
    };
}

/** The merged build and each hub's own snapshot, the first hub's under the key `hub`. */
export type HubsBuild = PortfolioBuild & { parts: HubSnapshot[] };

/**
 * The first hub's build joined with every hub beside it as one build: each other hub is built on
 * its own with its own settings and the snapshots are merged (snapshot/hubs/merge.ts), the YAML
 * server's schemas and reference index joined with each hub's files under its own root. With no
 * other hub it is the first hub's build as it is. `parts` hold the snapshots the hubs were built
 * into before the merge, which the audit scans each hub by.
 */
export function joinHubs(
    base: PortfolioBuild,
    first: { hub: string; config: PortfolioConfig },
    others: readonly SecondHub[],
    version: number,
    checker: Checker
): HubsBuild {
    const own: HubSnapshot = { key: HUB_ROOT, snapshot: base.snapshot };
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
        REGISTRIES.map((name) => [name, join(first.hub, first.config.registries[name])])
    ) as Record<RegistryName, string>;
    const snapshot = mergeHubs(
        {
            snapshot: base.snapshot,
            registryFiles,
            feedItems: feedItems(first.hub, first.config.feeds, first.config.text)
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
