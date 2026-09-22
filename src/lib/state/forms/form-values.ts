// Layer 2, client state. The two rules an entry form's values follow, kept once: how a value of an
// entry is held by the control drawn for its field, and what a control's value is as the save sees
// it.
//
// The form draws and saves through them, and the form drafts decide through the same two whether a
// typed value is unsaved work, so a value the save would write unchanged (a space at the end, an
// empty metalist row, "a,b" over "a, b" in a tags field, a raw field's JSON spaced differently) is
// never counted as unsaved.

import { parseRawField, rawFieldText } from '../boards/collection.ts';

/** One row of a `metalist` control: a label and a value the file saves as one flat map. */
export type MetaRow = { label: string; value: string };

/** What one control of the form holds: a line of text, a tick, or the rows of a metalist. */
export type FormValue = string | boolean | MetaRow[];

/**
 * One control's value as the save sees it: a tick, trimmed text, the words of a tags line, or rows.
 */
export type SavedValue = boolean | string | string[] | MetaRow[];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One value of an entry as the control for its field holds it: a list is a line of commas. */
export function controlValue(value: unknown, kind: string): FormValue {
    if (kind === 'checkbox') return value === true;
    if (kind === 'metalist' && Array.isArray(value)) {
        return value.filter(isRecord).map((one) => ({
            label: typeof one.label === 'string' ? one.label : '',
            value: typeof one.value === 'string' ? one.value : ''
        }));
    }
    if (kind === 'raw') return rawFieldText(value);
    if (Array.isArray(value)) return value.filter((one) => typeof one === 'string').join(', ');
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return '';
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
