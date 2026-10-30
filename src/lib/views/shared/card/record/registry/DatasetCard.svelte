<script lang="ts">
    // Layer 3, shared view partial, drawn by the Data view and, with `page`, by the dataset's page
    // (views/boards/entry/Entry.svelte). One dataset as the record card
    // (views/shared/card/record/RecordCard.svelte): its registry metadata, its folder, its notes,
    // how it comes back, and the strip of its project users at the foot. The dataset's name and
    // the strip's Page open its page; the menu holds Page and Source in its Open run, the Add run,
    // Edit, Edit in File, Recover and Delete (views/shared/forms/registry/registry-card.svelte.ts).
    // On the page the name is words, the strip holds Edit and the tags wrap, so a long path is
    // drawn whole.
    //
    // A set whose sources are all of kinds a row of its hub's `recover.sources` reads has the
    // Recover action, which opens the dataset's Recover view beside this one for its own hub and
    // key; a kind no row reads is a line naming that hub's `.oculus/config.yml`. A source of the
    // kind `library`, `request` or `derived` is stated on the card instead: the library call, the
    // contact to ask, or the sets it is built from and the script that builds it; a web address in
    // it, a contact's form among them, is a link. The description and the notes are inline
    // Markdown, which links its addresses itself.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import type { RecordAction } from '$lib/views/shared/card/record/record-menu';
    import {
        createRegistryCard,
        type RegistryCardProps
    } from '$lib/views/shared/forms/registry/registry-card.svelte';
    import {
        accessTone,
        recoverKey,
        statedSource,
        statedWords,
        unreadWords,
        type Dataset
    } from '$lib/state/sources/registries/datasets';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { keyOf, rootOf } from '$lib/state/shared/page/hubs';

    const client = useState();
    const {
        layout: { openBeside },
        selectors: { registryKey }
    } = client;

    type Props = RegistryCardProps & { dataset: Dataset };

    let {
        dataset,
        cursor,
        projects,
        entry,
        schema,
        file,
        fault,
        onsaid,
        page = false
    }: Props = $props();

    /** The key the dataset's hub gives the datasets registry, which its page and writes name. */
    const collection = $derived(registryKey('datasets', rootOf(dataset)));

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();

    const name = $derived(dataset.name === '' ? dataset.id : dataset.name);

    /** Page, Edit in File and Delete for a dataset the collection file holds. */
    const card = createRegistryCard(client, () => ({
        file,
        entry,
        schema,
        fault,
        onsaid,
        collection,
        title: dataset.name === '' ? keyOf(dataset.id) : dataset.name,
        page
    }));

    /** The kinds of the dataset's download sources, each once, in the file's order. */
    const kinds = $derived([
        ...new Set(dataset.retrieval.filter((one) => !statedSource(one)).map((one) => one.kind))
    ]);
    /** The sources the card states: a library call, a contact, or what the set is built from. */
    const statedSources = $derived(dataset.retrieval.filter(statedSource));
    const notes = $derived(dataset.notes ?? '');

    /**
     * The card's actions: Page, Edit in File and Delete for a dataset the collection file holds,
     * Source for a dataset that names one, and Recover for a set whose sources are all downloads.
     */
    const actions = $derived.by((): RecordAction[] => {
        const rows: RecordAction[] = [...card.actions];
        const source = dataset.source;
        if (source) {
            rows.push({
                id: 'source',
                label: t('data.source'),
                title: source,
                glyph: 'link',
                run: 'open',
                onclick: () => {
                    window.open(source, '_blank', 'noopener,noreferrer');
                }
            });
        }
        if (dataset.recover) {
            rows.push({
                id: 'recover',
                label: t('data.recover'),
                title: t('data.recover_title'),
                glyph: 'refresh',
                onclick: recover
            });
        }
        return rows;
    });

    /** The dataset's Recover view beside this one, for the hub the dataset is read from. */
    function recover(): void {
        const key = recoverKey(dataset);
        openBeside('recover', { hub: rootOf(dataset), key, label: t('data.recover_tab', key) });
    }
</script>

{#snippet meta()}
    {#if dataset.access}
        <Tag label={dataset.access} tone={accessTone(dataset.access, rootOf(dataset))} />
    {/if}
{/snippet}

{#snippet text()}
    {#if dataset.description}
        <p class="description">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            {@html inlineMarkdown(dataset.description, cardMath(dataset.description))}
        </p>
    {/if}

    <!-- eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string must not count as a value here, which ?? would make it -->
    {#if dataset.size || dataset.path || kinds.length > 0}
        <div class="meta">
            {#if dataset.size}
                {@const words = `${t('data.size')} ${dataset.size}`}
                <Tooltip text={words}>
                    <Tag label={words} wrap={page} />
                </Tooltip>
            {/if}
            {#if dataset.path}
                {@const words = `${t('data.path')} ${dataset.path}`}
                <Tooltip text={words}>
                    <Tag label={words} wrap={page} />
                </Tooltip>
            {/if}
            {#if kinds.length > 0}
                {@const words = `${t('data.fetch')} ${kinds.join(', ')}`}
                <Tooltip text={words}>
                    <Tag label={words} wrap={page} />
                </Tooltip>
            {/if}
        </div>
    {/if}

    {#if dataset.modality}
        <div class="tags">
            <Tag label={dataset.modality} />
        </div>
    {/if}

    {#each statedSources as source, at (at)}
        <div class="note">
            <Glyph name="note_back" />
            <span><LinkedText text={statedWords(source)} /></span>
        </div>
    {/each}

    {#each dataset.unread ?? [] as kind (kind)}
        <div class="note">
            <Glyph name="note_back" />
            <span><CodeText text={unreadWords(kind, rootOf(dataset))} /></span>
        </div>
    {/each}

    {#if notes !== ''}
        <div class="note">
            <Glyph name="note_back" />
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <span>{@html inlineMarkdown(notes, cardMath(notes))}</span>
        </div>
    {/if}

    {#if dataset.source}
        <div class="links">
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
            <a href={dataset.source} target="_blank" rel="noopener">
                <Glyph name="link" />
                {t('data.source')}
            </a>
        </div>
    {/if}
{/snippet}

<div class="slot" data-dataset={dataset.id}>
    <RecordCard
        id={dataset.id}
        {cursor}
        title={name}
        titleHtml={inlineMarkdown(name, cardMath(name))}
        ontitle={card.onpage}
        record={dataset}
        {actions}
        strip={card.strip}
        dated={card.dated}
        {onsaid}
        {meta}
        {text}
        {projects}
        deleting={card.deleting}
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

    .meta,
    .tags,
    .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .description,
    .meta,
    .tags,
    .note,
    .links {
        margin-top: 8px;
    }

    .description,
    .note {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .description {
        margin-bottom: 0;
    }

    /* A path, a file pattern or an address is one unbroken word, which breaks at the card's edge
       rather than widening the card past its column. */
    .description,
    .note > span {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .links a {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
    }
</style>
