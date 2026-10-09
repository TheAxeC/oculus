// Layer 2, client state, pure. What the Refactor Preview view draws, computed from the pending
// preview: one row for each file (its name, its folder, how many of its edits are checked) with
// one row for each edit under it, the edit's line drawn as the text before the change, the text
// the change takes out and the text that replaces it, then the text after.

import { lineStarts } from '../../../../data/prose/text-edits.ts';
import type { Preview, PreviewFile } from './preview.svelte.ts';

/** One edit of a file. */
export type EditRow = {
    /** The edit's place among the file's edits. */
    index: number;
    /** The line of the edit, counted from one. */
    line: number;
    checked: boolean;
    /** The line's text up to the change, without its indentation. */
    before: string;
    /** The text the change takes out, on this line. */
    old: string;
    /** The text that replaces it, on one line. */
    added: string;
    /** The line's text after the change. */
    after: string;
};

/** One file of the preview. */
export type FileRow = {
    /** The file as `root/path`, which names it in the preview's checks. */
    name: string;
    root: string;
    path: string;
    /** The file's last path part. */
    base: string;
    /** The folders of the path, empty for a file at the root. */
    folder: string;
    /** True when every edit is checked, false when none is, null when some are. */
    checked: boolean | null;
    /** How many edits the file has. */
    count: number;
    edits: EditRow[];
};

/** The row of one edit of a file. */
function editRow(file: PreviewFile, at: number): EditRow {
    const { range, newText } = file.edits[at];
    const starts = lineStarts(file.text);
    const first = starts[range.start.line] ?? 0;
    const end = (starts[range.start.line + 1] ?? file.text.length + 1) - 1;
    const line = file.text.slice(first, end).replace(/\r$/, '');
    const lead = line.length - line.trimStart().length;
    const from = Math.max(range.start.character, lead);
    const to = range.end.line === range.start.line ? range.end.character : line.length;
    return {
        index: at,
        line: range.start.line + 1,
        checked: file.checked[at],
        before: line.slice(lead, from),
        old: line.slice(from, Math.max(from, to)),
        added: newText.replace(/\r?\n/g, ' '),
        after: line.slice(Math.max(from, to))
    };
}

/** The rows of the files of a preview, in the order the plan named them. */
export function rowsOf(preview: Preview): FileRow[] {
    return preview.files.map((file) => {
        const { root, path } = file.place;
        const cut = path.lastIndexOf('/');
        const checked = file.checked.filter(Boolean).length;
        return {
            name: file.name,
            root,
            path,
            base: cut < 0 ? path : path.slice(cut + 1),
            folder: cut < 0 ? '' : path.slice(0, cut),
            checked: checked === file.checked.length ? true : checked === 0 ? false : null,
            count: file.edits.length,
            edits: file.edits.map((_, at) => editRow(file, at))
        };
    });
}
