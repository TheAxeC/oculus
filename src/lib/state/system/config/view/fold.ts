// Layer 2, client state, pure. Which parts of a Settings row are folded: the editor of a row's
// entries (a list, a multi, a parked list, a family, the rail list), the Fields list of a row whose
// entries have fields, and each nested list or map of a card, named by its path of steps. Each is
// drawn under a disclosure line with its title and the number of entries or fields, so a long value
// such as the shipped themes takes one line until the reader opens it.
//
// A part holding more than FOLD_AFTER entries starts folded and a shorter one unfolded; the Fields
// list always starts folded. What the reader folds or unfolds is kept per row and part in the
// Settings tab's instance state, beside the query and the drafts (typed.ts, editors/slots.ts), so
// it holds across a reload and on another page. A search with something to show in a part (an
// entry's text, a family's key, a field's name or help) unfolds it while the query stands.
//
// A press under a query folds or unfolds its part at once and stands for that query: it is held
// under `searchFolds` with the query's words, it leaves the fold kept for an empty search as it
// was, and withSettingsQuery drops it when the words change. Clearing the query brings the kept
// folds back.

import { z } from 'zod';
import type { Step } from '../editors/draft.ts';
import { mapOf } from '../editors/slots.ts';
import type { ConfigRow } from '../rows.ts';
import { queryWords, readQuery, settingsQuery } from '../typed.ts';

/** The most entries a part may hold and still start unfolded. */
const FOLD_AFTER = 5;

/**
 * The part of a row a disclosure line folds: its editor of entries, its Fields list, or the nested
 * list at a path.
 */
export type FoldPart = 'entries' | 'fields' | Step[];

/** The folds a tab holds, by part and row id; a record that is not one reads as none. */
const foldsShape = z.record(z.string(), z.boolean()).catch({});

/** The presses a tab holds for a query, with its words; a record that is not one reads as none. */
const searchFoldsShape = z
    .object({ words: z.string(), presses: z.record(z.string(), z.boolean()) })
    .optional()
    .catch(undefined);

/** The text of a path of steps, which names a nested list or card within its row. */
export function stepsKey(steps: readonly Step[]): string {
    return steps.map((step) => `${step.index}.${step.field}`).join('/');
}

/** The key a part of a row is kept under, which the id of its body holds too. */
export function foldKey(row: string, part: FoldPart): string {
    return typeof part === 'string' ? `${part}:${row}` : `nested:${row}|${stepsKey(part)}`;
}

/** The folds a tab's state holds. */
function foldsOf(state: unknown): Record<string, boolean> {
    return foldsShape.parse(mapOf(state).folds ?? {});
}

/** The presses a tab's state holds for the query standing in it. */
function pressesOf(state: unknown): Record<string, boolean> {
    const held = searchFoldsShape.parse(mapOf(state).searchFolds);
    return held?.words === queryWords(settingsQuery(state)) ? held.presses : {};
}

/** Whether a part starts folded: the Fields list always, the entries past FOLD_AFTER. */
function foldedAtFirst(part: FoldPart, count: number): boolean {
    return part === 'fields' || count > FOLD_AFTER;
}

/** The fold the reader left on a part, or undefined when they left none. */
function heldFold(state: unknown, row: string, part: FoldPart): boolean | undefined {
    const folds = foldsOf(state);
    const key = foldKey(row, part);
    return Object.hasOwn(folds, key) ? folds[key] : undefined;
}

/**
 * A tab's state after a press on a part: under no query the fold kept for the part, and under a
 * query a press held for that query, which leaves the kept fold as it is.
 */
export function withFold(
    state: unknown,
    row: string,
    part: FoldPart,
    folded: boolean
): Record<string, unknown> {
    const key = foldKey(row, part);
    const words = queryWords(settingsQuery(state));
    if (words === '') return { ...mapOf(state), folds: { ...foldsOf(state), [key]: folded } };
    const presses = { ...pressesOf(state), [key]: folded };
    return { ...mapOf(state), searchFolds: { words, presses } };
}

/** The press held on a part for the query standing, or undefined when it holds none. */
function heldPress(state: unknown, row: string, part: FoldPart): boolean | undefined {
    const presses = pressesOf(state);
    const key = foldKey(row, part);
    return Object.hasOwn(presses, key) ? presses[key] : undefined;
}

/**
 * A tab's state after an edit at a path of a row. The row's entries and every nested list on the
 * path keep unfolded where nothing is held for them, so an entry added past the fifth does not fold
 * the list being typed in. Under no query that is the fold the reader left; under a query it is a
 * press held for that query, which keeps the fold kept for an empty search as it was.
 */
export function keptOpen(state: unknown, row: string, path: Step[] = []): Record<string, unknown> {
    const held = queryWords(settingsQuery(state)) === '' ? heldFold : heldPress;
    const parts: FoldPart[] = ['entries', ...path.map((_, at) => path.slice(0, at + 1))];
    return parts.reduce(
        (kept, part) =>
            held(kept, row, part) === undefined ? withFold(kept, row, part, false) : kept,
        mapOf(state)
    );
}

/**
 * Whether a part is folded: as a press under the standing query left it, else never while the
 * search has something to show in it (`searched`), else as the reader left it, else as it starts
 * for its count.
 */
export function isFolded(
    state: unknown,
    row: string,
    part: FoldPart,
    count: number,
    searched: boolean
): boolean {
    const pressed = heldPress(state, row, part);
    if (pressed !== undefined) return pressed;
    if (searched) return false;
    return heldFold(state, row, part) ?? foldedAtFirst(part, count);
}

/** The words of a value's entries: every text and number at any depth, and every map key. */
export function entryTexts(value: unknown): string[] {
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

/** The words of the file's value of a row, or of its Fields list. */
export function partTexts(
    row: Pick<ConfigRow, 'value' | 'fields'>,
    part: 'entries' | 'fields'
): string[] {
    if (part === 'fields') return fieldTexts(row);
    return Array.isArray(row.value) || (row.value !== null && typeof row.value === 'object')
        ? entryTexts(row.value)
        : [];
}

/** Whether a lower-case word occurs in a text of a part, whatever the text's case. */
export function wordFound(words: readonly string[], texts: readonly string[]): boolean {
    const lower = texts.map((text) => text.toLowerCase());
    return words.some((word) => lower.some((text) => text.includes(word)));
}

/** Whether a plain word of the query is found in a part's words; filters find nothing. */
export function foundInside(query: string, texts: readonly string[]): boolean {
    return wordFound(readQuery(query).words, texts);
}
