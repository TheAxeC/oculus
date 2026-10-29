// Layer 1, data. A dataset's `retrieval` list read once into its sources, and whether Recover runs
// the set. A stated kind (`library`, `request`, `derived`) is read by its own fields; any other
// kind is the `key` of a row of the hub's `recover.sources`, and its fields are read as the words,
// lists and flags that row's holes take. The server's Recover reads this result and parses nothing
// again; the card reads it for the call, the contact or the origin of a set Recover does not run,
// and for the kinds no row of the hub reads.
//
// A source that does not fit is left out of the list, and a set holding one is no set Recover
// runs, so a recipe with a malformed field is never half fetched. Validate reports each source
// left out (`checkDatasetSources` of data/snapshot/validate-kinds.ts), since the schema check
// states neither the form of a folder inside an archive nor a field that holds only beside
// another. The rule for a name inside a folder, `safeName`, lives here because the registry's
// `folder` and the server's listing of files both follow it.

import { z } from 'zod';
import { isMap } from '../../helpers/guards.ts';
import { statedKind, type RecoverSource } from '../../model/model-entities.ts';
import { textOrNumberOnlyShape } from '../../shapes/shapes.ts';

/** A control character or a backslash makes a name unusable. */
// eslint-disable-next-line no-control-regex
const BAD_NAME = /[\u0000-\u001f\u007f\\]/;

/**
 * Whether a name a source or an entry gives is a relative path that stays inside its folder: no
 * leading `/`, no `.` or `..` part, no empty part, no backslash and no control character.
 */
export function safeName(name: string): boolean {
    if (name === '' || name.startsWith('/') || BAD_NAME.test(name)) return false;
    return name.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

/**
 * A folder inside an archive, as a source's `folder` and a listed file's `unpack.folder` give it:
 * a name `safeName` takes once its one trailing `/` is dropped, read without that `/`. Any other
 * text does not fit, so the source, or the listing kept on disk, is not read.
 */
export const archiveFolderShape = z.string().transform((text, context) => {
    const folder = text.endsWith('/') ? text.slice(0, -1) : text;
    if (safeName(folder)) return folder;
    context.addIssue({ code: 'custom', message: 'folder' });
    return z.NEVER;
});

/** A text the file writes as words or as a number (a record number, a version). */
const wordShape = textOrNumberOnlyShape.pipe(z.string().trim().min(1));

/** A list of texts, each written as words or as a number. */
const wordsShape = z.array(wordShape);

/** A flag that is set only when the file writes `true`; `false` reads as absent. */
const flagShape = z
    .boolean()
    .optional()
    .transform((value) => (value === true ? (true as const) : undefined));

/** A count of folders, written as a number or as its digits. */
const countShape = z.union([
    z.number().int().min(0),
    z
        .string()
        .regex(/^\d+$/)
        .transform((digits) => Number(digits))
]);

/** What every kind takes besides its own fields. */
const placeShape = z.object({
    into: wordShape.optional(),
    unpack: flagShape,
    strip: countShape.optional(),
    folder: wordShape.pipe(archiveFolderShape).optional()
});

/** The shape of each stated kind, the fields the card states. */
const statedShape = z.discriminatedUnion('kind', [
    placeShape.extend({ kind: z.literal('library'), call: wordShape }),
    placeShape.extend({ kind: z.literal('request'), contact: wordShape }),
    placeShape.extend({
        kind: z.literal('derived'),
        from: z.union([wordsShape, wordShape.transform((one) => [one])]),
        script: wordShape
    })
]);

/**
 * A field of a fetched source, which a hole of its row reads: a flag (`false` reads as absent), a
 * word, or a list, not empty, of words or of maps of words (a `url` source's files).
 */
const fieldShape = z.union([
    z.boolean(),
    wordShape,
    wordsShape.min(1),
    z.array(z.record(z.string(), wordShape)).min(1)
]);

/** A fetched source: its kind, its place, and every other field a field its row may read. */
const fetchedShape = placeShape.extend({ kind: wordShape }).catchall(fieldShape);

/** A source names a `folder` only when it unpacks, since the folder is what the unpack takes. */
function whole(source: RecoverSource): boolean {
    return source.folder === undefined || source.unpack === true;
}

/** The fields a source holds, absent ones and `false` flags left out, so the wire is plain. */
function compacted(source: RecoverSource): RecoverSource {
    return Object.fromEntries(
        Object.entries(source).filter(([, value]) => value !== undefined && value !== false)
    ) as RecoverSource;
}

/** One row of `retrieval` read by its kind, or null when it does not fit. */
function sourceOf(row: unknown): RecoverSource | null {
    const kind = isMap(row) ? row.kind : undefined;
    const read =
        typeof kind === 'string' && statedKind(kind)
            ? statedShape.safeParse(row)
            : fetchedShape.safeParse(row);
    if (!read.success) return null;
    const source = compacted(read.data);
    return whole(source) ? source : null;
}

/** The rows of `retrieval`: the list, one source written as a map alone, or none. */
function rowsOf(value: unknown): unknown[] {
    if (Array.isArray(value)) return value as unknown[];
    return typeof value === 'object' && value !== null ? [value] : [];
}

/** Each row of `retrieval` read by its kind, in the list's order: its source, or null. */
function sourcesOf(value: unknown): (RecoverSource | null)[] {
    return rowsOf(value).map(sourceOf);
}

/** A dataset's sources as Recover reads them. */
export type Retrieval = { retrieval: RecoverSource[]; recover: boolean; unread?: string[] };

/**
 * A dataset's sources and whether Recover runs it: true when the list is not empty, every source
 * fits, and every kind is one a row of the hub's `recover.sources` reads (`kinds`, the rows'
 * keys). `unread` names each kind no row reads and the card does not state. One source written as
 * a map, without the list around it, reads as a list of one, as the schema check reads it.
 */
export function retrievalOf(value: unknown, kinds: ReadonlySet<string>): Retrieval {
    const read = sourcesOf(value);
    const retrieval = read.filter((source): source is RecoverSource => source !== null);
    const unread = [
        ...new Set(
            retrieval
                .map((source) => source.kind)
                .filter((kind) => !statedKind(kind) && !kinds.has(kind))
        )
    ];
    const recover =
        retrieval.length > 0 &&
        retrieval.length === read.length &&
        retrieval.every((source) => kinds.has(source.kind) && !statedKind(source.kind));
    return unread.length === 0 ? { retrieval, recover } : { retrieval, recover, unread };
}

/** The kind a row of `retrieval` names, as written, or `null` for a row that names none. */
function kindOf(row: unknown): string {
    const kind = typeof row === 'object' && row !== null ? (row as { kind?: unknown }).kind : null;
    return typeof kind === 'string' ? kind : JSON.stringify(kind ?? null);
}

/**
 * The rows of a dataset's `retrieval` that `retrievalOf` leaves out, each by its position in the
 * list and the kind it names, so validate reports exactly the sources the read drops.
 */
export function leftOutSources(value: unknown): { at: number; kind: string }[] {
    const rows = rowsOf(value);
    return sourcesOf(value).flatMap((source, at) =>
        source === null ? [{ at, kind: kindOf(rows[at]) }] : []
    );
}
