// Layer 3, view partial. What the History view draws one recorded change as: the two values shown
// beside it and the sentence an undo is said in. Which rows a filter keeps is
// state/sessions/changes.svelte.ts's.
//
// It is a fold and reads nothing: the store holds the rows and this says what they look like, so a
// case states a row and asserts a line without a fetch.

import { stampPaths } from '$lib/state/sources/explorer/acts/undo';
import { t } from '$lib/state/shared/words/text';

export { sentenceFor, undoSaid, type UndoAnswer } from '$lib/views/shared/writes/undo-said';

/**
 * One recorded value as the view shows it. A scalar is shown whole and carries no size; a list or a
 * map carries the number of things in it and its text goes under a disclosure, since a row showing
 * a whole entry would be taller than the twenty rows around it.
 */
export type Shown = {
    /** The value as text: the scalar itself, or the list or map as indented JSON. */
    text: string;
    /** How many things a list or a map holds; zero for a scalar and for an empty value. */
    size: number;
    /**
     * True when there was no value at all: a field that was not set, an entry that was not there,
     * or a list or a map that holds nothing.
     */
    empty: boolean;
};

/** One recorded value as the view shows it. */
export function shown(value: unknown): Shown {
    if (value === null || value === undefined || value === '') {
        return { text: '', size: 0, empty: true };
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return { text: '', size: 0, empty: true };
        return { text: JSON.stringify(value, null, 2), size: value.length, empty: false };
    }
    if (typeof value === 'object') {
        const size = Object.keys(value).length;
        if (size === 0) return { text: '', size: 0, empty: true };
        return { text: JSON.stringify(value, null, 2), size, empty: false };
    }
    if (typeof value === 'string') return { text: value, size: 0, empty: false };
    if (typeof value === 'number' || typeof value === 'boolean') {
        return { text: String(value), size: 0, empty: false };
    }
    // Nothing a writer records is a symbol or a function; a value that is one says nothing rather
    // than being stringified into a word no reader could act on.
    return { text: '', size: 0, empty: true };
}

/** The `kind` the change log files a file operation under. */
export const FILE_RECORD = 'files';

/** The `kind` the change log files a write of an app's store under. */
export const STORE_RECORD = 'app-store';

/** The size of a store a store record names, as the number of bytes. */
export function shownBytes(size: unknown): Shown {
    if (typeof size !== 'number') return { text: '', size: 0, empty: true };
    const text = size === 1 ? t('history.bytes_one') : t('history.bytes', String(size));
    return { text, size: 0, empty: false };
}

/**
 * The word an operation of a file record is called: VS Code's own name for it. A replace and an
 * edit of a language server say in how many files they wrote, which is the number of files their
 * record names after the change.
 */
export function fileOperation(field: string, after: unknown): string {
    if (field === 'create') return t('history.file_create');
    if (field === 'rename') return t('history.file_rename');
    if (field === 'move') return t('history.file_move');
    if (field === 'copy') return t('history.file_copy');
    if (field === 'upload') return t('history.file_upload');
    if (field === 'add-configuration') return t('history.file_add_configuration');
    if (field === 'write-file') return t('history.file_write_file');
    if (field === 'trash') return t('history.file_trash');
    if (field === 'delete') return t('history.file_delete');
    if (field === 'replace') {
        const files = stampPaths(after).length;
        return files === 1
            ? t('history.file_replace_one')
            : t('history.file_replace', String(files));
    }
    if (field === 'lsp-edit') {
        const files = stampPaths(after).length;
        return files === 1
            ? t('history.file_lsp_edit_one')
            : t('history.file_lsp_edit', String(files));
    }
    if (field === 'writing-fix') {
        const files = stampPaths(after).length;
        return files === 1
            ? t('history.file_writing_fix_one')
            : t('history.file_writing_fix', String(files));
    }
    return field;
}

/**
 * The paths a file record's side names, as the view shows them: none is empty, one is a scalar,
 * and more are a list under a disclosure with a path to a line.
 */
export function shownPaths(stamps: unknown): Shown {
    const paths = stampPaths(stamps);
    if (paths.length === 0) return { text: '', size: 0, empty: true };
    if (paths.length === 1) return { text: paths[0], size: 0, empty: false };
    return { text: paths.join('\n'), size: paths.length, empty: false };
}
