<script lang="ts">
    // Layer 3, view partial of views/feeds/literature/Literature.svelte. One paper with what every
    // source that found it says. The title is a link to the paper's address; the authors line and
    // the venue line are each cut with an ellipsis where the card ends and hold their whole text as
    // the tooltip, the venue line's tooltip also giving each source's citation count. The abstract
    // is text under a disclosure, closed until opened. Everything a source sent is drawn as text,
    // never as markup.
    //
    // Open PDF is a link and only drawn when a source named an open one. Copy BibTeX puts one entry
    // on the clipboard and says where it came from; it writes no file. Add to Lit Watch opens the
    // small form and reads `In Lit Watch`, not pressable, once the radar holds the paper. Save to
    // Literature writes the paper to the Literature collection and reads `In Literature` once the
    // collection holds it.

    import { onDestroy } from 'svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import AddForm from './AddForm.svelte';
    import { copiedWords, sourceName, typeWords } from './words';
    import { routeBody } from '$lib/state/feeds/literature/answers';
    import { entryFor } from '$lib/state/feeds/literature/bibtex';
    import type { MergedHit } from '$lib/state/feeds/literature/merge';
    import { posting } from '../../shared/card/feed/posting';
    import SaveToLiterature from '../../shared/card/feed/SaveToLiterature.svelte';
    import { hitPaper } from '$lib/state/feeds/literature/saved';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        writes: { writeToken }
    } = useState();

    type Props = {
        hit: MergedHit;
        id: string;
        cursor: boolean;
        /** Whether the radar holds this paper already. */
        inRadar: boolean;
        /** The radar's buckets and the portfolio's projects as the form's choices. */
        buckets: { id: string; label: string }[];
        projects: { id: string; label: string }[];
        /** Whether the radar file is missing on this hub, so there is nothing to add to. */
        radarMissing: boolean;
        onsaid: (words: string) => void;
    };

    let { hit, id, cursor, inRadar, buckets, projects, radarMissing, onsaid }: Props = $props();
    let open = $state(false);
    let adding = $state(false);
    let copying = $state(false);
    let closed = false;
    onDestroy(() => (closed = true));

    const title = $derived(hit.title === '' ? t('literature.untitled') : hit.title);
    const link = $derived(hit.url === undefined ? undefined : posting(hit.url));
    const authors = $derived(hit.authors.join(t('literature.sep')));
    const detail = $derived(
        [
            hit.venue ?? '',
            hit.year === undefined ? '' : String(hit.year),
            typeWords(hit.type),
            hit.cites === undefined
                ? ''
                : hit.cites === 1
                  ? t('literature.cites_one')
                  : t('literature.cites', hit.cites)
        ]
            .filter(Boolean)
            .join(t('literature.sep'))
    );
    const citeTip = $derived(
        Object.entries(hit.citesBy)
            .map(
                ([source, count]) =>
                    `${sourceName(source as keyof typeof hit.citesBy)}: ${String(count)}`
            )
            .join(t('literature.sep'))
    );

    async function copy(): Promise<void> {
        if (copying) return;
        copying = true;
        try {
            const entry = await entryFor(hit, (url) => routeBody(url, writeToken()));
            await navigator.clipboard.writeText(entry.text);
            if (!closed) onsaid(copiedWords(entry.from));
        } catch {
            if (!closed) onsaid(t('literature.copy_failed'));
        } finally {
            copying = false;
        }
    }

    function add(): void {
        if (radarMissing) {
            onsaid(t('literature.no_radar'));
            return;
        }
        adding = !adding;
    }
</script>

<Card {id} {cursor} {title}>
    {#snippet heading()}
        {#if link !== undefined}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is a paper's page on another site, rather than a route id resolve() takes -->
            <a class="title" href={link} target="_blank" rel="noreferrer">{title}</a>
        {:else}
            <span class="title">{title}</span>
        {/if}
    {/snippet}
    {#snippet meta()}
        {#each hit.sources as source (source)}
            <Tag label={sourceName(source)} />
        {/each}
        {#if hit.oa}
            <Tag label={t('literature.open')} tone="green" />
        {/if}
    {/snippet}

    {#if authors !== ''}
        <p class="line" title={authors}>{authors}</p>
    {/if}
    {#if detail !== ''}
        <p
            class="line"
            title={citeTip === '' ? detail : `${detail}${t('literature.sep')}${citeTip}`}
        >
            {detail}
        </p>
    {/if}

    <div class="row">
        <ToolButton
            label={t('literature.abstract')}
            glyph="disclosure"
            expanded={open}
            onclick={() => (open = !open)}
        />
        {#if hit.pdf !== undefined}
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is an open PDF on another site -->
            <a class="pdf" href={hit.pdf} target="_blank" rel="noreferrer">
                <Glyph name="link" />
                {t('literature.pdf')}
            </a>
        {/if}
        <ToolButton label={t('literature.bibtex')} glyph="copy" disabled={copying} onclick={copy} />
        {#if inRadar}
            <ToolButton
                label={t('literature.in_radar')}
                glyph="litwatch"
                disabled
                title={t('literature.in_radar_tip')}
                onclick={() => undefined}
            />
        {:else}
            <ToolButton
                label={t('literature.add')}
                glyph="litwatch"
                active={adding}
                title={radarMissing ? t('literature.no_radar') : t('literature.add_tip')}
                onclick={add}
            />
        {/if}
        <SaveToLiterature
            ids={{ doi: hit.doi, title: hit.title }}
            paper={hitPaper(hit)}
            source="search"
            {onsaid}
        />
    </div>

    {#if open}
        <p class="abstract">{hit.abstract ?? t('literature.no_abstract')}</p>
    {/if}
    {#if adding && !inRadar}
        <AddForm {hit} {buckets} {projects} onclose={() => (adding = false)} {onsaid} />
    {/if}
</Card>

<style>
    .line {
        margin: 4px 0 0;
        min-width: 0;
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .title {
        overflow-wrap: anywhere;
    }

    a.title {
        color: var(--accent-txt, var(--accent));
    }

    .row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
    }

    .abstract {
        margin: 6px 0 0;
        overflow-wrap: anywhere;
        white-space: pre-line;
    }

    .pdf {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
