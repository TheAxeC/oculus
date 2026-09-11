// Layer 2, server. The write side of the application: one manifest field set from the page.
//
// routes/api/write/+server.ts is the endpoint and holds nothing but its POST, since a route module
// may export only its verbs; everything the write does is here. The order is the order of the
// refusals: the request must come from this application's own page and carry the process token, the
// body must be a write this route knows, the id must name a project the reader found, and the field
// must be one the schema names. Only then does yaml-edit touch the bytes, and only then, and only
// when something actually changed, is the file written.
//
// The path written is the reader's, never the request's: the id names a manifest readManifests
// already found under the hub's own scan directories, and the resolved path is checked against them
// again before the write. Nothing outside them is ever opened for writing.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { portfolioConfigFrom } from '../data/index.ts';
import { engineDir, loadConfig, loadLocal } from '../data/sources/config.ts';
import { readManifests } from '../data/sources/manifests.ts';
import { fieldNames } from '../data/validate.ts';
import { hasToken, sameOrigin } from './auth.ts';
import { setHidden, setOverride } from './sessions/overrides.ts';
import {
    addSubtask,
    appendEntry,
    deleteEntry,
    deleteSubtask,
    entryRange,
    renderEntry,
    reorderEntries,
    setEntryFields,
    setHostStatus,
    setSubtask
} from './entry-edit.ts';
import { asFieldValue, renderScalar, setFields } from './yaml-edit.ts';
import type { LineRange } from './entry-edit.ts';
import type { EditResult, FieldValue, Refusal } from './yaml-edit.ts';
import type { PortfolioConfig } from '../data/model.ts';

/**
 * What a write needs to know: which hub to write in, what its manifests are checked against, and
 * where the per-session overrides file is. The overrides path is absent on a machine that has not
 * set `sessions_overrides` in local.yml, and O12's own default is used then.
 */
export type WriteTarget = { hub: string; config: PortfolioConfig; overrides?: string };

export type WriteOutcome = {
    /** False when the hub holds no project with that id; then nothing was read and nothing written. */
    found: boolean;
    changed: string[];
    refused: Refusal[];
};

/** The name of the manifest file, which is the only name this module ever writes. */
const MANIFEST = 'project.yml';

/**
 * The field types, read out of the same `manifest_schema` the client's state/schema.ts reads. The
 * two readers are separate because the boundary table of DESIGN.md lets `state/` import `data/model`
 * and nothing else of layer 1, so a shared module would be a boundary violation rather than a
 * saving; what they share is the config file, which is the point of config as data.
 */
export function fieldTypes(schema: unknown): Record<string, string> {
    const types: Record<string, string> = {};
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) return types;
    const fields = (schema as Record<string, unknown>).fields;
    if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) return types;
    for (const [name, entry] of Object.entries(fields as Record<string, unknown>)) {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue;
        const type = (entry as Record<string, unknown>).type;
        if (typeof type === 'string') types[name] = type;
    }
    return types;
}

/** The words a checkbox is true in: what a form posts, and what YAML already holds. */
const TRUE = [true, 'true', 'True', '1', 'on', 1];

/** Types whose value is one line of text. */
const TEXTS = ['text', 'textarea', 'date', 'select'];

/** Types whose value is a list of strings. */
const LISTS = ['tags', 'chips', 'lines'];

/** A refusal reason, or the value to write. The two are told apart by the shape. */
type Coerced = { value: FieldValue } | { reason: string };

/**
 * One form value as the manifest's own kind of value. An empty text, an empty list and an unticked
 * checkbox all clear the field, which is what the form means by leaving a control empty. A number
 * the manifest holds as a number (`year`) stays a number, so editing the title beside it does not
 * turn it into a string.
 */
export function coerce(type: string, raw: unknown, current: unknown): Coerced {
    if (type === 'readonly') return { reason: 'the field is read-only' };
    if (type === 'keymap') return { reason: 'a map field is not written by the form' };
    if (type === 'checkbox') {
        return { value: TRUE.includes(raw as string | number | boolean) ? true : null };
    }
    if (LISTS.includes(type)) {
        const items =
            typeof raw === 'string'
                ? raw.split(type === 'lines' ? '\n' : ',')
                : Array.isArray(raw)
                  ? raw
                  : null;
        if (items === null) return { reason: 'the value is not a list' };
        const strings: string[] = [];
        for (const item of items) {
            if (typeof item !== 'string')
                return { reason: 'the list holds something not a string' };
            const trimmed = item.trim();
            if (trimmed !== '') strings.push(trimmed);
        }
        return { value: strings.length === 0 ? null : strings };
    }
    if (!TEXTS.includes(type)) return { reason: `unknown field type ${type}` };
    if (raw === null || raw === undefined) return { value: null };
    if (typeof raw === 'boolean' || typeof raw === 'number') return { value: raw };
    if (typeof raw !== 'string') return { reason: 'the value is not text' };
    const text = raw.trim();
    if (text === '') return { value: null };
    if (typeof current === 'number' && /^-?\d+(?:\.\d+)?$/.test(text))
        return { value: Number(text) };
    return { value: text };
}

/** The value a dotted field currently holds in a manifest record, or undefined. */
function currentOf(manifest: Record<string, unknown>, field: string): unknown {
    const dot = field.indexOf('.');
    if (dot < 0) return manifest[field];
    const parent = manifest[field.slice(0, dot)];
    if (typeof parent !== 'object' || parent === null || Array.isArray(parent)) return undefined;
    return (parent as Record<string, unknown>)[field.slice(dot + 1)];
}

/** Whether a path is a manifest inside one of the hub's own scan directories. */
export function insideHub(hub: string, config: PortfolioConfig, file: string): boolean {
    const path = resolve(file);
    if (basename(path) !== MANIFEST) return false;
    return config.scan.some((rule) => path.startsWith(resolve(join(hub, rule.dir)) + sep));
}

/**
 * Set fields of one project's manifest. The file is written only when the edit changed something,
 * so a form saved with nothing altered leaves the file's mtime alone.
 */
export function writeManifest(
    hub: string,
    config: PortfolioConfig,
    id: string,
    fields: Record<string, unknown>
): WriteOutcome {
    const { manifests } = readManifests(hub, config.scan);
    const manifest = manifests.find((one) => one.id === id);
    if (manifest === undefined) return { found: false, changed: [], refused: [] };
    if (!insideHub(hub, config, manifest.file)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: 'the manifest is not inside the hub' }]
        };
    }

    const named = new Set(fieldNames(config.schema));
    const types = fieldTypes(config.schema);
    const refused: Refusal[] = [];
    const wanted: Record<string, unknown> = {};
    for (const [field, raw] of Object.entries(fields)) {
        if (!named.has(field)) {
            refused.push({ field, reason: 'the manifest schema does not name the field' });
            continue;
        }
        const out = coerce(types[field] ?? 'text', raw, currentOf(manifest, field));
        if ('reason' in out) {
            refused.push({ field, reason: out.reason });
            continue;
        }
        wanted[field] = out.value;
    }

    let source: string;
    try {
        source = readFileSync(manifest.file, 'utf8');
    } catch {
        return {
            found: true,
            changed: [],
            refused: [...refused, { field: '', reason: 'the manifest could not be read' }]
        };
    }

    const edit = setFields(source, wanted);
    if (edit.changed.length > 0) writeFileSync(manifest.file, edit.text, 'utf8');
    return { found: true, changed: edit.changed, refused: [...refused, ...edit.refused] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One edit put on disk the way writeManifest does it: only when the edit changed something. */
function saved(file: string, source: string, edit: EditResult): WriteOutcome {
    if (edit.changed.length > 0 && edit.text !== source) writeFileSync(file, edit.text, 'utf8');
    return { found: true, changed: edit.changed, refused: edit.refused };
}

/** The file one collection key names, or null when sources.yml does not name it inside the hub. */
export function collectionFile(hub: string, config: PortfolioConfig, key: string): string | null {
    const named = config.collections.find((one) => one.key === key)?.file;
    if (named === undefined) return null;
    const path = resolve(join(hub, named));
    return path.startsWith(resolve(hub) + sep) ? path : null;
}

/** The field an entry is found by: the file's own schema's first field, `title` when it has none. */
export function identityField(schema: unknown): string {
    const names = fieldNames(schema);
    return names.length > 0 ? names[0] : 'title';
}

/** The id the reader gives an entry, normalise.ts line 323: its `key`, or its `title` without one. */
function entryId(entry: Record<string, unknown>): string {
    const key = entry.key;
    if (typeof key === 'string' && key !== '') return key;
    return typeof entry.title === 'string' ? entry.title : '';
}

/** The entry list of a parsed collection file: `entries:`, or the first list of maps beside it. */
function listOf(data: Record<string, unknown>): { key: string; items: unknown[] } | null {
    if (Array.isArray(data.entries)) return { key: 'entries', items: data.entries };
    for (const [key, value] of Object.entries(data)) {
        if (key === 'schema' || !Array.isArray(value)) continue;
        if (value.length === 0 || isRecord(value[0])) return { key, items: value };
    }
    return null;
}

/** One collection file read for a write: its text, its entry list and its identity field. */
type Collection = {
    file: string;
    source: string;
    schema: unknown;
    list: string;
    items: Record<string, unknown>[];
    ident: string;
};

function readCollection(hub: string, config: PortfolioConfig, key: string): Collection | null {
    const file = collectionFile(hub, config, key);
    if (file === null) return null;
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return null;
    }
    let data: unknown;
    try {
        data = parse(source);
    } catch {
        return null;
    }
    if (!isRecord(data)) return null;
    const list = listOf(data);
    if (list === null) return null;
    return {
        file,
        source,
        schema: data.schema,
        list: list.key,
        items: list.items.filter(isRecord),
        ident: identityField(data.schema)
    };
}

/**
 * The value the entry's identity field holds, which is what the text is addressed by. It is not the
 * id: funding.yml's schema opens with `title` while three of its entries carry a `key`, and the id
 * the reader made is that key, so the two are resolved here rather than assumed to agree.
 */
function identityOf(collection: Collection, id: string): string | null {
    for (const item of collection.items) {
        if (entryId(item) !== id) continue;
        const held = item[collection.ident];
        if (typeof held !== 'string' && typeof held !== 'number') return null;
        return String(held);
    }
    return null;
}

/** Set fields of one collection entry, found by the id the reader gave it. */
export function writeEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    id: string,
    fields: Record<string, unknown>
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    return saved(held.file, held.source, setEntryFields(held.source, held.ident, value, fields));
}

/**
 * Put one collection's entries in the order the reader dragged them into. The order is the identity
 * values, not the ids: it is what addresses an entry in the file, and it is what the card carries.
 */
export function reorderCollection(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    order: string[]
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    return saved(held.file, held.source, reorderEntries(held.source, held.ident, order));
}

/** Take one entry out of its collection file, found by the id the reader gave it. */
export function removeEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    id: string
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    return saved(held.file, held.source, deleteEntry(held.source, held.ident, value));
}

/** What a subtask write hangs under: one manifest, or one entry of one collection. */
export type SubtaskTarget = { id: string; collection?: string };

/** The file a subtask write edits, and the lines of the entry inside it when it is an entry's. */
type SubtaskHost = { file: string; source: string; range: LineRange | null };

function subtaskHost(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget
): SubtaskHost | null {
    if (target.collection !== undefined) {
        const held = readCollection(hub, config, target.collection);
        if (held === null) return null;
        const value = identityOf(held, target.id);
        if (value === null) return null;
        const range = entryRange(held.source, held.ident, value);
        if (range === null) return null;
        return { file: held.file, source: held.source, range };
    }
    const { manifests } = readManifests(hub, config.scan);
    const manifest = manifests.find((one) => one.id === target.id);
    if (manifest === undefined || !insideHub(hub, config, manifest.file)) return null;
    try {
        return { file: manifest.file, source: readFileSync(manifest.file, 'utf8'), range: null };
    } catch {
        return null;
    }
}

/** What one subtask button does to its line. */
export type SubtaskAction = 'done' | 'reopen' | 'snooze' | 'delete';

/** Tick one subtask line, reopen it, snooze it until a date, or take the line out. */
export function writeSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: SubtaskAction,
    value?: string
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const edit =
        action === 'delete'
            ? deleteSubtask(host.source, host.range, key)
            : action === 'snooze'
              ? setSubtask(host.source, host.range, key, { snooze: value ?? null })
              : setSubtask(host.source, host.range, key, { done: action === 'done' });
    return saved(host.file, host.source, edit);
}

/** Add one subtask line to a manifest or to a collection entry. */
export function writeSubtaskAdd(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    fields: Record<string, unknown>
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    return saved(host.file, host.source, addSubtask(host.source, host.range, fields));
}

/** The career file and the host statuses, read out of the same merged config every reader reads. */
function careerRules(): { file: string; statuses: string[] } {
    const merged = loadConfig(engineDir()).config;
    const file = typeof merged.career_file === 'string' ? merged.career_file : 'CAREER.yml';
    const held = merged.career_host_status;
    return { file, statuses: isRecord(held) ? Object.keys(held) : [] };
}

/** Set one host's status in CAREER.yml. A status outside the vocabulary is refused, never written. */
export function writeHost(hub: string, name: string, status: string): WriteOutcome {
    const rules = careerRules();
    const file = resolve(join(hub, rules.file));
    if (!file.startsWith(resolve(hub) + sep)) return { found: false, changed: [], refused: [] };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { found: false, changed: [], refused: [] };
    }
    let data: unknown;
    try {
        data = parse(source);
    } catch {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: 'the file does not parse' }]
        };
    }
    const hosts = isRecord(data) && Array.isArray(data.hosts) ? data.hosts : [];
    if (!hosts.some((one) => isRecord(one) && one.name === name)) {
        return { found: false, changed: [], refused: [] };
    }
    if (!rules.statuses.includes(status)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'status', reason: `${status} is not a career host status` }]
        };
    }
    return saved(file, source, setHostStatus(source, name, status));
}

/** Add one entry to a collection, rendered from the file's own schema. */
export function createEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    fields: Record<string, unknown>
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    const ident = held.ident;
    const raw = fields[ident];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value === '') {
        return {
            found: true,
            changed: [],
            refused: [{ field: ident, reason: `a new entry needs a ${ident}` }]
        };
    }
    if (held.items.some((one) => String(one[ident] ?? '') === value)) {
        return {
            found: true,
            changed: [],
            refused: [
                { field: ident, reason: `an entry with that ${ident} is already in the file` }
            ]
        };
    }

    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [];
    for (const [field, given] of Object.entries(fields)) {
        const one = asFieldValue(given);
        if (one === undefined) {
            refused.push({
                field,
                reason: 'not a string, number, boolean, list of strings or null'
            });
            continue;
        }
        values[field] = one;
    }
    values[ident] = value;

    const block = renderEntry(fieldNames(held.schema), ident, values);
    if (block === '') {
        return {
            found: true,
            changed: [],
            refused: [...refused, { field: ident, reason: 'nothing to write' }]
        };
    }
    const out = saved(held.file, held.source, appendEntry(held.source, held.list, block));
    return { ...out, refused: [...refused, ...out.refused] };
}

/** Where a new idea is scaffolded, and what an idea id may be. */
const IDEA_DIR = 'projects/ideas';
const IDEA_ID = /^[a-z0-9][a-z0-9-]*$/;

/** The two lines the scaffold states for itself; the user rewrites them when the idea is scoped. */
const IDEA_STATUS = 'New idea - scope + novelty check open.';
const IDEA_NEXT = 'Scope the idea; cited-novelty lit check; decide go/no-go.';

/** One text field of a form, trimmed, or the empty string when it is not text. */
function text(raw: unknown): string {
    return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * Scaffold one idea project: `projects/ideas/<id>/project.yml` and a README beside it. A bad id and
 * a folder that is already there are both refused, so nothing existing is ever written over.
 */
export function createIdea(hub: string, fields: Record<string, unknown>): WriteOutcome {
    const id = text(fields.id);
    if (!IDEA_ID.test(id)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'an id is lower case letters, digits and hyphens' }]
        };
    }
    const folder = resolve(join(hub, IDEA_DIR, id));
    if (!folder.startsWith(resolve(join(hub, IDEA_DIR)) + sep)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'not a folder name' }]
        };
    }
    if (existsSync(folder)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: `${IDEA_DIR}/${id} is already there` }]
        };
    }

    const title = text(fields.title) || id;
    const eli5 = text(fields.eli5) || title;
    const lines = [`id: ${id}`, 'type: idea'];
    const short = text(fields.short);
    const domain = text(fields.domain);
    if (short !== '') lines.push(`short: ${renderScalar(short)}`);
    if (domain !== '') lines.push(`domain: ${renderScalar(domain)}`);
    lines.push(
        `title: ${renderScalar(title)}`,
        'focus: holding',
        'status:',
        '  chips: [exploring]',
        `  line: ${renderScalar(IDEA_STATUS)}`,
        `eli5: ${renderScalar(eli5)}`,
        `next: ${renderScalar(IDEA_NEXT)}`
    );
    const manifest = `${lines.join('\n')}\n`;
    let parsed: unknown;
    try {
        parsed = parse(manifest);
    } catch {
        parsed = undefined;
    }
    if (!isRecord(parsed)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: 'the scaffold did not parse; nothing was written' }]
        };
    }
    const readme = `# ${title}\n\n${eli5}\n\n## Next\n\n${IDEA_NEXT}\n`;

    mkdirSync(dirname(folder), { recursive: true });
    mkdirSync(folder);
    writeFileSync(join(folder, 'project.yml'), manifest, 'utf8');
    writeFileSync(join(folder, 'README.md'), readme, 'utf8');
    return {
        found: true,
        changed: [`${IDEA_DIR}/${id}/project.yml`, `${IDEA_DIR}/${id}/README.md`],
        refused: []
    };
}

/** The body a write carries. `kind` is the discriminator later writes are added on. */
type ManifestWrite = { kind: 'manifest'; id: string; fields: Record<string, unknown> };

/**
 * The other body: one session dismissed from the rail or brought back to it, pinned to an area or
 * unpinned, renamed or given its own title back. A field the body does not name is not touched, and
 * a body naming none of the three is not a write.
 */
type SessionWrite = {
    kind: 'session';
    id: string;
    hidden?: boolean;
    /** An absolute directory to pin the session to, or the empty string to unpin it. */
    area?: string;
    /** The title to show instead of the transcript's own, or the empty string to clear it. */
    title?: string;
};

/** The body as a manifest write, or null when it is not one. */
export function manifestWrite(body: unknown): ManifestWrite | null {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
    const held = body as Record<string, unknown>;
    if (held.kind !== 'manifest' || typeof held.id !== 'string' || held.id === '') return null;
    const fields = held.fields;
    if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) return null;
    return { kind: 'manifest', id: held.id, fields: fields as Record<string, unknown> };
}

/**
 * The body as a session write, or null when it is not one. A field of the wrong type makes the whole
 * body unknown rather than being dropped quietly, and a body carrying none of the three fields is
 * not a write either: there would be nothing to do and nothing to answer with.
 */
export function sessionWrite(body: unknown): SessionWrite | null {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
    const held = body as Record<string, unknown>;
    if (held.kind !== 'session' || typeof held.id !== 'string' || held.id === '') return null;
    const write: SessionWrite = { kind: 'session', id: held.id };
    if (held.hidden !== undefined) {
        if (typeof held.hidden !== 'boolean') return null;
        write.hidden = held.hidden;
    }
    for (const key of ['area', 'title'] as const) {
        const value = held[key];
        if (value === undefined) continue;
        if (typeof value !== 'string') return null;
        write[key] = value;
    }
    if (write.hidden === undefined && write.area === undefined && write.title === undefined) {
        return null;
    }
    return write;
}

/** One collection entry's fields set from the entry editor. */
type EntryWrite = {
    kind: 'entry';
    collection: string;
    id: string;
    fields: Record<string, unknown>;
};

/** One subtask line acted on: the host it hangs under, which line, and what the button does. */
type SubtaskWrite = {
    kind: 'subtask';
    target: SubtaskTarget;
    key: string;
    action: SubtaskAction;
    value?: string;
};

/** One subtask line added to a host that may not have a block yet. */
type SubtaskAddWrite = {
    kind: 'subtask-add';
    target: SubtaskTarget;
    fields: Record<string, unknown>;
};

/** One host of CAREER.yml moved along the pipeline. */
type HostWrite = { kind: 'host'; name: string; status: string };

/** One new entry of one collection, and one new idea folder. */
type NewEntryWrite = { kind: 'new-entry'; collection: string; fields: Record<string, unknown> };
type NewIdeaWrite = { kind: 'new-idea'; fields: Record<string, unknown> };

/** One collection's entries in the order a drag left them: the identity values, all of them. */
type ReorderWrite = { kind: 'reorder'; collection: string; order: string[] };

/** One entry of one collection taken out of its file, by the id the reader gave it. */
type DeleteEntryWrite = { kind: 'delete-entry'; collection: string; id: string };

const ACTIONS: SubtaskAction[] = ['done', 'reopen', 'snooze', 'delete'];

/** The `target` of a subtask body: `{ id }` for a manifest, `{ collection, id }` for an entry. */
function targetOf(raw: unknown): SubtaskTarget | null {
    if (!isRecord(raw)) return null;
    if (typeof raw.id !== 'string' || raw.id === '') return null;
    if (raw.collection === undefined) return { id: raw.id };
    if (typeof raw.collection !== 'string' || raw.collection === '') return null;
    return { id: raw.id, collection: raw.collection };
}

/** The body as an entry write, or null when it is not one. */
export function entryWrite(body: unknown): EntryWrite | null {
    if (!isRecord(body) || body.kind !== 'entry') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (typeof body.id !== 'string' || body.id === '') return null;
    if (!isRecord(body.fields)) return null;
    return { kind: 'entry', collection: body.collection, id: body.id, fields: body.fields };
}

/** The body as a subtask write, or null when it is not one. */
export function subtaskWrite(body: unknown): SubtaskWrite | null {
    if (!isRecord(body) || body.kind !== 'subtask') return null;
    const target = targetOf(body.target);
    if (target === null) return null;
    if (typeof body.key !== 'string' || body.key === '') return null;
    const action = body.action;
    if (typeof action !== 'string' || !ACTIONS.includes(action as SubtaskAction)) return null;
    const write: SubtaskWrite = {
        kind: 'subtask',
        target,
        key: body.key,
        action: action as SubtaskAction
    };
    if (body.value !== undefined) {
        if (typeof body.value !== 'string') return null;
        write.value = body.value;
    }
    return write;
}

/** The body as a subtask add, or null when it is not one. */
export function subtaskAdd(body: unknown): SubtaskAddWrite | null {
    if (!isRecord(body) || body.kind !== 'subtask-add') return null;
    const target = targetOf(body.target);
    if (target === null || !isRecord(body.fields)) return null;
    if (typeof body.fields.do !== 'string' || body.fields.do.trim() === '') return null;
    return { kind: 'subtask-add', target, fields: body.fields };
}

/** The body as a host write, or null when it is not one. */
export function hostWrite(body: unknown): HostWrite | null {
    if (!isRecord(body) || body.kind !== 'host') return null;
    if (typeof body.name !== 'string' || body.name === '') return null;
    if (typeof body.status !== 'string' || body.status === '') return null;
    return { kind: 'host', name: body.name, status: body.status };
}

/** The body as a new entry, or null when it is not one. */
export function newEntry(body: unknown): NewEntryWrite | null {
    if (!isRecord(body) || body.kind !== 'new-entry') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (!isRecord(body.fields)) return null;
    return { kind: 'new-entry', collection: body.collection, fields: body.fields };
}

/**
 * The body as a reorder, or null when it is not one. An order of no values is a reorder of a file
 * with no entries in it and is answered by the writer, not refused here: what is refused here is a
 * body that is not the shape, an order that is not a list of words above all.
 */
export function reorderWrite(body: unknown): ReorderWrite | null {
    if (!isRecord(body) || body.kind !== 'reorder') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (!Array.isArray(body.order)) return null;
    if (!body.order.every((one) => typeof one === 'string' && one !== '')) return null;
    return { kind: 'reorder', collection: body.collection, order: body.order as string[] };
}

/** The body as an entry deletion, or null when it is not one. */
export function deleteEntryWrite(body: unknown): DeleteEntryWrite | null {
    if (!isRecord(body) || body.kind !== 'delete-entry') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (typeof body.id !== 'string' || body.id === '') return null;
    return { kind: 'delete-entry', collection: body.collection, id: body.id };
}

/** The body as a new idea, or null when it is not one. */
export function newIdea(body: unknown): NewIdeaWrite | null {
    if (!isRecord(body) || body.kind !== 'new-idea') return null;
    if (!isRecord(body.fields)) return null;
    if (typeof body.fields.id !== 'string' || body.fields.id === '') return null;
    return { kind: 'new-idea', fields: body.fields };
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** Where writes land on this machine: the hub of local.yml, read the way every other reader does. */
export function target(): WriteTarget {
    const engine = engineDir();
    const local = loadLocal(engine);
    return {
        hub: local.hub,
        config: portfolioConfigFrom(loadConfig(engine).config),
        overrides: local.sessionsOverrides
    };
}

/**
 * The whole endpoint: refuse, or write and say what changed. A refusal names what was wrong and
 * nothing more; the page shows it beside the form.
 */
export async function handleWrite(
    request: Request,
    token: string,
    into: WriteTarget
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token))
        return json(403, { error: 'the write token is missing or stale' });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    const session = sessionWrite(body);
    if (session !== null) {
        const changed: string[] = [];
        const refused: Refusal[] = [];
        try {
            if (session.hidden !== undefined) {
                setHidden(session.id, session.hidden, into.overrides);
                changed.push('hidden');
            }
            if (session.area !== undefined || session.title !== undefined) {
                const outcome = setOverride(
                    session.id,
                    { area: session.area, title: session.title },
                    into.overrides
                );
                changed.push(...outcome.changed);
                refused.push(...outcome.refused);
            }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return json(500, { error: `the session write could not be saved: ${reason}` });
        }
        return json(200, { ok: true, changed, refused });
    }

    const write = manifestWrite(body);
    if (write !== null) {
        const outcome = writeManifest(into.hub, into.config, write.id, write.fields);
        if (!outcome.found) return json(404, { error: `no project with the id ${write.id}` });
        return answer(outcome);
    }

    const entry = entryWrite(body);
    if (entry !== null) {
        const outcome = writeEntry(into.hub, into.config, entry.collection, entry.id, entry.fields);
        if (!outcome.found) {
            return json(404, { error: `no entry ${entry.id} in ${entry.collection}` });
        }
        return answer(outcome);
    }

    const subtask = subtaskWrite(body);
    if (subtask !== null) {
        const outcome = writeSubtask(
            into.hub,
            into.config,
            subtask.target,
            subtask.key,
            subtask.action,
            subtask.value
        );
        if (!outcome.found) return json(404, { error: notFound(subtask.target) });
        return answer(outcome);
    }

    const added = subtaskAdd(body);
    if (added !== null) {
        const outcome = writeSubtaskAdd(into.hub, into.config, added.target, added.fields);
        if (!outcome.found) return json(404, { error: notFound(added.target) });
        return answer(outcome);
    }

    const host = hostWrite(body);
    if (host !== null) {
        const outcome = writeHost(into.hub, host.name, host.status);
        if (!outcome.found) return json(404, { error: `no host named ${host.name}` });
        return answer(outcome);
    }

    const fresh = newEntry(body);
    if (fresh !== null) {
        const outcome = createEntry(into.hub, into.config, fresh.collection, fresh.fields);
        if (!outcome.found) return json(404, { error: `no collection ${fresh.collection}` });
        return answer(outcome);
    }

    const order = reorderWrite(body);
    if (order !== null) {
        const outcome = reorderCollection(into.hub, into.config, order.collection, order.order);
        if (!outcome.found) return json(404, { error: `no collection ${order.collection}` });
        return answer(outcome);
    }

    const removal = deleteEntryWrite(body);
    if (removal !== null) {
        const outcome = removeEntry(into.hub, into.config, removal.collection, removal.id);
        if (!outcome.found) {
            return json(404, { error: `no entry ${removal.id} in ${removal.collection}` });
        }
        return answer(outcome);
    }

    const idea = newIdea(body);
    if (idea !== null) return answer(createIdea(into.hub, idea.fields));

    return json(400, { error: 'the body is not a write this route knows' });
}

/** What every write answers with when it was asked something this route knows. */
function answer(outcome: WriteOutcome): Response {
    return json(200, { ok: true, changed: outcome.changed, refused: outcome.refused });
}

/** The 404 a subtask write gives: the manifest or the entry its target names is not in the hub. */
function notFound(target: SubtaskTarget): string {
    return target.collection === undefined
        ? `no project with the id ${target.id}`
        : `no entry ${target.id} in ${target.collection}`;
}
