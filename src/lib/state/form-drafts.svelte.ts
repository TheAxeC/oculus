// Layer 2, client state. What a reader has typed into an entry form and not saved, kept per view
// instance so it survives the tab being switched away from and the page being reloaded.
//
// A pane mounts only its active tab, so a form's own component state is gone on every tab switch;
// the typed values live here instead, in the ui store's per-instance record, which is what the
// browser saves. They are not written into the host view's own record, since that record is the
// host's: most hosts write it whole from a parse that keeps only their own keys, which would drop a
// draft kept there at the next filter the reader typed. Each instance's drafts therefore sit in an
// entry of their own, under the instance id with FORMS_SUFFIX appended, which the layout's ids never
// end in (a new instance's id is a UUID).
//
// One instance may hold several forms (the add form and a card's edit form), so the drafts are keyed
// by the form as well: the collection and the entry's id, or null for the form that adds one,
// encoded as one JSON array so no collection name or entry id can make two forms share a key.
//
// Whether a typed value is unsaved work is decided against the entry as the snapshot holds it now,
// through the save's own rule (state/form-values.ts). Each typed field also carries its control's
// kind and the value its control held when it was typed: an add form has no entry and is compared
// with what its controls opened holding, and an entry the snapshot does not say anything about (a
// file outside the collections, or a page whose snapshot has not arrived) is compared with that as
// well. A draft whose entry the snapshot's collection no longer holds, deleted or renamed on disk,
// has no form left to be seen in: it is never counted, and the next write of the instance's drafts
// drops it.
//
// A form drawn outside any pane has no instance to keep its values for. It keeps them in a local
// target (localDrafts) with the same shape, and draftTarget() is the one place a form is given one or
// the other.

import type { Collection, Entry, Snapshot } from '../data/model.ts';
import { controlValue, sameSaved, type FormValue } from './form-values.ts';
import type { UiStore } from './ui.svelte.ts';

/** One typed field: what the control holds, its kind, and what the control held when it was typed. */
export type TypedField = { value: FormValue; kind: string; base: FormValue };

/** One form's typed fields, by field name. */
type FormDraft = Record<string, TypedField>;

/** The drafts one instance holds, by form key. */
type Drafts = Record<string, FormDraft>;

/** What turns an instance id into the ui store key its form drafts are kept under. */
export const FORMS_SUFFIX = '#forms';

/** The ui store key one instance's form drafts are kept under. */
export function formsKey(instance: string): string {
    return `${instance}${FORMS_SUFFIX}`;
}

/** The key of one form inside an instance: its collection, and its entry's id or null for adding. */
export function formKey(collection: string, entry: string | null): string {
    return JSON.stringify([collection, entry]);
}

/** The collection and the entry a form key names, or null for a key no form makes. */
export function parseFormKey(form: string): { collection: string; entry: string | null } | null {
    let held: unknown;
    try {
        held = JSON.parse(form);
    } catch {
        return null;
    }
    if (!Array.isArray(held) || held.length !== 2) return null;
    const [collection, entry] = held as unknown[];
    if (typeof collection !== 'string') return null;
    if (entry !== null && typeof entry !== 'string') return null;
    return { collection, entry };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One saved control value, or null when what was saved is not a shape a control holds. */
function formValue(raw: unknown): FormValue | null {
    if (typeof raw === 'string' || typeof raw === 'boolean') return raw;
    if (!Array.isArray(raw)) return null;
    const rows: { label: string; value: string }[] = [];
    for (const one of raw) {
        if (!isRecord(one) || typeof one.label !== 'string' || typeof one.value !== 'string') {
            return null;
        }
        rows.push({ label: one.label, value: one.value });
    }
    return rows;
}

/** The drafts an instance saved, with anything that is not the shape above left out. */
export function parseDrafts(raw: unknown): Drafts {
    if (!isRecord(raw)) return {};
    const drafts: Drafts = {};
    for (const [form, fields] of Object.entries(raw)) {
        if (parseFormKey(form) === null || !isRecord(fields)) continue;
        const kept: FormDraft = {};
        for (const [field, typed] of Object.entries(fields)) {
            if (!isRecord(typed) || typeof typed.kind !== 'string') continue;
            const value = formValue(typed.value);
            const base = formValue(typed.base);
            if (value !== null && base !== null) kept[field] = { value, kind: typed.kind, base };
        }
        if (Object.keys(kept).length > 0) drafts[form] = kept;
    }
    return drafts;
}

/**
 * The entry a form edits, as the snapshot holds it now: the entry, null when the snapshot's
 * collection holds no entry by that id, and undefined when the snapshot says nothing about it
 * (none has arrived, or the collection is not one of the snapshot's).
 */
export type EntryLookup = (collection: string, id: string) => Entry | null | undefined;

/** The lookup over one client's snapshot. */
export function snapshotEntries(portfolio: () => Snapshot | null): EntryLookup {
    return (collection, id) => {
        const snapshot = portfolio();
        if (snapshot === null) return undefined;
        const held = snapshot.entities.collections[collection] as Collection | undefined;
        if (held === undefined) return undefined;
        return held.entries.find((one) => one.id === id) ?? null;
    };
}

/** What a form reads and writes its typed values through, whether an instance keeps them or it does. */
export type DraftTarget = {
    edits: (form: string) => Record<string, FormValue>;
    set: (form: string, field: string, typed: TypedField) => void;
    clear: (form: string) => void;
    /** Forget what a save took; answers whether anything typed after the save went is left. */
    settle: (form: string, sent: Record<string, FormValue>) => boolean;
};

/** A form draft's typed values, by field. */
function editsOf(draft: FormDraft | undefined): Record<string, FormValue> {
    const edits: Record<string, FormValue> = {};
    for (const [field, typed] of Object.entries(draft ?? {})) edits[field] = typed.value;
    return edits;
}

/** The fields of a draft a save has not taken: the ones typed again, or first, after it went. */
function unsent(draft: FormDraft, sent: Record<string, FormValue>): FormDraft {
    const kept: FormDraft = {};
    for (const [field, typed] of Object.entries(draft)) {
        if (field in sent && JSON.stringify(sent[field]) === JSON.stringify(typed.value)) continue;
        kept[field] = typed;
    }
    return kept;
}

/** The entry forms' unsaved values, for one client. */
export type FormDraftsStore = {
    formEdits: (instance: string, form: string) => Record<string, FormValue>;
    setFormField: (instance: string, form: string, field: string, typed: TypedField) => void;
    clearFormDraft: (instance: string, form: string) => void;
    settleFormDraft: (instance: string, form: string, sent: Record<string, FormValue>) => boolean;
    formsDirty: (instance: string) => boolean;
    toggleAdd: (instance: string, collection: string, open: boolean) => boolean;
    toggleEdit: (instance: string, collection: string, open: string, id: string) => string;
};

export function createFormDrafts(ui: UiStore, entryOf: EntryLookup): FormDraftsStore {
    function drafts(instance: string): Drafts {
        return parseDrafts(ui.instanceState(formsKey(instance)));
    }

    /** Whether a form's entry is known to be gone from the collection the snapshot holds. */
    function gone(form: string): boolean {
        const key = parseFormKey(form);
        return key !== null && key.entry !== null && entryOf(key.collection, key.entry) === null;
    }

    /** Write an instance's drafts, dropping the ones whose entry is gone and the empty ones. */
    function keep(instance: string, next: Drafts): void {
        const kept: Drafts = {};
        for (const [form, draft] of Object.entries(next)) {
            if (Object.keys(draft).length > 0 && !gone(form)) kept[form] = draft;
        }
        if (Object.keys(kept).length === 0) ui.clearInstanceState(formsKey(instance));
        else ui.setInstanceState(formsKey(instance), kept);
    }

    /** What the reader typed into one form, by field. A field nobody touched is not in it. */
    function formEdits(instance: string, form: string): Record<string, FormValue> {
        return editsOf(drafts(instance)[form]);
    }

    function setFormField(instance: string, form: string, field: string, typed: TypedField): void {
        const held = drafts(instance);
        keep(instance, { ...held, [form]: { ...held[form], [field]: typed } });
    }

    /** Forget one form's draft: its save took it, the reader cancelled it, or its form closed. */
    function clearFormDraft(instance: string, form: string): void {
        const held = drafts(instance);
        if (!(form in held)) return;
        keep(instance, { ...held, [form]: {} });
    }

    /**
     * Forget what a save took. A field typed again while the save was on its way keeps the newer
     * value, since that is not what was sent. A draft the tab's close took away stays gone.
     */
    function settleFormDraft(
        instance: string,
        form: string,
        sent: Record<string, FormValue>
    ): boolean {
        const held = drafts(instance);
        const draft = held[form] as FormDraft | undefined;
        if (draft === undefined) return false;
        const left = unsent(draft, sent);
        keep(instance, { ...held, [form]: left });
        return Object.keys(left).length > 0;
    }

    /** Whether one typed field says something its entry, or its opening value, does not. */
    function differs(form: string, field: string, typed: TypedField): boolean {
        const key = parseFormKey(form);
        const id = key?.entry ?? null;
        const entry = key === null || id === null ? undefined : entryOf(key.collection, id);
        if (entry === null) return false;
        const now =
            entry === undefined ? typed.base : controlValue(entry.fields[field], typed.kind);
        return !sameSaved(typed.value, now, typed.kind);
    }

    /** Whether any form of the instance holds a typed value its entry does not. */
    function formsDirty(instance: string): boolean {
        return Object.entries(drafts(instance)).some(([form, draft]) =>
            Object.entries(draft).some(([field, typed]) => differs(form, field, typed))
        );
    }

    /** Open or close a view's add form, forgetting its draft when it closes. Answers the new state. */
    function toggleAdd(instance: string, collection: string, open: boolean): boolean {
        if (open) clearFormDraft(instance, formKey(collection, null));
        return !open;
    }

    /**
     * Open one entry's edit form, or close it when it is the one open. The form that was open
     * closes either way, and its draft is forgotten with it. Answers the entry now edited, or ''.
     */
    function toggleEdit(instance: string, collection: string, open: string, id: string): string {
        if (open !== '') clearFormDraft(instance, formKey(collection, open));
        return open === id ? '' : id;
    }

    return {
        formEdits,
        setFormField,
        clearFormDraft,
        settleFormDraft,
        formsDirty,
        toggleAdd,
        toggleEdit
    };
}

/** The drafts of an instance, as a form reads and writes them. */
function instanceDrafts(store: FormDraftsStore, instance: string): DraftTarget {
    return {
        edits: (form) => store.formEdits(instance, form),
        set: (form, field, typed) => store.setFormField(instance, form, field, typed),
        clear: (form) => store.clearFormDraft(instance, form),
        settle: (form, sent) => store.settleFormDraft(instance, form, sent)
    };
}

/** A form's own drafts, for a form drawn outside any pane: held by the form, saved nowhere. */
export function localDrafts(): DraftTarget {
    const held: { drafts: Drafts } = $state({ drafts: {} });
    return {
        edits: (form) => editsOf(held.drafts[form]),
        set: (form, field, typed) => {
            held.drafts = { ...held.drafts, [form]: { ...held.drafts[form], [field]: typed } };
        },
        clear: (form) => {
            held.drafts = { ...held.drafts, [form]: {} };
        },
        settle: (form, sent) => {
            const left = unsent(held.drafts[form] ?? {}, sent);
            held.drafts = { ...held.drafts, [form]: left };
            return Object.keys(left).length > 0;
        }
    };
}

/** What a form keeps its typed values in: its instance's drafts inside a pane, its own outside one. */
export function draftTarget(
    store: FormDraftsStore,
    instance: string | null,
    local: DraftTarget
): DraftTarget {
    return instance === null ? local : instanceDrafts(store, instance);
}
