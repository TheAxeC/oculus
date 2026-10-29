// Layer 1, data. The grammar of a reader row: one row of `literature.sources`, `recover.sources` or
// `venues.browser` of a hub's `.oculus/config.yml`, which the one reader of server/core/reader/
// reads to send the requests the row describes and read the records and fields it names. A `links`
// row (`{ key, address }`) is the address a page link is built from. Every key is described here
// once, as a zod shape, so a row reads to the same typed value on the server and on the page.
//
// Every map of a row is strict: a key the grammar does not know is reported where it stands
// (check.ts) and dropped, so a typo costs that key and the row is still read. A value a key cannot
// take, a key the row's format needs that is missing, and an address that is not `https:` leave
// the row out. No key, path, parameter or header of any outside service is written here: every one
// of them is a value of a row.

import { z } from 'zod';

/** How an answer is read: JSON, XML, an HTML page read by CSS selectors, plain text, or none. */
const FORMATS = ['json', 'xml', 'html', 'text', 'none'] as const;

/** One answer format. */
export type Format = (typeof FORMATS)[number];

/**
 * The named operations a field record may apply to what its path or selector read. Each is
 * described in the options catalog's help of `fields`.
 */
const FIELD_OPS = [
    'inverted_index',
    'strip',
    'first_byte_size',
    'join',
    'date',
    'https',
    'first',
    'last',
    'match',
    'exists',
    'link',
    'split',
    'resolve'
] as const;

/** One field operation. */
type FieldOp = (typeof FIELD_OPS)[number];

/** The checksum kinds a file's checksum is read as. */
const CHECKSUM_KINDS = ['sha256', 'md5', 'sha1'] as const;

/** One checksum kind. */
export type ChecksumKind = (typeof CHECKSUM_KINDS)[number];

/** The ways a row pages its answers. */
const PAGING_KINDS = ['offset', 'page', 'cursor', 'next', 'link'] as const;

/** One paging kind. */
type PagingKind = (typeof PAGING_KINDS)[number];

/** The terms of the literature form a row maps, and the browser's and the lookups' own. */
const TERMS = [
    'words',
    'doi',
    'years',
    'type',
    'open_access',
    'venue',
    'author',
    'min_cited',
    'issn',
    'id'
] as const;

/** One term a row's `query` maps. */
export type TermName = (typeof TERMS)[number];

/** A text, or a number written for it, read as its text. */
const textShape = z.union([z.string(), z.number().transform(String)]);

/** A map of names to texts: parameters, headers, the values a term is joined by. */
const textsShape = z.record(z.string(), textShape);

/** A map of names to the value each must equal: a step's `when`, a records' `where`. */
const equalsShape = z.record(z.string(), textShape);

/**
 * A field record: where its value is read (`path` in JSON and XML, `select` with `attr` in HTML,
 * its text without one, `value` a constant), the operation applied to it with its arguments,
 * `each` a spec read on each element of a list, `map` the key whose listed values match the value
 * (compared without case), `kind` the checksum kind of the value, and `else` the spec read when
 * this one reads nothing. `markup` keeps an XML element's inner markup as its text.
 */
export type FieldRecord = {
    path?: string;
    select?: string;
    attr?: string;
    value?: string | number | boolean;
    op?: FieldOp;
    each?: FieldSpec;
    map?: Record<string, string[]>;
    kind?: ChecksumKind;
    else?: FieldSpec;
    prefix?: string;
    suffix?: string;
    by?: string;
    parts?: string[];
    pattern?: string;
    all?: true;
    link?: string;
    id?: string;
    host?: string;
    markup?: true;
};

/**
 * A field: a path, a text with `{name}` holes when it holds a `{`, or a field record.
 */
export type FieldSpec = string | FieldRecord;

const fieldSpecShape: z.ZodType<FieldSpec> = z.lazy(() =>
    z.union([
        z.string(),
        z.strictObject({
            path: z.string().optional(),
            select: z.string().optional(),
            attr: z.string().optional(),
            value: z.union([z.string(), z.number(), z.boolean()]).optional(),
            op: z.enum(FIELD_OPS).optional(),
            each: fieldSpecShape.optional(),
            map: z.record(z.string(), z.array(textShape)).optional(),
            kind: z.enum(CHECKSUM_KINDS).optional(),
            else: fieldSpecShape.optional(),
            prefix: z.string().optional(),
            suffix: z.string().optional(),
            by: z.string().optional(),
            parts: z.array(z.string()).optional(),
            pattern: z.string().optional(),
            all: z.literal(true).optional(),
            link: z.string().optional(),
            id: z.string().optional(),
            host: z.string().optional(),
            markup: z.literal(true).optional()
        })
    ])
);

/** The fields of a record, by the name each value is kept under. */
const fieldsShape = z.record(z.string(), fieldSpecShape);

/**
 * Where an answer's records are: a path (`.` the answer itself), or a record naming the path, the
 * selector, the entry field whose items are the records (a row of format `none`), or the operation
 * that reads them (`checksum_file`, a line per file of a hex digest of `kind` and a name).
 * `absent: none` reads a missing path as no records instead of an answer that is not the row's;
 * `where` and `unless` keep the records whose fields equal, or do not equal, the values given;
 * `first` keeps the first record alone and refuses an answer with none; `refuse_when` names a path
 * whose value in any record refuses the answer.
 */
export type RecordsSpec =
    | string
    | {
          path?: string;
          select?: string;
          field?: string;
          op?: 'checksum_file';
          kind?: ChecksumKind;
          absent?: 'none';
          where?: Record<string, string>;
          unless?: Record<string, string>;
          first?: true;
          refuse_when?: string;
      };

const recordsShape: z.ZodType<RecordsSpec> = z.union([
    z.string(),
    z.strictObject({
        path: z.string().optional(),
        select: z.string().optional(),
        field: z.string().optional(),
        op: z.literal('checksum_file').optional(),
        kind: z.enum(CHECKSUM_KINDS).optional(),
        absent: z.literal('none').optional(),
        where: equalsShape.optional(),
        unless: equalsShape.optional(),
        first: z.literal(true).optional(),
        refuse_when: z.string().optional()
    })
]);

/**
 * How one term of a request is sent: as `text` (with holes) in the parameter `param`, one text per
 * word or quoted phrase with `per_word`, or, for a lookup, at its own `address`, with `match` the
 * pattern whose capture is the value sent (an answer that does not fit sits the search out).
 * `params` are sent with the term alone, beside its parameter or with its lookup, and `headers`
 * with its lookup; `missing: none` reads a 404 as no hit; `records`, `fields` and `format` read a
 * lookup's answer; `by` names the hit field a lookup by id takes.
 */
export type Term = {
    param?: string;
    text?: string;
    address?: string;
    match?: string;
    per_word?: true;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    missing?: 'none';
    records?: RecordsSpec;
    fields?: Record<string, FieldSpec>;
    format?: Format;
    by?: string;
};

const termShape: z.ZodType<Term> = z.strictObject({
    param: z.string().optional(),
    text: textShape.optional(),
    address: z.string().optional(),
    match: z.string().optional(),
    per_word: z.literal(true).optional(),
    params: textsShape.optional(),
    headers: textsShape.optional(),
    missing: z.literal('none').optional(),
    records: recordsShape.optional(),
    fields: fieldsShape.optional(),
    format: z.enum(FORMATS).optional(),
    by: z.string().optional()
});

/**
 * How a row pages: by an `offset` or a `page` number (from `first`) in `param`, by a `cursor` the
 * answer's `from` path names, sent in `param` (in the body with `in: body`, `start` the first one),
 * by the `next` address the answer's `from` path names, or by the `Link` header's next address.
 * `size` is the parameter of the page size, `sizes` the page sizes offered (the first is a
 * listing's), `max` the most a page holds, and `total` where the answer states its count.
 */
export type Paging = {
    kind: PagingKind;
    param?: string;
    first?: number;
    size?: string;
    sizes?: number[];
    max?: number;
    total?: FieldSpec;
    from?: string;
    in?: 'body';
    start?: string;
};

const pagingShape: z.ZodType<Paging> = z.strictObject({
    kind: z.enum(PAGING_KINDS),
    param: z.string().optional(),
    first: z.number().int().min(0).optional(),
    size: z.string().optional(),
    sizes: z.array(z.number().int().min(1)).min(1).optional(),
    max: z.number().int().min(1).optional(),
    total: fieldSpecShape.optional(),
    from: z.string().optional(),
    in: z.literal('body').optional(),
    start: z.string().optional()
});

/**
 * One secret a row's requests carry, read from the `downloads` row named `row`: in the header
 * `header` after `prefix`, in the parameter `param`, or with `basic` as the user and secret of
 * Basic. `required` keeps the row off without it; `help` says where the secret is made.
 */
export type Auth = {
    header?: string;
    param?: string;
    basic?: true;
    row: string;
    prefix?: string;
    required?: true;
    help?: string;
};

/**
 * How a download carries the secret of a row's first `auth` entry: as Basic with the user, or in
 * a header after its prefix.
 */
export type Credential = { basic: true } | { header: string; prefix?: string };

const authShape: z.ZodType<Auth> = z.strictObject({
    header: z.string().optional(),
    param: z.string().optional(),
    basic: z.literal(true).optional(),
    row: z.string().min(1),
    prefix: z.string().optional(),
    required: z.literal(true).optional(),
    help: z.string().optional()
});

/**
 * A request a row asks again with each folder record's id, the record's `folder` field added to
 * the names below it, down to `max_depth` folders.
 */
type Recurse = {
    when: Record<string, string>;
    id: string;
    folder: string;
    max_depth: number;
};

const recurseShape: z.ZodType<Recurse> = z.strictObject({
    when: equalsShape,
    id: z.string(),
    folder: z.string(),
    max_depth: z.number().int().min(0)
});

/** A body sent as JSON: texts with holes, lists and maps of them. */
type BodyValue = string | number | boolean | BodyValue[] | { [key: string]: BodyValue };

const bodyShape: z.ZodType<BodyValue> = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(bodyShape),
        z.record(z.string(), bodyShape)
    ])
);

/** What a request shares, of a row and of a follow-up step. */
type RequestKeys = {
    address?: string;
    format?: Format;
    method?: 'post';
    body?: Record<string, BodyValue>;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    paging?: Paging;
    records?: RecordsSpec;
    fields?: Record<string, FieldSpec>;
    recurse?: Recurse;
    then?: Step[];
    for_each?: string;
};

/**
 * A follow-up request: one with the ids of the records before it joined by commas in `ids`, one per
 * record with `for_each` (the record field whose value fills the hole of that name), or recursing.
 * `when` and `unless` pick the records it takes; `order_by` names the path in each of its records
 * that holds the id it was asked for, so its records come in the order of the ids.
 */
export type Step = RequestKeys & {
    ids?: string;
    order_by?: string;
    when?: Record<string, string>;
    unless?: Record<string, string>;
};

const requestKeys = {
    address: z.string().optional(),
    format: z.enum(FORMATS).optional(),
    method: z.literal('post').optional(),
    body: z.record(z.string(), bodyShape).optional(),
    params: textsShape.optional(),
    headers: textsShape.optional(),
    paging: pagingShape.optional(),
    records: recordsShape.optional(),
    fields: fieldsShape.optional(),
    recurse: recurseShape.optional(),
    for_each: z.string().optional()
};

const stepShape: z.ZodType<Step> = z.lazy(() =>
    z.strictObject({
        ...requestKeys,
        then: z.array(stepShape).optional(),
        ids: z.string().optional(),
        order_by: z.string().optional(),
        when: equalsShape.optional(),
        unless: equalsShape.optional()
    })
);

/** A label and the parameters it sends: a filter's `{value}` the value the reader picks. */
type Choice = { label: string; params: Record<string, string> };

const choiceShape: z.ZodType<Choice> = z.strictObject({
    label: z.string().min(1),
    params: textsShape
});

/**
 * A Recover row's whole-set download: its `address`, the file's `name` (without one, the last part
 * of the address the probe ends at, fetched from there, which must fit `match`), and `when`, the
 * entry field that, set true, makes the download the listing; without `when` the row's request is
 * asked first and must hold records.
 */
type Archive = { address: string; name?: string; match?: string; when?: string };

const archiveShape: z.ZodType<Archive> = z.strictObject({
    address: z.string(),
    name: z.string().optional(),
    match: z.string().optional(),
    when: z.string().optional()
});

/** The entry field whose values pick the files listed, compared with `by` (the name by default). */
type Pick = { field: string; by?: string; glob?: true };

const pickShape: z.ZodType<Pick> = z.strictObject({
    field: z.string(),
    by: z.string().optional(),
    glob: z.literal(true).optional()
});

/** A selector an html answer must hold, with `holds` a text its element must hold. */
export type Expect = { select: string; holds?: string };

const expectShape: z.ZodType<Expect> = z.strictObject({
    select: z.string(),
    holds: z.string().optional()
});

/** One reader row. */
export type ReaderRow = RequestKeys & {
    key: string;
    name: string;
    format: Format;
    query?: Partial<Record<TermName, Term>>;
    join?: Record<string, string>;
    skip_when?: TermName[];
    types?: Record<string, string>;
    types_only?: true;
    filters?: Choice[];
    sorts?: Choice[];
    pace?: { gap?: number; gap_with_key?: number; field?: string };
    wait?: { retry_after?: string; reset?: string; remaining?: string };
    auth?: Auth[];
    contact?: string;
    expect?: Expect;
    none_when?: string;
    archive?: Archive;
    access?: { address: string };
    pick?: Pick;
    clash?: string;
    holes?: Record<string, string>;
    given?: Record<string, string>;
};

const pacingNumber = z.number().int().min(0);

export const readerRowShape: z.ZodType<ReaderRow> = z.strictObject({
    ...requestKeys,
    then: z.array(stepShape).optional(),
    key: z.string(),
    name: z.string().min(1),
    format: z.enum(FORMATS),
    query: z.partialRecord(z.enum(TERMS), termShape).optional(),
    join: textsShape.optional(),
    skip_when: z.array(z.enum(TERMS)).optional(),
    types: textsShape.optional(),
    types_only: z.literal(true).optional(),
    filters: z.array(choiceShape).optional(),
    sorts: z.array(choiceShape).optional(),
    pace: z
        .strictObject({
            gap: pacingNumber.optional(),
            gap_with_key: pacingNumber.optional(),
            field: z.string().optional()
        })
        .optional(),
    wait: z
        .strictObject({
            retry_after: z.string().optional(),
            reset: z.string().optional(),
            remaining: z.string().optional()
        })
        .optional(),
    auth: z.array(authShape).optional(),
    contact: z.string().optional(),
    expect: expectShape.optional(),
    none_when: z.string().optional(),
    archive: archiveShape.optional(),
    access: z.strictObject({ address: z.string() }).optional(),
    pick: pickShape.optional(),
    clash: z.string().optional(),
    holes: textsShape.optional(),
    given: textsShape.optional()
});

/** A page link: the address of `key`, with `{id}` and the holes filled from a hit's fields. */
export type LinkRow = { key: string; address: string };

export const linkRowShape: z.ZodType<LinkRow> = z.strictObject({
    key: z.string(),
    address: z.string()
});

/**
 * The orders the Literature search's merge takes a field from, each a list of row keys: `fields`
 * for the title, venue, year, date and type, `abstract`, and `pdf`, a row not listed in `pdf`
 * giving no open PDF.
 */
export type LiteraturePrefer = { fields: string[]; abstract: string[]; pdf: string[] };

export const literaturePreferShape: z.ZodType<LiteraturePrefer> = z.strictObject({
    fields: z.array(z.string()).default([]),
    abstract: z.array(z.string()).default([]),
    pdf: z.array(z.string()).default([])
});
