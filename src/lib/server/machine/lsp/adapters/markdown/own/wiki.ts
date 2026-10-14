// Layer 2, server. What the Markdown entry knows of the links between notes, `[[name]]`,
// `[[name#heading]]`, `[[name|shown]]` and the embeds `![[name]]`, which the Markdown server does
// not read: completion after `[[` (the notes of the folder, and after `#` the headings of the note
// named), Go to Definition and Find All References on a link, Find All References of the note
// itself from anywhere in it that is no link or heading, and Rename on a link, which renames the
// note and rewrites every link to it. It answers only in a note: a Markdown file of a hub's notes
// folder (data/prose/markdown/note-names.ts), and only of the notes of that folder, so a link never
// leads to another hub's note.
//
// Completion, definitions and references are added to the server's own answer (`addedWiki`, which
// the relay joins to it, held/requests/merged.ts), since the server answers a heading or a path in
// the same note. A rename on a link is the entry's alone (`answerWiki`): its answer is a
// `documentChanges` edit that renames the note's file and edits the name of every link to it in the
// notes of the folder (note-links.ts's noteMoveEdits, which the Notes section's rename runs too),
// each file with the page's version when it is open and null when it is not. The page makes such an
// edit as the Notes section's rename of the note (state/system/machine/lsp/edits.ts's
// noteRenameOf), which plans the links again from the texts it holds, and leaves the text edits of
// the answer aside. A new name the rule refuses, or that another note of the folder has, is an
// error whose message says why.
//
// The notes are read as the page holds them open, else from the disk (`PageView.read`).

import { join, relative, sep } from 'node:path';
import {
    linkAt,
    linkPath,
    noteMoveEdits,
    resolveNote,
    scanNote,
    type NoteScan
} from '../../../../../../data/prose/markdown/note-links.ts';
import {
    NOTE_SUFFIX,
    isNote,
    nameRefusalMessage,
    nameTaken,
    noteName,
    noteTitle
} from '../../../../../../data/prose/markdown/note-names.ts';
import { inside, realPath } from '../../../../../core/paths.ts';
import { words } from '../../../../../core/words.ts';
import { noteFiles, notesFolderOf } from '../../../../../files/fs/notes.ts';
import type { PageAnswer, PageRequest, PageView } from '../../../servers.ts';
import { normal } from '../../../uris.ts';
import { addressOf } from './answers.ts';

/** The error code of a request that is refused for a reason of its own, `RequestFailed`. */
const REQUEST_FAILED = -32803;

/** The protocol's kinds of a completion item: a file and a reference. */
const FILE_KIND = 17;
const HEADING_KIND = 18;

/** A note a request is made in: its folder's real path, its path inside it and every file there. */
type Place = { folder: string; path: string; paths: string[] };

/** A request's place in its document: the document's text, line and character. */
type At = { uri: string; text: string; line: number; character: number; place: Place };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The notes folder a file lies in, and its path inside it, or null for a file of no notes folder.
 */
function placeOf(real: string, view: PageView): Place | null {
    for (const root of view.roots) {
        if (root.hub !== true) continue;
        const folder = realPath(notesFolderOf(root.real), true);
        if (folder === null || !inside(real, folder) || normal(real) === normal(folder)) continue;
        const path = relative(folder, real).split(sep).join('/');
        if (!isNote(path) || path.split('/').some((one) => one.startsWith('.'))) continue;
        return { folder, path, paths: noteFiles(folder) };
    }
    return null;
}

/** Where a request of the page points, in a note, or null for a request that names no note. */
function atOf(params: unknown, view: PageView): At | null {
    if (!isRecord(params) || !isRecord(params.textDocument) || !isRecord(params.position)) {
        return null;
    }
    const { line, character } = params.position;
    const document = view.document(params.textDocument.uri);
    if (document === undefined || typeof line !== 'number' || typeof character !== 'number') {
        return null;
    }
    const place = placeOf(document.real, view);
    if (place === null) return null;
    return { uri: document.pageUri, text: document.text, line, character, place };
}

/** The text of a note of the folder: the page's tab when it has one open, else the disk's. */
function textOf(place: Place, path: string, view: PageView): string | null {
    const real = join(place.folder, ...path.split('/'));
    const open = view.documents.find((one) => normal(one.real) === normal(real));
    if (open !== undefined) return open.text;
    const read = view.read(real);
    return read !== null && 'text' in read ? read.text : null;
}

/** The address a note of the folder is named by on the page, or null. */
function addressIn(place: Place, path: string, view: PageView): string | null {
    return addressOf(join(place.folder, ...path.split('/')), view);
}

/** A place in a text as the protocol's range of no width. */
function point(line: number) {
    const at = { line, character: 0 };
    return { start: at, end: at };
}

/** The names a link may give a note: its name alone while no other note has it, else its path. */
function linkName(path: string, paths: readonly string[]): string {
    const title = noteTitle(path);
    return resolveNote(title, paths) === path ? title : linkPath(path);
}

/** The completion items after `[[` on the line up to the caret, or null when there is no `[[`. */
function completions(at: At, view: PageView): unknown[] | null {
    const line = at.text.split(/\r?\n/)[at.line] ?? '';
    const before = line.slice(0, at.character);
    const open = before.lastIndexOf('[[');
    if (open < 0 || before.slice(open).includes(']]')) return null;
    const typed = before.slice(open + 2);
    const embed = open > 0 && before[open - 1] === '!';
    const hash = typed.indexOf('#');
    const range = (from: number) => ({
        start: { line: at.line, character: from },
        end: { line: at.line, character: at.character }
    });
    if (hash >= 0) {
        const target = resolveNote(typed.slice(0, hash), at.place.paths);
        const text = target === null ? null : textOf(at.place, target, view);
        if (text === null) return [];
        return scanNote(text).headings.map((heading) => ({
            label: heading.text,
            kind: HEADING_KIND,
            textEdit: { range: range(open + 2 + hash + 1), newText: heading.text }
        }));
    }
    const offered = at.place.paths.filter((path) => embed || isNote(path));
    return offered.map((path) => {
        const name = isNote(path) ? linkName(path, at.place.paths) : path;
        return {
            label: isNote(path) ? noteTitle(path) : path,
            detail: path,
            kind: FILE_KIND,
            filterText: name,
            textEdit: { range: range(open + 2), newText: name }
        };
    });
}

/** Every link of the folder's notes to a note, as the protocol's locations on the page. */
function linksTo(place: Place, target: string, view: PageView): unknown[] {
    const found: unknown[] = [];
    for (const path of place.paths.filter(isNote)) {
        const text = textOf(place, path, view);
        const uri = text === null ? null : addressIn(place, path, view);
        if (text === null || uri === null) continue;
        for (const link of scanNote(text).links) {
            if (resolveNote(link.name, place.paths) !== target) continue;
            const range = {
                start: { line: link.line, character: link.start },
                end: { line: link.line, character: link.end }
            };
            found.push({ uri, range });
        }
    }
    return found;
}

/** Whether a line of a scanned note is one of its headings. */
function onHeading(scan: NoteScan, line: number): boolean {
    return scan.headings.some((heading) => heading.line === line);
}

/**
 * What the entry adds to the server's answer to a request in a note: the completions after `[[`,
 * the note a link leads to, and the links to a note. Undefined for a request it adds nothing to.
 */
export function addedWiki(request: PageRequest, view: PageView): unknown {
    const at = atOf(request.params, view);
    if (at === null) return undefined;
    if (request.method === 'textDocument/completion') return completions(at, view) ?? undefined;
    const scan = scanNote(at.text);
    const link = linkAt(scan, at.line, at.character);
    const target = link === undefined ? null : resolveNote(link.name, at.place.paths);
    if (request.method === 'textDocument/definition') {
        if (link === undefined || target === null) return undefined;
        const uri = addressIn(at.place, target, view);
        const text = textOf(at.place, target, view);
        const heading =
            text === null || link.heading === ''
                ? undefined
                : scanNote(text).headings.find(
                      (one) => one.text.toLowerCase() === link.heading.toLowerCase()
                  );
        return uri === null ? undefined : [{ uri, range: point(heading?.line ?? 0) }];
    }
    if (request.method === 'textDocument/references') {
        if (link !== undefined) return target === null ? [] : linksTo(at.place, target, view);
        if (onHeading(scan, at.line)) return undefined;
        return linksTo(at.place, at.place.path, view);
    }
    return undefined;
}

/** A refusal of a rename, in the catalog's words. */
function refused(sentence: string): PageAnswer {
    return { error: { code: REQUEST_FAILED, message: sentence } };
}

/** The rename of a note a link leads to: the file renamed and every link to it edited. */
function renamed(at: At, target: string, typed: unknown, view: PageView): PageAnswer {
    const made = noteName(typeof typed === 'string' ? typed : '');
    if (!made.ok) {
        const message = nameRefusalMessage(made.refusal);
        return refused(words(view.catalog, message.key, ...message.args));
    }
    const folder = target.includes('/') ? target.slice(0, target.lastIndexOf('/') + 1) : '';
    const next = `${folder}${made.name}${NOTE_SUFFIX}`;
    const siblings = at.place.paths
        .filter((path) => path.startsWith(folder) && !path.slice(folder.length).includes('/'))
        .map((path) => path.slice(folder.length));
    if (nameTaken(siblings, `${made.name}${NOTE_SUFFIX}`, target.slice(folder.length))) {
        return refused(words(view.catalog, 'notes.name_taken', made.name));
    }
    const texts = new Map<string, string>();
    for (const path of at.place.paths.filter(isNote)) {
        const text = textOf(at.place, path, view);
        if (text !== null) texts.set(path, text);
    }
    const oldUri = addressIn(at.place, target, view);
    const newUri = addressOf(join(at.place.folder, ...next.split('/')), view);
    if (oldUri === null || newUri === null) return { result: null };
    const edits = noteMoveEdits(at.place.paths, [{ from: target, to: next }], texts);
    const changes: unknown[] = [{ kind: 'rename', oldUri, newUri }];
    for (const [path, list] of edits) {
        const real = join(at.place.folder, ...path.split('/'));
        const open = view.documents.find((one) => normal(one.real) === normal(real));
        const uri = path === target ? newUri : addressIn(at.place, path, view);
        if (uri === null) continue;
        changes.push({ textDocument: { uri, version: open?.version ?? null }, edits: list });
    }
    return { result: { documentChanges: changes } };
}

/**
 * The entry's own answer to a rename on a link in a note, and to the question before it: the
 * range of the link's name and the note's name as it stands. Undefined for a request that is the
 * server's: one elsewhere than on a link, or on a link to no note.
 */
export function answerWiki(request: PageRequest, view: PageView): PageAnswer | undefined {
    const method = request.method;
    if (method !== 'textDocument/prepareRename' && method !== 'textDocument/rename') {
        return undefined;
    }
    const at = atOf(request.params, view);
    if (at === null) return undefined;
    const link = linkAt(scanNote(at.text), at.line, at.character);
    const target = link === undefined ? null : resolveNote(link.name, at.place.paths);
    if (link === undefined || target === null || !isNote(target)) return undefined;
    if (method === 'textDocument/prepareRename') {
        const range = {
            start: { line: link.line, character: link.nameStart },
            end: { line: link.line, character: link.nameEnd }
        };
        return { result: { range, placeholder: noteTitle(target) } };
    }
    const params = request.params as Record<string, unknown>;
    return renamed(at, target, params.newName, view);
}
