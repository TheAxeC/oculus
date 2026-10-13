// Layer 2, server. The edit a move in the Files view asks of the Markdown servers: the links in
// Markdown files that pointed at the moved items, rewritten. The page sends the moves of one root
// (`links`) after they happened, and gets one workspace edit back (`links_answer`) that it shows as
// a Refactor Preview, so nothing is written before the reader applies it.
//
// Every served root whose folder holds both places of a move is asked, the innermost first, each
// from its own Markdown server: the page's if it has one for the root, else one started for this
// request, which ends 60 s after the last answer when no Markdown tab holds it. The server is told
// the moves as watcher notices first, and each Markdown file inside a moved item as gone from its
// old place, since it keeps its own view of the disk; a Markdown tab of a moved file is put on it
// at its new place. Its answer is the edit for links; the edits for the backticked paths of every
// Markdown file of the root are added (adapters/markdown/rewrite.ts). The edits of all the roots
// are merged per file (data/prose/text-edits.ts). An edit for a file the page may not be given
// is left out. A request whose page closed answers nothing. A root whose server ended or did not
// answer within 30 s, the wait for it to read the files changed on disk included, is named in the
// answer beside the edits of the others, and a request no root's server answered is an error.

import { readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { LinksFailure, LspRpc, LspToServer } from '../../../../../data/model/index.ts';
import { TEXT_LIMIT } from '../../../../../data/file-ops.ts';
import { isWholeText } from '../../../../../data/helpers/files/text-kind.ts';
import { MergedEdits } from '../../../../../data/prose/text-edits.ts';
import { inside } from '../../../../core/paths.ts';
import { markdownFiles, reachable, served } from '../../adapters/markdown/places.ts';
import { movedPathChanges, type Moved, type TextChange } from '../../adapters/markdown/rewrite.ts';
import type { ServerEntry } from '../../servers.ts';
import type { OculusContext } from '../oculus.ts';
import { normal, pageUri, toPage, type Mapper, type ServedRoot } from '../../uris.ts';
import { isRecord } from '../../wire.ts';
import { Held, LINGER_MS, docKey, heldKey, type Doc, type Open, type Page } from '../held.ts';
import { adoptHeld } from '../documents.ts';

/** What the request reads of the relay. */
export type LinksContext = OculusContext & {
    /** The extensions of Markdown files. */
    extensions(): string[];
    /** The servers whose page closed and wait to be taken over. */
    orphans: Set<Held>;
    /** A server of the entry for a root, for a page that has none. */
    make(page: Page, entry: ServerEntry, root: ServedRoot, key: string): Held;
    mapper(page: Page, held: Held): Mapper;
};

type Links = Extract<LspToServer, { oculus: 'links' }>;

/** What the request comes to: the edit and the texts it is of, or why there is none. */
type Answer =
    | {
          edit: unknown;
          held: { uri: string; text: string }[];
          overlaps: string[];
          unanswered: string[];
      }
    | { error: LinksFailure };

/** The kind of change a `didChangeWatchedFiles` carries for a file that is gone. */
const DELETED = 3;

/** The milliseconds a server is given to answer. */
const ASK_MS = 30_000;

/** The moves of a request as real paths, or null when a path is not one under the root. */
function movesOf(message: Links, root: ServedRoot | undefined): Moved[] | null {
    if (root === undefined || message.moves.length === 0) return null;
    const moves: Moved[] = [];
    for (const { from, to } of message.moves) {
        const parts = [...from.split('/'), ...to.split('/')];
        if (parts.some((part) => part === '' || part === '.' || part === '..')) return null;
        moves.push({ from: join(root.real, from), to: join(root.real, to) });
    }
    return moves;
}

/** The text of a file the page has no tab of, or null when it cannot be read as text. */
function diskText(real: string): string | null {
    try {
        if (statSync(real).size > TEXT_LIMIT) return null;
        const bytes = readFileSync(real);
        return isWholeText(bytes) ? bytes.toString('utf8') : null;
    } catch {
        return null;
    }
}

/**
 * Put a Markdown document that moved on the server at its new place: closed there under the old
 * address and opened under the new one with the same text, and the page's names for it follow, so
 * the page's own close and open for the moved tab find it done.
 */
function followDocuments(page: Page, held: Held, moves: readonly Moved[]): void {
    for (const doc of [...held.docs.values()]) {
        const move = moves.find(
            (one) => doc.real === one.from || doc.real.startsWith(one.from + sep)
        );
        if (move === undefined) continue;
        const real = move.to + doc.real.slice(move.from.length);
        const open = [...page.docs].filter(([, one]) => one.doc === doc);
        const [name] = open.at(0) ?? [''];
        const key = pageKeyOf(name, held.root, real);
        held.notify({
            jsonrpc: '2.0',
            method: 'textDocument/didClose',
            params: { textDocument: { uri: doc.fileUri } }
        });
        held.docs.delete(docKey(doc.fileUri));
        held.dropped(doc);
        for (const [uri] of open) page.docs.delete(uri);
        page.opened.delete(normal(doc.real));
        const moved: Doc = {
            ...doc,
            real,
            fileUri: pathToFileURL(real).href,
            pageUri: key,
            version: 1,
            shift: 0
        };
        held.open(moved);
        const next: Open = { held, doc: moved, also: [] };
        // The document stays open on the other servers of its language, moved the same way.
        for (const other of open.at(0)?.[1].also ?? []) {
            other.held.notify({
                jsonrpc: '2.0',
                method: 'textDocument/didClose',
                params: { textDocument: { uri: other.doc.fileUri } }
            });
            other.held.docs.delete(docKey(other.doc.fileUri));
            other.held.dropped(other.doc);
            const there: Doc = { ...moved, version: 1, shift: 0 };
            other.held.open(there);
            next.also.push({ held: other.held, doc: there, also: [] });
        }
        page.docs.set(key, next);
        page.opened.set(normal(real), key);
    }
}

/** The page's address of a moved document: its old root key and the path under the root. */
function pageKeyOf(oldName: string, root: ServedRoot, real: string): string {
    const rooted = /^oculus-file:\/\/\/([^/]*)/.exec(oldName)?.[1];
    const key = rooted === undefined ? root.key : decodeURIComponent(decodeURIComponent(rooted));
    return pageUri(key, relative(root.real, real).split(sep).join('/'));
}

/**
 * Tell the server that each Markdown file under a moved item is gone from its old place, as the
 * disk says of a file but not of the files inside a folder that was renamed: the server keeps a
 * file it has read until it hears so, and would rewrite the links of the file at its old place.
 */
function goneFiles(held: Held, files: readonly string[], moves: readonly Moved[]): void {
    const changes: { uri: string; type: number }[] = [];
    for (const move of moves) {
        for (const real of files) {
            if (real !== move.to && !real.startsWith(move.to + sep)) continue;
            const old = move.from + real.slice(move.to.length);
            if (held.docs.has(docKey(pathToFileURL(real).href))) continue;
            held.forget(old);
            changes.push({ uri: pathToFileURL(old).href, type: DELETED });
        }
    }
    if (changes.length === 0) return;
    held.notify({ jsonrpc: '2.0', method: 'workspace/didChangeWatchedFiles', params: { changes } });
}

/** The edit of the changes of one root: the server's entries and the backticked ones. */
async function editOf(
    context: LinksContext,
    held: Held,
    root: ServedRoot,
    moves: Moved[]
): Promise<{ entries: unknown[] } | null> {
    const reach = { root, roots: context.roots() };
    const files = await markdownFiles(reach, context.extensions());
    const abandoned = { now: false };
    const asked = (async (): Promise<LspRpc | null> => {
        await held.caughtUp(files);
        if (abandoned.now) return null;
        for (const move of moves) {
            held.touched(move.from, 'delete');
            held.touched(move.to, 'create');
        }
        goneFiles(held, files, moves);
        return held.call(
            'markdown/getEditForFileRenames',
            [
                moves.map((move) => ({
                    oldUri: pathToFileURL(move.from).href,
                    newUri: pathToFileURL(move.to).href
                }))
            ],
            true
        );
    })();
    const timer = new Promise<null>((resolve) => {
        const handle = setTimeout(() => resolve(null), ASK_MS);
        if (typeof handle === 'object' && typeof handle.unref === 'function') handle.unref();
    });
    const answer = await Promise.race([asked, timer]);
    abandoned.now = answer === null;
    if (answer === null || answer.error !== undefined) return null;
    const result = isRecord(answer.result) ? answer.result : {};
    const edit = isRecord(result.edit) ? result.edit : {};
    const entries = Array.isArray(edit.documentChanges)
        ? [...(edit.documentChanges as unknown[])]
        : [];
    const byFile = new Map<string, TextChange[]>();
    for (const real of files) {
        const open = held.docs.get(docKey(pathToFileURL(real).href));
        const text = open?.text ?? diskText(real);
        if (text === null) continue;
        const changes = movedPathChanges(text, real, reach, moves);
        if (changes.length > 0) byFile.set(real, changes);
    }
    for (const [real, changes] of byFile) {
        const uri = pathToFileURL(real).href;
        const own = entries.find(
            (one): one is { edits: unknown[] } =>
                isRecord(one) &&
                isRecord(one.textDocument) &&
                one.textDocument.uri === uri &&
                Array.isArray(one.edits)
        );
        if (own === undefined)
            entries.push({ textDocument: { uri, version: null }, edits: changes });
        else own.edits.push(...changes);
    }
    return { entries };
}

/** Answer a page's request for the edit of the moves it made. */
export async function askLinks(
    context: LinksContext,
    page: Page,
    channel: string,
    entry: ServerEntry,
    message: Links
): Promise<void> {
    let payload: Answer;
    try {
        payload = await collect(context, page, entry, message);
    } catch {
        payload = { error: 'unsent' };
    }
    context.send(page, channel, { oculus: 'links_answer', id: message.id, ...payload });
}

/** The edit the servers of the roots holding the moves give, merged, or why there is none. */
async function collect(
    context: LinksContext,
    page: Page,
    entry: ServerEntry,
    message: Links
): Promise<Answer> {
    const base = context.roots().find((one) => one.key === message.root);
    const moves = movesOf(message, base);
    if (moves === null) return { error: 'no_place' };
    const holders = context
        .roots()
        .filter((root) =>
            moves.some((move) => inside(move.from, root.real) && inside(move.to, root.real))
        )
        .sort((a, b) => b.real.length - a.real.length);
    const merged = new MergedEdits();
    const used: Held[] = [];
    const unanswered: string[] = [];
    try {
        for (const root of holders) {
            const key = heldKey(entry, root);
            const held =
                page.helds.get(key) ??
                adoptHeld(page, key, context.orphans) ??
                context.make(page, entry, root, key);
            held.keep();
            held.asking += 1;
            used.push(held);
            const mine = moves.filter(
                (move) => inside(move.from, root.real) && inside(move.to, root.real)
            );
            followDocuments(page, held, mine);
            const found = await editOf(context, held, root, mine);
            if (found === null) {
                unanswered.push(root.key);
                continue;
            }
            const kept = found.entries.filter((one) => allowed(one, root, context));
            const mapped = toPage(
                held.pageVersions({ documentChanges: kept }),
                context.mapper(page, held)
            );
            const changes = isRecord(mapped?.value) ? mapped.value.documentChanges : undefined;
            merged.add(Array.isArray(changes) ? (changes as unknown[]) : []);
        }
    } finally {
        for (const held of used) {
            held.asking -= 1;
            if (held.asking === 0 && held.docs.size === 0) held.armEnd(LINGER_MS);
        }
    }
    const { changes, overlaps } = merged.result();
    if (unanswered.length > 0 && unanswered.length === holders.length) {
        return { error: 'no_answer' };
    }
    const texts = used.flatMap((held) =>
        [...held.docs.values()].map((doc) => ({ uri: doc.pageUri, text: doc.text }))
    );
    return {
        edit: changes.length === 0 ? null : { documentChanges: changes },
        held: texts,
        overlaps,
        unanswered
    };
}

/** Whether an entry of the server's edit is for a file the page may be given edits for. */
function allowed(entry: unknown, root: ServedRoot, context: LinksContext): boolean {
    const document = isRecord(entry) && isRecord(entry.textDocument) ? entry.textDocument : null;
    const real =
        document === null ? null : reachable(document.uri, { root, roots: context.roots() });
    return real !== null && served(real, { root, roots: context.roots() });
}
