// Layer 1, data. The portfolio of several hubs as one snapshot. Every hub is built on its own by
// buildPortfolioWithSchemas, with its own settings, and the builds are joined here: a record of a
// hub other than the first gets the hub's key and a colon in front of its id, and in front of every
// id its fields and the relation tables hold, so no two ids collide and no reference can name a
// record of another hub. The ids are prefixed once each hub is built, which is what makes a
// reference resolve inside its hub only: a value the hub cannot resolve is the finding it would be
// were the hub the only one. Every record then says which hub it came from in `root`.
//
// With no hub beyond the first the snapshot is returned as the build made it, so a portfolio of one
// hub is exactly that build's snapshot. The career, the website and the portfolio deck are the
// first hub's alone: a second hub's career is dropped here, and the feeds summary is the two hubs'
// leads together with the latest run dates.

import { HUB_ROOT } from '../../helpers/hub-names.ts';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import type {
    Collection,
    Entities,
    Entry,
    Feeds,
    FeedItem,
    Finding,
    Id,
    RegistryName,
    Relations,
    Rooted,
    SideProject,
    Snapshot
} from '../../model/index.ts';
import { byId, pairs } from '../normalise.ts';
import { sortFindings } from '../validate.ts';
import { throughSchema, type Reach } from './references.ts';

/** One hub's own build, and the key of the `roots:` entry it was built from. */
export type HubSnapshot = { key: string; snapshot: Snapshot };

/** A hub other than the first: its build, and the absolute path of its people file. */
type OtherHub = HubSnapshot & { peopleFile: string };

/** The registry entities of the first hub, each kind with the file its records are read from. */
export type FirstHub = {
    snapshot: Snapshot;
    /**
     * The absolute path of each registry file, which names a first-hub id that begins like a hub.
     */
    registryFiles: Record<RegistryName, string>;
    /** The entries of the first hub's feeds, each with the id a write names it by. */
    feedItems: FeedItem[];
};

/** The id with the hub's key in front of it. */
function prefixer(key: string): (id: Id) => Id {
    return (id) => `${key}:${id}`;
}

/** The records of one kind, each passed through `fix`, under the ids `fix` gave them. */
function rekeyed<T extends { id: Id }>(table: Record<Id, T>, fix: (one: T) => T): Record<Id, T> {
    return byId(Object.values(table).map(fix));
}

/** The records of one kind of the first hub, each marked as the first hub's. */
function marked<T extends { id: Id } & Rooted>(table: Record<Id, T>): Record<Id, T> {
    return rekeyed(table, (one) => ({ ...one, root: HUB_ROOT }));
}

/** An optional list a side project may hold, prefixed when it is there. */
function sideLists(put: (id: Id) => Id, one: SideProject): Partial<SideProject> {
    const out: Partial<SideProject> = {};
    if (one.waitingOn !== undefined) out.waitingOn = one.waitingOn.map(put);
    if (one.relatedIds !== undefined) out.relatedIds = one.relatedIds.map(put);
    if (one.collaborators !== undefined) out.collaborators = one.collaborators.map(put);
    return out;
}

/** Whether the hub's entities of a `from:` source hold a record under the id. */
function holds(entities: Entities, source: string, id: Id): boolean {
    const tables: Record<string, Record<Id, unknown>> = {
        projects: entities.projects,
        venues: entities.venues,
        datasets: entities.datasets,
        pillars: entities.pillars,
        domains: entities.domains,
        funding: entities.funding,
        people: entities.people,
        organisations: entities.organisations,
        resources: entities.resources
    };
    return Object.hasOwn(tables, source) && Object.hasOwn(tables[source], id);
}

/**
 * A collection of a hub, its id and the id of each entry prefixed, and in each entry the value of
 * every field that names a record of the hub (a `from:` of the file's schema): a value the schema
 * holds to the source's keys is prefixed whatever it says, so one the hub cannot resolve stays the
 * hub's finding and never reads as a record of another hub, and a value of a free text field is
 * prefixed when the hub holds a record of that id and kept as the words it is otherwise.
 */
function collectionOf(
    put: (id: Id) => Id,
    key: string,
    one: Collection,
    entities: Entities
): Collection {
    const reach: Reach = (value, sources, held) =>
        value !== '' && (held || sources.some((source) => holds(entities, source, value)))
            ? put(value)
            : value;
    const entries = one.entries.map((entry: Entry) => ({
        ...entry,
        id: put(entry.id),
        fields:
            one.schema === undefined
                ? entry.fields
                : throughSchema(one.schema, entry.fields, reach),
        root: key
    }));
    return { ...one, id: put(one.id), entries, root: key };
}

/** A relation table with both ends of each pair prefixed. */
function tableOf(put: (id: Id) => Id, table: [Id, Id][]): [Id, Id][] {
    return table.map(([from, to]) => [put(from), put(to)]);
}

/** The entities of a hub other than the first, every id prefixed and every record marked. */
function entitiesOf(key: string, entities: Entities, peopleFile: string): Entities {
    const put = prefixer(key);
    const own = { root: key };
    return {
        projects: rekeyed(entities.projects, (one) => ({
            ...one,
            ...own,
            id: put(one.id),
            relatedIds: one.relatedIds.map(put),
            waitingOn: one.waitingOn.map(put),
            fundingIds: one.fundingIds.map(put),
            datasetIds: one.datasetIds.map(put),
            pillarIds: one.pillarIds.map(put),
            domainIds: one.domainIds.map(put),
            collaborators: one.collaborators.map(put),
            resourceIds: one.resourceIds.map(put),
            ...(one.venueId === undefined ? {} : { venueId: put(one.venueId) })
        })),
        venues: rekeyed(entities.venues, (one) => ({ ...one, ...own, id: put(one.id) })),
        datasets: rekeyed(entities.datasets, (one) => ({
            ...one,
            ...own,
            id: put(one.id),
            projectIds: one.projectIds.map(put)
        })),
        pillars: rekeyed(entities.pillars, (one) => ({
            ...one,
            ...own,
            id: put(one.id),
            fundingIds: one.fundingIds.map(put),
            projectIds: one.projectIds.map(put)
        })),
        domains: rekeyed(entities.domains, (one) => ({
            ...one,
            ...own,
            id: put(one.id),
            projectIds: one.projectIds.map(put)
        })),
        funding: rekeyed(entities.funding, (one) => ({
            ...one,
            ...own,
            id: put(one.id),
            projectIds: one.projectIds.map(put),
            pillarIds: one.pillarIds.map(put),
            ...(one.funder === undefined ? {} : { funder: put(one.funder) })
        })),
        people: rekeyed(entities.people, (one) => ({
            ...one,
            ...own,
            file: peopleFile,
            id: put(one.id),
            affiliations: one.affiliations.map(put),
            projectIds: one.projectIds.map(put),
            jointWorkIds: one.jointWorkIds.map(put)
        })),
        organisations: rekeyed(entities.organisations, (one) => ({
            ...one,
            ...own,
            id: put(one.id),
            personIds: one.personIds.map(put),
            fundingIds: one.fundingIds.map(put)
        })),
        resources: rekeyed(entities.resources, (one) => ({ ...one, ...own, id: put(one.id) })),
        collections: rekeyed(entities.collections, (one) => collectionOf(put, key, one, entities)),
        personal: rekeyed(entities.personal, (one) => ({
            ...one,
            ...own,
            ...sideLists(put, one),
            id: put(one.id)
        })),
        feeds: entities.feeds,
        career: null
    };
}

/** The relation tables of a hub other than the first, every pair prefixed. */
function relationsOf(key: string, tables: Relations): Relations {
    const put = prefixer(key);
    return {
        projectVenue: tableOf(put, tables.projectVenue),
        projectFunding: tableOf(put, tables.projectFunding),
        projectDataset: tableOf(put, tables.projectDataset),
        projectPillar: tableOf(put, tables.projectPillar),
        projectDomain: tableOf(put, tables.projectDomain),
        projectRelated: tableOf(put, tables.projectRelated),
        fundingPillar: tableOf(put, tables.fundingPillar),
        projectPerson: tableOf(put, tables.projectPerson),
        jointWorkPerson: tableOf(put, tables.jointWorkPerson),
        personOrganisation: tableOf(put, tables.personOrganisation),
        fundingOrganisation: tableOf(put, tables.fundingOrganisation)
    };
}

/** The later of two ISO dates, where either may be missing. */
function later(one: string | null, other: string | null): string | null {
    if (one === null) return other;
    if (other === null) return one;
    return one >= other ? one : other;
}

/**
 * The feeds summary of two hubs: their live leads together and the latest run dates of each feed.
 */
function feedsOf(first: Feeds, key: string, other: Feeds): Feeds {
    const leads =
        first.leads === null && other.leads === null
            ? null
            : [
                  ...(first.leads ?? []),
                  ...(other.leads ?? []).map((lead) => ({ ...lead, root: key }))
              ];
    return {
        leads,
        radar:
            first.radar === null && other.radar === null
                ? null
                : { lastRun: later(first.radar?.lastRun ?? null, other.radar?.lastRun ?? null) },
        scout:
            first.scout === null && other.scout === null
                ? null
                : { lastRun: later(first.scout?.lastRun ?? null, other.scout?.lastRun ?? null) },
        linkedin:
            first.linkedin === null && other.linkedin === null
                ? null
                : {
                      lastPost: later(
                          first.linkedin?.lastPost ?? null,
                          other.linkedin?.lastPost ?? null
                      )
                  }
    };
}

/** The tables of the two builds as one table each, sorted and without a pair twice. */
function joined(first: Relations, others: Relations[]): Relations {
    const out = { ...first };
    for (const name of Object.keys(first) as (keyof Relations)[]) {
        out[name] = pairs([...first[name], ...others.flatMap((one) => one[name])]);
    }
    return out;
}

/**
 * A finding for every id of the first hub that begins with the key of a hub root and a colon: the
 * merged portfolio could not tell such a record, or a lead, a Lit Watch entry or a LinkedIn post,
 * from one of that hub. A record is named by the file it is read from.
 */
function ambiguousIds(first: FirstHub, keys: readonly string[], text: TextCatalog): Finding[] {
    const found: Finding[] = [];
    const note = (id: Id, file: string): void => {
        const key = keys.find((one) => id.startsWith(`${one}:`));
        if (key === undefined) return;
        found.push({
            file,
            key: id,
            message: findingText(text, 'findings.hubs.id_prefix', id, key)
        });
    };
    const { entities } = first.snapshot;
    for (const one of Object.values(entities.projects)) note(one.id, one.file);
    for (const one of Object.values(entities.personal)) note(one.id, one.file);
    for (const one of Object.values(entities.collections)) {
        note(one.id, one.file);
        for (const entry of one.entries) note(entry.id, one.file);
    }
    const registries: [RegistryName, Record<Id, unknown>][] = [
        ['venues', entities.venues],
        ['datasets', entities.datasets],
        ['pillars', entities.pillars],
        ['domains', entities.domains],
        ['funding', entities.funding],
        ['people', entities.people],
        ['organisations', entities.organisations],
        ['resources', entities.resources]
    ];
    for (const [name, table] of registries) {
        for (const id of Object.keys(table)) note(id, first.registryFiles[name]);
    }
    for (const item of first.feedItems) note(item.id, item.file);
    return found;
}

/**
 * The portfolio of the first hub and of every hub built beside it, as one snapshot of the first
 * hub's version. `text` is the first hub's catalog, which words the findings of the merge. With no
 * other hub the first hub's snapshot is returned as it is.
 */
export function mergeHubs(
    first: FirstHub,
    others: readonly OtherHub[],
    text: TextCatalog
): Snapshot {
    if (others.length === 0) return first.snapshot;
    const base = first.snapshot;
    const prefixed = others.map((one) => ({
        key: one.key,
        entities: entitiesOf(one.key, one.snapshot.entities, one.peopleFile),
        relations: relationsOf(one.key, one.snapshot.relations),
        findings: one.snapshot.findings
    }));
    const kinds = [
        'projects',
        'venues',
        'datasets',
        'pillars',
        'domains',
        'funding',
        'people',
        'organisations',
        'resources',
        'collections',
        'personal'
    ] as const;
    const entities = { ...base.entities };
    entities.projects = marked(base.entities.projects);
    entities.venues = marked(base.entities.venues);
    entities.datasets = marked(base.entities.datasets);
    entities.pillars = marked(base.entities.pillars);
    entities.domains = marked(base.entities.domains);
    entities.funding = marked(base.entities.funding);
    entities.people = marked(base.entities.people);
    entities.organisations = marked(base.entities.organisations);
    entities.resources = marked(base.entities.resources);
    entities.collections = rekeyed(base.entities.collections, (one) => ({
        ...one,
        root: HUB_ROOT,
        entries: one.entries.map((entry) => ({ ...entry, root: HUB_ROOT }))
    }));
    entities.personal = marked(base.entities.personal);
    for (const one of prefixed) {
        for (const kind of kinds) {
            Object.assign(entities[kind], one.entities[kind]);
        }
        entities.feeds = feedsOf(entities.feeds, one.key, one.entities.feeds);
    }
    for (const kind of kinds) {
        entities[kind] = byId(Object.values(entities[kind]) as { id: Id }[]) as never;
    }
    const keys = others.map((one) => one.key);
    return {
        version: base.version,
        entities,
        relations: joined(
            base.relations,
            prefixed.map((one) => one.relations)
        ),
        findings: sortFindings([
            ...base.findings,
            ...ambiguousIds(first, keys, text),
            ...prefixed.flatMap((one) => one.findings)
        ])
    };
}
