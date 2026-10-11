// Layer 1, data. The reference index of one snapshot build: every file that names a hub key or
// defines one, each scanned by the spec of its kind (specs.ts, scan.ts).
//
// The files are the ones the build reads. The hub's data files and the manifests come as the texts
// `runSchemas` read, so no file is read twice; the decks (the portfolio deck's `present.yml` and
// each project's `present/present.yml`) and oculus's own configuration files that carry a
// reference (`behavior.yml`, `sources.yml` and the others the options catalog describes, and
// `catalogs/vocab.yml`) are read here. A file under the hub's
// `secrets` folder, `config/local.yml` and a repository's `.oculus/project.yml` outside the hub
// are never read.
//
// What a file defines: a registry file its entries' identity scalars (`REGISTRY_SHAPES`), a
// manifest its `id:` line, and vocab.yml the items of the lists some reference names.
//
// Files are named by the root they are served under: `hub` for the first hub's files, the key of
// the root for the files of another hub, and `engine` for oculus's own configuration folder, the
// root the Settings view opens it under.

import { readFileSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type {
    PortfolioConfig,
    RawDeck,
    RawManifest,
    RegistryName,
    SchemaField
} from '../../model/index.ts';
import { ENGINE_ROOT, HUB_ROOT, REGISTRY_SHAPES } from '../../helpers/hub-names.ts';
import { fieldsOf } from '../schema/field.ts';
import { manifestFields } from '../schema/manifest.ts';
import type { ReadTexts } from '../schema/run.ts';
import { REGISTRIES } from '../schema/lists.ts';
import type { FieldNode, FileScan, OptionFile, Reading, ReferenceIndex } from './model.ts';
import { scanText } from './scan.ts';
import {
    VOCAB_SOURCE,
    fileRecord,
    manifestRecord,
    schemaRecord,
    sourcesOf,
    vocabRecord
} from './specs.ts';

/** The file of oculus's own configuration that holds the vocabulary lists. */
const VOCAB_FILE = 'catalogs/vocab.yml';

/** What an index is made of. */
export type ReferenceSources = {
    hub: string;
    /** The root key the hub's files are named under; `hub` for the first hub. */
    root?: string;
    config: PortfolioConfig;
    /** The engine's config folder, or null when there is none to read. */
    engine: string | null;
    /** The texts the schema run read. */
    read: ReadTexts;
    manifests: RawManifest[];
    /** The projects' own decks, which the build found. */
    decks: Record<string, RawDeck>;
    /** The files of oculus's own configuration that name a hub key, read from the catalog. */
    options: OptionFile[];
    /** The file name of a deck. */
    deckFile: string;
    /** The text of a file, or undefined when it cannot be read; the disk by default. */
    readFile?: (file: string) => string | undefined;
};

/** The text of a file on disk, or undefined when it cannot be read. */
function readDisk(file: string): string | undefined {
    try {
        return readFileSync(file, 'utf8');
    } catch {
        return undefined;
    }
}

/** A path with forward slashes, the way a served root names a file. */
function posix(path: string): string {
    return path.split(sep).join('/');
}

/** The registry a hub path is the file of, with the way the file lists its entries. */
function registryOf(config: PortfolioConfig, path: string): Reading['defines'] {
    const name = REGISTRIES.find((one: RegistryName) => config.registries[one] === path);
    if (name === undefined) return { kind: 'none' };
    const shape = REGISTRY_SHAPES[name];
    return { kind: 'registry', source: name, list: shape.list, field: shape.idField };
}

/** A path with its symbolic links followed, or the path itself when it cannot be resolved. */
function resolved(path: string): string {
    try {
        return realpathSync(path);
    } catch {
        return path;
    }
}

/**
 * A file's path relative to the hub, whichever way the hub's folder is spelled: the deck reader
 * names a deck's folder from the real folder of the hub, which differs from a hub reached through
 * a symbolic link, and the index names every file by a path inside the hub.
 */
function hubRelative(hub: string, file: string): string {
    return relative(resolved(hub), resolved(file));
}

/** Whether a file lies inside a folder. */
function inside(file: string, folder: string): boolean {
    return file.startsWith(folder.endsWith(sep) ? folder : `${folder}${sep}`);
}

/** A reading of a spec that defines nothing. */
function reads(spec: FieldNode | null): Reading {
    return { spec, defines: { kind: 'none' } };
}

/** The schema fields of a schema file of the merged config, or none when it does not read. */
function schemaFile(merged: Record<string, unknown>, key: string): SchemaField[] {
    return fieldsOf(merged[key]) ?? [];
}

/** The scans of the hub's own files. */
function hubScans(
    sources: ReferenceSources,
    read: (file: string) => string | undefined
): FileScan[] {
    const { hub, config } = sources;
    const scans: FileScan[] = [];
    const add = (path: string, text: string, reading: Reading): void => {
        scans.push(scanText({ root: sources.root ?? HUB_ROOT, path }, text, reading));
    };
    for (const file of sources.read.hub) {
        const spec =
            file.fields === undefined ? null : fileRecord(file.fields, file.kind, file.list);
        add(file.path, file.text, { spec, defines: registryOf(config, file.path) });
    }
    const manifest = manifestRecord(manifestFields(config.schema));
    const ids = new Map(sources.manifests.map((one) => [one.file, one.id]));
    for (const file of sources.read.manifests) {
        if (!inside(file.file, hub)) continue;
        const id = ids.get(file.file);
        const defines =
            id === undefined ? { kind: 'none' as const } : { kind: 'manifest' as const, id };
        add(posix(relative(hub, file.file)), file.text, { spec: manifest, defines });
    }
    const deck = schemaRecord(schemaFile(config.merged, 'deck_schema'));
    const decks = Object.values(sources.decks).map((one) => join(one.path, sources.deckFile));
    if (config.portfolioDeck !== null) decks.push(join(config.portfolioDeck, sources.deckFile));
    for (const path of decks) {
        const text = read(join(hub, path));
        if (text !== undefined) add(posix(hubRelative(hub, join(hub, path))), text, reads(deck));
    }
    return scans;
}

/** The vocabulary lists some reference names, as the keys of vocab.yml. */
function vocabListsNamed(scans: FileScan[], engineNodes: FieldNode[]): string[] {
    const named = new Set<string>();
    const note = (node: FieldNode | null): void => {
        for (const source of sourcesOf(node)) {
            if (source.startsWith(VOCAB_SOURCE)) named.add(source.slice(VOCAB_SOURCE.length));
        }
    };
    for (const scan of scans) note(scan.reading.spec);
    for (const node of engineNodes) note(node);
    return [...named].sort();
}

/** The scans of oculus's own configuration: the files the options catalog follows and vocab.yml. */
function engineScans(
    sources: ReferenceSources,
    scans: FileScan[],
    read: (file: string) => string | undefined
): FileScan[] {
    const { engine, options: files } = sources;
    if (engine === null) return [];
    const lists = vocabListsNamed(
        scans,
        files.map((one) => one.spec)
    );
    const found: FileScan[] = [];
    for (const one of files) {
        const text = read(join(engine, one.path));
        if (text !== undefined)
            found.push(scanText({ root: ENGINE_ROOT, path: one.path }, text, reads(one.spec)));
    }
    const vocab = read(join(engine, VOCAB_FILE));
    if (vocab !== undefined) {
        const reading: Reading = { spec: vocabRecord(), defines: { kind: 'vocab', lists } };
        found.push(scanText({ root: ENGINE_ROOT, path: VOCAB_FILE }, vocab, reading));
    }
    return found;
}

/** The reference index of one build. */
export function buildReferences(sources: ReferenceSources): ReferenceIndex {
    const read = sources.readFile ?? readDisk;
    const scans = hubScans(sources, read);
    return { files: [...scans, ...engineScans(sources, scans, read)] };
}
