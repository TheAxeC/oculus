<script lang="ts">
    // Layer 3, shared view partial. One entry of one collection file as the record card
    // (views/shared/card/record/RecordCard.svelte): the grip it is dragged by, the Lead badge, the
    // status chip, the fields the file's own schema names, its subtasks and follow-up notes, and
    // the strip of the projects that name the entry at the foot: a scheme's, an organisation's, a
    // resource's or the entry's `related:` list's, and for a person one labelled strip per role
    // (state/boards/structure/cross-links.ts, `crossLinks` and `roleLinks`). The collection view
    // draws one per entry, and the entry's page draws one open, with no grip, so the card lives
    // here and not under either view. The fields are EntryFields.svelte, which says how each field
    // is drawn.
    //
    // Nothing here knows what a scheme or an event is. Every action is one call of the write path,
    // except the `extra` ones the collection passes in (Start Agent on a task's card).
    //
    // Every entry has a page, and the card's title and the strip's Page open it through `onpage`; a
    // card handed none draws its title as words and has no Page. The page holds the entry's editor,
    // its referrers and, where its `link` names a folder of the hub, the folder's documents, files
    // and sessions.
    //
    // The entry's fields are changed on its page, in the file, which Edit in File opens at the
    // entry, or through the card's menu (entry-actions.ts): its Status submenu lists the statuses
    // the card may write, the schema's status options of a file with a schema and the lifecycle
    // statuses of a file with none, the one in force checked; its Add run adds a follow-up or a
    // subtask and changes the deadline where the schema has a `deadline` field. A status the
    // schema's options do not hold carries the words `settings.not_in_list` beside its chip. Delete
    // asks first, naming what refers to the entry. The actions that write are disabled, the words
    // saying why as their title, while the file has unsaved text in a source tab or the entry's
    // identity cannot address a write.
    //
    // A hub path the entry's `link`, `url` or `folder` names is a row of the menu's Open run: a
    // path that is a file is selected in the Files view of this page, and a path that is a folder
    // opens a Files tab rooted at it and offers Open Workbench, the workbench of that folder. The
    // strip holds the Workbench of the folder the entry's page is for, and Page. An entry whose
    // lead is the user carries the Lead badge where the collection draws the roles (`lead`).

    import { answerWords } from '../../answer-words';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import RecordCard from '../../../card/record/RecordCard.svelte';
    import type { CardAction } from '../../../card/card';
    import { entryActions, entryDated, ownWorkbench, showActions } from '../entry-actions';
    import { blockedBy, fileNameOf, openEntry } from '../../entry-file';
    import Grip from './Grip.svelte';
    import EntryFields from './EntryFields.svelte';
    import {
        entryStatus,
        isPinned,
        identityValue,
        optionKeys,
        optionLabel,
        pageState,
        type Entry,
        type IdentityFault,
        type Project,
        type SchemaField
    } from '$lib/state/boards/collection';
    import { crossLinks, roleLinks } from '$lib/state/boards/structure/cross-links';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { statusTone, vocabOf } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        folders,
        fs: { listing },
        layout: { showFolderInFiles, showInFiles },
        selectors: { collectionsOfKey, configMap },
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
         * The lifecycle statuses of a file with no schema, which its Status submenu lists. Empty
         * for every file that has a schema.
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
        /** Actions the collection adds to the card's own, after them. */
        extra?: CardAction[];
        /** Whether the card carries the Lead badge: the entry's lead is the user. */
        lead?: boolean;
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
        extra = [],
        lead = false
    }: Props = $props();

    const status = $derived(entryStatus(entry));
    const pinned = $derived(isPinned(entry));
    const value = $derived(identityValue(entry));

    /** A card carries its writing actions only where the file has a schema to write by. */
    const addressable = $derived(schema !== undefined);

    /** Why the actions that write are disabled, '' when they are not. */
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    /** The schema's status field, whose options the Status submenu lists. */
    const declared = $derived(schema?.find((one) => one.field === 'status'));

    /**
     * The statuses the Status submenu lists: the schema's options of a file with a schema, the
     * lifecycle statuses of a file with none.
     */
    const choices = $derived(
        schema === undefined
            ? statuses.map((id) => ({ id, label: id }))
            : optionKeys(declared).map((id) => ({ id, label: optionLabel(declared, id) }))
    );

    /** Whether the status is one the schema's options do not hold. */
    const stray = $derived(
        status !== undefined &&
            schema !== undefined &&
            choices.length > 0 &&
            !choices.some((one) => one.id === status)
    );

    /** True once the grip is held down, which is what makes the card draggable and nothing else. */
    let armed = $state(false);

    /** True while the question before a delete is open. */
    let deleting = $state(false);

    /** The root of the hub the entry is of, which every path of its fields is under. */
    const root = $derived(rootOf(entry));

    /** The entries of one folder of the hub, from the file store's listing of it. */
    const listed = (folder: string): ReturnType<typeof listing>['entries'] =>
        listing(root, folder).entries;

    /** The collection of the entry's own hub holding it, whose entry says its cross-link rule. */
    const held = $derived(
        collectionsOfKey(collection).find((one) => rootOf(one) === rootOf(entry))
    );
    const people = $derived(Object.values(portfolio()?.entities.people ?? {}));
    /** A person's strips at the card's foot, one per role; null for an entry of any other kind. */
    const rows = $derived(roleLinks(entry, held, projects, configMap(), vocabOf));
    /** The projects that name any other entry, the one strip at the card's foot. */
    const groups = $derived(
        rows === null ? crossLinks(entry, held, projects, people, configMap(), vocabOf) : []
    );

    /**
     * One Show in Files action per hub path the entry's `link`, `url` or `folder` names, and Open
     * Workbench for a folder (entry-actions.ts). They need no identity to write by, so a card of a
     * file with no schema carries them too.
     */
    const shows = $derived(
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

    /** The card's actions, from what the card knows (entry-actions.ts). */
    const actions = $derived(
        entryActions({
            addressable,
            blocked,
            fileName: fileNameOf(file),
            status,
            statuses: choices,
            pinned,
            shows,
            extra,
            onpage,
            onstatus: setStatus,
            onpin: pin,
            onedit: () => openEntry(client, file, entry, schema, fault, onsaid),
            ondelete: () => (deleting = true)
        })
    );

    /** The strip: the Workbench of the folder the entry's page is for, then Page. */
    const strip = $derived([ownWorkbench({ entry, listed }), 'page']);

    /** The entry's subtasks, notes and deadline, which the card lists and its Add run writes. */
    const dated = $derived(entryDated(client, collection, entry, schema, blocked, true));

    function said(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    /** Float the card to the top of its list, or let it fall back into file order. */
    async function pin(): Promise<void> {
        said(await writeEntry(collection, entry.id, { pin: pinned ? null : true }));
    }

    /** One of the statuses the Status submenu lists. */
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

{#snippet meta()}
    {#if addressable && ondragfrom !== undefined}
        <Grip {blocked} onpress={() => (armed = true)} />
    {/if}
    {#if lead}
        <Tag label={t('roles.lead')} glyph={t('roles.lead_glyph')} />
    {/if}
    {#if status !== undefined}
        <Chip label={status} tone={statusTone(status, root)} filled />
    {/if}
    {#if stray}
        <Tag label={t('settings.not_in_list')} tone="amber" />
    {/if}
{/snippet}

{#snippet lines()}
    <EntryFields {entry} {collection} {schema} {root} {onsaid} {more} {onmore} />
{/snippet}

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
    <RecordCard
        id={value}
        {cursor}
        title={entry.title === '' ? entry.id : entry.title}
        ontitle={onpage}
        tone={status === undefined ? undefined : statusTone(status, root)}
        {pinned}
        record={entry}
        {actions}
        {strip}
        {dated}
        {onsaid}
        {meta}
        {lines}
        {groups}
        rows={rows ?? undefined}
        deleting={deleting
            ? { collection, id: entry.id, onclose: () => (deleting = false) }
            : undefined}
    />
</div>

<style>
    /* The slot fills its grid cell and the record card fills the slot, so the cards of one row are
       one height and no empty cell is left under a short one. */
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
</style>
