// Layer 1, data. The wire model: entities keyed by id, relations as id pairs, and the
// findings, all JSON-safe. Pure, like validate: no file is read, nothing is thrown, and two runs
// over one raw portfolio produce byte-identical JSON, because every map is filled in sorted id
// order and every relation table is sorted by its pair.
//
// Two rules decide what reaches the wire. An entity carries the fields data/model/ declares for it
// and no others, so the snapshot is the typed model rather than the YAML. An id that no hub of the
// workspace holds is left out of both the entity that held it and the relation table, and the
// schema check has already named it in a finding, so a view never joins against something that is
// not there; an id another hub holds is kept for the merge of the hubs to resolve.
//
// The career section is read in normalise-parts/career.ts, the relation tables are built in
// normalise-parts/links.ts, and both are handed on from here.

import { z } from 'zod';
import { compact } from './compact.ts';
import { fieldsOf } from './schema/field.ts';
import { career } from './normalise-parts/career.ts';
import { docFlags } from './normalise-parts/folder.ts';
import { retrievalOf } from './normalise-parts/retrieval.ts';
import { linked } from './normalise-parts/links.ts';
import { indexing } from './indexing.ts';
import type {
    CodeAvailability,
    Collection,
    Dataset,
    DocPresence,
    Domain,
    Entry,
    Feeds,
    Finding,
    Funding,
    Id,
    Organisation,
    Person,
    Pillar,
    Project,
    Reproduced,
    RawCollection,
    RawDeck,
    RawEntry,
    RawManifest,
    RawPortfolio,
    RawRegistryEntry,
    RepositoryBlock,
    Resource,
    SchemaField,
    Snapshot,
    HubVocabs,
    Venue
} from '../model/index.ts';
import { domainColorOf, entryIdOf, entryTitleOf } from '../model/index.ts';
import { isMap, str, strings } from '../helpers/guards.ts';
import { tierOf } from '../helpers/hub-names.ts';
import {
    followups,
    mapShape,
    readOr,
    rowsShape,
    stringItemsShape,
    subtasks
} from '../shapes/shapes.ts';

/**
 * Registry-backed collection keys. Normalise carries these both as entities and collections so
 * their dedicated views can display entities and edit the same records through collection schemas.
 * Config registration uses this list to omit their duplicate generic collection views. `funding`
 * remains a generic collection because its editable collection view is its only dedicated view.
 */
export const REGISTRY_KEYS = ['venues', 'datasets', 'pillars', 'domains', 'data'];

/** The `key` of one entry of the `collections:` list: a text with something in it. */
const collectionKeyShape = z.object({ key: z.string().min(1) }).transform((entry) => entry.key);

/** The `collections:` list as the keys it names. */
const collectionKeysShape = rowsShape(collectionKeyShape);

/** The keys of the `collections:` list that name a YAML feed's file, which is no collection. */
export const FEED_COLLECTION_KEYS = ['leads', 'radar'] as const;

/** Whether a key of the `collections:` list names a YAML feed's file. */
export function isFeedCollection(key: string): key is (typeof FEED_COLLECTION_KEYS)[number] {
    return (FEED_COLLECTION_KEYS as readonly string[]).includes(key);
}

/**
 * The keys of the `collections:` list of config/defaults/sources.yml, in the file's order, minus
 * the four that name a registry with a dedicated view and the two that name a feed's file. They
 * ship as the page's data and the page registers the collection view once per key and again on
 * every config push, so a collection is added through sources.yml and its owner catalog file; the
 * collection registration supplies its group and order.
 */
export function collectionKeys(config: Record<string, unknown>): string[] {
    const keys: string[] = [];
    for (const key of readOr(collectionKeysShape, config.collections, [])) {
        if (REGISTRY_KEYS.includes(key) || isFeedCollection(key)) continue;
        if (!keys.includes(key)) keys.push(key);
    }
    return keys;
}

/**
 * The collection keys the page registers a view for: the keys a hub of the workspace lists
 * (`HubVocab.collections`), in the merged config's order (`collectionKeys`) and then each hub's,
 * the registry and feed keys left out as there. A collection only a hub other than the primary
 * lists has its view, and a collection of the engine's list that no hub lists has none, so the
 * catalogue and the palette offer no view whose tab its pane would leave out.
 */
export function workspaceCollectionKeys(
    config: Record<string, unknown>,
    hubs: HubVocabs | null
): string[] {
    const listed = Object.values(hubs?.lists ?? {}).flatMap((vocab) => vocab.collections);
    const keys = collectionKeys(config).filter((key) => listed.includes(key));
    for (const key of listed) {
        if (REGISTRY_KEYS.includes(key) || isFeedCollection(key)) continue;
        if (!keys.includes(key)) keys.push(key);
    }
    return keys;
}

/**
 * The entity kinds the snapshot keys by id. `entities.feeds` and `entities.career` are summaries of
 * one file each rather than maps of entities, so anything counting entities skips them.
 */
export const ENTITY_KINDS = [
    'projects',
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources',
    'collections'
];

/**
 * The collection of joint work: one entry per piece of work with one person, whose `person:` field
 * is a key of the people registry. The key is named here because the relation table is built from
 * that collection and nowhere else; state/boards/collection.ts holds the same word for the client
 * side, which may not import this module.
 */
const JOINT_WORK = 'joint-work';

/** The field of a joint-work entry that names its person. */
const PERSON_FIELD = 'person';

/** A finite number: NaN and Infinity are not JSON-safe and are dropped with them. */
const numberShape = z.number();

/** A number value, or undefined. */
function num(value: unknown): number | undefined {
    return numberShape.safeParse(value).data;
}

/** A record keyed by id, filled in sorted id order, so its JSON does not depend on read order. */
export function byId<T extends { id: Id }>(items: T[]): Record<Id, T> {
    const out: Record<Id, T> = {};
    for (const item of [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
        out[item.id] = item;
    }
    return out;
}

/** An object with every undefined value dropped, or undefined when nothing was left. */
function present<T extends object>(value: T): T | undefined {
    const held = compact(value);
    return Object.keys(held).length === 0 ? undefined : held;
}

/** The code deposit, from the manifest's `code_availability` map. */
function codeAvailability(value: unknown): CodeAvailability | undefined {
    if (!isMap(value)) return undefined;
    return present<CodeAvailability>({
        status: str(value.status),
        date: str(value.date),
        url: str(value.url),
        doi: str(value.doi),
        repo: str(value.repo)
    });
}

/**
 * The repository, from the manifest's `repository` map. A manifest with no map has none. Its
 * `clones` start empty: the build that knows the repositories of the workspace fills them.
 */
function repository(value: unknown): RepositoryBlock | undefined {
    if (!isMap(value)) return undefined;
    return compact<RepositoryBlock>({
        url: str(value.url),
        visibility: str(value.visibility),
        description: str(value.description),
        homepage: str(value.homepage),
        topics: Array.isArray(value.topics) ? strings(value.topics) : undefined,
        date: str(value.date),
        clones: []
    });
}

/** The reproduction record, from the manifest's `reproduced` map. */
function reproduced(value: unknown): Reproduced | undefined {
    if (!isMap(value)) return undefined;
    return present<Reproduced>({ date: str(value.date), note: str(value.note) });
}

/** The calendar day a moment falls on, as the midnight that day is measured from. */
function dayOf(ms: number): number {
    const at = new Date(ms);
    return Date.UTC(at.getFullYear(), at.getMonth(), at.getDate());
}

/** One day, in milliseconds. */
const DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days the newest document of a folder is ahead of the folder's own project.yml. Nothing
 * when the manifest is the newer of the two, when no document is there, and when either mtime is
 * missing: a project with nothing to report carries no field at all. Both ends are taken at
 * midnight of their own day, so a manifest touched an hour before a README is not a day behind.
 */
function staleDays(found: DocPresence[] | undefined, manifest: number | undefined): number {
    if (manifest === undefined) return 0;
    const newest = (found ?? []).reduce(
        (held, doc) => (doc.present && doc.mtime > held ? doc.mtime : held),
        0
    );
    if (newest === 0) return 0;
    const lag = Math.round((dayOf(newest) - dayOf(manifest)) / DAY);
    return lag > 0 ? lag : 0;
}

/**
 * A project. Every field comes from the manifest key of the same meaning, and nothing else does.
 */
function project(
    manifest: RawManifest,
    found: DocPresence[] | undefined,
    deck: RawDeck | undefined
): Project {
    const status = readOr(mapShape, manifest.status, {});
    const domain = str(manifest.domain);
    const lag = staleDays(found, manifest.fileMtime);
    return compact({
        id: manifest.id,
        tier: tierOf(manifest.tier),
        category: str(manifest.category),
        stage: str(manifest.stage),
        form: str(manifest.form),
        title: str(manifest.title) ?? '',
        short: str(manifest.short),
        year: num(manifest.year),
        pin: manifest.pin === true ? true : undefined,
        chips: strings(status.chips),
        statusLine: str(status.line),
        priority: str(manifest.priority),
        eli5: str(manifest.eli5),
        next: str(manifest.next),
        latest: str(manifest.latest),
        results: strings(manifest.results),
        ideas: strings(manifest.ideas),
        deadline: str(manifest.deadline),
        waitingOn: strings(manifest['waiting-on']),
        followups: followups(manifest.followup),
        snooze: str(manifest.snooze),
        subtasks: subtasks(manifest.subtasks),
        doi: str(manifest.doi),
        outcome: str(manifest.outcome),
        resourceIds: strings(manifest.compute),
        codeAvailability: codeAvailability(manifest.code_availability),
        repository: repository(manifest.repository),
        reproduced: reproduced(manifest.reproduced),
        relatedIds: strings(manifest.related),
        venueId: str(manifest.venue),
        fundingIds: strings(manifest.funding),
        datasetIds: strings(manifest.datasets),
        pillarIds: strings(manifest.pillars),
        domainIds: domain === undefined ? [] : [domain],
        lead: strings(manifest.lead),
        collaborators: strings(manifest.collaborators),
        staleDays: lag > 0 ? lag : undefined,
        docs: docFlags(found),
        deck: deck?.path,
        codeFolder: manifest.codeFolder === true ? true : undefined,
        deckTags: deck !== undefined && deck.tags.length > 0 ? deck.tags : undefined,
        folder: manifest.folder,
        file: manifest.file,
        workspaceFolder: manifest.workspaceFolder,
        links: Array.isArray(manifest.links) ? strings(manifest.links) : undefined,
        tags: Array.isArray(manifest.tags) ? strings(manifest.tags) : undefined
    });
}

function venue(entry: RawRegistryEntry): Venue {
    const wos = indexing(str(entry.wos) ?? '');
    const scopus = indexing(str(entry.scopus) ?? '');
    return compact({
        id: entry.key,
        name: str(entry.name) ?? '',
        short: str(entry.short),
        tier: str(entry.tier),
        category: str(entry.category),
        jif: str(entry.jif),
        quartile: str(entry.quartile),
        wos: wos.words === '' ? undefined : wos.words,
        wosMark: wos.mark,
        scopus: scopus.words === '' ? undefined : scopus.words,
        scopusMark: scopus.mark,
        free: str(entry.free),
        format: str(entry.format),
        wants: str(entry.wants),
        link: str(entry.link),
        deadline: str(entry.deadline),
        deadlineMonth: str(entry.deadline_month),
        heldMonth: str(entry.held_month),
        timing: str(entry.timing),
        call: str(entry.call),
        email: str(entry.email),
        themes: strings(entry.themes)
    });
}

/** A dataset. `source` is the registry's URL for where the data comes from. */
function dataset(entry: RawRegistryEntry): Dataset {
    return compact({
        id: entry.key,
        name: str(entry.name) ?? '',
        modality: str(entry.modality),
        description: str(entry.description),
        size: str(entry.size),
        access: str(entry.access),
        source: str(entry.source),
        ...retrievalOf(entry.retrieval),
        path: str(entry.path),
        notes: str(entry.notes),
        themes: strings(entry.themes),
        projectIds: []
    });
}

function pillar(entry: RawRegistryEntry): Pillar {
    return compact({
        id: entry.key,
        title: str(entry.title) ?? '',
        color: str(entry.color),
        kind: str(entry.kind),
        goal: str(entry.goal),
        blurb: str(entry.blurb),
        fundingIds: [],
        projectIds: []
    });
}

/** The person key the workspace setting `self` names in a merged config, empty for none. */
export function selfKey(merged: Record<string, unknown>): string {
    return str(merged.self) ?? '';
}

/**
 * One human. `self` is true on the person whose key is `user`, the key the workspace setting `self`
 * names, and carried only then, so the wire says which person is the user and says nothing at all
 * about everybody else.
 */
function person(entry: RawRegistryEntry, user: string): Person {
    return compact({
        id: entry.key,
        name: str(entry.name) ?? '',
        affiliations: affiliationsOf(entry),
        role: str(entry.role),
        orcid: str(entry.orcid),
        email: str(entry.email),
        links: strings(entry.links),
        folder: str(entry.folder),
        self: user !== '' && entry.key === user ? true : undefined,
        projectIds: [],
        jointWorkIds: []
    });
}

/** The affiliations of a person: one key as a text, or the texts among a list. */
const affiliationsShape = z.union([
    z.string().transform((key) => (key === '' ? [] : [key])),
    stringItemsShape
]);

/** The organisation keys a person's entry names under `affiliations:`, the primary first. */
function affiliationsOf(entry: RawRegistryEntry): string[] {
    return readOr(affiliationsShape, entry.affiliations, []);
}

/** One organisation, the thing a person's `affiliations:` and a scheme's `funder:` point at. */
function organisation(entry: RawRegistryEntry): Organisation {
    return compact({
        id: entry.key,
        name: str(entry.name) ?? '',
        kind: str(entry.kind),
        country: str(entry.country),
        links: strings(entry.links),
        personIds: [],
        fundingIds: []
    });
}

/** The kinds a resource may be. */
const RESOURCE_KINDS: readonly Resource['kind'][] = ['cluster', 'machine', 'storage'];

/** The keys no resource may have: the board's NONE value and two names every object holds. */
const RESERVED_RESOURCE_KEYS = ['__none__', '__proto__', 'constructor'];

/** Why an entry of the resources registry is left out. */
type ResourceFault = 'kind' | 'reserved' | 'duplicate';

/** The kind a registry entry names, or undefined when it names none of the three. */
function resourceKind(value: unknown): Resource['kind'] | undefined {
    return RESOURCE_KINDS.find((one) => one === value);
}

/**
 * The faults of each entry of the resources registry, by position: a kind outside the three, a
 * reserved key, and a key that an earlier entry has. An entry with no key has none, since the
 * reader reports it. Normalise keeps the entries with no fault, and validate reports the rest, so
 * the two agree on which keys exist.
 */
export function resourceFaults(entries: RawRegistryEntry[]): ResourceFault[][] {
    const earlier = new Set<string>();
    return entries.map((entry) => {
        const faults: ResourceFault[] = [];
        if (entry.key.length === 0) return faults;
        if (resourceKind(entry.kind) === undefined) faults.push('kind');
        if (RESERVED_RESOURCE_KEYS.includes(entry.key)) faults.push('reserved');
        if (earlier.has(entry.key)) faults.push('duplicate');
        earlier.add(entry.key);
        return faults;
    });
}

/** The entries of the resources registry that have a key and no fault, in file order. */
export function keptResources(entries: RawRegistryEntry[]): RawRegistryEntry[] {
    const faults = resourceFaults(entries);
    return entries.filter((entry, at) => entry.key.length > 0 && faults[at]?.length === 0);
}

/** One resource, the thing a manifest's `compute:` and `slurm.resource` point at. */
function resource(entry: RawRegistryEntry, order: number): Resource {
    return compact({
        id: entry.key,
        name: str(entry.name) ?? '',
        kind: resourceKind(entry.kind) ?? 'machine',
        host: str(entry.host),
        access: str(entry.access),
        links: strings(entry.links),
        order
    });
}

/**
 * One research domain. Its colour is the entry's `color` when it is written `#rrggbb` (validate.ts
 * reports any other value), and `expectsDatasets` is its `expects_datasets: true`.
 */
function domain(entry: RawRegistryEntry): Domain {
    return compact({
        id: entry.key,
        title: str(entry.title) ?? '',
        blurb: str(entry.blurb),
        color: domainColorOf(entry),
        expectsDatasets: entry.expects_datasets === true ? true : undefined,
        projectIds: []
    });
}

/**
 * A funding scheme is known by its `key`. An entry with none, which the registry reader reports,
 * is carried under its `title`.
 */
function funding(entry: RawRegistryEntry): Funding {
    const title = str(entry.title) ?? '';
    return compact({
        id: entry.key.length > 0 ? entry.key : title,
        title,
        sub: str(entry.sub),
        status: str(entry.status),
        date: str(entry.date),
        deadline: str(entry.deadline),
        note: str(entry.note),
        statement: str(entry.statement),
        funder: str(entry.funder),
        link: str(entry.link),
        url: str(entry.url),
        snooze: str(entry.snooze),
        followups: followups(entry.followup),
        subtasks: subtasks(entry.subtasks),
        tags: strings(entry.tags),
        projectIds: [],
        pillarIds: []
    });
}

/**
 * One collection entry: its identity, and every field the YAML gave it apart from the provenance.
 */
function entry(raw: RawEntry, index: number, ident = 'title'): Entry {
    // An own `__proto__` key is skipped: assigning to it would replace the new map's prototype.
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (key !== 'provenance' && key !== '__proto__') fields[key] = value;
    }
    return {
        id: entryIdOf(fields, ident),
        title: entryTitleOf(fields, ident),
        fields,
        file: raw.provenance.file,
        index
    };
}

/**
 * The `schema:` a collection file carries, or undefined when it has none and when what it has is
 * not a list of maps naming a field and a type. It is all or nothing: half a schema would draw half
 * a record in a field order the file did not write, so a malformed one is left off whole.
 * schema/run.ts reports the case where the key is there and nothing comes back.
 */
export function collectionSchema(value: unknown): SchemaField[] | undefined {
    return fieldsOf(value);
}

function collection(raw: RawCollection): Collection {
    const schema = collectionSchema(raw.meta.schema);
    const ident = schema?.[0]?.field ?? 'title';
    return compact({
        id: raw.key,
        title: str(raw.meta.title) ?? raw.key,
        intro: str(raw.meta.intro),
        file: raw.file,
        schema,
        entries: raw.entries.map((item, index) => entry(item, index, ident))
    });
}

/**
 * Every entry of the joint-work collection that names a person, as the pair the relation is built
 * from, with the file the entry stands in. An entry with no `person:` field, or one whose value is
 * not a string, is no pair here and is a finding of validate's; it is not repaired.
 */
export function jointWorkRows(collections: Collection[]): { id: Id; person: Id; file: string }[] {
    const held = collections.find((one) => one.id === JOINT_WORK);
    const rows: { id: Id; person: Id; file: string }[] = [];
    for (const one of held?.entries ?? []) {
        const key = str(one.fields[PERSON_FIELD]);
        if (key !== undefined && key.length > 0) {
            rows.push({ id: one.id, person: key, file: one.file });
        }
    }
    return rows;
}

/**
 * The feeds, already the summary sources/documents/feeds.ts made of them. They are copied rather
 * than passed through so that the snapshot owns its own objects, which is what every other entity
 * here does.
 */
function feeds(raw: Feeds): Feeds {
    return {
        leads: raw.leads === null ? null : raw.leads.map((one) => ({ ...one })),
        radar: raw.radar === null ? null : { ...raw.radar },
        scout: raw.scout === null ? null : { ...raw.scout },
        linkedin: raw.linkedin === null ? null : { ...raw.linkedin }
    };
}

/**
 * The snapshot the socket carries. `version` is the caller's, monotonic and incremented by the
 * watcher on every rebuild; `findings` is what validate returned, carried as it stands; `merged`
 * is the hub's merged config, whose words the career's host rows take their unset status from.
 * `others` holds the keys the other hubs of the workspace hold, by source: a reference to one of
 * them is kept beside the references to the hub's own records, so the merge of the hubs
 * (hubs/merge.ts) resolves it, and a reference no hub holds is left out.
 */
export function normalise(
    raw: RawPortfolio,
    findings: Finding[],
    merged: Record<string, unknown>,
    version = 0,
    others: Readonly<Record<string, readonly string[]>> = {}
): Snapshot {
    const withId = (entries: RawRegistryEntry[]): RawRegistryEntry[] =>
        entries.filter((item) => item.key.length > 0);

    const projects = raw.manifests.map((manifest) =>
        project(manifest, raw.docs[manifest.id], raw.decks[manifest.id])
    );
    const venues = withId(raw.registries.venues.entries).map(venue);
    const datasets = withId(raw.registries.datasets.entries).map(dataset);
    const pillars = withId(raw.registries.pillars.entries).map(pillar);
    const domains = withId(raw.registries.domains.entries).map(domain);
    const schemes = raw.registries.funding.entries
        .map(funding)
        .filter((scheme) => scheme.id.length > 0);
    const user = selfKey(merged);
    const people = withId(raw.registries.people.entries).map((entry) => person(entry, user));
    const organisations = withId(raw.registries.organisations.entries).map(organisation);
    const resources = keptResources(raw.registries.resources.entries).map(resource);
    const collections = Object.keys(raw.collections).map((key) => collection(raw.collections[key]));

    const keys = (source: string, own: { id: Id }[]): Set<Id> =>
        new Set([...own.map((item) => item.id), ...(others[source] ?? [])]);
    const known: Record<string, Set<Id>> = {
        projects: keys('projects', projects),
        venues: keys('venues', venues),
        datasets: keys('datasets', datasets),
        pillars: keys('pillars', pillars),
        domains: keys('domains', domains),
        funding: keys('funding', schemes),
        people: keys('people', people),
        organisations: keys('organisations', organisations),
        resources: keys('resources', resources)
    };

    const tables = linked(
        { projects, datasets, pillars, domains, schemes, people, organisations },
        known,
        jointWorkRows(collections)
    );

    return {
        version,
        entities: {
            projects: byId(projects),
            venues: byId(venues),
            datasets: byId(datasets),
            pillars: byId(pillars),
            domains: byId(domains),
            funding: byId(schemes),
            people: byId(people),
            organisations: byId(organisations),
            resources: byId(resources),
            collections: byId(collections),
            feeds: feeds(raw.feeds),
            career: career(raw.career, merged)
        },
        relations: tables,
        findings
    };
}
