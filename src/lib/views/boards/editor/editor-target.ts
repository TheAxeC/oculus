// Layer 3, view helper of views/boards/editor/Editor.svelte. What the one editor differs by between
// the records it edits: which record a tab's state names (`editorRecord`), and for that record its
// draft, its fields, the value a control shows, what is writable, what a save posts and through
// which write, what the answer does to the draft and how it is worded (`editorTarget`).
// Editor.svelte draws every kind from an `EditorTarget`, so it names no kind's rule.
//
// A project is the manifest: its fields are the form of config/schemas/manifest-schema.yml, its
// save a `manifest` write whose taken values this file holds over the project's own
// (state/forms/settled.svelte.ts), a refused field is a line under the form, and it has no required
// reminder and no block on Save. Every other record is a page entry (state/forms/page-entry.ts): an
// entry of a collection, a person, a lead or a Lit Watch paper, or the career file. Its fields are
// its file's own `schema:`, its save is `savePage`, Save is off while a source tab holds unsaved
// text of its file or a write cannot address it, a refused field keeps its edit and shows the
// reason under it, and a feed entry's save refused as a whole after some fields were written drops
// those fields from the draft and says both.

import type { ClientState } from '$lib/state/client/context';
import type { WriteAnswer } from '$lib/state/client/writes.svelte';
import { pagePayload, savePage, type Payload } from '$lib/state/forms/entry-save';
import {
    CAREER,
    entryPageState,
    pageFields,
    sampleOf,
    type PageEntry
} from '$lib/state/forms/page-entry';
import { fieldDiffers, payloadOf, toEdit } from '$lib/state/forms/record-values';
import {
    fieldValues,
    formDiffers,
    formValue,
    manifestPayload,
    NOT_IN_MODEL,
    projectKey,
    writableField,
    type Choice,
    type FormField
} from '$lib/state/forms/schema';
import { keyOf, rootOf } from '$lib/state/shared/page/hubs';
import { stateRecord } from '$lib/state/shared/page/records';
import { t } from '$lib/state/shared/words/text';
import { instanceText } from '$lib/state/workbench/layout/instance';
import { blockedBy } from '../../shared/forms/entry-file';
import { pageFault, pageFile } from '../../shared/forms/entry/edit/page-file';

/** The record a tab of the editor is open on, from the tab's state. */
export type EditorRecord =
    | { kind: 'none' }
    | { kind: 'project'; id: string }
    | { kind: 'entry'; collection: string; key: string }
    | { kind: 'career' };

/** What the editor needs of one record. */
export type EditorTarget = {
    /** The kind of draft (state/client/context.ts names its target) and the name it is held by. */
    draftKind: 'project' | 'page';
    name: string;
    title: string;
    /** The hub a new person of a person field is written to, the empty text for the primary. */
    root: string;
    /** The words saying why Save is off, '' while it is on. */
    blocked: string;
    fields: FormField[];
    writable: (field: string) => boolean;
    /** The value a control shows while the field holds no edit. */
    shown: (field: FormField) => unknown;
    differs: (field: FormField, edit: unknown) => boolean;
    /** What a save posts of the edits, `dirty` naming the fields that changed. */
    payload: (edits: Record<string, unknown>, dirty: string[]) => Payload;
    send: (body: Record<string, unknown>) => Promise<WriteAnswer>;
    /** The edits an answer took, which the draft drops; null when it drops none. */
    took: (answer: WriteAnswer, taken: Record<string, unknown>) => Record<string, unknown> | null;
    /** The lines an answer is said by under the form. */
    said: (answer: WriteAnswer) => string[];
    /** The reason under each refused field, by field name. */
    refusals: (answer: WriteAnswer) => Record<string, string>;
    /** Whether a field holds nothing as it is now, which a required field is reminded of. */
    isEmpty: (field: FormField, value: unknown) => boolean;
    note: (field: FormField) => string | undefined;
    choices: (field: FormField) => Choice[];
    people: (target: string) => boolean;
    /** The state the tab should hold, which a save that gave a new title or key changes. */
    tab: Record<string, unknown> | null;
};

/** The record the state of an editor tab names. */
export function editorRecord(state: unknown): EditorRecord {
    if (instanceText(state, 'id') === CAREER) return { kind: 'career' };
    const key = stateRecord(state);
    if (key === '') return { kind: 'none' };
    const collection = instanceText(state, 'collection');
    return collection === '' ? { kind: 'project', id: key } : { kind: 'entry', collection, key };
}

/** The name the line saying a record is gone names it by. */
export function recordWords(record: EditorRecord): string {
    if (record.kind === 'project') return record.id;
    return record.kind === 'entry' ? keyOf(record.key) : CAREER;
}

/** The target of the project `id`, null while the snapshot holds no such project. */
function projectTarget(client: ClientState, id: string): EditorTarget | null {
    const {
        selectors: { fieldChoices, manifestFields, namesPeople, projectOf, waitedOn },
        settled,
        writes: { writeManifest }
    } = client;
    const project = projectOf(id);
    if (project === null) return null;
    /** The project's values as the snapshot holds them now. */
    const stored = (): Record<string, unknown> => {
        const held = projectOf(id);
        return held === null ? {} : fieldValues(held, waitedOn);
    };
    const values = settled.overlay(projectKey(id), stored());
    const root = rootOf(project);
    const fields = manifestFields(root);
    return {
        draftKind: 'project',
        name: id,
        title: typeof values.title === 'string' ? values.title : project.title,
        root,
        blocked: '',
        fields,
        writable: (field) => writableField(field, fields),
        shown: (field) => formValue(field, values[field.field]),
        differs: (field, edit) => formDiffers(field, edit, values[field.field]),
        payload: (edits, dirty) => manifestPayload(edits, dirty, fields, values),
        send: async (body) => {
            const seq = settled.begin();
            const answer = await writeManifest(id, body);
            if (!answer.ok) return answer;
            const refused = answer.refused.map((one) => one.field);
            const saved = Object.entries(body).filter(([name]) => !refused.includes(name));
            settled.record(projectKey(id), Object.fromEntries(saved), stored(), seq);
            return answer;
        },
        took: (answer, taken) => (answer.ok ? taken : null),
        said: (answer) =>
            answer.ok
                ? [
                      t('editor.saved', answer.changed.join(', ')),
                      ...answer.refused.map((one) => t('editor.refused', one.field, one.reason))
                  ]
                : [t('editor.failed', answer.error ?? '')],
        refusals: () => ({}),
        isEmpty: () => false,
        note: (field) =>
            NOT_IN_MODEL.includes(field.field) ? t('editor.not_in_model') : undefined,
        choices: (field) => fieldChoices(field, project),
        people: (target) => namesPeople(target, root),
        tab: null
    };
}

/** The state of the tab of a page entry: its record, under the title it has now. */
function tabOf(page: PageEntry, title: string): Record<string, unknown> {
    return page.kind === 'career'
        ? { id: CAREER, label: title }
        : entryPageState(page.collection, page.key, title);
}

/** The target of a page entry. */
function pageTarget(client: ClientState, page: PageEntry): EditorTarget {
    const {
        selectors: { fieldChoices, namesPeople },
        source: { unsavedFile },
        writes
    } = client;
    const file = pageFile(client, page);
    const unsaved = file !== null && unsavedFile(file.root, file.path);
    const fields = pageFields(page);
    const hub = page.root === '' ? undefined : page.root;
    const title = page.kind === 'career' && page.title === '' ? t('career.title') : page.title;
    return {
        draftKind: 'page',
        name: page.name,
        title,
        root: page.root,
        blocked: blockedBy(file, unsaved, pageFault(client, page)),
        fields,
        writable: (field) => !page.fixed.includes(field),
        shown: (field) => toEdit(field, page.values[field.field], sampleOf(page, field.field)),
        differs: (field, edit) =>
            fieldDiffers(field, edit, page.values[field.field], sampleOf(page, field.field)),
        payload: (edits) => pagePayload(page, fields, edits),
        send: (body) => savePage(page, body, writes),
        // A save refused as a whole took the fields in `changed` and no others.
        took: (answer, taken) =>
            answer.ok
                ? taken
                : Object.fromEntries(
                      Object.entries(taken).filter(([name]) => answer.changed.includes(name))
                  ),
        said: (answer) => [
            ...(answer.ok || answer.changed.length > 0
                ? [t('editor.saved', answer.changed.join(', '))]
                : []),
            ...(answer.ok ? [] : [t('editor.failed', answer.error ?? '')])
        ],
        refusals: (answer) =>
            Object.fromEntries(answer.refused.map((one) => [one.field, one.reason])),
        isEmpty: (field, value) => payloadOf(field, value, page.values[field.field]) === null,
        note: () => undefined,
        choices: (field) => fieldChoices(field, null, hub),
        people: (target) => namesPeople(target, hub),
        tab: tabOf(page, title)
    };
}

/** The target of the record `record`, null for none and for a record no file holds now. */
export function editorTarget(client: ClientState, record: EditorRecord): EditorTarget | null {
    const { pageNamed, pageOf } = client.pages;
    if (record.kind === 'none') return null;
    if (record.kind === 'project') return projectTarget(client, record.id);
    const page =
        record.kind === 'career' ? pageNamed(CAREER) : pageOf(record.collection, record.key);
    return page === null ? null : pageTarget(client, page);
}
