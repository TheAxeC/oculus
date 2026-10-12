// Layer 2, server. The reader's own bookmarks: a collection file in the hub's own shape, kept in
// the hub's own `.oculus` folder, bookmarks.yml, which the portfolio does not build from.
//
// It is a collection file and not a JSON store so that the write path that edits every other
// collection edits this one too: the same schema, the same field-by-field surgery that keeps the
// reader's own comments and spacing. The write path reaches it by the key
// `bookmarks`, which server/files/fs/collections.ts resolves to this file instead of asking
// sources.yml for one inside the hub.
//
// A file this machine has not got yet carries its title and its schema and no `entries:` key at
// all. YAML writes no empty block list: `entries: []` is a flow list, which every later append
// refuses, so the key is absent until the first bookmark and startEntries() writes it with that
// bookmark under it.
//
// A read of a file that is not there answers no bookmarks; the file itself is made by the first
// write and by nothing else.
//
// Nothing here holds state between calls; the path comes in from the caller, so two servers in one
// process read two files.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import type { Entry } from '../../../data/model/index.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { resolveRootPath, type Root } from '../files.ts';
import { anyNumberShape, mapShape } from '../../../data/shapes/shapes.ts';

/** The collection key the write path resolves to the reader's own file. */
export const BOOKMARKS = 'bookmarks';

/** The field a bookmark is addressed by, which is the first field of the scaffold's schema. */
export const BOOKMARK_IDENTITY = 'label';

/**
 * The file a machine with no bookmarks is given. The schema types a bookmark for the writers: a
 * label the entry is found by, the root key the file sits under, and the path inside that root,
 * which an entry naming the root's top leaves out. The root is a select with no options of its own,
 * so a bookmark may name a root added after the file was written.
 */
const SCAFFOLD = [
    "# The hub's bookmarks, written by oculus from the Files view.",
    '# Each entry is a file, a folder or the top of one of the roots the file browser serves.',
    'title: Bookmarks',
    '',
    'schema:',
    '  - { field: label, type: text, label: Label, required: true }',
    '  - { field: root, type: select, label: Root }',
    '  - { field: path, type: text, label: Path }',
    ''
].join('\n');

/**
 * Write the scaffold for a machine that has no bookmarks file yet. An existing file is left alone.
 */
export function ensureBookmarksFile(file: string): void {
    if (existsSync(file)) return;
    writeTextAtomic(file, SCAFFOLD);
}

/**
 * What a bookmark names now: a file, a folder (a root's top is one), or nothing, because the path
 * or the root is gone.
 */
export type BookmarkKind = 'file' | 'folder' | 'missing';

/** One bookmark as the page reads it: the entry, and what its root and path name now. */
export type BookmarkEntry = Entry & { kind: BookmarkKind };

/** An item of the file's `entries:` list that is a map, answered as the file holds it. */
const bookmarkItemShape = mapShape;

/** What a bookmark is found by: a label of text or a number, written out as text. */
const bookmarkLabelShape = z.union([z.string(), anyNumberShape]).transform(String);

/** What a GET for the bookmarks answers: the entries as the Files view lists them. */
export type BookmarksAnswer = { entries: BookmarkEntry[] };

/** The part of the file this module reads: the `entries:` list, empty when it is odd. */
const bookmarksFileShape = z.object({ entries: z.array(z.unknown()).catch(() => []) });

/**
 * One entry of the file as the page reads it, or null for an item that is not a map. An entry with
 * no `path` line names its root's top, which the page reads as the empty path so that every reader
 * of an entry sees one shape.
 */
function bookmark(item: unknown, file: string, index: number): Entry | null {
    const held = bookmarkItemShape.safeParse(item);
    if (!held.success) return null;
    const named = bookmarkLabelShape.safeParse(held.data[BOOKMARK_IDENTITY]);
    if (!named.success || named.data === '') return null;
    return { id: named.data, title: named.data, fields: { path: '', ...held.data }, file, index };
}

/**
 * What a bookmark's root and path name now, from a stat under the root. The empty path is the
 * root's own folder. A root that is not served, a path outside it and a path that is not there are
 * all `missing`.
 */
export function bookmarkKind(roots: Root[], entry: Entry): BookmarkKind {
    const root = entry.fields.root;
    const path = entry.fields.path;
    if (typeof root !== 'string' || typeof path !== 'string') return 'missing';
    const found = resolveRootPath(roots, root, path);
    if ('error' in found) return 'missing';
    try {
        return statSync(found.path).isDirectory() ? 'folder' : 'file';
    } catch {
        return 'missing';
    }
}

/**
 * The bookmarks of one file. A missing, unreadable or unparseable file reads as no bookmarks, which
 * is what a machine that has never written one has.
 */
export function readBookmarks(file: string, roots: Root[] = []): BookmarksAnswer {
    let data: unknown;
    try {
        data = parse(readFileSync(file, 'utf8'));
    } catch {
        return { entries: [] };
    }
    const held = bookmarksFileShape.safeParse(data);
    if (!held.success) return { entries: [] };
    const entries: BookmarkEntry[] = [];
    for (const [index, item] of held.data.entries.entries()) {
        const one = bookmark(item, file, index);
        if (one !== null) entries.push({ ...one, kind: bookmarkKind(roots, one) });
    }
    return { entries };
}
