// Layer 2, server. An answer read in the format its row names, and the records it holds: JSON
// through `JSON.parse`, XML through `fast-xml-parser`, an HTML page through `cheerio` (built on
// `parse5`, so a page parses as a browser parses it and a selector copied from its inspector
// holds), plain text, or nothing for a row of format `none`, whose records are a field of the
// entry.
//
// The XML parser keeps attributes as fields named `@<name>` and every value as text, and reads an
// element a field marks `markup: true` as its inner markup, so a title holding `<i>` keeps its
// words. The records are where the row's `records` says: a path (a list, or a map read as the one
// record; `.` the answer as a list), a selector, an entry field, or the operation
// `checksum_file`, a line per file of a hex digest of its kind and the file's name. An answer that
// does not read, a path it does not hold and a value that is neither list nor map are no records,
// and the caller refuses the answer.

import { load, type CheerioAPI } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import type {
    ChecksumKind,
    Expect,
    Format,
    RecordsSpec
} from '../../../data/sources/config/settings/rows/grammar.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { readPath, scalarText } from './path.ts';

/** The hex digits of a checksum of each kind. */
export const CHECKSUM_LENGTH: Record<ChecksumKind, number> = { sha256: 64, md5: 32, sha1: 40 };

/** A selection of a page: the elements a selector matched, read through cheerio. */
export class HtmlNode {
    private readonly page: CheerioAPI;
    private readonly node: ReturnType<CheerioAPI['root']>;

    constructor(page: CheerioAPI, node: ReturnType<CheerioAPI['root']>) {
        this.page = page;
        this.node = node;
    }

    /** The elements below this one that match `selector`, each its own node. */
    find(selector: string): HtmlNode[] {
        return this.node
            .find(selector)
            .toArray()
            .map((element) => new HtmlNode(this.page, this.page(element) as never));
    }

    /** The value of an attribute, or undefined when the element has none. */
    attr(name: string): string | undefined {
        return this.node.attr(name);
    }

    /** The element's text, its white space trimmed. */
    text(): string {
        return this.node.text().trim();
    }
}

/** An answer read: the parsed tree of a JSON, XML or text answer, or the root of a page. */
export type Parsed = { kind: 'tree'; tree: unknown } | { kind: 'html'; root: HtmlNode };

/** An XML answer parsed, each element named in `markup` kept as its inner markup. */
function xmlOf(text: string, markup: string[]): unknown {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@',
        parseTagValue: false,
        parseAttributeValue: false,
        processEntities: false,
        stopNodes: markup.map((name) => `*.${name}`)
    });
    return parser.parse(text) as unknown;
}

/**
 * An answer's text read in its format, or null when it does not read: JSON that is no JSON, or
 * XML or HTML the parser refuses.
 */
export function parseAnswer(format: Format, text: string, markup: string[] = []): Parsed | null {
    try {
        if (format === 'json') return { kind: 'tree', tree: JSON.parse(text) as unknown };
        if (format === 'xml') return { kind: 'tree', tree: xmlOf(text, markup) };
        if (format === 'html') {
            const page = load(text);
            return { kind: 'html', root: new HtmlNode(page, page.root()) };
        }
        return { kind: 'tree', tree: text };
    } catch {
        return null;
    }
}

/** The text a path or a selector reads in an answer, undefined when it reads none. */
function textIn(parsed: Parsed, path: string | undefined, select: string | undefined): unknown {
    if (parsed.kind === 'html') {
        if (select === undefined) return undefined;
        return parsed.root.find(select)[0]?.text();
    }
    return path === undefined ? undefined : readPath(parsed.tree, path);
}

/** Whether an answer holds the element its row's `expect` names, with the text `holds` in it. */
export function holdsExpected(parsed: Parsed, expect: Expect): boolean {
    const value = textIn(parsed, undefined, expect.select);
    const text = scalarText(value);
    if (value === undefined || text === undefined) return false;
    return expect.holds === undefined || text.includes(expect.holds);
}

/** Whether an answer holds the path `none_when` names, which means it holds no hits. */
export function holdsNone(parsed: Parsed, path: string): boolean {
    const value = textIn(parsed, path, path);
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
}

/**
 * The records of a `checksum_file` answer: one per line, its digest and the name after it, or
 * null when a line is not one or no line is.
 */
function checksumRecords(text: string, kind: ChecksumKind): Record<string, string>[] | null {
    const line = new RegExp(`^([0-9a-fA-F]{${String(CHECKSUM_LENGTH[kind])}}) +\\*?(.+)$`);
    const records: Record<string, string>[] = [];
    for (const one of text.split('\n')) {
        if (one.trim() === '') continue;
        const found = line.exec(one.trimEnd());
        if (found === null) return null;
        records.push({ digest: found[1], name: found[2] });
    }
    return records.length === 0 ? null : records;
}

/** Whether every field the map names holds its value in a record. */
function matches(record: unknown, wanted: Record<string, string>): boolean {
    return Object.entries(wanted).every(
        ([path, value]) => scalarText(readPath(record, path)) === value
    );
}

/**
 * The records a path names: `.` the answer, which must be a list; a path taking a list with `[]`
 * the values it reaches, when what stands before its first `[]` is there; any other path a list's
 * elements, or a map as the one record. Null for none of these.
 */
function listAt(tree: unknown, path: string): unknown[] | null {
    if (path === '.') return Array.isArray(tree) ? (tree as unknown[]) : null;
    const every = path.indexOf('[]');
    if (every > 0 && readPath(tree, path.slice(0, every)) === undefined) return null;
    const value = readPath(tree, path);
    if (Array.isArray(value)) return value as unknown[];
    return isMap(value) ? [value] : null;
}

/** What `recordsOf` answers: the records, or why the answer holds none it can read. */
export type Records = { records: unknown[]; got: number } | { refused: 'answer' };

/**
 * The records an answer holds where `spec` says, with `where`, `unless`, `refuse_when` and `first`
 * applied; `got` is how many the answer held before they were, which paging compares with the page
 * size. `entry` reads an entry field, for a spec that names one.
 */
export function recordsOf(
    spec: RecordsSpec,
    parsed: Parsed | null,
    entry: (name: string) => unknown
): Records {
    const named = typeof spec === 'string' ? { path: spec } : spec;
    let records: unknown[] | null;
    if (named.field !== undefined) {
        const value = entry(named.field);
        records = Array.isArray(value) ? (value as unknown[]) : null;
    } else if (parsed === null) {
        records = null;
    } else if (named.op === 'checksum_file') {
        const text = parsed.kind === 'tree' ? parsed.tree : null;
        records = typeof text === 'string' ? checksumRecords(text, named.kind ?? 'sha256') : null;
    } else if (parsed.kind === 'html') {
        records = named.select === undefined ? null : parsed.root.find(named.select);
    } else {
        records = named.path === undefined ? null : listAt(parsed.tree, named.path);
        if (records === null && named.absent === 'none') records = [];
    }
    if (records === null) return { refused: 'answer' };
    const got = records.length;
    if (named.refuse_when !== undefined) {
        const path = named.refuse_when;
        if (records.some((one) => readPath(one, path) !== undefined)) return { refused: 'answer' };
    }
    const where = named.where;
    const unless = named.unless;
    let kept = records;
    if (where !== undefined) kept = kept.filter((one) => matches(one, where));
    if (unless !== undefined) kept = kept.filter((one) => !matches(one, unless));
    if (named.first === true) {
        if (kept.length === 0) return { refused: 'answer' };
        kept = kept.slice(0, 1);
    }
    return { records: kept, got };
}
