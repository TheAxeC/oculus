// Layer 2, server. The writes of the command form into a repository's `.oculus/commands.yml`:
// Add Command... adds an entry at the end of the `commands:` list, Edit rewrites one plain entry
// (one with a `run`) in its place, and Delete removes one. A typed entry, a task type of an app,
// is never written here.
//
// The file is edited in its bytes, as the schedules file is
// (data/helpers/files/yaml/yaml-items.ts): a new entry is rendered as one item of the block list
// and placed after the list's last item, with the indent of its items; an edit writes each changed
// key into the bytes of its own value, takes the line of a key it clears and adds a key after the
// entry's last one, so a key the form does not show (`problemMatcher`) and every comment and quote
// keep their bytes; a delete takes the item's lines. A list written in flow style, and an entry the
// bytes cannot carry the change in, are rendered from the library's node instead. A file that is
// missing is made from its template, the `commands.yml` block of oculus's docs/templates.md, with
// the entry added. A `commands:` with no list yet takes the entry after the file's last byte when
// it is the file's last key, and on the line after the key otherwise.
//
// Every planned text is parsed again before anything is written, and it must read as the file did
// with the one change made, every other key of the file and every other entry as they were, or the
// write is refused as `unwritable` and the file is left as it is. A file that cannot be read, is
// not YAML, has no map at its top or a `commands` that is not a list is refused as `unread` with
// the reason the reading gives, and an edit or a delete of a name no plain entry has as
// `not-held`. The text is written whole by a rename and read back.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import {
    Document,
    YAMLSeq,
    isMap as isYamlMap,
    isNode,
    isScalar,
    isSeq,
    parseDocument,
    type Pair,
    type YAMLMap
} from 'yaml';
import { writeTextAtomic } from '../../../core/json.ts';
import {
    changedNode,
    endOf,
    inLineEnds,
    indented,
    itemColumn,
    itemText,
    patchedMap,
    replacedItem,
    valueText,
    withoutItem,
    type KeyChange
} from '../../../../data/helpers/files/yaml/yaml-items.ts';
import { lineStart } from '../../../../data/helpers/files/yaml/yaml-ranges.ts';
import { commandsFile, type Entry } from './files.ts';

/** The keys of an entry the form shows, in the order a new entry writes them. */
const FORM_KEYS = ['name', 'run', 'cwd', 'depends_on', 'default'] as const;

/** The column a new list's items take beyond the key they stand under. */
const STEP = 2;

/** One change the form makes to the file. */
export type CommandChange =
    | { action: 'add'; entry: Entry }
    | { action: 'edit'; was: string; entry: Entry }
    | { action: 'delete'; name: string };

/** Why a write is refused, each a word of `server.commands` with the names its sentence fills. */
export type CommandRefusal = 'unread' | 'not-held' | 'unwritable' | 'no-template';

/** What a write of the file comes to: the new text with the entry before and after, or why not. */
export type CommandPlan =
    | { ok: true; text: string; before: unknown; after: unknown }
    | { ok: false; refusal: CommandRefusal; names: string[] };

function refused(refusal: CommandRefusal, names: string[] = []): CommandPlan {
    return { ok: false, refusal, names };
}

/** The entry as the file writes it: only the keys that hold something, in the form's order. */
function storedEntry(entry: Entry): Record<string, unknown> {
    return {
        name: entry.name,
        run: entry.run,
        ...(entry.cwd ? { cwd: entry.cwd } : {}),
        ...(entry.depends_on && entry.depends_on.length > 0
            ? { depends_on: entry.depends_on }
            : {}),
        ...(entry.default ? { default: entry.default } : {})
    };
}

/** The library's node of a value: a list in flow style, a text quoted as the one it replaces. */
function valueNode(doc: Document, value: unknown, old: unknown) {
    const node = doc.createNode(value);
    if (isSeq(node)) node.flow = true;
    if (isScalar(node) && typeof value === 'string' && isScalar(old)) {
        if (typeof old.value === 'string') node.type = old.type;
    }
    return node;
}

/** The library's node of a new entry, its `depends_on` in flow style. */
function entryNode(doc: Document, entry: Entry): YAMLMap {
    const node = doc.createNode(storedEntry(entry));
    if (!isYamlMap(node)) throw new Error('an entry is a map');
    const needs = node.get('depends_on', true);
    if (isSeq(needs)) needs.flow = true;
    return node;
}

/** What the file holds, parsed: the document, its top map, the `commands` pair and its list. */
type Parsed = {
    text: string;
    doc: Document.Parsed;
    top: YAMLMap | null;
    pair: Pair | null;
    seq: YAMLSeq | null;
    /** The whole file as plain values, and its `commands` list as plain values. */
    value: Record<string, unknown>;
    list: unknown[];
};

/** The file's text parsed down to its list, or the reason it does not read. */
function parseText(text: string): Parsed | { reason: string } {
    const doc = parseDocument(text, { keepSourceTokens: true });
    if (doc.errors.length > 0) {
        const at = doc.errors[0].linePos?.[0].line;
        return { reason: at === undefined ? 'is not YAML' : `is not YAML, at line ${at}` };
    }
    const contents = doc.contents;
    const empty = contents === null || (isScalar(contents) && contents.value === null);
    if (!empty && !isYamlMap(contents)) return { reason: 'must be a map with a commands list' };
    const top = isYamlMap(contents) ? contents : null;
    const pair =
        top?.items.find((one) => isScalar(one.key) && one.key.value === 'commands') ?? null;
    const held = pair?.value ?? null;
    const none = held === null || (isScalar(held) && held.value === null);
    if (!none && !isSeq(held)) return { reason: 'must be a list of commands' };
    const value = (empty ? {} : doc.toJS()) as Record<string, unknown>;
    const list = Array.isArray(value.commands) ? (value.commands as unknown[]) : [];
    return { text, doc, top, pair, seq: isSeq(held) ? held : null, value, list };
}

/** The whole file as plain values after the change, or null when it does not parse. */
function readsAs(text: string): unknown {
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return null;
    try {
        return doc.toJS() ?? {};
    } catch {
        return null;
    }
}

/** The name of an entry as the file holds it, when it is a plain one (a `run` and no `type`). */
function plainName(raw: unknown): string | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const entry = raw as Record<string, unknown>;
    if (entry.type !== undefined && entry.type !== null) return null;
    if (typeof entry.run !== 'string' || typeof entry.name !== 'string') return null;
    return entry.name;
}

/** The text with a block list's new item after its last one, in the indent of its items. */
function appended(parsed: Parsed, seq: YAMLSeq, node: YAMLMap): string | null {
    const { text } = parsed;
    const end = endOf(seq, seq.items.length - 1);
    if (end === null) return null;
    const width = itemColumn(text, seq);
    const body = ' '.repeat(width) + indented(itemText(node), width);
    const open = end > 0 && text[end - 1] !== '\n';
    return text.slice(0, end) + (open ? '\n' : '') + body + text.slice(end);
}

/** The text with a new list of one item where the file has none yet. */
function firstItem(parsed: Parsed, node: YAMLMap): string {
    const { text, top, pair } = parsed;
    const key = pair !== null && isNode(pair.key) ? pair.key : null;
    const column = key?.range ? key.range[0] - lineStart(text, key.range[0]) : 0;
    const width = column + STEP;
    const body = ' '.repeat(width) + indented(itemText(node), width);
    const ended = text === '' || text.endsWith('\n') ? text : `${text}\n`;
    if (!key?.range) return `${ended}commands:\n${body}`;
    const last = top?.items.at(-1) === pair;
    if (last) return ended + body;
    const colon = text.indexOf(':', key.range[1]);
    const after = text.indexOf('\n', colon);
    const at = after < 0 ? text.length : after + 1;
    return text.slice(0, at) + (after < 0 ? '\n' : '') + body + text.slice(at);
}

/** The text with the flow list of `commands` rendered as `items`, in flow style. */
function flowList(parsed: Parsed, seq: YAMLSeq, items: unknown[]): string | null {
    if (!seq.range) return null;
    const next = new YAMLSeq();
    next.items.push(...items);
    next.flow = true;
    return parsed.text.slice(0, seq.range[0]) + valueText(next) + parsed.text.slice(seq.range[1]);
}

/** The changes of the form's keys from the entry the file holds to the edited one. */
function changesOf(raw: Record<string, unknown>, entry: Entry): KeyChange[] {
    const next = storedEntry(entry);
    const changes: KeyChange[] = [];
    for (const key of FORM_KEYS) {
        const held = raw[key] ?? undefined;
        const wanted = next[key];
        if (isDeepStrictEqual(held, wanted)) continue;
        if (wanted === undefined && (held === '' || (Array.isArray(held) && held.length === 0))) {
            continue;
        }
        changes.push({ key, value: wanted });
    }
    return changes;
}

/** The candidate texts of one change and the file as plain values it must read as. */
type Drafted = { texts: (string | null)[]; asked: unknown; before: unknown; after: unknown };

function draftAdd(parsed: Parsed, entry: Entry): Drafted {
    const node = entryNode(parsed.doc, entry);
    const after = storedEntry(entry);
    const asked = { ...parsed.value, commands: [...parsed.list, after] };
    const { seq } = parsed;
    if (seq === null) return { texts: [firstItem(parsed, node)], asked, before: null, after };
    if (seq.flow === true) {
        return { texts: [flowList(parsed, seq, [...seq.items, node])], asked, before: null, after };
    }
    if (seq.items.length === 0)
        return { texts: [firstItem(parsed, node)], asked, before: null, after };
    return { texts: [appended(parsed, seq, node)], asked, before: null, after };
}

function draftEdit(parsed: Parsed, seq: YAMLSeq, at: number, entry: Entry): Drafted {
    const raw = parsed.list[at] as Record<string, unknown>;
    const changes = changesOf(raw, entry);
    const dropped = new Set(changes.filter((one) => one.value === undefined).map((one) => one.key));
    const next: Record<string, unknown> = Object.fromEntries(
        Object.entries(raw).filter(([key]) => !dropped.has(key))
    );
    for (const change of changes) {
        if (change.value !== undefined) next[change.key] = change.value;
    }
    const asked = {
        ...parsed.value,
        commands: parsed.list.map((one, index) => (index === at ? next : one))
    };
    const map = seq.items[at];
    if (!isYamlMap(map)) return { texts: [], asked, before: raw, after: next };
    const nodeOf = (_key: string, value: unknown, old: unknown) =>
        valueNode(parsed.doc, value, old);
    const texts: (string | null)[] = [patchedMap(parsed.text, map, changes, nodeOf)];
    const rendered = changedNode(map, changes, nodeOf);
    if (seq.flow === true) texts.push(flowList(parsed, seq, seq.items));
    else texts.push(replacedItem(parsed.text, seq, at, rendered));
    return { texts, asked, before: raw, after: next };
}

function draftDelete(parsed: Parsed, seq: YAMLSeq, at: number): Drafted {
    const asked = { ...parsed.value, commands: parsed.list.filter((_, index) => index !== at) };
    const texts =
        seq.flow === true
            ? [
                  flowList(
                      parsed,
                      seq,
                      seq.items.filter((_, index) => index !== at)
                  )
              ]
            : [withoutItem(parsed.text, seq, at)];
    return { texts, asked, before: parsed.list[at], after: null };
}

/**
 * Plan one change of the repository's `.oculus/commands.yml`: the new text, checked, with nothing
 * written. `template` is the text a missing file is made from, null when the templates page has
 * none.
 */
export function planCommand(
    repo: string,
    change: CommandChange,
    template: string | null
): CommandPlan {
    const file = commandsFile(repo);
    let text: string;
    if (existsSync(file)) {
        try {
            text = readFileSync(file, 'utf8');
        } catch {
            return refused('unread', [file, 'cannot be read']);
        }
    } else {
        if (change.action !== 'add')
            return refused('not-held', [change.action === 'edit' ? change.was : change.name]);
        if (template === null) return refused('no-template');
        text = template;
    }
    const parsed = parseText(text);
    if ('reason' in parsed) return refused('unread', [file, parsed.reason]);
    let drafted: Drafted;
    if (change.action === 'add') drafted = draftAdd(parsed, change.entry);
    else {
        const name = change.action === 'edit' ? change.was : change.name;
        const at = parsed.list.findIndex((raw) => plainName(raw) === name);
        if (at < 0 || parsed.seq === null) return refused('not-held', [name]);
        drafted =
            change.action === 'edit'
                ? draftEdit(parsed, parsed.seq, at, change.entry)
                : draftDelete(parsed, parsed.seq, at);
    }
    for (const candidate of drafted.texts) {
        if (candidate === null) continue;
        const next = inLineEnds(text, candidate);
        if (!isDeepStrictEqual(readsAs(next), drafted.asked)) continue;
        return { ok: true, text: next, before: drafted.before, after: drafted.after };
    }
    const name = change.action === 'delete' ? change.name : change.entry.name;
    return refused('unwritable', [name]);
}

/** Write the planned text whole and read it back: the reason when it is not there as written. */
export function commitCommands(
    repo: string,
    text: string
): { ok: true } | { ok: false; reason: string } {
    const file = commandsFile(repo);
    try {
        mkdirSync(dirname(file), { recursive: true });
        writeTextAtomic(file, text);
        if (readFileSync(file, 'utf8') !== text) {
            throw new Error('what was read back is not what was written');
        }
        return { ok: true };
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
}
