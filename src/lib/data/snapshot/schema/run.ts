// Layer 1, data. One build of the schemas and the checks over them: the hub's files are read, each
// schema is generated from the files' own `schema:` blocks and the oculus schema files, every
// document the hub's findings cover is checked against its schema, and the set of schemas with the
// rules that match them to files is handed back for the editor, the reader's bookmarks file among
// them.
//
// The findings are the schema's side of the integrity gate: a key no schema declares, a value
// outside its options, a reference to a key no hub of the workspace holds, a field outside its
// `when`, a required field that is missing, a key that stands twice in a referenced file, a
// `schema:` block that does not read, a file of entries whose primary key is missing, doubled or
// does not read, a `display:` rank that does not read or orders two fields, and a file a
// `foreign_key:` names whose schema ranks no field by `display:`. The documents checked are the
// project manifests and the hub's data files. The other schemas serve the editor alone: the readers
// of their files report their own findings. The texts of the manifests and hub data files the run
// read come back with it, so the reference index (snapshot/references/) scans them without reading
// a file again.
//
// Server side only: it reads the files it checks.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LineCounter, isNode, parse, parseDocument } from 'yaml';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { VOCAB_FILE_KEYS } from '../../shapes/catalog-files/vocab.ts';
import {
    FILTERED_TYPES,
    displayFields,
    primaryKeyOf,
    type Finding,
    type PortfolioConfig,
    type RawPortfolio,
    type ScanRule,
    type SchemaField
} from '../../model/index.ts';
import { UNKEYED_TYPES } from '../../model/model-collections.ts';
import { MANIFEST, ROOT_FOLDER, feedPrimaryKey, reservedTarget } from '../../helpers/hub-names.ts';
import { checkDocument, isWords, type Checker, type SchemaDoc } from './check.ts';
import { fileSchema, writtenFields, type FileKind } from './hub.ts';
import { schemaText, type JsonSchema } from './json.ts';
import { duplicateKeys, hubLists, joinedLists, listsOf, targetLists, vocabLists } from './lists.ts';
import { manifestFields, manifestSchema } from './manifest.ts';
import { displayShape, fieldsOf, keyedSchema, readOptions, type OptionProblem } from './field.ts';
import { problemText, type Context, type SchemaProblem } from './record.ts';
import type { SchemaRule, SchemaSet } from './set.ts';
import { projectFileSchemas } from './static.ts';

/** A hub data file the build read: its text and the fields of its `schema:` block, if it reads. */
type HubFileRead = {
    /** The path from the hub. */
    path: string;
    text: string;
    fields: SchemaField[] | undefined;
    /** The schema the file's primary key is read by (`keyedSchema`). */
    keyed: SchemaField[] | null | undefined;
    kind: FileKind;
    list: string;
};

/** The texts one build read, which the reference index scans so no file is read twice. */
export type ReadTexts = {
    hub: HubFileRead[];
    manifests: { file: string; text: string }[];
};

/**
 * What one build of the schemas gives: the set for the editor, the findings for the gate and the
 * texts the build read.
 */
export type SchemaRun = { set: SchemaSet; findings: Finding[]; read: ReadTexts };

/**
 * A hub data file the gate checks, by its hub-relative path, with the primary key its
 * `collections:` entry names (`named`), which a file with no schema is keyed by.
 */
type HubFile = { path: string; kind: FileKind; list: string; collection: boolean; named?: string };

/** The hub's data files: the registries, the collections, the feeds and the career file. */
function hubFiles(config: PortfolioConfig): HubFile[] {
    const files = new Map<string, HubFile>();
    const add = (file: HubFile): void => {
        const held = files.get(file.path);
        files.set(file.path, {
            ...file,
            collection: file.collection || (held?.collection ?? false),
            named: file.named ?? held?.named
        });
    };
    const listOf = (path: string): string =>
        path === config.registries.datasets ? 'datasets' : 'entries';
    for (const [name, path] of Object.entries(config.registries)) {
        const named = config.collections.find((one) => one.registry === name)?.primary_key;
        add({ path, kind: 'entries', list: listOf(path), collection: false, named });
    }
    for (const one of config.collections) {
        const named = one.primary_key;
        add({ path: one.file, kind: 'entries', list: listOf(one.file), collection: true, named });
    }
    for (const feed of ['leads', 'radar'] as const) {
        const named = feedPrimaryKey(config.merged.collections, feed);
        const path = config.feeds[feed];
        add({ path, kind: 'entries', list: 'entries', collection: false, named });
    }
    if (config.career !== null) {
        add({ path: config.career, kind: 'sections', list: 'entries', collection: false });
    }
    return [...files.values()];
}

/**
 * The reader's bookmarks file where a hub keeps it, the default of server/files/workspace/paths.ts.
 */
const BOOKMARKS_FILE = `${ROOT_FOLDER}/bookmarks.yml`;

/**
 * A text as the map it parses to: the empty map for a text that parses to anything else, and
 * undefined for one that does not parse.
 */
function dataOf(text: string): Record<string, unknown> | undefined {
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch {
        return undefined;
    }
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
}

/** The fields of a text's own `schema:` block, or none when it has none or it does not read. */
function ownBlock(text: string): SchemaField[] | undefined {
    const held = dataOf(text);
    return held?.schema === undefined ? undefined : fieldsOf(held.schema);
}

/**
 * The primary key of a file of entries that parsed to `data`, its `collections:` entry naming
 * `named` (`primaryKeyOf`); null also for a `schema:` block that does not read.
 */
function keyOf(data: Record<string, unknown>, named: string | undefined): string | null {
    return primaryKeyOf(keyedSchema(data.schema), named);
}

/** A scan rule's directory without its trailing slash. */
function dirOf(rule: ScanRule): string {
    return rule.dir.replace(/\/+$/, '');
}

/** The name a hub data file's schema goes by: its path without the extension. */
function nameOf(path: string): string {
    return `files/${path.replace(/\.ya?ml$/, '')}`;
}

/** The text of a file, or undefined when it cannot be read. */
function readText(file: string): string | undefined {
    try {
        return readFileSync(file, 'utf8');
    } catch {
        return undefined;
    }
}

/** The finding for a schema that names a source or a field that does not exist. */
function problemFinding(config: PortfolioConfig, file: string, problem: SchemaProblem): Finding {
    return { file, key: problem.key, message: problemText(config.text, problem) };
}

/** The line of the node a path reaches in a text, or undefined when the path reaches none. */
function lineAt(text: string, path: (string | number)[]): number | undefined {
    const lines = new LineCounter();
    const node = parseDocument(text, { lineCounter: lines }).getIn(path, true);
    return isNode(node) && node.range ? lines.linePos(node.range[0]).line : undefined;
}

/** The sentence of one option problem of the field `field`, in the catalog's words. */
function optionText(catalog: TextCatalog, field: string, problem: OptionProblem): string {
    switch (problem.word) {
        case 'kind':
            return findingText(catalog, 'findings.schema.option_kind', field);
        case 'no_key':
            return findingText(catalog, 'findings.schema.option_no_key', field);
        case 'not_word':
            return findingText(catalog, 'findings.schema.option_not_word', field, problem.key);
        case 'label':
            return findingText(catalog, 'findings.schema.option_label', field, problem.key);
        case 'taken':
            return findingText(catalog, 'findings.schema.option_taken', field, problem.key);
        case 'extra':
            return findingText(
                catalog,
                'findings.schema.option_extra',
                field,
                problem.extra ?? '',
                problem.key
            );
    }
}

/**
 * The findings of a `schema:` block's own fields that the schema of a schema cannot word: an
 * option of a field's `options:` that does not read, on its line, and a `filter: true` on a type
 * no filter is drawn for, on the line of the flag. Both name the field.
 */
function fieldFindings(
    config: PortfolioConfig,
    file: string,
    text: string,
    schema: unknown[],
    fields: SchemaField[]
): Finding[] {
    const found: Finding[] = [];
    fields.forEach((field, at) => {
        const held = schema[at] as Record<string, unknown>;
        for (const problem of readOptions(held.options).problems) {
            const path = ['schema', at, 'options', problem.index];
            const line = lineAt(text, path);
            found.push({
                file,
                key: `schema[${at}].options[${problem.index}]`,
                message: optionText(config.text, field.field, problem),
                ...(line === undefined ? {} : { line })
            });
        }
        if (field.filter === true && !FILTERED_TYPES.includes(field.type)) {
            const line = lineAt(text, ['schema', at, 'filter']);
            found.push({
                file,
                key: `schema[${at}].filter`,
                message: findingText(
                    config.text,
                    'findings.schema.bad_filter',
                    field.field,
                    field.type
                ),
                ...(line === undefined ? {} : { line })
            });
        }
    });
    return found;
}

/** A field of a `schema:` block as written, a map, and the empty map for anything else. */
function rowOf(item: unknown): Record<string, unknown> {
    return typeof item === 'object' && item !== null && !Array.isArray(item)
        ? (item as Record<string, unknown>)
        : {};
}

/** A value as the words a finding names it by. */
function shown(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

/** One finding of a file at a path of its text, on the line the path reaches. */
function findingAt(
    file: string,
    text: string,
    path: (string | number)[],
    message: string
): Finding {
    const line = lineAt(text, path);
    const key = path.map((step) => (typeof step === 'number' ? `[${step}]` : `.${step}`));
    return {
        file,
        key: key.join('').replace(/^\./, ''),
        message,
        ...(line === undefined ? {} : { line })
    };
}

/**
 * The `primary_key:` of a field of a `records` field, at any depth, each a finding: a record of a
 * field has no primary key of its own. `at` is the path of the `fields:` list in the text.
 */
function nestedKeys(
    catalog: TextCatalog,
    file: string,
    text: string,
    rows: unknown,
    at: (string | number)[]
): Finding[] {
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((item: unknown, index) => {
        const row = rowOf(item);
        const path = [...at, index];
        const own = Object.hasOwn(row, 'primary_key')
            ? [
                  findingAt(
                      file,
                      text,
                      [...path, 'primary_key'],
                      findingText(catalog, 'findings.schema.key_nested', shown(row.field))
                  )
              ]
            : [];
        return [...own, ...nestedKeys(catalog, file, text, row.fields, [...path, 'fields'])];
    });
}

/**
 * The findings of the primary key of a file of entries whose `schema:` block is `schema` as
 * written and `fields` as read, its `collections:` entry naming `named`: a `primary_key:` that is
 * not `true`, one on a field of `UNKEYED_TYPES` or of a `records` field, a schema that flags no
 * field or two, and one flag beside the named key. Each names the field or the fields, and a file
 * that has no primary key by them (`primaryKeyOf`) has every write to an entry refused.
 */
function keyFindings(
    catalog: TextCatalog,
    file: string,
    text: string,
    schema: unknown[],
    named: string | undefined
): Finding[] {
    const found: Finding[] = [];
    const flagged: string[] = [];
    const carried = schema.some((item) => Object.hasOwn(rowOf(item), 'primary_key'));
    const at = (path: (string | number)[], sentence: string): Finding =>
        findingAt(file, text, path, sentence);
    schema.forEach((item, index) => {
        const row = rowOf(item);
        found.push(...nestedKeys(catalog, file, text, row.fields, ['schema', index, 'fields']));
        if (!Object.hasOwn(row, 'primary_key')) return;
        const path = ['schema', index, 'primary_key'];
        const field = shown(row.field);
        if (row.primary_key !== true) {
            const value = shown(row.primary_key);
            const sentence = findingText(catalog, 'findings.schema.key_not_true', field, value);
            found.push(at(path, sentence));
            return;
        }
        flagged.push(field);
        if (UNKEYED_TYPES.includes(shown(row.type))) {
            const type = shown(row.type);
            found.push(at(path, findingText(catalog, 'findings.schema.key_listed', field, type)));
        }
    });
    const whole = (sentence: string): Finding => at(['schema'], sentence);
    if (flagged.length > 1) {
        found.push(whole(findingText(catalog, 'findings.schema.key_two', flagged.join(', '))));
    } else if (flagged.length === 1 && named !== undefined) {
        found.push(whole(findingText(catalog, 'findings.schema.key_beside', named, flagged[0])));
    } else if (!carried) found.push(whole(findingText(catalog, 'findings.schema.key_none')));
    return found;
}

/**
 * The findings of the `display:` ranks of a `schema:` block: a rank that is no whole number from
 * 1, and a rank two fields carry, on the second of them.
 */
function displayFindings(
    catalog: TextCatalog,
    file: string,
    text: string,
    schema: unknown[]
): Finding[] {
    const found: Finding[] = [];
    const ranks = new Map<number, string[]>();
    const at = (path: (string | number)[], sentence: string): Finding =>
        findingAt(file, text, path, sentence);
    schema.forEach((item, index) => {
        const row = rowOf(item);
        if (!Object.hasOwn(row, 'display')) return;
        const path = ['schema', index, 'display'];
        const field = shown(row.field);
        const rank = displayShape.parse(row.display);
        if (rank === undefined) {
            const value = shown(row.display);
            const sentence = findingText(catalog, 'findings.schema.display_rank', field, value);
            found.push(at(path, sentence));
            return;
        }
        const held = [...(ranks.get(rank) ?? []), field];
        ranks.set(rank, held);
        if (held.length === 2) {
            const both = held.join(', ');
            const sentence = findingText(catalog, 'findings.schema.display_twice', both, `${rank}`);
            found.push(at(path, sentence));
        }
    });
    return found;
}

/** Every `foreign_key:` target of a list of fields, at any depth, with the field naming it. */
function targetsOf(fields: readonly SchemaField[]): { field: string; target: string }[] {
    return fields.flatMap((one) => {
        const keys = one.foreign_key;
        const named =
            keys === undefined ? [] : Array.isArray(keys) ? keys : Object.values(keys.sources);
        return [
            ...named.map((target) => ({ field: one.field, target })),
            ...targetsOf(one.fields ?? [])
        ];
    });
}

/**
 * One finding for each file of entries a `foreign_key:` names whose schema ranks no field by
 * `display:`, so a choice of its entries reads as the primary key. `targeted` holds each such
 * file by its hub-relative path, with the field met first that names it and that field's file;
 * `schemas` the fields of each file's schema that read. A file with no schema has no finding here.
 */
function displayNone(
    config: PortfolioConfig,
    hub: string,
    targeted: ReadonlyMap<string, { field: string; file: string }>,
    schemas: ReadonlyMap<string, SchemaField[]>
): Finding[] {
    return [...targeted].flatMap(([path, by]) => {
        const fields = schemas.get(path);
        if (fields === undefined || displayFields(fields).length > 0) return [];
        const words = findingText(config.text, 'findings.schema.display_none', by.field, by.file);
        return [{ file: join(hub, path), key: 'schema', message: words }];
    });
}

/**
 * Generate the schemas of one build and check the hub against them. `checker` holds the validators
 * compiled so far, so a build whose schemas did not change compiles nothing. `unread` names the
 * sources whose file did not read, whose keys are not known. `others` holds the keys the other hubs
 * of the workspace hold, by source, which a field that names a record takes beside the hub's own,
 * so the editor marks no value the merge of the hubs resolves.
 */
export function runSchemas(
    hub: string,
    config: PortfolioConfig,
    raw: RawPortfolio,
    checker: Checker,
    unread: ReadonlySet<string>,
    others: Readonly<Record<string, readonly string[]>> = {}
): SchemaRun {
    const texts: Record<string, string> = {};
    const rules: SchemaRule[] = [];
    const findings: Finding[] = [];
    const docs: SchemaDoc[] = [];
    const read: ReadTexts = { hub: [], manifests: [] };
    const lists = targetLists(
        raw,
        config.collections,
        listsOf(
            joinedLists(hubLists(raw), others),
            vocabLists(config.merged, VOCAB_FILE_KEYS),
            unread
        )
    );
    const files = hubFiles(config).flatMap((file) => {
        const text = readText(join(hub, file.path));
        return text === undefined ? [] : [{ ...file, text, data: dataOf(text) }];
    });
    // The paths of the read files of entries that have no primary key, which a foreign key naming
    // their collection is a finding of.
    const unkeyedPaths = new Set(
        files.flatMap((one) =>
            one.kind === 'entries' && one.data !== undefined && keyOf(one.data, one.named) === null
                ? [one.path]
                : []
        )
    );
    const unkeyed = (target: string): boolean => {
        const entry = config.collections.find((one) => one.key === target);
        return entry !== undefined && !reservedTarget(target) && unkeyedPaths.has(entry.file);
    };
    const context = (at: string): Context => ({ lists, problems: [], at, unkeyed });
    const add = (name: string, schema: JsonSchema, rule: Omit<SchemaRule, 'name'>): void => {
        texts[name] = schemaText(schema);
        rules.push({ name, ...rule });
    };

    const scans = config.scan.map(dirOf);
    const manifest = context('');
    if (config.schema !== undefined) {
        add('manifest', manifestSchema(config.schema, manifest, config.merged.groups), {
            hub: scans.flatMap((dir) => [
                `${dir}/**/${MANIFEST}`,
                `${dir}/**/${ROOT_FOLDER}/${MANIFEST}`
            ]),
            every: [MANIFEST, `${ROOT_FOLDER}/${MANIFEST}`]
        });
        for (const one of raw.manifests) docs.push({ name: 'manifest', file: one.file, text: '' });
    }

    // Each file of entries that is a target of a foreign key, by its path, with the field met first
    // that names it and the file that field is in; and the fields of each file's schema, by its
    // path.
    const targeted = new Map<string, { field: string; file: string }>();
    const schemas = new Map<string, SchemaField[]>();
    const target = (fields: readonly SchemaField[], file: string): void => {
        for (const one of targetsOf(fields)) {
            const entry = config.collections.find((held) => held.key === one.target);
            if (entry === undefined || reservedTarget(one.target) || targeted.has(entry.file)) {
                continue;
            }
            targeted.set(entry.file, { field: one.field, file });
        }
    };
    if (config.schema !== undefined) target(manifestFields(config.schema), MANIFEST);

    for (const file of files) {
        const { text, data: held } = file;
        const path = join(hub, file.path);
        const own = { path: file.path, text, kind: file.kind, list: file.list };
        if (held === undefined) {
            read.hub.push({ ...own, fields: undefined, keyed: undefined });
            continue;
        }
        const fields = held.schema === undefined ? undefined : fieldsOf(held.schema);
        read.hub.push({ ...own, fields, keyed: keyedSchema(held.schema) });
        if (held.schema === undefined) {
            if (file.kind === 'entries' && file.named === undefined) {
                const words = findingText(config.text, 'findings.schema.key_missing');
                findings.push({ file: path, key: '', message: words });
            }
            continue;
        }
        if (fields === undefined) {
            findings.push({
                file: path,
                key: 'schema',
                message: findingText(
                    config.text,
                    'findings.validate.schema_malformed',
                    isWords(config.text, held.schema)
                )
            });
            continue;
        }
        const ctx = context('schema.');
        const written = file.collection ? writtenFields(config.text) : [];
        const name = nameOf(file.path);
        add(
            name,
            fileSchema(fields, { kind: file.kind, list: file.list, written, own: true }, ctx),
            { hub: [file.path] }
        );
        findings.push(...ctx.problems.map((problem) => problemFinding(config, path, problem)));
        const block = held.schema as unknown[];
        findings.push(...fieldFindings(config, path, text, block, fields));
        findings.push(...displayFindings(config.text, path, text, block));
        if (file.kind === 'entries') {
            findings.push(...keyFindings(config.text, path, text, block, file.named));
        }
        schemas.set(file.path, fields);
        target(fields, file.path);
        docs.push({ name, file: path, text });
    }
    findings.push(...displayNone(config, hub, targeted, schemas));

    // The reader's bookmarks are a collection file in the hub's own folder that the portfolio does
    // not build from: its schema is made from its own `schema:` block as a data file's is, and
    // serves the editor, and its primary key, which every write to a bookmark addresses, is checked
    // as a data file's is.
    const marks = readText(join(hub, BOOKMARKS_FILE));
    const marked = marks === undefined ? undefined : ownBlock(marks);
    if (marks !== undefined && marked !== undefined) {
        const own = { kind: 'entries' as const, list: 'entries', written: [], own: true };
        add('bookmarks', fileSchema(marked, own, context('schema.')), { hub: [BOOKMARKS_FILE] });
        const block = dataOf(marks)?.schema as unknown[];
        const file = join(hub, BOOKMARKS_FILE);
        findings.push(...keyFindings(config.text, file, marks, block, undefined));
    }

    for (const one of projectFileSchemas(config, lists)) {
        texts[one.name] = schemaText(one.schema);
        rules.push({ name: one.name, ...one.rule });
    }

    for (const doc of docs) {
        const text = doc.text === '' ? readText(doc.file) : doc.text;
        if (text === undefined) continue;
        if (doc.name === 'manifest') read.manifests.push({ file: doc.file, text });
        findings.push(...checkDocument({ ...doc, text }, texts, checker, config.text));
    }
    findings.push(...duplicateKeys(raw, config.text, readText));
    checker.keepOnly(new Set(Object.values(texts)));
    return { set: { rules, texts }, findings, read };
}
