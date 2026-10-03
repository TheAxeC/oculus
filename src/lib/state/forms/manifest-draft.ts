// Layer 2, client state. The manifest editor's unsaved edits, kept in the ui store's record of the
// editor's instance so a tab switch and a reload keep them, the way the source tab keeps its draft.
//
// The record is the editor's alone: the project the tab was opened for lives in the layout's
// instance, and nothing else writes the ui record of an editor instance. The draft names the
// project it was typed for, so a draft is never read by the form of another project.
//
// What an edit is compared against is the project's value in the snapshot now, through the same
// rule the form marks a changed field by, so whether the tab holds unsaved work and what the form
// says is waiting to be saved are one answer.

import { z } from 'zod';
import type { Project } from '../../data/model/index.ts';
import { mapShape, readAs } from '../../data/shapes/shapes.ts';
import { asText, fieldValues, writableField } from './schema.ts';
import type { InstanceStates } from '../shared/stores/shapes.ts';

/** What one editor instance keeps: the project it was typed for, and the edits by field name. */
export type ManifestDraft = { project: string; edits: Record<string, unknown> };

/**
 * Whether an edit says something other than what the project says. The two are compared trimmed,
 * because the write trims: an edit that differs from the file by a space at the end is an edit the
 * server would answer with nothing changed.
 */
export function editDiffers(edit: unknown, value: unknown): boolean {
    return asText(edit).trim() !== asText(value).trim();
}

/**
 * A saved draft: a project name that is not empty, and the edits as the map the record holds. The
 * edits are copied by spread, which keeps an own `__proto__` key as a key.
 */
const manifestDraftShape = z
    .object({ project: z.string().min(1), edits: mapShape })
    .transform((held) => ({
        project: held.project,
        edits: { ...held.edits }
    })) satisfies z.ZodType<ManifestDraft>;

/** The saved draft of an instance, or null when what the record holds is not one. */
export function parseManifestDraft(raw: unknown): ManifestDraft | null {
    return readAs(manifestDraftShape, raw);
}

/** The manifest editor's drafts, for one client. */
export type ManifestDraftStore = {
    manifestEdits: (instance: string, project: string) => Record<string, unknown>;
    editManifest: (instance: string, project: string, field: string, value: unknown) => void;
    revertManifest: (instance: string) => void;
    settleManifest: (instance: string, sent: Record<string, unknown>, refused: string[]) => void;
    manifestDirty: (instance: string) => boolean;
};

export function createManifestDraft(
    ui: InstanceStates,
    projectOf: (id: string) => Project | null
): ManifestDraftStore {
    function draft(instance: string): ManifestDraft | null {
        return parseManifestDraft(ui.instanceState(instance));
    }

    /** Write the edits, forgetting the record once none is left. */
    function keep(instance: string, project: string, edits: Record<string, unknown>): void {
        if (Object.keys(edits).length === 0) ui.clearInstanceState(instance);
        else ui.setInstanceState(instance, { project, edits });
    }

    /** The edits the instance holds for this project, and none when they were typed for another. */
    function manifestEdits(instance: string, project: string): Record<string, unknown> {
        const held = draft(instance);
        return held?.project === project ? held.edits : {};
    }

    /** Keep one field's edit. An edit typed for another project than the draft's starts afresh. */
    function editManifest(instance: string, project: string, field: string, value: unknown): void {
        keep(instance, project, { ...manifestEdits(instance, project), [field]: value });
    }

    /** Drop every edit, which is what Revert does. */
    function revertManifest(instance: string): void {
        ui.clearInstanceState(instance);
    }

    /**
     * Drop what a successful save took. A field the server refused keeps its edit, since the file
     * does not hold it; a field typed again while the save was on its way keeps the newer edit,
     * since that is not what was sent; and an edit that equals the project's value is dropped as
     * well, since it holds nothing a save would write. A draft the tab's close took away stays
     * gone.
     */
    function settleManifest(
        instance: string,
        sent: Record<string, unknown>,
        refused: string[]
    ): void {
        const held = draft(instance);
        if (held === null) return;
        const project = projectOf(held.project);
        const values = project === null ? {} : fieldValues(project);
        const kept: Record<string, unknown> = {};
        for (const [field, edit] of Object.entries(held.edits)) {
            const taken =
                field in sent &&
                !refused.includes(field) &&
                JSON.stringify(sent[field]) === JSON.stringify(edit);
            if (taken || !editDiffers(edit, values[field])) continue;
            kept[field] = edit;
        }
        keep(instance, held.project, kept);
    }

    /**
     * Whether the instance holds an edit the project does not, which is what closing its tab asks a
     * confirmation about. A draft for a project the snapshot no longer holds is compared with
     * nothing, so any edit with words in it is unsaved. An edit of a field the project's form does
     * not write is not unsaved work, since no save posts it: a follow-up of a project with several
     * notes, and a date with no note to hold it.
     */
    function manifestDirty(instance: string): boolean {
        const held = draft(instance);
        if (held === null) return false;
        const project = projectOf(held.project);
        const values = project === null ? {} : fieldValues(project);
        return Object.entries(held.edits).some(
            ([field, edit]) =>
                (project === null || writableField(project, field, held.edits)) &&
                editDiffers(edit, values[field])
        );
    }

    return { manifestEdits, editManifest, revertManifest, settleManifest, manifestDirty };
}
