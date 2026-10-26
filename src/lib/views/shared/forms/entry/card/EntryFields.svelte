<script lang="ts">
    // Layer 3, view partial of EntryCard.svelte. The fields of an entry card under its title: the
    // fields the file's own schema names, in its order, and the line of the projects that name the
    // entry.
    //
    // Nothing here knows what a scheme or an event is. Which fields are drawn and in what order is
    // drawnFields() over the file's `schema:`, and which projects cross-link is crossLinks() over
    // the registry and the flags of the entry's collection in its own hub. A field the schema draws
    // its choices from the people registry for is the one exception in kind rather than in name: it
    // holds a person's key, which names the person of the entry's own hub, else of the one other
    // hub that holds the key, so the card draws the control that opens that person by their name. A
    // Literature entry's `venue` that names a venue record is the other: it opens that venue.
    //
    // A deadline and a date change on the card (shared/forms/InPlace.svelte) where the file has a
    // schema to write by; `blocked` disables them as it does the card's other controls that write.
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
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import InPlace from '../../InPlace.svelte';
    import EntryLink from './EntryLink.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        drawnFields,
        type Entry,
        type Project,
        type SchemaField
    } from '$lib/state/boards/collection';
    import { crossLinks } from '$lib/state/boards/structure/cross-links';
    import { personName } from '$lib/state/boards/person';
    import { venueNamed } from '$lib/state/feeds/literature/saved';
    import { pageView } from '$lib/state/forms/page-entry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { holdersOf, resolvedId, rootOf } from '$lib/state/shared/page/hubs';
    import { recordState } from '$lib/state/shared/page/records';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { portfolio },
        layout: { openView },
        selectors: { collectionsOfKey, configMap, namesPeople, registryKey, venues }
    } = client;

    type Props = {
        entry: Entry;
        /** The collection key: which file the entry is in, and which cross-link rule it follows. */
        collection: string;
        schema: SchemaField[] | undefined;
        /** Every project of the snapshot, for the cross-links. */
        projects: Project[];
        /** The root of the hub the entry is of, which every path of its fields is under. */
        root: string;
        /** Whether the file has a schema to write by, which the in-place fields need. */
        addressable: boolean;
        /** Why the controls that write are disabled, '' when they are not. */
        blocked: string;
        onsaid: (said: string) => void;
        /** Whether the long body fields are drawn whole rather than cut to their clamp. */
        more: boolean;
        /** Open or cut the long body fields; a card handed none draws them whole. */
        onmore?: () => void;
    };

    let {
        entry,
        collection,
        schema,
        projects,
        root,
        addressable,
        blocked,
        onsaid,
        more,
        onmore
    }: Props = $props();

    const cardMath = createCardMath();
    const people = $derived(Object.values(portfolio()?.entities.people ?? {}));
    /** The collection of the entry's own hub that holds it, whose entry says its cross-link rule. */
    const held = $derived(
        collectionsOfKey(collection).find((one) => rootOf(one) === rootOf(entry))
    );
    const groups = $derived(crossLinks(entry, held, projects, people, configMap(), vocabOf));

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

{#each drawnFields(entry, schema, namesPerson) as drawn (drawn.field)}
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
                label={personName(portfolio(), personId(drawn.values[0]))}
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
            <InPlace field={drawn.field} {collection} {entry} {schema} {blocked} {onsaid} />
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
</style>
