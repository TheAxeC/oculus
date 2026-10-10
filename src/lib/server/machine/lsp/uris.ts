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
// Only the fields that carry an address are rewritten: `uri`, `targetUri`, `oldUri` and `newUri`
// wherever they stand (the document of a request, the two kinds of location, the location of
// related information, the folders of a workspace, the files a workspace edit renames), the `file`
// of a clangd command's argument, the `target` of a document link, the address strings of a
// command's `arguments` and the keys of a workspace edit's `changes`. A record that spells an
// address (a `scheme`, a `path` and sometimes an `external` and an `fsPath`, as the `data` of a
// document link does, a server's own note that comes back with the link's resolve) goes to the
// page as a page address of the same shape and back to the server as the file's. A `#fragment`
// after an address (the `#L<line>,<column>` of a link to a heading) is kept apart from the path in
// both directions.
// A message to a server that holds any other address, or one that does not resolve, is refused
// whole.
//
// A file outside every served root that a server names reaches the page as a library address
// (library/address.ts) when the mapper's `library` gives one, and the page's message about it goes
// back to the server under the file's own `file://` address through the `library` the call of
// `toServer` is given. The mapper decides whether an address may be given: the relay mints one
// only in an answer to a request of the page, for a path library/rules.ts allows, and in every
// other message it gives only an address the page already holds. A location the mapper gives no
// address for is dropped from the message to the page, with the list entry, command or workspace
// edit that holds it, so no `file://` path of the machine reaches the page in any field.

import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import type { Root } from '../../files/files.ts';
import { expandHome } from '../../files/files.ts';
import { inside, realPath } from '../../core/paths.ts';
import { isLibraryAddress } from './library/address.ts';

/** The name of the scheme the page names a document by, and the scheme with its colon. */
const PAGE_NAME = 'oculus-file';
const PAGE_SCHEME = `${PAGE_NAME}:`;

/** A root the file browser serves, with its real path resolved. */
export type ServedRoot = { key: string; dir: string; real: string; hub?: true };

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
        if (real !== null)
            served.push({
                key: root.key,
                dir,
                real,
                ...(root.hub === true ? { hub: true as const } : {})
            });
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
export function pageUri(root: string, path: string): string {
    const parts = path === '' ? [] : path.split('/');
    return `${PAGE_SCHEME}///${[encodeRoot(root), ...parts.map(encodePart)].join('/')}`;
}

/**
 * The root key and the path a page URI names, or null for one that is not a page URI of the shape
 * above: another scheme, no root key, a path part that is empty, `.` or `..`, or one that decodes
 * to a `/`, a NUL or a backslash. A root key is read as the text it is whatever it holds, since
 * the key only ever names a served root it equals.
 */
export function parsePageUri(uri: unknown): { root: string; path: string } | null {
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
    /**
     * The library address of a file outside every served root, by its real path, or null when the
     * page may not be given one. Absent, no file outside every root has an address.
     */
    library?(real: string): string | null;
};

/** The address without its `#fragment`, and the fragment with its `#` or the empty string. */
function splitFragment(uri: string): [string, string] {
    const at = uri.indexOf('#');
    return at < 0 ? [uri, ''] : [uri.slice(0, at), uri.slice(at)];
}

/**
 * The page URI of a server's `file://` URI: the address the page opened it under, its address under
 * a served root, or its library address; null for a file the page has no address for.
 */
function toPageUri(uri: string, mapper: Mapper): string | null {
    const [bare, fragment] = splitFragment(uri);
    const page = toPageBare(bare, mapper);
    return page === null ? null : page + fragment;
}

/** The page URI of a server's `file://` URI that has no fragment. */
function toPageBare(uri: string, mapper: Mapper): string | null {
    const real = realOfFileUri(uri);
    if (real === null) return null;
    const known = mapper.opened(real);
    // A library file is given by the mapper, which keeps one address per server that named it.
    if (known !== undefined && !isLibraryAddress(known)) return known;
    const root = innermost(real, mapper.roots);
    if (root === null) return mapper.library?.(real) ?? null;
    const under = relative(normal(root.real), normal(real));
    if (under === '' || under.startsWith('..')) return null;
    return pageUri(mapper.alias(root), under.split(sep).join('/'));
}

/** The fields of a message that hold the address of a document. */
const URI_FIELDS: readonly string[] = ['uri', 'targetUri', 'oldUri', 'newUri'];

/**
 * The field clangd's commands carry a document's address in (`arguments[0].file`). It is turned
 * only when the value is an address of the form being turned, since a `file` field of any other
 * message is a plain name.
 */
const FILE_FIELD = 'file';

/** The field of a document link that holds the address it leads to. */
const LINK_FIELD = 'target';

/** The scheme the server's `file://` addresses have as the record of an address spells it. */
const SERVER_SCHEME = 'file';

/** A record that spells an address (`{ scheme, path }`), in the scheme the record is for. */
function spelledIn(value: unknown, scheme: string): value is Record<string, unknown> {
    return isRecord(value) && value.scheme === scheme && typeof value.path === 'string';
}

/** A value that stands for a location the page cannot be given, dropped with what holds it. */
const DROP = Symbol('dropped');

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Whether a string is in the form of a page's address of a document, of a file or a library. */
function isPageAddress(value: string): boolean {
    return value.startsWith(PAGE_SCHEME) || isLibraryAddress(value);
}

/**
 * A message for a server, every address in it turned into the real `file://` URI of its file, or
 * null when any address does not resolve (the whole message is then refused). A page URI resolves
 * against the roots; a library address resolves through `library`, which answers the `file://`
 * URI of a library file the page holds an address for and null for any other, and without it no
 * library address resolves.
 */
export function toServer(
    value: unknown,
    roots: readonly ServedRoot[],
    library?: (address: string) => string | null
): { value: unknown } | null {
    const outcome = { refused: false };
    const address = (uri: unknown): string => {
        const [bare, fragment] = typeof uri === 'string' ? splitFragment(uri) : [uri, ''];
        const resolved = isLibraryAddress(bare)
            ? (library?.(bare) ?? null)
            : (resolvePageUri(bare, roots)?.fileUri ?? null);
        if (resolved === null) {
            outcome.refused = true;
            return '';
        }
        return resolved + fragment;
    };
    /** A record spelling a page address, as the server spells it. */
    const spelledForServer = (item: Record<string, unknown>): Record<string, unknown> => {
        const real = realOfFileUri(address(`${PAGE_SCHEME}//${String(item.path)}`));
        const copy: Record<string, unknown> = { ...item, scheme: SERVER_SCHEME, path: real ?? '' };
        if (typeof item.external === 'string') copy.external = address(item.external);
        if (typeof item.fsPath === 'string') copy.fsPath = real ?? '';
        return copy;
    };

    const walk = (item: unknown): unknown => {
        if (Array.isArray(item)) return item.map(walk);
        if (!isRecord(item)) return item;
        if (spelledIn(item, PAGE_NAME)) return spelledForServer(item);
        const copy: Record<string, unknown> = {};
        for (const [key, inner] of Object.entries(item)) {
            if (URI_FIELDS.includes(key) && typeof inner === 'string') copy[key] = address(inner);
            else if (key === FILE_FIELD && typeof inner === 'string' && isPageAddress(inner)) {
                copy[key] = address(inner);
            } else if (key === 'arguments' && Array.isArray(inner)) {
                copy[key] = inner.map((one) =>
                    typeof one === 'string' && isPageAddress(one) ? address(one) : walk(one)
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
 * turned into the page's form. A location the mapper gives no address for is dropped, with the
 * list entry, command or workspace edit that holds it: the result is null when the dropped
 * location was the whole answer. A command whose `arguments` name such a file is dropped whole,
 * since its arguments are positional, and so is a workspace edit whose `changes` or
 * `documentChanges` name one, since part of an edit would be applied without the rest.
 */
export function toPage(value: unknown, mapper: Mapper): { value: unknown } | null {
    // clangd answers `textDocument/switchSourceHeader` with the file's address alone.
    if (typeof value === 'string' && value.startsWith('file://')) {
        const page = toPageUri(value, mapper);
        return page === null ? null : { value: page };
    }
    /** A record spelling a server address, as the page spells it; DROP for one it has none for. */
    const spelledForPage = (item: Record<string, unknown>): Record<string, unknown> | symbol => {
        const page = toPageUri(pathToFileURL(String(item.path)).href, mapper);
        if (page === null) return DROP;
        const path = page.slice(PAGE_SCHEME.length + 2);
        const copy: Record<string, unknown> = { ...item, scheme: PAGE_NAME, path };
        if (typeof item.external === 'string') copy.external = page;
        if (typeof item.fsPath === 'string') copy.fsPath = path;
        return copy;
    };
    const walk = (item: unknown): unknown => {
        if (Array.isArray(item)) {
            return item.map(walk).filter((one) => one !== DROP);
        }
        if (!isRecord(item)) return item;
        if (spelledIn(item, SERVER_SCHEME)) return spelledForPage(item);
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
                const turned: unknown[] = [];
                for (const one of inner) {
                    const named = typeof one === 'string' && one.startsWith('file://');
                    const page = named ? toPageUri(one, mapper) : walk(one);
                    if (page === DROP || (named && page === null)) return DROP;
                    turned.push(page);
                }
                copy[key] = turned;
            } else if (key === 'documentChanges' && Array.isArray(inner)) {
                const entries = inner.map(walk);
                if (entries.includes(DROP)) return DROP;
                copy[key] = entries;
            } else if (key === 'changes' && isRecord(inner)) {
                const changes: Record<string, unknown> = {};
                for (const [uri, edits] of Object.entries(inner)) {
                    const page = uri.startsWith('file://') ? toPageUri(uri, mapper) : uri;
                    if (page === null) return DROP;
                    changes[page] = walk(edits);
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
