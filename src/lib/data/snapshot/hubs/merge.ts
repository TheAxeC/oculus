// Layer 1, data. The portfolio of the hubs of a workspace as one snapshot. Every hub is built on
// its own by `builtHub` of data/index.ts, with its own settings, and the builds are joined here,
// which is the one place a record gets its id: every record of every hub, the primary's included,
// has the internal id `<hub>:<key>`, the key being what its own hub's files name it by, and carries
// the hub's name in `root`. A project of a workspace folder that is no hub, in a workspace with no
// primary, is a part of its own whose hub is the folder's name.
//
// A reference names a key, and resolves in its own hub first, then in the other hubs: one other
// hub holding the key gives that hub's record, and two or more other hubs holding it, with the own
// hub holding none, give one finding naming the key and each hub that holds it, in the workspace's
// folder order, and resolve to none (`resolveKey` of helpers/hub-names.ts). A key two hubs hold is
// no finding by itself. Every relation table is built from the resolved references. The fields of
// a collection entry keep the keys its file holds, since the page resolves them by the same rule,
// and are walked here for that finding only. The joined id is internal: no file, form, finding,
// label or address writes or shows it.
//
// The career, the website and the portfolio deck are the primary's alone: a hub other than the
// primary is built with none, and the feeds summary is the hubs' leads together with the latest
// run dates and each hub's own run dates.

import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { hubId, resolveKey, type Holders } from '../../helpers/hub-names.ts';
import type {
    Collection,
    Entities,
    Feeds,
    Finding,
    Funding,
    HubSnapshot,
    Id,
    Person,
    Project,
    RegistryName,
    Snapshot
} from '../../model/index.ts';
import { byId, jointWorkRows } from '../normalise.ts';
import { linked } from '../normalise-parts/links.ts';
import { sortFindings } from '../validate.ts';
import { targetRegistry } from '../schema/lists.ts';
import { throughSchema, type Reach, type SourceNames } from './references.ts';

/**
 * One hub's own build, in the workspace's folder order: the hub's name, its snapshot, whose records
 * have the keys its files give them, and the absolute path of each of its registry files (the empty
 * text for a part with none).
 */
export type HubPart = { key: string; snapshot: HubSnapshot; files: Record<RegistryName, string> };

/** The kinds of record a reference may name, each a table of the entities by the same name. */
const SOURCES = [
    'projects',
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources'
] as const;

type Source = (typeof SOURCES)[number];

/** Where a reference stands: the file, the key the finding is about, and the field. */
type Where = { file: string; key: string; field: string };

/** The answer for a reference read in one hub: the id it names, or null for none. */
type Resolve = (sources: readonly string[], value: string, where: Where) => Id | null;

/** The hubs that hold each key of each kind of record, in the parts' order. */
function holdersBy(parts: readonly HubPart[]): Record<Source, Holders> {
    const out = {} as Record<Source, Map<string, string[]>>;
    for (const source of SOURCES) {
        const held = new Map<string, string[]>();
        for (const part of parts) {
            for (const key of Object.keys(part.snapshot.entities[source])) {
                held.set(key, [...(held.get(key) ?? []), part.key]);
            }
        }
        out[source] = held;
    }
    return out;
}

/** Whether a source name is one of the kinds of record. */
function isSource(name: string): name is Source {
    return SOURCES.some((one) => one === name);
}

/**
 * The resolver of the hub `own`: each source in turn, the first whose key resolves giving the id.
 * A value no source resolves while one of them is held by two or more other hubs adds the finding
 * to `found`, once for each file, key, field and value.
 */
function resolverOf(
    holders: Record<Source, Holders>,
    own: string,
    found: Map<string, Finding>,
    text: TextCatalog
): Resolve {
    return (sources, value, where) => {
        let hubs: readonly string[] | null = null;
        for (const source of sources) {
            if (!isSource(source)) continue;
            const named = resolveKey(holders[source], own, value);
            if (named === null) continue;
            if ('id' in named) return named.id;
            hubs ??= named.hubs;
        }
        if (hubs === null) return null;
        const token = [where.file, where.key, where.field, value].join('\0');
        found.set(token, {
            file: where.file,
            key: where.key,
            message: findingText(
                text,
                'findings.hubs.ambiguous',
                where.field,
                value,
                hubs.join(', ')
            )
        });
        return null;
    };
}

/**
 * The ids the keys of a list resolve to, in the list's order; a key that resolves to none drops.
 */
function idsOf(keys: readonly string[], resolve: (key: string) => Id | null): Id[] {
    return keys.map(resolve).filter((id): id is Id => id !== null);
}

/** A project of the hub `own`, its id given and every reference resolved. */
function projectOf(one: Project, own: string, resolve: Resolve): Project {
    const at = (source: Source, field: string) => (key: string) =>
        resolve([source], key, { file: one.file, key: field, field });
    const venueId = one.venueId === undefined ? null : at('venues', 'venue')(one.venueId);
    const waiting = { file: one.file, key: 'waiting-on', field: 'waiting-on' };
    const out: Project = {
        ...one,
        root: own,
        id: hubId(own, one.id),
        relatedIds: idsOf(one.relatedIds, at('projects', 'related')),
        fundingIds: idsOf(one.fundingIds, at('funding', 'funding')),
        datasetIds: idsOf(one.datasetIds, at('datasets', 'datasets')),
        pillarIds: idsOf(one.pillarIds, at('pillars', 'pillars')),
        domainIds: idsOf(one.domainIds, at('domains', 'domain')),
        lead: idsOf(one.lead, at('people', 'lead')),
        collaborators: idsOf(one.collaborators, at('people', 'collaborators')),
        supervisors: idsOf(one.supervisors, at('people', 'supervisors')),
        resourceIds: idsOf(one.resourceIds, at('resources', 'compute')),
        // A name of `waiting-on` is a person's key, a project's or the words of someone the hub
        // keeps no record of, which stay as they are.
        waitingOn: one.waitingOn.map((key) => resolve(['people', 'projects'], key, waiting) ?? key)
    };
    if (venueId === null) delete out.venueId;
    else out.venueId = venueId;
    return out;
}

/** A funding scheme of the hub `own`, its id given and its funder resolved. */
function schemeOf(one: Funding, own: string, file: string, resolve: Resolve): Funding {
    const funder =
        one.funder === undefined
            ? null
            : resolve(['organisations'], one.funder, { file, key: one.id, field: 'funder' });
    const out: Funding = { ...one, root: own, id: hubId(own, one.id) };
    if (funder === null) delete out.funder;
    else out.funder = funder;
    return out;
}

/**
 * A person of the hub `own`, its id given, its organisations resolved and its people file named.
 */
function personOf(one: Person, own: string, file: string, resolve: Resolve): Person {
    const where = { file, key: one.id, field: 'affiliations' };
    return {
        ...one,
        root: own,
        id: hubId(own, one.id),
        file,
        affiliations: idsOf(one.affiliations, (key) => resolve(['organisations'], key, where))
    };
}

/**
 * The source each `foreign_key:` target of the hub of `part` names: the registry the collection
 * its own `collections:` list keys so carries, else the target itself.
 */
function namesOf(part: HubPart): SourceNames {
    const listed = Object.values(part.snapshot.entities.collections).map((one) => ({
        key: one.id,
        registry: one.registry
    }));
    return (target) => targetRegistry(target, listed) ?? target;
}

/**
 * A collection of the hub `own`, its id and the id of each entry given. The fields keep the keys
 * the file holds; each value that names a record is resolved for the finding a key two other hubs
 * hold gives, its target named by `names`.
 */
function collectionOf(
    one: Collection,
    own: string,
    resolve: Resolve,
    names: SourceNames
): Collection {
    const entries = one.entries.map((entry) => {
        if (one.schema !== undefined) {
            const reach: Reach = (value, sources, _held, field) => {
                resolve(sources, value, { file: one.file, key: entry.id, field });
                return value;
            };
            throughSchema(one.schema, entry.fields, reach, names);
        }
        return { ...entry, id: hubId(own, entry.id), root: own };
    });
    return { ...one, id: hubId(own, one.id), entries, root: own };
}

/** A registry record of the hub `own` with its id given. */
function rooted<T extends { id: Id }>(one: T, own: string): T {
    return { ...one, root: own, id: hubId(own, one.id) };
}

/** The later of two ISO dates, where either may be missing. */
function later(one: string | null, other: string | null): string | null {
    if (one === null) return other;
    if (other === null) return one;
    return one >= other ? one : other;
}

/** The latest of one run date over the hubs' feeds, null when no hub has that feed. */
function latest<T>(held: (T | null)[], date: (one: T) => string | null): string | null | undefined {
    const there = held.filter((one): one is T => one !== null);
    return there.length === 0 ? undefined : there.map(date).reduce(later, null);
}

/** Whether a part was read from a hub: a part of a project folder that is no hub has no file. */
function fromHub(part: HubPart): boolean {
    return Object.values(part.files).some((file) => file !== '');
}

/**
 * The feeds summary of the hubs: every hub's live leads marked with its hub, the latest runs, and
 * each hub's own runs in `byHub`.
 */
function feedsOf(parts: readonly HubPart[]): Feeds {
    const all = parts.map((part) => part.snapshot.entities.feeds);
    const leads = parts.flatMap((part) =>
        (part.snapshot.entities.feeds.leads ?? []).map((lead) => ({ ...lead, root: part.key }))
    );
    const radar = latest(
        all.map((one) => one.radar),
        (one) => one.lastRun
    );
    const scout = latest(
        all.map((one) => one.scout),
        (one) => one.lastRun
    );
    const linkedin = latest(
        all.map((one) => one.linkedin),
        (one) => one.lastPost
    );
    return {
        leads: all.every((one) => one.leads === null) ? null : leads,
        radar: radar === undefined ? null : { lastRun: radar },
        scout: scout === undefined ? null : { lastRun: scout },
        linkedin: linkedin === undefined ? null : { lastPost: linkedin },
        byHub: parts.filter(fromHub).map((part) => {
            const own = part.snapshot.entities.feeds;
            return { hub: part.key, radar: own.radar, scout: own.scout, linkedin: own.linkedin };
        })
    };
}

/** The records of one kind of every part, each passed through `fix`, under the ids it gave them. */
function joined<T extends { id: Id }>(
    parts: readonly HubPart[],
    table: (entities: HubSnapshot['entities']) => Record<Id, T>,
    fix: (one: T, part: HubPart) => T
): Record<Id, T> {
    return byId(
        parts.flatMap((part) =>
            Object.values(table(part.snapshot.entities)).map((one) => fix(one, part))
        )
    );
}

/**
 * The portfolio of the hubs of a workspace, the parts in the workspace's folder order, as one
 * snapshot of the version `version`. `text` is the primary hub's catalog, which words the findings
 * of the merge. The career is the one part's that has one, the primary's.
 */
export function mergeHubs(parts: readonly HubPart[], text: TextCatalog, version: number): Snapshot {
    const holders = holdersBy(parts);
    const found = new Map<string, Finding>();
    const resolvers = parts.map((part) => resolverOf(holders, part.key, found, text));
    const of = (part: HubPart): Resolve => resolvers[parts.indexOf(part)];
    const projects = joined(
        parts,
        (all) => all.projects,
        (one, part) => projectOf(one, part.key, of(part))
    );
    const funding = joined(
        parts,
        (all) => all.funding,
        (one, part) => schemeOf(one, part.key, part.files.funding, of(part))
    );
    const people = joined(
        parts,
        (all) => all.people,
        (one, part) => personOf(one, part.key, part.files.people, of(part))
    );
    const collections = joined(
        parts,
        (all) => all.collections,
        (one, part) => collectionOf(one, part.key, of(part), namesOf(part))
    );
    const entities: Entities = {
        projects,
        venues: joined(
            parts,
            (all) => all.venues,
            (one, part) => rooted(one, part.key)
        ),
        datasets: joined(
            parts,
            (all) => all.datasets,
            (one, part) => rooted(one, part.key)
        ),
        pillars: joined(
            parts,
            (all) => all.pillars,
            (one, part) => rooted(one, part.key)
        ),
        domains: joined(
            parts,
            (all) => all.domains,
            (one, part) => rooted(one, part.key)
        ),
        funding,
        people,
        organisations: joined(
            parts,
            (all) => all.organisations,
            (one, part) => rooted(one, part.key)
        ),
        resources: joined(
            parts,
            (all) => all.resources,
            (one, part) => rooted(one, part.key)
        ),
        collections,
        feeds: feedsOf(parts),
        career:
            parts.map((part) => part.snapshot.entities.career).find((one) => one !== null) ?? null
    };
    const jointWork = parts.flatMap((part) => {
        const held = Object.values(part.snapshot.entities.collections);
        return jointWorkRows(held).flatMap((row) => {
            const where = { file: row.file, key: row.id, field: 'person' };
            const person = of(part)(['people'], row.person, where);
            return person === null ? [] : [{ id: hubId(part.key, row.id), person }];
        });
    });
    const known = Object.fromEntries(
        SOURCES.map((source) => [source, new Set(Object.keys(entities[source]))])
    );
    const relations = linked(
        {
            projects: Object.values(projects),
            datasets: Object.values(entities.datasets),
            pillars: Object.values(entities.pillars),
            domains: Object.values(entities.domains),
            schemes: Object.values(funding),
            people: Object.values(people),
            organisations: Object.values(entities.organisations)
        },
        known,
        jointWork
    );
    return {
        version,
        entities,
        relations,
        findings: sortFindings([
            ...parts.flatMap((part) => part.snapshot.findings),
            ...found.values()
        ])
    };
}
