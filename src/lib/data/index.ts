// Layer 1, data. The entry point: read, validate, normalise, and nothing else. Composition only,
// so the order of the three steps is the whole content of this file and every rule lives in the
// module it belongs to.
//
// Server side only, because the sources read the filesystem. What comes back is JSON-safe and is
// what the socket carries; the caller owns the version number and increments it on every rebuild.

import { join } from 'node:path';
import { z } from 'zod';
import { keysOfShape, optionalTextShape, readAs, readOr, rowsShape } from './shapes/shapes.ts';
import { readManifests } from './sources/manifests.ts';
import { REGISTRY_FILES, readRegistries } from './sources/registries.ts';
import { readCollections } from './sources/collections.ts';
import { CAREER_FILE, readCareer } from './sources/career.ts';
import { readFeeds } from './sources/feeds.ts';
import { projectDocs } from './sources/docs.ts';
import { deckFindings, readPresent } from './sources/present.ts';
import { configDir, textCatalog } from './sources/config.ts';
import { normalise } from './snapshot/normalise.ts';
import { validate } from './snapshot/validate.ts';
import type { TextCatalog } from './helpers/finding-text.ts';
import type {
    CollectionFile,
    DocPresence,
    FeedFiles,
    Finding,
    Id,
    PortfolioConfig,
    PresentSlide,
    RawManifest,
    RawPortfolio,
    RegistryFiles,
    ScanRule,
    Snapshot,
    Vocabulary
} from './model/index.ts';

/** The one config file the public deck lives in, inside the engine's config directory. */
export const DECK_FILE = 'present.yml';

/**
 * One `scan:` rule: a map with a `dir` that is a text, carrying its `type` when that is a text and
 * its `nested` and `optional` marks when they are true.
 */
const scanRuleShape = z
    .object({
        dir: z.string(),
        type: optionalTextShape,
        nested: z.literal(true).optional().catch(undefined),
        optional: z.literal(true).optional().catch(undefined)
    })
    .transform((item): ScanRule => {
        const rule: ScanRule = { dir: item.dir };
        if (item.type !== undefined) rule.type = item.type;
        if (item.nested !== undefined) rule.nested = item.nested;
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

/** The feed paths on the hub today, for a config that names none of them. */
/**
 * The ideas backlog's `focus:` value. It is not a key of `focus_lanes` (vocab.yml says why beside
 * `holding_color`), and it is the one value beside the lanes a manifest's `focus:` may hold.
 */
const BACKLOG = 'holding';

const FEED_FILES: FeedFiles = {
    leads: 'feeds/position-leads.yml',
    radar: 'feeds/literature-radar.yml',
    linkedin: 'theaxec.github.io/_linkedin'
};

/** The name of one vocabulary list entry: its `key` when it is a map, else the entry itself. */
const vocabKeyShape = z.union([
    z.object({ key: z.string() }).transform((row) => row.key),
    z.string()
]);

/** The names of a keyed vocabulary list, one per entry that has one. */
const vocabKeysShape = rowsShape(vocabKeyShape);

/**
 * The `key` of every entry of a keyed vocabulary list, `status_legend` being the one that matters.
 */
function vocabKeys(value: unknown): string[] {
    return readOr(vocabKeysShape, value, []);
}

/** The deck's `equations_dir`: the text of that key of the deck map. */
const equationsDirShape = z
    .object({ equations_dir: z.string() })
    .transform((deck) => deck.equations_dir);

/** A config path: the text the key holds. */
const pathShape = z.string();

/**
 * The portfolio's half of the merged config. The six `*_file` keys give six registry paths and the
 * `collections:` list gives the seventh, since funding/funding.yml is named there and nowhere else.
 * A key the config does not hold falls back to the path the hub uses today, so a config that has
 * moved on in one place still builds. The text catalog travels with it, since every reader words
 * its findings from config/text/findings.yml.
 */
export function portfolioConfigFrom(
    merged: Record<string, unknown>,
    engine: string
): PortfolioConfig {
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
        organisations: path('organisations_file', REGISTRY_FILES.organisations)
    };

    const vocab: Vocabulary = {
        types: readOr(keysOfShape, merged.type_color, []),
        statuses: readOr(keysOfShape, merged.status_palette, [])
    };
    const chips = vocabKeys(merged.status_legend);
    if (chips.length > 0) vocab.chips = chips;
    const hostStatuses = readAs(keysOfShape, merged.career_host_status);
    if (hostStatuses !== null) vocab.hostStatuses = hostStatuses;
    // The lanes a `focus:` may name, plus the ideas backlog: vocab.yml keeps `holding` out of
    // `focus_lanes` on purpose (it is not a lane) and names it through `holding_color`, so it is
    // added here when that colour is configured, which is the same file saying the backlog exists.
    const lanes = vocabKeys(merged.focus_lanes);
    if (lanes.length > 0) {
        vocab.lanes = merged.holding_color === undefined ? lanes : [...lanes, BACKLOG];
    }
    const venueThemes = vocabKeys(merged.venue_themes);
    if (venueThemes.length > 0) vocab.venueThemes = venueThemes;
    const dataThemes = vocabKeys(merged.data_themes);
    if (dataThemes.length > 0) vocab.dataThemes = dataThemes;

    const feeds: FeedFiles = {
        leads: path('leads_file', FEED_FILES.leads),
        radar: path('radar_file', FEED_FILES.radar),
        linkedin: path('linkedin_dir', FEED_FILES.linkedin)
    };

    return {
        scan: scanRules(merged.scan),
        registries,
        collections,
        feeds,
        linkedinCadenceDays: Number(merged.linkedin_cadence_days),
        career: path('career_file', CAREER_FILE),
        schema: merged.manifest_schema,
        vocab,
        deck: merged.deck,
        deckFile: join(configDir(engine), DECK_FILE),
        text: textCatalog(merged)
    };
}

/**
 * Which of the fixed documents each project folder holds, by project id. It is existence only, four
 * `stat` calls per folder, so it runs on every rebuild beside the manifests themselves.
 */
function documents(hub: string, manifests: RawManifest[]): Record<Id, DocPresence[]> {
    const found: Record<Id, DocPresence[]> = {};
    for (const manifest of manifests) found[manifest.id] = projectDocs(join(hub, manifest.folder));
    return found;
}

/** The slides of every project that carries a PRESENT.md, by project id, with what was wrong. */
function slides(
    hub: string,
    manifests: RawManifest[],
    equationsDir: string,
    catalog: TextCatalog
): { present: Record<Id, PresentSlide[]>; findings: Finding[] } {
    const present: Record<Id, PresentSlide[]> = {};
    const findings: Finding[] = [];
    for (const manifest of manifests) {
        const read = readPresent(
            { hub, folder: manifest.folder, equationsDir },
            manifest.id,
            catalog
        );
        present[manifest.id] = read.slides;
        findings.push(...read.findings);
    }
    return { present, findings };
}

/** The deck's `equations_dir`, hub-relative, and the empty string when the deck names none. */
function equationsDirOf(deck: unknown): string {
    return readOr(equationsDirShape, deck, '');
}

/**
 * Read the hub, check what was read, and hand back the snapshot. The three steps are the three
 * modules: the sources say what is on disk, validate says what is wrong with it, and normalise
 * turns it into the wire model with the findings carried inside it.
 */
export function buildPortfolio(hub: string, config: PortfolioConfig, version = 0): Snapshot {
    const manifests = readManifests(hub, config.scan, config.text);
    const registries = readRegistries(hub, config.registries, config.text);
    const collections = readCollections(hub, config.collections, config.text);
    const feeds = readFeeds(hub, config.feeds, config.text);
    const career = readCareer(hub, config.career, config.text);
    const present = slides(hub, manifests.manifests, equationsDirOf(config.deck), config.text);
    const deck = deckFindings(
        config.deck,
        Object.values(present.present).flatMap((list) => list.map((one) => one.id)),
        config.deckFile,
        config.text
    );

    const raw: RawPortfolio = {
        manifests: manifests.manifests,
        registries,
        collections: collections.collections,
        feeds: feeds.feeds,
        career: career.career,
        docs: documents(hub, manifests.manifests),
        present: present.present,
        findings: [
            ...manifests.findings,
            ...registries.findings,
            ...collections.findings,
            ...feeds.findings,
            ...career.findings,
            ...present.findings,
            ...deck
        ]
    };

    const findings = validate(raw, {
        schema: config.schema,
        vocab: config.vocab,
        careerFile: join(hub, config.career),
        datasetsFile: join(hub, config.registries.datasets),
        text: config.text
    });
    return normalise(raw, findings, version);
}
