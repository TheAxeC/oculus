// Layer 3, view helper of views/shared/forms/entry/card/EntryCard.svelte and of the registry cards.
// The actions one entry's record card carries (views/shared/card/record/RecordCard.svelte), from
// what the card knows: whether a write can address the entry, why the actions that write are
// disabled, and the handlers the card gives each; and what the card's Add run writes
// (`entryDated`). The cards of a registry (Venues, Data and the others) take Edit in File and
// Delete from `recordActions`, and every card of an entry takes Edit, which opens the entry's
// editor beside the page, from `editorRows`.

import {
    entryFollowups,
    entrySubtasks,
    hubPathsOf,
    listsAsFolder,
    pageFolder,
    type Entry,
    type IdentityFault,
    type SchemaField
} from '$lib/state/boards/collection';
import type { ClientState } from '$lib/state/client/context';
import type { ViewSource } from '$lib/state/sessions/view-source';
import { entryPageState } from '$lib/state/forms/page-entry';
import { keyOf } from '$lib/state/shared/page/hubs';
import { feedEntryId, feedRoot } from '$lib/state/shared/page/idents';
import { t } from '$lib/state/shared/words/text';
import { editAction, type CardAction } from '../../card/card';
import {
    editorAction,
    pageAction,
    statusAction,
    type RecordAction,
    type RecordDated
} from '../../card/record/record-menu';
import { blockedBy, fileNameOf, openEntry } from '../entry-file';

/** One status a card may write: its word and its label. */
type StatusChoice = { id: string; label: string };

/** What the card's actions are made from. */
export type EntryActionInput = {
    /** True for an entry of a file with a schema; one without carries its statuses only. */
    addressable: boolean;
    /** The words saying why the actions that write are disabled, '' when they are not. */
    blocked: string;
    /** The name of the file Edit in File opens. */
    fileName: string;
    status: string | undefined;
    /**
     * The statuses the Status submenu offers: the schema's status options of a file with a
     * schema, the lifecycle statuses of a file with none.
     */
    statuses: StatusChoice[];
    pinned: boolean;
    /** The Show in Files actions and the actions the collection adds, drawn after the rest. */
    shows: CardAction[];
    extra: CardAction[];
    /** Open the entry's page; a card handed none has no Page action. */
    onpage?: () => void;
    /** The Edit row (`editorRows`). */
    editor: RecordAction[];
    onstatus: (next: string) => void;
    onpin: () => void;
    onedit: () => void;
    ondelete: () => void;
};

/** The action that asks before an entry is deleted; disabled, with the reason, while blocked. */
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

/**
 * The Edit row of the entry `id` of `collection`, or of a feed by its kind and identity: none for a
 * record with no page, which is an entry of a file with no schema. An entry with no key has no
 * state an editor tab could name it by, so its row is disabled with the words of its `fault`, and
 * Edit in File is where the key is written.
 */
export function editorRows(
    client: ClientState,
    collection: string,
    id: string,
    label: string,
    file: ViewSource | null,
    fault: IdentityFault | undefined
): RecordAction[] {
    if (client.pages.pageOf(collection, id) === null) return [];
    const open = (): void => {
        client.layout.openBeside('editor', entryPageState(collection, id, label));
    };
    return [editorAction(open, keyOf(id) === '' ? blockedBy(file, false, fault) : '')];
}

/** What the Edit in File action of a registry card is made from. */
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
 * Edit in File and Delete, the two actions of a record whose file holds it; a line the file does
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

/** The words of an action that writes: its own, or the ones saying why it cannot. */
function titled(input: EntryActionInput, own?: string): string | undefined {
    return input.blocked === '' ? own : input.blocked;
}

/**
 * The Status row of an entry: a submenu of the statuses the card may write, the one in force
 * checked, each disabled with the blocking words while the file cannot be written. Picking the one
 * in force writes nothing.
 */
function statusRows(input: EntryActionInput): RecordAction[] {
    const items = input.statuses.map((one): CardAction => ({
        id: `status:${one.id}`,
        label: one.label,
        title: titled(input, t('project.action.set_status', one.label)),
        checked: one.id === input.status,
        disabled: input.blocked !== '',
        onclick: () => {
            if (one.id !== input.status) input.onstatus(one.id);
        }
    }));
    return statusAction(items, titled(input));
}

/**
 * The card's actions: Page, Edit, the pin, Edit in File, Delete, the Status submenu, and the Show
 * in Files actions, then the actions the collection passes in. A file with no schema has no
 * identity to write by, so its cards carry the file's lifecycle statuses and no Edit, pin, Edit in
 * File or Delete.
 */
export function entryActions(input: EntryActionInput): RecordAction[] {
    const page: RecordAction[] = input.onpage === undefined ? [] : [pageAction(input.onpage)];
    if (!input.addressable) {
        return [...page, ...statusRows(input), ...input.shows, ...input.extra];
    }
    const rows: RecordAction[] = [
        ...page,
        ...input.editor,
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
        deleteAction(input.blocked, input.ondelete),
        ...statusRows(input)
    ];
    return [...rows, ...input.shows, ...input.extra];
}

/** A field's value as the words a box holds: its text, or its number written out. */
function fieldText(value: unknown): string {
    return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

/**
 * What the Add run of an entry's card writes: its subtasks and notes, which hang under
 * `{ id, collection }`, and its deadline where the schema has a `deadline` field, in a date box
 * for a field of `type: date` and a text box for another, an emptied box clearing it. A file with
 * no schema has no identity to write by, and so no Add run. `listed` says whether the card lists
 * the entry's lines or draws only the add forms.
 */
export function entryDated(
    client: ClientState,
    collection: string,
    entry: Entry,
    schema: SchemaField[] | undefined,
    blocked: string,
    listed: boolean
): RecordDated | undefined {
    if (schema === undefined) return undefined;
    const field = schema.find((one) => one.field === 'deadline');
    return {
        target: { id: entry.id, collection },
        subtasks: listed ? entrySubtasks(entry) : undefined,
        followups: listed ? entryFollowups(entry) : undefined,
        deadline:
            field === undefined
                ? undefined
                : {
                      held: fieldText(entry.fields.deadline),
                      type: field.type === 'date' ? 'date' : 'text',
                      write: (value) =>
                          client.writes.writeEntry(collection, entry.id, { deadline: value })
                  },
        blocked
    };
}

/**
 * What the Add run of a card of a feed entry writes, a lead or a Lit Watch paper: its subtasks and
 * notes, which hang under the entry in the file its hub keys the feed's registry by, and its
 * deadline where the schema of the feed's file in the entry's hub has a `deadline` field. `listed`
 * says whether the card lists the entry's lines, as on the entry's page, or draws only the add
 * forms, as in the feed's list. A feed file with no schema, or an entry with no internal id, has
 * no Add run.
 */
export function feedDated(
    client: ClientState,
    kind: 'leads' | 'radar',
    entry: Record<string, unknown>,
    blocked: string,
    listed: boolean
): RecordDated | undefined {
    const record = feedEntryId(entry);
    const root = feedRoot(entry);
    const feed = client.feeds.feed(kind);
    const schema = feed?.hubSchemas === undefined ? feed?.schema : feed.hubSchemas[root];
    if (record === '' || schema === undefined) return undefined;
    const field = schema.find((one) => one.field === 'deadline');
    return {
        target: { id: record, collection: client.selectors.registryKey(kind, root) },
        subtasks: listed ? entrySubtasks({ fields: entry }) : undefined,
        followups: listed ? entryFollowups({ fields: entry }) : undefined,
        deadline:
            field === undefined
                ? undefined
                : {
                      held: fieldText(entry.deadline),
                      type: field.type === 'date' ? 'date' : 'text',
                      write: (value) =>
                          client.writes.writeFeedField(kind, record, 'deadline', value)
                  },
        blocked
    };
}

/** What the Show in Files actions of a card are made from. */
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
 * One Show in Files action per hub path the entry's `link`, `url` or `folder` names, each naming
 * its path: a folder opens a Files tab rooted at it and a file is selected in the page's Files tab.
 * A folder of a served hub also gets Open Workbench, with the entry's page in its documents pane
 * when the folder is the one the entry's page is for.
 */
export function showActions(input: ShowInput): RecordAction[] {
    return hubPathsOf(input.entry.fields).flatMap((path): RecordAction[] => {
        const folder = listsAsFolder(path, input.listed);
        const show: RecordAction = {
            id: `files:${path}`,
            label: t('collection.show_in_files'),
            row: t('collection.show_path_in_files', path),
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
                row: t('collection.open_path_workbench', path),
                title: t('collection.open_workbench_tip', path),
                glyph: 'app_view',
                onclick: () => input.onworkbench(path, own)
            }
        ];
    });
}

/** The id of the Open Workbench action of the folder the entry's page is for, '' for none. */
export function ownWorkbench(input: Pick<ShowInput, 'entry' | 'listed'>): string {
    const own = pageFolder(input.entry.fields, input.listed);
    return own === undefined ? '' : `workbench:${own}`;
}
