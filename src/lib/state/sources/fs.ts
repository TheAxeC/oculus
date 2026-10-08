// Layer 2, client state. The pure half of the file browser: what the tree draws. It is split by
// what each part answers, under state/sources/explorer/, and this module is the one name the rest
// of the page imports it by.
//
//   view/place.ts           the vocabulary: roots, entries, rows, their keys and parents
//   view/files-view.ts      the record one tab keeps about itself, and the functions that write it
//   view/forms.ts           the root and workspace line forms and their typed text
//   view/reveal.ts          showing one path in the tree
//   view/bookmark-rows.ts   the reader's bookmarks as tree stars and as the rail's rows
//   view/tab-roots.ts       which roots and folder a following or a rooted tab draws
//   view/card-tree.ts       the key a project card keeps its tree's record under
//   rows/                   the rows of the tree: nesting, compaction, decorations, the filter
//   acts/                   what a press, a key or a drop does to rows: selection, keys, drops,
//                           the folder panel's answer, which log record Cmd+Z takes back
//   sections/               the Open Editors, Outline and Timeline sections under the tree
//
// The modules of acts/ and sections/ are imported by their own paths.
//
// What a name says about a file is state/sources/explorer/file-type.ts's, exported from here with
// the rest of the browser.

export { opensInProgram } from '../../data/helpers/files/opens-in-program.ts';
export type { LanguageMap } from '../../data/helpers/files/languages.ts';
export {
    extensionOf,
    languageOf,
    languages,
    markdownPreviewState,
    MARKDOWN_PREVIEW_VIEW,
    nameOf,
    typeOfFile,
    type FileKind,
    type FileType
} from './explorer/file-type.ts';
export * from './explorer/view/place.ts';
export * from './explorer/view/forms.ts';
export * from './explorer/view/files-view.ts';
export * from './explorer/view/reveal.ts';
export * from './explorer/view/bookmark-rows.ts';
export * from './explorer/view/tab-roots.ts';
export * from './explorer/view/card-tree.ts';
export * from './explorer/rows/compact.ts';
export * from './explorer/rows/decorations.ts';
export * from './explorer/rows/filter.ts';
export * from './explorer/rows/nesting.ts';
export * from './explorer/rows/tree-rows.ts';
import { TEXT_LIMIT } from '../../data/file-ops.ts';

/**
 * The largest text a code window draws, which is data/file-ops.ts's. A longer file is cut here and
 * the view says so.
 */
export { TEXT_LIMIT };

/**
 * The workspaces a reader picks among, in their order: the configured roots first, which have no
 * name, then every saved workspace by its name.
 */
export function workspaceChoices(names: string[]): string[] {
    return ['', ...names.filter((name) => name !== '')];
}
