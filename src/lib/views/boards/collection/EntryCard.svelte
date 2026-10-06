<script lang="ts">
    // Layer 3, view partial of views/boards/collection/Collection.svelte. One entry of one
    // collection file as a card: the grip it is dragged by, the pin mark, the title, the status
    // chip, the controls, the fields the file's own schema names, the projects that name the entry,
    // its links, and its subtasks.
    //
    // Nothing here knows what a scheme or an event is. Which fields are drawn and in what order is
    // drawnFields() over the file's `schema:`, which projects cross-link is crossLinks() over the
    // collection key, and every control is one call of the write path, except the `extra` ones the
    // collection passes in (Start Agent on a task's card). A field the schema draws its choices
    // from the people registry for is the one exception in kind rather than in name: it holds a
    // person's key, so the card draws the control that opens that person by their name.
    //
    // A link is one of three things: a local HTML file opens in the document view, a path inside
    // the hub whose extension `open.program_ext` of config/behavior.yml names an application for (a
    // `.docx`, an `.xlsx`) is `shared/links/ProgramButton.svelte`, which hands the file to that
    // application, since a link to it would only download it, and everything else is a link. A
    // refused or failed open is said through `onsaid`, the line the collection view shows every
    // write's answer on.
    //
    // The controls are views/shared/card/CardActions.svelte, shown under the pointer and kept on
    // one line, and a hub path the entry's `link`, `url` or `folder` names is one of them, which
    // selects that path in the Files view of this page; a long body field is
    // views/shared/card/Clamp.svelte, open or cut by the view instance's state; the subtasks block
    // is drawn only for an entry that has subtasks, adding the first being one of the controls. The
    // card may draw past its own edge, so the More menu is not cut off at its foot.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import CardActions, { type CardAction } from '../../shared/card/CardActions.svelte';
    import Clamp from '../../shared/card/Clamp.svelte';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import EntryForm from '../../shared/forms/EntryForm.svelte';
    import ProgramButton from '../../shared/links/ProgramButton.svelte';
    import Subtasks from '../../shared/forms/Subtasks.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        crossLinks,
        drawnFields,
        entryStatus,
        entrySubtasks,
        hrefOf,
        hubPathsOf,
        isHubPath,
        isPinned,
        identityValue,
        type Entry,
        type Project,
        type SchemaField
    } from '$lib/state/boards/collection';
    import { HUB_ROOT, opensInProgram } from '$lib/state/sources/fs';
    import { openPage } from '$lib/views/shared/explorer/opening';
    import { personName } from '$lib/state/boards/person';
    import { t } from '$lib/state/shared/words/text';
    import { statusTone } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        layout: { openView, showInFiles },
        selectors: { archiveDead, programApps },
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
         * the edit form. Empty for every file that has a schema.
         */
        statuses: string[];
        /** Whether this card's edit form is the one that is open. */
        editing: boolean;
        onedit: () => void;
        /** The reader picked this card up by its grip, or dropped one on it. */
        ondragfrom: (value: string) => void;
        ondropon: (value: string) => void;
        onsaid: (said: string) => void;
        /** Whether the long body fields are drawn whole rather than cut to their clamp. */
        more: boolean;
        /** Open or cut the long body fields. */
        onmore: () => void;
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
        editing,
        onedit,
        ondragfrom,
        ondropon,
        onsaid,
        more,
        onmore,
        extra = []
    }: Props = $props();

    const status = $derived(entryStatus(entry));
    const pinned = $derived(isPinned(entry));
    const groups = $derived(crossLinks(entry, collection, projects, archiveDead()));
    const lines = $derived(entrySubtasks(entry));
    const value = $derived(identityValue(entry, schema));

    /** A card carries its controls only where a write can address it, which needs an identity. */
    const addressable = $derived(schema !== undefined && value !== '');

    /** True once the grip is held down, which is what makes the card draggable and nothing else. */
    let armed = $state(false);

    /** True while the add-subtask form is open, from the block's own control or the card's. */
    let addingSubtask = $state(false);

    /**
     * One Show in Files control per hub path the entry's `link`, `url` or `folder` names. It needs
     * no identity to write by, so a card of a file with no schema carries it too.
     */
    const shows: CardAction[] = $derived(
        hubPathsOf(entry.fields).map((path): CardAction => ({
            id: `files:${path}`,
            label: t('collection.show_in_files'),
            title: t('collection.show_in_files_tip', path),
            glyph: 'show_in_files',
            onclick: () => {
                showInFiles(path);
            }
        }))
    );

    /**
     * The card's controls: the pin, the edit form, while the entry has no subtask adding its first,
     * and the Show in Files controls, then the controls the collection passes in `extra`. A file
     * with no schema has no identity to write by, so its cards carry the file's other lifecycle
     * statuses instead of the first three.
     */
    const actions = $derived.by((): CardAction[] => {
        if (!addressable) {
            const buttons: CardAction[] = statuses
                .filter((one) => one !== status)
                .map((one) => ({
                    id: `status:${one}`,
                    label: one,
                    onclick: () => setStatus(one)
                }));
            return buttons.concat(shows, extra);
        }
        const rows: CardAction[] = [
            {
                id: 'pin',
                label: pinned ? t('collection.unpin') : t('collection.pin_to_top'),
                glyph: t('collection.pin_glyph'),
                active: pinned,
                onclick: pin
            },
            {
                id: 'edit',
                label: t('collection.edit_delete'),
                glyph: t('collection.edit_glyph'),
                active: editing,
                onclick: onedit
            }
        ];
        if (lines.length === 0) {
            rows.push({
                id: 'subtask',
                label: t('project.action.add_subtask'),
                title: t('project.action.add_subtask_tip'),
                glyph: t('project.action.add_subtask_glyph'),
                active: addingSubtask,
                onclick: () => {
                    addingSubtask = !addingSubtask;
                }
            });
        }
        return rows.concat(shows, extra);
    });

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

    /** One person as their own tab, the tab a collaborator tag on a project card opens. */
    function openPerson(key: string): void {
        openView('person', { key, label: personName(portfolio(), key) });
    }

    /** Whether a link names an HTML file of the hub, which the document view can hold as a tab. */
    function isDocument(link: string): boolean {
        // The same rule the Show in Files control is drawn from, so one value is one answer: an
        // address is not a document, and neither is a path climbing out of the hub.
        return hubPathsOf({ link }).length > 0 && /^[^:]*\.html?$/i.test(link);
    }

    /** One local HTML file of the hub as its own tab, the way a bookmark of the rail opens one. */
    function openDocument(link: string): void {
        const parts = link.split('/').filter((one) => one !== '');
        openPage(client, {
            root: HUB_ROOT,
            path: link,
            label: parts[parts.length - 1] ?? link
        });
    }

    /** Whether a link is a file of the hub the map names an application for. */
    function programLink(link: string): boolean {
        return isHubPath(link) && opensInProgram(link, programApps());
    }

    function dragstart(): void {
        ondragfrom(value);
    }

    function dragover(event: DragEvent): void {
        event.preventDefault();
    }

    function drop(event: DragEvent): void {
        event.preventDefault();
        armed = false;
        ondropon(value);
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
        tone={status === undefined ? undefined : statusTone(status)}
        {pinned}
    >
        {#snippet meta()}
            {#if addressable}
                <span
                    class="grip"
                    title={t('collection.reorder_hint')}
                    onmousedown={() => (armed = true)}
                    role="presentation"
                >
                    <Glyph name={t('collection.grip_glyph')} />
                </span>
            {/if}
            {#if status !== undefined}
                <Chip label={status} tone={statusTone(status)} filled />
            {/if}
            {#if actions.length > 0}
                <CardActions {actions} />
            {/if}
        {/snippet}

        <div class="entry">
            {#each drawnFields(entry, schema) as drawn (drawn.field)}
                {#if drawn.kind === 'sub'}
                    <p class="sub">{drawn.values[0]}</p>
                {:else if drawn.kind === 'status'}
                    <!-- The status is the chip in the meta row; it is not drawn twice. -->
                {:else if drawn.kind === 'meta'}
                    <!-- A meta pair is a sentence as often as a word, so it is a wrapping line
                         rather than a chip, which would clip it at the card's edge. -->
                    <div class="metas">
                        {#each drawn.values as one, at (`${at}:${one}`)}
                            <span class="meta">{one}</span>
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
                            <Clamp open={more} ontoggle={onmore}>
                                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                                {@html inlineMarkdown(drawn.values[0])}
                            </Clamp>
                        </blockquote>
                    {:else}
                        <div class="body">
                            <Clamp open={more} ontoggle={onmore}>
                                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                                {@html inlineMarkdown(drawn.values[0])}
                            </Clamp>
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
                {:else if drawn.kind === 'link'}
                    {#if isDocument(drawn.values[0])}
                        <!-- A local HTML file opens in the document view, a hub file the list lets
                             open opens in its program, and every other link leaves the page. -->
                        <p class="body">
                            <ToolButton
                                label={drawn.values[0]}
                                glyph={t('collection.folder_glyph')}
                                onclick={() => openDocument(drawn.values[0])}
                            />
                        </p>
                    {:else if programLink(drawn.values[0])}
                        <p class="body">
                            <ProgramButton
                                root={HUB_ROOT}
                                path={drawn.values[0]}
                                label={drawn.values[0]}
                                {onsaid}
                            />
                        </p>
                    {:else}
                        <p class="body">
                            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
                            <a href={hrefOf(drawn.values[0])} target="_blank" rel="noreferrer">
                                <Glyph
                                    name={drawn.field === 'url'
                                        ? t('collection.link_glyph')
                                        : t('collection.folder_glyph')}
                                />
                                {drawn.values[0]}
                            </a>
                        </p>
                    {/if}
                {:else}
                    <div class="field">
                        <span class="label">{drawn.label}</span>
                        <span class="value">{drawn.values[0]}</span>
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
                />
            {/if}

            {#if editing}
                <EntryForm {collection} {schema} {entry} onclose={onedit} {onsaid} />
            {/if}
        </div>
    </Card>
</div>

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

    .grip {
        cursor: grab;
        color: var(--muted-txt, var(--muted));
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

    a {
        color: var(--accent-txt, var(--accent));
    }
</style>
