// Layer 1, data. One build of the schemas and the checks over them: the hub's files are read, each
// schema is generated from the files' own `schema:` blocks and the oculus schema files, every
// document the hub's findings cover is checked against its schema, and the set of schemas with the
// rules that match them to files is handed back for the editor.
//
// The findings are the schema's side of the integrity gate: a key no schema declares, a value
// outside its options, a reference to a key that is not on disk, a field outside its `when`, a
// required field that is missing, a key that stands twice in a referenced file, and a `schema:`
// block that does not read. The documents checked are the project manifests and the hub's data
// files. The other schemas serve the editor alone: the readers of their files report their own
// findings. The texts of the manifests and hub data files the run read come back with it, so the
// reference index (snapshot/references/) scans them without reading a file again.
//
// Server side only: it reads the files it checks.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { findingText } from '../../helpers/finding-text.ts';
import { VOCAB_FILE_KEYS } from '../../shapes/catalog-files.ts';
import type {
    Finding,
    PortfolioConfig,
    RawPortfolio,
    ScanRule,
    SchemaField
} from '../../model/index.ts';
import { isSideTier, MANIFEST } from '../../helpers/hub-names.ts';
import { checkDocument, isWords, type Checker, type SchemaDoc } from './check.ts';
import { fileSchema, writtenFields, type FileKind } from './hub.ts';
import { schemaText, type JsonSchema } from './json.ts';
import { duplicateKeys, hubLists, listsOf, vocabLists } from './lists.ts';
import { manifestSchema } from './manifest.ts';
import { fieldsOf } from './field.ts';
import { problemText, type Context, type SchemaProblem } from './record.ts';
import type { SchemaRule, SchemaSet } from './set.ts';
import { projectFileSchemas } from './static.ts';

/** A hub data file the build read: its text and the fields of its `schema:` block, if it reads. */
type HubFileRead = {
    /** The path from the hub. */
    path: string;
    text: string;
    fields: SchemaField[] | undefined;
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

/** A hub data file the gate checks, by its hub-relative path. */
type HubFile = { path: string; kind: FileKind; list: string; collection: boolean };

/** The hub's data files: the registries, the collections, the feeds and the career file. */
function hubFiles(config: PortfolioConfig): HubFile[] {
    const files = new Map<string, HubFile>();
    const add = (path: string, kind: FileKind, list: string, collection: boolean): void => {
        const held = files.get(path);
        files.set(path, {
            path,
            kind,
            list,
            collection: collection || (held?.collection ?? false)
        });
    };
    for (const path of Object.values(config.registries)) {
        add(path, 'entries', path === config.registries.datasets ? 'datasets' : 'entries', false);
    }
    for (const one of config.collections) {
        add(
            one.file,
            'entries',
            one.file === config.registries.datasets ? 'datasets' : 'entries',
            true
        );
    }
    add(config.feeds.leads, 'entries', 'entries', false);
    add(config.feeds.radar, 'entries', 'entries', false);
    add(config.career, 'sections', 'entries', false);
    return [...files.values()];
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

/**
 * Generate the schemas of one build and check the hub against them. `checker` holds the validators
 * compiled so far, so a build whose schemas did not change compiles nothing. `unread` names the
 * sources whose file did not read, whose keys are not known.
 */
export function runSchemas(
    hub: string,
    config: PortfolioConfig,
    raw: RawPortfolio,
    checker: Checker,
    unread: ReadonlySet<string>
): SchemaRun {
    const texts: Record<string, string> = {};
    const rules: SchemaRule[] = [];
    const findings: Finding[] = [];
    const docs: SchemaDoc[] = [];
    const read: ReadTexts = { hub: [], manifests: [] };
    const lists = listsOf(hubLists(raw), vocabLists(config.merged, VOCAB_FILE_KEYS), unread);
    const context = (at: string): Context => ({ lists, problems: [], at });
    const add = (name: string, schema: JsonSchema, rule: Omit<SchemaRule, 'name'>): void => {
        texts[name] = schemaText(schema);
        rules.push({ name, ...rule });
    };

    const scans = config.scan.filter((rule) => !isSideTier(rule)).map(dirOf);
    const manifest = context('');
    if (config.schema !== undefined) {
        add('manifest', manifestSchema(config.schema, manifest), {
            hub: scans.map((dir) => `${dir}/**/${MANIFEST}`)
        });
        for (const one of raw.manifests) docs.push({ name: 'manifest', file: one.file, text: '' });
    }

    for (const file of hubFiles(config)) {
        const path = join(hub, file.path);
        const text = readText(path);
        if (text === undefined) continue;
        const own = { path: file.path, text, kind: file.kind, list: file.list };
        let parsed: unknown;
        try {
            parsed = parse(text);
        } catch {
            read.hub.push({ ...own, fields: undefined });
            continue;
        }
        const held =
            typeof parsed === 'object' && parsed !== null
                ? (parsed as Record<string, unknown>)
                : {};
        const fields = held.schema === undefined ? undefined : fieldsOf(held.schema);
        read.hub.push({ ...own, fields });
        if (held.schema === undefined) continue;
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
        docs.push({ name, file: path, text });
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
