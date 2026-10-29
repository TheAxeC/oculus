// Layer 2, server. The one reader: it sends the requests a row of configuration describes and reads
// the records and fields the row names. The Literature search asks a row for one page, the journal
// browser for one page or one lookup, and Recover for every page and every follow-up request.
//
// A request is the row's (or a step's) address with its holes filled and encoded, then the
// parameters: the terms of a search, the page's, the fixed ones, the contact address and the
// secrets of the row's `auth`. The secrets go on every request of the row and nowhere else, and
// every request goes through the setup's `run`, which paces the row's requests. An answer is
// parsed in its format and checked against the row's `expect`; one holding `none_when` holds no
// records; its records are read where `records` says and each record's fields as `fields` names
// them. A step of `then` asks once per record it takes (its `for_each` binds that record's field
// to the hole of the same name), or once for the ids of every record it takes (`ids`, the hole
// `{ids}`); a step with `records` replaces the record it took by its own records, and a step
// without them adds the fields it reads to the record. A record the `recurse` of its request names
// is asked again as a folder, its name added to `{folders}`, and a folder past `max_depth` stops
// the reading. A record no step with records takes is dropped, unless its request has no such
// step. A row of format `none` sends no request of its own: its records are the items of the
// entry field its `records` names (a `url` source's addresses).
//
// A hole is read first from the value a step or a folder binds, then from the record's own paths,
// then from the folder names, the request before and the entry. Every failure is a ReaderStop
// naming the row's `name`: an address that does not fill, an answer that does not parse, a missing
// `expect`, records that are no list and a next address off the row's origin are each `answer`.

import type {
    FieldSpec,
    LinkRow,
    ReaderRow,
    RecordsSpec,
    Step,
    Term
} from '../../../data/sources/config/settings/rows/grammar.ts';
import {
    fillAddress,
    fillText,
    type Lookup
} from '../../../data/sources/config/settings/rows/holes.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { ReaderStop, send, type Outgoing, type Sender } from './call.ts';
import { readField, readFields } from './fields.ts';
import { holdsExpected, holdsNone, parseAnswer, recordsOf, type Parsed } from './formats.ts';
import { FIRST, nextPage, pageParams, sizeOf, type PageState } from './paging.ts';
import { readPath, scalarText } from './path.ts';
import { applyAuth, withParams, type Account, type Applied } from './request.ts';

/** What every reading is given: the sender, the machine's rows and the pacing of the row. */
export type Setup = {
    sender: Sender;
    /** The `downloads` rows of the machine, read by the row's `auth`. */
    downloads: readonly Account[];
    /** The `links` rows a field's `link` reads. */
    links: readonly LinkRow[];
    /** The contact address the row's `contact` parameter carries. */
    contact?: string;
    /** Runs one request of the row, in the row's turn and after its gap. */
    run?: <T>(task: () => Promise<T>) => Promise<T>;
};

/** One record read: its value, its fields, the holes it fills, its place in its page. */
export type Item = {
    record: unknown;
    fields: Record<string, unknown>;
    holes: Lookup;
    /** The place of the row's record it came from, from 0 over the pages read. */
    at: number;
    /** The address of the answer it was read from. */
    base: string;
};

/** Picks a row's items, after every page of the row and before its steps without records. */
export type Finish = (items: Item[]) => Item[];

/** What one reading shares between its requests. */
type Reading = {
    row: ReaderRow;
    setup: Setup;
    applied: Applied;
    /**
     * Set for a reading of every page: the row's items are picked by it, and the row's steps
     * without records add their fields, once the last page is read.
     */
    finish?: Finish;
};

/** A spec a request is built from: the row itself or one of its steps. */
type Spec = ReaderRow | Step;

/** Where a request stands: its binding, the holes around it, its folders, depth and page. */
type Asking = {
    /** The value a step's `for_each` or a folder binds, read before the record's paths. */
    binding: Lookup;
    /** The holes of the request before, the folder names and the entry. */
    holes: Lookup;
    folders: string;
    depth: number;
    state: PageState;
    size: number | undefined;
    /** Parameters sent before the page's and the fixed ones: a search's terms and choices. */
    params?: [string, string][];
};

/** An answer read: the parsed answer, the address it came from and its headers. */
type Answered = { parsed: Parsed; base: string; headers: Headers };

/** No hole. */
const NONE: Lookup = () => undefined;

/** A lookup that reads a name off a chain of lookups, the first that holds a value winning. */
function chained(...lookups: Lookup[]): Lookup {
    return (name) => {
        for (const read of lookups) {
            const value = read(name);
            if (value !== undefined) return value;
        }
        return undefined;
    };
}

/** The holes a record fills: the values of its paths that are a text, a number or a flag. */
function recordHoles(record: unknown): Lookup {
    return (name) => {
        if (!isMap(record)) return undefined;
        const value = readPath(record, name);
        return Array.isArray(value) ? undefined : scalarText(value);
    };
}

/** A lookup of one name. */
function bound(name: string, value: unknown): Lookup {
    return (asked) => (asked === name ? value : undefined);
}

/** The value of a record's field a step or a folder binds, else the hole of that name. */
function fieldOf(item: Item, path: string): unknown {
    return scalarText(readPath(item.record, path)) ?? item.holes(path);
}

/** The names of the XML elements a spec's fields read as their markup. */
function markupOf(fields: Record<string, FieldSpec> | undefined): string[] {
    const names: string[] = [];
    const walk = (spec: FieldSpec | undefined): void => {
        if (spec === undefined || typeof spec === 'string') return;
        if (spec.markup === true && spec.path !== undefined) {
            const last = spec.path.split('.').pop() ?? '';
            names.push(last.replace(/\[[^\]]*\]/g, ''));
        }
        walk(spec.each);
        walk(spec.else);
    };
    for (const spec of Object.values(fields ?? {})) walk(spec);
    return names;
}

/** A body's values with their holes filled as written; a text whose holes do not fill is none. */
function filledBody(value: unknown, holes: Lookup): unknown {
    if (typeof value === 'string') return fillText(value, holes);
    if (Array.isArray(value)) return value.map((one) => filledBody(one, holes));
    if (isMap(value)) {
        const out: Record<string, unknown> = {};
        for (const [key, one] of Object.entries(value)) out[key] = filledBody(one, holes);
        return out;
    }
    return value;
}

/** Fixed parameters with their holes filled; a parameter whose holes do not fill is left out. */
function fixedParams(
    params: Record<string, string> | undefined,
    holes: Lookup
): [string, string][] {
    return Object.entries(params ?? {}).flatMap(([name, text]): [string, string][] => {
        const value = fillText(text, holes);
        return value === undefined ? [] : [[name, value]];
    });
}

/** The parameters every request of the row carries: the contact address and the secrets. */
function rowParams(reading: Reading): [string, string][] {
    const { row, setup, applied } = reading;
    const contact: [string, string][] =
        row.contact !== undefined && setup.contact !== undefined && setup.contact !== ''
            ? [[row.contact, setup.contact]]
            : [];
    return [...contact, ...applied.params];
}

/** One request of a spec, or the stop `answer` when its address does not fill. */
function outgoing(spec: Spec, asking: Asking, reading: Reading): Outgoing {
    const holes = chained(asking.binding, asking.holes);
    const page = pageParams(spec.paging, asking.state, asking.size);
    const headers: Record<string, string> = {};
    for (const [key, text] of Object.entries(spec.headers ?? {})) {
        const value = fillText(text, holes);
        if (value !== undefined) headers[key] = value;
    }
    Object.assign(headers, reading.applied.headers);
    let url: string;
    if (asking.state.next !== undefined) {
        url = withParams(asking.state.next, rowParams(reading));
    } else {
        const address = fillAddress(spec.address ?? '', holes);
        if (address === undefined || address === '') {
            throw new ReaderStop(reading.row.name, 'answer');
        }
        url = withParams(address, [
            ...(asking.params ?? []),
            ...page.params,
            ...fixedParams(spec.params, holes),
            ...rowParams(reading)
        ]);
    }
    const request: Outgoing = { url, headers };
    if (spec.method === 'post' || spec.body !== undefined) {
        request.method = 'POST';
        const body = filledBody(spec.body ?? {}, holes) as Record<string, unknown>;
        if (page.body !== undefined) body[page.body[0]] = page.body[1];
        request.body = JSON.stringify(body);
    }
    return request;
}

/** One request sent in the row's turn, its answer parsed in the spec's format. */
async function asked(spec: Spec, request: Outgoing, reading: Reading): Promise<Answered> {
    const { row, setup } = reading;
    const task = (): ReturnType<typeof send> => send(setup.sender, request, row);
    const reply = await (setup.run === undefined ? task() : setup.run(task));
    const parsed = parseAnswer(spec.format ?? row.format, reply.text, markupOf(spec.fields));
    if (parsed === null) throw new ReaderStop(row.name, 'answer');
    return { parsed, base: reply.url, headers: reply.headers };
}

/** The tree of an answer, or null for a page. */
function treeOf(parsed: Parsed): unknown {
    return parsed.kind === 'tree' ? parsed.tree : null;
}

/** The records an answer holds, or the answer itself as its one record when no path names them. */
function answerRecords(
    spec: RecordsSpec | undefined,
    parsed: Parsed,
    entry: Lookup,
    name: string
): { records: unknown[]; got: number } {
    if (spec === undefined) {
        return { records: [parsed.kind === 'tree' ? parsed.tree : parsed.root], got: 1 };
    }
    const read = recordsOf(spec, parsed, entry);
    if ('refused' in read) throw new ReaderStop(name, 'answer');
    return read;
}

/** The items of records, each with its fields read and the holes it fills. */
function itemsOf(
    records: unknown[],
    fields: Record<string, FieldSpec> | undefined,
    asking: Pick<Asking, 'binding' | 'holes' | 'folders'>,
    reading: Reading,
    base: string
): Item[] {
    return records.map((record, at) => {
        const holes = chained(
            asking.binding,
            recordHoles(record),
            bound('folders', asking.folders),
            asking.holes
        );
        const values = readFields(fields ?? {}, {
            record,
            holes,
            links: reading.setup.links,
            base,
            specs: fields ?? {}
        });
        return { record, fields: values, holes, at, base };
    });
}

/** Whether a record holds every value `when` names and none `unless` names. */
function takes(
    record: unknown,
    when?: Record<string, string>,
    unless?: Record<string, string>
): boolean {
    const equal = ([path, value]: [string, string]): boolean =>
        scalarText(readPath(record, path)) === value;
    if (when !== undefined && !Object.entries(when).every(equal)) return false;
    return unless === undefined || !Object.entries(unless).some(equal);
}

/**
 * The count of records an answer states, null when it states none: a field of the answer, or of the
 * page's root for a page.
 */
function totalOf(spec: Spec, parsed: Parsed, reading: Reading): number | null {
    if (spec.paging?.total === undefined) return null;
    const value = readField(spec.paging.total, {
        record: parsed.kind === 'tree' ? parsed.tree : parsed.root,
        holes: NONE,
        links: reading.setup.links,
        base: '',
        specs: {}
    });
    const text = scalarText(value);
    const count = text === undefined || text.trim() === '' ? NaN : Number(text);
    return Number.isInteger(count) && count >= 0 ? count : null;
}

/** What one page of a spec read: its items, how many records it held, and the next page. */
type PageRead = { items: Item[]; got: number; total: number | null; next: PageState | null };

/** One page of a spec read, with the row's checks on an answer of the row's own address. */
async function onePage(spec: Spec, asking: Asking, reading: Reading): Promise<PageRead> {
    const { row } = reading;
    const answer = await asked(spec, outgoing(spec, asking, reading), reading);
    const own = spec === row;
    if (own && row.expect !== undefined && !holdsExpected(answer.parsed, row.expect)) {
        throw new ReaderStop(row.name, 'answer');
    }
    const total = totalOf(spec, answer.parsed, reading);
    if (own && row.none_when !== undefined && holdsNone(answer.parsed, row.none_when)) {
        return { items: [], got: 0, total, next: null };
    }
    const holes = chained(asking.binding, asking.holes);
    const { records, got } = answerRecords(spec.records, answer.parsed, holes, row.name);
    const items = itemsOf(records, spec.fields, asking, reading, answer.base);
    const stepped = await steps(spec, items, asking, reading);
    const next = nextPage(row, spec.paging, asking.state, asking.size, {
        tree: treeOf(answer.parsed),
        headers: answer.headers,
        got,
        total
    });
    if (next === 'answer') throw new ReaderStop(row.name, 'answer');
    const start = asking.state.offset;
    return { items: stepped.map((item) => ({ ...item, at: start + item.at })), got, total, next };
}

/** Every page of a spec read, the items in the order of the pages. */
async function allPages(
    spec: Spec,
    asking: Omit<Asking, 'state' | 'size'>,
    reading: Reading
): Promise<Item[]> {
    const size = sizeOf(spec.paging);
    const items: Item[] = [];
    for (let state: PageState | null = FIRST; state !== null;) {
        const page = await onePage(spec, { ...asking, state, size }, reading);
        items.push(...page.items);
        state = page.next;
    }
    return items;
}

/** The items one step makes of an item it takes, each keeping the item's place. */
async function stepOf(step: Step, item: Item, asking: Asking, reading: Reading): Promise<Item[]> {
    const binding =
        step.for_each === undefined ? NONE : bound(step.for_each, fieldOf(item, step.for_each));
    const read = await allPages(
        step,
        { binding, holes: item.holes, folders: asking.folders, depth: asking.depth },
        reading
    );
    return read.map((one) => ({ ...one, at: item.at }));
}

/**
 * The items a step that asks by `ids` makes of the items it takes: one request for the ids of all,
 * and with `order_by` each item given the record that names its id, so the records keep the order
 * of the ids; without it every record goes to the first item.
 */
async function idsStep(
    step: Step,
    items: Item[],
    asking: Asking,
    reading: Reading
): Promise<Map<Item, Item[]>> {
    const path = step.ids ?? '.';
    const taken = items.filter((item) => takes(item.record, step.when, step.unless));
    const idOf = (item: Item): string | undefined => scalarText(readPath(item.record, path));
    const ids = taken.map(idOf).filter((one): one is string => one !== undefined);
    const out = new Map<Item, Item[]>(taken.map((item) => [item, []]));
    if (ids.length === 0) return out;
    const read = await allPages(
        step,
        {
            binding: bound('ids', ids.join(',')),
            holes: asking.holes,
            folders: asking.folders,
            depth: asking.depth
        },
        reading
    );
    const order = step.order_by;
    if (order === undefined) {
        out.set(
            taken[0],
            read.map((one) => ({ ...one, at: taken[0].at }))
        );
        return out;
    }
    for (const item of taken) {
        const id = idOf(item);
        const found = read.find((one) => scalarText(readPath(one.record, order)) === id);
        out.set(item, found === undefined ? [] : [{ ...found, at: item.at }]);
    }
    return out;
}

/** A folder record read as a folder one level down, or the stop past the deepest level. */
async function recursed(spec: Spec, item: Item, asking: Asking, reading: Reading): Promise<Item[]> {
    const recurse = spec.recurse;
    if (recurse === undefined) return [];
    if (asking.depth + 1 > recurse.max_depth) throw new ReaderStop(reading.row.name, 'answer');
    const name = scalarText(readPath(item.record, recurse.folder)) ?? '';
    const read = await allPages(
        spec,
        {
            binding: bound(recurse.id, fieldOf(item, recurse.id)),
            holes: asking.holes,
            folders: `${asking.folders}${name}/`,
            depth: asking.depth + 1
        },
        reading
    );
    return read.map((one) => ({ ...one, at: item.at }));
}

/** An item with the fields a step without records reads off its answer added. */
async function merged(step: Step, item: Item, asking: Asking, reading: Reading): Promise<Item> {
    const read = await stepOf(step, item, asking, reading);
    const fields: Record<string, unknown> = { ...item.fields };
    for (const one of read) Object.assign(fields, one.fields);
    return { ...item, fields };
}

/** A spec's items with the fields its steps without records read added to each. */
async function added(spec: Spec, items: Item[], asking: Asking, reading: Reading): Promise<Item[]> {
    const adders = (spec.then ?? []).filter((step) => step.records === undefined);
    const out: Item[] = [];
    for (let item of items) {
        for (const step of adders) {
            if (takes(item.record, step.when, step.unless)) {
                item = await merged(step, item, asking, reading);
            }
        }
        out.push(item);
    }
    return out;
}

/**
 * A spec's items after its `recurse` and the steps of its `then`; for the row of a reading of
 * every page, without the steps that add fields, which run once the last page is read.
 */
async function steps(spec: Spec, items: Item[], asking: Asking, reading: Reading): Promise<Item[]> {
    const then = spec.then ?? [];
    const takers = then.filter((step) => step.records !== undefined);
    const batched = new Map<Step, Map<Item, Item[]>>();
    for (const step of takers) {
        if (step.ids !== undefined) batched.set(step, await idsStep(step, items, asking, reading));
    }
    const out: Item[] = [];
    for (const item of items) {
        if (spec.recurse !== undefined && takes(item.record, spec.recurse.when)) {
            out.push(...(await recursed(spec, item, asking, reading)));
        } else if (takers.length === 0) {
            out.push(item);
        } else {
            for (const step of takers) {
                const batch = batched.get(step);
                if (batch !== undefined) out.push(...(batch.get(item) ?? []));
                else if (takes(item.record, step.when, step.unless)) {
                    out.push(...(await stepOf(step, item, asking, reading)));
                }
            }
        }
    }
    if (spec === reading.row && reading.finish !== undefined) return out;
    return added(spec, out, asking, reading);
}

/** The reading of a row with its secrets applied, or the stop for a required secret missing. */
function readingOf(row: ReaderRow, setup: Setup, finish?: Finish): Reading {
    const applied = applyAuth(row.auth, setup.downloads);
    if (applied.missing !== undefined) throw new ReaderStop(row.name, 'refused');
    return { row, setup, applied, ...(finish === undefined ? {} : { finish }) };
}

/** The entry's holes, each value the row's `holes` gives a pattern for checked against it. */
function entryHoles(row: ReaderRow, entry: Lookup): Lookup {
    for (const [name, pattern] of Object.entries(row.holes ?? {})) {
        const value = entry(name);
        if (value === undefined) continue;
        const values = Array.isArray(value) ? (value as unknown[]) : [value];
        const test = new RegExp(pattern);
        if (!values.every((one) => typeof one === 'string' && test.test(one))) {
            throw new ReaderStop(row.name, 'answer');
        }
    }
    return entry;
}

/** What one page of a row is asked with. */
export type PageAsk = {
    state: PageState;
    size: number | undefined;
    /** The parameters of a search's terms and choices, sent before the page's. */
    params: [string, string][];
};

/** One page of a row: its items, the records it held, the count it states and the next page. */
export type RowPage = PageRead & { start: number };

/** One page of a row read, with its steps. */
export async function readPage(row: ReaderRow, ask: PageAsk, setup: Setup): Promise<RowPage> {
    const reading = readingOf(row, setup);
    const page = await onePage(
        row,
        { binding: NONE, holes: NONE, folders: '', depth: 0, ...ask },
        reading
    );
    return { ...page, start: ask.state.offset };
}

/**
 * The items of a lookup at a term's own address (`query.doi`, `query.issn`, `query.id`), read
 * with the term's records and fields, else the row's; a 404 is no item when the term says
 * `missing: none`, and an answer holding the row's `none_when` holds none.
 */
export async function readLookup(
    row: ReaderRow,
    term: Term,
    holes: Lookup,
    setup: Setup
): Promise<Item[]> {
    const reading = readingOf(row, setup);
    const spec: Step = { address: term.address ?? '', format: term.format ?? row.format };
    if (term.params !== undefined) spec.params = term.params;
    if (term.headers !== undefined) spec.headers = term.headers;
    if (term.records !== undefined) spec.records = term.records;
    const fields = term.fields ?? row.fields;
    if (fields !== undefined) spec.fields = fields;
    const asking: Asking = {
        binding: NONE,
        holes,
        folders: '',
        depth: 0,
        state: FIRST,
        size: undefined
    };
    try {
        const answer = await asked(spec, outgoing(spec, asking, reading), reading);
        if (row.none_when !== undefined && holdsNone(answer.parsed, row.none_when)) return [];
        const { records } = answerRecords(spec.records, answer.parsed, holes, row.name);
        return itemsOf(records, spec.fields, asking, reading, answer.base);
    } catch (error) {
        const absent = error instanceof ReaderStop && error.status === 404;
        if (term.missing === 'none' && absent) return [];
        throw error;
    }
}

/** The row's items of an entry over every page, before `finish` and the steps that add fields. */
async function rowItems(
    row: ReaderRow,
    top: Omit<Asking, 'state' | 'size'>,
    reading: Reading
): Promise<Item[]> {
    for (const [field, path] of Object.entries(row.given ?? {})) {
        const value = top.holes(field);
        if (value === undefined) continue;
        const items = itemsOf([{ [path]: value }], row.fields, top, reading, row.address ?? '');
        return steps(row, items, { ...top, state: FIRST, size: undefined }, reading);
    }
    if (row.format === 'none') {
        const read =
            row.records === undefined
                ? ({ refused: 'answer' } as const)
                : recordsOf(row.records, null, top.holes);
        if ('refused' in read) throw new ReaderStop(row.name, 'answer');
        const items = itemsOf(read.records, row.fields, top, reading, '');
        return steps(row, items, { ...top, state: FIRST, size: undefined }, reading);
    }
    if (row.for_each === undefined) return allPages(row, top, reading);
    const values = top.holes(row.for_each);
    const list = Array.isArray(values)
        ? (values as unknown[])
        : values === undefined
          ? []
          : [values];
    const items: Item[] = [];
    for (const value of list) {
        const binding = bound(row.for_each, value);
        items.push(...(await allPages(row, { ...top, binding }, reading)));
    }
    return items;
}

/**
 * Every item of a row for an entry: one reading per value of the entry field `for_each` names (or
 * one), each over every page, its steps and its folders; `given` stands one record in for the
 * row's request when the entry sets its field. `finish` picks the row's items once the last page
 * is read, and then the row's steps without records add their fields.
 */
export async function readAll(
    row: ReaderRow,
    entry: Lookup,
    setup: Setup,
    finish: Finish = (items) => items
): Promise<Item[]> {
    const reading = readingOf(row, setup, finish);
    const top = { binding: NONE, holes: entryHoles(row, entry), folders: '', depth: 0 };
    const items = finish(await rowItems(row, top, reading));
    return added(row, items, { ...top, state: FIRST, size: undefined }, reading);
}
