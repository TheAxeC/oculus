// Layer 2, server. The manifest half of the write path: what a form value becomes, which paths may
// be written at all, one project.yml edited, and one new idea folder scaffolded.
//
// A research manifest's path is the reader's, never the request's: the id names a manifest
// readManifests already found under the hub's own scan directories, and insideHub checks the
// resolved path against them again before the write.
//
// A side project is the one other manifest a write reaches. Its id (`side:<slug>` or `root:<key>`)
// is found among the side projects of the portfolio the server last published, which carry the
// absolute file readPersonal found, and not through readManifests, so the server's two readers stay
// apart. The file must be the side project's own project.yml (the folder of the hub's side-projects
// tier, or `.oculus/project.yml` of its served root), and no other file is opened for writing. The
// fields a write may name are the rows of `side_project_schema`, where a research manifest's are
// the fields of `manifest_schema`.
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
// flow map. A write that rewrote a bare note or a list of one note as a map puts the text it
// replaced on that field's record, and the undo writes that text back over the lines the write
// left when the file still holds them, so the note returns in its own shape.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { byKey, isMap } from '../../../data/helpers/guards.ts';
import { ROOT_FOLDER, isSideTier } from '../../../data/helpers/hub-names.ts';
import { readManifests } from '../../../data/sources/manifests.ts';
import { throughSchema } from '../../../data/snapshot/hubs/references.ts';
import { fieldNames } from '../../../data/snapshot/validate.ts';
import { plain } from '../../core/changes.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import { mapShape, readAs } from '../../../data/shapes/shapes.ts';
import { noteMapOf, setFields } from '../yaml/yaml-edit.ts';
import { renderScalar } from '../../../data/helpers/files/yaml/collection-text.ts';
import { insertRemoved, insertReplaced } from './restore.ts';
import type { ChangeRecord, RemovedText, ReplacedText } from '../../core/changes.ts';
import type { Refusal, SetFieldsResult } from '../yaml/yaml-edit.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import type { PortfolioConfig, SchemaField, SideProject } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';
import { below } from '../../core/paths.ts';

/** The name of the manifest file, which is the only name this module ever writes. */
const MANIFEST = 'project.yml';

/** One field of a schema, which declares a type when it holds a text `type`. */
const fieldTypeShape = z.looseObject({ type: z.string() });

/** One row of a schema written as a list: a text `field` and a text `type`. */
const fieldRowShape = z.looseObject({ field: z.string(), type: z.string() });

/**
 * The type of every field of a schema that declares one, keyed by the field's name in the order
 * the schema gives them. The schema is a `fields` map (`manifest_schema`) or a list of rows with a
 * `field` key (`side_project_schema`); an entry that is no map or has no text `type` is left out,
 * and a schema of neither form declares none.
 */
const fieldTypesShape = z
    .union([
        z.object({ fields: mapShape }).transform((schema) => {
            const types: Record<string, string> = {};
            for (const [name, entry] of Object.entries(schema.fields)) {
                const declared = fieldTypeShape.safeParse(entry);
                if (declared.success) types[name] = declared.data.type;
            }
            return types;
        }),
        z.array(z.unknown()).transform((rows) => {
            const types: Record<string, string> = {};
            for (const row of rows) {
                const declared = fieldRowShape.safeParse(row);
                if (declared.success) types[declared.data.field] = declared.data.type;
            }
            return types;
        })
    ])
    .catch(() => ({}));

/**
 * The field types, read out of the same `manifest_schema` the client's state/forms/schema.ts reads,
 * and out of the list form of `side_project_schema`. The two readers are separate because the
 * boundary table of DESIGN.md lets `state/` import `data/model` and `data/helpers/guards` and
 * nothing else of layer 1, so a shared module would be a boundary violation rather than a saving;
 * what they share is the config file, which is the point of config as data.
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
 * from the `fields` map (`manifest_schema`) or the list of rows (`side_project_schema`).
 */
const schemaFieldsShape = z
    .union([
        z
            .object({ fields: mapShape })
            .transform((schema) => sourced(Object.entries(schema.fields))),
        z
            .array(z.unknown())
            .transform((rows) =>
                sourced(rows.map((row) => [isMap(row) ? fieldNameOf(row.field) : '', row]))
            )
    ])
    .catch(() => []);

/** A row's field name, and '' for one that is not text. */
function fieldNameOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

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
 * The fields with the hub's key and colon taken off every value that names a record of the hub (a
 * `from:` of the manifest schema naming a registry or the projects), since the portfolio gives
 * those values the key (data/snapshot/hubs/merge.ts) and the hub's own manifest holds the ids it
 * gave them. A value without the prefix is kept as it is.
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
    // A note held as a bare text or a list of one reads as the map it stands for.
    const held = noteMapOf(name, parent) ?? (isMap(parent) ? parent : undefined);
    return held?.[field.slice(dot + 1)];
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

/** The manifest's keys as the file holds them, or null when the file is unreadable or no map. */
function heldKeys(file: string): Record<string, unknown> | null {
    try {
        const parsed: unknown = parse(readFileSync(file, 'utf8'));
        return isMap(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * Whether a side project's file is its own project.yml: the file in the folder its source names,
 * under one of the hub's side-projects folders for a hub project, and `.oculus/project.yml` of the
 * served root for a repository.
 */
function isOwnFile(hub: string, config: PortfolioConfig, side: SideProject): boolean {
    const file = resolve(side.file);
    if (basename(file) !== MANIFEST) return false;
    if (side.source.kind === 'root') {
        return file === resolve(join(side.source.dir, ROOT_FOLDER, MANIFEST));
    }
    const own = resolve(join(hub, side.source.folder, MANIFEST));
    return (
        file === own &&
        config.scan.some((rule) => isSideTier(rule) && below(file, join(hub, rule.dir)))
    );
}

/**
 * The manifest an id names, or null when there is none. A research project is found by
 * readManifests among the hub's scan directories; any other id is looked for among the side
 * projects of the portfolio the server last published, whose manifest must read as a map. A
 * research id is never taken for a side project.
 */
function homeOf(
    hub: string,
    config: PortfolioConfig,
    sides: readonly SideProject[],
    id: string
): Home | null {
    const { manifests } = readManifests(hub, config.scan, config.text);
    const manifest = manifests.find((one) => one.id === id);
    if (manifest !== undefined) {
        return {
            file: manifest.file,
            data: manifest,
            schema: config.schema,
            refusal: insideHub(hub, config, manifest.file)
                ? null
                : words(config.text, 'server.manifest_write.not_in_hub')
        };
    }
    const side = sides.find((one) => one.id === id);
    if (side === undefined) return null;
    const data = heldKeys(side.file);
    if (data === null) return null;
    return {
        file: side.file,
        data,
        schema: config.merged.side_project_schema,
        refusal: isOwnFile(hub, config, side)
            ? null
            : words(config.text, 'server.manifest_write.not_own_file')
    };
}

/**
 * The file one manifest id names and the text it holds, for a write that edits the file's lines
 * (a subtask), or null when the id names no manifest or the manifest may not be written.
 */
export function manifestSource(
    hub: string,
    config: PortfolioConfig,
    sides: readonly SideProject[],
    id: string
): { file: string; source: string } | null {
    const home = homeOf(hub, config, sides, id);
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
    sides: readonly SideProject[],
    id: string,
    field: string
): { found: boolean; value: unknown } {
    const home = homeOf(hub, config, sides, id);
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

/** The note a record's write rewrote: where its lines stand, what they say, what they replaced. */
const replacedShape = z.object({
    offset: z.number().refine((at) => Number.isInteger(at) && at >= 0),
    before: z.string().min(1),
    after: z.string().min(1)
}) satisfies z.ZodType<ReplacedText>;

/**
 * The removed lines of a change record, or null when the record holds none that can be used: the
 * key is a map with a non-negative whole `offset`, a non-empty `text` and a `next` that is a
 * string. The log is a file a hand may have edited, so anything else is read as no lines at all.
 */
function removedOf(raw: unknown): RemovedText | null {
    return readAs(removedShape, raw);
}

/**
 * A rewritten note put back as the text it replaced, when the write is that one field and the file
 * still holds the lines the rewrite left; null when the value is to be written instead.
 */
function putBackNote(
    source: string,
    wanted: Record<string, unknown>,
    note: ReplacedText | null
): SetFieldsResult | null {
    const entries = Object.entries(wanted);
    if (note === null || entries.length !== 1) return null;
    const [[field, value]] = entries;
    const out = insertReplaced(source, field, value, note);
    return out.changed.length > 0 ? { ...out, removed: {}, replaced: {} } : null;
}

/**
 * The lines of a removed field put back, when the write is that one field with a value to give
 * back and the lines fit the file; null when the value is to be written instead.
 */
function putBack(
    source: string,
    wanted: Record<string, unknown>,
    back: RemovedText | null
): SetFieldsResult | null {
    const entries = Object.entries(wanted);
    if (back === null || entries.length !== 1) return null;
    const [[field, value]] = entries;
    if (value === null) return null;
    const out = insertRemoved(source, field, value, back);
    return out.changed.length > 0 ? { ...out, removed: {}, replaced: {} } : null;
}

/**
 * Set fields of one project's manifest. The file is written only when the edit changed something,
 * so a form saved with nothing altered leaves the file's mtime alone. The values are read as a form
 * unless `reading` says they are a change record's (`ValueReading`).
 *
 * `removed` is the lines a change record kept of the one field being given back. It is used only
 * for a record's value, and when it is well formed and fits the file the lines are put back where
 * they stood instead of the value being written; a record's group name is given a value only that
 * way. `replaced` is the note a change record kept of a bare note or a list of one note that its
 * write rewrote as a map: when the file still holds the lines that write left, the note goes back
 * as the text it was, and otherwise the value is written. Every check of the write is made first,
 * so a record that fails one is refused as any other.
 *
 * `hubKey` is the key of the hub the manifest belongs to when it is not the first hub: the values
 * of the fields that name records come with that key in front, and are written without it.
 */
export function writeManifest(
    hub: string,
    config: PortfolioConfig,
    sides: readonly SideProject[],
    id: string,
    given: Record<string, unknown>,
    reading: ValueReading = 'form',
    removed?: unknown,
    replaced?: unknown,
    hubKey?: string
): WriteOutcome {
    const manifest = homeOf(hub, config, sides, id);
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
    // The parents of the dotted names, `followup` for `followup.do` and `followup.after`: a group
    // the schema names by its children may be cleared whole by its parent name, since the file may
    // hold it as a bare note, a map or a list and clearing one child of a note is not a write the
    // editor can make. A value for the parent is still refused: only its children take one.
    const groups = new Set(
        [...named].filter((one) => one.includes('.')).map((one) => one.slice(0, one.indexOf('.')))
    );
    const types = fieldTypes(manifest.schema);
    const single = reading === 'record' && Object.keys(fields).length === 1;
    const back = single ? removedOf(removed) : null;
    const note = single ? readAs(replacedShape, replaced) : null;
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

    const restored = putBackNote(source, wanted, note) ?? putBack(source, wanted, back);
    if (restored === null) {
        for (const field of offered) {
            refused.push({ field, reason: words(config.text, 'server.manifest_write.group') });
        }
    }
    const edit =
        restored ??
        setFields(
            source,
            Object.fromEntries(Object.entries(wanted).filter(([field]) => !offered.includes(field)))
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
        const span = byKey(edit.replaced, field);
        return {
            ...record,
            ...(cut === undefined ? {} : { removed: cut }),
            ...(span === undefined ? {} : { replaced: span })
        };
    });
    return {
        found: true,
        changed: edit.changed,
        refused: [...refused, ...edit.refused],
        records
    };
}

/** Where a new idea is scaffolded, and what an idea id may be. */
const IDEA_DIR = 'projects/ideas';
const IDEA_ID = /^[a-z0-9][a-z0-9-]*$/;

/** The two lines the scaffold states for itself; the user rewrites them when the idea is scoped. */
const IDEA_STATUS = 'New idea - scope + novelty check open.';
const IDEA_NEXT = 'Scope the idea; cited-novelty lit check; decide go/no-go.';

/** One text field of a form, trimmed, or the empty string when it is not text. */
const trimmedShape = z
    .string()
    .transform((raw) => raw.trim())
    .catch('');

/** The five text fields of the new-idea form. */
const ideaFormShape = z.object({
    id: trimmedShape,
    title: trimmedShape,
    eli5: trimmedShape,
    short: trimmedShape,
    domain: trimmedShape
});

/**
 * Scaffold one idea project: `projects/ideas/<id>/project.yml` and a README beside it. A bad id and
 * a folder that is already there are both refused, so nothing existing is ever written over.
 */
export function createIdea(
    hub: string,
    catalog: Record<string, string>,
    fields: Record<string, unknown>
): WriteOutcome {
    const form = ideaFormShape.parse(fields);
    const { id } = form;
    if (!IDEA_ID.test(id)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: words(catalog, 'server.manifest_write.idea_id') }]
        };
    }
    const folder = resolve(join(hub, IDEA_DIR, id));
    if (!below(folder, join(hub, IDEA_DIR))) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: words(catalog, 'server.manifest_write.idea_folder') }]
        };
    }
    if (existsSync(folder)) {
        return {
            found: true,
            changed: [],
            refused: [
                {
                    field: 'id',
                    reason: words(catalog, 'server.manifest_write.idea_exists', IDEA_DIR, id)
                }
            ]
        };
    }

    const title = form.title || id;
    const eli5 = form.eli5 || title;
    const lines = [`id: ${id}`, 'type: idea'];
    const { short, domain } = form;
    if (short !== '') lines.push(`short: ${renderScalar(short)}`);
    if (domain !== '') lines.push(`domain: ${renderScalar(domain)}`);
    lines.push(
        `title: ${renderScalar(title)}`,
        'focus: holding',
        'status:',
        '  chips: [nascent]',
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
    if (!isMap(parsed)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: words(catalog, 'server.manifest_write.idea_unparsed') }]
        };
    }
    const readme = `# ${title}\n\n${eli5}\n\n## Next\n\n${IDEA_NEXT}\n`;

    mkdirSync(dirname(folder), { recursive: true });
    mkdirSync(folder);
    writeTextAtomic(join(folder, 'project.yml'), manifest);
    writeTextAtomic(join(folder, 'README.md'), readme);
    return {
        found: true,
        changed: [`${IDEA_DIR}/${id}/project.yml`, `${IDEA_DIR}/${id}/README.md`],
        refused: [],
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
