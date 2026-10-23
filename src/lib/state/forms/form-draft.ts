// Layer 2, client state. The unsaved edits of a form, kept in the ui store's record of the view
// instance that draws the form, so a tab switch and a reload keep them the way the source tab keeps
// its draft. The project editor, the page of a collection entry or a feed entry, the person page
// and the Career panel are forms over a different thing each, and they share this store.
//
// The draft sits under the `draft` key of the instance's record, beside whatever else the view
// keeps there (the document an entry page shows, the folds a Focus board holds). It names the kind
// of form and the thing the edits were typed for, so a draft is never read by the form of another
// project or another entry. The record is written to the state folder's files, so the thing is
// held there as two fields, the name of its hub (`hub`) and its name inside that hub (`name`: a
// project's key, an entry page's collection and key); the form names it by the two joined, the
// internal id the portfolio gives it (`addressOfId`, `hubId`).
//
// What an edit is compared against is the thing's value in the snapshot now, through the rule of
// its kind (a `DraftTarget`), the same rule the form marks a changed field by: whether the tab
// holds unsaved work and what the form says is waiting to be saved are one answer.

import { z } from 'zod';
import { isMap } from '../../data/helpers/guards.ts';
import { addressOfId, hubId } from '../../data/helpers/hub-names.ts';
import { mapShape, readAs } from '../../data/shapes/shapes.ts';
import type { InstanceStates } from '../shared/stores/shapes.ts';

/** What one form instance keeps: the kind of form, the thing typed for, the edits by field name. */
type FormDraft = { kind: string; name: string; edits: Record<string, unknown> };

/**
 * What the draft of one kind of form is judged by. `values` are the saved values of the thing now,
 * by field name, or null when the snapshot does not hold it; `differs` says whether an edit says
 * something other than the saved value; `writable` says whether a save writes the field.
 */
export type DraftTarget = {
    values: (name: string) => Record<string, unknown> | null;
    differs: (name: string, field: string, edit: unknown, value: unknown) => boolean;
    writable: (name: string, field: string, edits: Record<string, unknown>) => boolean;
    /** The name the thing goes by now, when a save gave it another; the name itself otherwise. */
    current?: (name: string) => string;
};

/** The key of an instance's record that holds the draft. */
const DRAFT_KEY = 'draft';

/**
 * A saved draft: a kind and a name that are not empty, the hub of the thing, and the edits as a
 * map; the name it is read as is the hub and the name joined.
 */
const draftShape = z
    .object({
        kind: z.string().min(1),
        hub: z.string(),
        name: z.string().min(1),
        edits: mapShape
    })
    .transform((held) => ({
        kind: held.kind,
        name: hubId(held.hub, held.name),
        edits: { ...held.edits }
    })) satisfies z.ZodType<FormDraft>;

/** The saved draft of an instance record, or null when the record holds none that reads. */
function parseFormDraft(raw: unknown): FormDraft | null {
    return isMap(raw) ? readAs(draftShape, raw[DRAFT_KEY]) : null;
}

/** The form drafts, for one client. */
export type FormDraftStore = {
    draftEdits: (instance: string, kind: string, name: string) => Record<string, unknown>;
    editDraft: (
        instance: string,
        kind: string,
        name: string,
        field: string,
        value: unknown
    ) => void;
    revertDraft: (instance: string) => void;
    settleDraft: (instance: string, sent: Record<string, unknown>, refused: string[]) => void;
    draftDirty: (instance: string) => boolean;
};

export function createFormDraft(
    ui: InstanceStates,
    targets: Record<string, DraftTarget>
): FormDraftStore {
    function draft(instance: string): FormDraft | null {
        return parseFormDraft(ui.instanceState(instance));
    }

    /** The record of the instance without its draft. */
    function others(instance: string): Record<string, unknown> {
        const held = ui.instanceState(instance);
        if (!isMap(held)) return {};
        return Object.fromEntries(Object.entries(held).filter(([key]) => key !== DRAFT_KEY));
    }

    /** Write the edits, forgetting the draft once none is left and the record once it is empty. */
    function keep(
        instance: string,
        held: Omit<FormDraft, 'edits'>,
        edits: Record<string, unknown>
    ): void {
        const rest = others(instance);
        if (Object.keys(edits).length > 0) {
            const { hub, key } = addressOfId(held.name);
            const stored = { kind: held.kind, hub, name: key, edits };
            ui.setInstanceState(instance, { ...rest, [DRAFT_KEY]: stored });
        } else if (Object.keys(rest).length > 0) ui.setInstanceState(instance, rest);
        else ui.clearInstanceState(instance);
    }

    /** The edits the instance holds for this thing, and none when they were typed for another. */
    function draftEdits(instance: string, kind: string, name: string): Record<string, unknown> {
        const held = draft(instance);
        return held?.kind === kind && held.name === name ? held.edits : {};
    }

    /** Keep one field's edit. An edit typed for another thing than the draft's starts afresh. */
    function editDraft(
        instance: string,
        kind: string,
        name: string,
        field: string,
        value: unknown
    ): void {
        keep(instance, { kind, name }, { ...draftEdits(instance, kind, name), [field]: value });
    }

    /** Drop every edit, which is what Revert does. */
    function revertDraft(instance: string): void {
        keep(instance, { kind: '', name: '' }, {});
    }

    /**
     * Drop what a successful save took. A field the server refused keeps its edit, since the file
     * does not hold it; a field typed again while the save was on its way keeps the newer edit,
     * since that is not what was sent; and an edit that equals the saved value is dropped as well,
     * since it holds nothing a save would write. A draft the tab's close took away stays gone. A
     * save that gave the thing a new name keeps the edits left under that name, so the form that
     * follows the thing to it still finds them.
     */
    function settleDraft(instance: string, sent: Record<string, unknown>, refused: string[]): void {
        const held = draft(instance);
        if (held === null) return;
        const target = targets[held.kind] as DraftTarget | undefined;
        if (target === undefined) return;
        const values = target.values(held.name) ?? {};
        const kept: Record<string, unknown> = {};
        for (const [field, edit] of Object.entries(held.edits)) {
            const taken =
                field in sent &&
                !refused.includes(field) &&
                JSON.stringify(sent[field]) === JSON.stringify(edit);
            if (taken || !target.differs(held.name, field, edit, values[field])) continue;
            kept[field] = edit;
        }
        keep(instance, { ...held, name: target.current?.(held.name) ?? held.name }, kept);
    }

    /**
     * Whether the instance holds an edit the saved thing does not, which is what closing its tab
     * asks a confirmation about. A draft for a thing the snapshot does not hold is compared with
     * nothing, so any edit with words in it is unsaved. An edit of a field the form does not write
     * is not unsaved work, since no save posts it.
     */
    function draftDirty(instance: string): boolean {
        const held = draft(instance);
        if (held === null) return false;
        const target = targets[held.kind] as DraftTarget | undefined;
        if (target === undefined) return false;
        const values = target.values(held.name);
        return Object.entries(held.edits).some(
            ([field, edit]) =>
                (values === null || target.writable(held.name, field, held.edits)) &&
                target.differs(held.name, field, edit, values?.[field])
        );
    }

    return { draftEdits, editDraft, revertDraft, settleDraft, draftDirty };
}
