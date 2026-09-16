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
    Career,
    CodeAvailability,
    Collection,
    Dataset,
    DocFlag,
    DocPresence,
    Domain,
    Entry,
    Feeds,
    Finding,
    Followup,
    Funding,
    Host,
    Id,
    Organisation,
    Person,
    PresentSlide,
    Pillar,
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
    Venue
} from './model.ts';
import { isMap, str, strings } from './guards.ts';

/**
 * Registry-backed collection keys. Normalise carries these both as entities and collections so
 * their dedicated views can display entities and edit the same records through collection schemas.
 * Config registration uses this list to omit their duplicate generic collection views. `funding`
 * remains a generic collection because its editable collection view is its only dedicated view.
 */
export const REGISTRY_KEYS = ['venues', 'datasets', 'pillars', 'domains', 'data'];

/**
 * The keys of the `collections:` list of config/sources.yml, in the file's order, minus the four
 * that name a registry with a dedicated view. They ship as the page's data and the page registers
 * the collection view once per key and again on every config push, so a collection is added through sources.yml and its owner
 * catalog file; the collection registration supplies its group and order.
 */
export function collectionKeys(config: Record<string, unknown>): string[] {
    const raw = config.collections;
    if (!Array.isArray(raw)) return [];
    const keys: string[] = [];
    for (const item of raw) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
        const key = (item as Record<string, unknown>).key;
        if (typeof key !== 'string' || key === '' || REGISTRY_KEYS.includes(key)) continue;
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
    'collections'
];

/**
 * The collection of joint work: one entry per piece of work with one person, whose `person:` field
 * is a key of the people registry. The key is named here because the relation table is built from
 * that collection and nowhere else; state/collection.ts holds the same word for the client side,
 * which may not import this module.
 */
export const JOINT_WORK = 'joint-work';

/** The field of a joint-work entry that names its person. */
export const PERSON_FIELD = 'person';

/** A number value, or undefined. NaN and Infinity are not JSON-safe and are dropped with them. */
function num(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Drop the keys whose value is undefined, so the object survives JSON round-tripping unchanged. */
function compact<T extends object>(value: T): T {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
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
    return (found ?? []).map((doc) =>
        compact({
            name: doc.name,
            label: doc.label,
            present: doc.present,
            human: doc.human,
            mtime: doc.present && doc.mtime > 0 ? doc.mtime : undefined
        })
    );
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
function project(
    manifest: RawManifest,
    found: DocPresence[] | undefined,
    slides: PresentSlide[] | undefined
): Project {
    const status = isMap(manifest.status) ? manifest.status : {};
    const authors = manifest.authors;
    const domain = str(manifest.domain);
    const lag = staleDays(found, manifest.fileMtime);
    return compact({
        id: manifest.id,
        tier: manifest.tier,
        ghost: manifest.ghost,
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
        pillarIds: strings(manifest.pillar),
        domainIds: domain === undefined ? [] : [domain],
        collaborators: strings(manifest.collaborators),
        venue: str(manifest.venue),
        staleDays: lag > 0 ? lag : undefined,
        docs: docs(found),
        present: slides !== undefined && slides.length > 0 ? slides : undefined,
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
        retrieval: isMap(entry.retrieval) ? entry.retrieval : undefined,
        hpcPath: str(entry.hpc_path),
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

/**
 * One human. `self` is carried only when it is true, so the wire says who the hub belongs to and
 * says nothing at all about everybody else.
 */
function person(entry: RawRegistryEntry): Person {
    return compact({
        id: entry.key,
        name: str(entry.name) ?? '',
        affiliations: affiliationsOf(entry),
        role: str(entry.role),
        orcid: str(entry.orcid),
        email: str(entry.email),
        links: strings(entry.links),
        folder: str(entry.folder),
        self: entry.self === true ? true : undefined,
        projectIds: [],
        jointWorkIds: []
    });
}

/**
 * The organisation keys a person's entry names, the primary first. A file still writing the one key
 * `affiliation:` is read as a list of that one, so an entry nobody has rewritten still draws its
 * organisation; validate.ts is where the key that replaced it is named.
 */
function affiliationsOf(entry: RawRegistryEntry): string[] {
    const held = entry.affiliations ?? entry.affiliation;
    if (typeof held === 'string') return held === '' ? [] : [held];
    return strings(held);
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

/** One collection entry: its identity, and every field the YAML gave it apart from the provenance. */
function entry(raw: RawEntry, index: number, ident = 'title'): Entry {
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (key !== 'provenance') fields[key] = value;
    }
    const title = str(raw.title) ?? str(raw.name) ?? str(raw[ident]) ?? '';
    const key = str(raw.key);
    const id = str(raw.id);
    const identity = str(raw[ident]);
    return {
        id:
            id !== undefined && id.length > 0
                ? id
                : key !== undefined && key.length > 0
                  ? key
                  : (identity ?? title),
        title,
        fields,
        file: raw.provenance.file,
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
                optionsFrom: str(item.options_from),
                required: typeof item.required === 'boolean' ? item.required : undefined,
                help: str(item.help)
            })
        );
    }
    return fields;
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
 * from. An entry with no `person:` field, or one whose value is not a string, is no pair here and
 * is a finding of validate's; it is not repaired.
 */
function jointWorkRows(collections: Collection[]): { id: Id; person: Id }[] {
    const held = collections.find((one) => one.id === JOINT_WORK);
    const rows: { id: Id; person: Id }[] = [];
    for (const one of held?.entries ?? []) {
        const key = str(one.fields[PERSON_FIELD]);
        if (key !== undefined && key.length > 0) rows.push({ id: one.id, person: key });
    }
    return rows;
}

/**
 * The relation tables. A pair is written only when both ends are entities of the snapshot, so a
 * dangling id (which validate has reported) reaches no table and no entity's id list.
 *
 * `fundingPillar` is the one table with no field behind it: pillars.yml carries no funding key,
 * its `funding:` is prose, so a scheme and a pillar are related here when at least one
 * project names them both.
 */
/** The keys of a host row that are the host itself; every other string key is one of its scores. */
const HOST_KEYS = ['name', 'inst', 'tag', 'status', 'note'];

/** The status a host row carries no `status:` of its own for. */
const HOST_DEFAULT = 'candidate';

/**
 * The prose of a host row, with the `[proposal: Strong | ...]` prefix removed. The prefix repeats
 * what the score chips already show, so leaving it in would print every score twice.
 */
function hostNote(value: unknown): string | undefined {
    const text = str(value);
    if (text === undefined) return undefined;
    const trimmed =
        text.startsWith('[') && text.includes(']')
            ? text.slice(text.indexOf(']') + 1).trimStart()
            : text;
    return trimmed.trim() === '' ? undefined : trimmed;
}

function host(value: unknown): Host | null {
    if (!isMap(value)) return null;
    const name = str(value.name);
    if (name === undefined || name.trim() === '') return null;
    const scores: Record<string, string> = {};
    for (const [key, held] of Object.entries(value)) {
        if (HOST_KEYS.includes(key)) continue;
        const text = str(held);
        if (text !== undefined && text.trim() !== '') scores[key] = text;
    }
    return compact({
        name,
        inst: str(value.inst),
        tag: str(value.tag),
        status: str(value.status) ?? HOST_DEFAULT,
        scores,
        note: hostNote(value.note)
    });
}

/** One numbered row of the order of work, tolerating the plain-string form the file may write. */
function orderRow(value: unknown): { task: string; when?: string; note?: string } | null {
    if (typeof value === 'string') return value.trim() === '' ? null : { task: value };
    if (!isMap(value)) return null;
    const task = str(value.task);
    if (task === undefined || task.trim() === '') return null;
    return compact({ task, when: str(value.when), note: str(value.note) });
}

/** A `what`/`why` or `who`/`why` chip row, tolerating the plain-string form. */
function reasoned<K extends string>(value: unknown, key: K): Record<K | 'why', string> | null {
    if (typeof value === 'string') {
        return value.trim() === '' ? null : ({ [key]: value } as Record<K | 'why', string>);
    }
    if (!isMap(value)) return null;
    const what = str(value[key]);
    if (what === undefined || what.trim() === '') return null;
    return compact({ [key]: what, why: str(value.why) }) as Record<K | 'why', string>;
}

/** The eligibility section, whose `rule` the file may write as one string or as a list of them. */
function eligibility(value: unknown): Career['eligibility'] {
    if (!isMap(value)) return null;
    const rule = typeof value.rule === 'string' ? [value.rule] : strings(value.rule);
    const shots = strings(value.shots);
    if (rule.length === 0 && shots.length === 0 && str(value.caveat) === undefined) return null;
    return compact({ rule, shots, caveat: str(value.caveat) });
}

/**
 * The career strategy as the panel reads it. Every section is optional and every list tolerates the
 * plain-string form the file is allowed to write, so a half-filled career file draws the half it
 * has rather than nothing.
 */
export function career(raw: Record<string, unknown> | null): Career | null {
    if (raw === null) return null;
    const situation: { label: string; value: string }[] = [];
    if (isMap(raw.situation)) {
        for (const [label, held] of Object.entries(raw.situation)) {
            const text = str(held);
            if (text !== undefined) situation.push({ label, value: text });
        }
    }
    const hosts: Host[] = [];
    for (const row of Array.isArray(raw.hosts) ? raw.hosts : []) {
        const one = host(row);
        if (one !== null) hosts.push(one);
    }
    const order: { task: string; when?: string; note?: string }[] = [];
    for (const row of Array.isArray(raw.order) ? raw.order : []) {
        const one = orderRow(row);
        if (one !== null) order.push(one);
    }
    const notHosts: { who: string; why?: string }[] = [];
    for (const row of Array.isArray(raw.not_hosts) ? raw.not_hosts : []) {
        const one = reasoned(row, 'who');
        if (one !== null) notHosts.push(one);
    }
    const dropped: { what: string; why?: string }[] = [];
    for (const row of Array.isArray(raw.dropped) ? raw.dropped : []) {
        const one = reasoned(row, 'what');
        if (one !== null) dropped.push(one);
    }
    return compact({
        title: str(raw.title) ?? '',
        milestone: str(raw.milestone),
        situation,
        order,
        orderNote: str(raw.order_note),
        hosts,
        hostCriteria: strings(raw.host_criteria),
        notHosts,
        eligibility: eligibility(raw.eligibility),
        dropped
    });
}

/**
 * The feeds, already the summary sources/feeds.ts made of them. They are copied rather than passed
 * through so that the snapshot owns its own objects, which is what every other entity here does.
 */
function feeds(raw: Feeds): Feeds {
    return {
        leads: raw.leads === null ? null : raw.leads.map((one) => ({ ...one })),
        radar: raw.radar === null ? null : { ...raw.radar },
        scout: raw.scout === null ? null : { ...raw.scout },
        linkedin: raw.linkedin === null ? null : { ...raw.linkedin }
    };
}

/** What the four person and organisation tables are built from, beside the projects themselves. */
type Sides = {
    people: Person[];
    schemes: Funding[];
    /** The entries of the joint-work collection, each with the person key its record names. */
    jointWork: { id: Id; person: Id }[];
};

function relations(
    projects: Project[],
    entities: Record<string, Set<Id>>,
    sides: Sides
): Relations {
    const venueTable: [Id, Id][] = [];
    const fundingTable: [Id, Id][] = [];
    const datasetTable: [Id, Id][] = [];
    const pillarTable: [Id, Id][] = [];
    const domainTable: [Id, Id][] = [];
    const relatedTable: [Id, Id][] = [];
    const fundingPillar: [Id, Id][] = [];
    const projectPerson: [Id, Id][] = [];
    const jointWorkPerson: [Id, Id][] = [];
    const personOrganisation: [Id, Id][] = [];
    const fundingOrganisation: [Id, Id][] = [];

    for (const item of projects) {
        for (const id of item.collaborators) {
            if (entities.people.has(id)) projectPerson.push([item.id, id]);
        }
        if (item.venueId !== undefined && entities.venues.has(item.venueId)) {
            venueTable.push([item.id, item.venueId]);
        }
        for (const id of item.fundingIds) {
            if (entities.funding.has(id)) fundingTable.push([item.id, id]);
        }
        for (const id of item.datasetIds) {
            if (entities.datasets.has(id)) datasetTable.push([item.id, id]);
        }
        for (const id of item.pillarIds) {
            if (entities.pillars.has(id)) pillarTable.push([item.id, id]);
        }
        for (const id of item.domainIds) {
            if (entities.domains.has(id)) domainTable.push([item.id, id]);
        }
        for (const id of item.relatedIds) {
            if (entities.projects.has(id)) relatedTable.push([item.id, id]);
        }
        for (const fund of item.fundingIds) {
            if (!entities.funding.has(fund)) continue;
            for (const line of item.pillarIds) {
                if (entities.pillars.has(line)) fundingPillar.push([fund, line]);
            }
        }
    }

    for (const entry of sides.jointWork) {
        if (entities.people.has(entry.person)) jointWorkPerson.push([entry.id, entry.person]);
    }
    for (const one of sides.people) {
        for (const key of one.affiliations) {
            if (entities.organisations.has(key)) personOrganisation.push([one.id, key]);
        }
    }
    for (const scheme of sides.schemes) {
        if (scheme.funder !== undefined && entities.organisations.has(scheme.funder)) {
            fundingOrganisation.push([scheme.id, scheme.funder]);
        }
    }

    return {
        projectVenue: pairs(venueTable),
        projectFunding: pairs(fundingTable),
        projectDataset: pairs(datasetTable),
        projectPillar: pairs(pillarTable),
        projectDomain: pairs(domainTable),
        projectRelated: pairs(relatedTable),
        fundingPillar: pairs(fundingPillar),
        projectPerson: pairs(projectPerson),
        jointWorkPerson: pairs(jointWorkPerson),
        personOrganisation: pairs(personOrganisation),
        fundingOrganisation: pairs(fundingOrganisation)
    };
}

/**
 * The snapshot the socket carries. `version` is the caller's, monotonic and incremented by the
 * watcher on every rebuild; `findings` is what validate returned, carried as it stands.
 */
export function normalise(raw: RawPortfolio, findings: Finding[], version = 0): Snapshot {
    const withId = (entries: RawRegistryEntry[]): RawRegistryEntry[] =>
        entries.filter((item) => item.key.length > 0);

    const projects = raw.manifests.map((manifest) =>
        project(manifest, raw.docs[manifest.id], raw.present[manifest.id])
    );
    const venues = withId(raw.registries.venues.entries).map(venue);
    const datasets = withId(raw.registries.datasets.entries).map(dataset);
    const pillars = withId(raw.registries.pillars.entries).map(pillar);
    const domains = withId(raw.registries.domains.entries).map(domain);
    const schemes = raw.registries.funding.entries
        .map(funding)
        .filter((scheme) => scheme.id.length > 0);
    const people = withId(raw.registries.people.entries).map(person);
    const organisations = withId(raw.registries.organisations.entries).map(organisation);
    const collections = Object.keys(raw.collections).map((key) => collection(raw.collections[key]));

    const known: Record<string, Set<Id>> = {
        projects: new Set(projects.map((item) => item.id)),
        venues: new Set(venues.map((item) => item.id)),
        datasets: new Set(datasets.map((item) => item.id)),
        pillars: new Set(pillars.map((item) => item.id)),
        domains: new Set(domains.map((item) => item.id)),
        funding: new Set(schemes.map((item) => item.id)),
        people: new Set(people.map((item) => item.id)),
        organisations: new Set(organisations.map((item) => item.id))
    };

    const tables = relations(projects, known, {
        people,
        schemes,
        jointWork: jointWorkRows(collections)
    });

    for (const item of projects) {
        item.relatedIds = targets(tables.projectRelated, item.id);
        item.fundingIds = targets(tables.projectFunding, item.id);
        item.datasetIds = targets(tables.projectDataset, item.id);
        item.pillarIds = targets(tables.projectPillar, item.id);
        item.domainIds = targets(tables.projectDomain, item.id);
        item.collaborators = targets(tables.projectPerson, item.id);
        if (item.venueId !== undefined && !known.venues.has(item.venueId)) delete item.venueId;
    }
    for (const item of datasets) item.projectIds = sources(tables.projectDataset, item.id);
    for (const item of domains) item.projectIds = sources(tables.projectDomain, item.id);
    for (const item of pillars) {
        item.projectIds = sources(tables.projectPillar, item.id);
        item.fundingIds = sources(tables.fundingPillar, item.id);
    }
    for (const item of schemes) {
        item.projectIds = sources(tables.projectFunding, item.id);
        item.pillarIds = targets(tables.fundingPillar, item.id);
        if (item.funder !== undefined && !known.organisations.has(item.funder)) delete item.funder;
    }
    for (const item of people) {
        item.projectIds = sources(tables.projectPerson, item.id);
        item.jointWorkIds = sources(tables.jointWorkPerson, item.id);
        item.affiliations = item.affiliations.filter((key) => known.organisations.has(key));
    }
    for (const item of organisations) {
        item.personIds = sources(tables.personOrganisation, item.id);
        item.fundingIds = sources(tables.fundingOrganisation, item.id);
    }

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
            collections: byId(collections),
            feeds: feeds(raw.feeds),
            career: career(raw.career)
        },
        relations: tables,
        findings
    };
}
