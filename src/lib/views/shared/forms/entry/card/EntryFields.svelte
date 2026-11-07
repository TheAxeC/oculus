<script lang="ts">
    // Layer 3, view partial of EntryCard.svelte. The fields of an entry card under its title: the
    // fields the file's own schema names, in its order, less those of its Website section, which
    // feed the website.
    //
    // On the entry's page the card hands each of its two columns (`column`,
    // views/shared/card/record/RecordDetails.svelte) its own share, every field under its small
    // label (RecordField.svelte beside it): the left column the prose, the subtitle, the meta
    // pairs, the long body fields and the plain words; the right one the rest, the people with the
    // words of each row, the pairs, the tags, the links, the venue, the deadline, then the Website
    // section's fields as the group websiteGroup() gives, under its heading, each with its yes or
    // no where it is a checkbox.
    //
    // Nothing here knows what a scheme or an event is. Which fields are drawn and in what order is
    // drawnFields() over the file's `schema:`. A field the schema draws its choices from the people
    // registry for is the one exception in kind rather than in name: it holds a person's key, which
    // names the person of the entry's own hub, else of the one other hub that holds the key, so the
    // card draws the control that opens that person by their name. A list of records whose rows
    // name a person is the same control once per row; the page adds each row's words beside it. A
    // Literature entry's `venue` that names a venue record is the other: it opens that venue.
    //
    // Every field is drawn as its words, the deadline as a tag with the deadline glyph and the
    // countdown and tone of a project's due (dueBadge of views/shared/card/card.ts); the card's
    // menu and the entry's editor change them.
    //
    // A link is one of three things: a local HTML file opens in the document view, a path inside
    // the hub whose extension `open.program_ext` of config/defaults/behavior.yml names an
    // application for (a `.docx`, an `.xlsx`) is `shared/links/ProgramButton.svelte`, which hands
    // the file to that application, since a link to it would only download it, and everything else
    // is a link. A refused or failed open is said through `onsaid`, the line the collection view
    // shows every write's answer on. A web address written inside the subtitle, a meta row's value
    // or a plain field's value is a link (ui/display/text/LinkedText.svelte); a body field is
    // inline Markdown, which links its addresses itself.
    //
    // A long body field is views/shared/card/Clamp.svelte, open or cut by the view instance's
    // state, and drawn whole by a card handed no `onmore`.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Clamp from '../../../card/Clamp.svelte';
    import EntryLink from './EntryLink.svelte';
    import RecordField from '../../../card/record/RecordField.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        drawnFields,
        websiteGroup,
        type Drawn,
        type Entry,
        type FieldKind,
        type SchemaField
    } from '$lib/state/boards/collection';
    import { personName } from '$lib/state/boards/person';
    import { venueNamed } from '$lib/state/feeds/literature/saved';
    import { pageView } from '$lib/state/forms/page-entry';
    import { t } from '$lib/state/shared/words/text';
    import { dueBadge } from '$lib/views/shared/card/card';
    import { useState } from '$lib/state/client/use';
    import { holdersOf, resolvedId, rootOf } from '$lib/state/shared/page/hubs';
    import { recordState } from '$lib/state/shared/page/records';

    const client = useState();
    const {
        entities: { portfolio },
        layout: { openView },
        selectors: { namesPeople, registryKey, venues }
    } = client;

    type Props = {
        entry: Entry;
        /** The collection key: which file the entry is in. */
        collection: string;
        schema: SchemaField[] | undefined;
        /** The root of the hub the entry is of, which every path of its fields is under. */
        root: string;
        onsaid: (said: string) => void;
        /** Whether the long body fields are drawn whole rather than cut to their clamp. */
        more: boolean;
        /** Open or cut the long body fields; a card handed none draws them whole. */
        onmore?: () => void;
        /**
         * The column of the entry's own page these fields are drawn in, each under its label: the
         * prose in the left one, the rest and the Website group in the right one. A card in a
         * collection is handed none and draws every field.
         */
        column?: 'left' | 'right';
    };

    let { entry, collection, schema, root, onsaid, more, onmore, column }: Props = $props();

    const cardMath = createCardMath();
    /** The moment the deadline's countdown is measured from. */
    const now = Date.now();
    const people = $derived(Object.values(portfolio()?.entities.people ?? {}));

    /** The id of the person a person field's key names, or the key itself when it names none. */
    function personId(key: string): string {
        return resolvedId(holdersOf(people), rootOf(entry), key) ?? key;
    }

    /**
     * The page of the venue record a Literature entry's venue names, by name ignoring case, under
     * the venue's hub's key of the venues registry. An entry is a Literature entry when its
     * collection is the one its hub's list gives the `literature` registry.
     */
    const venuePage = $derived.by(() => {
        const literature = collection === registryKey('literature', rootOf(entry));
        const name = literature ? entry.fields.venue : undefined;
        const one = typeof name === 'string' ? venueNamed(name, venues()) : undefined;
        if (one === undefined) return undefined;
        return pageView(registryKey('venues', rootOf(one)), one.id, one.name);
    });

    /** Whether a `foreign_key:` target names a people collection of the entry's hub. */
    function namesPerson(target: string): boolean {
        return namesPeople(target, root);
    }

    /** One person as their own tab, the tab a person of a project card's team opens. */
    function openPerson(key: string): void {
        const id = personId(key);
        openView('person', recordState(id, personName(portfolio(), id)));
    }

    /** What the page's right column draws after the fields; a card in a collection draws none. */
    const group = $derived(column === 'right' ? websiteGroup(entry, schema, namesPerson) : null);

    /** The kinds of field the page's left column holds: the prose. */
    const PROSE: readonly FieldKind[] = ['sub', 'meta', 'body', 'text'];

    /** Whether a field is drawn here: every field on a card, its column's share on the page. */
    function drawnHere(drawn: Drawn): boolean {
        if (column === undefined) return true;
        const prose =
            PROSE.includes(drawn.kind) &&
            drawn.field !== 'deadline' &&
            !(drawn.field === 'venue' && venuePage !== undefined);
        return (column === 'left') === prose;
    }

    const fields = $derived(drawnFields(entry, schema, namesPerson).filter(drawnHere));
</script>

<!-- The control that opens one person, by their name. -->
{#snippet personChip(key: string)}
    <Chip
        label={personName(portfolio(), personId(key))}
        glyph={t('collection.person_glyph')}
        title={t('collection.open_person')}
        onclick={() => openPerson(key)}
    />
{/snippet}

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

<!-- One field, by its kind. -->
{#snippet field(drawn: Drawn)}
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
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render personChip(drawn.values[0])}
        </div>
    {:else if drawn.kind === 'people'}
        <div class="row">
            <span class="label">{drawn.label}</span>
            {#each drawn.values as key, at (`${at}:${key}`)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render personChip(key)}
            {/each}
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
    {:else if drawn.field === 'deadline'}
        {@const due = dueBadge(drawn.values[0], now, t)}
        <div class="row">
            <span class="label">{drawn.label}</span>
            <Tag
                label={due?.label ?? drawn.values[0]}
                glyph={t('project.card.deadline_glyph')}
                tone={due?.tone}
            />
        </div>
    {:else}
        <div class="field">
            <span class="label">{drawn.label}</span>
            <span class="values">
                {#each drawn.values as one, at (`${at}:${one}`)}
                    <span class="value"><LinkedText text={one} /></span>
                {/each}
            </span>
        </div>
    {/if}
{/snippet}

<!-- One field on the entry's page, under its label, by its kind. -->
{#snippet pageField(drawn: Drawn)}
    {#if drawn.kind !== 'status'}
        <RecordField label={drawn.label}>
            {#if drawn.kind === 'sub'}
                <p class="sub"><LinkedText text={drawn.values[0]} /></p>
            {:else if drawn.kind === 'meta'}
                <div class="metas">
                    {#each drawn.values as one, at (`${at}:${one}`)}
                        <span class="meta"><LinkedText text={one} /></span>
                    {/each}
                </div>
            {:else if drawn.kind === 'pairs' || drawn.kind === 'chips'}
                <div class="row">
                    {#each drawn.values as one, at (`${at}:${one}`)}
                        <Tag label={one} />
                    {/each}
                </div>
            {:else if drawn.kind === 'body' && drawn.field === 'statement'}
                <blockquote class="stmt" title={t('collection.fundstmt_tip')}>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render text(drawn.values[0])}
                </blockquote>
            {:else if drawn.kind === 'body'}
                <div class="body">
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render text(drawn.values[0])}
                </div>
            {:else if drawn.kind === 'person'}
                <div class="row">
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render personChip(drawn.values[0])}
                </div>
            {:else if drawn.kind === 'people'}
                {#each drawn.values as key, at (`${at}:${key}`)}
                    <div class="row">
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render personChip(key)}
                        <span class="value"><LinkedText text={drawn.details?.[at] ?? ''} /></span>
                    </div>
                {/each}
            {:else if drawn.field === 'venue' && venuePage !== undefined}
                <div class="row">
                    <Chip
                        label={drawn.values[0]}
                        glyph="goto"
                        title={t('collection.open_venue')}
                        onclick={() => openView(venuePage.view, venuePage.state)}
                    />
                </div>
            {:else if drawn.kind === 'link'}
                <EntryLink field={drawn.field} value={drawn.values[0]} {root} {onsaid} />
            {:else if drawn.field === 'deadline'}
                {@const due = dueBadge(drawn.values[0], now, t)}
                <div class="row">
                    <Tag
                        label={due?.label ?? drawn.values[0]}
                        glyph={t('project.card.deadline_glyph')}
                        tone={due?.tone}
                    />
                </div>
            {:else}
                <span class="values">
                    {#each drawn.values as one, at (`${at}:${one}`)}
                        <span class="value"><LinkedText text={one} /></span>
                    {/each}
                </span>
            {/if}
        </RecordField>
    {/if}
{/snippet}

{#each fields as drawn (drawn.field)}
    {#if column === undefined}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render field(drawn)}
    {:else}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render pageField(drawn)}
    {/if}
{/each}

{#if group !== null}
    <div class="group">
        <p class="heading">{group.heading}</p>
        {#each group.fields as drawn (drawn.field)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render pageField(drawn)}
        {/each}
    </div>
{/if}

<style>
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

    .values {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .group {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .heading {
        margin: 0;
        font-size: var(--fs-sm);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }
</style>
