// Layer 3, view partial. What the History view draws one recorded change as: the filter it is
// matched against, and the two values shown beside it.
//
// It is a fold and reads nothing: the store holds the rows and this says what they look like, so a
// case states a row and asserts a line without a fetch.

import { t } from '$lib/state/words/text';
import type { Change } from '$lib/state/sessions/changes.svelte';

/**
 * One recorded value as the view shows it. A scalar is shown whole and carries no size; a list or a
 * map carries the number of things in it and its text goes under a disclosure, since a row showing a
 * whole entry would be taller than the twenty rows around it.
 */
export type Shown = {
    /** The value as text: the scalar itself, or the list or map as indented JSON. */
    text: string;
    /** How many things a list or a map holds; zero for a scalar and for an empty value. */
    size: number;
    /** True when there was no value at all: a field that was not set, an entry that was not there. */
    empty: boolean;
};

/** One recorded value as the view shows it. */
export function shown(value: unknown): Shown {
    if (value === null || value === undefined || value === '') {
        return { text: '', size: 0, empty: true };
    }
    if (Array.isArray(value)) {
        return { text: JSON.stringify(value, null, 2), size: value.length, empty: false };
    }
    if (typeof value === 'object') {
        return {
            text: JSON.stringify(value, null, 2),
            size: Object.keys(value).length,
            empty: false
        };
    }
    if (typeof value === 'string') return { text: value, size: 0, empty: false };
    if (typeof value === 'number' || typeof value === 'boolean') {
        return { text: String(value), size: 0, empty: false };
    }
    // Nothing a writer records is a symbol or a function; a value that is one says nothing rather
    // than being stringified into a word no reader could act on.
    return { text: '', size: 0, empty: true };
}

/** The words one row is matched against: the file it wrote, what it addressed, and the field. */
export function haystack(row: Change): string {
    return `${row.file} ${row.key} ${row.field}`.toLowerCase();
}

/** The rows a filter leaves, in the order they were given. An empty filter leaves every row. */
export function matching(rows: Change[], filter: string): Change[] {
    const wanted = filter.trim().toLowerCase();
    if (wanted === '') return rows;
    return rows.filter((row) => haystack(row).includes(wanted));
}

/** The filter one instance of the view is holding, out of whatever its saved state is. */
export function filterOf(state: unknown): string {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
    const held = (state as Record<string, unknown>).filter;
    return typeof held === 'string' ? held : '';
}

/** What one undo answered, as much of it as this fold reads. */
export type UndoAnswer = {
    ok: boolean;
    changed: string[];
    /** The fields the writer would not take, which a write that still changed something carries. */
    refused?: { field: string; reason: string }[];
    error?: string;
};

/**
 * Whether an undo put the value back, and the sentence the status region says about it.
 *
 * An answer that named no field wrote none of them, whatever its status was: the writer may refuse
 * a value the file will not take, and an undo that normalises back to what is already there writes
 * no byte. Either way the value is not back, so the row never says it is. A write that changed
 * something and still refused a field is back in part, and the sentence says how many fields it
 * left out rather than that the value is back whole.
 */
export function undoSaid(answer: UndoAnswer, name: string): { undone: boolean; said: string } {
    if (answer.ok && answer.changed.length > 0) {
        const left = answer.refused?.length ?? 0;
        if (left > 0) return { undone: true, said: t('history.undone_partly', name, left) };
        return { undone: true, said: t('history.undone', name) };
    }
    const word = answer.ok ? 'refused' : (answer.error ?? '');
    return { undone: false, said: sentenceFor(word) };
}

/** The sentence for what the endpoint answered, never its own word. */
export function sentenceFor(word: string): string {
    if (word === 'moved') return t('history.moved');
    if (word === 'gone') return t('history.gone');
    if (word === 'unknown') return t('history.unknown');
    if (word === 'nothing') return t('history.nothing');
    if (word === 'refused') return t('history.refused_write');
    return t('history.refused', word);
}
