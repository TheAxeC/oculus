<script lang="ts">
    // Layer 3, view partial of views/Collection.svelte. One entry of one collection file as a card:
    // the grip it is dragged by, the pin mark, the title, the status chip, the controls, the fields
    // the file's own schema names, the projects that name the entry, its links, and its subtasks.
    //
    // Nothing here knows what a scheme or an event is. Which fields are drawn and in what order is
    // drawnFields() over the file's `schema:`, which projects cross-link is crossLinks() over the
    // collection key, and every control is one call of the write path.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import CrossLinks from '$lib/views/shared/CrossLinks.svelte';
    import EntryForm from '../shared/EntryForm.svelte';
    import Subtasks from '../shared/Subtasks.svelte';
    import {
        crossLinks,
        drawnFields,
        entryStatus,
        entrySubtasks,
        hrefOf,
        HUB_ROOT,
        inlineMarkdown,
        isPinned,
        identityValue,
        type Entry,
        type Project,
        type SchemaField
    } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';
    import { statusTone } from '$lib/state/tones';
    import { writeEntry } from '$lib/state/writes.svelte';

    type Props = {
        entry: Entry;
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
    };

    let {
        entry,
        collection,
        schema,
        projects,
        statuses,
        editing,
        onedit,
        ondragfrom,
        ondropon,
        onsaid
    }: Props = $props();

    const status = $derived(entryStatus(entry));
    const pinned = $derived(isPinned(entry));
    const groups = $derived(crossLinks(entry, collection, projects));
    const lines = $derived(entrySubtasks(entry));
    const value = $derived(identityValue(entry, schema));

    /** A card carries its controls only where a write can address it, which needs an identity. */
    const addressable = $derived(schema !== undefined && value !== '');

    /** True once the grip is held down, which is what makes the card draggable and nothing else. */
    let armed = $state(false);

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

    /** Whether a link names a local HTML file, which the document view can hold as a tab. */
    function isDocument(link: string): boolean {
        return /^[^:]*\.html?$/i.test(link) && !link.startsWith('/');
    }

    /** One local HTML file of the hub as its own tab, the way a bookmark of the rail opens one. */
    function openDocument(link: string): void {
        const parts = link.split('/').filter((one) => one !== '');
        openView('document', 'main', {
            root: HUB_ROOT,
            path: link,
            label: parts[parts.length - 1] ?? link
        });
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
        title={entry.title === '' ? entry.id : entry.title}
        tone={status === undefined ? undefined : statusTone(status)}
        {pinned}
    >
        {#snippet meta()}
            {#if addressable}
                <span
                    class="grip"
                    title={t('col.reorder_hint')}
                    onmousedown={() => (armed = true)}
                    role="presentation"
                >
                    <Glyph name={t('collection.grip_glyph')} />
                </span>
            {/if}
            {#if status !== undefined}
                <Chip label={status} tone={statusTone(status)} filled />
            {/if}
            {#if addressable}
                <ToolButton
                    label={pinned ? t('col.unpin') : t('col.pin_to_top')}
                    glyph={t('collection.pin_glyph')}
                    active={pinned}
                    compact
                    onclick={pin}
                />
                <ToolButton
                    label={t('col.edit_delete')}
                    glyph={t('collection.edit_glyph')}
                    active={editing}
                    compact
                    onclick={onedit}
                />
            {:else}
                {#each statuses.filter((one) => one !== status) as one (one)}
                    <ToolButton label={one} onclick={() => setStatus(one)} />
                {/each}
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
                {:else if drawn.kind === 'chips'}
                    <div class="row">
                        {#each drawn.values as one, at (`${at}:${one}`)}
                            <Chip label={one} />
                        {/each}
                    </div>
                {:else if drawn.kind === 'body'}
                    {#if drawn.field === 'statement'}
                        <blockquote class="stmt" title={t('col.fundstmt_tip')}>
                            {@html inlineMarkdown(drawn.values[0])}
                        </blockquote>
                    {:else}
                        <p class="body">{@html inlineMarkdown(drawn.values[0])}</p>
                    {/if}
                {:else if drawn.kind === 'link'}
                    {#if isDocument(drawn.values[0])}
                        <!-- A local HTML file opens as its own tab, which is what O14c's document
                             view is for; everything else is a link out of the page. -->
                        <p class="body">
                            <ToolButton
                                label={drawn.values[0]}
                                glyph={t('collection.folder_glyph')}
                                onclick={() => openDocument(drawn.values[0])}
                            />
                        </p>
                    {:else}
                        <p class="body">
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
                <Subtasks target={{ id: entry.id, collection }} subtasks={lines} {onsaid} />
            {/if}

            {#if editing}
                <EntryForm {collection} {schema} {entry} onclose={onedit} {onsaid} />
            {/if}
        </div>
    </Card>
</div>

<style>
    .grip {
        cursor: grab;
        font-size: var(--fs-lg);
        color: var(--muted-txt, var(--muted));
    }

    .sub {
        margin: 0 0 4px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
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
        margin-top: 6px;
    }

    .label {
        flex: 0 0 auto;
        font-size: var(--fs-xxs);
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
