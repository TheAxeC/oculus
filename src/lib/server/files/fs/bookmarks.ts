// Layer 2, server. The reader's own bookmarks: a collection file in the hub's own shape, kept
// outside the hub at ~/.oculus/bookmarks.yml because it is this machine's and not the portfolio's.
//
// It is a collection file and not a JSON store so that the write path that edits every other
// collection edits this one too: the same schema, the same entry form, the same field-by-field
// surgery that keeps the reader's own comments and spacing. The write path reaches it by the key
// `bookmarks`, which server/edit/writes/entries.ts resolves to this file instead of asking
// sources.yml for one inside the hub.
//
// A file this machine has not got yet carries its title and its schema and no `entries:` key at
// all. YAML writes no empty block list: `entries: []` is a flow list, which every later append
// refuses, so the key is absent until the first bookmark and startEntries() writes it with that
// bookmark under it.
//
// A read of a file that is not there answers the scaffold's own schema rather than none, so the
// form that adds the first bookmark has its controls before anything has been written; the file
// itself is still made by that first write and by nothing else.
//
// Nothing here holds state between calls; the path comes in from the caller, so two servers in one
// process read two files.

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { isMap } from '../../../data/helpers/guards.ts';
import { collectionSchema } from '../../../data/snapshot/normalise.ts';
import type { Entry, SchemaField } from '../../../data/model/index.ts';
import { writeTextAtomic } from '../../core/json.ts';

/** The collection key the write path resolves to the reader's own file. */
export const BOOKMARKS = 'bookmarks';

/** The field a bookmark is addressed by, which is the first field of the scaffold's schema. */
export const BOOKMARK_IDENTITY = 'label';

/** ~/.oculus/bookmarks.yml, resolved at the call rather than at import. */
export function defaultBookmarksPath(): string {
    return join(homedir(), '.oculus', 'bookmarks.yml');
}

/**
 * The file a machine with no bookmarks is given. The schema is what the entry form draws: a label
 * the entry is found by, the root key the file sits under, and the path inside that root. The root
 * is a select with no options of its own, so the page supplies the roots in force and a root added
 * after the file was written is still one a bookmark may name.
 */
const SCAFFOLD = [
    '# The bookmarks of this machine, written by oculus from the Files view.',
    '# Each entry is a file under one of the roots the file browser serves.',
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
 * The schema of the file that has not been written yet, read out of the scaffold itself so the form
 * a reader sees before their first bookmark and the file that first bookmark makes are the one
 * shape.
 */
function scaffoldSchema(): SchemaField[] {
    return collectionSchema((parse(SCAFFOLD) as { schema?: unknown }).schema) ?? [];
}

/** What a GET for the bookmarks answers: the entries as the form edits them, and their schema. */
export type BookmarksAnswer = { entries: Entry[]; schema: SchemaField[] };

/** One entry of the file as the page reads it, or null for an item that is not a map. */
function bookmark(item: unknown, file: string, index: number): Entry | null {
    if (!isMap(item)) return null;
    const held = item[BOOKMARK_IDENTITY];
    if (typeof held !== 'string' && typeof held !== 'number') return null;
    const label = String(held);
    if (label === '') return null;
    return { id: label, title: label, fields: { ...item }, file, index };
}

/**
 * The bookmarks of one file. A missing, unreadable or unparseable file reads as no bookmarks, which
 * is what a machine that has never written one has; the schema is the file's own, so a reader who
 * added a field of their own sees a control for it, and the scaffold's for a file that names none.
 */
export function readBookmarks(file: string): BookmarksAnswer {
    let data: unknown;
    try {
        data = parse(readFileSync(file, 'utf8'));
    } catch {
        return { entries: [], schema: scaffoldSchema() };
    }
    if (!isMap(data)) return { entries: [], schema: scaffoldSchema() };
    const items = Array.isArray(data.entries) ? data.entries : [];
    const entries: Entry[] = [];
    for (const [index, item] of items.entries()) {
        const one = bookmark(item, file, index);
        if (one !== null) entries.push(one);
    }
    return { entries, schema: collectionSchema(data.schema) ?? scaffoldSchema() };
}
