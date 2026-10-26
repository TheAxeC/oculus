// Layer 2, client state. The rows of the Settings view for one defaults file: each option the
// options catalog describes, in catalog order, with its catalog entry, so the control a row is
// drawn with is the entry's.
//
// A row shows the value in force, read from the merged configuration the page holds (oculus's
// defaults file, then the settings file of the hub the row reads, then the open workspace file's
// `settings:`), and its default is the defaults file's value (the entry's `default`, which the
// options reader fills from that file, as that hub's merge left it). It is Modified when the two
// differ by deep equality, a list item by item and a family key by key. A row is `missing` when no
// layer gives the key a value, and `set` otherwise. A value its control cannot show (a toggle
// holding "yes", a number holding "20" as text) is kept as the layers have it and flagged
// `mismatch`, for the view to word. A word outside the list a choice offers is not a mismatch: the
// lists come from the portfolio and the page, so the view marks it where the list is known
// (editors/fields.ts).
//
// The user's value of an option lives in one file, the row's place: a hub's settings file,
// `.oculus/config.yml`, for a key of the hub list (data/helpers/hub-names.ts), which is the hub the
// row names for a key each hub's own file is read for and the primary otherwise
// (view/hub-settings.svelte.ts), and the open workspace file's `settings:` map for any other. The
// row says whether that file holds the key (`own`, which is what Reset takes out) and the line of
// the key's name there. The file is parsed once with `yaml`, and each key path is walked through
// the parsed map's own keys, so a segment named like an object member (`__proto__`, `constructor`)
// reads the file's key or nothing; the value in force is walked the same way through the merged
// configuration's own keys.
//
// The machine-local file's rows are made from the catalog alone, and its text is never a parameter.
// Every sentence is a message (messages.ts) for the view to word; nothing here holds one.

import { isEqual } from 'lodash-es';
import {
    LineCounter,
    isMap as isYamlMap,
    isScalar,
    parseDocument,
    type Document,
    type Pair
} from 'yaml';
import { z } from 'zod';
import { HUB_FILE, hubKeysOf } from '../../../data/helpers/hub-names.ts';
import type {
    CatalogEntry,
    Control,
    FieldSpec
} from '../../../data/sources/config/catalog/options.ts';
import type { FileText } from '../../sources/fs-transport.ts';
import { PRIMARY_ROOT } from './config-files.ts';
import { LOCAL_NAME } from './config-files.ts';
import { readField } from './editors/fields.ts';
import { message, type Message } from './messages.ts';

/** The key of the workspace file's map of options. */
const SETTINGS = 'settings';

/** What every row carries, whichever kind it is, which is what a search reads. */
export type RowBase = {
    /** `<file>:<key path>`: the row's identity in the markup. */
    id: string;
    title: string;
    help: string;
    /** The key path: what `@id:` looks in. */
    path: string;
    /** The heading the row is shown under. */
    section: string;
    modified: boolean;
};

/**
 * The file a row's user value lives in: a hub's settings file (`hub`) or the open workspace file
 * (`workspace`). `root` and `path` are the served root and the path the file is read and opened at,
 * the root `PRIMARY_ROOT` for the primary's settings file and the hub's name for another hub's;
 * `root` is null when no folder of the workspace serves the workspace file, and `path` null for the
 * unsaved workspace, which has no file. `present` says whether the file is there.
 */
type UserPlace = {
    layer: 'hub' | 'workspace';
    root: string | null;
    path: string | null;
    present: boolean;
};

/** One option of a defaults file. */
export type ConfigRow = RowBase & {
    kind: 'config';
    file: string;
    key: string;
    control: Control | 'family';
    /** The catalog entry the row is drawn from: its control and the keys that shape it. */
    entry: CatalogEntry;
    /** A family's fields, each with its help line and control. */
    fields: Record<string, FieldSpec>;
    /** The defaults file's value, `undefined` when it holds none. */
    default: unknown;
    /** The value in force, `undefined` for a missing row. */
    value: unknown;
    /** The 1-based line of the key's name in the user's file, `undefined` when it has none. */
    line: number | undefined;
    /** Whether the user's file holds the key, which Reset takes out. */
    own: boolean;
    state: 'set' | 'missing';
    /** Whether the value in force is one the row's control cannot show. */
    mismatch: boolean;
    /**
     * Whether the reader may reorder the value's entries: false for a key a hub's or a workspace's
     * value is laid over oculus's in oculus's place (data/sources/config/merge/in-place.ts), whose
     * entries keep oculus's order whatever order the file writes them in.
     */
    ordered: boolean;
    place: UserPlace;
    /**
     * The hub a write of the row names (`root`): a hub other than the primary chosen on a row of a
     * key each hub's own file is read for, or the one hub of a workspace whose hub is not the
     * primary. Undefined for the primary's own value, which a write names no hub for.
     */
    hub?: string;
    /**
     * The hub the row's typed text, editor draft and write state are kept under: the hub chosen
     * when it is not the primary in a workspace of more than one hub. Undefined otherwise, when
     * they are kept under the file and key alone.
     */
    slot?: string;
    /**
     * The hubs the row offers to pick in a workspace of more than one hub, the primary first, with
     * the one chosen, none while no hub is chosen; undefined on a row that offers no choice.
     */
    choice?: { offered: string[]; chosen: string | undefined };
    /** Why the row writes nothing: no hub is picked, or the chosen hub's settings are not read. */
    blocked?: Message;
    /**
     * Set while the settings of the hub chosen on the row are being read or could not be read: the
     * row's value, default and line are not known, it draws none of them and no control, only why
     * (`blocked`), and its place is that hub's settings file.
     */
    unread?: true;
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

/** What became of the read of a user's file: read (`rows`), or why its lines are not known. */
export type FileStatus = 'rows' | 'loading' | 'unreadable' | 'cut' | 'unparsed';

/** A user's file as it was read, and whether the file is there. */
export type HubFile = { text: FileText; present: boolean };

/**
 * The open workspace file for the rows: the served root and path it is read at (`root` null when no
 * folder of the workspace serves it), and its text. Null for the unsaved workspace.
 */
type WorkspaceText = { root: string | null; path: string; text: FileText } | null;

/** One user's file as a heading's line shows it: its path, whether it is there, and its read. */
export type UserFileResult = {
    path: string;
    present: boolean;
    status: FileStatus;
    said: Message | null;
};

/**
 * The rows of one defaults file, with what became of the reads of the two user's files: `hubFile`
 * when the file has keys of the hub list, `workspace` when a workspace file is open.
 */
export type FileResult = {
    rows: ConfigRow[];
    hubFile?: UserFileResult;
    workspace?: UserFileResult;
};

/**
 * The root and the path of the user's file a row is written to and opened in, or null when it has
 * none to open: the unsaved workspace, or a workspace file no folder of the workspace serves. Where
 * the file is opened in an editor is `openTarget`'s.
 */
export function placeOf(row: ConfigRow): { root: string; file: string } | null {
    const { root, path } = row.place;
    return root === null || path === null ? null : { root, file: path };
}

/**
 * The name a row's user file is shown under: its path, after the hub's name for the settings file
 * of a hub other than the primary, so two hubs' `.oculus/config.yml` are told apart. Null for the
 * unsaved workspace, which has no file.
 */
export function placeName(row: ConfigRow): string | null {
    const { path } = row.place;
    if (path === null) return null;
    return row.hub === undefined || row.place.layer !== 'hub' ? path : `${row.hub}/${path}`;
}

/**
 * Whether a row's control writes its value whole, as a list, a multi, a parked list, a word block
 * or a family does through its editor, rather than one value at a time.
 */
export function writtenWhole(control: ConfigRow['control']): boolean {
    return (
        control === 'list' ||
        control === 'multi' ||
        control === 'parked' ||
        control === 'words' ||
        control === 'family'
    );
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

/** The value a dotted key path names in a map, walking each segment through its own keys. */
function valueAt(config: Record<string, unknown>, path: string): unknown {
    let node: unknown = config;
    for (const segment of path.split('.')) {
        if (typeof node !== 'object' || node === null || Array.isArray(node)) return undefined;
        if (!Object.hasOwn(node, segment)) return undefined;
        node = (node as Record<string, unknown>)[segment];
    }
    return node;
}

/** What a text, a word and a list read as when a row shows or words a value. */
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

/** A parsed file with its line counter: what a row's line is read from. */
type Parsed = { doc: Document; lines: LineCounter };

/** A user's file as the rows read it: where it lies, and its text parsed or null. */
type ReadFile = { place: UserPlace; parsed: Parsed | null; prefix: string };

/** The row of one catalog entry over the value in force and the user's file of its key. */
function rowOf(
    file: string,
    key: string,
    entry: CatalogEntry,
    config: Record<string, unknown>,
    user: ReadFile
): ConfigRow {
    const control: ConfigRow['control'] =
        entry.fields === undefined ? (entry.control ?? 'text') : 'family';
    const pair = user.parsed === null ? null : pairAt(user.parsed.doc, `${user.prefix}${key}`);
    const value = valueAt(config, key);
    const missing = value === undefined || value === null;
    return {
        kind: 'config',
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
        value: missing ? undefined : value,
        line: pair === null || user.parsed === null ? undefined : lineOf(pair, user.parsed.lines),
        own: pair !== null,
        state: missing ? 'missing' : 'set',
        mismatch: !missing && cannotShow(control, entry, value),
        ordered: entry.in_place !== true,
        modified: !missing && !isEqual(value, entry.default),
        place: user.place
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
 * A user's file read for the rows: parsed when it is there and sound, and the status and sentence
 * that tell the line under the heading what became of it. A file that is not there holds no key;
 * one that is not sound gives no line and says why.
 */
function readUserFile(
    place: UserPlace,
    text: FileText,
    prefix: string,
    named = place.path ?? ''
): { read: ReadFile; result: UserFileResult } {
    const path = place.path ?? '';
    if (!place.present) {
        return {
            read: { place, parsed: null, prefix },
            result: { path, present: false, status: 'rows', said: message('hubFileAbsent', named) }
        };
    }
    const made = parsed(named, text);
    if ('ok' in made) {
        return {
            read: { place, parsed: made.ok, prefix },
            result: { path, present: true, status: 'rows', said: null }
        };
    }
    return {
        read: { place, parsed: null, prefix },
        result: { path, present: true, status: made.status, said: made.said }
    };
}

/** The text of a file that is not read: nothing, with nothing to say. */
const NO_TEXT: FileText = { text: '', truncated: false, error: '', loading: false };

/**
 * The user's two files of the rows: a hub's settings file (the primary's, or the one of the hub
 * `fileRows` names) and the workspace file.
 */
export type UserFiles = { hubFile?: HubFile; workspace: WorkspaceText };

/**
 * The rows of one defaults file, in catalog order, over the merged configuration (`config`) and the
 * user's files. With no primary hub (`hubFile` not given) a key of the hub list has no file; with
 * the unsaved workspace (`workspace` null) no other key has one, and a write of it is refused.
 * `hub` names the hub whose settings file `hubFile` is when it is not the primary: the rows of a
 * key of the hub list are then that hub's, opened in its root, and a sentence about the file names
 * the hub with it.
 */
export function fileRows(
    file: string,
    entries: Record<string, CatalogEntry>,
    config: Record<string, unknown>,
    user: UserFiles,
    hub?: string
): FileResult {
    const hubPlace: UserPlace = {
        layer: 'hub',
        root: user.hubFile === undefined ? null : (hub ?? PRIMARY_ROOT),
        path: HUB_FILE,
        present: user.hubFile?.present === true
    };
    const named = hub === undefined ? HUB_FILE : `${hub}/${HUB_FILE}`;
    const hubRead = readUserFile(hubPlace, user.hubFile?.text ?? NO_TEXT, '', named);
    const open = user.workspace;
    const workspacePlace: UserPlace = {
        layer: 'workspace',
        root: open?.root ?? null,
        path: open?.path ?? null,
        present: open !== null
    };
    const workspaceRead =
        open?.root == null ? null : readUserFile(workspacePlace, open.text, `${SETTINGS}.`);
    const listed = hubKeysOf(file) ?? [];
    const rows = Object.entries(entries).map(([key, entry]) =>
        rowOf(
            file,
            key,
            entry,
            config,
            listed.includes(key)
                ? hubRead.read
                : (workspaceRead?.read ?? { place: workspacePlace, parsed: null, prefix: '' })
        )
    );
    return {
        rows,
        ...(user.hubFile !== undefined && listed.length > 0 ? { hubFile: hubRead.result } : {}),
        ...(workspaceRead === null ? {} : { workspace: workspaceRead.result })
    };
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

/** The message saying a row's value is one its control cannot show, or null when it can. */
export function mismatchMessage(row: ConfigRow): Message | null {
    if (!row.mismatch) return null;
    const text = shown(row.value);
    if (row.control === 'toggle') return message('mismatchToggle', text);
    if (row.control === 'number') return message('mismatchNumber', text);
    const lists = row.control === 'list' || row.control === 'parked';
    if (lists || (row.control === 'multi' && row.entry.joined !== true)) {
        return message('mismatchList', text);
    }
    if (row.control === 'words') return message('mismatchBlock', text);
    return message('mismatchText', text);
}
