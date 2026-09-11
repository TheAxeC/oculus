// Layer 1, data. The integrity gate of DESIGN.md: every key the schema names, every id resolved,
// every status in its vocabulary. Pure, so it can run anywhere: it reads no file, calls no clock,
// throws nothing, and repairs nothing. One problem is one Finding, and the list comes back sorted
// by file then key, so two runs over one tree agree.
//
// The findings the sources already reported (a manifest that does not parse, a registry file that
// is missing, an id that is not its folder name) are passed through untouched, never re-derived:
// this module never opens a file, so it cannot know those on its own.

import type { Finding, RawManifest, RawPortfolio, ValidationRules, Vocabulary } from './model.ts';
import { isMap } from './guards.ts';
import { collectionSchema } from './normalise.ts';

/** Keys the reader itself adds to every manifest record; no schema names them. */
const PROVENANCE = ['file', 'fileMtime', 'folder', 'id', 'tier', 'category', 'type', 'manifestId'];

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
    programs: Set<string>;
    domains: Set<string>;
    funding: Set<string>;
    projects: Set<string>;
};

/**
 * The collection whose entry keys a manifest's `collaborators` names, and the word a finding uses
 * for one of its entries. The collaborators are not a registry and their entries are not entities,
 * so the check resolves against the collection's own keys rather than through IdSets.
 */
const COLLABORATIONS = 'collaborations';
const COLLABORATOR = 'collaborator';

/** A relation field of a manifest, the kind it points at, and the set that kind's ids live in. */
const REFERENCES: { field: string; kind: keyof IdSets; what: string; single: boolean }[] = [
    { field: 'venue_id', kind: 'venues', what: 'venue', single: true },
    { field: 'domain', kind: 'domains', what: 'domain', single: true },
    { field: 'funding', kind: 'funding', what: 'funding scheme', single: false },
    { field: 'datasets', kind: 'datasets', what: 'dataset', single: false },
    { field: 'program', kind: 'programs', what: 'research line', single: false },
    { field: 'related', kind: 'projects', what: 'project', single: false }
];

/** The shape each relation field has on the tree. An absent field is never a finding. */
const SHAPES: { field: string; kind: 'string' | 'list'; nullable: boolean }[] = [
    { field: 'venue_id', kind: 'string', nullable: true },
    { field: 'domain', kind: 'string', nullable: false },
    { field: 'program', kind: 'list', nullable: false },
    { field: 'datasets', kind: 'list', nullable: false },
    { field: 'related', kind: 'list', nullable: false },
    { field: 'collaborators', kind: 'list', nullable: false },
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
 * is what keeps a `followup:` written as one line from being reported twice.
 */
function checkKeys(manifest: RawManifest, schema: SchemaKeys, findings: Finding[]): void {
    for (const key of Object.keys(manifest)) {
        if (!schema.top.has(key)) {
            findings.push({
                file: manifest.file,
                key,
                message: `key ${key} is not in the manifest schema`
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

/**
 * The keys of the `collaborations` collection. A collection the config does not name reaches here
 * as no keys, and every collaborator a manifest names is then a finding: an id that resolves
 * against nothing is exactly what this check is for, and the reader has already reported the
 * missing file on its own.
 */
function collaboratorKeys(raw: RawPortfolio): Set<string> {
    const keys = new Set<string>();
    const collection = raw.collections[COLLABORATIONS];
    if (collection === undefined) return keys;
    for (const entry of collection.entries) {
        if (typeof entry.key === 'string' && entry.key.length > 0) keys.add(entry.key);
    }
    return keys;
}

/** Every id in `collaborators` names an entry of the collaborations collection. */
function checkCollaborators(manifest: RawManifest, keys: Set<string>, findings: Finding[]): void {
    const value = manifest.collaborators;
    if (!Array.isArray(value)) return;
    for (const item of value) {
        if (typeof item !== 'string' || keys.has(item)) continue;
        findings.push({
            file: manifest.file,
            key: 'collaborators',
            message: `collaborators names no ${COLLABORATOR}: ${item}`
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

/** Which ids exist, by kind. A project is known by its folder name, which is the reader's `id`. */
function idSets(raw: RawPortfolio): IdSets {
    const of = (name: 'venues' | 'datasets' | 'programs' | 'domains' | 'funding'): Set<string> =>
        new Set(raw.registries[name].entries.map((entry) => entry.key).filter((key) => key !== ''));
    return {
        venues: of('venues'),
        datasets: of('datasets'),
        programs: of('programs'),
        domains: of('domains'),
        funding: of('funding'),
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
    const collaborators = collaboratorKeys(raw);
    const vocab: Vocabulary = rules.vocab;

    for (const manifest of raw.manifests) {
        checkKeys(manifest, schema, findings);
        checkType(manifest, vocab.types, findings);
        checkShapes(manifest, findings);
        checkReferences(manifest, ids, findings);
        checkCollaborators(manifest, collaborators, findings);
        checkChips(manifest, vocab.chips, findings);
    }
    checkFundingIdentity(raw, findings);
    checkEntryStatus(raw, vocab.statuses, findings);
    checkCollectionSchema(raw, findings);
    checkHostStatus(raw, rules, findings);

    return sortFindings(findings);
}
