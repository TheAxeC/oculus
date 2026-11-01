// Layer 2, client state. What a Settings tab remembers beside the rail list: the query typed in the
// search box, and the text typed into a box (a number, a text, a scalar, a suggestion box, a
// folder, file or path) and not yet held as a change of its scope, one record per slot: the file
// and key, and the hub or folder of the scope when it is not the primary or the workspace
// (editors/slots.ts `slotOf`). The other controls hold their change as they are changed, and the
// typed values of a list, multi or family are the drafts of editors/slots.ts. It is the tab's
// instance state (state/workbench/ui.svelte.ts), merged into the blob the rail draft already lives
// in, so a tab switch or a reload brings it back and the rail list is never replaced. A tab holding
// a typed field text or an editor's draft holds unsaved work, since a half-typed value is not a
// change yet; the query alone is not.
//
// The query is read here, once, for the search of search.ts and for what a part of a row finds
// (view/fold.ts, view/matches.ts): `@modified` (in any case) and `@id:<text>` are its filters, and
// every other word, an unknown `@word` included, is a plain word. A change of a query's words drops
// the fold presses made under it (`searchFolds`, view/fold.ts).

import { z } from 'zod';
import { draftsHeld, inSlot, mapOf, type Slot } from './editors/slots.ts';

/** The prefix of the filter that looks at the key path alone. */
const ID_FILTER = '@id:';

/** The filter that keeps the Modified rows. */
export const MODIFIED_FILTER = '@modified';

/** A query read into what it asks: its filters, and its plain words in lower case. */
export type Query = { modified: boolean; ids: string[]; words: string[] };

/** Read a query into its filters and its plain words. */
export function readQuery(query: string): Query {
    const read: Query = { modified: false, ids: [], words: [] };
    for (const word of query.split(/\s+/).filter((one) => one !== '')) {
        const lower = word.toLowerCase();
        if (lower === MODIFIED_FILTER) read.modified = true;
        else if (lower.startsWith(ID_FILTER)) {
            const text = lower.slice(ID_FILTER.length);
            if (text !== '') read.ids.push(text);
        } else read.words.push(lower);
    }
    return read;
}

/**
 * A query's words as one text, whatever their case, spacing or order, filters included: two queries
 * with the same text ask the same thing, and an empty text means no query stands.
 */
export function queryWords(query: string): string {
    const words = query.toLowerCase().split(/\s+/);
    return [...new Set(words.filter((word) => word !== ''))].sort().join(' ');
}

/** One field's unsent text, under its slot. */
type Typed = Slot & { text: string };

/** The query is a string; any other value is taken as no query. */
const queryShape = z.string().catch('') satisfies z.ZodType<string>;

/** One field's unsent text, or a record that is not one. */
const typedShape = z.object({
    file: z.string(),
    key: z.string(),
    hub: z.string().optional(),
    text: z.string()
}) satisfies z.ZodType<Typed>;

/** The unsent texts: the records that are one are kept and the others are dropped. */
const typedListShape = z
    .array(z.unknown())
    .transform((items) =>
        items.flatMap((item) => {
            const one = typedShape.safeParse(item);
            return one.success ? [one.data] : [];
        })
    )
    .catch([]) satisfies z.ZodType<Typed[]>;

/** The ask the rail's Settings choice leaves: the section to scroll to, or no ask. */
const revealShape = z.enum(['rail']).optional().catch(undefined);

/** The unsent texts a state holds. */
function typedList(state: unknown): Typed[] {
    return typedListShape.parse(mapOf(state).typed);
}

/** The query a tab holds, or the empty string. */
export function settingsQuery(state: unknown): string {
    return queryShape.parse(mapOf(state).query);
}

/**
 * A tab's state with the query set, or taken away when it is empty. New words drop the fold presses
 * made under the query, so a query typed again starts from the kept folds.
 */
export function withSettingsQuery(state: unknown, query: string): Record<string, unknown> {
    const next = { ...mapOf(state) };
    if (queryWords(query) !== queryWords(settingsQuery(state))) delete next.searchFolds;
    if (query === '') delete next.query;
    else next.query = query;
    return next;
}

/** The unsent text of a field's slot, or undefined when the tab holds none for it. */
export function typedText(state: unknown, slot: Slot): string | undefined {
    return typedList(state).find((one) => inSlot(one, slot))?.text;
}

/** A tab's state with the unsent text of a field's slot set, or taken away when it is null. */
export function withTypedText(
    state: unknown,
    slot: Slot,
    text: string | null
): Record<string, unknown> {
    const next = { ...mapOf(state) };
    const others = typedList(state).filter((one) => !inSlot(one, slot));
    const all = text === null ? others : [...others, { ...slot, text }];
    if (all.length === 0) delete next.typed;
    else next.typed = all;
    return next;
}

/**
 * Whether a state holds work no write has taken: an unsent field text or a list or family draft
 * (editors/slots.ts). The tab asked is a Settings tab, which `settingsUnsaved` of
 * state/workbench/navigation/rail.ts checks before asking.
 */
export function settingsTyped(state: unknown): boolean {
    return typedList(state).length > 0 || draftsHeld(state) > 0;
}

/** The section a tab was opened to show, or undefined when it was opened for no section. */
export function settingsReveal(state: unknown): 'rail' | undefined {
    return revealShape.parse(mapOf(state).reveal);
}

/** A tab's state with the ask to show a section taken out. */
export function withoutReveal(state: unknown): Record<string, unknown> {
    const { reveal: _asked, ...rest } = mapOf(state);
    return rest;
}
