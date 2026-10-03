// Layer 2, server. The write bodies the endpoint knows, each as the type it is and the one
// function that reads a request body into it, or into null.
//
// Nothing here touches a file. A parser is pure over its one argument, which is what lets
// tests/routes/edit/write.test.ts cover every refusal without a request, and a body of the wrong
// shape is refused whole rather than having its bad field dropped quietly: the reader is told what
// was wrong. Each body kind is a zod schema beside its reader, and a list or a map the body carries
// for a writer to place is answered as the body holds it.
//
// server/edit/writes.ts is the route and re-exports everything here.

import { z } from 'zod';
import { anyNumberShape, mapShape, readAs, unchanged } from '../../../data/shapes/shapes.ts';
import type { SubtaskAction, SubtaskTarget } from './subtasks.ts';

/** The body a write carries. `kind` is the discriminator later writes are added on. */
export type ManifestWrite = { kind: 'manifest'; id: string; fields: Record<string, unknown> };

/**
 * The other body: one session dismissed from the rail or brought back to it, pinned to an area or
 * unpinned, renamed or given its own title back. A field the body does not name is not touched, and
 * a body naming none of the three is not a write.
 */
export type SessionWrite = {
    kind: 'session';
    id: string;
    hidden?: boolean;
    /** True pins the session to the top of its group in the sessions list, false unpins it. */
    top?: boolean;
    /** An absolute directory to pin the session to, or the empty string to unpin it. */
    area?: string;
    /** The title to show instead of the transcript's own, or the empty string to clear it. */
    title?: string;
};

/** One collection entry's fields set from the entry editor. */
export type EntryWrite = {
    kind: 'entry';
    collection: string;
    id: string;
    fields: Record<string, unknown>;
};

/** One subtask line acted on: the host it hangs under, which line, and what the button does. */
export type SubtaskWrite = {
    kind: 'subtask';
    target: SubtaskTarget;
    key: string;
    action: SubtaskAction;
    value?: string;
};

/** One subtask line added to a host that may not have a block yet. */
export type SubtaskAddWrite = {
    kind: 'subtask-add';
    target: SubtaskTarget;
    fields: Record<string, unknown>;
};

/** One host of registries/career.yml moved along the pipeline. */
export type HostWrite = { kind: 'host'; name: string; status: string };

/** One new entry of one collection, and one new idea folder. */
export type NewEntryWrite = {
    kind: 'new-entry';
    collection: string;
    fields: Record<string, unknown>;
};
export type NewIdeaWrite = { kind: 'new-idea'; fields: Record<string, unknown> };

/** One collection's entries in the order a drag left them: the identity values, all of them. */
export type ReorderWrite = { kind: 'reorder'; collection: string; order: string[] };

/** One entry of one collection taken out of its file, by the id the reader gave it. */
export type DeleteEntryWrite = { kind: 'delete-entry'; collection: string; id: string };

/** One allowed scalar field of one generated feed entry. */
export type FeedFieldWrite = {
    kind: 'feed-field';
    feed: string;
    id: string;
    field: string;
    value: string | number | boolean | null;
};

/** One generated feed entry removed by its feed-specific identity. */
export type FeedDeleteWrite = { kind: 'feed-delete'; feed: string; id: string };

/** One position lead appended from the feed file's own form schema. */
export type LeadAddWrite = { kind: 'lead-add'; fields: Record<string, unknown> };

/**
 * The public deck's saved lists: which slides it shows, and where every slide of the catalog sits.
 * `order` carries the whole catalog, shown or not, so a slide unchecked and checked again comes
 * back where the reader left it.
 */
export type DeckWrite = { kind: 'deck'; selection: string[]; order: string[] };

/** One LinkedIn idea stub and one idea promoted to a numbered post. */
export type LinkedinIdeaWrite = { kind: 'linkedin-idea'; title: string; category: string };
export type LinkedinPostWrite = { kind: 'linkedin-post'; file: string };

/** One audit finding parked, or brought back, by the signature the scan gave it. */
export type AuditMuteWrite = { kind: 'audit-mute'; signature: string; muted: boolean };

/**
 * A folder added to the default workspace, by the path it was chosen as, or a root of
 * config/sources.yml removed by its key.
 */
export type RootsWrite =
    | { kind: 'roots'; action: 'add'; dir: string }
    | { kind: 'roots'; action: 'remove'; key: string };

/** The rail's whole list of pages, in order, each entry a label, a glyph name and a page key. */
export type RailWrite = { kind: 'rail'; rail: { label: string; glyph: string; page: string }[] };

/**
 * One option of a tracked config file set to a value: the file's name, the dotted key path and the
 * value, which the writer checks against the option's control.
 */
export type ConfigKeyWrite = { kind: 'config-key'; file: string; key: string; value: unknown };

/**
 * One list option or one family of a tracked config file set to a whole value: the file's name,
 * the dotted key path, the value, and the value the page read there (`base`), which the file must
 * still hold for the write to land.
 */
export type ConfigValueWrite = {
    kind: 'config-value';
    file: string;
    key: string;
    value: unknown;
    base: unknown;
};

/** A string that is not empty, which is what every id, name and key of a body is. */
const wordShape = z.string().min(1);

/** A list of words, which is what both halves of a deck write and a reorder are. */
const keysShape = unchanged(z.array(wordShape));

/** The `target` of a subtask body: `{ id }` for a manifest, `{ collection, id }` for an entry. */
const targetShape = z.object({
    id: wordShape,
    collection: wordShape.optional()
}) satisfies z.ZodType<SubtaskTarget>;

const manifestShape = z.object({
    kind: z.literal('manifest'),
    id: wordShape,
    fields: mapShape
}) satisfies z.ZodType<ManifestWrite>;

/** At least one of the four fields must be named, and each one named must be of its own type. */
const sessionShape = z
    .object({
        kind: z.literal('session'),
        id: wordShape,
        hidden: z.boolean().optional(),
        top: z.boolean().optional(),
        area: z.string().optional(),
        title: z.string().optional()
    })
    .refine(
        (write) =>
            write.hidden !== undefined ||
            write.top !== undefined ||
            write.area !== undefined ||
            write.title !== undefined
    ) satisfies z.ZodType<SessionWrite>;

const entryShape = z.object({
    kind: z.literal('entry'),
    collection: wordShape,
    id: wordShape,
    fields: mapShape
}) satisfies z.ZodType<EntryWrite>;

const subtaskShape = z.object({
    kind: z.literal('subtask'),
    target: targetShape,
    key: wordShape,
    action: z.enum(['done', 'reopen', 'snooze', 'delete']),
    value: z.string().optional()
}) satisfies z.ZodType<SubtaskWrite>;

/** The fields of a subtask add must carry a `do` that is more than blanks. */
const subtaskAddShape = z.object({
    kind: z.literal('subtask-add'),
    target: targetShape,
    fields: unchanged(z.looseObject({ do: z.string().refine((one) => one.trim() !== '') }))
}) satisfies z.ZodType<SubtaskAddWrite>;

const hostShape = z.object({
    kind: z.literal('host'),
    name: wordShape,
    status: wordShape
}) satisfies z.ZodType<HostWrite>;

const newEntryShape = z.object({
    kind: z.literal('new-entry'),
    collection: wordShape,
    fields: mapShape
}) satisfies z.ZodType<NewEntryWrite>;

const reorderShape = z.object({
    kind: z.literal('reorder'),
    collection: wordShape,
    order: keysShape
}) satisfies z.ZodType<ReorderWrite>;

const deleteEntryShape = z.object({
    kind: z.literal('delete-entry'),
    collection: wordShape,
    id: wordShape
}) satisfies z.ZodType<DeleteEntryWrite>;

/** The value a feed field takes: null to clear it, text, a number or a boolean. */
export const feedValueShape = z.union([z.null(), z.string(), anyNumberShape, z.boolean()]);

const feedFieldShape = z.object({
    kind: z.literal('feed-field'),
    feed: wordShape,
    id: wordShape,
    field: wordShape,
    value: feedValueShape
}) satisfies z.ZodType<FeedFieldWrite>;

const feedDeleteShape = z.object({
    kind: z.literal('feed-delete'),
    feed: wordShape,
    id: wordShape
}) satisfies z.ZodType<FeedDeleteWrite>;

const leadAddShape = z.object({
    kind: z.literal('lead-add'),
    fields: mapShape
}) satisfies z.ZodType<LeadAddWrite>;

/** A missing `category` is the empty category; a `category` that is not text refuses the body. */
const linkedinIdeaShape = z.object({
    kind: z.literal('linkedin-idea'),
    title: z.string(),
    category: z.string().default('')
}) satisfies z.ZodType<LinkedinIdeaWrite>;

const linkedinPostShape = z.object({
    kind: z.literal('linkedin-post'),
    file: z.string()
}) satisfies z.ZodType<LinkedinPostWrite>;

const deckShape = z.object({
    kind: z.literal('deck'),
    selection: keysShape,
    order: keysShape
}) satisfies z.ZodType<DeckWrite>;

const undoShape = z.object({
    kind: z.literal('undo'),
    at: wordShape
}) satisfies z.ZodType<UndoWrite>;

const newIdeaShape = z.object({
    kind: z.literal('new-idea'),
    fields: unchanged(z.looseObject({ id: wordShape }))
}) satisfies z.ZodType<NewIdeaWrite>;

const auditMuteShape = z.object({
    kind: z.literal('audit-mute'),
    signature: wordShape,
    muted: z.boolean()
}) satisfies z.ZodType<AuditMuteWrite>;

/** A row of the rail keeps its three strings and no other key. */
const railShape = z.object({
    kind: z.literal('rail'),
    rail: z.array(z.object({ label: z.string(), glyph: z.string(), page: z.string() }))
}) satisfies z.ZodType<RailWrite>;

const rootsShape = z.discriminatedUnion('action', [
    z.object({ kind: z.literal('roots'), action: z.literal('add'), dir: z.string() }),
    z.object({ kind: z.literal('roots'), action: z.literal('remove'), key: z.string() })
]) satisfies z.ZodType<RootsWrite>;

/** The `value` key must be there, whatever it holds; an absent one is not a write. */
const configKeyShape = z.object({
    kind: z.literal('config-key'),
    file: wordShape,
    key: wordShape,
    value: z.unknown()
}) satisfies z.ZodType<ConfigKeyWrite>;

/** Both `value` and `base` must be there, whatever they hold; an absent one is not a write. */
const configValueShape = z.object({
    kind: z.literal('config-value'),
    file: wordShape,
    key: wordShape,
    value: z.unknown(),
    base: z.unknown()
}) satisfies z.ZodType<ConfigValueWrite>;

/** The body as a manifest write, or null when it is not one. */
export function manifestWrite(body: unknown): ManifestWrite | null {
    return readAs(manifestShape, body);
}

/**
 * The body as a session write, or null when it is not one. A field of the wrong type makes the
 * whole body unknown rather than being dropped quietly, and a body carrying none of the four
 * fields is not a write either: there would be nothing to do and nothing to answer with.
 */
export function sessionWrite(body: unknown): SessionWrite | null {
    return readAs(sessionShape, body);
}

/** The body as an entry write, or null when it is not one. */
export function entryWrite(body: unknown): EntryWrite | null {
    return readAs(entryShape, body);
}

/** The body as a subtask write, or null when it is not one. */
export function subtaskWrite(body: unknown): SubtaskWrite | null {
    return readAs(subtaskShape, body);
}

/** The body as a subtask add, or null when it is not one. */
export function subtaskAdd(body: unknown): SubtaskAddWrite | null {
    return readAs(subtaskAddShape, body);
}

/** The body as a host write, or null when it is not one. */
export function hostWrite(body: unknown): HostWrite | null {
    return readAs(hostShape, body);
}

/** The body as a new entry, or null when it is not one. */
export function newEntry(body: unknown): NewEntryWrite | null {
    return readAs(newEntryShape, body);
}

/**
 * The body as a reorder, or null when it is not one. An order of no values is a reorder of a file
 * with no entries in it and is answered by the writer, not refused here: what is refused here is a
 * body that is not the shape, an order that is not a list of words above all.
 */
export function reorderWrite(body: unknown): ReorderWrite | null {
    return readAs(reorderShape, body);
}

/** The body as an entry deletion, or null when it is not one. */
export function deleteEntryWrite(body: unknown): DeleteEntryWrite | null {
    return readAs(deleteEntryShape, body);
}

/** The body as one feed field write, including null to clear the field. */
export function feedFieldWrite(body: unknown): FeedFieldWrite | null {
    return readAs(feedFieldShape, body);
}

/** The body as one feed deletion. */
export function feedDeleteWrite(body: unknown): FeedDeleteWrite | null {
    return readAs(feedDeleteShape, body);
}

/** The body as one new position lead. */
export function leadAddWrite(body: unknown): LeadAddWrite | null {
    return readAs(leadAddShape, body);
}

/** The body as one new LinkedIn idea. Empty titles reach the writer and become field refusals. */
export function linkedinIdeaWrite(body: unknown): LinkedinIdeaWrite | null {
    return readAs(linkedinIdeaShape, body);
}

/** The body as one LinkedIn idea filename to promote. */
export function linkedinPostWrite(body: unknown): LinkedinPostWrite | null {
    return readAs(linkedinPostShape, body);
}

/**
 * The body as a deck write, or null when it is not one. An empty selection is a list of the right
 * shape and reaches the writer, which is where it is refused: the refusal names what was wrong with
 * it rather than the body being unknown to the route.
 */
export function deckWrite(body: unknown): DeckWrite | null {
    return readAs(deckShape, body);
}

/** One recorded change taken back, addressed by the moment the log stamped it. */
export type UndoWrite = { kind: 'undo'; at: string };

/** The body as an undo, or null when it is not one. */
export function undoWrite(body: unknown): UndoWrite | null {
    return readAs(undoShape, body);
}

/** The body as a new idea, or null when it is not one. */
export function newIdea(body: unknown): NewIdeaWrite | null {
    return readAs(newIdeaShape, body);
}

/**
 * The body as a mute write, or null when it is not one. The signature itself is checked by the
 * writer.
 */
export function auditMuteWrite(body: unknown): AuditMuteWrite | null {
    return readAs(auditMuteShape, body);
}

/**
 * The body as a rail write, or null when it is not one: a list of maps of three strings. What the
 * strings may be is the writer's to check, against the file it writes.
 */
export function railWrite(body: unknown): RailWrite | null {
    return readAs(railShape, body);
}

/**
 * The body as a roots write, or null when it is not one. What the folder may be is the writer's.
 */
export function rootsWrite(body: unknown): RootsWrite | null {
    return readAs(rootsShape, body);
}

/**
 * The body as a config-key write, or null when it is not one: a file and a key that are non-empty
 * strings and a value that is present, whatever it is. Whether the file and the key name an option
 * and the value fits it is the writer's to say.
 */
export function configKeyWrite(body: unknown): ConfigKeyWrite | null {
    return readAs(configKeyShape, body);
}

/**
 * The body as a config-value write, or null when it is not one: a file and a key that are non-empty
 * strings, and a value and a base that are present, whatever they are. Whether the file and the key
 * name a list or a family and the value fits it is the writer's to say.
 */
export function configValueWrite(body: unknown): ConfigValueWrite | null {
    return readAs(configValueShape, body);
}
