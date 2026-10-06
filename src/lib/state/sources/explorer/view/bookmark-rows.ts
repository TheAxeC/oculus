// Layer 2, client state, pure. The reader's bookmarks as the file browser and the rail read them: a
// bookmark is `{ root, path }` in ~/.oculus/bookmarks.yml and names a file or a folder, and these
// functions turn the entries into the row keys the tree draws its stars from, the rows the rail's
// Bookmarks menu draws, the label a new bookmark is filed under and the schema its form draws.

import { z } from 'zod';
import { readAs } from '../../../../data/shapes/shapes.ts';
import { typeOfFile } from '../file-type.ts';
import { treeKey, type RowRef } from './place.ts';

/** A row a bookmark's fields name: a root key and a path, each a text. */
const refShape = z.object({ root: z.string(), path: z.string() });

/** The root and path of a bookmark that names something: neither is empty. */
const namedRefShape = z.object({ root: z.string().min(1), path: z.string().min(1) });

/**
 * What a bookmark names, read from a stat of its path under its root: a file, a folder, or nothing
 * (the path is gone).
 */
export type BookmarkKind = 'file' | 'folder' | 'missing';

/**
 * The row keys the reader's own bookmarks name, which the tree draws its star from. An entry whose
 * root or path is not a string names no row.
 */
export function markedKeys(entries: { fields: Record<string, unknown> }[]): string[] {
    return entries.flatMap((one) => {
        const row = readAs(refShape, one.fields);
        return row === null ? [] : [treeKey(row.root, row.path)];
    });
}

/** The root and the path a bookmark's fields name, or null when either is not a text. */
export function bookmarkRef(fields: Record<string, unknown>): RowRef | null {
    return readAs(refShape, fields);
}

/**
 * One choice of the rail's Bookmarks menu: a file or a folder under one of the roots of
 * sources.yml, from the reader's own bookmarks file, which the Files view edits.
 *
 * `view` is which view opens it. A page is a document of its own so that its stylesheets and
 * relative assets resolve, a folder is shown in the Files view, and anything else is the file view;
 * which is which is a question about what the bookmark names, so `bookmarkRows` in this module sets
 * it and the page hands the rows to the rail. `kind` is set for a folder and for a path that is
 * gone, so the rail draws a folder with the folder's icon and a path that is gone as gone; a file
 * has none.
 */
export type BookmarkRow = {
    label: string;
    root: string;
    path: string;
    view: 'document' | 'file' | 'files' | 'source';
    kind?: Exclude<BookmarkKind, 'file'>;
};

/**
 * The bookmarks the rail draws: one row per entry whose root and path are both filled texts, in
 * the order the file holds them. An entry with either missing names nothing and is left out. A
 * folder opens in the Files view, a file in an apps folder (`holds`) opens as source text, a path
 * that is a page opens in the document view and any other in the file view. An entry the read gave
 * no kind is a file.
 */
export function bookmarkRows(
    entries: { title: string; fields: Record<string, unknown>; kind?: BookmarkKind }[],
    holds: (root: string, path: string) => boolean = () => false
): BookmarkRow[] {
    return entries.flatMap((entry) => {
        const ref = readAs(namedRefShape, entry.fields);
        if (ref === null) return [];
        const kind = entry.kind ?? 'file';
        const page = typeOfFile(ref.path).kind === 'html';
        const view =
            kind === 'folder'
                ? 'files'
                : holds(ref.root, ref.path)
                  ? 'source'
                  : page
                    ? 'document'
                    : 'file';
        return [
            {
                label: entry.title,
                root: ref.root,
                path: ref.path,
                view,
                ...(kind === 'file' ? {} : { kind })
            }
        ];
    });
}

/**
 * The bookmarks schema the entry form draws, with the roots of the workspace in force as the
 * choices of its root field. The file's own schema names the field and its type; which roots there
 * are is the reader's workspace and changes under it, so it is supplied here rather than written
 * into the file, where a root added later would not be one a bookmark could name.
 */
export function markSchemaFor<T extends { field: string }>(
    schema: T[],
    roots: { key: string }[]
): (T & { options?: string[] })[] {
    return schema.map((field) =>
        field.field === 'root' ? { ...field, options: roots.map((one) => one.key) } : field
    );
}

/**
 * The label a file or folder is bookmarked under from the tree: its own name, or its path under the
 * root when another bookmark already carries that name, since the label is what a bookmark is found
 * by.
 */
export function markLabel(row: RowRef & { name: string }, labels: string[]): string {
    return labels.includes(row.name) ? row.path : row.name;
}
