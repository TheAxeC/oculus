// Layer 1, data. The entry point: read, validate, normalise, and nothing else. Composition only,
// so the order of the three steps is the whole content of this file and every rule lives in the
// module it belongs to.
//
// Server side only, because the sources read the filesystem. What comes back is JSON-safe and is
// what the socket carries; the caller owns the version number and increments it on every rebuild.

import { join } from 'node:path';
import { isMap } from './guards.ts';
import { readManifests } from './sources/manifests.ts';
import { REGISTRY_FILES, readRegistries } from './sources/registries.ts';
import { readCollections } from './sources/collections.ts';
import { CAREER_FILE, readCareer } from './sources/career.ts';
import { readFeeds } from './sources/feeds.ts';
import { projectDocs } from './sources/docs.ts';
import { deckFindings, readPresent } from './sources/present.ts';
import { configDir } from './sources/config.ts';
import { normalise } from './normalise.ts';
import { validate } from './validate.ts';
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
} from './model.ts';

/** The one config file the public deck lives in, inside the engine's config directory. */
export const DECK_FILE = 'present.yml';

function list(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

/** The `scan:` rules of the layout config. A rule with no `dir` names no directory and is dropped. */
function scanRules(value: unknown): ScanRule[] {
    const rules: ScanRule[] = [];
    for (const item of list(value)) {
        if (!isMap(item) || typeof item.dir !== 'string') continue;
        const rule: ScanRule = { dir: item.dir };
        if (typeof item.type === 'string') rule.type = item.type;
        if (item.nested === true) rule.nested = true;
        if (item.optional === true) rule.optional = true;
        rules.push(rule);
    }
    return rules;
}

/** The `collections:` list, each entry a key and a hub-relative file. */
function collectionFiles(value: unknown): CollectionFile[] {
    const files: CollectionFile[] = [];
    for (const item of list(value)) {
        if (!isMap(item)) continue;
        if (typeof item.key !== 'string' || typeof item.file !== 'string') continue;
        files.push({ key: item.key, file: item.file });
    }
    return files;
}

/** The feed paths on the hub today, for a config that names none of them. */
/**
 * The ideas backlog's `focus:` value. It is not a key of `focus_lanes` (vocab.yml says why beside
 * `holding_color`), and it is the one value beside the lanes a manifest's `focus:` may hold.
 */
const BACKLOG = 'holding';

const FEED_FILES: FeedFiles = {
    inbox: 'feeds/inbox.yml',
    leads: 'feeds/position-leads.yml',
    radar: 'feeds/literature-radar.yml',
    linkedin: 'theaxec.github.io/_linkedin'
};

/** The `key` of every entry of a keyed vocabulary list, `status_legend` being the one that matters. */
function vocabKeys(value: unknown): string[] {
    const keys: string[] = [];
    for (const item of list(value)) {
        if (isMap(item) && typeof item.key === 'string') keys.push(item.key);
        else if (typeof item === 'string') keys.push(item);
    }
    return keys;
}

/**
 * The portfolio's half of the merged config. The four `*_file` keys give four registry paths and
 * the `collections:` list gives the fifth, since funding/funding.yml is named there and nowhere
 * else. A key the config does not hold falls back to the path the hub uses today, so a config that
 * has moved on in one place still builds.
 */
export function portfolioConfigFrom(
    merged: Record<string, unknown>,
    engine: string
): PortfolioConfig {
    const path = (key: string, fallback: string): string =>
        typeof merged[key] === 'string' ? merged[key] : fallback;
    const collections = collectionFiles(merged.collections);
    const fundingFile = collections.find((file) => file.key === 'funding')?.file;

    const registries: RegistryFiles = {
        venues: path('venues_file', REGISTRY_FILES.venues),
        datasets: path('datasets_file', REGISTRY_FILES.datasets),
        programs: path('programs_file', REGISTRY_FILES.programs),
        domains: path('domains_file', REGISTRY_FILES.domains),
        funding: fundingFile ?? REGISTRY_FILES.funding
    };

    const vocab: Vocabulary = {
        types: isMap(merged.type_color) ? Object.keys(merged.type_color) : [],
        statuses: isMap(merged.status_palette) ? Object.keys(merged.status_palette) : []
    };
    const chips = vocabKeys(merged.status_legend);
    if (chips.length > 0) vocab.chips = chips;
    if (isMap(merged.career_host_status))
        vocab.hostStatuses = Object.keys(merged.career_host_status);
    // The lanes a `focus:` may name, plus the ideas backlog: vocab.yml keeps `holding` out of
    // `focus_lanes` on purpose (it is not a lane) and names it through `holding_color`, so it is
    // added here when that colour is configured, which is the same file saying the backlog exists.
    const lanes = vocabKeys(merged.focus_lanes);
    if (lanes.length > 0) {
        vocab.lanes = merged.holding_color === undefined ? lanes : [...lanes, BACKLOG];
    }

    const feeds: FeedFiles = {
        inbox: path('inbox_file', FEED_FILES.inbox),
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
        deckFile: join(configDir(engine), DECK_FILE)
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
    equationsDir: string
): { present: Record<Id, PresentSlide[]>; findings: Finding[] } {
    const present: Record<Id, PresentSlide[]> = {};
    const findings: Finding[] = [];
    for (const manifest of manifests) {
        const read = readPresent({ hub, folder: manifest.folder, equationsDir }, manifest.id);
        present[manifest.id] = read.slides;
        findings.push(...read.findings);
    }
    return { present, findings };
}

/** The deck's `equations_dir`, hub-relative, and the empty string when the deck names none. */
function equationsDirOf(deck: unknown): string {
    const held = isMap(deck) ? deck.equations_dir : undefined;
    return typeof held === 'string' ? held : '';
}

/**
 * Read the hub, check what was read, and hand back the snapshot. The three steps are the three
 * modules: the sources say what is on disk, validate says what is wrong with it, and normalise
 * turns it into the wire model with the findings carried inside it.
 */
export function buildPortfolio(hub: string, config: PortfolioConfig, version = 0): Snapshot {
    const manifests = readManifests(hub, config.scan);
    const registries = readRegistries(hub, config.registries);
    const collections = readCollections(hub, config.collections);
    const feeds = readFeeds(hub, config.feeds);
    const career = readCareer(hub, config.career);
    const present = slides(hub, manifests.manifests, equationsDirOf(config.deck));
    const deck = deckFindings(
        config.deck,
        Object.values(present.present).flatMap((list) => list.map((one) => one.id)),
        config.deckFile
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
        careerFile: join(hub, config.career)
    });
    return normalise(raw, findings, version);
}
