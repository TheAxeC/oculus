// Layer 1, data, pure. The facts the snapshot build's read of a hub's decks (data/index.ts
// `withDecks`) gives each project of the hub, which the project's slides fill their
// `{{project.<field>}}` from and raise their findings by. They are the facts the deck route reads
// from the merged snapshot (server/content/deck/read.ts), made the way the merge makes the project:
// each reference of the manifest resolves to the record of its own hub when that hub holds the
// key, else to the record of the one other hub of the workspace that holds it, and to none when no
// hub or two or more other hubs hold it (`resolvedId` of helpers/hub-names.ts, as merge.ts
// resolves it); the ids are then ordered and their repeats dropped by the links of the snapshot
// (`linked` of normalise-parts/links.ts); and each id is named by its record as the snapshot of
// the hub that holds it carries it (`factRecords` of normalise.ts).

import type { TextCatalog } from '../../helpers/finding-text.ts';
import { byKey, isMap } from '../../helpers/guards.ts';
import { addressOfId, hubId, resolvedId, type Holders } from '../../helpers/hub-names.ts';
import type { Id, Project, ProjectFact, RawManifest } from '../../model/index.ts';
import {
    projectFacts,
    type FactRecordKind,
    type FactRecords,
    type FactWords
} from '../../shapes/project-facts.ts';
import { manifestProject } from '../normalise.ts';
import { linked } from '../normalise-parts/links.ts';

/** One hub of the workspace by its name, with the records its project's facts can name. */
export type HubRecords = { key: string; records: FactRecords };

/** The kinds of record a project's facts name. */
const KINDS: readonly FactRecordKind[] = [
    'people',
    'pillars',
    'datasets',
    'funding',
    'venues',
    'resources',
    'domains'
];

/** What a hub's projects are read with besides the hubs' records. */
type FactsOptions = {
    /** The merged config of the hub, whose words name the vocabulary fields. */
    vocab: Record<string, unknown>;
    /** The text catalog, for the words of the code status and of reproduced. */
    catalog: TextCatalog;
    /** The words of the hub's `tiers` list, which a manifest's `tier` is read against. */
    tiers: readonly string[];
};

/**
 * The facts of each project of the hub `own`, read from its manifest, its references resolved in
 * `own` and then in `others`, the other hubs of the workspace.
 */
export function hubFacts(
    own: HubRecords,
    others: readonly HubRecords[],
    options: FactsOptions
): (manifest: RawManifest) => ProjectFact[] {
    const hubs = [own, ...others];
    const holders = {} as Record<FactRecordKind, Holders>;
    const known: Record<string, ReadonlySet<Id>> = {
        projects: new Set(),
        organisations: new Set()
    };
    for (const kind of KINDS) {
        const held = new Map<string, string[]>();
        for (const hub of hubs) {
            for (const key of Object.keys(hub.records[kind])) {
                held.set(key, [...(held.get(key) ?? []), hub.key]);
            }
        }
        holders[kind] = held;
        known[kind] = new Set(
            hubs.flatMap((hub) => Object.keys(hub.records[kind]).map((key) => hubId(hub.key, key)))
        );
    }
    const words: FactWords = {
        record: (kind, id) => {
            const { hub, key } = addressOfId(id);
            const record = byKey(hubs.find((one) => one.key === hub)?.records[kind] ?? {}, key);
            return isMap(record) ? record : undefined;
        },
        vocab: options.vocab,
        catalog: options.catalog
    };
    const ids = (kind: FactRecordKind, keys: readonly string[]): Id[] =>
        keys.flatMap((key) => {
            const id = resolvedId(holders[kind], own.key, key);
            return id === null ? [] : [id];
        });
    return (manifest) => {
        const read = manifestProject(manifest, undefined, undefined, options.tiers);
        const project: Project = {
            ...read,
            id: hubId(own.key, read.id),
            relatedIds: [],
            fundingIds: ids('funding', read.fundingIds),
            datasetIds: ids('datasets', read.datasetIds),
            pillarIds: ids('pillars', read.pillarIds),
            domainIds: ids('domains', read.domainIds),
            lead: ids('people', read.lead),
            collaborators: ids('people', read.collaborators),
            supervisors: ids('people', read.supervisors),
            resourceIds: ids('resources', read.resourceIds)
        };
        const venue =
            read.venueId === undefined ? null : resolvedId(holders.venues, own.key, read.venueId);
        if (venue === null) delete project.venueId;
        else project.venueId = venue;
        linked(
            {
                projects: [project],
                datasets: [],
                pillars: [],
                domains: [],
                schemes: [],
                people: [],
                organisations: []
            },
            known
        );
        return projectFacts(project, words);
    };
}
