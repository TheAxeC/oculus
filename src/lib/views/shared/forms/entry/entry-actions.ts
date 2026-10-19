// Layer 3, view helper of views/shared/forms/entry/EntryCard.svelte and of the registry cards. The
// controls one entry's card carries in its meta row, from what the card knows: whether a write can
// address the entry, why the controls that write are disabled, and the handlers the card gives
// each. The cards of a registry (Venues, Data and the others) take Edit in File and Delete from
// `recordActions`.

import {
    hubPathsOf,
    listsAsFolder,
    pageFolder,
    type Entry,
    type IdentityFault,
    type SchemaField
} from '$lib/state/boards/collection';
import type { ClientState } from '$lib/state/client/context';
import type { ViewSource } from '$lib/state/sessions/view-source';
import { t } from '$lib/state/shared/words/text';
import { editAction, type CardAction } from '../../card/card';
import { fileNameOf, openEntry } from '../entry-file';

/** What the card's controls are made from. */
export type EntryActionInput = {
    /** True for an entry of a file with a schema; one without carries status buttons only. */
    addressable: boolean;
    /** The words saying why the controls that write are disabled, '' when they are not. */
    blocked: string;
    /** The name of the file Edit in File opens. */
    fileName: string;
    status: string | undefined;
    /** The lifecycle statuses of a file with no schema, offered as buttons. */
    statuses: string[];
    pinned: boolean;
    /** Whether the entry has no subtask, so adding the first is a control of the card. */
    firstSubtask: boolean;
    addingSubtask: boolean;
    /** The Show in Files controls and the controls the collection adds, drawn after the rest. */
    shows: CardAction[];
    extra: CardAction[];
    onstatus: (next: string) => void;
    onpin: () => void;
    onedit: () => void;
    ondelete: () => void;
    onsubtask: () => void;
};

/** The control that asks before an entry is deleted; disabled, with the reason, while blocked. */
function deleteAction(blocked: string, ondelete: () => void): CardAction {
    return {
        id: 'delete',
        label: t('entry_form.delete'),
        title: blocked === '' ? undefined : blocked,
        glyph: t('entry_form.delete_glyph'),
        disabled: blocked !== '',
        onclick: ondelete
    };
}

/** What the Edit in File control of a record card is made from. */
export type RecordTarget = {
    client: ClientState;
    file: ViewSource | null;
    entry: Entry | null;
    schema: SchemaField[] | undefined;
    fault: IdentityFault | undefined;
    /** Says the sentence of a refusal to open the file. */
    onsaid: (said: string) => void;
};

/**
 * Edit in File and Delete, the two controls of a record whose file holds it; a line the file does
 * not hold, or a file with no schema, has neither.
 */
export function recordActions(
    target: RecordTarget,
    blocked: string,
    ondelete: () => void
): CardAction[] {
    const { client, file, entry, schema, fault, onsaid } = target;
    if (entry === null || schema === undefined) return [];
    const rows: CardAction[] = [
        editAction(fileNameOf(file), () => openEntry(client, file, entry, schema, fault, onsaid)),
        deleteAction(blocked, ondelete)
    ];
    return rows;
}

/** The words of a control that writes: its own, or the ones saying why it cannot. */
function titled(input: EntryActionInput, own?: string): string | undefined {
    return input.blocked === '' ? own : input.blocked;
}

/**
 * The card's controls: the pin, Edit in File, Delete, while the entry has no subtask adding its
 * first, and the Show in Files controls, then the controls the collection passes in. A file with no
 * schema has no identity to write by, so its cards carry the file's other lifecycle statuses
 * instead of the first three.
 */
export function entryActions(input: EntryActionInput): CardAction[] {
    if (!input.addressable) {
        const buttons = input.statuses
            .filter((one) => one !== input.status)
            .map((one): CardAction => ({
                id: `status:${one}`,
                label: one,
                title: titled(input),
                disabled: input.blocked !== '',
                onclick: () => input.onstatus(one)
            }));
        return buttons.concat(input.shows, input.extra);
    }
    const rows: CardAction[] = [
        {
            id: 'pin',
            label: input.pinned ? t('collection.unpin') : t('collection.pin_to_top'),
            title: titled(input),
            glyph: t('collection.pin_glyph'),
            active: input.pinned,
            disabled: input.blocked !== '',
            onclick: input.onpin
        },
        {
            id: 'edit',
            label: t('collection.edit_in_file'),
            title: t('collection.edit_in_file_title', input.fileName),
            glyph: t('collection.edit_glyph'),
            onclick: input.onedit
        },
        deleteAction(input.blocked, input.ondelete)
    ];
    if (input.firstSubtask) {
        rows.push({
            id: 'subtask',
            label: t('project.action.add_subtask'),
            title: titled(input, t('project.action.add_subtask_tip')),
            glyph: t('project.action.add_subtask_glyph'),
            active: input.addingSubtask,
            disabled: input.blocked !== '',
            onclick: input.onsubtask
        });
    }
    return rows.concat(input.shows, input.extra);
}

/** What the Show in Files controls of a card are made from. */
export type ShowInput = {
    entry: Entry;
    /** The root of the hub the entry is of, which every path of its fields is under. */
    root: string;
    /** The entries of one folder of the hub, from the file store's listing of it. */
    listed: Parameters<typeof listsAsFolder>[1];
    /** Whether the hub is served, which Open Workbench needs. */
    served: boolean;
    /** Show a path in a Files tab; `folder` says whether the path is a folder. */
    onfiles: (path: string, folder: boolean) => void;
    /** Open the workbench of a folder; `own` says it is the folder the entry's page is for. */
    onworkbench: (path: string, own: boolean) => void;
};

/**
 * One Show in Files control per hub path the entry's `link`, `url` or `folder` names: a folder
 * opens a Files tab rooted at it and a file is selected in the page's Files tab. A folder of a
 * served hub also gets Open Workbench, with the entry's page in its documents pane when the folder
 * is the one the entry's page is for.
 */
export function showActions(input: ShowInput): CardAction[] {
    return hubPathsOf(input.entry.fields).flatMap((path): CardAction[] => {
        const folder = listsAsFolder(path, input.listed);
        const show: CardAction = {
            id: `files:${path}`,
            label: t('collection.show_in_files'),
            title: folder
                ? t('folder_files.show_in_files_tip', path)
                : t('collection.show_in_files_tip', path),
            glyph: 'show_in_files',
            onclick: () => input.onfiles(path, folder)
        };
        if (!folder || !input.served) return [show];
        const own = pageFolder(input.entry.fields, input.listed) === path;
        return [
            show,
            {
                id: `workbench:${path}`,
                label: t('collection.open_workbench'),
                title: t('collection.open_workbench_tip', path),
                glyph: 'app_view',
                onclick: () => input.onworkbench(path, own)
            }
        ];
    });
}
