<script lang="ts">
    // Layer 3, shared view partial. One entry of one collection file as a card: the grip it is
    // dragged by, the pin mark, the title, the status chip, the controls, the fields the file's own
    // schema names, the projects that name the entry, its links, its subtasks and its follow-up
    // notes. The collection
    // view draws one per entry, and the entry's page draws one open, with no grip, so the card
    // lives here and not under either view. The fields and the line of the projects that name the
    // entry are EntryFields.svelte, which says how each field is drawn.
    //
    // Nothing here knows what a scheme or an event is. Every control is one call of the write path,
    // except the `extra` ones the collection passes in (Start Agent on a task's card).
    //
    // Every entry has a page, and the card's title opens it through `onpage`; a card handed none
    // draws its title as words. The page holds the entry's editor, its referrers and, where its
    // `link` names a folder of the hub, the folder's documents, files and sessions.
    //
    // The status, a deadline and a date change on the card (shared/forms/InPlace.svelte), every
    // other field on the entry's page or in the file, which Edit in File opens at the entry. Delete
    // asks first, naming what refers to the entry. The controls that write are disabled, the words
    // saying why as their title, while the file has unsaved text in a source tab or the entry's
    // identity cannot address a write.
    //
    // The controls are views/shared/card/CardActions.svelte, shown under the pointer and kept on
    // one line, and a hub path the entry's `link`, `url` or `folder` names is one of them: a path
    // that is a file is selected in the Files view of this page, and a path that is a folder opens
    // a Files tab rooted at it and offers Open Workbench, the workbench of that folder. The
    // subtasks block is drawn only for an entry that has subtasks, and the follow-up block only for
    // one that has follow-up notes, adding the first of each being one of the controls. The card
    // may draw past its own edge, so the More menu is not cut off at its foot.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import CardActions from '../../../card/CardActions.svelte';
    import type { CardAction } from '../../../card/card';
    import { entryActions, showActions } from '../entry-actions';
    import DeleteAsk from '../DeleteAsk.svelte';
    import { blockedBy, fileNameOf, openEntry } from '../../entry-file';
    import Grip from './Grip.svelte';
    import RootChip from '../../../card/RootChip.svelte';
    import InPlace from '../../InPlace.svelte';
    import Followups from '../../Followups.svelte';
    import Subtasks from '../../Subtasks.svelte';
    import EntryFields from './EntryFields.svelte';
    import {
        entryStatus,
        entryFollowups,
        entrySubtasks,
        isPinned,
        identityValue,
        pageState,
        type Entry,
        type IdentityFault,
        type Project,
        type SchemaField
    } from '$lib/state/boards/collection';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { t } from '$lib/state/shared/words/text';
    import { statusTone } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        folders,
        fs: { listing, primary },
        layout: { showFolderInFiles, showInFiles },
        source: { unsavedFile },
        writes: { writeEntry }
    } = client;

    type Props = {
        entry: Entry;
        /** Whether keyboard navigation has selected this entry. */
        cursor: boolean;
        /** The collection key: which file the entry is in, and which cross-link rule it follows. */
        collection: string;
        schema: SchemaField[] | undefined;
        /** Every project of the snapshot, for the cross-links. */
        projects: Project[];
        /**
         * The lifecycle statuses of a file with no schema, which carries status buttons instead of
         * the status pick and Edit in File. Empty for every file that has a schema.
         */
        statuses: string[];
        /**
         * The collection file, which Edit in File opens; null when the configuration names none.
         */
        file: ViewSource | null;
        /** Why a write cannot address this entry, when the file's identities say so. */
        fault: IdentityFault | undefined;
        /**
         * The reader picked this card up by its grip, or dropped one on it. A card handed neither
         * is not reordered and draws no grip.
         */
        ondragfrom?: (value: string) => void;
        ondropon?: (value: string) => void;
        onsaid: (said: string) => void;
        /** Whether the long body fields are drawn whole rather than cut to their clamp. */
        more: boolean;
        /** Open or cut the long body fields; a card handed none draws them whole. */
        onmore?: () => void;
        /** Open the entry's page; a card handed none draws its title as words. */
        onpage?: () => void;
        /** Controls the collection adds to the card's own, after them. */
        extra?: CardAction[];
    };

    let {
        entry,
        cursor,
        collection,
        schema,
        projects,
        statuses,
        file,
        fault,
        ondragfrom,
        ondropon,
        onsaid,
        more,
        onmore,
        onpage,
        extra = []
    }: Props = $props();

    const status = $derived(entryStatus(entry));
    const pinned = $derived(isPinned(entry));
    const lines = $derived(entrySubtasks(entry));
    const notes = $derived(entryFollowups(entry));
    const value = $derived(identityValue(entry, schema));

    /** A card carries its controls only where the file has a schema to write by. */
    const addressable = $derived(schema !== undefined);

    /** Why the controls that write are disabled, '' when they are not. */
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    /** Whether the schema declares a status pick, which then replaces the status chip. */
    const statusPick = $derived(
        schema?.some((one) => one.field === 'status' && (one.options ?? []).length > 0) === true
    );

    /** True once the grip is held down, which is what makes the card draggable and nothing else. */
    let armed = $state(false);

    /** True while the question before a delete is open. */
    let deleting = $state(false);

    /** True while the add-subtask form is open, from the block's own control or the card's. */
    let addingSubtask = $state(false);

    /** True while the add-follow-up form is open, from the block's own control or the card's. */
    let addingFollowup = $state(false);

    /** The root of the hub the entry is of, which every path of its fields is under. */
    const root = $derived(rootOf(entry, primary()));

    /** The entries of one folder of the hub, from the file store's listing of it. */
    const listed = (folder: string): ReturnType<typeof listing>['entries'] =>
        listing(root, folder).entries;

    /**
     * One Show in Files control per hub path the entry's `link`, `url` or `folder` names, and Open
     * Workbench for a folder (entry-actions.ts). They need no identity to write by, so a card of a
     * file with no schema carries them too.
     */
    const shows: CardAction[] = $derived(
        showActions({
            entry,
            root,
            listed,
            served: folders.served(root),
            onfiles: (path, folder) =>
                folder ? showFolderInFiles(path, root) : showInFiles(path, root),
            onworkbench: (path, own) =>
                folders.open(
                    { root, path },
                    {
                        label: entry.title === '' ? entry.id : entry.title,
                        item: own
                            ? { view: 'entry', state: pageState(collection, entry) }
                            : undefined
                    }
                )
        })
    );

    /** The card's controls, from what the card knows (entry-actions.ts). */
    const actions = $derived(
        entryActions({
            addressable,
            blocked,
            fileName: fileNameOf(file),
            status,
            statuses,
            pinned,
            firstSubtask: lines.length === 0,
            addingSubtask,
            firstFollowup: notes.length === 0,
            addingFollowup,
            shows,
            extra,
            onstatus: setStatus,
            onpin: pin,
            onedit: () => openEntry(client, file, entry, schema, fault, onsaid),
            ondelete: () => (deleting = true),
            onsubtask: () => {
                addingSubtask = !addingSubtask;
            },
            onfollowup: () => {
                addingFollowup = !addingFollowup;
            }
        })
    );

    function said(answer: { ok: boolean; changed: string[]; error?: string }): void {
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }

    /** Float the card to the top of its list, or let it fall back into file order. */
    async function pin(): Promise<void> {
        said(await writeEntry(collection, entry.id, { pin: pinned ? null : true }));
    }

    /** One of the file's other lifecycle statuses, on a file that has no schema to edit by. */
    async function setStatus(next: string): Promise<void> {
        said(await writeEntry(collection, entry.id, { status: next }));
    }

    function dragstart(): void {
        ondragfrom?.(value);
    }

    function dragover(event: DragEvent): void {
        event.preventDefault();
    }

    function drop(event: DragEvent): void {
        event.preventDefault();
        armed = false;
        ondropon?.(value);
    }
</script>

<!-- The card is dragged by its grip and by nothing else: the grip arms it on mousedown and the
     drag disarms it again, so the words on the card stay selectable. -->
<div
    class="slot"
    data-entry={entry.id}
    data-ident={value}
    draggable={armed}
    ondragstart={dragstart}
    ondragover={dragover}
    ondrop={drop}
    ondragend={() => (armed = false)}
    role="listitem"
>
    <Card
        id={value}
        {cursor}
        title={entry.title === '' ? entry.id : entry.title}
        ontitle={onpage}
        tone={status === undefined ? undefined : statusTone(status)}
        {pinned}
    >
        {#snippet meta()}
            {#if addressable && ondragfrom !== undefined}
                <Grip {blocked} onpress={() => (armed = true)} />
            {/if}
            <RootChip record={entry} />
            {#if status !== undefined && statusPick}
                <InPlace field="status" {collection} {entry} {schema} {blocked} {onsaid} />
            {:else if status !== undefined}
                <Chip label={status} tone={statusTone(status)} filled />
            {/if}
            {#if actions.length > 0}
                <CardActions {actions} />
            {/if}
        {/snippet}

        <div class="entry">
            <EntryFields
                {entry}
                {collection}
                {schema}
                {projects}
                {root}
                {addressable}
                {blocked}
                {onsaid}
                {more}
                {onmore}
            />

            {#if addressable}
                <Subtasks
                    target={{ id: entry.id, collection }}
                    subtasks={lines}
                    {onsaid}
                    adding={addingSubtask}
                    onadding={(next: boolean) => (addingSubtask = next)}
                    {blocked}
                />
                <Followups
                    target={{ id: entry.id, collection }}
                    {notes}
                    {onsaid}
                    adding={addingFollowup}
                    onadding={(next: boolean) => (addingFollowup = next)}
                    {blocked}
                />
            {/if}
        </div>
    </Card>
</div>

{#if deleting}
    <DeleteAsk {collection} id={entry.id} {onsaid} onclose={() => (deleting = false)} />
{/if}

<style>
    /* The slot fills its grid cell and the card fills the slot, so the cards of one row are one
       height and no empty cell is left under a short one. */
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .slot > :global(.card) {
        flex: 1 1 auto;
        overflow: visible;
    }

    /* The card draws past its own edge, so its colour bar carries the card's rounded corners itself
       and a long unbroken title breaks inside the card's width. */
    .slot > :global(.card > .bar) {
        border-radius: var(--input-radius) 0 0 var(--input-radius);
    }

    .slot > :global(.card .title) {
        overflow-wrap: anywhere;
    }
</style>
