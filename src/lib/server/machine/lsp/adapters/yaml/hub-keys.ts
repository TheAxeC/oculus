// Layer 2, server. What the YAML entry answers itself, before a request reaches the YAML server: a
// hub key in a hub file is a link. A value that names a key of the hub (a venue id, a person, a
// project id, a vocabulary word) goes to the key's definition, lists every place that names it,
// and is renamed everywhere it is named. yaml-language-server has no notion of any of it: it
// follows an anchor to its alias inside one document and nothing between files.
//
// The answers come from the reference index of the latest snapshot build, laid over with the text
// of every document the page has open, matched to the index's files by real path, so a key typed
// into a tab is a link before it is saved and a file open under two root keys is one file. A key
// resolves as the portfolio resolves it: in the hub the file names keys of (its own hub, and for
// the open workspace file the primary hub, wherever the file lies) first, then in the one other hub
// that holds it, so a key of another hub is a link to that hub's definition and a rename reaches
// every hub's places that resolve to the renamed definition. A request at a position that is no hub
// key, or in a file the index does not hold, is not answered here and goes on to the server. The
// one exception is the references of a file the index does not hold, which are none: the server has
// no references to give, and the page asks for them in every YAML file.
//
// Every location is named by the address the page holds the file open under, else by the root key
// and path the index knows it by, so no path of the machine reaches the page. A rename is a
// `documentChanges` edit with one entry per file, each carrying the page's version of the file when
// it is open and null when it is not. Its edits carry one change annotation that asks to be
// confirmed, so the page shows the edit as a Refactor Preview before it writes anything; the
// annotation's label is the old key and its description the new one.
//
// A rename that must not be made is an error whose message is the reason in words. A refusal that
// does not depend on the new key (a project id or a vocabulary word, a key of two sources, a tab
// whose text does not parse, a file that is too large, unreadable or open in a tab of another
// window) is the answer to `prepareRename`, which the page shows where the caret
// is. A refusal that depends on the new key (an empty key, a key that exists, a key that would not
// read back) is the answer to `rename`, which the page shows as a notice, as the editor shows a
// reason a rename gives after its box is closed. The answer to `rename` makes every check again,
// since a file can change between the two requests.

import { WRITE_MAX_MEGABYTES } from '../../../../../data/file-ops.ts';
import { diskPath } from '../../../../../data/helpers/files/paths.ts';
import {
    graphOf,
    hitAt,
    overlay,
    referencesTo,
    scanOf,
    type Graph,
    type Hit
} from '../../../../../data/snapshot/references/lookup.ts';
import type { FileScan, Span } from '../../../../../data/snapshot/references/model.ts';
import {
    namedScans,
    planRename,
    refuseRename,
    type FileText,
    type RenameRefusal
} from '../../../../../data/snapshot/references/rename.ts';
import { RENAME_ANNOTATION } from '../../../../../data/prose/text-edits.ts';
import { words } from '../../../../core/words.ts';
import type { OpenDocument, PageAnswer, PageRequest, PageView } from '../../servers.ts';
import { normal, pageUri } from '../../uris.ts';

/** The error code of a request that is refused for a reason of its own, `RequestFailed`. */
const REQUEST_FAILED = -32803;

/** Where a request points: the index laid over the open texts, the file and what stands there. */
type Asked = { graph: Graph; scan: FileScan; hit: Hit | null; params: Record<string, unknown> };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A non-negative whole number of a request, or null. */
function count(value: unknown): number | null {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

/** The document a request names and the request's params, or undefined for a request of none. */
function documentOf(
    request: PageRequest,
    view: PageView
): { document: OpenDocument; params: Record<string, unknown> } | undefined {
    const params = request.params;
    if (!isRecord(params) || !isRecord(params.textDocument)) return undefined;
    const document = view.document(params.textDocument.uri);
    return document === undefined ? undefined : { document, params };
}

/** What a request at a position of a hub file finds, or undefined for any other file. */
function locate(
    named: { document: OpenDocument; params: Record<string, unknown> },
    view: PageView
): Asked | undefined {
    const { document, params } = named;
    const texts = view.documents.map((one) => ({ real: one.real, text: one.text }));
    const index = overlay(view.references, view.roots, texts);
    const scan = scanOf(index, view.roots, document.real);
    if (scan === undefined) return undefined;
    const graph = graphOf(index);
    const at = isRecord(params.position) ? params.position : {};
    const line = count(at.line);
    const character = count(at.character);
    const hit =
        line === null || character === null ? null : hitAt(graph, scan, { line, character });
    return { graph, scan, hit, params };
}

/** The address of an indexed file and the version the page holds it at, null when it is closed. */
function whereIs(view: PageView, scan: FileScan): { uri: string; version: number | null } {
    const real = diskPath(scan.file, view.roots);
    const open: OpenDocument | undefined =
        real === null ? undefined : view.documents.find((one) => normal(one.real) === normal(real));
    if (open !== undefined) return { uri: open.pageUri, version: open.version };
    return { uri: pageUri(scan.file.root, scan.file.path), version: null };
}

/** A refusal of the data layer, or one only the relay can see: a file another window holds. */
type Refusal = RenameRefusal | { code: 'elsewhere'; file: string };

/** The sentence of a refusal. */
function refusalText(refusal: Refusal, catalog: Record<string, string>): string {
    switch (refusal.code) {
        case 'elsewhere':
            return words(catalog, 'source.lsp_edit_elsewhere', refusal.file);
        case 'unparsed':
            return words(catalog, 'source.rename_unparsed', refusal.file);
        case 'empty':
            return words(catalog, 'source.rename_empty');
        case 'project':
            return words(catalog, 'source.rename_project', refusal.key);
        case 'vocab':
            return words(catalog, 'source.rename_vocab', refusal.key);
        case 'twice':
            return words(catalog, 'source.rename_twice', refusal.key, refusal.source);
        case 'sources':
            return words(catalog, 'source.rename_sources', refusal.key, refusal.sources.join(', '));
        case 'exists':
            return words(catalog, 'source.rename_exists', refusal.key, refusal.source);
        case 'unread':
            return words(catalog, 'source.rename_unread', refusal.file);
        case 'large':
            return words(catalog, 'source.rename_large', refusal.file, WRITE_MAX_MEGABYTES);
        case 'readback':
            return words(catalog, 'source.rename_readback', refusal.key, refusal.file);
    }
}

/** The error answer of a refusal. */
function refused(refusal: Refusal, view: PageView): PageAnswer {
    return { error: { code: REQUEST_FAILED, message: refusalText(refusal, view.catalog) } };
}

/** A place of the protocol: an address and a range. */
type Place = { uri: string; range: Span };

/** The same place once, in the order the places came. */
function distinct(places: Place[]): Place[] {
    const seen = new Set<string>();
    return places.filter((one) => {
        const key = JSON.stringify(one);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** Go to Definition: a link to each definition of the key, the whole key underlined. */
function definition(asked: Asked, view: PageView): PageAnswer | undefined {
    const { hit } = asked;
    if (hit === null) return undefined;
    const links = hit.targets.map((target) => ({
        originSelectionRange: hit.at.span,
        targetUri: whereIs(view, target.scan).uri,
        targetRange: target.definition.span,
        targetSelectionRange: target.definition.span
    }));
    return { result: links };
}

/** Find All References: every place the key is named, and its definition when it is asked for. */
function references(asked: Asked, view: PageView): PageAnswer | undefined {
    const { hit, graph, params } = asked;
    if (hit === null) return { result: [] };
    const named: Place[] = referencesTo(graph, hit).map((one) => ({
        uri: whereIs(view, one.scan).uri,
        range: one.reference.span
    }));
    const context = isRecord(params.context) ? params.context : {};
    if (context.includeDeclaration === true) {
        for (const target of hit.targets) {
            named.push({ uri: whereIs(view, target.scan).uri, range: target.definition.span });
        }
    }
    return { result: distinct(named) };
}

/** The text of a file the rename names: the open text of its tab, else the disk. */
function textOf(scan: FileScan, view: PageView): FileText {
    const real = diskPath(scan.file, view.roots);
    if (real === null) return null;
    if (scan.open === true) {
        const open = view.documents.find((one) => normal(one.real) === normal(real));
        return open === undefined ? null : { text: open.text };
    }
    return view.read(real);
}

/** The first file the rename names that a tab of another window holds. */
function heldBack(hit: Hit, graph: Graph, view: PageView): Refusal | null {
    for (const scan of namedScans(graph, hit)) {
        const real = diskPath(scan.file, view.roots);
        if (real !== null && view.heldElsewhere(real)) {
            return { code: 'elsewhere', file: scan.file.path };
        }
    }
    return null;
}

/**
 * The refusal that does not depend on the new key, from the index and the texts as they are: the
 * key's own refusals first, so a key that is never renamed here says so before any tab is named.
 */
function refusalOfKey(asked: Asked, view: PageView): Refusal | null {
    const { hit, graph } = asked;
    if (hit === null) return null;
    return refuseRename(graph, hit, (scan) => textOf(scan, view)) ?? heldBack(hit, graph, view);
}

/** F2 on a position: the key's range and text, or why it is not renamed. */
function prepare(asked: Asked, view: PageView): PageAnswer | undefined {
    const { hit } = asked;
    if (hit === null) return undefined;
    const refusal = refusalOfKey(asked, view);
    if (refusal !== null) return refused(refusal, view);
    return { result: { range: hit.at.span, placeholder: hit.key } };
}

/** The new name: the edit that renames the key in every file that names it, or the refusal. */
function rename(asked: Asked, view: PageView): PageAnswer | undefined {
    const { hit, graph, params } = asked;
    if (hit === null) return undefined;
    const held = refusalOfKey(asked, view);
    if (held !== null) return refused(held, view);
    const name = typeof params.newName === 'string' ? params.newName : '';
    const plan = planRename(graph, hit, name, (scan) => textOf(scan, view));
    if (!plan.ok) return refused(plan.refusal, view);
    const changes = plan.files.map((file) => {
        const at = whereIs(view, file.scan);
        const edits = file.edits.map((edit) => ({ ...edit, annotationId: RENAME_ANNOTATION }));
        return { textDocument: { uri: at.uri, version: at.version }, edits };
    });
    const annotation = { label: hit.key, description: name, needsConfirmation: true };
    return {
        result: { documentChanges: changes, changeAnnotations: { [RENAME_ANNOTATION]: annotation } }
    };
}

/** The requests the entry answers, each by the function that answers it. */
const ANSWERS: Record<
    string,
    ((asked: Asked, view: PageView) => PageAnswer | undefined) | undefined
> = {
    'textDocument/definition': definition,
    'textDocument/references': references,
    'textDocument/prepareRename': prepare,
    'textDocument/rename': rename
};

/** The answer of the YAML entry to a request of the page, or undefined to send it on. */
export function answerHubKeys(request: PageRequest, view: PageView): PageAnswer | undefined {
    const answer = ANSWERS[request.method];
    const named = answer === undefined ? undefined : documentOf(request, view);
    if (answer === undefined || named === undefined) return undefined;
    const asked = locate(named, view);
    if (asked === undefined) {
        return request.method === 'textDocument/references' ? { result: [] } : undefined;
    }
    return answer(asked, view);
}
