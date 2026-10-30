// Layer 1, data. The records a manifest and a person carry for the website, out of the maps the
// sources parsed: a manifest's `publication:` (the entry of its paper in the website's
// publications) and `cv:` (the row of the project in the CV's projects), and a person's `links:`
// rows. Pure, like normalise: a field is kept when it is of its shape, an empty text included,
// since the website is written with every field the record holds, and a field that is not is left
// out; the manifest schema check names it.

import { z } from 'zod';
import { isMap } from '../../helpers/guards.ts';
import type { NamedLink, PersonLink, ProjectCv, Publication } from '../../model/index.ts';
import { compact } from '../compact.ts';

/** A text, the empty one included. */
const textShape = z.string();

/** A place in a list: a whole number, or a text of one, which the project form writes. */
const rankShape = z.union([
    z.number().int(),
    z
        .string()
        .regex(/^-?\d+$/)
        .transform(Number)
]);

/** A named address, both parts texts. */
const namedLinkShape = z.object({ name: z.string().min(1), url: z.string() });

/** A person's address on the web, with the account name a CV prints, if any. */
const personLinkShape = namedLinkShape.extend({ handle: z.string().min(1).optional() });

/** A field of a record as its shape reads it, and absent when it is not of that shape. */
function field<T>(shape: z.ZodType<T>, value: unknown): T | undefined {
    const read = shape.safeParse(value);
    return read.success ? read.data : undefined;
}

/** The rows of a list that a shape reads, in the list's order; a value that is no list has none. */
function rows<T>(shape: z.ZodType<T>, value: unknown): T[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((one: unknown) => {
        const read = shape.safeParse(one);
        return read.success ? [read.data] : [];
    });
}

/** A record with every absent field dropped, and absent when the value is no map. */
function record<T extends object>(value: unknown, read: (map: Record<string, unknown>) => T) {
    return isMap(value) ? compact(read(value)) : undefined;
}

/** A manifest's `publication:` record, absent when the manifest carries none. */
export function publication(value: unknown): Publication | undefined {
    return record<Publication>(value, (map) => ({
        authors: field(textShape, map.authors),
        book: field(textShape, map.book),
        program: Array.isArray(map.program) ? rows(textShape, map.program) : undefined,
        url: field(textShape, map.url),
        links: Array.isArray(map.links) ? rows<NamedLink>(namedLinkShape, map.links) : undefined,
        abstract: field(textShape, map.abstract),
        pub_last: field(textShape, map.pub_last),
        hide: field(z.boolean(), map.hide),
        rank: field(rankShape, map.rank)
    }));
}

/** A manifest's `cv:` record, absent when the manifest carries none. */
export function projectCv(value: unknown): ProjectCv | undefined {
    return record<ProjectCv>(value, (map) => ({
        title: field(textShape, map.title),
        url: field(textShape, map.url),
        duration: field(z.union([z.string(), z.number()]), map.duration),
        about: field(textShape, map.about),
        role: field(textShape, map.role),
        min: field(z.boolean(), map.min),
        hide: field(z.boolean(), map.hide),
        rank: field(rankShape, map.rank)
    }));
}

/** A person's `links:` rows, each a name and a full address, in the file's order. */
export function personLinks(value: unknown): PersonLink[] {
    return rows(personLinkShape, value).map((one) => compact(one));
}
