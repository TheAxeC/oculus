// Layer 1, data. Questions asked of the reference index: what the scalar at a position is, which
// definitions it names, and which places name the same key.
//
// A candidate is a reference only when a definition of the same key stands in one of the sources
// its field takes keys from; a value that names no key (a draft word, an id nobody defined) is not
// one and answers nothing. A reference resolves as the portfolio resolves it
// (data/snapshot/hubs/merge.ts): source by source, in its own hub first (the hub whose keys its
// file names, oculus's own configuration counting as every hub's), then in the one other hub that
// defines the key, and a key two other hubs define names neither. The match is made when a
// question is asked, over the files as they are then, so the text of an open tab replaces the text
// the build read (`overlay`) without the build being redone.
//
// Two names of one disk file are told apart by the folders of the served roots (hub-names.ts), so
// a tab that holds a file under another root, or under another checkout's engine root, replaces
// the right file of the index and no other.

import { diskPath, type RootFolder } from '../../helpers/hub-names.ts';
import type { Candidate, Definition, FileScan, Mention, Place, ReferenceIndex } from './model.ts';
import { scanText } from './scan.ts';

/** The text of an open tab by the real path of its file. */
export type OpenText = { real: string; text: string };

/** A definition with the file it stands in. */
export type DefinitionAt = { scan: FileScan; definition: Definition };

/** A reference with the file it stands in. */
export type ReferenceAt = { scan: FileScan; reference: Candidate };

/** The index with its references matched to its definitions. */
export type Graph = {
    index: ReferenceIndex;
    /** Every definition, by key. */
    definitions: ReadonlyMap<string, readonly DefinitionAt[]>;
    /** Every place that names a key, by key, whether or not a definition answers it. */
    references: ReadonlyMap<string, readonly ReferenceAt[]>;
};

/** What a position names: a scalar that is a reference or a definition, and the definitions. */
export type Hit = {
    scan: FileScan;
    kind: 'reference' | 'definition';
    /** The scalar at the position. */
    at: Mention;
    key: string;
    /** The sources of the field or of the definition at the position. */
    sources: string[];
    /** The definitions of the same key and sources; for a definition, the one at the position. */
    targets: DefinitionAt[];
};

/** A real path spelled the way two spellings of one file compare equal. */
function same(path: string): string {
    return path.normalize('NFC');
}

/** The index with the open texts in place of the texts of the files they are the tabs of. */
export function overlay(
    index: ReferenceIndex,
    roots: readonly RootFolder[],
    texts: readonly OpenText[]
): ReferenceIndex {
    if (texts.length === 0) return index;
    const open = new Map(texts.map((one) => [same(one.real), one.text]));
    const files = index.files.map((scan) => {
        const real = diskPath(scan.file, roots);
        const text = real === null ? undefined : open.get(same(real));
        return text === undefined
            ? scan
            : { ...scan, ...scanText(scan.file, text, scan.reading), open: true as const };
    });
    return { files };
}

/** The file of the index a real path is, or undefined. */
export function scanOf(
    index: ReferenceIndex,
    roots: readonly RootFolder[],
    real: string
): FileScan | undefined {
    const wanted = same(real);
    return index.files.find((scan) => {
        const path = diskPath(scan.file, roots);
        return path !== null && same(path) === wanted;
    });
}

/**
 * The root whose keys a file names: the one it says (`of`, the open workspace file's primary hub),
 * else its own. A request on a file is answered over the graph of this root.
 */
export function keysRootOf(scan: FileScan): string {
    return scan.of ?? scan.file.root;
}

/**
 * The index with every reference and definition held by key, over the files of every hub of the
 * workspace and oculus's own configuration; which definitions a reference names is decided by
 * `resolvedTargets`.
 */
export function graphOf(index: ReferenceIndex): Graph {
    const definitions = new Map<string, DefinitionAt[]>();
    const references = new Map<string, ReferenceAt[]>();
    for (const scan of index.files) {
        for (const definition of scan.definitions) {
            const held = definitions.get(definition.value) ?? [];
            held.push({ scan, definition });
            definitions.set(definition.value, held);
        }
        for (const reference of scan.references) {
            const held = references.get(reference.value) ?? [];
            held.push({ scan, reference });
            references.set(reference.value, held);
        }
    }
    return { index, definitions, references };
}

/** The definitions of a key that stand in one of these sources. */
export function definitionsOf(
    graph: Graph,
    key: string,
    sources: readonly string[]
): DefinitionAt[] {
    return (graph.definitions.get(key) ?? []).filter((one) =>
        one.definition.sources.some((source) => sources.includes(source))
    );
}

/** Whether a definition is of the hub `own`: it stands in that hub's files or in oculus's own. */
function ofHub(one: DefinitionAt, own: string): boolean {
    return one.scan.engine === true || keysRootOf(one.scan) === own;
}

/**
 * The definitions a reference to `key` in a file naming the keys of the hub `own` resolves to:
 * source by source in the field's order, the definitions of its own hub, else those of the one
 * other hub that defines the key; a source two other hubs define the key in names none, and the
 * next source is asked.
 */
export function resolvedTargets(
    graph: Graph,
    own: string,
    key: string,
    sources: readonly string[]
): DefinitionAt[] {
    for (const source of sources) {
        const all = definitionsOf(graph, key, [source]);
        const mine = all.filter((one) => ofHub(one, own));
        if (mine.length > 0) return mine;
        if (new Set(all.map((one) => keysRootOf(one.scan))).size === 1) return all;
    }
    return [];
}

/** Whether a position is on a scalar: its text or one of its quotes. */
function onScalar(at: Mention, place: Place): boolean {
    const quote = at.style === 'plain' ? 0 : 1;
    const { start, end } = at.span;
    if (place.line < start.line || place.line > end.line) return false;
    if (place.line === start.line && place.character < start.character - quote) return false;
    return !(place.line === end.line && place.character > end.character + quote);
}

/** What stands at a position of a file of the index: a definition, or a reference that resolves. */
export function hitAt(graph: Graph, scan: FileScan, place: Place): Hit | null {
    const definition = scan.definitions.find((one) => onScalar(one, place));
    if (definition !== undefined) {
        const targets = definitionsOf(graph, definition.value, definition.sources).filter((one) =>
            ofHub(one, keysRootOf(scan))
        );
        return {
            scan,
            kind: 'definition',
            at: definition,
            key: definition.value,
            sources: definition.sources,
            targets
        };
    }
    const reference = scan.references.find((one) => onScalar(one, place));
    if (reference === undefined) return null;
    const targets = resolvedTargets(graph, keysRootOf(scan), reference.value, reference.sources);
    if (targets.length === 0) return null;
    return {
        scan,
        kind: 'reference',
        at: reference,
        key: reference.value,
        sources: reference.sources,
        targets
    };
}

/**
 * Every place that resolves to the same definitions as a hit, in any hub, the hit's own place
 * among them.
 */
export function referencesTo(graph: Graph, hit: Hit): ReferenceAt[] {
    const wanted = new Set(hit.targets.map((one) => one.definition));
    return (graph.references.get(hit.key) ?? []).filter((one) =>
        resolvedTargets(graph, keysRootOf(one.scan), hit.key, one.reference.sources).some(
            (target) => wanted.has(target.definition)
        )
    );
}
