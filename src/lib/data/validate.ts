// Layer 1, data. The integrity gate of DESIGN.md: every key the schema names, every id resolved,
// every status in its vocabulary. Pure, so it can run anywhere: it reads no file, calls no clock,
// throws nothing, and repairs nothing. One problem is one Finding, and the list comes back sorted
// by file then key, so two runs over one tree agree.
//
// The findings the sources already reported (a manifest that does not parse, a registry file that
// is missing, an id that is not its folder name) are passed through untouched, never re-derived:
// this module never opens a file, so it cannot know those on its own.

import type {
    Finding,
    RawManifest,
    RawPortfolio,
    RegistryName,
    ValidationRules,
    Vocabulary
} from './model.ts';
import { isMap, byKey, str } from './guards.ts';
import { JOINT_WORK, PERSON_FIELD, collectionSchema } from './normalise.ts';

/** Keys the reader itself adds to every manifest record; no schema names them. */
const PROVENANCE = [
    'file',
    'fileMtime',
    'folder',
    'id',
    'tier',
    'category',
    'type',
    'ghost',
    'manifestId'
];

/** The field names of the schema, split into top-level names and the inner names of each prefix. */
type SchemaKeys = {
    top: Set<string>;
    /** `status` to {`chips`, `line`}, for every dotted name the schema holds. */
    nested: Map<string, Set<string>>;
};

/** Which entities exist, by kind, so a reference can be resolved without touching an entity. */
type IdSets = {
    venues: Set<string>;
    datasets: Set<string>;
    pillars: Set<string>;
    domains: Set<string>;
    funding: Set<string>;
    people: Set<string>;
    organisations: Set<string>;
    projects: Set<string>;
};

/** The word a finding about a `collaborators:` or `waiting-on:` value uses for one of its people. */
const PERSON = 'person';

/**
 * What an organisation's `kind:` may say. It is a fixed list rather than a configured vocabulary
 * because it is what the entity means rather than how it is drawn, and nothing in config/vocab.yml
 * names it.
 */
const ORGANISATION_KINDS = ['university', 'hospital', 'funder', 'company', 'other'];

/**
 * A manifest key that has been renamed, and the name it is written under now. One word for a thing
 * means the reader takes the new key alone, so a manifest still carrying the old one is a finding
 * that names both rather than a value quietly read under two names.
 */
export const RENAMED_FIELDS: Record<string, string> = { program: 'pillar' };

/** A relation field of a manifest, the kind it points at, and the set that kind's ids live in. */
const REFERENCES: { field: string; kind: keyof IdSets; what: string; single: boolean }[] = [
    { field: 'venue_id', kind: 'venues', what: 'venue', single: true },
    { field: 'domain', kind: 'domains', what: 'domain', single: true },
    { field: 'funding', kind: 'funding', what: 'funding scheme', single: false },
    { field: 'datasets', kind: 'datasets', what: 'dataset', single: false },
    { field: 'pillar', kind: 'pillars', what: 'pillar', single: false },
    { field: 'related', kind: 'projects', what: 'project', single: false }
];

/** The shape each relation field has on the tree. An absent field is never a finding. */
const SHAPES: { field: string; kind: 'string' | 'list'; nullable: boolean }[] = [
    { field: 'venue_id', kind: 'string', nullable: true },
    { field: 'domain', kind: 'string', nullable: false },
    { field: 'pillar', kind: 'list', nullable: false },
    { field: 'datasets', kind: 'list', nullable: false },
    { field: 'related', kind: 'list', nullable: false },
    { field: 'collaborators', kind: 'list', nullable: false },
    { field: 'waiting-on', kind: 'list', nullable: false },
    { field: 'funding', kind: 'list', nullable: true }
];

/** What a value is, in the words the shape messages use. */
function shapeOf(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'a list';
    if (isMap(value)) return 'a map';
    return `a ${typeof value}`;
}

/**
 * The field names the schema holds, whatever shape the config gives it: a list of names, a list of
 * maps with a `field` key, a map with a `fields` map inside (what the hub's manifest-schema.yml
 * has), or a plain map of names. A schema that names nothing leaves every key unnamed, and every
 * key of every manifest is then a finding; there is no quiet path where the check does not run.
 */
export function fieldNames(schema: unknown): string[] {
    if (Array.isArray(schema)) {
        const names: string[] = [];
        for (const item of schema) {
            if (typeof item === 'string') names.push(item);
            else if (isMap(item) && typeof item.field === 'string') names.push(item.field);
        }
        return names;
    }
    if (isMap(schema)) {
        if (isMap(schema.fields)) return Object.keys(schema.fields);
        return Object.keys(schema);
    }
    return [];
}

/** Split the dotted names: `status.chips` puts `status` in `top` and `chips` under it in `nested`. */
export function schemaKeys(schema: unknown): SchemaKeys {
    const top = new Set<string>(PROVENANCE);
    const nested = new Map<string, Set<string>>();
    for (const name of fieldNames(schema)) {
        const dot = name.indexOf('.');
        if (dot < 0) {
            top.add(name);
            continue;
        }
        const prefix = name.slice(0, dot);
        top.add(prefix);
        const inner = nested.get(prefix) ?? new Set<string>();
        inner.add(name.slice(dot + 1));
        nested.set(prefix, inner);
    }
    return { top, nested };
}

/**
 * Every top-level key is one the schema names, and inside a key the schema gave dotted names to,
 * every key of the map is one of those. A key whose value is not a map is not looked into, which
 * is what keeps a `followup:` written as one line from being reported twice. A key RENAMED_FIELDS
 * names is reported under the name it is written under now, so a manifest written by hand under the
 * old one says what to write instead.
 */
function checkKeys(manifest: RawManifest, schema: SchemaKeys, findings: Finding[]): void {
    for (const key of Object.keys(manifest)) {
        if (!schema.top.has(key)) {
            const renamed = byKey(RENAMED_FIELDS, key);
            findings.push({
                file: manifest.file,
                key,
                message:
                    renamed === undefined
                        ? `key ${key} is not in the manifest schema`
                        : `key ${key} is now ${renamed}: write the tags under ${renamed}:`
            });
            continue;
        }
        const inner = schema.nested.get(key);
        const value = manifest[key];
        if (inner === undefined || !isMap(value)) continue;
        for (const sub of Object.keys(value)) {
            if (inner.has(sub)) continue;
            findings.push({
                file: manifest.file,
                key: `${key}.${sub}`,
                message: `key ${key}.${sub} is not in the manifest schema`
            });
        }
    }
}

/** `type` is one of the type vocabulary. A manifest without one is a tier's business, not ours. */
function checkType(manifest: RawManifest, types: string[], findings: Finding[]): void {
    const type = manifest.type;
    if (type === undefined) return;
    if (typeof type !== 'string' || !types.includes(type)) {
        findings.push({
            file: manifest.file,
            key: 'type',
            message: `type ${JSON.stringify(type)} is not one of the type vocabulary`
        });
    }
}

/**
 * The manifest's `focus:` names a lane of `focus_lanes` or `holding`, the ideas backlog. A value
 * outside them is not drawn anywhere: the board puts a non-idea on no lane at all and an idea in the
 * backlog, and until this check that was silent. No lanes in the vocabulary means the check is off,
 * the way `chips` behaves.
 */
function checkFocus(manifest: RawManifest, lanes: string[] | undefined, findings: Finding[]): void {
    const focus = manifest.focus;
    if (lanes === undefined || focus === undefined) return;
    if (typeof focus !== 'string' || !lanes.includes(focus)) {
        findings.push({
            file: manifest.file,
            key: 'focus',
            message: `focus ${JSON.stringify(focus)} is not a lane of focus_lanes`
        });
    }
}

/** The relation fields have the shapes the tree has them in; an absent field has no shape. */
function checkShapes(manifest: RawManifest, findings: Finding[]): void {
    for (const shape of SHAPES) {
        const value = manifest[shape.field];
        if (value === undefined) continue;
        if (value === null) {
            if (shape.nullable) continue;
            findings.push({
                file: manifest.file,
                key: shape.field,
                message: `${shape.field} must be ${shape.kind === 'list' ? 'a list' : 'a string'}, not null`
            });
            continue;
        }
        const ok = shape.kind === 'list' ? Array.isArray(value) : typeof value === 'string';
        if (ok) continue;
        const want = shape.kind === 'list' ? 'a list' : 'a string';
        const orNull = shape.nullable ? ' or null' : '';
        findings.push({
            file: manifest.file,
            key: shape.field,
            message: `${shape.field} must be ${want}${orNull}, not ${shapeOf(value)}`
        });
    }
}

/** Every id a manifest names resolves to an entity of the kind that field points at. */
function checkReferences(manifest: RawManifest, ids: IdSets, findings: Finding[]): void {
    for (const relation of REFERENCES) {
        const value = manifest[relation.field];
        if (value === undefined || value === null) continue;
        const named = relation.single ? [value] : Array.isArray(value) ? value : [];
        for (const item of named) {
            if (typeof item !== 'string') continue;
            if (ids[relation.kind].has(item)) continue;
            findings.push({
                file: manifest.file,
                key: relation.field,
                message: `${relation.field} names no ${relation.what}: ${item}`
            });
        }
    }
}

/** A project's `related:` names other projects; naming itself draws a card that links to itself. */
function checkSelfRelated(manifest: RawManifest, findings: Finding[]): void {
    const value = manifest.related;
    if (!Array.isArray(value)) return;
    for (const item of value) {
        if (item !== manifest.id) continue;
        findings.push({
            file: manifest.file,
            key: 'related',
            message: `related names the project itself: ${manifest.id}`
        });
    }
}

/**
 * Every project folder has a name of its own. The folder name is the project's id, so two manifests
 * under folders of one name are one id: the second card overwrites the first, and the sessions
 * matcher, which finds a project by its folder name, cannot tell the two apart.
 */
function checkFolderNames(raw: RawPortfolio, findings: Finding[]): void {
    const byName = new Map<string, RawManifest[]>();
    for (const manifest of raw.manifests) {
        const name =
            manifest.folder
                .split('/')
                .filter((part) => part !== '')
                .pop() ?? '';
        if (name === '') continue;
        byName.set(name, [...(byName.get(name) ?? []), manifest]);
    }
    for (const [name, held] of byName) {
        if (held.length < 2) continue;
        for (const manifest of held) {
            findings.push({
                file: manifest.file,
                key: 'folder',
                message: `${held.length} projects share the folder name ${name}, so their ids collide`
            });
        }
    }
}

/** Every id in `collaborators` names an entry of the people registry. */
function checkCollaborators(manifest: RawManifest, keys: Set<string>, findings: Finding[]): void {
    const value = manifest.collaborators;
    if (!Array.isArray(value)) return;
    for (const item of value) {
        if (typeof item !== 'string' || keys.has(item)) continue;
        findings.push({
            file: manifest.file,
            key: 'collaborators',
            message: `collaborators names no ${PERSON}: ${item}`
        });
    }
}

/**
 * `waiting-on` names what a project waits for before it moves: a person of the people registry, or
 * another project by its id. A value that is neither resolves against nothing, so the strip can
 * only draw it as written and no reader can look it up.
 */
function checkWaitingOn(
    manifest: RawManifest,
    keys: Set<string>,
    projects: Set<string>,
    findings: Finding[]
): void {
    const value = manifest['waiting-on'];
    if (!Array.isArray(value)) return;
    for (const item of value) {
        if (typeof item !== 'string') continue;
        if (item === manifest.id) {
            findings.push({
                file: manifest.file,
                key: 'waiting-on',
                message: `waiting-on names the project itself: ${item}`
            });
            continue;
        }
        if (keys.has(item) || projects.has(item)) continue;
        findings.push({
            file: manifest.file,
            key: 'waiting-on',
            message: `waiting-on names no ${PERSON} or project: ${item}`
        });
    }
}

/**
 * `status.chips` is a list of strings, and each chip is in the chip vocabulary when the config
 * holds one. When it does not, `chips` is absent from the vocabulary and a chip is a free string.
 */
function checkChips(manifest: RawManifest, chips: string[] | undefined, findings: Finding[]): void {
    const status = manifest.status;
    if (!isMap(status) || status.chips === undefined) return;
    const file = manifest.file;
    const key = 'status.chips';
    if (!Array.isArray(status.chips)) {
        findings.push({
            file,
            key,
            message: `status.chips must be a list, not ${shapeOf(status.chips)}`
        });
        return;
    }
    for (const chip of status.chips) {
        if (typeof chip !== 'string') {
            findings.push({ file, key, message: `chip ${shapeOf(chip)} is not a string` });
            continue;
        }
        if (chips !== undefined && !chips.includes(chip)) {
            findings.push({ file, key, message: `chip ${chip} is not in the chip vocabulary` });
        }
    }
}

/** A collection entry's `status`, when it has one, is a word of the status vocabulary. */
function checkEntryStatus(raw: RawPortfolio, statuses: string[], findings: Finding[]): void {
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        collection.entries.forEach((entry, index) => {
            const status = entry.status;
            if (status === undefined) return;
            if (typeof status === 'string' && statuses.includes(status)) return;
            findings.push({
                file: collection.file,
                key: `entries[${index}].status`,
                message: `status ${JSON.stringify(status)} is not one of the status vocabulary`
            });
        });
    }
}

/**
 * A collection file's `schema:`, when it has one, is a list of maps each naming a `field` and a
 * `type`. It is what a collection is drawn by, so one malformed entry costs the whole file its
 * field order; normalise leaves such a schema off the wire and this is where that is said.
 */
function checkCollectionSchema(raw: RawPortfolio, findings: Finding[]): void {
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        const schema = collection.meta.schema;
        if (schema === undefined) continue;
        if (collectionSchema(schema) !== undefined) continue;
        findings.push({
            file: collection.file,
            key: 'schema',
            message: `schema ${shapeOf(schema)} is not a list of maps naming a field and a type`
        });
    }
}

/**
 * Two entries of one collection with the same identity value. The identity field is the schema's
 * first, `title` where the file has no schema, and it is what a write addresses an entry by: with
 * two of one value, an edit reaches the first and the second can be neither edited nor removed.
 */
function checkEntryIdentity(raw: RawPortfolio, findings: Finding[]): void {
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        const names = fieldNames(collection.meta.schema);
        const ident = names.length > 0 ? names[0] : 'title';
        const counts = new Map<string, number>();
        for (const entry of collection.entries) {
            const held = entry[ident];
            if (typeof held !== 'string' && typeof held !== 'number') continue;
            const value = String(held);
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
        collection.entries.forEach((entry, index) => {
            const held = entry[ident];
            if (typeof held !== 'string' && typeof held !== 'number') return;
            const value = String(held);
            if ((counts.get(value) ?? 0) < 2) return;
            findings.push({
                file: collection.file,
                key: `entries[${index}].${ident}`,
                message: `two entries share the ${ident} ${value}`
            });
        });
    }
}

/**
 * Every key of a person's `affiliations:` names an organisation of the registry, the entry writes the
 * list under that name, and exactly one entry carries `self: true`. The affiliations are what draw
 * the person's organisations everywhere a person is shown, so a free string there is a name nothing
 * can be looked up by; `self` is how the hub knows which entry is its owner, and two of them or none
 * leaves that question unanswered.
 */
function checkPeople(raw: RawPortfolio, organisations: Set<string>, findings: Finding[]): void {
    const entries = raw.registries.people.entries;
    const selves: number[] = [];
    entries.forEach((entry, index) => {
        if (entry.self === true) selves.push(index);
        // The one key the list replaced is still read, as a list of that one, so the entry keeps
        // drawing its organisation; the finding is what asks for it to be written the new way.
        if (entry.affiliation !== undefined && entry.affiliation !== null) {
            findings.push({
                file: entry.file,
                key: `entries[${index}].affiliation`,
                message: 'affiliation is read as a one-entry affiliations list; write affiliations'
            });
        }
        const held = entry.affiliations ?? entry.affiliation;
        if (held === undefined || held === null) return;
        const named = typeof held === 'string' ? [held] : Array.isArray(held) ? held : [held];
        named.forEach((one, at) => {
            if (typeof one === 'string' && organisations.has(one)) return;
            findings.push({
                file: entry.file,
                key: `entries[${index}].affiliations[${at}]`,
                message: `affiliations names no organisation: ${JSON.stringify(one)}`
            });
        });
    });
    if (entries.length === 0 || selves.length === 1) return;
    const file = entries[0]?.file ?? '';
    findings.push({
        file,
        key: 'entries',
        message: `${selves.length} people entries carry self: true, and exactly one may`
    });
}

/** An organisation's `kind:` is one of the five words the entity is defined over. */
function checkOrganisations(raw: RawPortfolio, findings: Finding[]): void {
    raw.registries.organisations.entries.forEach((entry, index) => {
        const kind = entry.kind;
        if (kind === undefined) return;
        if (typeof kind === 'string' && ORGANISATION_KINDS.includes(kind)) return;
        findings.push({
            file: entry.file,
            key: `entries[${index}].kind`,
            message: `kind ${JSON.stringify(kind)} is not one of the organisation kinds`
        });
    });
}

/**
 * Every entry of the joint-work collection names a person of the registry. The entry is a piece of
 * work with one human, so an entry with no `person:` is a card no reader can follow to whoever the
 * work is with, which is the whole of what the collection is for.
 */
function checkJointWork(raw: RawPortfolio, people: Set<string>, findings: Finding[]): void {
    const collection = byKey(raw.collections, JOINT_WORK);
    if (collection === undefined) return;
    collection.entries.forEach((entry, index) => {
        const key = str(entry[PERSON_FIELD]);
        if (key !== undefined && people.has(key)) return;
        const held = entry[PERSON_FIELD];
        findings.push({
            file: collection.file,
            key: `entries[${index}].${PERSON_FIELD}`,
            message:
                held === undefined
                    ? `entry has no ${PERSON_FIELD}`
                    : `${PERSON_FIELD} names no ${PERSON}: ${JSON.stringify(held)}`
        });
    });
}

/**
 * A funding scheme's `funder:` names an organisation of the registry. It is the same rule as a
 * person's affiliations, from the other file: who funds a scheme is an organisation the hub holds.
 */
function checkFunders(raw: RawPortfolio, organisations: Set<string>, findings: Finding[]): void {
    raw.registries.funding.entries.forEach((entry, index) => {
        const funder = entry.funder;
        if (funder === undefined || funder === null) return;
        if (typeof funder === 'string' && organisations.has(funder)) return;
        findings.push({
            file: entry.file,
            key: `entries[${index}].funder`,
            message: `funder names no organisation: ${JSON.stringify(funder)}`
        });
    });
}

/**
 * A funding entry is known by its `key` when it has one and by its `title` otherwise, so an entry
 * with neither has no identity and normalise cannot carry it. The other four registries require an
 * id and their reader has already reported a missing one, so only funding is checked here.
 */
function checkFundingIdentity(raw: RawPortfolio, findings: Finding[]): void {
    raw.registries.funding.entries.forEach((entry, index) => {
        if (entry.key.length > 0) return;
        if (typeof entry.title === 'string' && entry.title.length > 0) return;
        findings.push({
            file: entry.file,
            key: `entries[${index}]`,
            message: 'funding entry has neither a key nor a title'
        });
    });
}

/** The statuses of a funding entry that a manuscript may have to acknowledge. */
const ACKNOWLEDGED = new Set(['awarded', 'contributing']);

/**
 * An awarded or contributing funding entry is one a manifest tags and a manuscript acknowledges, so
 * it needs a `key` the tag can name and a `statement` the manuscript pastes. An application gets
 * both when it is granted; until then neither is asked for.
 */
function checkFundingStatements(raw: RawPortfolio, findings: Finding[]): void {
    raw.registries.funding.entries.forEach((entry, index) => {
        const status = typeof entry.status === 'string' ? entry.status : '';
        if (!ACKNOWLEDGED.has(status)) return;
        const title = typeof entry.title === 'string' ? entry.title : '';
        const name = entry.key.length > 0 ? entry.key : title;
        const statement = entry.statement;
        if (entry.key.length === 0) {
            findings.push({
                file: entry.file,
                key: `entries[${index}]`,
                message: `funding entry ${name} is ${status} and has no key`
            });
        }
        if (typeof statement !== 'string' || statement.trim().length === 0) {
            findings.push({
                file: entry.file,
                key: `entries[${index}]`,
                message: `funding entry ${name} is ${status} and has no statement`
            });
        }
    });
}

/** Which ids exist, by kind. A project is known by its folder name, which is the reader's `id`. */
function idSets(raw: RawPortfolio): IdSets {
    const of = (name: RegistryName): Set<string> =>
        new Set(raw.registries[name].entries.map((entry) => entry.key).filter((key) => key !== ''));
    return {
        venues: of('venues'),
        datasets: of('datasets'),
        pillars: of('pillars'),
        domains: of('domains'),
        funding: of('funding'),
        people: of('people'),
        organisations: of('organisations'),
        projects: new Set(raw.manifests.map((manifest) => manifest.id))
    };
}

/** By file then key, and by nothing else: the sort is stable, so equal pairs keep their order. */
function sortFindings(findings: Finding[]): Finding[] {
    return findings.sort((a, b) => {
        if (a.file !== b.file) return a.file < b.file ? -1 : 1;
        if (a.key !== b.key) return a.key < b.key ? -1 : 1;
        return 0;
    });
}

/**
 * Every problem in one raw portfolio, the sources' own findings among them, sorted by file then
 * key. Nothing is thrown and nothing is repaired: a caller decides what a finding means, and the
 * snapshot carries the list so the app can show it.
 */
/**
 * A host of the career file whose `status:` is not one of `career_host_status`. The buttons on a
 * host row are that vocabulary, so a status outside it is a row the board cannot move on.
 */
function checkHostStatus(raw: RawPortfolio, rules: ValidationRules, findings: Finding[]): void {
    const allowed = rules.vocab.hostStatuses;
    if (allowed === undefined || allowed.length === 0 || raw.career === null) return;
    const hosts = raw.career.hosts;
    if (!Array.isArray(hosts)) return;
    const file = rules.careerFile ?? '';
    hosts.forEach((held: unknown, index: number) => {
        if (typeof held !== 'object' || held === null || Array.isArray(held)) return;
        const row = held as Record<string, unknown>;
        const status = typeof row.status === 'string' ? row.status : '';
        if (status === '' || allowed.includes(status)) return;
        findings.push({
            file,
            key: `hosts[${index}]`,
            message: `host status "${status}" is not one of the host status vocabulary`
        });
    });
}

export function validate(raw: RawPortfolio, rules: ValidationRules): Finding[] {
    const findings: Finding[] = [...raw.findings];
    const schema = schemaKeys(rules.schema);
    const ids = idSets(raw);
    const vocab: Vocabulary = rules.vocab;

    for (const manifest of raw.manifests) {
        checkKeys(manifest, schema, findings);
        checkType(manifest, vocab.types, findings);
        checkFocus(manifest, vocab.lanes, findings);
        checkShapes(manifest, findings);
        checkReferences(manifest, ids, findings);
        checkSelfRelated(manifest, findings);
        checkCollaborators(manifest, ids.people, findings);
        checkWaitingOn(manifest, ids.people, ids.projects, findings);
        checkChips(manifest, vocab.chips, findings);
    }
    checkFolderNames(raw, findings);
    checkPeople(raw, ids.organisations, findings);
    checkOrganisations(raw, findings);
    checkJointWork(raw, ids.people, findings);
    checkFunders(raw, ids.organisations, findings);
    checkFundingIdentity(raw, findings);
    checkFundingStatements(raw, findings);
    checkEntryStatus(raw, vocab.statuses, findings);
    checkEntryIdentity(raw, findings);
    checkCollectionSchema(raw, findings);
    checkHostStatus(raw, rules, findings);

    return sortFindings(findings);
}
