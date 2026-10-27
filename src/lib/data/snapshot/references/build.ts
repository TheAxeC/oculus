// Layer 1, data. The reference index of one snapshot build: every file that names a hub key or
// defines one, each scanned by the spec of its kind (specs.ts, scan.ts).
//
// The files are the ones the build reads. The hub's data files and the manifests come as the texts
// `runSchemas` read, so no file is read twice; the decks (the portfolio deck's `present.yml` and
// each project's `present/present.yml`) and oculus's own configuration files that carry a reference
// (`defaults/behavior.yml`, `defaults/sources.yml` and the other defaults files whose options name
// a hub list, and `catalogs/vocab.yml`) are read here. A file under the hub's `secrets` folder and
// the manifest of a workspace folder outside the hub are never read.
//
// The open workspace file is read too, for its `settings:`: each key there is an option of a
// defaults file, so its places are the options catalog's own, under `settings`. Its values name
// keys of the primary hub wherever the file lies, so its scan says so (`of`), and a rename of a key
// a setting names rewrites the setting. The unsaved workspace has no file, and nothing is read for
// it. The primary hub's own `.oculus/local.yml` is read for the options of local.yml that name a
// hub key, which are `self` alone, so a rename of the person `self` names rewrites that key and no
// other byte of the file; another hub's `local.yml` is never read.
//
// What a file defines: a file of entries of the hub's `collections:` its entries' primary keys, as
// keys of the registry the collection carries or, for one that carries none, of the collection's
// key; a manifest its `id:` line; vocab.yml the items of the lists some reference names; and a hub
// file the keys of the option rows of its own schema's fields.
//
// Files are named by the workspace folder they are served under: the hub's name for a hub's files,
// and for oculus's own configuration folder the name of the first workspace folder that holds it,
// with the path of the config folder in it. A workspace that lists no folder holding oculus's
// config has no openable file there, so the index holds none of its files and a reference into it
// finds no definition.

import { readFileSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
    primaryKeyOf,
    type PortfolioConfig,
    type RawDeck,
    type RawManifest,
    type RegistryName,
    type SchemaField
} from '../../model/index.ts';
import { REGISTRY_SHAPES, reservedTarget } from '../../helpers/hub-names.ts';
import { fieldsOf } from '../schema/field.ts';
import { manifestFields } from '../schema/manifest.ts';
import type { ReadTexts } from '../schema/run.ts';
import { REGISTRIES, targetName } from '../schema/lists.ts';
import type { FieldNode, FileId, FileScan, OptionFile, Reading, ReferenceIndex } from './model.ts';
import { scanText } from './scan.ts';
import {
    VOCAB_SOURCE,
    fileRecord,
    hasOptionRows,
    manifestRecord,
    optionSource,
    schemaRecord,
    sourcesOf,
    type TargetNames
} from './specs.ts';

/**
 * Oculus's own config folder as the index reads it: the folder on disk, the name of the workspace
 * folder that holds it, and its path inside that folder (empty when the folder is the config
 * folder).
 */
export type EngineConfigFolder = { dir: string; root: string; path: string };

/**
 * The open workspace file: where it is on disk, and its name in the index, the workspace folder
 * that holds it and its path inside that folder.
 */
export type SettingsFile = FileId & { file: string };

/** The file of oculus's own configuration that holds the vocabulary lists. */
const VOCAB_FILE = 'catalogs/vocab.yml';

/** What an index is made of. */
export type ReferenceSources = {
    hub: string;
    /** The name of the workspace folder the hub's files are named under. */
    root: string;
    config: PortfolioConfig;
    /** The engine's config folder and the workspace folder that holds it, or null for neither. */
    engine: EngineConfigFolder | null;
    /** The texts the schema run read. */
    read: ReadTexts;
    manifests: RawManifest[];
    /** The projects' own decks, which the build found. */
    decks: Record<string, RawDeck>;
    /** The files of oculus's own configuration that name a hub key, read from the catalog. */
    options: OptionFile[];
    /** The open workspace file, or null for the unsaved workspace and a build of another hub. */
    workspace?: SettingsFile | null;
    /** The node that reads the workspace file's `settings:`, read from the catalog. */
    settings?: FieldNode | null;
    /**
     * The primary hub's own `local.yml`, by its path in the hub, with the node that reads it; null
     * for a build of another hub and for a catalog whose local.yml options name no hub key.
     */
    local?: OptionFile | null;
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

/**
 * What the hub file at `path`, whose schema is `fields` as `keyedSchema` reads it, defines: the
 * primary key of each entry under its list, as a key of the registry the file is read as or, for a
 * file of a collection that carries no registry, of the collection's key. A file of no collection,
 * of a collection keyed by a reserved target, and a file with no primary key define nothing.
 */
function definesOf(
    config: PortfolioConfig,
    path: string,
    fields: SchemaField[] | null | undefined
): Reading['defines'] {
    const registry = REGISTRIES.find((one: RegistryName) => config.registries[one] === path);
    const entry =
        registry === undefined
            ? config.collections.find((one) => one.file === path && !reservedTarget(one.key))
            : config.collections.find((one) => one.registry === registry);
    if (registry === undefined && entry === undefined) return { kind: 'none' };
    const field = primaryKeyOf(fields, entry?.primary_key);
    if (field === null) return { kind: 'none' };
    if (registry !== undefined) {
        return { kind: 'registry', source: registry, list: REGISTRY_SHAPES[registry].list, field };
    }
    const source = entry === undefined ? undefined : targetName(entry.key, config.collections);
    if (source === undefined) return { kind: 'none' };
    return { kind: 'registry', source, list: 'entries', field };
}

/** The source the index names a `foreign_key:` target of the hub by (`targetName`). */
function namesOf(config: PortfolioConfig): TargetNames {
    return (target) => targetName(target, config.collections) ?? target;
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
        scans.push(scanText({ root: sources.root, path }, text, reading));
    };
    const names = namesOf(config);
    for (const file of sources.read.hub) {
        const spec =
            file.fields === undefined
                ? null
                : fileRecord(file.fields, file.kind, file.list, names, file.path);
        const options = (file.fields ?? []).filter(hasOptionRows).map((field) => ({
            field: field.field,
            source: optionSource(file.path, field.field)
        }));
        const defines = definesOf(config, file.path, file.keyed);
        add(file.path, file.text, { spec, defines, options });
    }
    const manifest = manifestRecord(manifestFields(config.schema), names);
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
    const named = (path: string): FileId => ({
        root: engine.root,
        path: engine.path === '' ? path : `${engine.path}/${path}`
    });
    for (const one of files) {
        const text = read(join(engine.dir, one.path));
        if (text !== undefined) {
            found.push({
                ...scanText(named(one.path), text, reads(one.spec)),
                engine: true
            });
        }
    }
    const vocab = read(join(engine.dir, VOCAB_FILE));
    if (vocab !== undefined) {
        const reading: Reading = { spec: null, defines: { kind: 'vocab', lists } };
        found.push({ ...scanText(named(VOCAB_FILE), vocab, reading), engine: true });
    }
    return found;
}

/** The scan of the open workspace file, none for the unsaved workspace or a file that is gone. */
function workspaceScans(
    sources: ReferenceSources,
    read: (file: string) => string | undefined
): FileScan[] {
    const held = sources.workspace ?? null;
    const spec = sources.settings ?? null;
    const text = held === null ? undefined : read(held.file);
    if (held === null || spec === null || text === undefined) return [];
    const scan = scanText({ root: held.root, path: held.path }, text, reads(spec));
    return [held.root === sources.root ? scan : { ...scan, of: sources.root }];
}

/** The scan of the primary hub's own `local.yml`, none for another hub or a file that is gone. */
function localScans(
    sources: ReferenceSources,
    read: (file: string) => string | undefined
): FileScan[] {
    const local = sources.local ?? null;
    const text = local === null ? undefined : read(join(sources.hub, local.path));
    if (local === null || text === undefined) return [];
    return [scanText({ root: sources.root, path: local.path }, text, reads(local.spec))];
}

/** The reference index of one build. */
export function buildReferences(sources: ReferenceSources): ReferenceIndex {
    const read = sources.readFile ?? readDisk;
    const scans = hubScans(sources, read);
    return {
        files: [
            ...scans,
            ...localScans(sources, read),
            ...workspaceScans(sources, read),
            ...engineScans(sources, scans, read)
        ]
    };
}
