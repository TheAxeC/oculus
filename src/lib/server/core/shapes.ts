// Layer 2, server. The zod helpers every reader of an untyped value shares: a schema that answers
// the value it was given, the map, number and filled-text schemas, the whole-number and
// string-list schemas, the quick path `quickly` builds over a schema full of `.catch` repairs, and
// the two plain readers `readAs` and `text`. The server's readers of untyped input read through
// them. They sit apart from json.ts, which can reach the disk: the write diagram draws a module as
// a writer when anything it imports can write, and a schema helper never does.

import { z } from 'zod';
import { strings } from '../../data/helpers/guards.ts';

/**
 * A schema that accepts what `shape` accepts and answers the value it was given, not the copy zod
 * builds. A reader that hands a map or a list on to a writer, a file or the page uses it, so the
 * order of the keys, an own `__proto__` key, the keys `shape` does not name and the identity of
 * the value all stay.
 */
export function unchanged<T>(shape: z.ZodType<T>): z.ZodType<T> {
    return z.custom<T>((value) => shape.safeParse(value).success);
}

/** Any number `typeof` calls one, `NaN` and the infinities included, which `z.number()` refuses. */
export const anyNumberShape = z.custom<number>((value) => typeof value === 'number');

/** A map of any keys and values: what `isMap` accepts, answered as it was given. */
export const mapShape = unchanged(z.looseObject({}));

/** A text field that carries something: absent unless it is a non-empty string. */
export const filledTextShape = z.string().min(1).optional().catch(undefined);

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

/** What `shape` makes of the value, or null when it refuses it. */
export function readAs<T>(shape: z.ZodType<T>, value: unknown): T | null {
    const parsed = shape.safeParse(value);
    return parsed.success ? parsed.data : null;
}

/** A string value, or the empty string for anything else. */
export function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
