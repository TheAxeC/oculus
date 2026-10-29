// Layer 2, server. The fields of one record, read as its row's `fields` name them: a path into a
// JSON or XML record, a selector with an attribute or its text into an HTML record, a text with
// holes, or a record of one of those with a named operation and its arguments.
//
// The operations are the generic transforms a row may need, each with no service in it:
// `inverted_index` (the words of an index of word places, in their order), `strip` (a `prefix` or
// `suffix` taken off), `first_byte_size` (the size read by a request for the file's first byte,
// made by the listing after the fields are read), `join` (a list's texts, or the texts of `parts`,
// joined by `by`), `date` (a list of year, month and day, or the `parts` that hold them, a month
// by its number or its name, as `YYYY-MM-DD`), `https` (an `https:` address, or with `host` an
// `http:` one of that host and no port read as `https:`), `first` and `last` (the first of a list,
// the last segment of an address or a path), `match` (a pattern's first group, or the whole match;
// on a list the first element that matches, or with `all` every match), `exists`, `link` (an
// address of a `links` row for an id: the field or record path `id` names, else the value read at
// the record's `path`), `split` (a text split at a pattern, a `suffix` taken off first) and
// `resolve` (an address relative to the answer's). After the operation, `kind` keeps a checksum of
// that kind's length of hex digits, and `else` is read when nothing came of the rest.

import type {
    FieldRecord,
    FieldSpec,
    LinkRow
} from '../../../data/sources/config/settings/rows/grammar.ts';
import {
    fillText,
    hasHoles,
    type Lookup
} from '../../../data/sources/config/settings/rows/holes.ts';
import { linkAddress } from '../../../data/sources/config/settings/rows/links.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { CHECKSUM_LENGTH, HtmlNode } from './formats.ts';
import { readPath, scalarText } from './path.ts';

/** The value of a field whose size the listing reads with a request for the file's first byte. */
export const PROBED = Symbol('probed');

/** What a record's fields are read with. */
export type FieldContext = {
    /** The record: a parsed JSON or XML value, or an element of a page. */
    record: unknown;
    /** The holes a text fills, the record's own paths among them. */
    holes: Lookup;
    /** The `links` rows a `link` reads. */
    links: readonly LinkRow[];
    /** The address the answer came from, which `resolve` reads an address against. */
    base: string;
    /** The row's fields, which a `link`'s `id` may name. */
    specs: Record<string, FieldSpec>;
};

/** The month names a date's month may be written with, by their first three letters. */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** A value as a list: a list as it is, nothing as none, anything else a list of one. */
function listOf(value: unknown): unknown[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

/** Whether a value counts as nothing: absent, an empty text or an empty list. */
function nothing(value: unknown): boolean {
    return value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

/** The texts of a list's elements, the empty ones left out. */
function texts(values: unknown[]): string[] {
    return values.flatMap((one) => {
        const text = scalarText(one)?.trim();
        return text === undefined || text === '' ? [] : [text];
    });
}

/** The words of an index of word places, in the order of their places. */
function invertedIndex(index: unknown): string | undefined {
    if (!isMap(index)) return undefined;
    const places: (string | undefined)[] = [];
    for (const [word, at] of Object.entries(index)) {
        for (const place of listOf(at)) {
            if (typeof place === 'number' && place >= 0 && place < 100_000) places[place] = word;
        }
    }
    const text = places.filter((word): word is string => word !== undefined).join(' ');
    return text === '' ? undefined : text;
}

/** A month as its number: a number from 1 to 12, or a month's name. */
function monthOf(raw: unknown): number {
    const text = scalarText(raw)?.trim() ?? '';
    if (/^\d{1,2}$/.test(text)) return Number(text);
    return MONTHS.indexOf(text.slice(0, 3).toLowerCase()) + 1;
}

/** A year, month and day as `YYYY`, `YYYY-MM` or `YYYY-MM-DD`, as far as each reads. */
function dateOf(year: unknown, month: unknown, day: unknown): string | undefined {
    const yearText = scalarText(year)?.trim() ?? '';
    if (!/^\d{4}$/.test(yearText)) return undefined;
    const two = (n: number): string => String(n).padStart(2, '0');
    const monthNumber = monthOf(month);
    if (monthNumber < 1 || monthNumber > 12) return yearText;
    const dayText = scalarText(day)?.trim() ?? '';
    const dayNumber = /^\d{1,2}$/.test(dayText) ? Number(dayText) : 0;
    if (dayNumber < 1 || dayNumber > 31) return `${yearText}-${two(monthNumber)}`;
    return `${yearText}-${two(monthNumber)}-${two(dayNumber)}`;
}

/** An address as `https:`, an `http:` one of `host` and no port read so, else undefined. */
function httpsOf(raw: unknown, host: string | undefined): string | undefined {
    const text = scalarText(raw);
    if (text === undefined) return undefined;
    try {
        const address = new URL(text);
        if (address.protocol === 'https:') return text;
        if (host === undefined || address.protocol !== 'http:') return undefined;
        if (address.hostname !== host || address.port !== '') return undefined;
        address.protocol = 'https:';
        return address.href;
    } catch {
        return undefined;
    }
}

/** The last segment of an address's path, or of a plain path, decoded where it decodes. */
function lastOf(raw: unknown): string | undefined {
    const text = scalarText(raw);
    if (text === undefined) return undefined;
    let path = text;
    try {
        path = new URL(text).pathname;
    } catch {
        // A plain path is read as it is written.
    }
    const last = path.split('/').pop() ?? '';
    try {
        return decodeURIComponent(last);
    } catch {
        return last;
    }
}

/** A pattern's first group, or its whole match, of one text; undefined when it does not match. */
function matched(text: string, pattern: RegExp): string | undefined {
    const found = pattern.exec(text);
    return found === null ? undefined : (found.at(1) ?? found[0]);
}

/** What `match` makes of a value: the first match, or with `all` every match, of its texts. */
function matchOf(value: unknown, spec: FieldRecord): unknown {
    const source = spec.pattern ?? '';
    const all = texts(listOf(value));
    if (spec.all === true) {
        const every = new RegExp(source, 'g');
        return all.flatMap((text) => [...text.matchAll(every)].map((one) => one.at(1) ?? one[0]));
    }
    const pattern = new RegExp(source);
    for (const text of all) {
        const found = matched(text, pattern);
        if (found !== undefined) return found;
    }
    return undefined;
}

/** The value at a path of a record of a page or of a parsed answer. */
function at(record: unknown, path: string): unknown {
    return record instanceof HtmlNode ? undefined : readPath(record, path);
}

/** The value a spec's `select`, `attr` and `text` read off a record of a page. */
function fromPage(record: unknown, spec: FieldRecord): unknown {
    if (!(record instanceof HtmlNode)) return undefined;
    const node = spec.select === undefined ? record : record.find(spec.select).at(0);
    if (node === undefined) return undefined;
    if (spec.attr !== undefined) return node.attr(spec.attr);
    return node.text();
}

/** The value a spec reads before its operation: its constant, its path, or its selection. */
function baseOf(spec: FieldRecord, context: FieldContext): unknown {
    if (typeof spec.value === 'string' && hasHoles(spec.value)) {
        return fillText(spec.value, context.holes);
    }
    if (spec.value !== undefined) return spec.value;
    if (spec.path !== undefined) return at(context.record, spec.path);
    if (spec.select !== undefined || spec.attr !== undefined) {
        return fromPage(context.record, spec);
    }
    return context.record;
}

/** The key whose listed values hold the value, compared without case; undefined for none. */
function mapped(value: unknown, map: Record<string, string[]>): string | undefined {
    const held = texts(listOf(value)).map((one) => one.toLowerCase());
    for (const [key, listed] of Object.entries(map)) {
        if (listed.some((one) => held.includes(one.toLowerCase()))) return key;
    }
    return undefined;
}

/** The text of a `link`'s id: a field of the row by that name, else a path of the record. */
function linkId(spec: FieldRecord, context: FieldContext): string | undefined {
    const name = spec.id ?? '';
    const named = Object.hasOwn(context.specs, name) ? context.specs[name] : undefined;
    const value = named === undefined ? at(context.record, name) : readField(named, context);
    return scalarText(value);
}

/** What a spec's operation makes of the value it read. */
function operated(value: unknown, spec: FieldRecord, context: FieldContext): unknown {
    switch (spec.op) {
        case undefined:
            return value;
        case 'inverted_index':
            return invertedIndex(value);
        case 'strip': {
            let text = scalarText(value);
            if (text === undefined) return undefined;
            if (spec.prefix !== undefined && text.startsWith(spec.prefix)) {
                text = text.slice(spec.prefix.length);
            }
            if (spec.suffix !== undefined && text.endsWith(spec.suffix)) {
                text = text.slice(0, text.length - spec.suffix.length);
            }
            return text;
        }
        case 'first_byte_size':
            return PROBED;
        case 'join': {
            const parts = spec.parts;
            const joined = texts(
                parts === undefined ? listOf(value) : parts.map((part) => at(value, part))
            ).join(spec.by ?? ' ');
            return joined === '' ? undefined : joined;
        }
        case 'date': {
            const parts = spec.parts;
            const [year, month, day] =
                parts === undefined ? listOf(value) : parts.map((part) => at(value, part));
            return dateOf(year, month, day);
        }
        case 'https':
            return httpsOf(value, spec.host);
        case 'first':
            return listOf(value)[0];
        case 'last':
            return lastOf(value);
        case 'match':
            return matchOf(value, spec);
        case 'exists':
            return value !== undefined;
        case 'link': {
            const id = spec.id === undefined ? scalarText(value) : linkId(spec, context);
            if (id === undefined || spec.link === undefined) return undefined;
            return linkAddress(context.links, spec.link, id, context.holes);
        }
        case 'split': {
            let text = scalarText(value);
            if (text === undefined) return undefined;
            if (spec.suffix !== undefined && text.endsWith(spec.suffix)) {
                text = text.slice(0, text.length - spec.suffix.length);
            }
            return text.split(new RegExp(spec.pattern ?? ',')).filter((one) => one !== '');
        }
        case 'resolve': {
            const text = scalarText(value);
            if (text === undefined) return undefined;
            try {
                return new URL(text, context.base).href;
            } catch {
                return undefined;
            }
        }
    }
}

/** A checksum of a kind: its value lowercased when it is hex of the kind's length, else none. */
function checksumOf(value: unknown, kind: FieldRecord['kind']): unknown {
    if (kind === undefined) return value;
    const text = scalarText(value)?.trim().toLowerCase();
    if (
        text === undefined ||
        !new RegExp(`^[0-9a-f]{${String(CHECKSUM_LENGTH[kind])}}$`).test(text)
    ) {
        return undefined;
    }
    return { kind, value: text };
}

/** What a field record reads, before its `else`. */
function readRecord(spec: FieldRecord, context: FieldContext): unknown {
    let value = baseOf(spec, context);
    if (spec.each !== undefined) {
        const each = spec.each;
        value = listOf(value).flatMap((element) => {
            const one = readField(each, { ...context, record: element });
            return nothing(one) ? [] : [one];
        });
    }
    if (spec.map !== undefined) value = mapped(value, spec.map);
    value = operated(value, spec, context);
    return checksumOf(value, spec.kind);
}

/** The value one field spec reads of a record, undefined when it reads nothing. */
export function readField(spec: FieldSpec, context: FieldContext): unknown {
    if (typeof spec === 'string') {
        if (hasHoles(spec)) return fillText(spec, context.holes);
        if (context.record instanceof HtmlNode) return context.record.find(spec)[0]?.text();
        return at(context.record, spec);
    }
    const value = readRecord(spec, context);
    if (!nothing(value) || spec.else === undefined) return nothing(value) ? undefined : value;
    return readField(spec.else, context);
}

/** Every field of a record by its name, the fields that read nothing left out. */
export function readFields(
    specs: Record<string, FieldSpec>,
    context: FieldContext
): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const [name, spec] of Object.entries(specs)) {
        const value = readField(spec, context);
        if (value !== undefined) values[name] = value;
    }
    return values;
}
