// Layer 2, client state, pure. The reader's bookmarks as the file browser and the rail read them: a
// bookmark is `{ root, path }` in bookmarks.yml of the hub's .oculus folder and names a file, a
// folder, or a root's top (an empty path), and these functions turn the entries into the row keys
// the tree draws its stars from, the rows the rail's Bookmarks menu draws and the label a new
// bookmark is filed under.

import { z } from 'zod';
import { readAs } from '../../../../data/shapes/shapes.ts';
import { typeOfFile } from '../file-type.ts';
import { treeKey, type RowRef } from './place.ts';

/** A row a bookmark's fields name: a root key and a path, each a text. */
const refShape = z.object({ root: z.string(), path: z.string() });

/**
 * The root and path of a bookmark that names something: the root is a key, and the path is the
 * empty text for a root's top.
 */
const namedRefShape = z.object({ root: z.string().min(1), path: z.string() });

/**
 * What a bookmark names, read from a stat of its path under its root: a file, a folder (a root's
 * top included), or nothing (the path or the root is gone).
 */
export type BookmarkKind = 'file' | 'folder' | 'missing';

/**
 * The row keys the reader's own bookmarks name, which the tree draws its star from. An entry whose
 * root or path is not a string names no row; a root's top is the key of the root's own row.
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
 * One choice of the rail's Bookmarks menu: a file, a folder or the top of one of the roots of
 * sources.yml, from the reader's own bookmarks file, which the Files view edits.
 *
 * `view` is which view opens it. A page is a document of its own so that its stylesheets and
 * relative assets resolve, a folder and a root's top are shown in the Files view, and anything else
 * is the file view; which is which is a question about what the bookmark names, so `bookmarkRows`
 * in this module sets it and the page hands the rows to the rail. `kind` is set for a folder and
 * for a path that is gone, so the rail draws a folder with the folder's icon and a path that is
 * gone as gone; a file has none.
 */
export type BookmarkRow = {
    label: string;
    root: string;
    path: string;
    view: 'document' | 'editor' | 'file' | 'files' | 'source';
    /** The custom editor of an app the file opens in, for the view `editor`. */
    editor?: { app: string; viewType: string };
    kind?: Exclude<BookmarkKind, 'file'>;
};

/**
 * The bookmarks the rail draws: one row per entry whose root is a filled text and whose path is a
 * text, in the order the file holds them. An entry with either missing names nothing and is left
 * out. A folder and a root's top (the empty path) open in the Files view, a file in an apps folder
 * (`holds`) opens as source text, a file a `default` custom editor matches (`editorFor`) opens in
 * that editor, a path that is a page opens in the document view and any other in the file view. An
 * entry the read gave no kind is a file.
 */
export function bookmarkRows(
    entries: { title: string; fields: Record<string, unknown>; kind?: BookmarkKind }[],
    opens: {
        holds: (root: string, path: string) => boolean;
        editorFor: (root: string, path: string) => { app: string; viewType: string } | null;
    } = { holds: () => false, editorFor: () => null }
): BookmarkRow[] {
    return entries.flatMap((entry) => {
        const ref = readAs(namedRefShape, entry.fields);
        if (ref === null) return [];
        const kind = entry.kind ?? 'file';
        const page = typeOfFile(ref.path).kind === 'html';
        const editor = kind === 'folder' ? null : opens.editorFor(ref.root, ref.path);
        const view =
            kind === 'folder' || ref.path === ''
                ? 'files'
                : opens.holds(ref.root, ref.path)
                  ? 'source'
                  : editor !== null
                    ? 'editor'
                    : page
                      ? 'document'
                      : 'file';
        return [
            {
                label: entry.title,
                root: ref.root,
                path: ref.path,
                view,
                ...(view === 'editor' && editor !== null ? { editor } : {}),
                ...(kind === 'file' ? {} : { kind })
            }
        ];
    });
}

/**
 * The label a file, folder or root is bookmarked under from the tree: its own name, or its path
 * under the root when another bookmark already carries that name, since the label is what a
 * bookmark is found by. A root's row has no path under the root, so its name is the label even
 * when another bookmark carries it, and the write is refused as a taken label.
 */
export function markLabel(row: RowRef & { name: string }, labels: string[]): string {
    return labels.includes(row.name) && row.path !== '' ? row.path : row.name;
}
