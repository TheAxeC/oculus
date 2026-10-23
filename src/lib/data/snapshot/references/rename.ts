// Layer 1, data. The rename of a hub key: the edit that changes the key's own definition and every
// place, in any hub of the workspace, whose reference resolves to it (lookup.ts), and no place that
// resolves to another hub's record of the same key, or the reason it cannot be made.
//
// The edit is a text edit for each scalar and no other byte: the new key is written by
// `renderScalar` in the quoting the scalar already had, so a quoted scalar keeps its quotes, a
// plain one stays plain where the new key reads back plain, and a trailing comment or the rest of
// a flow list is not touched. Every file's edited text is read again, and the rename is refused
// unless each edited place reads back as the new key and nothing else in the file moved.
//
// A rename is refused, with nothing edited, when it could break what the key means: a project id is
// its folder's name, a vocabulary word is read by oculus's own code, a key defined twice or in two
// sources cannot be told apart from its twin, a new key that already exists in the renamed key's
// hub, or in any hub when a renamed reference stands in another hub, would merge two entries or
// change what that reference resolves to, a file that does not parse, cannot be read or is too
// large to write cannot be edited safely. `refuseRename` decides what depends on the key and the
// files alone, before a new key is asked for; `planRename` makes those checks again, since a file
// can change between the two requests, and decides the rest, which depends on the new key.

import { renderScalar } from '../../helpers/files/yaml/collection-text.ts';
import { applyTextEdits, withoutMark, type TextEdit } from '../../prose/text-edits.ts';
import {
    definitionsOf,
    keysRootOf,
    referencesTo,
    resolvedTargets,
    type Graph,
    type Hit
} from './lookup.ts';
import type { FileScan, Mention } from './model.ts';
import { scanText } from './scan.ts';
import { VOCAB_SOURCE } from './specs.ts';

/** Why a rename was not made. The sentence for each is a catalog line of the page's words. */
export type RenameRefusal =
    | { code: 'unparsed'; file: string }
    | { code: 'empty' }
    | { code: 'project'; key: string }
    | { code: 'vocab'; key: string }
    | { code: 'twice'; key: string; source: string }
    | { code: 'sources'; key: string; sources: string[] }
    | { code: 'exists'; key: string; source: string }
    | { code: 'unread'; file: string }
    | { code: 'large'; file: string }
    | { code: 'readback'; key: string; file: string };

/** The edits of one file of the rename, in the order of the file. */
type FileEdit = { scan: FileScan; edits: TextEdit[] };

/** The edits of a rename, or its refusal. */
export type RenamePlan = { ok: true; files: FileEdit[] } | { ok: false; refusal: RenameRefusal };

/** A file's text for the rename: the text, that it is over the write limit, or null if unread. */
export type FileText = { text: string } | { large: true } | null;

/**
 * The other sources a reference to a hit's targets also names the key in: each source of the
 * reference's field besides the targets' whose key the reference would resolve to from its hub.
 */
function sharedSources(graph: Graph, hit: Hit): string[] {
    const own = new Set(hit.targets.flatMap((one) => one.definition.sources));
    const found: string[] = [];
    for (const reference of referencesTo(graph, hit)) {
        const root = keysRootOf(reference.scan);
        for (const source of reference.reference.sources) {
            if (own.has(source)) continue;
            if (resolvedTargets(graph, root, hit.key, [source]).length > 0) found.push(source);
        }
    }
    return found;
}

/** The files a rename edits: those with a definition of the key and those that name it. */
export function namedScans(graph: Graph, hit: Hit): FileScan[] {
    const named = new Set([
        ...hit.targets.map((one) => one.scan),
        ...referencesTo(graph, hit).map((one) => one.scan)
    ]);
    return graph.index.files.filter((scan) => named.has(scan));
}

/**
 * The refusal that depends on the key and the files alone, or null when a new key may be asked
 * for: the key and its sources, a tab whose text does not parse, a file that is unread or too
 * large. A key that a reference to it also names in another source is refused from its definition
 * as from the reference.
 */
export function refuseRename(
    graph: Graph,
    hit: Hit,
    textOf: (scan: FileScan) => FileText
): RenameRefusal | null {
    const { key, targets } = hit;
    if (targets.length > 1) {
        const first = targets[0].definition.sources;
        const same = targets.every((one) => one.definition.sources.join(' ') === first.join(' '));
        return same
            ? { code: 'twice', key, source: first[0] }
            : { code: 'sources', key, sources: targets.map((one) => one.definition.sources[0]) };
    }
    const sources = targets[0].definition.sources;
    if (sources.includes('projects')) return { code: 'project', key };
    if (sources.some((source) => source.startsWith(VOCAB_SOURCE))) return { code: 'vocab', key };
    const shared = sharedSources(graph, hit);
    if (shared.length > 0) {
        return { code: 'sources', key, sources: [...new Set([sources[0], ...shared])] };
    }
    const unparsed = graph.index.files.find((scan) => scan.open === true && scan.unparsed);
    if (unparsed !== undefined) return { code: 'unparsed', file: unparsed.file.path };
    for (const scan of namedScans(graph, hit)) {
        const held = textOf(scan);
        const file = scan.file.path;
        if (held === null) return { code: 'unread', file };
        if ('large' in held) return { code: 'large', file };
    }
    return null;
}

/**
 * The source of an existing definition of the new key that the rename would collide with: one in
 * the hub of the renamed definition, and, when a renamed reference stands in another hub, one in
 * any hub, since that reference could then resolve to it.
 */
function collision(graph: Graph, hit: Hit, key: string): string | null {
    const own = new Set(hit.targets.flatMap((one) => one.definition.sources));
    const home = new Set(hit.targets.map((one) => keysRootOf(one.scan)));
    let across = false;
    for (const reference of referencesTo(graph, hit)) {
        for (const source of reference.reference.sources) own.add(source);
        if (!home.has(keysRootOf(reference.scan))) across = true;
    }
    const found = definitionsOf(graph, key, [...own]).filter(
        (one) => across || one.scan.engine === true || home.has(keysRootOf(one.scan))
    );
    if (found.length === 0) return null;
    return found[0].definition.sources.find((source) => own.has(source)) ?? null;
}

/** The scalar's whole text range, with its quotes, which a new key is written over. */
function outer(mention: Mention): TextEdit['range'] {
    const quote = mention.style === 'plain' ? 0 : 1;
    const { start, end } = mention.span;
    return {
        start: { line: start.line, character: start.character - quote },
        end: { line: end.line, character: end.character + quote }
    };
}

/** The new key written in the quoting a scalar has. */
function written(key: string, mention: Mention): string {
    if (mention.style === 'double') return renderScalar(key, 'QUOTE_DOUBLE');
    if (mention.style === 'single') return renderScalar(key, 'QUOTE_SINGLE');
    return renderScalar(key);
}

/** The values of a list of mentions, the edited ones replaced by the new key. */
function valuesWith(list: readonly Mention[], edited: ReadonlySet<Mention>, key: string): string[] {
    return list.map((one) => (edited.has(one) ? key : one.value));
}

/** Whether the text with the edits applied reads back as the file with the new key in place. */
function readsBack(
    scan: FileScan,
    text: string,
    edited: ReadonlySet<Mention>,
    key: string
): boolean {
    const again = scanText(scan.file, text, scan.reading);
    if (again.unparsed) return false;
    const same = (left: string[], right: readonly Mention[]): boolean =>
        left.length === right.length && left.every((value, at) => value === right[at].value);
    return (
        same(valuesWith(scan.references, edited, key), again.references) &&
        same(valuesWith(scan.definitions, edited, key), again.definitions)
    );
}

/** The mentions of a scan the rename edits: its definitions and references to the targets. */
function editedIn(scan: FileScan, graph: Graph, hit: Hit): Mention[] {
    const wanted = new Set(hit.targets.map((one) => one.definition));
    const references = referencesTo(graph, hit).flatMap((one) =>
        one.scan === scan ? [one.reference] : []
    );
    const definitions = scan.definitions.filter((one) => wanted.has(one));
    return [...definitions, ...references];
}

/** The edits that rename the key a hit names, or why they cannot be made. */
export function planRename(
    graph: Graph,
    hit: Hit,
    newKey: string,
    textOf: (scan: FileScan) => FileText
): RenamePlan {
    const refused = refuseRename(graph, hit, textOf);
    if (refused !== null) return { ok: false, refusal: refused };
    if (newKey.trim() === '') return { ok: false, refusal: { code: 'empty' } };
    if (newKey === hit.key) return { ok: true, files: [] };
    const taken = collision(graph, hit, newKey);
    if (taken !== null)
        return { ok: false, refusal: { code: 'exists', key: newKey, source: taken } };
    const files: FileEdit[] = [];
    for (const scan of namedScans(graph, hit)) {
        const held = textOf(scan);
        const file = scan.file.path;
        if (held === null) return { ok: false, refusal: { code: 'unread', file } };
        if ('large' in held) return { ok: false, refusal: { code: 'large', file } };
        const mentions = editedIn(scan, graph, hit);
        const edits = mentions.map((one) => ({ range: outer(one), newText: written(newKey, one) }));
        const applied = applyTextEdits(withoutMark(held.text), edits);
        if (!applied.ok || !readsBack(scan, applied.text, new Set(mentions), newKey)) {
            return { ok: false, refusal: { code: 'readback', key: newKey, file } };
        }
        files.push({ scan, edits: sorted(edits) });
    }
    return { ok: true, files };
}

/** The edits in the order of the file. */
function sorted(edits: TextEdit[]): TextEdit[] {
    return [...edits].sort(
        (a, b) =>
            a.range.start.line - b.range.start.line ||
            a.range.start.character - b.range.start.character
    );
}
