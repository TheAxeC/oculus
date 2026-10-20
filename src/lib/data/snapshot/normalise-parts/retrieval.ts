// Layer 1, data. A dataset's `retrieval` list read once into its typed sources, each by its
// `kind`, and whether Recover runs the set. The server's Recover reads this result and parses
// nothing again; the card reads it for the call, the contact or the origin of a set Recover does
// not run.
//
// A source that does not fit its kind is left out of the list, and a set holding one is no set
// Recover runs, so a recipe with a missing or malformed field is never half fetched. Validate
// reports each source left out (`checkDatasetSources` of data/snapshot/validate-kinds.ts), since
// the schema check states neither the form of a folder inside an archive nor a field that holds
// only beside another. The rule for a name inside a folder, `safeName`, lives here because the
// registry's `folder` and the server's listing of files both follow it.

import { z } from 'zod';
import { FETCHED_KINDS, type RecoverSource } from '../../model/model-entities.ts';
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

/** A text the file writes as words or as a number (a Zenodo record, a version). */
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

/** A file of a `url` source, with at most one of its checksums. */
const urlShape = z
    .object({
        url: wordShape,
        sha256: wordShape.optional(),
        md5: wordShape.optional(),
        name: wordShape.optional()
    })
    .refine((one) => one.sha256 === undefined || one.md5 === undefined);

/** The shape of each kind, the fields its sources take. */
const sourceShape = z.discriminatedUnion('kind', [
    placeShape.extend({
        kind: z.literal('physionet'),
        project: wordShape,
        version: wordShape,
        files: wordsShape.optional(),
        archive: flagShape,
        throttle: wordShape.optional()
    }),
    placeShape.extend({
        kind: z.literal('zenodo'),
        record: wordShape,
        files: wordsShape.optional()
    }),
    placeShape.extend({
        kind: z.literal('figshare'),
        collection: wordShape.optional(),
        article: wordShape.optional(),
        files: wordsShape.optional()
    }),
    placeShape.extend({
        kind: z.literal('dandi'),
        dandiset: wordShape,
        version: wordShape,
        assets: wordsShape.optional()
    }),
    placeShape.extend({
        kind: z.literal('huggingface'),
        repo: wordShape,
        patterns: wordsShape.optional()
    }),
    placeShape.extend({
        kind: z.literal('stanford'),
        druid: wordShape,
        files: wordsShape.optional()
    }),
    placeShape.extend({ kind: z.literal('geo'), accession: wordShape, files: wordsShape }),
    placeShape.extend({ kind: z.literal('kaggle'), dataset: wordShape }),
    placeShape.extend({
        kind: z.literal('tcia'),
        collection: wordShape,
        series: wordsShape.optional()
    }),
    placeShape.extend({ kind: z.literal('synapse'), ids: wordsShape.min(1) }),
    placeShape.extend({ kind: z.literal('url'), urls: z.array(urlShape).min(1) }),
    placeShape.extend({ kind: z.literal('library'), call: wordShape }),
    placeShape.extend({ kind: z.literal('request'), contact: wordShape }),
    placeShape.extend({
        kind: z.literal('derived'),
        from: z.union([wordsShape, wordShape.transform((one) => [one])]),
        script: wordShape
    })
]);

/**
 * A source whose fields hold together: a figshare source names a collection or an article, and a
 * source names a `folder` only when it unpacks, since the folder is what the unpack takes.
 */
function whole(source: RecoverSource): boolean {
    if (source.folder !== undefined && source.unpack !== true) return false;
    return (
        source.kind !== 'figshare' ||
        source.collection !== undefined ||
        source.article !== undefined
    );
}

/** The fields a source holds, absent ones left out, so the wire carries no `undefined`. */
function compacted(source: RecoverSource): RecoverSource {
    return Object.fromEntries(
        Object.entries(source).filter(([, value]) => value !== undefined)
    ) as RecoverSource;
}

/** The rows of `retrieval`: the list, one source written as a map alone, or none. */
function rowsOf(value: unknown): unknown[] {
    if (Array.isArray(value)) return value as unknown[];
    return typeof value === 'object' && value !== null ? [value] : [];
}

/** Each row of `retrieval` read by its kind, in the list's order: its source, or null. */
function sourcesOf(value: unknown): (RecoverSource | null)[] {
    return rowsOf(value).map((row) => {
        const read = sourceShape.safeParse(row);
        return read.success && whole(read.data) ? compacted(read.data) : null;
    });
}

/**
 * A dataset's sources and whether Recover runs it: true when the list is not empty, every source
 * fits its kind, and every kind is one Recover fetches. One source written as a map, without the
 * list around it, reads as a list of one, as the schema check reads it.
 */
export function retrievalOf(value: unknown): { retrieval: RecoverSource[]; recover: boolean } {
    const read = sourcesOf(value);
    const retrieval = read.filter((source): source is RecoverSource => source !== null);
    const fetched = new Set<string>(FETCHED_KINDS);
    const recover =
        retrieval.length > 0 &&
        retrieval.length === read.length &&
        retrieval.every((source) => fetched.has(source.kind));
    return { retrieval, recover };
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
