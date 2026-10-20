// Layer 2, client state, pure. Which parts of a Settings row are folded: the editor of a row's
// entries (a list, a multi, a parked list, a family, the rail list) and the Fields list of a row
// whose entries have fields. Each is drawn under a disclosure line with the row's title and the
// number of entries or fields, so a long value such as the shipped themes takes one line until the
// reader opens it.
//
// A part holding more than FOLD_AFTER entries starts folded and a shorter one unfolded; the Fields
// list always starts folded. What the reader folds or unfolds is kept per row and part in the
// Settings tab's instance state, beside the query and the drafts (typed.ts, editors/slots.ts), so
// it holds across a reload and on another page. A query whose words are found inside a part (an
// entry's text, a family's key, a field's name or help) unfolds it while the query stands, and the
// kept state comes back once it is cleared.

import { z } from 'zod';
import { mapOf } from '../editors/slots.ts';
import type { ConfigRow } from '../rows.ts';

/** The most entries a part may hold and still start unfolded. */
const FOLD_AFTER = 5;

/** The part of a row a disclosure line folds: its editor of entries, or its Fields list. */
export type FoldPart = 'entries' | 'fields';

/** The folds a tab holds, by part and row id; a record that is not one reads as none. */
const foldsShape = z.record(z.string(), z.boolean()).catch({});

/** The key a part of a row is kept under. */
function foldKey(row: string, part: FoldPart): string {
    return `${part}:${row}`;
}

/** The folds a tab's state holds. */
function foldsOf(state: unknown): Record<string, boolean> {
    return foldsShape.parse(mapOf(state).folds ?? {});
}

/** Whether a part starts folded: the Fields list always, the entries past FOLD_AFTER. */
function foldedAtFirst(part: FoldPart, count: number): boolean {
    return part === 'fields' || count > FOLD_AFTER;
}

/** The fold the reader left on a part, or undefined when they left none. */
export function heldFold(state: unknown, row: string, part: FoldPart): boolean | undefined {
    const folds = foldsOf(state);
    const key = foldKey(row, part);
    return Object.hasOwn(folds, key) ? folds[key] : undefined;
}

/** A tab's state with the fold of a part kept. */
export function withFold(
    state: unknown,
    row: string,
    part: FoldPart,
    folded: boolean
): Record<string, unknown> {
    return { ...mapOf(state), folds: { ...foldsOf(state), [foldKey(row, part)]: folded } };
}

/**
 * Whether a part is folded: never while the query is found inside it, else as the reader left it,
 * else as it starts for its count.
 */
export function isFolded(
    state: unknown,
    row: string,
    part: FoldPart,
    count: number,
    searched: boolean
): boolean {
    if (searched) return false;
    return heldFold(state, row, part) ?? foldedAtFirst(part, count);
}

/** The words of a value's entries: every text and number at any depth, and every map key. */
function entryTexts(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (typeof value === 'number') return [String(value)];
    if (Array.isArray(value)) return value.flatMap(entryTexts);
    if (value !== null && typeof value === 'object') {
        return Object.entries(value).flatMap(([key, inner]) => [key, ...entryTexts(inner)]);
    }
    return [];
}

/** The words of a row's Fields list: each field's name and help. */
function fieldTexts(row: Pick<ConfigRow, 'fields'>): string[] {
    return Object.entries(row.fields).flatMap(([name, spec]) => [name, spec.help]);
}

/** The words of a part of a row the query is looked for in. */
export function partTexts(row: Pick<ConfigRow, 'value' | 'fields'>, part: FoldPart): string[] {
    if (part === 'fields') return fieldTexts(row);
    return Array.isArray(row.value) || (row.value !== null && typeof row.value === 'object')
        ? entryTexts(row.value)
        : [];
}

/**
 * The words of a query a part is searched for: every word but the `@` filters, in lower case
 * (search.ts reads the filters).
 */
function plainWords(query: string): string[] {
    return query
        .split(/\s+/)
        .filter((word) => word !== '' && !word.startsWith('@'))
        .map((word) => word.toLowerCase());
}

/** Whether a word of the query is found in a part's words, whatever the case. */
export function foundInside(query: string, texts: readonly string[]): boolean {
    const words = plainWords(query);
    if (words.length === 0) return false;
    const lower = texts.map((text) => text.toLowerCase());
    return words.some((word) => lower.some((text) => text.includes(word)));
}
