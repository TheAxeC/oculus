// Layer 2, client state. The manifest edit form as data: what config/schemas/manifest-schema.yml
// says a field is, and what a field of choices may be set to. Pure, so the editor is tested without
// a browser and the form is changed in the config rather than in a component.
//
// A project's form is the form of its own hub: oculus's `manifest_schema` with the hub's
// `manifest_fields` laid into it (data/shapes/vocab-keys.ts, `withManifestFields`),
// each added field after oculus's fields of its section, and a `vocab.<key>` list is the hub's own.
//
// The `foreign_key` of a field names where its choices come from: a collection by its key in the
// `collections:` list of the record's own hub, the projects themselves, or `vocab.<key>` for a list
// of config/catalogs/vocab.yml. A choice stores the primary key of the entry it names and shows the
// entry's display, the first filled field of the target's schema by `display:` rank; a collection
// that carries a registry offers the entries of that registry's collection of every hub. That is
// the only place a widget learns what to offer, so adding a venue to the registry adds it to the
// form with no code change.
//
// The current values come from the snapshot's Project, which carries what the model declares and no
// more. Five of the schema's fields are not in the model (NOT_IN_MODEL below), so the form opens
// them empty; the write itself handles them like any other, since it reads the manifest from disk.
// The follow-up notes and the subtasks are lists the card writes line by line; the form shows them
// read-only, each as one text. A `rows` field of the schema (`code_availability.anonymize`) is a
// `records` field of the form, its rows drawn as the record cards the entry forms draw, each card
// the text fields its `fields:` names, and its value is edited, compared and posted as the entry
// forms do it (record-values.ts).

import { z } from 'zod';
import {
    optionKey,
    optionLabel,
    primaryKeyOf,
    type Collection,
    type Id,
    type Project,
    type RegistryWord,
    type Resource,
    type SchemaOption,
    type Snapshot
} from '../../data/model/index.ts';
import type { DraftTarget } from './form-draft.ts';
import { byKey } from '../../data/helpers/guards.ts';
import { asList, asText, fieldDiffers, payloadOf, toEdit } from './record-values.ts';
import {
    PROJECTS_TARGET,
    VOCAB_PREFIX,
    bareId,
    hubId,
    keyOf,
    registryCollections,
    rootOf
} from '../../data/helpers/hub-names.ts';
import {
    MANIFEST_FIELDS_KEY,
    vocabKeys,
    vocabSource,
    withManifestFields
} from '../../data/shapes/vocab-keys.ts';
import { t } from '../shared/words/text.ts';
import {
    filledTextShape,
    mapShape,
    readAs,
    rowsShape,
    stringItemsShape
} from '../../data/shapes/shapes.ts';

/** One field of the form, in the order config/schemas/manifest-schema.yml lists it. */
export type FormField = {
    field: string;
    label: string;
    help?: string;
    /** The widget: readonly, select, text, tags, chips, textarea, lines, date, checkbox, keymap. */
    type: string;
    /** One of the sections of `manifest_schema.sections`. */
    section: string;
    /**
     * Where the choices come from, when they are data: one `foreign_key:` target or several
     * offered together.
     */
    foreign_key?: string | string[];
    /** The choices, when they are a literal list in the schema: words or `{ key, label }` rows. */
    options?: SchemaOption[];
    /** On a `records` field: the fields of each record, in the schema's order. */
    fields?: FormField[];
    /** On a `records` field: the record takes keys no field of it names. */
    open?: boolean;
    /** On a `records` field: the value is a map from a name to one record. */
    map?: boolean;
    /** Whether the field must be present, as its schema says; a conditional rule is not drawn. */
    required?: boolean;
    /** On the project form: the field is a project's id, which no write sets. */
    primary_key?: true;
    /** On the project form: the field's rank among those a reference to a project shows. */
    display?: number;
};

/**
 * One choice of a select or a multi-select: the value written, the words shown, the name of the
 * glyph drawn before them when the choice has a kind that says one, and for a record of a hub other
 * than the record's own the name of that hub, which the control draws as its hub chip.
 */
export type Choice = { id: Id; label: string; glyph?: string; hub?: string };

/**
 * The schema fields the snapshot's Project does not carry, so the form cannot show their current
 * value. They are editable and they write like any other field; what they are missing is the value
 * on the left of the edit. Model and schema are two vocabularies, and this is where they differ.
 */
export const NOT_IN_MODEL = [
    'code_availability.description',
    'code_availability.homepage',
    'code_availability.topics',
    'code_availability.visibility',
    'paths'
];

/**
 * Whether the form may write a field of a project: every field but the manifest schema's primary
 * key, the project's id, which `fields` (the form's fields) give by the rule every file of entries
 * is keyed by (`primaryKeyOf`). A form whose schema has no primary key writes every field.
 */
export function writableField(field: string, fields: readonly FormField[]): boolean {
    return field !== primaryKeyOf(fields);
}

/** The word a value holds, and undefined for an empty text and for anything that is no text. */
function filled(value: unknown): string | undefined {
    return filledTextShape.safeParse(value).data;
}

/**
 * The two maps of the `manifest_schema` of the merged config: the sections, and the fields keyed by
 * their name. A part that is no map reads as absent.
 */
const manifestSchemaShape = z.object({
    sections: mapShape.optional().catch(undefined),
    fields: mapShape.optional().catch(undefined)
});

/**
 * The `manifest_schema` of the merged config as its two maps, either absent, with the
 * `manifest_fields` of `words`, the words of the project's hub, laid into it.
 */
function schemaOf(
    config: Record<string, unknown>,
    words: Record<string, unknown> = config
): z.infer<typeof manifestSchemaShape> {
    const form = withManifestFields(config.manifest_schema, words[MANIFEST_FIELDS_KEY]);
    return readAs(manifestSchemaShape, form) ?? {};
}

/** The section names, in the order the schema lists them, under whatever they are displayed as. */
export function formSections(config: Record<string, unknown>): string[] {
    const sections = schemaOf(config).sections;
    return sections === undefined ? [] : (readAs(stringItemsShape, Object.values(sections)) ?? []);
}

/** One row of the schema's `fields:` map: the words it carries, each absent unless it is text. */
const fieldRowShape = z.object({
    label: filledTextShape,
    help: filledTextShape,
    type: filledTextShape,
    section: filledTextShape,
    foreign_key: filledTextShape,
    primary_key: z.literal(true).optional().catch(undefined),
    display: z.number().int().min(1).optional().catch(undefined),
    options: rowsShape(z.string()).optional().catch(undefined),
    fields: rowsShape(z.string()).optional().catch(undefined)
});

/**
 * The schema's widget of a list of rows of text fields. The form draws it with the record cards of
 * the `records` field type, each row a card of the text fields the schema's `fields:` names.
 */
const ROWS_WIDGET = 'rows';

/** The text fields of each card of a `rows` widget, by the names its `fields:` lists. */
function rowFields(names: readonly string[]): FormField[] {
    return names.map((name) => ({ field: name, label: name, type: 'text', section: '' }));
}

/**
 * Every field of the form of a project whose hub's words are `words`, in file order, the hub's
 * added fields each after oculus's fields of its section. A field without a `type` or a `section`
 * is still returned, with the empty string for what it does not say, so a schema half edited shows
 * as itself rather than as a shorter form.
 */
export function formFields(
    config: Record<string, unknown>,
    words: Record<string, unknown> = config
): FormField[] {
    const fields = schemaOf(config, words).fields;
    if (fields === undefined) return [];
    const found: FormField[] = [];
    for (const name of Object.keys(fields)) {
        const row = readAs(fieldRowShape, fields[name]);
        if (row === null) continue;
        const rows = row.type === ROWS_WIDGET;
        found.push({
            field: name,
            label: row.label ?? name,
            help: row.help,
            type: rows ? 'records' : (row.type ?? ''),
            section: row.section ?? '',
            foreign_key: row.foreign_key,
            options: row.options,
            ...(rows ? { fields: rowFields(row.fields ?? []) } : {}),
            ...(row.primary_key === undefined ? {} : { primary_key: true }),
            ...(row.display === undefined ? {} : { display: row.display })
        });
    }
    return found;
}

/**
 * One entry of a keyed vocabulary list: a word is its own choice, and a map with a `key` is the
 * choice of that key under its `label`, or under the key when it has no label.
 */
const choiceShape = z.union([
    z.string().transform((id) => ({ id, label: id })),
    z
        .object({ key: z.string(), label: filledTextShape })
        .transform((row) => ({ id: row.key, label: row.label ?? row.key }))
]) satisfies z.ZodType<Choice>;

/** The entries of one keyed vocabulary list of config/catalogs/vocab.yml, as choices. */
const vocabChoicesShape = rowsShape(choiceShape);

/** A map row's `label`, when it holds a filled one. */
const rowLabelShape = z.object({ label: filledTextShape }).transform((row) => row.label);

/**
 * The entries of one keyed vocabulary list of config/catalogs/vocab.yml, as choices, or the keys of
 * one held as a map (`stages`, `chips`, `data_access`), read as the schema check reads them, each
 * under its row's `label` when it has one. A source that names a field
 * (`vocab.statuses.acknowledged`) offers the keys of the map whose row carries it as `true`.
 */
function vocabChoices(config: Record<string, unknown>, name: string): Choice[] {
    const { key, field } = vocabSource(name);
    const raw = byKey(config, key);
    const map = readAs(mapShape, raw);
    if (map === null) return readAs(vocabChoicesShape, raw) ?? [];
    return vocabKeys(raw, field).map((id) => ({ id, label: readAs(rowLabelShape, map[id]) ?? id }));
}

/**
 * The glyph a resource of this kind is drawn with, or undefined for a kind outside the three. The
 * names are the text catalog's, so the card's resource tag and the form's choice agree.
 */
export function resourceGlyph(kind: string): string | undefined {
    if (kind === 'cluster') return t('project.card.hpc_glyph');
    if (kind === 'machine') return t('project.card.machine_glyph');
    if (kind === 'storage') return t('project.card.storage_glyph');
    return undefined;
}

/**
 * The entities of one kind a record of the hub `root` may name, as choices, each by the key its own
 * hub's file gives it, which is what the field writes, and shown by `label` (by the key when it
 * gives nothing): the records of the hub `root` first, then the record of another hub whose key the
 * hub `root` does not hold, with that hub's name. A key the field writes resolves in the record's
 * own hub first, then in the others, so a key the hub `root` holds is offered once, as its own
 * record's, and a key two or more other hubs hold, which would resolve to none, is not offered.
 */
export function recordChoices<T extends { root?: string }>(
    entities: Record<Id, T> | undefined,
    label: (entity: T) => string | undefined,
    root: string
): Choice[] {
    if (entities === undefined) return [];
    const own: Choice[] = [];
    const others = new Map<string, Choice[]>();
    for (const id of Object.keys(entities).sort()) {
        const entity = entities[id];
        const key = keyOf(id);
        const hub = rootOf(entity);
        const words = filled(label(entity)) ?? key;
        if (hub === root) own.push({ id: key, label: words });
        else others.set(key, [...(others.get(key) ?? []), { id: key, label: words, hub }]);
    }
    const held = new Set(own.map((one) => one.id));
    const elsewhere = [...others.entries()]
        .filter(([key, holders]) => !held.has(key) && holders.length === 1)
        .map(([, holders]) => holders[0]);
    return [...own, ...elsewhere];
}

/**
 * Choices as a plain pick draws them: a choice of another hub's record under its hub's name, the
 * group a pick draws its hub chip as.
 */
export function selectChoices(
    choices: readonly Choice[]
): { id: string; label: string; group?: string }[] {
    return choices.map((one) =>
        one.hub === undefined
            ? { id: one.id, label: one.label }
            : { id: one.id, label: one.label, group: one.hub }
    );
}

/** The registry word whose entries are drawn with the glyph of their kind. */
const RESOURCES: RegistryWord = 'resources';

/**
 * The entries of `collections` as choices for a record of the hub `root` (`recordChoices`), each
 * by its primary key and shown by its display (`Entry.title`). A collection whose file has no
 * primary key offers nothing, and neither does an entry with no value of it.
 */
export function entryChoices(collections: readonly Collection[], root: string): Choice[] {
    const entries: Record<Id, { root?: string; label: string }> = {};
    for (const one of collections) {
        if (one.primary_key === undefined) continue;
        for (const entry of one.entries) {
            if (bareId(entry) !== '') entries[entry.id] = { root: entry.root, label: entry.title };
        }
    }
    return recordChoices(entries, (entry) => entry.label, root);
}

/**
 * Choices of the resources registry, each with the glyph of its resource's kind, when it has one.
 */
function withGlyphs(
    choices: Choice[],
    resources: Record<Id, Resource> | undefined,
    root: string
): Choice[] {
    return choices.map((choice) => {
        const id = hubId(choice.hub ?? root, choice.id);
        const glyph = resourceGlyph(byKey(resources ?? {}, id)?.kind ?? '');
        return glyph === undefined ? choice : { ...choice, glyph };
    });
}

/**
 * The words a project is shown by as a choice: the first filled field of the project form by
 * `display:` rank, read from the form's fields of `config`; undefined when none is filled.
 */
export function projectDisplay(
    config: Record<string, unknown>
): (project: Project) => string | undefined {
    const ranked = formFields(config)
        .filter((one) => one.display !== undefined)
        .sort((left, right) => (left.display ?? 0) - (right.display ?? 0))
        .map((one) => one.field);
    return (project) => {
        const values = fieldValues(project, () => false);
        return ranked.map((name) => filled(values[name])).find((one) => one !== undefined);
    };
}

/**
 * What a field of choices may be set to, for a record of the hub named `root`. A `foreign_key`
 * that names nothing, and a snapshot that has not arrived, both give no choices, which the widget
 * shows as a list with nothing in it rather than as an error: the page is a moment ahead of its
 * data at first load.
 */
export function choicesFor(
    field: FormField,
    snapshot: Snapshot | null,
    config: Record<string, unknown>,
    root: string
): Choice[] {
    const own = (field.options ?? []).map((one) => {
        const id = optionKey(one);
        return { id, label: optionLabel(field, id) };
    });
    if (field.foreign_key === undefined) return own;
    const targets = Array.isArray(field.foreign_key) ? field.foreign_key : [field.foreign_key];
    return [...own, ...targets.flatMap((one) => targetChoices(one, snapshot, config, root))];
}

/**
 * The collection a `foreign_key:` target names for a record of the hub `root`: the collection its
 * hub's `collections:` list keys so, or undefined when it keys none.
 */
function targetCollection(
    target: string,
    snapshot: Snapshot | null,
    root: string
): Collection | undefined {
    return byKey(snapshot?.entities.collections ?? {}, hubId(root, target));
}

/**
 * The choices a `foreign_key:` target offers: the projects, a vocab list's words by their labels,
 * or the entries of the collection the record's hub keys so, joined over every hub's collection of
 * the registry it carries; nothing for a key no collection has.
 */
function targetChoices(
    target: string,
    snapshot: Snapshot | null,
    config: Record<string, unknown>,
    root: string
): Choice[] {
    if (target === PROJECTS_TARGET) {
        return recordChoices(snapshot?.entities.projects, projectDisplay(config), root);
    }
    if (target.startsWith(VOCAB_PREFIX)) {
        return vocabChoices(config, target.slice(VOCAB_PREFIX.length));
    }
    const named = targetCollection(target, snapshot, root);
    if (snapshot === null || named === undefined) return [];
    const registry = named.registry;
    if (registry === undefined) return entryChoices([named], root);
    const joined = entryChoices(registryCollections(snapshot.entities.collections, registry), root);
    return registry === RESOURCES ? withGlyphs(joined, snapshot.entities.resources, root) : joined;
}

/**
 * The follow-up notes not done, as one text with each note's date; the box that shows it is
 * read-only, and a done note is left out as a done line of the checklist is.
 */
function followupText(project: Project): string {
    return project.followups
        .filter((note) => !note.done)
        .map((note) =>
            note.after === undefined
                ? note.do
                : t('editor.followup_note_dated', note.do, note.after)
        )
        .join('; ');
}

/** The lines of the checklist still open, as one text; the box that shows it is read-only. */
function openSubtasks(project: Project): string {
    return project.subtasks
        .filter((one) => !one.done)
        .map((one) => one.do)
        .join('; ');
}

/**
 * What the form opens with: the project's current value under each schema field name. The names are
 * the manifest's and the values are the model's, so this is the one place the two vocabularies
 * meet. A field that names records holds the keys the manifest gives them, which is what the form
 * shows and writes: the merge resolves each to a record's id, and the key is that id with the
 * record's hub taken off. A name of `waiting-on` is a key where it names a person or a project
 * (`waitedOn`, whether an id is one's), and the words the manifest holds otherwise.
 */
export function fieldValues(
    project: Project,
    waitedOn: (id: Id) => boolean
): Record<string, unknown> {
    const code = project.codeAvailability ?? {};
    const remote = project.repository;
    return {
        id: bareId(project),
        tier: project.tier,
        stage: project.stage,
        form: project.form,
        short: project.short,
        title: project.title,
        links: project.links,
        tags: project.tags,
        'status.chips': project.chips,
        'status.line': project.statusLine,
        'waiting-on': project.waitingOn.map((one) => (waitedOn(one) ? keyOf(one) : one)),
        snooze: project.snooze,
        subtasks: openSubtasks(project),
        followup: followupText(project),
        pin: project.pin === true,
        venue: project.venueId === undefined ? undefined : keyOf(project.venueId),
        year: project.year,
        eli5: project.eli5,
        next: project.next,
        latest: project.latest,
        results: project.results,
        ideas: project.ideas,
        domain: project.domainIds.map(keyOf)[0],
        pillars: project.pillarIds.map(keyOf),
        funding: project.fundingIds.map(keyOf),
        lead: project.lead.map(keyOf),
        collaborators: project.collaborators.map(keyOf),
        supervisors: project.supervisors.map(keyOf),
        related: project.relatedIds.map(keyOf),
        datasets: project.datasetIds.map(keyOf),
        deadline: project.deadline,
        'code_availability.status': code.status,
        'code_availability.date': code.date,
        'code_availability.url': code.url,
        'code_availability.doi': code.doi,
        'code_availability.repo': code.repo,
        'code_availability.anonymize': code.anonymize,
        'code_availability.review_link': code.reviewLink,
        'code_availability.zenodo_status': code.zenodoStatus,
        'code_availability.zenodo_date': code.zenodoDate,
        'repository.url': remote?.url,
        'repository.visibility': remote?.visibility,
        'repository.description': remote?.description,
        'repository.homepage': remote?.homepage,
        'repository.topics': remote?.topics,
        'repository.date': remote?.date,
        compute: project.resourceIds.map(keyOf),
        'reproduced.date': project.reproduced?.date,
        'reproduced.note': project.reproduced?.note,
        outcome: project.outcome,
        doi: project.doi
    };
}

/** The registry word of the people. */
const PEOPLE: RegistryWord = 'people';

/**
 * Whether a `foreign_key:` target names, for a record of the hub `root`, a collection that carries
 * the people registry, whatever its key.
 */
export function namesPeople(target: string, snapshot: Snapshot | null, root: string): boolean {
    return targetCollection(target, snapshot, root)?.registry === PEOPLE;
}

/**
 * Whether a field's choices are the people of the people registry and nothing else: its
 * `foreign_key` is one target that names a collection carrying the people registry (`people`
 * answers it) and it lists no options. The picker of such a field offers Add person
 * (state/forms/new-entry.ts, `personToAdd`); a field that also takes projects, such as
 * `waiting-on`, keeps its free text instead.
 */
export function picksPeople(
    field: Pick<FormField, 'foreign_key' | 'options'>,
    people: (target: string) => boolean
): boolean {
    const keys = Array.isArray(field.foreign_key) ? field.foreign_key : [field.foreign_key];
    const [target] = keys;
    return (
        keys.length === 1 &&
        target !== undefined &&
        people(target) &&
        (field.options ?? []).length === 0
    );
}

/**
 * The value of a field with the person `key` picked into it: the key itself for a pick of one, and
 * the list with the key after the others for a field of several, the key held once.
 */
export function withPicked(field: Pick<FormField, 'type'>, value: unknown, key: string): unknown {
    if (field.type === 'select') return key;
    return [...asList(value).filter((one) => one !== key), key];
}

/** The helpers of a value as the widget's own kind, which the controls read through this module. */
export { asList, asText };

/** The fields of one section of the manifest form, in file order. */
export function fieldsOfSection(fields: FormField[], section: string): FormField[] {
    return fields.filter((one) => one.section === section);
}

/**
 * What a save posts, and what the draft drops once the server took it: the fields of `dirty` the
 * form writes, the primary key of the form's fields `fields` left out. A `records` field posts the
 * rows its cards hold (record-values.ts, `payloadOf`, over the project's value `values` holds);
 * every other field posts its edit, which the server reads as the form's.
 */
export function manifestPayload(
    edits: Record<string, unknown>,
    dirty: string[],
    fields: readonly FormField[],
    values: Record<string, unknown> = {}
): { body: Record<string, unknown>; taken: Record<string, unknown> } {
    const body: Record<string, unknown> = {};
    const taken: Record<string, unknown> = {};
    for (const name of dirty.filter((one) => writableField(one, fields))) {
        const field = fields.find((one) => one.field === name);
        const records = field?.type === 'records';
        body[name] = records ? payloadOf(field, edits[name], values[name]) : edits[name];
        taken[name] = edits[name];
    }
    return { body, taken };
}

/**
 * Whether an edit says something other than what the project says. The two are compared trimmed,
 * because the write trims: an edit that differs from the file by a space at the end is an edit the
 * server would answer with nothing changed.
 */
function editDiffers(edit: unknown, value: unknown): boolean {
    return asText(edit).trim() !== asText(value).trim();
}

/**
 * What a field's control shows of a value: a `records` field the cards its value makes
 * (record-values.ts, `toEdit`), every other field the value itself.
 */
export function formValue(field: FormField, value: unknown): unknown {
    return field.type === 'records' ? toEdit(field, value) : value;
}

/**
 * Whether an edit of a field says something other than the project's value: for a `records` field
 * whether the rows it posts differ from the rows the value holds (`fieldDiffers`), for every other
 * field the trimmed comparison of `editDiffers`.
 */
export function formDiffers(field: FormField | undefined, edit: unknown, value: unknown): boolean {
    if (field?.type === 'records') return fieldDiffers(field, edit, value);
    return editDiffers(edit, value);
}

/** The key the settled writes hold a project's values under. */
export function projectKey(id: string): string {
    return `project:${id}`;
}

/**
 * What the project editor's draft is judged by: the project's values in the snapshot now, the
 * comparison of `formDiffers` by the field's type, and the fields the manifest form writes
 * (`writableField` over the form's fields of the project's hub, `fieldsOf`).
 */
export function projectDraftTarget(
    projectOf: (id: string) => Project | null,
    settled: (key: string, values: Record<string, unknown>) => Record<string, unknown>,
    waitedOn: (id: Id) => boolean,
    fieldsOf: (project: Project | null) => readonly FormField[]
): DraftTarget {
    return {
        values: (name) => {
            const project = projectOf(name);
            return project === null
                ? null
                : settled(projectKey(name), fieldValues(project, waitedOn));
        },
        differs: (name, field, edit, value) =>
            formDiffers(
                fieldsOf(projectOf(name)).find((one) => one.field === field),
                edit,
                value
            ),
        writable: (name, field) => writableField(field, fieldsOf(projectOf(name)))
    };
}
