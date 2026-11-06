// Layer 1, data, pure. The projects of a hub as the merge of the hubs makes them, for the snapshot
// build's read of the hub's decks (sources/documents/decks.ts, called by `withDecks` of
// data/index.ts), which reads them through the same deck module the deck route reads the merged
// snapshot's projects through, so the two give a deck the same projects, domains and facts.
//
// Each project is read from its manifest (`manifestProject` of normalise.ts) and given the
// internal id `<hub>:<key>` and its hub's name in `root`. Each reference a deck reads (the domain,
// the people, the pillars, the datasets, the funding, the venue, the compute) resolves to the
// record of its own hub when that hub holds the key, else to the record of the one other hub of
// the workspace that holds it, and to none when no hub or two or more other hubs hold it
// (`resolvedId` of helpers/hub-names.ts, as merge.ts resolves it); the ids are then ordered and
// their repeats dropped by the links of the snapshot (`linked` of normalise-parts/links.ts). The
// related projects are left empty and `waiting-on` as the manifest writes it, since no deck reads
// them. The words name each id by its record as the snapshot of the hub that holds it carries it
// (`factRecords` of normalise.ts).

import { byKey, isMap } from '../../helpers/guards.ts';
import { addressOfId, hubId, resolvedId, type Holders } from '../../helpers/hub-names.ts';
import type { Id, PortfolioConfig, Project, RawManifest } from '../../model/index.ts';
import type { FactRecordKind, FactRecords, FactWords } from '../../shapes/project-facts.ts';
import { vocabKeys } from '../../shapes/vocab-keys.ts';
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

/** A hub's projects as the merge makes them, with the words their facts name records by. */
type HubProjects = {
    /** The projects of the hub, in the order of its manifests. */
    projects: Project[];
    /** The words their facts name the records of the hubs by. */
    words: FactWords;
};

/**
 * The projects of the hub `own`, read from its manifests with the settings `config` of the hub,
 * each reference resolved in `own` and then in `others`, the other hubs of the workspace.
 */
export function hubProjects(
    manifests: readonly RawManifest[],
    own: HubRecords,
    others: readonly HubRecords[],
    config: Pick<PortfolioConfig, 'merged' | 'text'>
): HubProjects {
    const hubs = [own, ...others];
    const tiers = vocabKeys(config.merged.tiers);
    // The hubs that hold each key of each kind: `own` first, then `others` in the order given.
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
        vocab: config.merged,
        catalog: config.text
    };
    const ids = (kind: FactRecordKind, keys: readonly string[]): Id[] =>
        keys.flatMap((key) => {
            const id = resolvedId(holders[kind], own.key, key);
            return id === null ? [] : [id];
        });
    const projects = manifests.map((manifest) => {
        const read = manifestProject(manifest, undefined, undefined, tiers);
        const project: Project = {
            ...read,
            root: own.key,
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
        return project;
    });
    linked(
        {
            projects,
            datasets: [],
            pillars: [],
            domains: [],
            schemes: [],
            people: [],
            organisations: []
        },
        known
    );
    return { projects, words };
}
