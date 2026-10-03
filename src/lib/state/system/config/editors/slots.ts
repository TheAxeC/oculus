// Layer 2, client state. Where a Settings tab keeps the drafts of its list and family editors: the
// tab's instance state, under the key `editors`, one record per file and key, beside the unsent
// field texts (typed.ts) without meeting them. A tab switch or a reload brings a draft back, and a
// tab holding one holds unsaved work. What the state holds is read back through a schema: a record
// that is not a draft is taken as none.

import { z } from 'zod';
import { draftOf, type Draft } from './draft.ts';
import type { ConfigRow } from '../rows.ts';

/** One field set of an editor: its text and what the record keeps beside it. */
const cardShape = z.object({
    fields: z.record(z.string(), z.string()),
    kept: z.record(z.string(), z.unknown()),
    order: z.array(z.string()).default([])
});

/** A draft as the state holds it. */
const draftShape = z.union([
    z.object({
        form: z.enum(['items', 'pairs', 'records']),
        keyed: z.boolean(),
        fields: z.array(z.string()),
        cards: z.array(cardShape)
    }),
    z.object({
        form: z.literal('rollup'),
        fields: z.array(z.string()),
        groups: z.array(z.object({ key: z.string(), cards: z.array(cardShape) }))
    })
]) satisfies z.ZodType<Draft>;

/**
 * One held draft: the file and key it is for, and the value the file held when the draft was
 * started, which tells a draft over a file that has since changed.
 */
type Held = { file: string; key: string; draft: Draft; base?: unknown };

const heldShape = z.object({
    file: z.string(),
    key: z.string(),
    draft: draftShape,
    base: z.unknown().optional()
}) satisfies z.ZodType<Held>;

/** The tab's state is an object; anything else is taken as no state. */
const stateShape = z.looseObject({}) satisfies z.ZodType<Record<string, unknown>>;

/**
 * The state itself when it is a map, so the keys it holds stay as they are when it is handed on,
 * and an empty map when the tab has none.
 */
export function mapOf(state: unknown): Record<string, unknown> {
    return stateShape.safeParse(state).success ? (state as Record<string, unknown>) : {};
}

/** The drafts a state holds: the records that are one are kept and the others are dropped. */
function heldList(state: unknown): Held[] {
    const list = mapOf(state).editors;
    if (!Array.isArray(list)) return [];
    return list.flatMap((item: unknown) => {
        const one = heldShape.safeParse(item);
        return one.success ? [one.data] : [];
    });
}

/** The draft a tab holds for a file and key, or undefined. */
export function savedDraft(state: unknown, file: string, key: string): Draft | undefined {
    return heldList(state).find((one) => one.file === file && one.key === key)?.draft;
}

/** The value the file held when the draft of a file and key was started, or undefined. */
export function savedBase(state: unknown, file: string, key: string): unknown {
    return heldList(state).find((one) => one.file === file && one.key === key)?.base;
}

/**
 * A tab's state with the draft of a file and key set, or taken away when it is null. `base` is the
 * value the file holds as the draft is started, kept as it was given until the draft is replaced
 * by one given without it.
 */
export function withSavedDraft(
    state: unknown,
    file: string,
    key: string,
    draft: Draft | null,
    base?: unknown
): Record<string, unknown> {
    const next = { ...mapOf(state) };
    const others = heldList(state).filter((one) => one.file !== file || one.key !== key);
    const all = draft === null ? others : [...others, { file, key, draft, base }];
    if (all.length === 0) delete next.editors;
    else next.editors = all;
    return next;
}

/** How many drafts a state holds. */
export function draftsHeld(state: unknown): number {
    return heldList(state).length;
}

/**
 * Whether the editor of a row is drawn: the file's value reads into a draft. Whether the tab holds
 * a draft of it makes no difference, since a held draft is drawn only through the row's editor. A
 * refusal of the editors' write is drawn by the editor when it is, and by the item otherwise.
 */
export function drawsEditor(row: ConfigRow): boolean {
    return draftOf(row) !== null;
}
