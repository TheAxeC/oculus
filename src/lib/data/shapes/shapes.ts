// Layer 1, data. The zod helpers every reader of an untyped value shares, in the data folder, the
// server, the state layer, the shell, the views and the routes: a schema that answers the value it
// was given, the map, number and filled-text schemas (`mapShape`, `filledTextShape`,
// `optionalTextShape`, `textOrNumberOnlyShape`), the whole-number schema `wholeShape`, the list
// schemas (`itemsShape`, a list of anything, and `optionalItemsShape`, an optional list of
// strings), the quick path `quickly` builds over a schema full of `.catch` repairs, and the plain
// readers `readAs`, `readOr`, `filledText`, `optionalText`, `text` and `textOrNumber`, and the one
// shape of a debug console append (`debugAppendShape`), which the server's merge and the page's
// reader share, and the fields of a debug configuration (`debugConfigurationShape`), which the
// server's route and the page's reader of the launch file share, and the readers of a manifest's
// or a collection entry's `followup:` notes and `subtasks:` checklist (`followups`, `subtasks`),
// which the snapshot and the page's cards share. They sit in a folder of their own
// so every data folder above data/helpers can import them, and apart from the server's json.ts,
// which can reach the disk: the write diagram draws a module as a writer when anything it imports
// can write, and a schema helper never does.

import { z } from 'zod';
import { strings } from '../helpers/guards.ts';
import { hubId } from '../helpers/hub-names.ts';
import { DEBUG_CONSOLE_KINDS, type Followup, type Subtask, type TaskRef } from '../model/index.ts';

/**
 * A schema that accepts what `shape` accepts and answers the value it was given, not the copy zod
 * builds. A reader that hands a map or a list on to a writer, a file or the page uses it, so the
 * order of the keys, an own `__proto__` key, the keys `shape` does not name and the identity of
 * the value all stay.
 */
export function unchanged<T>(shape: z.ZodType<T>): z.ZodType<T> {
    return z.custom<T>((value) => shape.safeParse(value).success);
}

/**
 * `shape`'s check of a value, answered as the type `T` the value is declared to have. A reader of a
 * large payload checks only its top-level fields with `shape` and hands the value on as the type
 * the data model declares for it.
 */
export function unchangedAs<T>(shape: z.ZodType): z.ZodType<T> {
    return z.custom<T>((value) => shape.safeParse(value).success);
}

/** Any number `typeof` calls one, `NaN` and the infinities included, which `z.number()` refuses. */
export const anyNumberShape = z.custom<number>((value) => typeof value === 'number');

/** A map of any keys and values: what `isMap` accepts, answered as it was given. */
export const mapShape = unchangedAs<Record<string, unknown>>(z.object({}));

/** A text field that carries something: absent unless it is a non-empty string. */
export const filledTextShape = z.string().min(1).optional().catch(undefined);

/** The text of a value that carries something, and undefined for any other value. */
export function filledText(value: unknown): string | undefined {
    return filledTextShape.safeParse(value).data;
}

/** A text field that may be empty: absent unless it is a string. */
export const optionalTextShape = z.string().optional().catch(undefined);

/** The text of a value that is a string, empty or not, and undefined for any other value. */
export function optionalText(value: unknown): string | undefined {
    return optionalTextShape.safeParse(value).data;
}

/** A string, or any number (`NaN` and the infinities included) written out; else it fails. */
export const textOrNumberOnlyShape = z.union([z.string(), anyNumberShape.transform(String)]);

/** A string, or any number (`NaN` and the infinities included) written out, else the empty text. */
export const textOrNumberShape = textOrNumberOnlyShape.catch('');

/** `textOrNumberShape` read once, for a caller that holds a value and wants its text. */
export function textOrNumber(value: unknown): string {
    return textOrNumberShape.parse(value);
}

/**
 * A field of a saved state that names a record, which the file holds as the record's hub and its
 * key, two fields, and which is read back as the record's internal id (`hubId`); undefined for any
 * other value. `recordField` of state/shared/page/records.ts writes it.
 */
export const recordShape = z
    .object({ hub: z.string(), key: z.string().min(1) })
    .transform((held) => hubId(held.hub, held.key))
    .optional()
    .catch(undefined);

/**
 * The two fields most tabs keep in their saved state: `search`, the empty text unless it is a
 * string, and `reveal`, the record a palette pick asked the tab to show, absent unless it names
 * one (`recordShape`). A reader extends it with its own fields. `reveal` is present with
 * `undefined` in the parsed copy when the input is wrong, so a reader that leaves the key out sets
 * it from the parsed data only when it is defined.
 */
export const searchRevealShape = z.object({
    search: z.string().catch(''),
    reveal: recordShape
});

/**
 * `shape` with every `.catch` removed, through the objects, lists, optional and nullable fields and
 * unions it is built of. A value this accepts needs no repair. `quickly` has checked the forms
 * this rebuilds.
 */
function withoutCatch(shape: z.core.$ZodType): z.ZodType {
    if (shape instanceof z.ZodCatch) return withoutCatch(shape.unwrap());
    if (shape instanceof z.ZodOptional) return withoutCatch(shape.unwrap()).optional();
    if (shape instanceof z.ZodNullable) return withoutCatch(shape.unwrap()).nullable();
    if (shape instanceof z.ZodArray) return z.array(withoutCatch(shape.element));
    if (shape instanceof z.ZodUnion) {
        return z.union(shape.options.map((option) => withoutCatch(option)));
    }
    if (shape instanceof z.ZodObject) {
        const fields = Object.entries(shape.shape as Record<string, z.core.$ZodType>).map(
            ([key, field]) => [key, withoutCatch(field)]
        );
        return z.object(Object.fromEntries(fields));
    }
    return shape as z.ZodType;
}

/** Throw when `withoutCatch` would rebuild `shape` as a schema that accepts other values. */
function refuseUnrebuildable(shape: z.core.$ZodType): void {
    if (
        shape instanceof z.ZodCatch ||
        shape instanceof z.ZodOptional ||
        shape instanceof z.ZodNullable
    ) {
        refuseUnrebuildable(shape.unwrap());
    } else if (shape instanceof z.ZodUnion) {
        for (const option of shape.options) refuseUnrebuildable(option);
    } else if (shape instanceof z.ZodArray) {
        if ((shape.def.checks ?? []).length > 0) {
            throw new Error(
                'quickly takes a list without a check: .min, .max and .refine are lost'
            );
        }
        refuseUnrebuildable(shape.element);
    } else if (shape instanceof z.ZodObject) {
        if ((shape.def.checks ?? []).length > 0) {
            throw new Error('quickly takes an object without a check: .refine is lost');
        }
        if (shape.def.catchall !== undefined) {
            throw new Error('quickly takes a plain object: a loose or strict one is rebuilt plain');
        }
        const fields = Object.values(shape.shape).map((field) => field as z.core.$ZodType);
        for (const field of fields) refuseUnrebuildable(field);
    }
}

/**
 * `shape`, read the quick way first. A well-formed value passes the same shape without its `.catch`
 * wrappers and gives the answer `shape` gives; a value that does not is read by `shape`, which
 * repairs it field by field. The answer is `shape`'s either way.
 *
 * It takes a plain `z.object`, a `z.array`, the `.optional()`, `.nullable()` and `.catch()`
 * wrappers and unions of those, with any other schema as a leaf kept as it is. Rebuilding a loose
 * or strict object, or an object or list carrying a check, would accept other values than `shape`
 * does, so `quickly` throws when it is built over one.
 */
export function quickly<T>(shape: z.ZodType<T>): z.ZodType<T> {
    refuseUnrebuildable(shape);
    return z.union([withoutCatch(shape), shape]) as z.ZodType<T>;
}

/** A whole number: a finite number cut to its whole part, and zero for anything else. */
export const wholeShape = z.number().transform(Math.trunc).catch(0);

/** The string items of a list, and no items for anything that is not a list. */
export const stringItemsShape = z.unknown().transform(strings);

/**
 * A list read item by item. A list whose every item passes `item` is answered as the input itself,
 * so a view gets the same objects; otherwise the answer is a new list of the items that pass, in
 * their order. A value that is not a list fails.
 */
export function survivorsShape<T>(item: z.ZodType<T>): z.ZodType<T[]> {
    return z.union([unchanged(z.array(item)), rowsShape(item)]);
}

/** The items of a list that pass `item`, as `item` answers them, always in a new list. */
export function rowsShape<T>(item: z.ZodType<T>): z.ZodType<T[]> {
    return z.array(z.unknown()).transform((list) =>
        list.flatMap((entry) => {
            const parsed = item.safeParse(entry);
            return parsed.success ? [parsed.data] : [];
        })
    );
}

/**
 * A map read by its own keys in the input's order, in a new map: a key whose value fails `value`
 * is left out, and an own `__proto__` key is skipped, because assigning to it would replace the
 * new map's prototype instead of adding a key. A value that is not a map fails.
 */
export function mapOfShape<T>(value: z.ZodType<T>): z.ZodType<Record<string, T>> {
    return mapShape.transform((map) => {
        const kept: Record<string, T> = {};
        for (const key of Object.keys(map)) {
            const parsed = key === '__proto__' ? null : value.safeParse(map[key]);
            if (parsed?.success) kept[key] = parsed.data;
        }
        return kept;
    });
}

/**
 * A response's body as JSON, or undefined when the body is JSON null or is not JSON, so a reader
 * tells an unreadable body from a map of the wrong shape and words the failure itself.
 */
export async function readJson(response: Response): Promise<unknown> {
    try {
        return (await response.json()) ?? undefined;
    } catch {
        return undefined;
    }
}

/** What `shape` makes of the value, or null when it refuses it. */
export function readAs<T>(shape: z.ZodType<T>, value: unknown): T | null {
    const parsed = shape.safeParse(value);
    return parsed.success ? parsed.data : null;
}

/** What `shape` makes of the value, or `fallback` when it refuses it. */
export function readOr<T>(shape: z.ZodType<T>, value: unknown, fallback: T): T {
    const parsed = shape.safeParse(value);
    return parsed.success ? parsed.data : fallback;
}

/** A string value, or the empty string for anything else. */
export function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** A text field: the string, and the empty text for any other value. */
export const wordShape = z.string().catch('');

/**
 * The rows of a checklist written as a list or as a map: a list is keyed by position (`'0'`,
 * `'1'`) and a map by its own keys in their order, an own `__proto__` key included. Anything else
 * has no rows. A row is `[key, item]` with the item as it was given.
 */
export const keyedRowsShape = z.union([
    z
        .array(z.unknown())
        .transform((list): [string, unknown][] => list.map((item, at) => [String(at), item])),
    mapShape.transform((map): [string, unknown][] => Object.entries(map))
]);

/** An object field that holds strings: its string items, and none when absent or not a list. */
export const fieldItemsShape = stringItemsShape.catch([]);

/**
 * A list of a saved state whose items name records, each its hub and its key (`recordShape`), read
 * back as the records' internal ids; an item that names none is left out, and a value that is no
 * list reads as the empty list.
 */
export const recordItemsShape = z
    .array(z.unknown())
    .transform((items) =>
        items.map((one) => recordShape.parse(one)).filter((one) => one !== undefined)
    )
    .catch([]);

/** The string items of a list when the field is present, and absent when it is not. */
export const optionalItemsShape = stringItemsShape.optional();

/** An object field that may hold anything, absent included, which a bare `z.unknown()` is not. */
export const anyValueShape = z.unknown().optional();

/** The items of a list, whatever they hold, and no items for any other value. */
export const itemsShape = z.array(z.unknown());

/** A list as it is, and any other value as a list of that one value. */
export const listOrOneShape = z.union([itemsShape, z.unknown().transform((one) => [one])]);

// A task reference (data/model/model-agents.ts `TaskRef`) read from an untyped value: the body of a
// terminal request, and the record a Terminal tab keeps in the saved layout. A value that is no
// reference reads as none, so a malformed record never reaches a request as a task.

/** The line of a task's checklist a reference names: its key and the `do` text the page showed. */
const subtaskShape = z.object({ key: z.string(), do: z.string() });

/**
 * A task reference: the host's id, the collection when the host is an entry, and the subtask line
 * when the task is one. An empty `id` passes the shape; the server answers it `task-unknown`.
 */
const taskRefShape: z.ZodType<TaskRef> = z.object({
    id: z.string(),
    collection: z.string().optional(),
    subtask: subtaskShape.optional()
});

/** The reference a value is, or undefined for any value that is not one. */
export function taskRefOf(value: unknown): TaskRef | undefined {
    const read = taskRefShape.safeParse(value);
    if (!read.success) return undefined;
    const { id, collection, subtask } = read.data;
    return {
        id,
        ...(collection === undefined ? {} : { collection }),
        ...(subtask === undefined ? {} : { subtask: { key: subtask.key, do: subtask.do } })
    };
}

/** One segment of a cluster path: characters that reach the remote shell unchanged. */
const CLUSTER_SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * The folder on the cluster that holds a project's code, as the manifest's `paths.cluster` writes
 * it, or null when the value is not one: a text that opens with `~/` or `/`, then one or more
 * segments of letters, digits, `.`, `_` and `-` separated by single slashes, no segment `.` or
 * `..` and no trailing slash. Every character it admits reaches the remote shell unchanged, so the
 * folder is handed to `cd` and to rsync unquoted where `~/` has to be expanded there.
 */
export function clusterFolder(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const rest = value.startsWith('~/')
        ? value.slice(2)
        : value.startsWith('/')
          ? value.slice(1)
          : null;
    if (rest === null) return null;
    const segments = rest.split('/');
    const sound = segments.every(
        (segment) => CLUSTER_SEGMENT.test(segment) && segment !== '.' && segment !== '..'
    );
    return sound ? value : null;
}

/**
 * One append of the debug console as the channel carries it: the session, the absolute number of
 * the first line sent and the lines, which the server merges and the page reads by this one shape.
 */
export const debugAppendShape = z.object({
    session: z.number(),
    start: z.number(),
    lines: z.array(z.object({ kind: z.enum(DEBUG_CONSOLE_KINDS), text: z.string() }))
});

/** The fields of one debug configuration, as a request carries it and the launch file reads. */
export const debugConfigurationShape = z.object({
    name: z.string(),
    type: z.string(),
    request: z.enum(['launch', 'attach']),
    args: z.record(z.string(), z.unknown()),
    program: z.string(),
    cwd: z.string(),
    before: z.string().optional()
});

/** One note of a `followup:` list: a map with its `do` and its `after`. */
const noteShape = z.object({ do: optionalTextShape, after: optionalTextShape });

/**
 * The `followup:` notes of a manifest or of a collection entry: a list of `{ do, after }` maps, as
 * the follow-up writes leave it. The key a note is addressed by is its position in the list, so a
 * write knows which note it means. A value that is not a list holds no notes (validate.ts and
 * hub.ts report it), and an item that is not such a map or has no `do` is dropped in silence, the
 * way str() drops a value of the wrong type.
 */
export function followups(value: unknown): Followup[] {
    const out: Followup[] = [];
    readOr(itemsShape, value, []).forEach((item, at) => {
        const note = readAs(noteShape, item);
        if (note?.do === undefined || note.do.trim() === '') return;
        // A note with no `after` has no such key, so the snapshot survives a JSON round trip.
        const held: Followup = { key: String(at), do: note.do };
        if (note.after !== undefined) held.after = note.after;
        out.push(held);
    });
    return out;
}

/** One line of a `subtasks:` checklist: a string, or a map of its `do`, `deadline` and so on. */
const lineShape = z.union([
    z.string().transform((text) => ({
        do: text,
        deadline: undefined as string | undefined,
        done: false,
        snooze: undefined as string | undefined
    })),
    z.object({
        do: optionalTextShape,
        deadline: optionalTextShape,
        done: z.boolean().catch(false),
        snooze: optionalTextShape
    })
]);

/**
 * The `subtasks:` checklist of a manifest or of a collection entry. The key holds a map of key to
 * line or a list of lines, and a line is a string or a `{ do, deadline, done, snooze }` map. The
 * key a line is addressed by is the map's own key, or the position for a list, so a write knows
 * which line it means whatever shape the file is written in.
 */
export function subtasks(value: unknown): Subtask[] {
    const out: Subtask[] = [];
    for (const [key, item] of readOr(keyedRowsShape, value, [])) {
        const line = readAs(lineShape, item);
        if (line?.do === undefined || line.do.trim() === '') continue;
        const held: Subtask = { key, do: line.do, done: line.done };
        if (line.deadline !== undefined) held.deadline = line.deadline;
        if (line.snooze !== undefined) held.snooze = line.snooze;
        out.push(held);
    }
    return out;
}
