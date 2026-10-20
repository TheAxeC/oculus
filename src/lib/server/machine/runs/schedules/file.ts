// Layer 2, server. The schedules file, `schedules.yml` in the hub's `.oculus` folder: a YAML list
// of entries that the reader writes by hand or through the update tray's dialog. This module reads
// it, checks each entry against the disk, and plans and commits a write.
//
// Reading is the shared rule of data/helpers/run/schedules.ts for the shape of an entry, with the
// checks that need the disk on top: a folder that exists, a prompt's folder that the hub or a
// served root holds, a command's repository the file browser serves and a plain entry of that
// name in its `.oculus/commands.yml` (`scheduledCommands`), a file that does not read being
// `commands-unread`. The names are compared over the whole list, so two entries of one name both
// carry `name-twice`.
// A file that does not parse, or whose top level is no list, is unread: no entry of it is read, and
// no write touches it.
//
// A write changes only what it changes. The file is parsed with `parseDocument`. A pause sets
// `paused: true` on the entry's node and a resume removes the key; a save sets each key whose value
// differs from the entry as the page read it and removes each key the dialog cleared. The change is
// written into the entry's text where the library's source ranges name the bytes (a value is
// replaced in its own range, a key goes with its line, a new key follows the last one), so every
// other key, its order, its comments and a value the reader's rule would normalise (an unknown
// task, an unknown key, `when: 5`) keep their bytes. An entry written in flow style, or a key that
// opens the entry's first line, is rendered from the changed node by the library instead, which
// keeps the keys, their order and their comments and writes a flow map with the library's spacing.
// A key whose value does not read (an unknown task, a flag that is not true or false) is the one a
// save writes whatever the reader's rule made of it, since the dialog opens it with none chosen. A
// line a write adds ends as the file's lines do, `\r\n` in a file whose lines all end that way. A
// new entry is rendered as a one-item block list with `runs` in flow style and `when` double-quoted
// and appended after the file's last byte; a delete removes the entry's span with the indent in
// front of its `-`. A file that holds no list yet (empty, comments only, `null` or `[]`) becomes a
// block list at its first write with its comments kept, and a list written in flow style becomes a
// block list by the library's own output. The text is parsed again before anything is written, and
// the raw list it holds must equal the raw list that was asked for (the old list with the one
// change, as the file wrote it, never the reader's rule's normalised entry), or the write is
// refused as `entry-unwritable` (an alias of another entry's anchor is the case) and the file is
// left as it is. The write names its entry by position and by the name the page read there, and is
// refused when the entry at that position has another name.

import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import {
    Document,
    Scalar,
    YAMLMap,
    YAMLSeq,
    isMap as isYamlMap,
    isScalar,
    isSeq,
    parseDocument
} from 'yaml';
import {
    changedNode,
    dashOf,
    inLineEnds,
    indented,
    itemColumn,
    itemText,
    patchedMap,
    replacedItem,
    withoutItem
} from '../../../../data/helpers/files/yaml/yaml-items.ts';
import {
    nameKey,
    nameOf,
    readEntry,
    unchosenKeys
} from '../../../../data/helpers/run/schedules.ts';
import type { ScheduleEntry, ScheduleProblem, UnchosenKey } from '../../../../data/model/index.ts';
import { expandHome } from '../../../files/files.ts';
import { inside, realPath } from '../../../core/paths.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import { fileUnread, readCommandsFile } from '../commands/files.ts';
import { repositoryOf } from '../commands/repo.ts';

/** The mode of the file: it names the folders and the prompts of this machine. */
const FILE_MODE = 0o600;

/** What the checks that need the disk read: the hub and the served roots. */
export type Disk = {
    /**
     * The primary hub's folder, `hub` of a folder and the first place a prompt may start in; null
     * while the workspace has no primary.
     */
    hub: string | null;
    /** The directories the file browser serves. */
    roots: string[];
};

/** One entry of the file as the page reads it. */
type Checked = {
    /** The entry's position in the file. */
    at: number;
    /** The name as written, empty when there is none. */
    name: string;
    /** The entry, or null when its shape does not read. */
    entry: ScheduleEntry | null;
    problem: ScheduleProblem | null;
    /** The keys whose value does not read, which the dialog opens with none chosen. */
    unchosen: UnchosenKey[];
};

/** What a read of the file gives: every entry in order, or that the file does not read. */
export type Reading = { ok: true; rows: Checked[] } | { ok: false; line: number | null };

/**
 * The folder a `folder` value names, `hub` being the primary hub and `~` the home folder; null for
 * `hub` while the workspace has no primary.
 */
export function resolveFolder(folder: string, hub: string | null): string | null {
    return folder === 'hub' ? hub : expandHome(folder);
}

/**
 * The folder a prompt starts in, or the problem with it: it must be a folder that exists, and its
 * real path must be the hub's or lie in or under the real path of the hub or of a served root.
 */
export function promptFolder(
    folder: string,
    disk: { hub: string | null; roots: string[] }
): { cwd: string } | ScheduleProblem {
    const cwd = resolveFolder(folder, disk.hub);
    const real = cwd === null ? null : realPath(cwd);
    if (cwd === null || real === null || !statSync(real).isDirectory()) {
        return { word: 'folder-missing', names: [folder] };
    }
    const served = [...(disk.hub === null ? [] : [disk.hub]), ...disk.roots].map((root) =>
        realPath(root)
    );
    if (!served.some((root) => root !== null && inside(real, root))) {
        return { word: 'folder-not-served', names: [folder] };
    }
    return { cwd };
}

/**
 * The commands a schedule can run in a repository: the names of the plain entries (one with a
 * `run`) of its `.oculus/commands.yml`, or null when the file does not read. A typed entry is a
 * task of an app, which a schedule does not start, and a found command is none of the reader's.
 */
export function scheduledCommands(repo: string): string[] | null {
    const read = readCommandsFile(repo, new Set());
    if (fileUnread(read)) return null;
    return read.commands.filter((one) => one.task === undefined).map((one) => one.name);
}

/** The checks of an entry that need the disk, each repository's commands file read once. */
export type DiskChecker = {
    /** The first problem the disk gives an entry, or null. */
    problem(entry: ScheduleEntry): ScheduleProblem | null;
};

export function diskChecker(disk: Disk): DiskChecker {
    const read = new Map<string, string[] | null>();
    const commandsOf = (repo: string): string[] | null => {
        if (!read.has(repo)) read.set(repo, scheduledCommands(repo));
        return read.get(repo) ?? null;
    };
    return {
        problem(entry): ScheduleProblem | null {
            const runs = entry.runs;
            if ('task' in runs) return null;
            if ('prompt' in runs) {
                const found = promptFolder(runs.folder, disk);
                return 'cwd' in found ? null : found;
            }
            const found = repositoryOf(resolveFolder(runs.folder, disk.hub), disk.roots);
            if ('error' in found) return { word: 'bad-repo', names: [] };
            const names = commandsOf(found.repo);
            if (names === null) return { word: 'commands-unread', names: [runs.folder] };
            return names.includes(runs.command)
                ? null
                : { word: 'command-missing', names: [runs.command, runs.folder] };
        }
    };
}

/** The parse of the file: the document and its list, or why it does not read. */
type Parsed =
    | { ok: true; text: string; doc: Document.Parsed; seq: YAMLSeq | null; list: unknown[] }
    | { ok: false; line: number | null };

/** The parse of a file's text, empty when there is no file. */
function parseFile(path: string): Parsed {
    let text = '';
    if (existsSync(path)) {
        try {
            text = readFileSync(path, 'utf8');
        } catch {
            return { ok: false, line: null };
        }
    }
    const doc = parseDocument(text, { prettyErrors: true, keepSourceTokens: true });
    if (doc.errors.length > 0) return { ok: false, line: doc.errors[0].linePos?.[0].line ?? null };
    const top = doc.contents;
    const empty = top === null || (isScalar(top) && top.value === null);
    if (!empty && !isSeq(top)) return { ok: false, line: null };
    try {
        const value = doc.toJS() as unknown;
        return {
            ok: true,
            text,
            doc,
            seq: isSeq(top) ? top : null,
            list: Array.isArray(value) ? value : []
        };
    } catch {
        return { ok: false, line: null };
    }
}

/**
 * Read the file into rows. `at` is the position in the list; the problem of a row is the first of
 * the shared rule's, then a name two entries hold, then the disk's.
 */
export function readSchedules(path: string, disk: Disk): Reading {
    const parsed = parseFile(path);
    if (!parsed.ok) return parsed;
    const checker = diskChecker(disk);
    const rows: Checked[] = parsed.list.map((raw, at) => {
        const read = readEntry(raw);
        const problem = read.problem ?? (read.entry === null ? null : checker.problem(read.entry));
        return { at, name: nameOf(raw), entry: read.entry, problem, unchosen: unchosenKeys(raw) };
    });
    const held = new Map<string, number>();
    for (const row of rows) {
        if (row.entry === null || row.name === '') continue;
        held.set(nameKey(row.name), (held.get(nameKey(row.name)) ?? 0) + 1);
    }
    for (const row of rows) {
        if (row.entry === null || row.name === '') continue;
        if ((held.get(nameKey(row.name)) ?? 0) < 2) continue;
        if (row.problem?.word === 'name-wrong') continue;
        row.problem = { word: 'name-twice', names: [row.name] };
    }
    return { ok: true, rows };
}

/** The plain object an entry is written as: a key whose value is the default is not written. */
function entryObject(entry: ScheduleEntry): Record<string, unknown> {
    const written: Record<string, unknown> = { name: entry.name, runs: { ...entry.runs } };
    if (entry.when !== '') written.when = entry.when;
    if (entry.paused) written.paused = true;
    if (entry.unattended) written.unattended = true;
    return written;
}

/** The library's node of an entry, with `runs` in flow style and `when` double-quoted. */
function entryNode(doc: Document, entry: ScheduleEntry): YAMLMap {
    const node = doc.createNode(entryObject(entry));
    if (!isYamlMap(node)) throw new Error('an entry is a map');
    const runs = node.get('runs', true);
    if (isYamlMap(runs)) runs.flow = true;
    const when = node.get('when', true);
    if (isScalar(when)) when.type = Scalar.QUOTE_DOUBLE;
    return node;
}

/** What a write of the file answers: the new text, or why it is refused. */
export type Planned =
    | {
          ok: true;
          /** The whole new text, or null when the write changes nothing. */
          text: string | null;
          /** The text of the file the plan was made from. */
          from: string;
          /** The entry as the file held it, null for a new one. */
          before: unknown;
          /** The entry as it is written, null for a deleted one. */
          after: unknown;
          /** The name the entry had in the file, null for a new one. */
          was: string | null;
      }
    | { ok: false; status: 400 | 409; error: ScheduleProblem['word']; names: string[] };

/** The one change a write makes. */
export type Edit =
    | { action: 'save'; at: number | null; was: string | null; entry: ScheduleEntry }
    | { action: 'delete'; at: number; name: string }
    | { action: 'pause' | 'resume'; at: number; name: string };

function refused(status: 400 | 409, error: ScheduleProblem['word'], names: string[] = []): Planned {
    return { ok: false, status, error, names };
}

/** The new text for a list that has no block item to splice into, built by the library. */
function rebuilt(parsed: Extract<Parsed, { ok: true }>, list: unknown[]): string {
    const { doc } = parsed;
    const seq = new YAMLSeq();
    seq.items.push(...list);
    seq.flow = false;
    const next = new Document();
    next.contents = seq;
    next.commentBefore = doc.commentBefore;
    next.comment = doc.comment;
    return next.toString({ lineWidth: 0 });
}

/** The text with the entry's `node` written at position `at` (replaced) or after the last one. */
function withEntry(parsed: Extract<Parsed, { ok: true }>, at: number | null, node: YAMLMap) {
    const { text, seq, doc } = parsed;
    const rendered = itemText(node);
    if (seq === null) {
        // No list yet: comments and the like stay, the list follows them or replaces `null`.
        const top = doc.contents;
        if (isScalar(top)) {
            const after = text.slice(top.range[1]);
            const body = rendered.replace(/\n$/, '');
            return (
                text.slice(0, top.range[0]) + body + (after.startsWith('\n') ? '' : '\n') + after
            );
        }
        return (text === '' || text.endsWith('\n') ? text : `${text}\n`) + rendered;
    }
    if (seq.flow === true) {
        if (seq.items.length === 0 && seq.range) {
            const body = rendered.replace(/\n$/, '');
            return text.slice(0, seq.range[0]) + body + text.slice(seq.range[1]);
        }
        const items: unknown[] = [...seq.items];
        if (at === null) items.push(node);
        else items[at] = node;
        return rebuilt(parsed, items);
    }
    const width = itemColumn(text, seq);
    if (at === null) {
        return (
            (text.endsWith('\n') ? text : `${text}\n`) +
            ' '.repeat(width) +
            indented(rendered, width)
        );
    }
    return replacedItem(text, seq, at, node) ?? rebuilt(parsed, withNode(seq, at, node));
}

/** The items of a list with the one at `at` replaced by `node`. */
function withNode(seq: YAMLSeq, at: number, node: YAMLMap): unknown[] {
    const items: unknown[] = [...seq.items];
    items[at] = node;
    return items;
}

/** The text with the entry at position `at` removed. */
function withoutEntry(parsed: Extract<Parsed, { ok: true }>, at: number): string {
    const { text, seq } = parsed;
    if (seq === null) return text;
    const spliced = seq.flow === true ? null : withoutItem(text, seq, at);
    if (spliced !== null) return spliced;
    return rebuilt(
        parsed,
        seq.items.filter((_, index) => index !== at)
    );
}

/** The keys of an entry, in the order a new entry writes them. */
type Key = 'name' | 'runs' | 'when' | 'paused' | 'unattended';

/** One key of an entry's node: set to `value`, or removed when `value` is undefined. */
type Change = { key: Key; value: unknown };

/**
 * The keys whose value in `entry` differs from the entry as the page read it, `held`. A key that
 * is equal after the reader's rule has read it is not touched, so what the rule normalised (an
 * unknown task, `when: 5`, `unattended: 1`) stays as the reader wrote it. A key whose value does
 * not read (`unchosen`) is the exception: the dialog opened it with none chosen, so the value it
 * sends is a choice and is written. A cleared `when` and a flag that is off are removed.
 */
function changesOf(held: ScheduleEntry, entry: ScheduleEntry, unchosen: UnchosenKey[]): Change[] {
    const changes: Change[] = [];
    if (held.name !== entry.name) changes.push({ key: 'name', value: entry.name });
    const chosenTask = unchosen.includes('task') && 'task' in entry.runs;
    if (chosenTask || !isDeepStrictEqual(held.runs, entry.runs)) {
        changes.push({ key: 'runs', value: { ...entry.runs } });
    }
    if (held.when !== entry.when) {
        changes.push({ key: 'when', value: entry.when === '' ? undefined : entry.when });
    }
    if (held.paused !== entry.paused) {
        changes.push({ key: 'paused', value: entry.paused ? true : undefined });
    }
    if (unchosen.includes('unattended') || held.unattended !== entry.unattended) {
        changes.push({ key: 'unattended', value: entry.unattended ? true : undefined });
    }
    return changes;
}

/** The entry as the file holds it, with the changes made: the raw object the text must read as. */
function changedRaw(raw: unknown, changes: Change[]): Record<string, unknown> {
    const gone = new Set<string>(
        changes.filter((one) => one.value === undefined).map((one) => one.key)
    );
    const next = Object.fromEntries(
        Object.entries(raw as Record<string, unknown>).filter(([key]) => !gone.has(key))
    );
    for (const change of changes) {
        if (change.value !== undefined) next[change.key] = change.value;
    }
    return next;
}

/** The library's node of a value written for `key`, in the style of the one it replaces. */
function valueNode(doc: Document, key: Key, value: unknown, old: unknown) {
    const node = doc.createNode(value);
    if (isYamlMap(node)) node.flow = true;
    if (isScalar(node) && typeof value === 'string') {
        const type = isScalar(old) && typeof old.value === 'string' ? old.type : undefined;
        node.type = type ?? (key === 'when' ? Scalar.QUOTE_DOUBLE : undefined);
    }
    return node;
}

/** The list the text holds, or null when it does not parse as one. */
function listOf(text: string): unknown[] | null {
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return null;
    try {
        const value = doc.toJS() as unknown;
        if (value === null) return [];
        return Array.isArray(value) ? value : null;
    } catch {
        return null;
    }
}

/** What a change comes to: the texts that may hold it, the raw list it must read as, the entry. */
type Drafted = { texts: string[]; asked: unknown[]; after: unknown };

/** The list with the item at `at` replaced by `item`, or `item` appended when `at` is null. */
function listWith(list: unknown[], at: number | null, item: unknown): unknown[] {
    return at === null ? [...list, item] : list.map((one, index) => (index === at ? item : one));
}

/** A whole entry written in place of the one at `at`, or after the last one. */
function wholeEntry(
    parsed: Extract<Parsed, { ok: true }>,
    at: number | null,
    entry: ScheduleEntry
) {
    const written = entryObject(entry);
    return {
        texts: [withEntry(parsed, at, entryNode(parsed.doc, entry))],
        asked: listWith(parsed.list, at, written),
        after: written
    };
}

/**
 * The entry at `at` after `changes`: written into its bytes where that can be done, and otherwise
 * rendered from its node with the changes made. A comment that stands before the item's `-` is
 * outside the span and is not rendered again. A node that cannot be rendered alone (a value that
 * is an alias of an anchor in another entry) adds no rendered text, so a change the bytes cannot
 * carry is left to `planEdit` to refuse.
 */
function changedEntry(
    parsed: Extract<Parsed, { ok: true }>,
    at: number,
    map: YAMLMap,
    changes: Change[]
): Drafted {
    const next = changedRaw(parsed.list[at], changes);
    const texts: string[] = [];
    const nodeOf = (key: string, value: unknown, old: unknown) =>
        valueNode(parsed.doc, key as Key, value, old);
    const patched = patchedMap(parsed.text, map, changes, nodeOf);
    if (patched !== null) texts.push(patched);
    const dash = parsed.seq === null ? null : dashOf(parsed.seq, at);
    const opening = dash === null || !map.range ? '' : parsed.text.slice(dash, map.range[0]);
    if (!opening.includes('#')) map.commentBefore = undefined;
    try {
        texts.push(withEntry(parsed, at, changedNode(map, changes, nodeOf)));
    } catch {
        // an alias whose anchor is in another entry cannot be rendered on its own
    }
    return { texts, asked: listWith(parsed.list, at, next), after: next };
}

/** The change an edit makes, or the refusal or the answer that it changes nothing. */
function drafted(parsed: Extract<Parsed, { ok: true }>, edit: Edit): Drafted | Planned {
    const { list } = parsed;
    if (edit.action === 'delete') {
        return {
            texts: [withoutEntry(parsed, edit.at)],
            asked: list.filter((_, index) => index !== edit.at),
            after: null
        };
    }
    const at = edit.at;
    if (edit.action === 'save' && at === null) return wholeEntry(parsed, null, edit.entry);
    if (at === null) return refused(409, 'entry-changed');
    const raw = list[at];
    const held = readEntry(raw);
    const map = parsed.seq?.items[at];
    let changes: Change[];
    if (edit.action === 'save') {
        if (held.entry === null || !isYamlMap(map)) return wholeEntry(parsed, at, edit.entry);
        changes = changesOf(held.entry, edit.entry, unchosenKeys(raw));
    } else {
        if (held.entry === null) return refused(400, held.problem.word, held.problem.names);
        const paused = edit.action === 'pause';
        changes =
            held.entry.paused === paused ? [] : [{ key: 'paused', value: paused || undefined }];
    }
    if (changes.length === 0) {
        return {
            ok: true,
            text: null,
            from: parsed.text,
            before: raw,
            after: raw,
            was: nameOf(raw)
        };
    }
    if (!isYamlMap(map)) return refused(409, 'entry-changed');
    return changedEntry(parsed, at, map, changes);
}

/**
 * Plan the write of one change: the new text of the file, checked, with nothing written. A file
 * that does not read is `schedules-unread`; a position that is gone or holds another name than
 * the one the page read is `entry-changed`; when no text parses back as the raw list asked for,
 * the change is refused as `entry-unwritable` and the file is left as it is.
 */
export function planEdit(path: string, edit: Edit): Planned {
    const parsed = parseFile(path);
    if (!parsed.ok) return refused(409, 'schedules-unread');
    const { list } = parsed;
    const at = edit.at;
    const raw = at === null ? undefined : list[at];
    if (at !== null) {
        const name = edit.action === 'save' ? edit.was : edit.name;
        if (at < 0 || at >= list.length || nameOf(raw) !== (name ?? '')) {
            return refused(409, 'entry-changed');
        }
    }
    const plan = drafted(parsed, edit);
    if ('ok' in plan) return plan;
    for (const candidate of plan.texts) {
        const text = inLineEnds(parsed.text, candidate);
        const holds = listOf(text);
        if (holds === null || !isDeepStrictEqual(holds, plan.asked)) continue;
        return {
            ok: true,
            text,
            from: parsed.text,
            before: raw === undefined ? null : raw,
            after: plan.after,
            was: at === null ? null : nameOf(raw)
        };
    }
    const name = edit.action === 'save' ? edit.entry.name : nameOf(raw);
    return refused(409, 'entry-unwritable', [name]);
}

/**
 * Whether the file holds exactly this text now. A file that does not exist holds the empty text, as
 * `parseFile` reads it, so the first entry of a hub with no schedules file is written; a file that
 * cannot be read holds no text.
 */
export function holdsText(path: string, text: string): boolean {
    if (!existsSync(path)) return text === '';
    try {
        return readFileSync(path, 'utf8') === text;
    } catch {
        return false;
    }
}

/**
 * Write the planned text, private, and read it back: the reason when it is not there as written.
 */
export function commitText(
    path: string,
    text: string
): { ok: true } | { ok: false; reason: string } {
    try {
        mkdirSync(dirname(path), { recursive: true });
        writeTextAtomic(path, text, FILE_MODE);
        if (readFileSync(path, 'utf8') !== text) {
            throw new Error('what was read back is not what was written');
        }
        return { ok: true };
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
}
