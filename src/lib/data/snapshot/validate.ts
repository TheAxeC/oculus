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
} from '../model/index.ts';
import { z } from 'zod';
import { isMap, byKey, str } from '../helpers/guards.ts';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import {
    clusterFolder,
    itemsShape,
    listOrOneShape,
    mapShape,
    readAs,
    readOr,
    rowsShape,
    survivorsShape,
    textOrNumberOnlyShape,
    wordShape
} from '../shapes/shapes.ts';
import { JOINT_WORK, PERSON_FIELD, keptResources, namedSchemaShape } from './normalise.ts';
import { personalFindings } from './normalise-personal.ts';
import { checkOrganisations, checkResources } from './validate-kinds.ts';
import { checkThemes } from './validate-themes.ts';

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
    resources: Set<string>;
    projects: Set<string>;
};

/**
 * A manifest key that has been renamed, and the name it is written under now. One word for a thing
 * means the reader takes the new key alone, so a manifest still carrying the old one is a finding
 * that names both rather than a value quietly read under two names.
 */
export const RENAMED_FIELDS: Record<string, string> = { program: 'pillar' };

/**
 * A relation field of a manifest, the kind it points at, the set that kind's ids live in, and the
 * sentence that says an id of it resolves to nothing. The sentence is one catalog key per relation,
 * so the field and the noun it names are the catalog's words rather than two arguments.
 */
const REFERENCES: {
    field: string;
    kind: keyof IdSets;
    single: boolean;
    unresolved: (catalog: TextCatalog, id: string) => string;
}[] = [
    {
        field: 'venue_id',
        kind: 'venues',
        single: true,
        unresolved: (catalog, id) => findingText(catalog, 'findings.validate.no_venue', id)
    },
    {
        field: 'domain',
        kind: 'domains',
        single: true,
        unresolved: (catalog, id) => findingText(catalog, 'findings.validate.no_domain', id)
    },
    {
        field: 'funding',
        kind: 'funding',
        single: false,
        unresolved: (catalog, id) => findingText(catalog, 'findings.validate.no_funding', id)
    },
    {
        field: 'datasets',
        kind: 'datasets',
        single: false,
        unresolved: (catalog, id) => findingText(catalog, 'findings.validate.no_dataset', id)
    },
    {
        field: 'pillar',
        kind: 'pillars',
        single: false,
        unresolved: (catalog, id) => findingText(catalog, 'findings.validate.no_pillar', id)
    },
    {
        field: 'related',
        kind: 'projects',
        single: false,
        unresolved: (catalog, id) => findingText(catalog, 'findings.validate.no_related', id)
    },
    {
        field: 'compute',
        kind: 'resources',
        single: false,
        unresolved: (catalog, id) => findingText(catalog, 'findings.validate.no_resource', id)
    }
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
    { field: 'funding', kind: 'list', nullable: true },
    { field: 'compute', kind: 'list', nullable: true }
];

/** What each kind of `SHAPES` accepts: a text, or a list of anything. */
const KIND_SHAPES = { string: z.string(), list: itemsShape };

/** A text, which an id of a relation field must be. */
const idShape = z.string();

/** The ids among a list's items, as the list itself when every item is one. */
const idsShape = survivorsShape(idShape);

/** What a value is, in the words the shape messages use. */
function shapeOf(catalog: TextCatalog, value: unknown): string {
    if (value === null) return findingText(catalog, 'findings.shape.is_null');
    if (Array.isArray(value)) return findingText(catalog, 'findings.shape.is_list');
    if (isMap(value)) return findingText(catalog, 'findings.shape.is_map');
    return findingText(catalog, 'findings.shape.is_other', typeof value);
}

/** The names of a schema written as a list of maps, every one with a `field` text. */
const fieldRowsShape = z
    .array(z.object({ field: z.string() }))
    .transform((rows) => rows.map((row) => row.field));

/**
 * The names of a schema written as a list: its texts and the `field` of its maps, in order. A list
 * of maps that all name a field is read by `fieldRowsShape`, the one a schema of the hub is.
 */
const listNamesShape = z.union([
    fieldRowsShape,
    rowsShape(z.union([z.object({ field: z.string() }).transform((row) => row.field), z.string()]))
]);

/**
 * The field names the schema holds, whatever shape the config gives it: a list of names, a list of
 * maps with a `field` key, a map with a `fields` map inside (what the hub's manifest-schema.yml
 * has), or a plain map of names. A schema that names nothing leaves every key unnamed, and every
 * key of every manifest is then a finding; there is no quiet path where the check does not run.
 */
export function fieldNames(schema: unknown): string[] {
    const list = readAs(listNamesShape, schema);
    if (list !== null) return list;
    const map = readAs(mapShape, schema);
    return map === null ? [] : Object.keys(readOr(mapShape, map.fields, map));
}

/**
 * Split the dotted names: `status.chips` puts `status` in `top` and `chips` under it in `nested`.
 */
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
function checkKeys(
    manifest: RawManifest,
    schema: SchemaKeys,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    for (const key of Object.keys(manifest)) {
        if (!schema.top.has(key)) {
            const renamed = byKey(RENAMED_FIELDS, key);
            findings.push({
                file: manifest.file,
                key,
                message:
                    renamed === undefined
                        ? findingText(catalog, 'findings.validate.key_not_in_schema', key)
                        : findingText(catalog, 'findings.validate.key_renamed', key, renamed)
            });
            continue;
        }
        const inner = schema.nested.get(key);
        if (inner === undefined) continue;
        const value = readAs(mapShape, manifest[key]);
        if (value === null) continue;
        for (const sub of Object.keys(value)) {
            if (inner.has(sub)) continue;
            findings.push({
                file: manifest.file,
                key: `${key}.${sub}`,
                message: findingText(
                    catalog,
                    'findings.validate.key_not_in_schema',
                    `${key}.${sub}`
                )
            });
        }
    }
}

/** `type` is one of the type vocabulary. A manifest without one is a tier's business, not ours. */
function checkType(
    manifest: RawManifest,
    types: string[],
    catalog: TextCatalog,
    findings: Finding[]
): void {
    const type = manifest.type;
    if (type === undefined) return;
    if (typeof type !== 'string' || !types.includes(type)) {
        findings.push({
            file: manifest.file,
            key: 'type',
            message: findingText(
                catalog,
                'findings.validate.type_not_in_vocab',
                JSON.stringify(type)
            )
        });
    }
}

/**
 * The manifest's `focus:` names a lane of `focus_lanes` or `holding`, the ideas backlog. A value
 * outside them is not drawn anywhere: the board puts a non-idea on no lane at all and an idea in
 * the backlog, and until this check that was silent. No lanes in the vocabulary means the check is
 * off, the way `chips` behaves.
 */
function checkFocus(
    manifest: RawManifest,
    lanes: string[] | undefined,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    const focus = manifest.focus;
    if (lanes === undefined || focus === undefined) return;
    if (typeof focus !== 'string' || !lanes.includes(focus)) {
        findings.push({
            file: manifest.file,
            key: 'focus',
            message: findingText(
                catalog,
                'findings.validate.focus_not_a_lane',
                JSON.stringify(focus)
            )
        });
    }
}

/**
 * The sentence for a field whose value has the wrong shape: what the field must be, which is one
 * catalog key per shape and nullability, and what it is instead. A null in a field that may not
 * hold one takes the same sentence as any other wrong shape, with `null` as what it is.
 */
function shapeSentence(
    catalog: TextCatalog,
    shape: (typeof SHAPES)[number],
    value: unknown
): string {
    const got = shapeOf(catalog, value);
    if (shape.kind === 'list' && shape.nullable) {
        return findingText(catalog, 'findings.validate.must_be_list_or_null', shape.field, got);
    }
    if (shape.kind === 'list') {
        return findingText(catalog, 'findings.validate.must_be_list', shape.field, got);
    }
    if (shape.nullable) {
        return findingText(catalog, 'findings.validate.must_be_string_or_null', shape.field, got);
    }
    return findingText(catalog, 'findings.validate.must_be_string', shape.field, got);
}

/** The relation fields have the shapes the tree has them in; an absent field has no shape. */
function checkShapes(manifest: RawManifest, catalog: TextCatalog, findings: Finding[]): void {
    for (const shape of SHAPES) {
        const value = manifest[shape.field];
        if (value === undefined) continue;
        if (value === null && shape.nullable) continue;
        if (value !== null && KIND_SHAPES[shape.kind].safeParse(value).success) continue;
        findings.push({
            file: manifest.file,
            key: shape.field,
            message: shapeSentence(catalog, shape, value)
        });
    }
}

/** Every id a manifest names resolves to an entity of the kind that field points at. */
function checkReferences(
    manifest: RawManifest,
    ids: IdSets,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    for (const relation of REFERENCES) {
        const value = manifest[relation.field];
        if (value === undefined || value === null) continue;
        const named = relation.single ? [readAs(idShape, value)] : readOr(idsShape, value, []);
        for (const item of named) {
            if (item === null || ids[relation.kind].has(item)) continue;
            findings.push({
                file: manifest.file,
                key: relation.field,
                message: relation.unresolved(catalog, item)
            });
        }
    }
}

/**
 * `paths.cluster` names the folder on the cluster that holds the project's code, which Submit
 * copies to and runs from. A value the folder rule refuses (`clusterFolder`) is a finding, and
 * Submit refuses the project for it, so a mistyped folder is reported where it is written.
 */
function checkClusterFolder(
    manifest: RawManifest,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    const paths = readAs(mapShape, manifest.paths);
    if (paths === null || !Object.hasOwn(paths, 'cluster')) return;
    if (clusterFolder(paths.cluster) !== null) return;
    findings.push({
        file: manifest.file,
        key: 'paths.cluster',
        message: findingText(
            catalog,
            'findings.validate.bad_cluster',
            JSON.stringify(paths.cluster)
        )
    });
}

/** A project's `related:` names other projects; naming itself draws a card that links to itself. */
function checkSelfRelated(manifest: RawManifest, catalog: TextCatalog, findings: Finding[]): void {
    if (manifest.related === undefined) return;
    for (const item of readOr(itemsShape, manifest.related, [])) {
        if (item !== manifest.id) continue;
        findings.push({
            file: manifest.file,
            key: 'related',
            message: findingText(catalog, 'findings.validate.related_itself', manifest.id)
        });
    }
}

/**
 * Every project folder has a name of its own. The folder name is the project's id, so two manifests
 * under folders of one name are one id: the second card overwrites the first, and the sessions
 * matcher, which finds a project by its folder name, cannot tell the two apart.
 */
function checkFolderNames(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
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
                message: findingText(catalog, 'findings.validate.folder_shared', held.length, name)
            });
        }
    }
}

/** Every id in `collaborators` names an entry of the people registry. */
function checkCollaborators(
    manifest: RawManifest,
    keys: Set<string>,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    if (manifest.collaborators === undefined) return;
    for (const item of readOr(idsShape, manifest.collaborators, [])) {
        if (keys.has(item)) continue;
        findings.push({
            file: manifest.file,
            key: 'collaborators',
            message: findingText(catalog, 'findings.validate.no_collaborator', item)
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
    catalog: TextCatalog,
    findings: Finding[]
): void {
    if (manifest['waiting-on'] === undefined) return;
    for (const item of readOr(idsShape, manifest['waiting-on'], [])) {
        if (item === manifest.id) {
            findings.push({
                file: manifest.file,
                key: 'waiting-on',
                message: findingText(catalog, 'findings.validate.waiting_on_itself', item)
            });
            continue;
        }
        if (keys.has(item) || projects.has(item)) continue;
        findings.push({
            file: manifest.file,
            key: 'waiting-on',
            message: findingText(catalog, 'findings.validate.no_waiting_on', item)
        });
    }
}

/**
 * `status.chips` is a list of strings, and each chip is in the chip vocabulary when the config
 * holds one. When it does not, `chips` is absent from the vocabulary and a chip is a free string.
 */
function checkChips(
    manifest: RawManifest,
    chips: string[] | undefined,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    const status = readAs(mapShape, manifest.status);
    if (status?.chips === undefined) return;
    const file = manifest.file;
    const key = 'status.chips';
    const held = readAs(itemsShape, status.chips);
    if (held === null) {
        findings.push({
            file,
            key,
            message: findingText(
                catalog,
                'findings.validate.chips_not_a_list',
                shapeOf(catalog, status.chips)
            )
        });
        return;
    }
    for (const one of held) {
        const chip = readAs(idShape, one);
        if (chip === null) {
            findings.push({
                file,
                key,
                message: findingText(
                    catalog,
                    'findings.validate.chip_not_a_string',
                    shapeOf(catalog, one)
                )
            });
            continue;
        }
        if (chips !== undefined && !chips.includes(chip)) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.validate.chip_not_in_vocab', chip)
            });
        }
    }
}

/** A collection entry's `status`, when it has one, is a word of the status vocabulary. */
function checkEntryStatus(
    raw: RawPortfolio,
    statuses: string[],
    catalog: TextCatalog,
    findings: Finding[]
): void {
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        collection.entries.forEach((entry, index) => {
            const status = entry.status;
            if (status === undefined) return;
            if (typeof status === 'string' && statuses.includes(status)) return;
            findings.push({
                file: collection.file,
                key: `entries[${index}].status`,
                message: findingText(
                    catalog,
                    'findings.validate.status_not_in_vocab',
                    JSON.stringify(status)
                )
            });
        });
    }
}

/**
 * A collection file's `schema:`, when it has one, is a list of maps each naming a `field` and a
 * `type`. It is what a collection is drawn by, so one malformed entry costs the whole file its
 * field order; normalise leaves such a schema off the wire and this is where that is said.
 */
function checkCollectionSchema(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        const schema = collection.meta.schema;
        if (schema === undefined) continue;
        if (namedSchemaShape.safeParse(schema).success) continue;
        findings.push({
            file: collection.file,
            key: 'schema',
            message: findingText(
                catalog,
                'findings.validate.schema_malformed',
                shapeOf(catalog, schema)
            )
        });
    }
}

/**
 * Two entries of one collection with the same identity value. The identity field is the schema's
 * first, `title` where the file has no schema, and it is what a write addresses an entry by: with
 * two of one value, an edit reaches the first and the second can be neither edited nor removed.
 */
function checkEntryIdentity(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        const names = fieldNames(collection.meta.schema);
        const ident = names.length > 0 ? names[0] : 'title';
        const values = collection.entries.map((entry) =>
            readAs(textOrNumberOnlyShape, entry[ident])
        );
        const counts = new Map<string, number>();
        for (const value of values) {
            if (value !== null) counts.set(value, (counts.get(value) ?? 0) + 1);
        }
        values.forEach((value, index) => {
            if (value === null || (counts.get(value) ?? 0) < 2) return;
            findings.push({
                file: collection.file,
                key: `entries[${index}].${ident}`,
                message: findingText(catalog, 'findings.validate.identity_shared', ident, value)
            });
        });
    }
}

/**
 * Every key of a person's `affiliations:` names an organisation of the registry, the entry writes
 * the list under that name, and exactly one entry carries `self: true`. The affiliations are what
 * draw the person's organisations everywhere a person is shown, so a free string there is a name
 * nothing can be looked up by; `self` is how the hub knows which entry is its owner, and two of
 * them or none leaves that question unanswered.
 */
function checkPeople(
    raw: RawPortfolio,
    organisations: Set<string>,
    catalog: TextCatalog,
    findings: Finding[]
): void {
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
                message: findingText(catalog, 'findings.validate.affiliation_retired')
            });
        }
        const held = entry.affiliations ?? entry.affiliation;
        if (held === undefined || held === null) return;
        readOr(listOrOneShape, held, []).forEach((one, at) => {
            if (typeof one === 'string' && organisations.has(one)) return;
            findings.push({
                file: entry.file,
                key: `entries[${index}].affiliations[${at}]`,
                message: findingText(
                    catalog,
                    'findings.validate.no_affiliation',
                    JSON.stringify(one)
                )
            });
        });
    });
    if (entries.length === 0 || selves.length === 1) return;
    const file = entries[0]?.file ?? '';
    findings.push({
        file,
        key: 'entries',
        message: findingText(catalog, 'findings.validate.self_not_one', selves.length)
    });
}

/**
 * Every entry of the joint-work collection names a person of the registry. The entry is a piece of
 * work with one human, so an entry with no `person:` is a card no reader can follow to whoever the
 * work is with, which is the whole of what the collection is for.
 */
function checkJointWork(
    raw: RawPortfolio,
    people: Set<string>,
    catalog: TextCatalog,
    findings: Finding[]
): void {
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
                    ? findingText(catalog, 'findings.validate.joint_work_no_person', PERSON_FIELD)
                    : findingText(
                          catalog,
                          'findings.validate.joint_work_unknown_person',
                          PERSON_FIELD,
                          JSON.stringify(held)
                      )
        });
    });
}

/**
 * A funding scheme's `funder:` names an organisation of the registry. It is the same rule as a
 * person's affiliations, from the other file: who funds a scheme is an organisation the hub holds.
 */
function checkFunders(
    raw: RawPortfolio,
    organisations: Set<string>,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    raw.registries.funding.entries.forEach((entry, index) => {
        const funder = entry.funder;
        if (funder === undefined || funder === null) return;
        if (typeof funder === 'string' && organisations.has(funder)) return;
        findings.push({
            file: entry.file,
            key: `entries[${index}].funder`,
            message: findingText(catalog, 'findings.validate.no_funder', JSON.stringify(funder))
        });
    });
}

/**
 * A funding entry is known by its `key` when it has one and by its `title` otherwise, so an entry
 * with neither has no identity and normalise cannot carry it. The other four registries require an
 * id and their reader has already reported a missing one, so only funding is checked here.
 */
function checkFundingIdentity(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    raw.registries.funding.entries.forEach((entry, index) => {
        if (entry.key.length > 0) return;
        if (typeof entry.title === 'string' && entry.title.length > 0) return;
        findings.push({
            file: entry.file,
            key: `entries[${index}]`,
            message: findingText(catalog, 'findings.validate.funding_no_identity')
        });
    });
}

/** The two texts of a funding entry the acknowledgment check reads, the empty text when wrong. */
const fundingRowShape = z.object({ status: wordShape, title: wordShape });

/** The statuses of a funding entry that a manuscript may have to acknowledge. */
const ACKNOWLEDGED = new Set(['awarded', 'contributing']);

/**
 * An awarded or contributing funding entry is one a manifest tags and a manuscript acknowledges, so
 * it needs a `key` the tag can name and a `statement` the manuscript pastes. An application gets
 * both when it is granted; until then neither is asked for.
 */
function checkFundingStatements(
    raw: RawPortfolio,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    raw.registries.funding.entries.forEach((entry, index) => {
        const { status, title } = readOr(fundingRowShape, entry, { status: '', title: '' });
        if (!ACKNOWLEDGED.has(status)) return;
        const name = entry.key.length > 0 ? entry.key : title;
        const statement = entry.statement;
        if (entry.key.length === 0) {
            findings.push({
                file: entry.file,
                key: `entries[${index}]`,
                message: findingText(catalog, 'findings.validate.funding_no_key', name, status)
            });
        }
        if (typeof statement !== 'string' || statement.trim().length === 0) {
            findings.push({
                file: entry.file,
                key: `entries[${index}]`,
                message: findingText(
                    catalog,
                    'findings.validate.funding_no_statement',
                    name,
                    status
                )
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
        resources: new Set(keptResources(raw.registries.resources.entries).map((one) => one.key)),
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

/** A host row of the career file: a map, whose `status` is the empty text when it is not a text. */
const hostRowShape = z.object({ status: wordShape });

/**
 * A host of the career file whose `status:` is not one of `career_host_status`. The buttons on a
 * host row are that vocabulary, so a status outside it is a row the board cannot move on.
 */
function checkHostStatus(raw: RawPortfolio, rules: ValidationRules, findings: Finding[]): void {
    const allowed = rules.vocab.hostStatuses;
    if (allowed === undefined || allowed.length === 0 || raw.career === null) return;
    const hosts = readAs(itemsShape, raw.career.hosts);
    if (hosts === null) return;
    const file = rules.careerFile ?? '';
    hosts.forEach((held, index) => {
        const row = readAs(hostRowShape, held);
        if (row === null || row.status === '' || allowed.includes(row.status)) return;
        const status = row.status;
        findings.push({
            file,
            key: `hosts[${index}]`,
            message: findingText(rules.text, 'findings.validate.host_status', status)
        });
    });
}

/**
 * Every problem in one raw portfolio, the sources' own findings among them, sorted by file then
 * key. Nothing is thrown and nothing is repaired: a caller decides what a finding means, and the
 * snapshot carries the list so the app can show it.
 */
export function validate(raw: RawPortfolio, rules: ValidationRules): Finding[] {
    const findings: Finding[] = [...raw.findings];
    const schema = schemaKeys(rules.schema);
    const ids = idSets(raw);
    const vocab: Vocabulary = rules.vocab;
    const catalog = rules.text;

    for (const manifest of raw.manifests) {
        checkKeys(manifest, schema, catalog, findings);
        checkType(manifest, vocab.types, catalog, findings);
        checkFocus(manifest, vocab.lanes, catalog, findings);
        checkShapes(manifest, catalog, findings);
        checkReferences(manifest, ids, catalog, findings);
        checkSelfRelated(manifest, catalog, findings);
        checkClusterFolder(manifest, catalog, findings);
        checkCollaborators(manifest, ids.people, catalog, findings);
        checkWaitingOn(manifest, ids.people, ids.projects, catalog, findings);
        checkChips(manifest, vocab.chips, catalog, findings);
    }
    checkFolderNames(raw, catalog, findings);
    checkPeople(raw, ids.organisations, catalog, findings);
    checkOrganisations(raw, catalog, findings);
    checkResources(raw, catalog, findings);
    checkJointWork(raw, ids.people, catalog, findings);
    checkFunders(raw, ids.organisations, catalog, findings);
    checkFundingIdentity(raw, catalog, findings);
    checkFundingStatements(raw, catalog, findings);
    checkEntryStatus(raw, vocab.statuses, catalog, findings);
    checkEntryIdentity(raw, catalog, findings);
    checkCollectionSchema(raw, catalog, findings);
    checkHostStatus(raw, rules, findings);
    checkThemes(raw, rules, findings);
    findings.push(...personalFindings(raw.personal, vocab.sideStatuses, catalog));

    return sortFindings(findings);
}
