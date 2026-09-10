// Layer 1, data. The entry point: read, validate, normalise, and nothing else. Composition only,
// so the order of the three steps is the whole content of this file and every rule lives in the
// module it belongs to.
//
// Server side only, because the sources read the filesystem. What comes back is JSON-safe and is
// what the socket carries; the caller owns the version number and increments it on every rebuild.

import { readManifests } from './sources/manifests.ts';
import { REGISTRY_FILES, readRegistries } from './sources/registries.ts';
import { readCollections } from './sources/collections.ts';
import { normalise } from './normalise.ts';
import { validate } from './validate.ts';
import type {
    CollectionFile,
    PortfolioConfig,
    RawPortfolio,
    RegistryFiles,
    ScanRule,
    Snapshot,
    Vocabulary
} from './model.ts';

function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
export function portfolioConfigFrom(merged: Record<string, unknown>): PortfolioConfig {
    const path = (key: string, fallback: string): string =>
        typeof merged[key] === 'string' ? (merged[key] as string) : fallback;
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

    return {
        scan: scanRules(merged.scan),
        registries,
        collections,
        schema: merged.manifest_schema,
        vocab
    };
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

    const raw: RawPortfolio = {
        manifests: manifests.manifests,
        registries,
        collections: collections.collections,
        findings: [...manifests.findings, ...registries.findings, ...collections.findings]
    };

    const findings = validate(raw, { schema: config.schema, vocab: config.vocab });
    return normalise(raw, findings, version);
}

/**
 * The hub's configuration as it stands on 2026-09-10, typed by hand. O5 copies the cockpit's config
 * files into config/ and portfolioConfigFrom(loadConfig()) replaces this; until then it is what the
 * integrity test and the probe build the real portfolio from, and it is deleted with that step.
 *
 * The values are the layout config's `scan:` and `collections:`, the four `*_file` keys, the 45
 * field names of manifest-schema.yml, and the keys of vocab.yml's `type_color`, `status_palette`
 * and `status_legend`.
 */
export const HUB_CONFIG_TODAY: PortfolioConfig = {
    scan: [
        { dir: 'projects/ideas', type: 'idea' },
        { dir: 'projects/active', type: 'active' },
        { dir: 'projects/manuscripts', type: 'manuscript' },
        { dir: 'projects/coauthor', nested: true },
        { dir: 'projects/archive', nested: true }
    ],
    registries: {
        venues: 'registries/venues.yml',
        datasets: 'registries/data.yml',
        programs: 'registries/programs.yml',
        domains: 'registries/domains.yml',
        funding: 'funding/funding.yml'
    },
    collections: [
        { key: 'statements', file: 'registries/boilerplate.yml' },
        { key: 'funding', file: 'funding/funding.yml' },
        { key: 'events', file: 'network/events.yml' },
        { key: 'education', file: 'education/education.yml' },
        { key: 'applications', file: 'applications/applications.yml' },
        { key: 'collaborations', file: 'network/collaborations.yml' },
        { key: 'tasks', file: 'tasks/tasks.yml' },
        { key: 'code', file: 'registries/repos.yml' }
    ],
    schema: [
        'id',
        'tier',
        'type',
        'short',
        'title',
        'lead',
        'authors',
        'status.chips',
        'status.line',
        'focus',
        'priority',
        'pin',
        'venue_id',
        'year',
        'eli5',
        'next',
        'latest',
        'results',
        'ideas',
        'domain',
        'program',
        'funding',
        'collaborators',
        'waiting-on',
        'related',
        'datasets',
        'deadline',
        'followup.do',
        'followup.after',
        'snooze',
        'code_availability.status',
        'code_availability.date',
        'code_availability.url',
        'code_availability.doi',
        'code_availability.repo',
        'code_availability.description',
        'code_availability.homepage',
        'code_availability.topics',
        'code_availability.visibility',
        'compute',
        'reproduced.date',
        'reproduced.note',
        'outcome',
        'doi',
        'paths'
    ],
    vocab: {
        types: [
            'active',
            'manuscript',
            'idea',
            'published',
            'submitted',
            'in-prep',
            'tech-report',
            'software',
            'abandoned',
            'nogo',
            'dropped',
            'disproved',
            'exploring',
            'phd'
        ],
        statuses: [
            'planned',
            'in-prep',
            'in prep',
            'preparing',
            'draft',
            'submitted',
            'revision',
            'pending',
            'under-review',
            'under review',
            'upcoming',
            'exploring',
            'active',
            'collaborator',
            'todo',
            'doing',
            'ongoing',
            'completed',
            'published',
            'done',
            'awarded',
            'granted',
            'accepted',
            'contributing',
            'rejected',
            'not funded',
            'declined',
            'dropped',
            'withdrawn',
            'not applied',
            'not-applied',
            'not attending',
            'not-attending',
            'cancelled',
            'canceled',
            'past',
            'skipped',
            'passed',
            'ready',
            'finished',
            'archived',
            'applied'
        ],
        chips: [
            'submit-ready',
            'submitted',
            'revision',
            'accepted',
            'published',
            'in-prep',
            'abandoned',
            'tech-report',
            'software',
            'coauthor',
            'lead',
            'phd',
            'nogo',
            'dropped',
            'disproved',
            'results-positive',
            'admin-prep',
            'numbers-pending',
            'ai-tells',
            'blocked',
            'exploring',
            'parked',
            'journal',
            'conference',
            'thesis',
            'abstract',
            'poster'
        ]
    }
};
