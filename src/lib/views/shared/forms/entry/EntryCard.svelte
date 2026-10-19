<script lang="ts">
    // Layer 3, shared view partial. One entry of one collection file as a card: the grip it is
    // dragged by, the pin mark, the title, the status chip, the controls, the fields the file's own
    // schema names, the projects that name the entry, its links, and its subtasks. The collection
    // view draws one per entry, and the entry's page draws one open, with no grip, so the card
    // lives here and not under either view.
    //
    // Nothing here knows what a scheme or an event is. Which fields are drawn and in what order is
    // drawnFields() over the file's `schema:`, which projects cross-link is crossLinks() over the
    // collection key, and every control is one call of the write path, except the `extra` ones the
    // collection passes in (Start Agent on a task's card). A field the schema draws its choices
    // from the people registry for is the one exception in kind rather than in name: it holds a
    // person's key, so the card draws the control that opens that person by their name. A
    // Literature entry's `venue` that names a venue record is the other: it opens that venue.
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
    // A link is one of three things: a local HTML file opens in the document view, a path inside
    // the hub whose extension `open.program_ext` of config/behavior.yml names an application for (a
    // `.docx`, an `.xlsx`) is `shared/links/ProgramButton.svelte`, which hands the file to that
    // application, since a link to it would only download it, and everything else is a link. A
    // refused or failed open is said through `onsaid`, the line the collection view shows every
    // write's answer on. A web address written inside the subtitle, a meta row's value or a plain
    // field's value is a link (ui/display/text/LinkedText.svelte); a body field is inline
    // Markdown, which links its addresses itself.
    //
    // The controls are views/shared/card/CardActions.svelte, shown under the pointer and kept on
    // one line, and a hub path the entry's `link`, `url` or `folder` names is one of them: a path
    // that is a file is selected in the Files view of this page, and a path that is a folder opens
    // a Files tab rooted at it and offers Open Workbench, the workbench of that folder. A long body
    // field is views/shared/card/Clamp.svelte, open or cut by the view instance's state, and drawn
    // whole by a card handed no `onmore`; the subtasks block is drawn only for an entry that has
    // subtasks, adding the first being one of the controls. The card may draw past its own edge, so
    // the More menu is not cut off at its foot.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import CardActions from '../../card/CardActions.svelte';
    import type { CardAction } from '../../card/card';
    import { entryActions, showActions } from './entry-actions';
    import DeleteAsk from './DeleteAsk.svelte';
    import { blockedBy, fileNameOf, openEntry } from '../entry-file';
    import Clamp from '../../card/Clamp.svelte';
    import Grip from './Grip.svelte';
    import RootChip from '../../card/RootChip.svelte';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import InPlace from '../InPlace.svelte';
    import Subtasks from '../Subtasks.svelte';
    import EntryLink from './EntryLink.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        crossLinks,
        drawnFields,
        entryStatus,
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
    import { personName } from '$lib/state/boards/person';
    import { LITERATURE, venueNamed } from '$lib/state/feeds/literature/saved';
    import { pageView } from '$lib/state/forms/page-entry';
    import { t } from '$lib/state/shared/words/text';
    import { statusTone } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        folders,
        fs: { listing, primary },
        layout: { openView, showFolderInFiles, showInFiles },
        selectors: { configMap, venues },
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

    const cardMath = createCardMath();
    const status = $derived(entryStatus(entry));
    const pinned = $derived(isPinned(entry));
    const groups = $derived(crossLinks(entry, collection, projects, configMap()));
    const lines = $derived(entrySubtasks(entry));
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
            shows,
            extra,
            onstatus: setStatus,
            onpin: pin,
            onedit: () => openEntry(client, file, entry, schema, fault, onsaid),
            ondelete: () => (deleting = true),
            onsubtask: () => {
                addingSubtask = !addingSubtask;
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

    /** The page of the venue record a Literature entry's venue names, by name ignoring case. */
    const venuePage = $derived.by(() => {
        const name = collection === LITERATURE ? entry.fields.venue : undefined;
        const one = typeof name === 'string' ? venueNamed(name, venues()) : undefined;
        return one === undefined ? undefined : pageView('venues', one.id, one.name);
    });

    /** One person as their own tab, the tab a collaborator tag on a project card opens. */
    function openPerson(key: string): void {
        openView('person', { key, label: personName(portfolio(), key) });
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

<!-- A long body field: cut to its clamp and opened by the control, or whole on a card without. -->
{#snippet text(words: string)}
    {#if onmore === undefined}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        {@html inlineMarkdown(words, cardMath(words))}
    {:else}
        <Clamp open={more} ontoggle={onmore}>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            {@html inlineMarkdown(words, cardMath(words))}
        </Clamp>
    {/if}
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
            {#each drawnFields(entry, schema) as drawn (drawn.field)}
                {#if drawn.kind === 'sub'}
                    <p class="sub"><LinkedText text={drawn.values[0]} /></p>
                {:else if drawn.kind === 'status'}
                    <!-- The status is the chip in the meta row; it is not drawn twice. -->
                {:else if drawn.kind === 'meta'}
                    <!-- A meta pair is a sentence as often as a word, so it is a wrapping line
                         rather than a chip, which would clip it at the card's edge. -->
                    <div class="metas">
                        {#each drawn.values as one, at (`${at}:${one}`)}
                            <span class="meta"><LinkedText text={one} /></span>
                        {/each}
                    </div>
                {:else if drawn.kind === 'pairs'}
                    <div class="row">
                        <span class="label">{drawn.label}</span>
                        {#each drawn.values as one, at (`${at}:${one}`)}
                            <Tag label={one} />
                        {/each}
                    </div>
                {:else if drawn.kind === 'chips'}
                    <div class="row">
                        {#each drawn.values as one, at (`${at}:${one}`)}
                            <Tag label={one} />
                        {/each}
                    </div>
                {:else if drawn.kind === 'body'}
                    {#if drawn.field === 'statement'}
                        <blockquote class="stmt" title={t('collection.fundstmt_tip')}>
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render text(drawn.values[0])}
                        </blockquote>
                    {:else}
                        <div class="body">
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render text(drawn.values[0])}
                        </div>
                    {/if}
                {:else if drawn.kind === 'person'}
                    <div class="row">
                        <span class="label">{drawn.label}</span>
                        <Chip
                            label={personName(portfolio(), drawn.values[0])}
                            glyph={t('collection.person_glyph')}
                            title={t('collection.open_person')}
                            onclick={() => openPerson(drawn.values[0])}
                        />
                    </div>
                {:else if drawn.field === 'venue' && venuePage !== undefined}
                    <div class="row">
                        <span class="label">{drawn.label}</span>
                        <Chip
                            label={drawn.values[0]}
                            glyph="goto"
                            title={t('collection.open_venue')}
                            onclick={() => openView(venuePage.view, venuePage.state)}
                        />
                    </div>
                {:else if drawn.kind === 'link'}
                    <EntryLink field={drawn.field} value={drawn.values[0]} {root} {onsaid} />
                {:else if addressable && (drawn.field === 'deadline' || drawn.field === 'date')}
                    <div class="field">
                        <span class="label">{drawn.label}</span>
                        <InPlace
                            field={drawn.field}
                            {collection}
                            {entry}
                            {schema}
                            {blocked}
                            {onsaid}
                        />
                    </div>
                {:else}
                    <div class="field">
                        <span class="label">{drawn.label}</span>
                        <span class="value"><LinkedText text={drawn.values[0]} /></span>
                    </div>
                {/if}
            {/each}

            {#if groups.length > 0}
                <div class="row">
                    <span class="label">{t('collection.related')}</span>
                    <CrossLinks {groups} />
                </div>
            {/if}

            {#if addressable}
                <Subtasks
                    target={{ id: entry.id, collection }}
                    subtasks={lines}
                    {onsaid}
                    adding={addingSubtask}
                    onadding={(next: boolean) => (addingSubtask = next)}
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

    .sub {
        margin: 0 0 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* A line of labels, tags and chips is one row of the tree's height; one that wraps grows by
       whole lines. */
    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        margin-top: 6px;
    }

    .body {
        margin: 6px 0 0;
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }

    .metas {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 6px;
    }

    .meta {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }

    .stmt {
        margin: 6px 0 0;
        padding-left: 8px;
        border-left: 2px solid var(--accent);
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }

    .field {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        margin-top: 6px;
    }

    .label {
        flex: 0 0 auto;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .value {
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }
</style>
