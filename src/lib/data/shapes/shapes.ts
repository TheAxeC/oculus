// Layer 1, data. The zod helpers every reader of an untyped value shares, in the data folder, the
// server, the state layer, the shell, the views and the routes: a schema that answers the value it
// was given, the map, number and filled-text schemas (`mapShape`, `keysOfShape`, `filledTextShape`,
// `optionalTextShape`, `textOrNumberOnlyShape`), the whole-number schema `wholeShape`, the list
// schemas (`itemsShape`, a list of anything, and `optionalItemsShape`, an optional list of
// strings), the quick path `quickly` builds over a schema full of `.catch` repairs, and the plain
// readers `readAs`, `readOr`, `filledText`, `optionalText`, `text` and `textOrNumber`. They sit in
// a folder of their own so every data folder above data/helpers can import them, and apart from the
// server's json.ts, which can reach the disk: the write diagram draws a module as a writer when
// anything it imports can write, and a schema helper never does.

import { z } from 'zod';
import { strings } from '../helpers/guards.ts';

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

/** The own keys of a map in their order, an own `__proto__` key included. */
export const keysOfShape = mapShape.transform((map) => Object.keys(map));

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
 * The two fields most tabs keep in their saved state: `search`, the empty text unless it is a
 * string, and `reveal`, absent unless it is a non-empty string. A reader extends it with its own
 * fields. `reveal` is present with `undefined` in the parsed copy when the input is wrong, so a
 * reader that leaves the key out sets it from the parsed data only when it is defined.
 */
export const searchRevealShape = z.object({
    search: z.string().catch(''),
    reveal: filledTextShape
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

/** The string items of a list when the field is present, and absent when it is not. */
export const optionalItemsShape = stringItemsShape.optional();

/** An object field that may hold anything, absent included, which a bare `z.unknown()` is not. */
export const anyValueShape = z.unknown().optional();

/** The items of a list, whatever they hold, and no items for any other value. */
export const itemsShape = z.array(z.unknown());

/** A list as it is, and any other value as a list of that one value. */
export const listOrOneShape = z.union([itemsShape, z.unknown().transform((one) => [one])]);
