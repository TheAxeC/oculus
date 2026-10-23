// Layer 2, client state. The manifest edit form as data: what config/schemas/manifest-schema.yml
// says a field is, and what a field of choices may be set to. Pure, so the editor is tested without
// a browser and the form is changed in the config rather than in a component.
//
// The `from` of a field names where its choices come from: one of the eight registries, the
// projects themselves, or `vocab.<key>` for a list of config/catalogs/vocab.yml. That is the only
// place a widget learns what to offer, so adding a venue to the registry adds it to the form with
// no code change.
//
// The current values come from the snapshot's Project, which carries what the model declares and no
// more. Five of the schema's fields are not in the model (NOT_IN_MODEL below), so the form opens
// them empty; the write itself handles them like any other, since it reads the manifest from disk.
// The follow-up notes and the subtasks are lists the card writes line by line; the form shows them
// read-only, each as one text.

import { z } from 'zod';
import {
    optionKey,
    optionLabel,
    type Id,
    type Project,
    type Resource,
    type SchemaOption,
    type Snapshot
} from '../../data/model/index.ts';
import type { DraftTarget } from './form-draft.ts';
import { byKey, scalar } from '../../data/helpers/guards.ts';
import { bareId, hubId, keyOf, rootOf } from '../../data/helpers/hub-names.ts';
import { vocabKeys, vocabSource } from '../../data/shapes/vocab-keys.ts';
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
    /** Where the choices come from, when they are data: one source or several offered together. */
    from?: string | string[];
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
};

/**
 * One choice of a select or a multi-select: the value written, the words shown, the name of the
 * glyph drawn before them when the choice has a kind that says one, and for a record of a hub other
 * than the record's own the name of that hub, which the control draws as its hub chip.
 */
export type Choice = { id: Id; label: string; glyph?: string; hub?: string };

/** The field a write never touches, which the form therefore shows and does not edit. */
export const NOT_WRITTEN = ['id'];

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

/** Whether the form may write a field of a project: every field but `id`. */
export function writableField(field: string): boolean {
    return !NOT_WRITTEN.includes(field);
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

/** The `manifest_schema` of the merged config as its two maps, either absent. */
function schemaOf(config: Record<string, unknown>): z.infer<typeof manifestSchemaShape> {
    return readAs(manifestSchemaShape, config.manifest_schema) ?? {};
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
    from: filledTextShape,
    options: rowsShape(z.string()).optional().catch(undefined)
});

/**
 * Every field of the form, in file order. A field without a `type` or a `section` is still
 * returned, with the empty string for what it does not say, so a schema half edited shows as itself
 * rather than as a shorter form.
 */
export function formFields(config: Record<string, unknown>): FormField[] {
    const fields = schemaOf(config).fields;
    if (fields === undefined) return [];
    const found: FormField[] = [];
    for (const name of Object.keys(fields)) {
        const row = readAs(fieldRowShape, fields[name]);
        if (row === null) continue;
        found.push({
            field: name,
            label: row.label ?? name,
            help: row.help,
            type: row.type ?? '',
            section: row.section ?? '',
            from: row.from,
            options: row.options
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

/** The prefix of a `from` that names a keyed list of config/catalogs/vocab.yml. */
const VOCAB_PREFIX = 'vocab.';

/** The entries of one keyed vocabulary list of config/catalogs/vocab.yml, as choices. */
const vocabChoicesShape = rowsShape(choiceShape);

/** A map row's `label`, when it holds a filled one. */
const rowLabelShape = z.object({ label: filledTextShape }).transform((row) => row.label);

/**
 * The entries of one keyed vocabulary list of config/catalogs/vocab.yml, as choices, or the keys of
 * one held as a map (`data_access`), read as the schema check reads them. A source that names a
 * field (`vocab.statuses.chip`) offers the keys of the map whose row carries it as `true`, each
 * under its row's `label` when it has one.
 */
function vocabChoices(config: Record<string, unknown>, name: string): Choice[] {
    const { key, field } = vocabSource(name);
    const raw = byKey(config, key);
    const map = readAs(mapShape, raw);
    if (map === null) return readAs(vocabChoicesShape, raw) ?? [];
    return vocabKeys(raw, field).map((id) => {
        const label = field === undefined ? undefined : readAs(rowLabelShape, map[id]);
        return { id, label: label ?? id };
    });
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
 * hub's file gives it, which is what the field writes: the records of the hub `root` first, then
 * the record of another hub whose key the hub `root` does not hold, with that hub's name. A key the
 * field writes resolves in the record's own hub first, then in the others, so a key the hub `root`
 * holds is offered once, as its own record's, and a key two or more other hubs hold, which would
 * resolve to none, is not offered.
 */
export function recordChoices(
    entities: Record<Id, Record<string, unknown> & { root?: string }> | undefined,
    keys: string[],
    root: string
): Choice[] {
    if (entities === undefined) return [];
    const own: Choice[] = [];
    const others = new Map<string, Choice[]>();
    for (const id of Object.keys(entities).sort()) {
        const entity = entities[id];
        const key = keyOf(id);
        const label = keys.map((name) => filled(entity[name])).find((one) => one !== undefined);
        const hub = rootOf(entity);
        if (hub === root) own.push({ id: key, label: label ?? key });
        else others.set(key, [...(others.get(key) ?? []), { id: key, label: label ?? key, hub }]);
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

/** The resources as choices, each with the glyph of its kind when the kind says one. */
function resourceChoices(resources: Record<Id, Resource> | undefined, root: string): Choice[] {
    return recordChoices(resources, ['name'], root).map((choice) => {
        const id = hubId(choice.hub ?? root, choice.id);
        const glyph = resourceGlyph(byKey(resources ?? {}, id)?.kind ?? '');
        return glyph === undefined ? choice : { ...choice, glyph };
    });
}

/**
 * What a field of choices may be set to, for a record of the hub named `root`. A `from` that names
 * nothing, and a snapshot that has not arrived, both give no choices, which the widget shows as a
 * list with nothing in it rather than as an error: the page is a moment ahead of its data at first
 * load.
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
    if (field.from === undefined) return own;
    const sources = Array.isArray(field.from) ? field.from : [field.from];
    return [...own, ...sources.flatMap((from) => sourceChoices(from, snapshot, config, root))];
}

/** The choices a `from:` source offers: a registry's entities, the projects or a vocab list. */
function sourceChoices(
    from: string,
    snapshot: Snapshot | null,
    config: Record<string, unknown>,
    root: string
): Choice[] {
    const entities = snapshot?.entities;
    if (from === 'venues') return recordChoices(entities?.venues, ['short', 'name'], root);
    if (from === 'datasets') return recordChoices(entities?.datasets, ['name'], root);
    if (from === 'pillars') return recordChoices(entities?.pillars, ['title'], root);
    if (from === 'domains') return recordChoices(entities?.domains, ['title'], root);
    if (from === 'funding') return recordChoices(entities?.funding, ['title'], root);
    if (from === 'projects') return recordChoices(entities?.projects, ['short', 'title'], root);
    if (from === 'people') return recordChoices(entities?.people, ['name'], root);
    if (from === 'organisations') return recordChoices(entities?.organisations, ['name'], root);
    if (from === 'resources') return resourceChoices(entities?.resources, root);
    return from.startsWith(VOCAB_PREFIX)
        ? vocabChoices(config, from.slice(VOCAB_PREFIX.length))
        : [];
}

/** The follow-up notes, as one text with each note's date; the box that shows it is read-only. */
function followupText(project: Project): string {
    return project.followups
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
        type: project.type,
        short: project.short,
        title: project.title,
        links: project.links,
        tags: project.tags,
        lead: project.lead,
        authors: project.authors,
        'status.chips': project.chips,
        'status.line': project.statusLine,
        focus: project.focus,
        priority: project.priority,
        'waiting-on': project.waitingOn.map((one) => (waitedOn(one) ? keyOf(one) : one)),
        snooze: project.snooze,
        subtasks: openSubtasks(project),
        followup: followupText(project),
        pin: project.pin === true,
        venue_id: project.venueId === undefined ? undefined : keyOf(project.venueId),
        year: project.year,
        eli5: project.eli5,
        next: project.next,
        latest: project.latest,
        results: project.results,
        ideas: project.ideas,
        domain: project.domainIds.map(keyOf)[0],
        pillar: project.pillarIds.map(keyOf),
        funding: project.fundingIds.map(keyOf),
        collaborators: project.collaborators.map(keyOf),
        related: project.relatedIds.map(keyOf),
        datasets: project.datasetIds.map(keyOf),
        deadline: project.deadline,
        'code_availability.status': code.status,
        'code_availability.date': code.date,
        'code_availability.url': code.url,
        'code_availability.doi': code.doi,
        'code_availability.repo': code.repo,
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

/** A list for a list widget: the words of a list, or a word that is not empty as a list of one. */
const listShape = z.union([
    rowsShape(z.string()),
    z
        .string()
        .min(1)
        .transform((one) => [one])
]);

/** One value as the widget's own kind: a list for a list widget, text for the rest. */
export function asList(value: unknown): string[] {
    return readAs(listShape, value) ?? [];
}

/** A list as one item per line, which `lines` writes back. */
const linesShape = z
    .array(z.unknown())
    .transform((items) => items.map((one) => scalar(one)).join('\n'));

/**
 * One value as the text a control shows. A list is one item per line, which `lines` writes back.
 */
export function asText(value: unknown): string {
    return readAs(linesShape, value) ?? scalar(value);
}

/** The fields of one section of the manifest form, in file order. */
export function fieldsOfSection(fields: FormField[], section: string): FormField[] {
    return fields.filter((one) => one.section === section);
}

/**
 * What a save posts, and what the draft drops once the server took it: the fields of `dirty` the
 * form writes, `id` left out.
 */
export function manifestPayload(
    edits: Record<string, unknown>,
    dirty: string[]
): { body: Record<string, unknown>; taken: Record<string, unknown> } {
    const body: Record<string, unknown> = {};
    for (const field of dirty.filter(writableField)) body[field] = edits[field];
    return { body, taken: { ...body } };
}

/**
 * Whether an edit says something other than what the project says. The two are compared trimmed,
 * because the write trims: an edit that differs from the file by a space at the end is an edit the
 * server would answer with nothing changed.
 */
export function editDiffers(edit: unknown, value: unknown): boolean {
    return asText(edit).trim() !== asText(value).trim();
}

/** The key the settled writes hold a project's values under. */
export function projectKey(id: string): string {
    return `project:${id}`;
}

/**
 * What the project editor's draft is judged by: the project's values in the snapshot now, the
 * trimmed comparison above, and the fields the manifest form writes (`writableField`).
 */
export function projectDraftTarget(
    projectOf: (id: string) => Project | null,
    settled: (key: string, values: Record<string, unknown>) => Record<string, unknown>,
    waitedOn: (id: Id) => boolean
): DraftTarget {
    return {
        values: (name) => {
            const project = projectOf(name);
            return project === null
                ? null
                : settled(projectKey(name), fieldValues(project, waitedOn));
        },
        differs: (_name, _field, edit, value) => editDiffers(edit, value),
        writable: (_name, field) => writableField(field)
    };
}
