// Layer 2, server. The manifest half of the write path: what a form value becomes, which paths may
// be written at all, one project.yml edited, and one new idea folder scaffolded.
//
// A manifest's path is the reader's, never the request's: the id names a manifest hubManifests
// already found, under the hub's own scan directories or as the manifest of a workspace folder that
// is a project, and insideHub (for a scan folder) or isFolderFile (for a workspace folder) checks
// the resolved path again before the write. The fields a write may name are the fields of
// `manifest_schema`, whatever the project's tier.
//
// Every reason a write refuses with is a line of config/text/server.yml under
// `server.manifest_write`, worded with `words` from the configuration's text catalog.
//
// server/edit/writes.ts is the route and re-exports the writers an importer needs (`coerce`,
// `createIdea`, `fieldTypes` and `writeManifest`); the undo imports `manifestValue`
// from this file to read a manifest's value back before it writes.
//
// A write that clears a field puts the text it removed on that field's change record. The undo
// hands it back to `writeManifest`, which puts it where it stood when it fits the file; otherwise
// the value is written as any value is, on a new line, or inside its line for text removed from a
// flow map.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { existsSync, lstatSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { byKey, isMap } from '../../../data/helpers/guards.ts';
import { ROOT_FOLDER, inScan, tierOf } from '../../../data/helpers/hub-names.ts';
import { projectFileIn } from '../../../data/sources/manifests.ts';
import { hubManifests } from '../../files/roots.ts';
import { throughSchema } from '../../../data/snapshot/hubs/references.ts';
import { fieldNames } from '../../../data/snapshot/validate.ts';
import { plain } from '../../core/changes.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import { mapShape, readAs } from '../../../data/shapes/shapes.ts';
import { hasWord, wordsWith } from '../../../data/shapes/vocab-keys.ts';
import { setFields } from '../yaml/yaml-edit.ts';
import { renderScalar } from '../../../data/helpers/files/yaml/collection-text.ts';
import { insertRemoved } from './restore.ts';
import type { ChangeRecord, RemovedText } from '../../core/changes.ts';
import type { Refusal, SetFieldsResult } from '../yaml/yaml-edit.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import type { PortfolioConfig, RawManifest, SchemaField, Tier } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';
import { below, inside, realPath } from '../../core/paths.ts';

/** The name of the manifest file, which is the only name this module ever writes. */
const MANIFEST = 'project.yml';

/**
 * The fields no write touches. `id` is the name of the project's folder, or the key of its root,
 * which data/sources/manifests.ts reads it from, so writing it would put the file at odds with its
 * own location.
 */
const READ_ONLY = ['id'];

/** One field of a schema, which declares a type when it holds a text `type`. */
const fieldTypeShape = z.looseObject({ type: z.string() });

/**
 * The type of every field of a schema that declares one, keyed by the field's name in the order
 * the schema gives them, out of the schema's `fields` map. An entry that is no map or has no text
 * `type` is left out, and a schema of no `fields` map declares none.
 */
const fieldTypesShape = z
    .object({ fields: mapShape })
    .transform((schema) => {
        const types: Record<string, string> = {};
        for (const [name, entry] of Object.entries(schema.fields)) {
            const declared = fieldTypeShape.safeParse(entry);
            if (declared.success) types[name] = declared.data.type;
        }
        return types;
    })
    .catch(() => ({}));

/**
 * The field types, read out of the same `manifest_schema` the client's state/forms/schema.ts reads.
 * The two readers are separate because the boundary table lets `state/` import
 * `data/model` and `data/helpers/guards` and nothing else of layer 1, so a shared module would be a
 * boundary violation rather than a saving; what they share is the config file, which is the point
 * of config as data.
 */
export function fieldTypes(schema: unknown): Record<string, string> {
    return fieldTypesShape.parse(schema);
}

/** The `from:` of a manifest field: one source or a list of them. */
const fromShape = z
    .union([z.string().transform((one) => [one]), z.array(z.string())])
    .optional()
    .catch(undefined);

/** One field of a schema with its type and `from:`, in the `fields` map or a list row. */
const sourcedShape = z.looseObject({ type: z.string(), from: fromShape });

/**
 * The fields of a manifest schema in the shape the walk of data/snapshot/hubs/references.ts reads,
 * from the `fields` map of `manifest_schema`.
 */
const schemaFieldsShape = z
    .object({ fields: mapShape })
    .transform((schema) => sourced(Object.entries(schema.fields)))
    .catch(() => []);

/** The named entries that read as a field with a type, each as a schema field. */
function sourced(entries: [string, unknown][]): SchemaField[] {
    const out: SchemaField[] = [];
    for (const [field, entry] of entries) {
        const read = sourcedShape.safeParse(entry);
        if (field === '' || !read.success) continue;
        const { type, from } = read.data;
        out.push(from === undefined ? { field, type } : { field, type, from });
    }
    return out;
}

/**
 * The fields with the hub's name and a colon taken off every value that names a record (a `from:`
 * of the manifest schema naming a registry or the projects), since the portfolio names a record by
 * its hub and its key (data/snapshot/hubs/merge.ts) and the hub's own manifest holds the key. A
 * value without the prefix, the key a form sends, is kept as it is.
 */
function hubOwnFields(
    schema: unknown,
    fields: Record<string, unknown>,
    key: string
): Record<string, unknown> {
    const lead = `${key}:`;
    return throughSchema(schemaFieldsShape.parse(schema), fields, (value) =>
        value.startsWith(lead) ? value.slice(lead.length) : value
    );
}

/** The words a checkbox is true in: what a form posts, and what YAML already holds. */
const TRUE = [true, 'true', 'True', '1', 'on', 1];

/** Types whose value is one line of text. */
const TEXTS = ['text', 'textarea', 'date', 'select'];

/** Types whose value is a list of strings. */
const LISTS = ['tags', 'chips', 'lines'];

/** The types a form control of the manifest has, which `coerce` reads a value of. */
const WRITABLE = ['checkbox', ...LISTS, ...TEXTS];

/** A refusal reason, or the value to write. The two are told apart by the shape. */
type Coerced = { value: FieldValue } | { reason: string };

/**
 * How the values of one write are read. A `form` value is what a control posted, so an empty
 * control clears its field (`coerce`). A `record` value is what a change record holds, the value
 * the file had, and is written as it is, so an empty list, an empty text and `false` go back into
 * the file and `null` takes the field out.
 */
export type ValueReading = 'form' | 'record';

/**
 * Why a field of this type is never written, whichever way its value is read, or null when it may
 * be: the schema decides what may be written, for a record as for a form.
 */
function unwritable(type: string, catalog: Record<string, string>): string | null {
    if (type === 'readonly') return words(catalog, 'server.manifest_write.read_only');
    if (type === 'keymap') return words(catalog, 'server.manifest_write.map_field');
    if (!WRITABLE.includes(type)) return words(catalog, 'server.manifest_write.unknown_type', type);
    return null;
}

/**
 * One form value as the manifest's own kind of value. An empty text, an empty list and an unticked
 * checkbox all clear the field, which is what the form means by leaving a control empty. A number
 * the manifest holds as a number (`year`) stays a number, so editing the title beside it does not
 * turn it into a string.
 */
export function coerce(
    type: string,
    raw: unknown,
    current: unknown,
    catalog: Record<string, string>
): Coerced {
    const reason = unwritable(type, catalog);
    if (reason !== null) return { reason };
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
        if (items === null) return { reason: words(catalog, 'server.manifest_write.not_list') };
        const strings: string[] = [];
        for (const item of items) {
            if (typeof item !== 'string')
                return { reason: words(catalog, 'server.manifest_write.list_not_strings') };
            const trimmed = item.trim();
            if (trimmed !== '') strings.push(trimmed);
        }
        return { value: strings.length === 0 ? null : strings };
    }
    if (raw === null || raw === undefined) return { value: null };
    if (typeof raw === 'boolean' || typeof raw === 'number') return { value: raw };
    if (typeof raw !== 'string')
        return { reason: words(catalog, 'server.manifest_write.not_text') };
    const text = raw.trim();
    if (text === '') return { value: null };
    if (typeof current === 'number' && /^-?\d+(?:\.\d+)?$/.test(text))
        return { value: Number(text) };
    return { value: text };
}

/** One value read the way the write says, as `coerce` does for a form and as it is for a record. */
function readValue(
    reading: ValueReading,
    type: string,
    raw: unknown,
    current: unknown,
    catalog: Record<string, string>
): { value: unknown } | { reason: string } {
    if (reading === 'form') return coerce(type, raw, current, catalog);
    const reason = unwritable(type, catalog);
    return reason === null ? { value: raw } : { reason };
}

/** The value a dotted field currently holds in a manifest record, or undefined. */
function currentOf(manifest: Record<string, unknown>, field: string): unknown {
    const dot = field.indexOf('.');
    if (dot < 0) return manifest[field];
    const name = field.slice(0, dot);
    const parent = manifest[name];
    return isMap(parent) ? parent[field.slice(dot + 1)] : undefined;
}

/**
 * A manifest a write may edit: its file, the keys it holds now, the schema that names the fields a
 * write may touch, and why the file may not be written when it may not.
 */
type Home = {
    file: string;
    data: Record<string, unknown>;
    schema: unknown;
    refusal: string | null;
};

/**
 * Whether the manifest of a project of a workspace folder is a manifest file of that folder: its
 * top `project.yml` or its `.oculus/project.yml`.
 */
function isFolderFile(manifest: RawManifest): boolean {
    if (manifest.workspaceFolder === undefined) return false;
    const file = resolve(manifest.file);
    const { dir } = manifest.workspaceFolder;
    return (
        file === resolve(join(dir, MANIFEST)) || file === resolve(join(dir, ROOT_FOLDER, MANIFEST))
    );
}

/**
 * The manifest an id names, or null when there is none. It is found by hubManifests among the hub's
 * scan directories and the repositories among the workspace's folders that are projects.
 */
function homeOf(hub: string, config: PortfolioConfig, id: string): Home | null {
    const manifest = hubManifests(hub, config).find((one) => one.id === id);
    if (manifest === undefined) return null;
    const own =
        manifest.workspaceFolder === undefined
            ? insideHub(hub, config, manifest.file)
            : isFolderFile(manifest);
    const refused =
        manifest.workspaceFolder === undefined
            ? words(config.text, 'server.manifest_write.not_in_hub')
            : words(config.text, 'server.manifest_write.not_folder_file');
    return {
        file: manifest.file,
        data: manifest,
        schema: config.schema,
        refusal: own ? null : refused
    };
}

/**
 * The file one manifest id names and the text it holds, for a write that edits the file's lines
 * (a subtask), or null when the id names no manifest or the manifest may not be written.
 */
export function manifestSource(
    hub: string,
    config: PortfolioConfig,
    id: string
): { file: string; source: string } | null {
    const home = homeOf(hub, config, id);
    if (home === null) return null;
    if (home.refusal !== null) return null;
    try {
        return { file: home.file, source: readFileSync(home.file, 'utf8') };
    } catch {
        return null;
    }
}

/**
 * The value one manifest field holds now, and whether the hub still has that project at all. It is
 * what an undo checks before it writes: a field the reader has since edited by hand is not written
 * over by taking an older change back.
 */
export function manifestValue(
    hub: string,
    config: PortfolioConfig,
    id: string,
    field: string
): { found: boolean; value: unknown } {
    const home = homeOf(hub, config, id);
    if (home === null) return { found: false, value: null };
    const value = currentOf(home.data, field);
    return { found: true, value: value === undefined ? null : value };
}

/** Whether a path is a manifest inside one of the hub's own scan directories. */
function insideHub(hub: string, config: PortfolioConfig, file: string): boolean {
    const path = resolve(file);
    if (basename(path) !== MANIFEST) return false;
    return config.scan.some((rule) => below(path, join(hub, rule.dir)));
}

/** The removed lines of a record: where they stood, what they said and the text after them. */
const removedShape = z.object({
    offset: z.number().refine((at) => Number.isInteger(at) && at >= 0),
    text: z.string().min(1),
    next: z.string()
}) satisfies z.ZodType<RemovedText>;

/**
 * The removed lines of a change record, or null when the record holds none that can be used: the
 * key is a map with a non-negative whole `offset`, a non-empty `text` and a `next` that is a
 * string. The log is a file a hand may have edited, so anything else is read as no lines at all.
 */
function removedOf(raw: unknown): RemovedText | null {
    return readAs(removedShape, raw);
}

/**
 * The lines of a removed field put back, when the write is that one field with a value to give
 * back and the lines fit the file; null when the value is to be written instead.
 */
function putBack(
    source: string,
    wanted: Record<string, unknown>,
    back: RemovedText | null,
    catalog: Record<string, string>
): SetFieldsResult | null {
    const entries = Object.entries(wanted);
    if (back === null || entries.length !== 1) return null;
    const [[field, value]] = entries;
    if (value === null) return null;
    const out = insertRemoved(source, field, value, back, catalog);
    return out.changed.length > 0 ? { ...out, removed: {} } : null;
}

/**
 * Set fields of one project's manifest. The file is written only when the edit changed something,
 * so a form saved with nothing altered leaves the file's mtime alone. The values are read as a form
 * unless `reading` says they are a change record's (`ValueReading`).
 *
 * `removed` is the lines a change record kept of the one field being given back. It is used only
 * for a record's value, and when it is well formed and fits the file the lines are put back where
 * they stood instead of the value being written; a record's group name is given a value only that
 * way. Every check of the write is made first, so a record that fails one is refused as any
 * other.
 *
 * `hubKey` is the name of the hub the manifest belongs to: a value of a field that names a record
 * may come with that name in front, and is written without it.
 */
export function writeManifest(
    hub: string,
    config: PortfolioConfig,
    id: string,
    given: Record<string, unknown>,
    reading: ValueReading = 'form',
    removed?: unknown,
    hubKey?: string
): WriteOutcome {
    const manifest = homeOf(hub, config, id);
    if (manifest === null) return { found: false, changed: [], refused: [] };
    if (manifest.refusal !== null) {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: manifest.refusal }]
        };
    }

    const fields = hubKey === undefined ? given : hubOwnFields(manifest.schema, given, hubKey);
    const named = new Set(fieldNames(manifest.schema));
    // The parents of the dotted names, `status` for `status.line`: a group the schema names by its
    // children may be cleared whole by its parent name. A value for the parent is still refused:
    // only its children take one.
    const groups = new Set(
        [...named].filter((one) => one.includes('.')).map((one) => one.slice(0, one.indexOf('.')))
    );
    const types = fieldTypes(manifest.schema);
    const single = reading === 'record' && Object.keys(fields).length === 1;
    const back = single ? removedOf(removed) : null;
    const refused: Refusal[] = [];
    const wanted: Record<string, unknown> = {};
    // A group given a value, which only its removed lines can write.
    const offered: string[] = [];
    for (const [field, raw] of Object.entries(fields)) {
        if (!named.has(field)) {
            const clearing = raw === null || raw === undefined || raw === '';
            if (groups.has(field) && clearing) {
                wanted[field] = null;
                continue;
            }
            if (groups.has(field) && back !== null) {
                wanted[field] = raw;
                offered.push(field);
                continue;
            }
            refused.push({
                field,
                reason: groups.has(field)
                    ? words(config.text, 'server.manifest_write.group')
                    : words(config.text, 'server.manifest_write.not_in_schema')
            });
            continue;
        }
        if (READ_ONLY.includes(field.split('.')[0])) {
            refused.push({
                field,
                reason: words(config.text, 'server.manifest_write.id_read_only')
            });
            continue;
        }
        const out = readValue(
            reading,
            types[field] ?? 'text',
            raw,
            currentOf(manifest.data, field),
            config.text
        );
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
            refused: [
                ...refused,
                { field: '', reason: words(config.text, 'server.manifest_write.unreadable') }
            ]
        };
    }

    const restored = putBack(source, wanted, back, config.text);
    if (restored === null) {
        for (const field of offered) {
            refused.push({ field, reason: words(config.text, 'server.manifest_write.group') });
        }
    }
    const edit =
        restored ??
        setFields(
            source,
            Object.fromEntries(
                Object.entries(wanted).filter(([field]) => !offered.includes(field))
            ),
            config.text
        );
    if (edit.changed.length > 0) writeTextAtomic(manifest.file, edit.text);
    // The value each field had is read off the manifest the edit was computed against, so the
    // record is made where both halves are in hand rather than by reading the file again.
    const records: ChangeRecord[] = edit.changed.map((field) => {
        const record: ChangeRecord = {
            file: manifest.file,
            key: id,
            field,
            before: plain(currentOf(manifest.data, field)),
            after: plain(wanted[field]),
            undo: 'field'
        };
        const cut = byKey(edit.removed, field);
        return cut === undefined ? record : { ...record, removed: cut };
    });
    return {
        found: true,
        changed: edit.changed,
        refused: [...refused, ...edit.refused],
        records
    };
}

/** What a new project's id may be. */
const IDEA_ID = /^[a-z0-9][a-z0-9-]*$/;

/** One text field of a form, trimmed, or the empty string when it is not text. */
const trimmedShape = z
    .string()
    .transform((raw) => raw.trim())
    .catch('');

/** The text fields of the new-project form. */
const ideaFormShape = z.object({
    id: trimmedShape,
    title: trimmedShape,
    eli5: trimmedShape,
    short: trimmedShape,
    domain: trimmedShape,
    tier: trimmedShape
});

/** One refused field of a new project, with the sentence of the text catalog that says why. */
function ideaRefusal(field: string, reason: string): WriteOutcome {
    return { found: true, changed: [], refused: [{ field, reason }] };
}

/** The hub-relative folder as a path with forward slashes and no `.` or trailing slash. */
function relativeFolder(text: string): string {
    return normalize(text).split(sep).join('/').replace(/\/+$/, '');
}

/**
 * The first folder, from `folder` up to the hub, that is a project, hub-relative, or null. The walk
 * starts where the folder lands once every link on the way is followed, so a link into a project's
 * subfolder is walked up from its real place.
 */
function projectAbove(hub: string, folder: string): string | null {
    const home = intendedPath(hub);
    const start = intendedPath(join(hub, folder));
    if (home === null || start === null) return null;
    for (let dir = start; below(dir, home); dir = dirname(dir)) {
        if (projectFileIn(dir) !== null) return relative(home, dir).split(sep).join('/');
    }
    return null;
}

/**
 * Where a path ends up on disk, links followed: the real path of the deepest folder that exists on
 * the way to it, with the folders that do not exist yet added under it. Null when a link on the way
 * leads nowhere, since a folder made through it lands where nothing says.
 */
function intendedPath(path: string): string | null {
    const missing: string[] = [];
    let at = resolve(path);
    for (;;) {
        const real = realPath(at, true);
        if (real !== null) return join(real, ...missing.reverse());
        try {
            lstatSync(at);
            return null;
        } catch {
            // Nothing is there: the folder is made, so the check goes one folder up.
        }
        const up = dirname(at);
        if (up === at) return null;
        missing.push(basename(at));
        at = up;
    }
}

/**
 * Whether a folder made at `folder` lands inside the hub and inside one of the scan folders once
 * every link on the way is followed, so a link in the typed folder cannot lead the write out of
 * either.
 */
function reachesInside(folder: string, hub: string, scans: string[]): boolean {
    const there = intendedPath(folder);
    const home = intendedPath(hub);
    if (there === null || home === null || !inside(there, home)) return false;
    return scans.some((scan) => {
        const place = intendedPath(scan);
        return place !== null && inside(there, place);
    });
}

/**
 * Scaffold one new project: `<folder>/<id>/project.yml` and a README beside it. The manifest holds
 * the project's `id`, its `tier`, the first type of `types` carrying `idea` and, as its one chip,
 * the first status carrying `new_idea`; a tier carrying `backlog` starts it in the Focus backlog
 * (`focus: holding`). Its status line, its `next` and its README are the words of
 * config/text/server.yml for that tier (`idea_status_<tier>`, `idea_next_<tier>`, a tier with no
 * `next` word gets no `next`). `fields.tier` is the tier of the board that sent the form and
 * `fields.folder` the folder it was made in; a write that names neither is made in the first tier
 * carrying `main` under that tier's `new_project_dir`. A bad id, an id a project already holds, a
 * tier with no words, a hub that names no folder for the tier, an empty folder, a folder outside
 * every scan folder, a folder inside a project and a folder that is already there are all refused,
 * so nothing existing is ever written over. The outcome's `id` is the new project's id.
 */
export function createIdea(
    hub: string,
    config: PortfolioConfig,
    fields: Record<string, unknown>
): WriteOutcome {
    const catalog = config.text;
    const form = ideaFormShape.parse(fields);
    const { id } = form;
    if (!IDEA_ID.test(id)) {
        return ideaRefusal('id', words(catalog, 'server.manifest_write.idea_id'));
    }
    if (hubManifests(hub, config).some((one) => one.id === id)) {
        return ideaRefusal('id', words(catalog, 'server.manifest_write.idea_id_taken', id));
    }
    const vocab = config.merged;
    const main = wordsWith(vocab, 'tiers', 'main')[0] ?? '';
    const tier: Tier | undefined = tierOf(fields.tier === undefined ? main : form.tier);
    const statusText =
        tier === undefined
            ? undefined
            : byKey(catalog, `server.manifest_write.idea_status_${tier}`);
    if (tier === undefined || statusText === undefined) {
        return ideaRefusal('tier', words(catalog, 'server.manifest_write.idea_tier', form.tier));
    }
    const named =
        fields.folder === undefined
            ? config.newProjectDir[tier]
            : trimmedShape.parse(fields.folder);
    if (named === undefined) {
        return ideaRefusal('folder', words(catalog, 'server.manifest_write.idea_no_folder', tier));
    }
    if (named === '') {
        return ideaRefusal('folder', words(catalog, 'server.manifest_write.idea_folder_empty'));
    }
    const parent = relativeFolder(named);
    if (
        isAbsolute(parent) ||
        parent.split('/').includes('..') ||
        !inScan(
            parent,
            config.scan.map((rule) => rule.dir)
        )
    ) {
        return ideaRefusal(
            'folder',
            words(catalog, 'server.manifest_write.idea_folder_outside', parent)
        );
    }
    const scans = config.scan.map((rule) => join(hub, rule.dir));
    if (!reachesInside(join(hub, parent), hub, scans)) {
        return ideaRefusal(
            'folder',
            words(catalog, 'server.manifest_write.idea_folder_outside', parent)
        );
    }
    const holder = projectAbove(hub, parent);
    if (holder !== null) {
        return ideaRefusal(
            'folder',
            words(catalog, 'server.manifest_write.idea_folder_in_project', parent, holder)
        );
    }
    const folder = resolve(join(hub, parent, id));
    if (existsSync(folder)) {
        return ideaRefusal('id', words(catalog, 'server.manifest_write.idea_exists', parent, id));
    }

    const nextText = byKey(catalog, `server.manifest_write.idea_next_${tier}`);
    const title = form.title || id;
    const eli5 = form.eli5 || title;
    const type = wordsWith(vocab, 'types', 'idea').at(0);
    const chip = wordsWith(vocab, 'statuses', 'new_idea').at(0);
    const lines = [`id: ${id}`, `tier: ${tier}`];
    if (type !== undefined) lines.push(`type: ${renderScalar(type)}`);
    const { short, domain } = form;
    if (short !== '') lines.push(`short: ${renderScalar(short)}`);
    if (domain !== '') lines.push(`domain: ${renderScalar(domain)}`);
    lines.push(`title: ${renderScalar(title)}`);
    if (hasWord(vocab, 'tiers', 'backlog', tier)) lines.push('focus: holding');
    lines.push(
        'status:',
        `  chips: [${chip === undefined ? '' : renderScalar(chip)}]`,
        `  line: ${renderScalar(statusText)}`,
        `eli5: ${renderScalar(eli5)}`
    );
    if (nextText !== undefined) lines.push(`next: ${renderScalar(nextText)}`);
    const manifest = `${lines.join('\n')}\n`;
    let parsed: unknown;
    try {
        parsed = parse(manifest);
    } catch {
        parsed = undefined;
    }
    if (!isMap(parsed)) {
        return ideaRefusal('', words(catalog, 'server.manifest_write.idea_unparsed'));
    }
    const readme =
        nextText === undefined
            ? `# ${title}\n\n${eli5}\n`
            : `# ${title}\n\n${eli5}\n\n## Next\n\n${nextText}\n`;

    mkdirSync(dirname(folder), { recursive: true });
    mkdirSync(folder);
    writeTextAtomic(join(folder, MANIFEST), manifest);
    writeTextAtomic(join(folder, 'README.md'), readme);
    return {
        found: true,
        changed: [`${parent}/${id}/${MANIFEST}`, `${parent}/${id}/README.md`],
        refused: [],
        id,
        // A scaffolded folder has no inverse writer, so the record says what was made and offers no
        // way back: deleting a project folder is the researcher's own act, not a control of a list.
        records: [
            {
                file: join(folder, MANIFEST),
                key: id,
                field: 'entries',
                before: null,
                after: parsed,
                undo: 'none'
            }
        ]
    };
}
