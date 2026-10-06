// Layer 2, server. The two forms a document's address takes and the rules that turn one into the
// other. The page names a document as `oculus-file:///<root key>/<path>`, each part
// percent-encoded; a server is given the `file://` URI of the file's real path, and every `file://`
// URI in a server's message goes back to the page in the page's form.
//
// A page URI is read before anything reaches a server: its scheme must be `oculus-file`, its
// root key a served root, and its path relative, with no `..`, no empty part and no part that holds
// a `/` once decoded (`%2F` included). The file is then resolved by its real path, and a link that
// leaves the root refuses it. The document belongs to the served root whose real path is the
// longest prefix of the file's real path, whatever root key the tab used, so a file under two roots
// is one document of one server. Paths are compared NFC-normalised and by the operating system's
// own spelling of the real path (clangd answers one location in two spellings, `/var` and
// `/private/var`, and a file name may be NFD on disk and NFC in the tab).
//
// Only the fields that carry an address are rewritten: `uri` and `targetUri` wherever they stand
// (the document of a request, the two kinds of location, the location of related information, the
// folders of a workspace), the `file` of a clangd command's argument, the `target` of a document
// link, the address strings of a command's `arguments` and the keys of a workspace edit's
// `changes`. A message to a server that holds any other address, or one that does not resolve, is
// refused whole. A message to the page that holds a location outside every served root drops that
// location from its answer.

import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import type { Root } from '../../files/files.ts';
import { expandHome } from '../../files/files.ts';
import { inside, realPath } from '../../core/paths.ts';

/** The scheme the page names a document by. */
const PAGE_SCHEME = 'oculus-file:';

/** A root the file browser serves, with its real path resolved. */
export type ServedRoot = { key: string; dir: string; real: string };

/**
 * A page URI resolved: the file's real path and URI, the root it belongs to, and the page's key.
 */
export type Resolved = {
    /** The `file://` URI of the real path, which is what a server is given. */
    fileUri: string;
    /** The file's real path, in the operating system's own spelling. */
    real: string;
    /** The innermost served root the file lies in. */
    root: ServedRoot;
    /** The root key the page named, which may be an outer root's. */
    pageRoot: string;
    /** The path under that key, as the page named it. */
    path: string;
};

/** Spell a path the way two spellings of one file compare equal. */
export function normal(path: string): string {
    return path.normalize('NFC');
}

/** The roots of the file browser that exist, each with its real path. */
export function servedRoots(roots: readonly Root[]): ServedRoot[] {
    const served: ServedRoot[] = [];
    for (const root of roots) {
        const dir = expandHome(root.dir);
        const real = realPath(dir, true);
        if (real !== null) served.push({ key: root.key, dir, real });
    }
    return served;
}

/** One part of a path, percent-encoded. */
function encodePart(part: string): string {
    return encodeURIComponent(part);
}

/**
 * The root key as the address carries it, percent-encoded twice. The editor's own URI type decodes
 * an address's path once before the page reads a root key back from it, so a key holding a `/`
 * stays one part of the address on both sides of that decoding.
 */
function encodeRoot(root: string): string {
    return encodeURIComponent(encodeURIComponent(root));
}

/** The page URI of a path under a root key. */
function pageUri(root: string, path: string): string {
    const parts = path === '' ? [] : path.split('/');
    return `${PAGE_SCHEME}///${[encodeRoot(root), ...parts.map(encodePart)].join('/')}`;
}

/**
 * The root key and the path a page URI names, or null for one that is not a page URI of the shape
 * above: another scheme, no root key, a path part that is empty, `.` or `..`, or one that decodes
 * to a `/`, a NUL or a backslash. A root key is read as the text it is whatever it holds, since
 * the key only ever names a served root it equals.
 */
function parsePageUri(uri: unknown): { root: string; path: string } | null {
    if (typeof uri !== 'string' || !uri.startsWith(`${PAGE_SCHEME}///`)) return null;
    const parts = uri.slice(`${PAGE_SCHEME}///`.length).split('/');
    if (parts.length < 2) return null;
    let root: string;
    try {
        root = decodeURIComponent(decodeURIComponent(parts[0]));
    } catch {
        return null;
    }
    if (root === '' || root.includes('\0')) return null;
    const decoded: string[] = [];
    for (const part of parts.slice(1)) {
        let text: string;
        try {
            text = decodeURIComponent(part);
        } catch {
            return null;
        }
        if (text === '' || text === '.' || text === '..') return null;
        if (text.includes('/') || text.includes('\\') || text.includes('\0')) return null;
        decoded.push(text);
    }
    return { root, path: decoded.join('/') };
}

/** The innermost served root whose real path holds a real path, or null for none. */
function innermost(real: string, roots: readonly ServedRoot[]): ServedRoot | null {
    const target = normal(real);
    let best: ServedRoot | null = null;
    for (const root of roots) {
        if (!inside(target, normal(root.real))) continue;
        if (best === null || root.real.length > best.real.length) best = root;
    }
    return best;
}

/** A page URI resolved against the served roots, or null when it is refused. */
export function resolvePageUri(uri: unknown, roots: readonly ServedRoot[]): Resolved | null {
    const named = parsePageUri(uri);
    if (named === null) return null;
    const asked = roots.find((one) => one.key === named.root);
    if (asked === undefined) return null;
    const real = realPath(join(asked.real, named.path), true);
    if (real === null || !inside(normal(real), normal(asked.real))) return null;
    const root = innermost(real, roots);
    if (root === null) return null;
    return {
        fileUri: pathToFileURL(real).href,
        real,
        root,
        pageRoot: named.root,
        path: named.path
    };
}

/** The real path a `file://` URI names, or null for another scheme or a malformed address. */
function realOfFileUri(uri: string): string | null {
    if (!uri.startsWith('file://')) return null;
    try {
        const path = fileURLToPath(uri);
        return realPath(path, true) ?? path;
    } catch {
        return null;
    }
}

/** What turns a server's `file://` URI into the page's. */
export type Mapper = {
    roots: readonly ServedRoot[];
    /** The page URI of a document the page has open, by the file's real path. */
    opened(real: string): string | undefined;
    /** The key the page uses for a root, the root's own when the page used none. */
    alias(root: ServedRoot): string;
};

/** The page URI of a server's `file://` URI, or null for a file outside every served root. */
function toPageUri(uri: string, mapper: Mapper): string | null {
    const real = realOfFileUri(uri);
    if (real === null) return null;
    const known = mapper.opened(real);
    if (known !== undefined) return known;
    const root = innermost(real, mapper.roots);
    if (root === null) return null;
    const under = relative(normal(root.real), normal(real));
    if (under === '' || under.startsWith('..')) return null;
    return pageUri(mapper.alias(root), under.split(sep).join('/'));
}

/** The fields of a message that hold the address of a document. */
const URI_FIELDS: readonly string[] = ['uri', 'targetUri'];

/**
 * The field clangd's commands carry a document's address in (`arguments[0].file`). It is turned
 * only when the value is an address of the form being turned, since a `file` field of any other
 * message is a plain name.
 */
const FILE_FIELD = 'file';

/** The field of a document link that holds the address it leads to. */
const LINK_FIELD = 'target';

/** A value that stands for a location the page cannot be given, dropped with what holds it. */
const DROP = Symbol('dropped');

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A message for a server, every address in it turned into the real `file://` URI of its file, or
 * null when any address is not a page URI that resolves (the whole message is then refused).
 */
export function toServer(value: unknown, roots: readonly ServedRoot[]): { value: unknown } | null {
    const outcome = { refused: false };
    const address = (uri: unknown): string => {
        const resolved = resolvePageUri(uri, roots);
        if (resolved === null) {
            outcome.refused = true;
            return '';
        }
        return resolved.fileUri;
    };
    const walk = (item: unknown): unknown => {
        if (Array.isArray(item)) return item.map(walk);
        if (!isRecord(item)) return item;
        const copy: Record<string, unknown> = {};
        for (const [key, inner] of Object.entries(item)) {
            if (URI_FIELDS.includes(key) && typeof inner === 'string') copy[key] = address(inner);
            else if (
                key === FILE_FIELD &&
                typeof inner === 'string' &&
                inner.startsWith(PAGE_SCHEME)
            ) {
                copy[key] = address(inner);
            } else if (key === 'arguments' && Array.isArray(inner)) {
                copy[key] = inner.map((one) =>
                    typeof one === 'string' && one.startsWith(PAGE_SCHEME)
                        ? address(one)
                        : walk(one)
                );
            } else if (key === 'changes' && isRecord(inner)) {
                const changes: Record<string, unknown> = {};
                for (const [uri, edits] of Object.entries(inner))
                    changes[address(uri)] = walk(edits);
                copy[key] = changes;
            } else copy[key] = walk(inner);
        }
        return copy;
    };
    const walked = walk(value);
    return outcome.refused ? null : { value: walked };
}

/**
 * A message for the page, every `file://` address in it (or the address alone, as a result may be)
 * turned into the page's form. A location outside every served root is dropped, with the list
 * entry or the message that holds it: the result is null when the dropped location was the whole
 * answer.
 */
export function toPage(value: unknown, mapper: Mapper): { value: unknown } | null {
    // clangd answers `textDocument/switchSourceHeader` with the file's address alone.
    if (typeof value === 'string' && value.startsWith('file://')) {
        const page = toPageUri(value, mapper);
        return page === null ? null : { value: page };
    }
    const walk = (item: unknown): unknown => {
        if (Array.isArray(item)) {
            return item.map(walk).filter((one) => one !== DROP);
        }
        if (!isRecord(item)) return item;
        const copy: Record<string, unknown> = {};
        for (const [key, inner] of Object.entries(item)) {
            if (
                (URI_FIELDS.includes(key) || key === FILE_FIELD || key === LINK_FIELD) &&
                typeof inner === 'string' &&
                inner.startsWith('file://')
            ) {
                const page = toPageUri(inner, mapper);
                if (page === null) return DROP;
                copy[key] = page;
            } else if (key === 'arguments' && Array.isArray(inner)) {
                copy[key] = inner.map((one) =>
                    typeof one === 'string' && one.startsWith('file://')
                        ? (toPageUri(one, mapper) ?? one)
                        : walk(one)
                );
            } else if (key === 'changes' && isRecord(inner)) {
                const changes: Record<string, unknown> = {};
                for (const [uri, edits] of Object.entries(inner)) {
                    changes[toPageUri(uri, mapper) ?? uri] = walk(edits);
                }
                copy[key] = changes;
            } else {
                const walked = walk(inner);
                if (walked === DROP) return DROP;
                copy[key] = walked;
            }
        }
        return copy;
    };
    const walked = walk(value);
    return walked === DROP ? null : { value: walked };
}
