// Layer 1, data. The wire model of DESIGN.md: entities keyed by id, relations as id pairs, and the
// findings, all JSON-safe. Pure, like validate: no file is read, nothing is thrown, and two runs
// over one raw portfolio produce byte-identical JSON, because every map is filled in sorted id
// order and every relation table is sorted by its pair.
//
// Two rules decide what reaches the wire. An entity carries the fields model.ts declares for it and
// no others, so the snapshot is the typed model rather than the YAML. An id that names nothing is
// left out of both the entity that held it and the relation table, and validate has already named
// it in a finding, so a view never joins against something that is not there.

import type {
    CodeAvailability,
    Collection,
    Dataset,
    DocFlag,
    DocPresence,
    Domain,
    Entry,
    Finding,
    Followup,
    Funding,
    Id,
    Program,
    Project,
    Reproduced,
    RawCollection,
    RawEntry,
    RawManifest,
    RawPortfolio,
    RawRegistryEntry,
    Relations,
    SchemaField,
    Snapshot,
    Subtask,
    Tier,
    Venue
} from './model.ts';

/** Collection keys that name a registry the snapshot already carries; reading both would double it. */
export const REGISTRY_KEYS = ['venues', 'datasets', 'programs', 'domains', 'funding'];

function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A string value, or undefined when the key held anything else. */
function str(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

/** A number value, or undefined. NaN and Infinity are not JSON-safe and are dropped with them. */
function num(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** The strings of a list; a value that is not a list, and any element that is not a string, is not one. */
function strings(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

/** Drop the keys whose value is undefined, so the object survives JSON round-tripping unchanged. */
function compact<T extends object>(value: T): T {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        if (record[key] === undefined) delete record[key];
    }
    return value;
}

/** A record keyed by id, filled in sorted id order, so its JSON does not depend on read order. */
function byId<T extends { id: Id }>(items: T[]): Record<Id, T> {
    const out: Record<Id, T> = {};
    for (const item of [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
        out[item.id] = item;
    }
    return out;
}

/** Unique pairs, sorted by the first id then the second. */
function pairs(found: [Id, Id][]): [Id, Id][] {
    const seen = new Set<string>();
    const out: [Id, Id][] = [];
    for (const pair of found) {
        const token = `${pair[0]}\0${pair[1]}`;
        if (seen.has(token)) continue;
        seen.add(token);
        out.push(pair);
    }
    return out.sort((a, b) => (a[0] !== b[0] ? (a[0] < b[0] ? -1 : 1) : a[1] < b[1] ? -1 : 1));
}

/** The second id of every pair whose first is `from`, in the table's own order. */
function targets(table: [Id, Id][], from: Id): Id[] {
    return table.filter((pair) => pair[0] === from).map((pair) => pair[1]);
}

/** The first id of every pair whose second is `to`, in the table's own order. */
function sources(table: [Id, Id][], to: Id): Id[] {
    return table.filter((pair) => pair[1] === to).map((pair) => pair[0]);
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

/** The reproduction record, from the manifest's `reproduced` map. */
function reproduced(value: unknown): Reproduced | undefined {
    if (!isMap(value)) return undefined;
    return present<Reproduced>({ date: str(value.date), note: str(value.note) });
}

/** The documents of one folder, without the absolute path the presence check carries. */
function docs(found: DocPresence[] | undefined): DocFlag[] {
    return (found ?? []).map((doc) => ({ name: doc.name, present: doc.present }));
}

/**
 * The `followup:` notes of a manifest or of a collection entry. The key holds one note as a string,
 * one as a `{ do, after }` map, or a list of either; all three arrive here as a list. A note with no
 * `do` is dropped in silence, the way str() drops a value of the wrong type.
 */
export function followups(value: unknown): Followup[] {
    const items = Array.isArray(value) ? value : [value];
    const out: Followup[] = [];
    for (const item of items) {
        const text = typeof item === 'string' ? item : isMap(item) ? str(item.do) : undefined;
        if (text === undefined || text.trim() === '') continue;
        const after = isMap(item) ? str(item.after) : undefined;
        out.push(compact({ do: text, after }));
    }
    return out;
}

/**
 * The `subtasks:` checklist of a manifest or of a collection entry. The key holds a map of key to
 * line or a list of lines, and a line is a string or a `{ do, deadline, done, snooze }` map. The
 * key a line is addressed by is the map's own key, or the position for a list, so a write knows
 * which line it means whatever shape the file is written in.
 */
export function subtasks(value: unknown): Subtask[] {
    const rows: [string, unknown][] = Array.isArray(value)
        ? value.map((item, at) => [String(at), item])
        : isMap(value)
          ? Object.entries(value)
          : [];
    const out: Subtask[] = [];
    for (const [key, item] of rows) {
        const text = typeof item === 'string' ? item : isMap(item) ? str(item.do) : undefined;
        if (text === undefined || text.trim() === '') continue;
        out.push(
            compact({
                key,
                do: text,
                deadline: isMap(item) ? str(item.deadline) : undefined,
                done: isMap(item) && item.done === true,
                snooze: isMap(item) ? str(item.snooze) : undefined
            })
        );
    }
    return out;
}

/** A project. Every field comes from the manifest key of the same meaning, and nothing else does. */
function project(manifest: RawManifest, found: DocPresence[] | undefined): Project {
    const status = isMap(manifest.status) ? manifest.status : {};
    const authors = manifest.authors;
    const domain = str(manifest.domain);
    return compact({
        id: manifest.id,
        tier: manifest.tier as Tier,
        category: str(manifest.category),
        type: str(manifest.type),
        title: str(manifest.title) ?? '',
        short: str(manifest.short),
        lead: str(manifest.lead),
        authors:
            typeof authors === 'string'
                ? authors
                : Array.isArray(authors)
                  ? strings(authors)
                  : undefined,
        year: num(manifest.year),
        pin: manifest.pin === true ? true : undefined,
        chips: strings(status.chips),
        statusLine: str(status.line),
        focus: str(manifest.focus),
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
        compute: str(manifest.compute),
        codeAvailability: codeAvailability(manifest.code_availability),
        reproduced: reproduced(manifest.reproduced),
        relatedIds: strings(manifest.related),
        venueId: str(manifest.venue_id),
        fundingIds: strings(manifest.funding),
        datasetIds: strings(manifest.datasets),
        programIds: strings(manifest.program),
        domainIds: domain === undefined ? [] : [domain],
        collaborators: strings(manifest.collaborators),
        venue: str(manifest.venue),
        docs: docs(found),
        folder: manifest.folder,
        file: manifest.file
    });
}

function venue(entry: RawRegistryEntry): Venue {
    return compact({
        id: entry.key,
        name: str(entry.name) ?? '',
        short: str(entry.short),
        tier: str(entry.tier),
        category: str(entry.category),
        jif: str(entry.jif),
        quartile: str(entry.quartile),
        wos: str(entry.wos),
        scopus: str(entry.scopus),
        free: str(entry.free),
        format: str(entry.format),
        wants: str(entry.wants),
        link: str(entry.link),
        deadline: str(entry.deadline),
        deadlineMonth: str(entry.deadline_month),
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
        retrieval: isMap(entry.retrieval) ? entry.retrieval : undefined,
        hpcPath: str(entry.hpc_path),
        themes: strings(entry.themes),
        projectIds: []
    });
}

function program(entry: RawRegistryEntry): Program {
    return compact({
        id: entry.key,
        title: str(entry.title) ?? '',
        kind: str(entry.kind),
        goal: str(entry.goal),
        blurb: str(entry.blurb),
        fundingIds: [],
        projectIds: []
    });
}

function domain(entry: RawRegistryEntry): Domain {
    return compact({
        id: entry.key,
        title: str(entry.title) ?? '',
        blurb: str(entry.blurb),
        projectIds: []
    });
}

/** A funding scheme is known by its `key` when it has one and by its `title` otherwise. */
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
        link: str(entry.link),
        url: str(entry.url),
        snooze: str(entry.snooze),
        followups: followups(entry.followup),
        subtasks: subtasks(entry.subtasks),
        tags: strings(entry.tags),
        projectIds: [],
        programIds: []
    });
}

/** One collection entry: its identity, and every field the YAML gave it apart from the provenance. */
function entry(raw: RawEntry, index: number): Entry {
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (key !== 'source') fields[key] = value;
    }
    const title = str(raw.title) ?? '';
    const key = str(raw.key);
    return {
        id: key !== undefined && key.length > 0 ? key : title,
        title,
        fields,
        file: raw.source.file,
        index
    };
}

/**
 * The `schema:` a collection file carries, or undefined when it has none and when what it has is
 * not a list of maps naming a field and a type. It is all or nothing: half a schema would draw half
 * a record in a field order the file did not write, so a malformed one is left off whole. validate.ts
 * calls this as well and reports the case where the key is there and nothing comes back.
 */
export function collectionSchema(value: unknown): SchemaField[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const fields: SchemaField[] = [];
    for (const item of value) {
        if (!isMap(item)) return undefined;
        const name = str(item.field);
        const type = str(item.type);
        if (name === undefined || type === undefined) return undefined;
        fields.push(
            compact({
                field: name,
                type,
                label: str(item.label),
                options: item.options === undefined ? undefined : strings(item.options),
                required: typeof item.required === 'boolean' ? item.required : undefined,
                help: str(item.help)
            })
        );
    }
    return fields;
}

function collection(raw: RawCollection): Collection {
    return compact({
        id: raw.key,
        title: str(raw.meta.title) ?? raw.key,
        intro: str(raw.meta.intro),
        file: raw.file,
        schema: collectionSchema(raw.meta.schema),
        entries: raw.entries.map(entry)
    });
}

/**
 * The relation tables. A pair is written only when both ends are entities of the snapshot, so a
 * dangling id (which validate has reported) reaches no table and no entity's id list.
 *
 * `fundingProgram` is the one table with no field behind it: programs.yml carries no funding key,
 * its `funding:` is prose, so a scheme and a research line are related here when at least one
 * project names them both.
 */
function relations(projects: Project[], entities: Record<string, Set<Id>>): Relations {
    const venueTable: [Id, Id][] = [];
    const fundingTable: [Id, Id][] = [];
    const datasetTable: [Id, Id][] = [];
    const programTable: [Id, Id][] = [];
    const domainTable: [Id, Id][] = [];
    const relatedTable: [Id, Id][] = [];
    const fundingProgram: [Id, Id][] = [];

    for (const item of projects) {
        if (item.venueId !== undefined && entities.venues.has(item.venueId)) {
            venueTable.push([item.id, item.venueId]);
        }
        for (const id of item.fundingIds) {
            if (entities.funding.has(id)) fundingTable.push([item.id, id]);
        }
        for (const id of item.datasetIds) {
            if (entities.datasets.has(id)) datasetTable.push([item.id, id]);
        }
        for (const id of item.programIds) {
            if (entities.programs.has(id)) programTable.push([item.id, id]);
        }
        for (const id of item.domainIds) {
            if (entities.domains.has(id)) domainTable.push([item.id, id]);
        }
        for (const id of item.relatedIds) {
            if (entities.projects.has(id)) relatedTable.push([item.id, id]);
        }
        for (const fund of item.fundingIds) {
            if (!entities.funding.has(fund)) continue;
            for (const line of item.programIds) {
                if (entities.programs.has(line)) fundingProgram.push([fund, line]);
            }
        }
    }

    return {
        projectVenue: pairs(venueTable),
        projectFunding: pairs(fundingTable),
        projectDataset: pairs(datasetTable),
        projectProgram: pairs(programTable),
        projectDomain: pairs(domainTable),
        projectRelated: pairs(relatedTable),
        fundingProgram: pairs(fundingProgram)
    };
}

/**
 * The snapshot the socket carries. `version` is the caller's, monotonic and incremented by the
 * watcher on every rebuild; `findings` is what validate returned, carried as it stands.
 */
export function normalise(raw: RawPortfolio, findings: Finding[], version = 0): Snapshot {
    const withId = (entries: RawRegistryEntry[]): RawRegistryEntry[] =>
        entries.filter((item) => item.key.length > 0);

    const projects = raw.manifests.map((manifest) => project(manifest, raw.docs[manifest.id]));
    const venues = withId(raw.registries.venues.entries).map(venue);
    const datasets = withId(raw.registries.datasets.entries).map(dataset);
    const programs = withId(raw.registries.programs.entries).map(program);
    const domains = withId(raw.registries.domains.entries).map(domain);
    const schemes = raw.registries.funding.entries
        .map(funding)
        .filter((scheme) => scheme.id.length > 0);
    const collections = Object.keys(raw.collections)
        .filter((key) => !REGISTRY_KEYS.includes(key))
        .map((key) => collection(raw.collections[key]));

    const known: Record<string, Set<Id>> = {
        projects: new Set(projects.map((item) => item.id)),
        venues: new Set(venues.map((item) => item.id)),
        datasets: new Set(datasets.map((item) => item.id)),
        programs: new Set(programs.map((item) => item.id)),
        domains: new Set(domains.map((item) => item.id)),
        funding: new Set(schemes.map((item) => item.id))
    };

    const tables = relations(projects, known);

    for (const item of projects) {
        item.relatedIds = targets(tables.projectRelated, item.id);
        item.fundingIds = targets(tables.projectFunding, item.id);
        item.datasetIds = targets(tables.projectDataset, item.id);
        item.programIds = targets(tables.projectProgram, item.id);
        item.domainIds = targets(tables.projectDomain, item.id);
        if (item.venueId !== undefined && !known.venues.has(item.venueId)) delete item.venueId;
    }
    for (const item of datasets) item.projectIds = sources(tables.projectDataset, item.id);
    for (const item of domains) item.projectIds = sources(tables.projectDomain, item.id);
    for (const item of programs) {
        item.projectIds = sources(tables.projectProgram, item.id);
        item.fundingIds = sources(tables.fundingProgram, item.id);
    }
    for (const item of schemes) {
        item.projectIds = sources(tables.projectFunding, item.id);
        item.programIds = targets(tables.fundingProgram, item.id);
    }

    return {
        version,
        entities: {
            projects: byId(projects),
            venues: byId(venues),
            datasets: byId(datasets),
            programs: byId(programs),
            domains: byId(domains),
            funding: byId(schemes),
            collections: byId(collections)
        },
        relations: tables,
        findings
    };
}
