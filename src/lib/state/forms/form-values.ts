// Layer 2, client state. The two rules an entry form's values follow, kept once: how a value of an
// entry is held by the control drawn for its field, and what a control's value is as the save sees
// it.
//
// The form draws and saves through them, and the form drafts decide through the same two whether a
// typed value is unsaved work, so a value the save would write unchanged (a space at the end, an
// empty metalist row, "a,b" over "a, b" in a tags field, a raw field's JSON spaced differently) is
// never counted as unsaved.
//
// A parsed value is taken for a map by data/shapes/shapes.ts's `mapShape`, and the rows of a
// metalist are read through `metaRowShape`.

import { z } from 'zod';
import { mapShape, readAs, rowsShape, textOrNumberShape } from '../../data/shapes/shapes.ts';

/** Anything YAML writes under a raw block: a scalar, a list of them, or a map of them. */
export type RawFieldValue =
    string | number | boolean | null | RawFieldValue[] | { [key: string]: RawFieldValue };

export type RawFieldAnswer =
    { ok: true; value: Record<string, RawFieldValue> | null } | { ok: false };

/** A raw block as the one-line JSON text the textarea edits, nested lists and maps included. */
export function rawFieldText(value: unknown): string {
    const map = readAs(mapShape, value);
    return map === null ? '' : JSON.stringify(map);
}

/** Whether a parsed JSON value is one YAML can write: a scalar, or a list or map of such. */
function isRawValue(value: unknown): value is RawFieldValue {
    if (value === null) return true;
    const kind = typeof value;
    if (kind === 'string' || kind === 'number' || kind === 'boolean') return true;
    if (Array.isArray(value)) return value.every(isRawValue);
    if (kind !== 'object') return false;
    return Object.values(value as Record<string, unknown>).every(isRawValue);
}

/**
 * Parse raw JSON only when it is a map. A value inside it may be a scalar, a list or a nested map,
 * which is what a real block holds: a dataset's `retrieval:` carries a `priority_first:` list, and
 * a parser that took scalars alone left the whole block uneditable.
 */
export function parseRawField(text: string): RawFieldAnswer {
    if (text.trim() === '') return { ok: true, value: null };
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return { ok: false };
    }
    const map = readAs(mapShape, parsed);
    if (map === null || !isRawValue(map)) return { ok: false };
    return { ok: true, value: map };
}

/** One row of a `metalist` control: a label and a value the file saves as one flat map. */
export type MetaRow = { label: string; value: string };

/** One row of a metalist as the control holds it: a part that is no text is the empty text. */
const metaRowShape = z.object({
    label: z.string().catch(''),
    value: z.string().catch('')
}) satisfies z.ZodType<MetaRow>;

/** The rows of a metalist: the ones that are maps, as `metaRowShape` reads them. */
const metaRowsShape = rowsShape(metaRowShape);

/** The words of a tags value: the string items of a list, a new list. */
const wordsShape = rowsShape(z.string());

/** What one control of the form holds: a line of text, a tick, or the rows of a metalist. */
export type FormValue = string | boolean | MetaRow[];

/**
 * One control's value as the save sees it: a tick, trimmed text, the words of a tags line, or rows.
 */
export type SavedValue = boolean | string | string[] | MetaRow[];

/** One value of an entry as the control for its field holds it: a list is a line of commas. */
export function controlValue(value: unknown, kind: string): FormValue {
    if (kind === 'checkbox') return value === true;
    if (kind === 'metalist') {
        const rows = readAs(metaRowsShape, value);
        if (rows !== null) return rows;
    }
    if (kind === 'raw') return rawFieldText(value);
    const words = readAs(wordsShape, value);
    if (words !== null) return words.join(', ');
    return readAs(textOrNumberShape, value) ?? '';
}

/**
 * One control's value as the save writes it. Text is trimmed; a tags line is its comma-separated
 * words, each trimmed, the empty ones dropped; a metalist is its rows trimmed, a row with nothing
 * in either half dropped; a checkbox is whether it is ticked. What an empty result is written as
 * (no key, or an empty string) is the save's own choice and not decided here.
 */
export function savedValue(value: FormValue, kind: string): SavedValue {
    if (kind === 'checkbox') return value === true;
    if (kind === 'metalist') {
        const rows = Array.isArray(value) ? value : [];
        return rows
            .map((row) => ({ label: row.label.trim(), value: row.value.trim() }))
            .filter((row) => row.label !== '' || row.value !== '');
    }
    const text = typeof value === 'string' ? value.trim() : '';
    if (kind !== 'tags') return text;
    return text
        .split(',')
        .map((one) => one.trim())
        .filter((one) => one !== '');
}

/** Whether two control values of one field would be saved as the same value. */
export function sameSaved(one: FormValue, other: FormValue, kind: string): boolean {
    if (kind === 'raw') {
        const a = parseRawField(typeof one === 'string' ? one : '');
        const b = parseRawField(typeof other === 'string' ? other : '');
        if (a.ok && b.ok) return JSON.stringify(a.value) === JSON.stringify(b.value);
    }
    return JSON.stringify(savedValue(one, kind)) === JSON.stringify(savedValue(other, kind));
}
