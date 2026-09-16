// Layer 2, client state. The manifest edit form as data: what config/manifest-schema.yml says a
// field is, and what a field of choices may be set to. Pure, so the editor is tested without a
// browser and the form is changed in the config rather than in a component.
//
// The `from` of a field names where its choices come from: one of the seven registries, the projects
// themselves, or a vocabulary key of config/vocab.yml. That is the only place a widget learns what to
// offer, so adding a venue to the registry adds it to the form with no code change.
//
// The current values come from the snapshot's Project, which carries what the model declares and no
// more. Eleven of the schema's fields are not in the model (NOT_IN_MODEL below), so the form opens them
// empty; the write itself handles them like any other, since it reads the manifest from disk.

import type { Id, Project, Snapshot } from '../data/model.ts';
import { isMap, scalar } from '../data/guards.ts';

/** One field of the form, in the order config/manifest-schema.yml lists it. */
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

/** One choice of a select or a multi-select: the value written, and the words shown. */
export type Choice = { id: Id; label: string };

/** The three fields a write never touches, which the form therefore shows and does not edit. */
export const NOT_WRITTEN = ['id', 'tier', 'type'];

/**
 * The schema fields the snapshot's Project does not carry, so the form cannot show their current
 * value. They are editable and they write like any other field; what they are missing is the value
 * on the left of the edit. Model and schema are two vocabularies, and this is where they differ.
 */
export const NOT_IN_MODEL = [
    'subtasks',
    'priority',
    'waiting-on',
    'followup.do',
    'followup.after',
    'snooze',
    'code_availability.description',
    'code_availability.homepage',
    'code_availability.topics',
    'code_availability.visibility',
    'paths'
];

/** Not data/guards' `text`: an empty string is no label here, so it reads as undefined. */
function text(value: unknown): string | undefined {
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/** The `manifest_schema` map of the merged config. */
function schemaOf(config: Record<string, unknown>): Record<string, unknown> {
    const schema = config.manifest_schema;
    return isMap(schema) ? schema : {};
}

/** The section names, in the order the schema lists them, under whatever they are displayed as. */
export function formSections(config: Record<string, unknown>): string[] {
    const sections = schemaOf(config).sections;
    if (!isMap(sections)) return [];
    return Object.values(sections).filter((name): name is string => typeof name === 'string');
}

/**
 * Every field of the form, in file order. A field without a `type` or a `section` is still returned,
 * with the empty string for what it does not say, so a schema half edited shows as itself rather
 * than as a shorter form.
 */
export function formFields(config: Record<string, unknown>): FormField[] {
    const fields = schemaOf(config).fields;
    if (!isMap(fields)) return [];
    const found: FormField[] = [];
    for (const [name, raw] of Object.entries(fields)) {
        if (!isMap(raw)) continue;
        const options = Array.isArray(raw.options)
            ? raw.options.filter((one): one is string => typeof one === 'string')
            : undefined;
        found.push({
            field: name,
            label: text(raw.label) ?? name,
            help: text(raw.help),
            type: text(raw.type) ?? '',
            section: text(raw.section) ?? '',
            from: text(raw.from),
            options
        });
    }
    return found;
}

/** The entries of one keyed vocabulary list of config/vocab.yml, as choices. */
function vocabChoices(raw: unknown): Choice[] {
    if (!Array.isArray(raw)) return [];
    const found: Choice[] = [];
    for (const item of raw) {
        if (typeof item === 'string') found.push({ id: item, label: item });
        else if (isMap(item) && typeof item.key === 'string') {
            found.push({ id: item.key, label: text(item.label) ?? item.key });
        }
    }
    return found;
}

/** The entities of one kind, as choices, by id. */
function entityChoices(
    entities: Record<Id, Record<string, unknown>> | undefined,
    keys: string[]
): Choice[] {
    if (entities === undefined) return [];
    return Object.keys(entities)
        .sort()
        .map((id) => {
            const entity = entities[id];
            const label = keys.map((key) => text(entity[key])).find((one) => one !== undefined);
            return { id, label: label ?? id };
        });
}

/**
 * What a field of choices may be set to. A `from` that names nothing, and a snapshot that has not
 * arrived, both give no choices, which the widget shows as a list with nothing in it rather than as
 * an error: the page is a moment ahead of its data at first load.
 */
export function choicesFor(
    field: FormField,
    snapshot: Snapshot | null,
    config: Record<string, unknown>
): Choice[] {
    if (field.options !== undefined) return field.options.map((one) => ({ id: one, label: one }));
    const from = field.from;
    if (from === undefined) return [];
    const entities = snapshot?.entities;
    if (from === 'venues') return entityChoices(entities?.venues, ['short', 'name']);
    if (from === 'datasets') return entityChoices(entities?.datasets, ['name']);
    if (from === 'pillars') return entityChoices(entities?.pillars, ['title']);
    if (from === 'domains') return entityChoices(entities?.domains, ['title']);
    if (from === 'funding') return entityChoices(entities?.funding, ['title']);
    if (from === 'projects') return entityChoices(entities?.projects, ['short', 'title']);
    if (from === 'people') return entityChoices(entities?.people, ['name']);
    if (from === 'organisations') return entityChoices(entities?.organisations, ['name']);
    return vocabChoices(config[from]);
}

/**
 * What the form opens with: the project's current value under each schema field name. The names are
 * the manifest's and the values are the model's, so this is the one place the two vocabularies meet.
 */
export function fieldValues(project: Project): Record<string, unknown> {
    const code = project.codeAvailability ?? {};
    return {
        id: project.id,
        tier: project.tier,
        type: project.type,
        short: project.short,
        title: project.title,
        lead: project.lead,
        authors: project.authors,
        'status.chips': project.chips,
        'status.line': project.statusLine,
        focus: project.focus,
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
        compute: project.compute,
        'reproduced.date': project.reproduced?.date,
        'reproduced.note': project.reproduced?.note,
        outcome: project.outcome,
        doi: project.doi
    };
}

/** One value as the widget's own kind: a list for a list widget, text for the rest. */
export function asList(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((one): one is string => typeof one === 'string');
    if (typeof value === 'string' && value !== '') return [value];
    return [];
}

/** One value as the text a control shows. A list is one item per line, which `lines` writes back. */
export function asText(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.map((one) => scalar(one)).join('\n');
    return scalar(value);
}
