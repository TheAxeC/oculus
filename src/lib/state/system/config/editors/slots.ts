// Layer 2, client state. Where a Settings tab keeps the drafts of its list and family editors: the
// tab's instance state, under the key `editors`, one record per slot, beside the unsent field texts
// (typed.ts) without meeting them. A slot is a file and key, and the hub or folder of the scope the
// row is drawn in when it is not the primary or the workspace (`slotOf`, from the row's `slot`), so
// a draft made in one hub's scope is drawn, held and ended only in that scope. A tab switch or a
// reload brings a draft back. What the state holds is read back through a schema: a record that is
// not a draft is taken as none. The sentence of a value its editor does not draw is here too
// (`undrawnMessage`).

import { z } from 'zod';
import { draftOf, typedDraft, type Draft, type TextDraft } from './draft.ts';
import type { Card, FieldValue } from './fields.ts';
import { RAIL_ROW } from '../groups.ts';
import { message, type Message } from '../messages.ts';
import { writtenWhole, type ConfigRow } from '../rows.ts';

/**
 * One entry of an editor: what its fields hold, what the record keeps beside them, their order, and
 * the type of each text box field the file held as a boolean or a number.
 */
const cardShape: z.ZodType<Card> = z.lazy(() =>
    z.object({
        fields: z.record(z.string(), fieldShape),
        kept: z.record(z.string(), z.unknown()),
        order: z.array(z.string()).default([]),
        unread: z.record(z.string(), z.string()).optional(),
        scalars: z.record(z.string(), z.enum(['boolean', 'number'])).optional()
    })
);

/** What a field holds: a boolean, a text, a list of words or a list of entries of its own. */
const fieldShape: z.ZodType<FieldValue> = z.lazy(() =>
    z.union([z.boolean(), z.string(), z.array(z.string()), z.array(cardShape)])
);

/** A draft as the state holds it. */
const draftShape = z.object({
    form: z.enum(['items', 'pairs', 'records', 'multi']),
    keyed: z.boolean(),
    fields: z.array(z.string()),
    cards: z.array(cardShape)
}) satisfies z.ZodType<Draft>;

/** One field set of a draft held as text. */
const textCardShape = z.object({
    fields: z.record(z.string(), z.string()),
    kept: z.record(z.string(), z.unknown()),
    order: z.array(z.string()).default([])
});

/** A draft held as text, which a page that kept every field as one line of YAML wrote. */
const textDraftShape = z.object({
    form: z.enum(['items', 'pairs', 'records']),
    keyed: z.boolean(),
    fields: z.array(z.string()),
    cards: z.array(textCardShape)
}) satisfies z.ZodType<TextDraft>;

/**
 * Where a row's draft or typed text is kept: its file and key, and the hub or folder of its scope
 * when that is not the primary (`row.slot`).
 */
export type Slot = { file: string; key: string; hub?: string };

/** The slot of a row: its file and key, and the hub its drafts are kept under, if any. */
export function slotOf(row: ConfigRow): Slot {
    return { file: row.file, key: row.key, ...(row.slot === undefined ? {} : { hub: row.slot }) };
}

/** Whether a held record is the one of a slot: the same file, key and hub, or none of a hub. */
export function inSlot(held: Slot, slot: Slot): boolean {
    return held.file === slot.file && held.key === slot.key && held.hub === slot.hub;
}

/**
 * One held draft: the slot it is for, the draft itself, whether its fields are typed values (a
 * draft without the mark is read from text), and the value the file held when the draft was
 * started, which tells a draft over a file that has since changed.
 */
type Held = Slot & { draft: unknown; typed?: boolean; base?: unknown };

const heldShape = z.object({
    file: z.string(),
    key: z.string(),
    hub: z.string().optional(),
    draft: z.unknown(),
    typed: z.boolean().optional(),
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

/** The drafts a state holds: the records that name a file and key are kept, the others dropped. */
function heldList(state: unknown): Held[] {
    const list = mapOf(state).editors;
    if (!Array.isArray(list)) return [];
    return list.flatMap((item: unknown) => {
        const one = heldShape.safeParse(item);
        return one.success ? [one.data] : [];
    });
}

/**
 * The draft a tab holds for a row, or undefined. A draft the tab held as text is read into typed
 * fields by the row's own catalog entry; a held record that is no draft of either form is none.
 */
export function savedDraft(state: unknown, row: ConfigRow): Draft | undefined {
    const slot = slotOf(row);
    const one = heldList(state).find((held) => inSlot(held, slot));
    if (one === undefined) return undefined;
    if (one.typed === true) return draftShape.safeParse(one.draft).data;
    const text = textDraftShape.safeParse(one.draft).data;
    return text === undefined ? undefined : typedDraft(text, row);
}

/** The value the file held when the draft of a slot was started, or undefined. */
export function savedBase(state: unknown, slot: Slot): unknown {
    return heldList(state).find((one) => inSlot(one, slot))?.base;
}

/**
 * A tab's state with the draft of a slot set, or taken away when it is null. `base` is the value
 * the file holds as the draft is started, kept as it was given until the draft is replaced by one
 * given without it.
 */
export function withSavedDraft(
    state: unknown,
    slot: Slot,
    draft: Draft | null,
    base?: unknown
): Record<string, unknown> {
    const next = { ...mapOf(state) };
    const others = heldList(state).filter((one) => !inSlot(one, slot));
    const all = draft === null ? others : [...others, { ...slot, draft, typed: true, base }];
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

/** The longest text of a value the sentence about its shape quotes, before it is cut. */
const QUOTED = 160;

/**
 * The finding of a list, a multi, a parked list or a family whose value is in a shape its editor
 * does not draw: the key and the value as the file gives it, cut at QUOTED characters. Null for a
 * row the editor draws, the rail, which has its own editor, and a row flagged mismatch, whose own
 * sentence says what the control cannot show.
 */
export function undrawnMessage(row: ConfigRow): Message | null {
    if (!writtenWhole(row.control) || row.mismatch || row.id === RAIL_ROW) return null;
    if (row.state !== 'set' || drawsEditor(row)) return null;
    const text = row.value === undefined ? '' : JSON.stringify(row.value);
    return message(
        'undrawn',
        row.path,
        text.length > QUOTED ? `${text.slice(0, QUOTED)}...` : text
    );
}
