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
// The follow-up is in the model as a list of notes, and the two fields of the schema address one
// note, so a project with two or more notes shows them read-only (followupWritable below).

import { z } from 'zod';
import type { Id, Project, Resource, Snapshot } from '../../data/model/index.ts';
import { byKey, scalar } from '../../data/helpers/guards.ts';
import { rootOf } from '../../data/helpers/hub-names.ts';
import { vocabKeys } from '../../data/shapes/vocab-keys.ts';
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
    /** Where the choices come from, when they are data. */
    from?: string;
    /** The choices, when they are a literal list in the schema. */
    options?: string[];
};

/**
 * One choice of a select or a multi-select: the value written, the words shown, and the name of
 * the glyph drawn before them when the choice has a kind that says one.
 */
export type Choice = { id: Id; label: string; glyph?: string };

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

/** The two schema fields that address the one note of a manifest's `followup`. */
const FOLLOWUP_FIELDS = ['followup.do', 'followup.after'];

/**
 * Whether the two follow-up fields can write this project's notes. They address one note, so a
 * project that holds two or more shows them read-only and the notes are edited in the file.
 */
export function followupWritable(project: Project): boolean {
    return project.followups.length <= 1;
}

/**
 * Whether the date of the follow-up has no note to belong to: the project holds none and the text
 * of one is not typed in `edits`. A date alone is not a note, so the form keeps it read-only.
 */
export function dateNeedsNote(
    project: Project,
    field: string,
    edits: Record<string, unknown> = {}
): boolean {
    return (
        field === 'followup.after' &&
        project.followups.length === 0 &&
        asText(edits['followup.do']).trim() === ''
    );
}

/**
 * Whether the form may write a field of this project: not `id`, not a follow-up
 * note when the project has several, and not the date of a follow-up while no note exists to hold
 * it (`dateNeedsNote`). `edits` are the draft's, by field name.
 */
export function writableField(
    project: Project,
    field: string,
    edits: Record<string, unknown> = {}
): boolean {
    if (NOT_WRITTEN.includes(field)) return false;
    if (dateNeedsNote(project, field, edits)) return false;
    return !FOLLOWUP_FIELDS.includes(field) || followupWritable(project);
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

/**
 * The entries of one keyed vocabulary list of config/catalogs/vocab.yml, as choices, or the keys of
 * one held as a map (`data_access`), read as the schema check reads them.
 */
function vocabChoices(raw: unknown): Choice[] {
    if (readAs(mapShape, raw) !== null) return vocabKeys(raw).map((id) => ({ id, label: id }));
    return readAs(vocabChoicesShape, raw) ?? [];
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
 * The entities of one kind that the hub `root` holds, as choices, by id. A record's field names a
 * record of its own hub, so a form never offers another hub's.
 */
function entityChoices(
    entities: Record<Id, Record<string, unknown> & { root?: string }> | undefined,
    keys: string[],
    root: string,
    primary: string | null
): Choice[] {
    if (entities === undefined) return [];
    return Object.keys(entities)
        .filter((id) => rootOf(entities[id], primary) === root)
        .sort()
        .map((id) => {
            const entity = entities[id];
            const label = keys.map((key) => filled(entity[key])).find((one) => one !== undefined);
            return { id, label: label ?? id };
        });
}

/** The resources as choices, each with the glyph of its kind when the kind says one. */
function resourceChoices(
    resources: Record<Id, Resource> | undefined,
    root: string,
    primary: string | null
): Choice[] {
    return entityChoices(resources, ['name'], root, primary).map((choice) => {
        const glyph = resourceGlyph(byKey(resources ?? {}, choice.id)?.kind ?? '');
        return glyph === undefined ? choice : { ...choice, glyph };
    });
}

/**
 * What a field of choices may be set to, for a record of the hub named `root`, `primary` being the
 * name of the open workspace's primary hub. A `from` that names nothing, and a snapshot that has
 * not arrived, both give no choices, which the widget shows as a list with nothing in it rather
 * than as an error: the page is a moment ahead of its data at first load.
 */
export function choicesFor(
    field: FormField,
    snapshot: Snapshot | null,
    config: Record<string, unknown>,
    root: string,
    primary: string | null
): Choice[] {
    const own = (field.options ?? []).map((one) => ({ id: one, label: one }));
    if (field.from === undefined) return own;
    return [...own, ...sourceChoices(field.from, snapshot, config, root, primary)];
}

/** The choices a `from:` source offers: a registry's entities, the projects or a vocab list. */
function sourceChoices(
    from: string,
    snapshot: Snapshot | null,
    config: Record<string, unknown>,
    root: string,
    primary: string | null
): Choice[] {
    const entities = snapshot?.entities;
    if (from === 'venues') return entityChoices(entities?.venues, ['short', 'name'], root, primary);
    if (from === 'datasets') return entityChoices(entities?.datasets, ['name'], root, primary);
    if (from === 'pillars') return entityChoices(entities?.pillars, ['title'], root, primary);
    if (from === 'domains') return entityChoices(entities?.domains, ['title'], root, primary);
    if (from === 'funding') return entityChoices(entities?.funding, ['title'], root, primary);
    if (from === 'projects')
        return entityChoices(entities?.projects, ['short', 'title'], root, primary);
    if (from === 'people') return entityChoices(entities?.people, ['name'], root, primary);
    if (from === 'organisations')
        return entityChoices(entities?.organisations, ['name'], root, primary);
    if (from === 'resources') return resourceChoices(entities?.resources, root, primary);
    return from.startsWith(VOCAB_PREFIX)
        ? vocabChoices(byKey(config, from.slice(VOCAB_PREFIX.length)))
        : [];
}

/** The words of the notes that have some, one after another, and undefined when none has. */
function noteWords(words: (string | undefined)[]): string | undefined {
    const held = words.filter((one): one is string => one !== undefined && one !== '');
    return held.length === 0 ? undefined : held.join('; ');
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
 * meet.
 */
export function fieldValues(project: Project): Record<string, unknown> {
    const code = project.codeAvailability ?? {};
    return {
        id: project.id,
        tier: project.tier,
        type: project.type,
        short: project.short,
        title: project.title,
        links: project.links,
        lead: project.lead,
        authors: project.authors,
        'status.chips': project.chips,
        'status.line': project.statusLine,
        focus: project.focus,
        priority: project.priority,
        'waiting-on': project.waitingOn,
        snooze: project.snooze,
        subtasks: openSubtasks(project),
        'followup.do': noteWords(project.followups.map((note) => note.do)),
        'followup.after': noteWords(project.followups.map((note) => note.after)),
        pin: project.pin === true,
        venue_id: project.venueId,
        year: project.year,
        eli5: project.eli5,
        next: project.next,
        latest: project.latest,
        results: project.results,
        ideas: project.ideas,
        domain: project.domainIds[0],
        pillar: project.pillarIds,
        funding: project.fundingIds,
        collaborators: project.collaborators,
        related: project.relatedIds,
        datasets: project.datasetIds,
        deadline: project.deadline,
        'code_availability.status': code.status,
        'code_availability.date': code.date,
        'code_availability.url': code.url,
        'code_availability.doi': code.doi,
        'code_availability.repo': code.repo,
        compute: project.resourceIds,
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
 * What a save posts, and what the draft drops once the server took it. `dirty` names the fields
 * whose edit differs from the project; of those the one the write never touches and the follow-up
 * fields of a project with several notes are left out, so an edit kept from before the second note
 * was added is never sent. Emptying the text of the follow-up clears the whole follow-up, the date
 * edit with it, and a date with no note to hold it is not sent.
 */
export function manifestPayload(
    project: Project,
    edits: Record<string, unknown>,
    dirty: string[]
): { body: Record<string, unknown>; taken: Record<string, unknown> } {
    const body: Record<string, unknown> = {};
    const taken: Record<string, unknown> = {};
    const own = dirty.filter((field) => writableField(project, field, edits));
    const emptied =
        own.includes('followup.do') &&
        project.followups.length > 0 &&
        asText(edits['followup.do']).trim() === '';
    for (const field of own) {
        if (FOLLOWUP_FIELDS.includes(field) && emptied) {
            body.followup = null;
            taken.followup = null;
            for (const name of FOLLOWUP_FIELDS) if (name in edits) taken[name] = edits[name];
        } else {
            body[field] = edits[field];
            taken[field] = edits[field];
        }
    }
    return { body, taken };
}

/**
 * The fields of the draft a refusal covers: a refused `followup` is the clear of both follow-up
 * fields, so the edits it covered stay in the draft.
 */
export function refusedEdits(refused: string[]): string[] {
    return refused.flatMap((field) =>
        field === 'followup' ? [field, ...FOLLOWUP_FIELDS] : [field]
    );
}
