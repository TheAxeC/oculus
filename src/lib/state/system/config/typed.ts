// Layer 2, client state. What a Settings tab remembers beside the rail list: the query typed in the
// search box, and the text typed into a field and not yet written, one record per file and key. It
// is the tab's instance state (state/workbench/ui.svelte.ts), merged into the blob the rail draft
// already lives in, so a tab switch or a reload brings it back and the rail list is never replaced.
// A tab holding a typed field text holds unsaved text, since each write is a record in History and
// a half-typed value is not one yet; the query alone is not.

import { z } from 'zod';

/** One field's unsent text. */
type Typed = { file: string; key: string; text: string };

/** The tab's state is an object; anything else is taken as no state. */
const stateShape = z.looseObject({}) satisfies z.ZodType<Record<string, unknown>>;

/** The query is a string; any other value is taken as no query. */
const queryShape = z.string().catch('') satisfies z.ZodType<string>;

/** One field's unsent text, or a record that is not one. */
const typedShape = z.object({
    file: z.string(),
    key: z.string(),
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

/**
 * The state itself when it is a map, so the keys it holds stay as they are when it is handed on,
 * and an empty map when the tab has none. The schema only accepts or refuses.
 */
function mapOf(state: unknown): Record<string, unknown> {
    return stateShape.safeParse(state).success ? (state as Record<string, unknown>) : {};
}

/** The unsent texts a state holds. */
function typedList(state: unknown): Typed[] {
    return typedListShape.parse(mapOf(state).typed);
}

/** The query a tab holds, or the empty string. */
export function settingsQuery(state: unknown): string {
    return queryShape.parse(mapOf(state).query);
}

/** A tab's state with the query set, or taken away when it is empty. */
export function withSettingsQuery(state: unknown, query: string): Record<string, unknown> {
    const next = { ...mapOf(state) };
    if (query === '') delete next.query;
    else next.query = query;
    return next;
}

/** The unsent text of a field, or undefined when the tab holds none for it. */
export function typedText(state: unknown, file: string, key: string): string | undefined {
    return typedList(state).find((one) => one.file === file && one.key === key)?.text;
}

/** A tab's state with the unsent text of a field set, or taken away when it is null. */
export function withTypedText(
    state: unknown,
    file: string,
    key: string,
    text: string | null
): Record<string, unknown> {
    const next = { ...mapOf(state) };
    const others = typedList(state).filter((one) => one.file !== file || one.key !== key);
    const all = text === null ? others : [...others, { file, key, text }];
    if (all.length === 0) delete next.typed;
    else next.typed = all;
    return next;
}

/**
 * Whether a state holds text no write has taken: an unsent field text. The tab asked is a Settings
 * tab, which state/client/context.ts checks before asking.
 */
export function settingsTyped(state: unknown): boolean {
    return typedList(state).length > 0;
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
