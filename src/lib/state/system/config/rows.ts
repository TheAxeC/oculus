// Layer 2, client state. The rows of the Settings view for one config file: what the file's text
// says about each option the options catalog describes, in catalog order, each with its catalog
// entry, so the control a row is drawn with is the entry's. The text is parsed once with `yaml`, so
// a row's value and the line of its key come from one parse, and each key path is walked through
// the parsed map's own keys, so a segment named like an object member (`__proto__`, `constructor`)
// reads the file's key or nothing.
//
// A row is `set` when the file holds a plain, quoted or collection value at its key path, and
// `missing` when the key is absent or holds a null or empty value, an alias, an anchored or tagged
// node or a block scalar: the cases the write refuses as not in the file (server/edit/writes/
// config-key.ts), since a write there would be a guess. It is Modified when it is `set` and its
// value differs from the catalog's default by deep equality, a list item by item; a family, which
// has no default, a `local.yml` row and a missing row are never Modified. A value its control
// cannot show (a toggle holding "yes", a number holding "20" as text) is kept as the file has it
// and flagged `mismatch`, for the view to word. A word outside the list a choice offers is not a
// mismatch: the lists come from the portfolio and the page, so the view marks it where the list is
// known (editors/fields.ts).
//
// A key of the hub list (data/helpers/hub-names.ts) is read from the hub's own settings file,
// `.oculus/config.yml`, and is named by that file: its value and its line are the settings file's
// when the file holds the key, else the engine's general value, and a write of it goes to the
// settings file, which it creates when the file or the key is not there (the row's `hub`).
//
// The machine-local file's rows are made from the catalog alone, and its text is never a parameter.
// Every sentence is a message (messages.ts) for the view to word; nothing here holds one.

import { isEqual } from 'lodash-es';
import {
    LineCounter,
    isAlias,
    isMap as isYamlMap,
    isScalar,
    isSeq,
    parseDocument,
    type Document,
    type Pair,
    type Scalar,
    type YAMLMap,
    type YAMLSeq
} from 'yaml';
import { z } from 'zod';
import { HUB_FILE, hubKeysOf } from '../../../data/helpers/hub-names.ts';
import type {
    CatalogEntry,
    Control,
    FieldSpec
} from '../../../data/sources/config/catalog/options.ts';
import type { FileText } from '../../sources/fs-transport.ts';
import { OCULUS_CONFIG_ROOT } from '../../../data/helpers/files/address.ts';
import { PRIMARY_ROOT } from './config-files.ts';
import { LOCAL_NAME } from './config-files.ts';
import { readField } from './editors/fields.ts';
import { message, type Message } from './messages.ts';

/** What every row carries, whichever kind it is, which is what a search reads. */
export type RowBase = {
    /** `<file>:<key path>`, or `this-browser:<name>`: the row's identity in the markup. */
    id: string;
    title: string;
    help: string;
    /** The key path, or the name of a per-browser value: what `@id:` looks in. */
    path: string;
    /** The heading the row is shown under. */
    section: string;
    modified: boolean;
};

/** One option of a tracked config file. */
export type ConfigRow = RowBase & {
    kind: 'config';
    file: string;
    key: string;
    control: Control | 'family';
    /** The catalog entry the row is drawn from: its control and the keys that shape it. */
    entry: CatalogEntry;
    /** A family's fields, each with its help line and control. */
    fields: Record<string, FieldSpec>;
    default: unknown;
    /** The value the file holds, `undefined` for a missing row. */
    value: unknown;
    /** The 1-based line of the key's own name, `undefined` when the file has no such key. */
    line: number | undefined;
    state: 'set' | 'missing';
    /** Whether the file's value is one the row's control cannot show. */
    mismatch: boolean;
    /**
     * The hub's settings file for a key of the hub list: its path under the hub, and whether the
     * file is there. null for a key the engine's file alone holds.
     */
    hub: { path: string; present: boolean } | null;
};

/**
 * What the Settings view knows of the machine's own files: the name of the primary hub, the names
 * of the keys its `local.yml` sets, the default text of each key that has one, the text of the
 * value in force of each key that has one (a line for each row of a joined list), the names of
 * the hubs whose files set each joined list, and the move to the port the file names that the
 * server could not make, with why (the port in force is then the one it stays on).
 */
export type MachineState = {
    primary: string | null;
    set: readonly string[];
    defaults: Readonly<Record<string, string>>;
    values: Readonly<Record<string, string>>;
    hubs: Readonly<Record<string, readonly string[]>>;
    portRefused: { port: number; reason: string } | null;
};

/**
 * One key of the machine's own file, listed from the catalog and what is known of the files:
 * `setIn` is the primary hub whose file sets it, else null, `fallback` is the default in force for
 * a key the file does not set, null when the key has none, `lines` is the value in force, one line
 * for each row of a joined list, none when the key has no value to show, `hubs` names the hubs
 * whose files set a joined list, and `refused` is the message saying why the value the file names
 * is not in force, null when it is.
 */
export type LocalRow = RowBase & {
    kind: 'local';
    file: typeof LOCAL_NAME;
    key: string;
    setIn: string | null;
    fallback: string | null;
    lines: string[];
    hubs: string[];
    refused: Message | null;
};

/** Why a file draws no rows, or `rows` when it does. */
export type FileStatus = 'rows' | 'loading' | 'unreadable' | 'cut' | 'unparsed';

/** The hub's settings file as it was read, and whether the file is there. */
export type HubFile = { text: FileText; present: boolean };

/** The hub's settings file, as the line under a heading shows it. */
export type HubFileResult = {
    path: string;
    present: boolean;
    status: FileStatus;
    said: Message | null;
};

/**
 * The rows of one file, or the sentence saying why it has none. `hubFile` is the hub's settings
 * file when the file has keys of the hub list among its rows.
 */
export type FileResult = {
    status: FileStatus;
    rows: ConfigRow[];
    said?: Message;
    hubFile?: HubFileResult;
};

/**
 * The root and the path of the file a row is read from and written to: the primary hub's settings
 * file for a key of the hub list (`PRIMARY_ROOT`), oculus's own config file for any other
 * (`OCULUS_CONFIG_ROOT`). Where either is opened in an editor is `openTarget`'s.
 */
export function placeOf(row: ConfigRow): { root: string; file: string } {
    return row.hub === null
        ? { root: OCULUS_CONFIG_ROOT, file: row.file }
        : { root: PRIMARY_ROOT, file: row.hub.path };
}

/** One word of a key path as a title: underscores read as spaces, the first letter capital. */
function wordOf(segment: string): string {
    const spaced = segment.replaceAll('_', ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The title of a key path: the segments before the last joined by ` > `, then `: `, then the last,
 * and a one-segment key its name alone.
 */
export function titleOf(path: string): string {
    const segments = path.split('.').map(wordOf);
    const last = segments.pop() ?? '';
    return segments.length === 0 ? last : `${segments.join(' > ')}: ${last}`;
}

/** The heading an option is shown under: its `section:`, else its first segment as a title. */
export function sectionOf(path: string, section: string | undefined): string {
    return section ?? wordOf(path.split('.')[0]);
}

/** The line of a key's name, or undefined when the parser gave the node no range. */
function lineOf(pair: Pair, lines: LineCounter): number | undefined {
    const range = isScalar(pair.key) ? pair.key.range : undefined;
    return range === undefined || range === null ? undefined : lines.linePos(range[0]).line;
}

/** The pair a key path names, walking each segment through the map's own keys. */
function pairAt(doc: Document, path: string): Pair | null {
    let node: unknown = doc.contents;
    let found: Pair | null = null;
    for (const segment of path.split('.')) {
        if (!isYamlMap(node)) return null;
        found = node.items.find((item) => isScalar(item.key) && item.key.value === segment) ?? null;
        if (found === null) return null;
        node = found.value;
    }
    return found;
}

/**
 * Whether a node is a value the write could replace in place: a plain or quoted scalar that is not
 * null, or a map or a list, none of them an alias, anchored or tagged.
 */
function usable(node: unknown): node is Scalar | YAMLMap | YAMLSeq {
    if (isAlias(node)) return false;
    if (isScalar(node)) {
        const block = node.type === 'BLOCK_LITERAL' || node.type === 'BLOCK_FOLDED';
        const bare = node.anchor === undefined && node.tag === undefined;
        return bare && !block && node.value !== null && node.value !== undefined;
    }
    if (isYamlMap(node) || isSeq(node)) return node.anchor === undefined && node.tag === undefined;
    return false;
}

/** What a text, a word and a list read as when a row shows or words a value the file holds. */
const choiceShape = z.string() satisfies z.ZodType<string>;
export const listShape = z.array(z.unknown()) satisfies z.ZodType<unknown[]>;
export const textShape = z.union([z.string(), z.number(), z.boolean()]) satisfies z.ZodType<
    string | number | boolean
>;

/** Whether a value is one the option's control cannot show. */
function cannotShow(control: Control | 'family', entry: CatalogEntry, value: unknown): boolean {
    if (control === 'family') return false;
    if (control === 'text' || control === 'long') return !textShape.safeParse(value).success;
    return readField(entry, value).kind !== 'value';
}

/** A parsed file with its line counter: what a row's value and line are read from. */
type Parsed = { doc: Document; lines: LineCounter };

/**
 * The hub's settings file: its path, whether it is there, and its text parsed or null.
 */
type ParsedHubFile = { path: string; present: boolean; parsed: Parsed | null };

/**
 * The row of one catalog entry over a parsed file, and over the hub's settings file for a hub key.
 */
function rowOf(
    file: string,
    key: string,
    entry: CatalogEntry,
    engine: Parsed,
    hubFile: ParsedHubFile | null
): ConfigRow {
    const control: ConfigRow['control'] =
        entry.fields === undefined ? (entry.control ?? 'text') : 'family';
    const hubbed = hubKeysOf(file)?.includes(key) === true ? hubFile : null;
    const base = {
        kind: 'config' as const,
        id: `${file}:${key}`,
        file,
        key,
        path: key,
        title: titleOf(key),
        help: entry.help,
        section: sectionOf(key, entry.section),
        control,
        entry,
        fields: entry.fields ?? {},
        default: entry.default,
        hub: hubbed === null ? null : { path: hubbed.path, present: hubbed.present }
    };
    // The settings file's value when it holds the key, else the engine's general value.
    const held = hubbed?.parsed ? pairAt(hubbed.parsed.doc, key) : null;
    const from = held !== null && usable(held.value) ? (hubbed?.parsed ?? engine) : engine;
    const pair = pairAt(from.doc, key);
    const line = pair === null ? undefined : lineOf(pair, from.lines);
    const node = pair?.value;
    if (pair === null || !usable(node)) {
        return {
            ...base,
            value: undefined,
            line,
            state: 'missing',
            mismatch: false,
            modified: false
        };
    }
    const value: unknown = isScalar(node) ? node.value : node.toJS(from.doc);
    return {
        ...base,
        value,
        line: from === engine && hubbed !== null ? undefined : line,
        state: 'set',
        mismatch: cannotShow(control, entry, value),
        modified: control !== 'family' && !isEqual(value, entry.default)
    };
}

/** What a file's text makes of a read: its parsed form, or the status and sentence of why not. */
function parsed(
    file: string,
    held: FileText
): { ok: Parsed } | { status: FileStatus; said: Message } {
    if (held.loading) return { status: 'loading', said: message('loading', file) };
    if (held.error !== '') {
        return { status: 'unreadable', said: message('unreadable', file, held.error) };
    }
    if (held.truncated) return { status: 'cut', said: message('cut', file) };
    const lines = new LineCounter();
    const doc = parseDocument(held.text, { lineCounter: lines });
    if (doc.errors.length > 0) {
        const first = doc.errors[0].message.split('\n')[0];
        return { status: 'unparsed', said: message('unparsed', file, first) };
    }
    return { ok: { doc, lines } };
}

/**
 * The hub's settings file read for the rows of a file: parsed when it is there and sound, and the
 * status and sentence that tell the line under the heading what became of it. A file that is not
 * there is an empty file, so every key reads the engine's value; one that is not sound reads the
 * engine's values too and says why.
 */
function readHubFile(hubFile: HubFile): { read: ParsedHubFile; result: HubFileResult } {
    const path = HUB_FILE;
    if (!hubFile.present) {
        return {
            read: { path, present: false, parsed: null },
            result: { path, present: false, status: 'rows', said: message('hubFileAbsent', path) }
        };
    }
    const made = parsed(path, hubFile.text);
    if ('ok' in made) {
        return {
            read: { path, present: true, parsed: made.ok },
            result: { path, present: true, status: 'rows', said: null }
        };
    }
    return {
        read: { path, present: true, parsed: null },
        result: { path, present: true, status: made.status, said: made.said }
    };
}

/**
 * The rows of one tracked file over its text, in catalog order. A file still being read, one the
 * file browser could not read, one cut at the window's limit and one that does not parse have no
 * rows and say why; the parser's message is its first line, which names the place. `hubFile` is
 * the hub's settings file, given for a file that has keys of the hub list.
 */
export function fileRows(
    file: string,
    entries: Record<string, CatalogEntry>,
    held: FileText,
    hubFile?: HubFile
): FileResult {
    const made = parsed(file, held);
    if (!('ok' in made)) return { status: made.status, rows: [], said: made.said };
    const read = hubFile === undefined ? null : readHubFile(hubFile);
    const rows = Object.entries(entries).map(([key, entry]) =>
        rowOf(file, key, entry, made.ok, read?.read ?? null)
    );
    return read === null
        ? { status: 'rows', rows }
        : { status: 'rows', rows, hubFile: read.result };
}

/**
 * The rows of the machine's own file, from its catalog entries and what is known of the files.
 * With no primary no one-per-oculus key is set and each shows its default; a joined list shows the
 * rows of every hub's file whatever the primary is.
 */
export function localRows(
    entries: Record<string, CatalogEntry>,
    machine: MachineState
): LocalRow[] {
    return Object.entries(entries).map(([key, entry]) => ({
        kind: 'local',
        id: `${LOCAL_NAME}:${key}`,
        file: LOCAL_NAME,
        key,
        path: key,
        title: titleOf(key),
        help: entry.help,
        section: sectionOf(key, entry.section),
        modified: false,
        setIn: machine.primary !== null && machine.set.includes(key) ? machine.primary : null,
        fallback: Object.hasOwn(machine.defaults, key) ? machine.defaults[key] : null,
        lines: Object.hasOwn(machine.values, key) ? machine.values[key].split('\n') : [],
        hubs: Object.hasOwn(machine.hubs, key) ? [...machine.hubs[key]] : [],
        refused: key === 'port' ? portRefusal(machine) : null
    }));
}

/**
 * The message of the sentence the server logs when it cannot move to the port the file names: the
 * port, why, and the port it stays on, which is the port in force. Null when no move was refused.
 */
function portRefusal(machine: MachineState): Message | null {
    const refused = machine.portRefused;
    if (refused === null) return null;
    const stays = Object.hasOwn(machine.values, 'port') ? machine.values.port : '';
    return message('portRefused', refused.port, refused.reason, stays);
}

/** A value as the sentence about it shows it. */
function shown(value: unknown): string {
    const word = choiceShape.safeParse(value);
    return word.success ? word.data : JSON.stringify(value);
}

/** The message saying a row's file value is one its control cannot show, or null when it can. */
export function mismatchMessage(row: ConfigRow): Message | null {
    if (!row.mismatch) return null;
    const text = shown(row.value);
    if (row.control === 'toggle') return message('mismatchToggle', text);
    if (row.control === 'number') return message('mismatchNumber', text);
    const lists = row.control === 'list' || row.control === 'parked';
    if (lists || (row.control === 'multi' && row.entry.joined !== true)) {
        return message('mismatchList', text);
    }
    return message('mismatchText', text);
}
