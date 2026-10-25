<script lang="ts">
    // Layer 3, Data view partial. One dataset card: its registry metadata, its folder, its notes,
    // how it comes back, project users, Edit in File and Delete. The dataset's name opens its page.
    //
    // A set whose sources are all downloads has the Recover control, which opens the dataset's
    // Recover view beside this one for its own hub and key. A source of the kind `library`,
    // `request` or `derived` is stated on the card instead: the library call, the contact to ask,
    // or the sets it is built from and the script that builds it; a web address in it, a contact's
    // form among them, is a link. The description and the notes are inline Markdown, which links
    // its addresses itself.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import CardActions, { type CardAction } from '$lib/views/shared/card/CardActions.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import DeleteAsk from '$lib/views/shared/forms/entry/DeleteAsk.svelte';
    import {
        createRecordCard,
        type RecordCardProps
    } from '$lib/views/shared/forms/registry/record-card.svelte';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import {
        accessTone,
        recoverKey,
        statedSource,
        statedWords,
        type Dataset
    } from '$lib/state/sources/registries/datasets';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import { pageView } from '$lib/state/forms/page-entry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { keyOf, rootOf } from '$lib/state/shared/page/hubs';

    const client = useState();
    const {
        layout: { openView, openBeside }
    } = client;

    type Props = RecordCardProps & { dataset: Dataset };

    let { dataset, cursor, projects, entry, schema, file, fault, onsaid }: Props = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();

    /** Edit in File and Delete for a dataset the collection file holds. */
    const card = createRecordCard(client, () => ({ file, entry, schema, fault, onsaid }));

    /** The kinds of the dataset's download sources, each once, in the file's order. */
    const kinds = $derived([
        ...new Set(dataset.retrieval.filter((one) => !statedSource(one)).map((one) => one.kind))
    ]);
    /** The sources the card states: a library call, a contact, or what the set is built from. */
    const statedSources = $derived(dataset.retrieval.filter(statedSource));
    const notes = $derived(dataset.notes ?? '');

    /**
     * The card's controls, drawn while the card is hovered or holds the focus: Edit in File and
     * Delete for a dataset the collection file holds, and Recover for a set whose sources are all
     * downloads.
     */
    const actions = $derived.by((): CardAction[] => {
        if (!dataset.recover) return card.actions;
        return card.actions.concat({
            id: 'recover',
            label: t('data.recover'),
            title: t('data.recover_title'),
            glyph: 'refresh',
            onclick: recover
        });
    });

    /** The dataset's page, opened from its heading. */
    function openPage(): void {
        if (entry === null) return;
        const page = pageView(
            'data',
            entry.id,
            dataset.name === '' ? keyOf(dataset.id) : dataset.name
        );
        openView(page.view, page.state);
    }

    /** The dataset's Recover view beside this one, for the hub the dataset is read from. */
    function recover(): void {
        const key = recoverKey(dataset);
        openBeside('recover', { hub: rootOf(dataset), key, label: t('data.recover_tab', key) });
    }
</script>

<div class="slot" data-dataset={dataset.id}>
    <Card
        id={dataset.id}
        {cursor}
        title={dataset.name === '' ? dataset.id : dataset.name}
        titleHtml={inlineMarkdown(
            dataset.name === '' ? dataset.id : dataset.name,
            cardMath(dataset.name === '' ? dataset.id : dataset.name)
        )}
        ontitle={entry === null ? undefined : openPage}
    >
        {#snippet meta()}
            <RootChip record={dataset} />
            {#if dataset.access}
                <Tag label={dataset.access} tone={accessTone(dataset.access, rootOf(dataset))} />
            {/if}
            <CardActions {actions} />
        {/snippet}

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
                        <Tag label={words} />
                    </Tooltip>
                {/if}
                {#if dataset.path}
                    {@const words = `${t('data.path')} ${dataset.path}`}
                    <Tooltip text={words}>
                        <Tag label={words} />
                    </Tooltip>
                {/if}
                {#if kinds.length > 0}
                    {@const words = `${t('data.fetch')} ${kinds.join(', ')}`}
                    <Tooltip text={words}>
                        <Tag label={words} />
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

        {#if notes !== ''}
            <div class="note">
                <Glyph name="note_back" />
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                <span>{@html inlineMarkdown(notes, cardMath(notes))}</span>
            </div>
        {/if}

        {#if projects.length > 0}
            <CrossLinks {projects} />
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
    </Card>
</div>

{#if card.deleting && entry !== null}
    <DeleteAsk collection="data" id={entry.id} {onsaid} onclose={card.close} />
{/if}

<style>
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

    .links a {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
    }
</style>
