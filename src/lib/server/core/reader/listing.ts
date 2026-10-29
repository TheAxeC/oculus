// Layer 2, server. The files a row lists for an entry: the reader's items read as files, each with
// its name, size, checksum and address, for Recover to plan and fetch.
//
// A row whose `auth` entry is `required` and whose `downloads` row is missing is refused `access`
// before any request. The entry's values fill the row's holes. A row's `archive` is the one file
// the set is fetched as: with `when`, when the entry field it names is true, in place of the
// listing; without it, after the listing, which must hold records. The archive's size, and that of
// every file whose `size` is `first_byte_size`, is read by a request for its first byte, eight at a
// time, with the row's secrets. A file name the listing gave before is put under the value of the
// hole `clash` names; the entry field `pick` names picks the files (by `by`, a record path, else by
// name; with `glob` by patterns, a pattern no file matches the refusal `missing`). A file whose
// name is empty, whose size is no whole number, or whose address is not `https:` refuses the
// answer. Each file carries the `downloads` row its download needs and how its secret is sent, and
// the entry field `pace.field` names as its throttle.

import type {
    ChecksumKind,
    Credential,
    ReaderRow
} from '../../../data/sources/config/settings/rows/grammar.ts';
import {
    fillAddress,
    fillText,
    type Lookup
} from '../../../data/sources/config/settings/rows/holes.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { firstByteSize, ReaderStop } from './call.ts';
import { PROBED } from './fields.ts';
import { readPath, scalarText } from './path.ts';
import { readAll, type Item, type Setup } from './reader.ts';
import { applyAuth, type Applied } from './request.ts';

/** One file a row lists. */
type ListedFile = {
    name: string;
    /** Bytes, or null when the source states none. */
    size: number | null;
    checksum: { kind: ChecksumKind; value: string } | null;
    url: string;
    /** The `downloads` row the download carries, and how it carries its secret. */
    service?: string;
    credential?: Credential;
    throttle?: string;
};

/**
 * Why a row lists no files: `source` the row's key (or the host a probe failed on), and `label`
 * the row's `name`, which the line the user reads names the source by.
 */
type ListRefusal = {
    refused: 'access' | 'status' | 'answer' | 'missing' | 'network';
    source: string;
    label?: string;
    status?: number;
    name?: string;
};

/** What a listing answers. */
export type Listing = ListedFile[] | ListRefusal;

/** How many first-byte requests of one listing run at once. */
const PROBES_AT_ONCE = 8;

/** A name of the entry's pick the listing does not hold. */
class PickMissing extends Error {
    readonly missing: string;

    constructor(missing: string) {
        super('missing');
        this.missing = missing;
    }
}

/** A first-byte request of a row with no address of its own that stopped, and the host it asked. */
class HostStop extends Error {
    readonly stop: ReaderStop;
    readonly host: string;

    constructor(stop: ReaderStop, host: string) {
        super(stop.message);
        this.stop = stop;
        this.host = host;
    }
}

/** A refusal of a stop, naming `source`. */
function refusalOf(stop: ReaderStop, source: string): ListRefusal {
    const status = stop.status === undefined ? {} : { status: stop.status };
    switch (stop.state) {
        case 'timeout':
        case 'network':
            return { refused: 'network', source };
        case 'refused':
            return { refused: 'access', source, ...status };
        case 'limited':
        case 'status':
            return { refused: 'status', source, ...status };
        case 'answer':
            return { refused: 'answer', source };
    }
}

/** A glob as a test of a whole name: `*` and `?` inside one folder level, `**\/` any folders. */
function globTest(pattern: string): RegExp {
    let out = '';
    for (let at = 0; at < pattern.length; at += 1) {
        const char = pattern[at];
        if (pattern.startsWith('**/', at)) {
            out += '(?:[^/]+/)*';
            at += 2;
        } else if (char === '*') out += '[^/]*';
        else if (char === '?') out += '[^/]';
        else out += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp(`^${out}$`);
}

/** The texts of an entry field that holds a list of them, or none. */
function textsOf(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((one): one is string => typeof one === 'string')
        : [];
}

/** The name of an item, by the record path `by` or by its `name` field. */
function keyOf(item: Item, by: string | undefined): string | undefined {
    if (by !== undefined) return scalarText(readPath(item.record, by));
    return scalarText(item.fields.name);
}

/** The items the entry's pick names, in its order, or every item with no pick. */
function picked(row: ReaderRow, entry: Lookup, items: Item[]): Item[] {
    const pick = row.pick;
    if (pick === undefined) return items;
    const wanted = textsOf(entry(pick.field));
    if (wanted.length === 0) return items;
    if (pick.glob === true) {
        const tests = wanted.map(globTest);
        const kept = items.filter((item) => {
            const name = keyOf(item, pick.by) ?? '';
            return tests.some((test) => test.test(name));
        });
        const unmatched = wanted.find(
            (_pattern, at) => !kept.some((item) => tests[at].test(keyOf(item, pick.by) ?? ''))
        );
        if (unmatched !== undefined) throw new PickMissing(unmatched);
        return kept;
    }
    // A name the listing gives twice picks its last item, the one a later page states.
    return wanted.map((name) => {
        const found = items.findLast((item) => keyOf(item, pick.by) === name);
        if (found === undefined) throw new PickMissing(name);
        return found;
    });
}

/** The items with a name the listing gave before put under the value of the hole `clash` names. */
function unclashed(row: ReaderRow, items: Item[]): Item[] {
    const clash = row.clash;
    if (clash === undefined) return items;
    const taken = new Set<string>();
    return items.map((item) => {
        const name = scalarText(item.fields.name);
        if (name === undefined) return item;
        const under = scalarText(item.holes(clash));
        const placed = taken.has(name) && under !== undefined ? `${under}/${name}` : name;
        taken.add(placed);
        return { ...item, fields: { ...item.fields, name: placed } };
    });
}

/** The last segment of an address's path, decoded. */
function lastSegment(url: string): string {
    const last = new URL(url).pathname.split('/').pop() ?? '';
    try {
        return decodeURIComponent(last);
    } catch {
        return last;
    }
}

/** The host of an address, or the address when it has none. */
function hostOf(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

/** An address a file is fetched from: `https:`, with no white space. */
function isHttps(value: unknown): value is string {
    return typeof value === 'string' && /^https:\/\/\S+$/.test(value);
}

/** The checksum of a field's value, or none. */
function checksumOf(value: unknown): ListedFile['checksum'] {
    if (!isMap(value)) return null;
    const { kind, value: text } = value;
    if (kind !== 'sha256' && kind !== 'md5' && kind !== 'sha1') return null;
    return typeof text === 'string' ? { kind, value: text } : null;
}

/** An item as a file, its size still to be read when it is the probed one, or null for none. */
function fileOf(
    item: Item
): (Omit<ListedFile, 'size'> & { size: number | null | typeof PROBED }) | null {
    const { name, size, checksum, url } = item.fields;
    if (typeof name !== 'string' || name === '' || !isHttps(url)) return null;
    let read: number | null | typeof PROBED = null;
    if (size === PROBED) read = PROBED;
    else if (size !== undefined) {
        const number = typeof size === 'number' ? size : Number(scalarText(size));
        if (!Number.isInteger(number) || number < 0) return null;
        read = number;
    }
    return { name, size: read, checksum: checksumOf(checksum), url };
}

/** What a listing's files carry besides their own fields: the download's row and the throttle. */
function carried(row: ReaderRow, entry: Lookup, applied: Applied): Partial<ListedFile> {
    const out: Partial<ListedFile> = {};
    if (applied.service !== undefined && applied.credential !== undefined) {
        out.service = applied.service;
        out.credential = applied.credential;
    }
    const field = row.pace?.field;
    const throttle = field === undefined ? undefined : entry(field);
    if (typeof throttle === 'string' && throttle !== '') out.throttle = throttle;
    return out;
}

/** The sizes of the files read by their first byte, eight at a time, in the files' order. */
async function sized(
    row: ReaderRow,
    files: ReturnType<typeof fileOf>[],
    setup: Setup,
    applied: Applied
): Promise<ListedFile[]> {
    const out: ListedFile[] = new Array<ListedFile>(files.length);
    let next = 0;
    /** The first failure, held in an object the workers share. */
    const ended: { stop: Error | null } = { stop: null };
    const byHost = row.address === undefined;
    const worker = async (): Promise<void> => {
        while (ended.stop === null && next < files.length) {
            const at = next;
            next += 1;
            const file = files[at];
            if (file === null) continue;
            if (file.size !== PROBED) {
                out[at] = { ...file, size: file.size };
                continue;
            }
            try {
                const request = { url: file.url, headers: applied.headers };
                const probe = await firstByteSize(setup.sender, request, row);
                out[at] = { ...file, size: probe.size };
            } catch (error) {
                if (byHost && error instanceof ReaderStop) {
                    ended.stop = new HostStop(error, hostOf(file.url));
                } else {
                    ended.stop = error instanceof Error ? error : new Error(String(error));
                }
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(PROBES_AT_ONCE, files.length) }, worker));
    if (ended.stop !== null) throw ended.stop;
    return out;
}

/** The one file a row's archive is, its size read by its first byte. */
async function archived(
    row: ReaderRow,
    entry: Lookup,
    setup: Setup,
    applied: Applied
): Promise<ListedFile[]> {
    const archive = row.archive;
    if (archive === undefined) return [];
    const address = fillAddress(archive.address, entry);
    if (address === undefined) throw new ReaderStop(row.name, 'answer');
    const probe = await firstByteSize(
        setup.sender,
        { url: address, headers: applied.headers },
        row
    );
    const named = archive.name === undefined ? undefined : fillText(archive.name, entry);
    const name = named ?? lastSegment(probe.url);
    if (archive.name === undefined && archive.match !== undefined) {
        if (!new RegExp(archive.match).test(name)) throw new ReaderStop(row.name, 'answer');
    }
    const url = archive.name === undefined ? probe.url : address;
    if (name === '' || !isHttps(url)) throw new ReaderStop(row.name, 'answer');
    return [{ name, size: probe.size, checksum: null, url }];
}

/** The files a row lists for an entry, or the refusal naming the row by its key and its name. */
export async function listRow(row: ReaderRow, entry: Lookup, setup: Setup): Promise<Listing> {
    try {
        const listed = await rowListing(row, entry, setup);
        return Array.isArray(listed) ? listed : { ...listed, label: row.name };
    } catch (error) {
        if (error instanceof HostStop) return refusalOf(error.stop, error.host);
        throw error;
    }
}

/**
 * The files a row lists for an entry, or the refusal naming the row's key; a first-byte request
 * to a host that stops is thrown as the host's.
 */
async function rowListing(row: ReaderRow, entry: Lookup, setup: Setup): Promise<Listing> {
    const applied = applyAuth(row.auth, setup.downloads);
    if (applied.missing !== undefined) return { refused: 'access', source: row.key };
    const extra = carried(row, entry, applied);
    try {
        const archive = row.archive;
        if (archive?.when !== undefined && entry(archive.when) === true) {
            return (await archived(row, entry, setup, applied)).map((one) => ({
                ...one,
                ...extra
            }));
        }
        const items = await readAll(row, entry, setup, (all) =>
            picked(row, entry, unclashed(row, all))
        );
        if (archive !== undefined && archive.when === undefined) {
            if (items.length === 0) return { refused: 'answer', source: row.key };
            return (await archived(row, entry, setup, applied)).map((one) => ({
                ...one,
                ...extra
            }));
        }
        const files = items.map(fileOf);
        if (files.some((one) => one === null)) return { refused: 'answer', source: row.key };
        return (await sized(row, files, setup, applied)).map((one) => ({ ...one, ...extra }));
    } catch (error) {
        if (error instanceof PickMissing) {
            return { refused: 'missing', source: row.key, name: error.missing };
        }
        if (error instanceof ReaderStop) return refusalOf(error, row.key);
        throw error;
    }
}
