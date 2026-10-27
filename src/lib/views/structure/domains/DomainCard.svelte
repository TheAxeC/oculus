<script lang="ts">
    // Layer 3, Domains partial. One populated domain as the record card
    // (views/shared/card/record/RecordCard.svelte): its configured accent, the tag counting its
    // projects, its registry prose, and the strip of its projects at the foot. Its heading and the
    // strip's Page open the domain's page; the menu holds Page, the Add run, Edit in File and
    // Delete (views/shared/forms/registry/registry-card.svelte.ts).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import {
        createRegistryCard,
        type RegistryCardProps
    } from '$lib/views/shared/forms/registry/registry-card.svelte';
    import { projectCount } from '$lib/views/shared/card/card';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import { isDormant, type Domain } from '$lib/state/boards/structure/lines';
    import { domainTone, vocabOf } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';
    import { rootOf } from '$lib/state/shared/page/hubs';

    type Props = RegistryCardProps & { domain: Domain };
    let { domain, cursor, projects, entry, schema, file, fault, onsaid }: Props = $props();

    const client = useState();
    const {
        selectors: { configMap, registryKey }
    } = client;

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();

    /** The key the domain's hub gives the domains registry, which its page and writes name. */
    const collection = $derived(registryKey('domains', rootOf(domain)));

    const card = createRegistryCard(client, () => ({
        file,
        entry,
        schema,
        fault,
        onsaid,
        collection,
        title: domain.title
    }));
</script>

{#snippet meta()}
    <Tag label={projectCount(projects.length)} />
{/snippet}

{#snippet text()}
    {#if domain.blurb}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p>{@html inlineMarkdown(domain.blurb, cardMath(domain.blurb))}</p>
    {/if}
{/snippet}

<div class="slot" class:dormant={isDormant(projects, configMap(), vocabOf)} data-domain={domain.id}>
    <RecordCard
        id={domain.id}
        {cursor}
        title={domain.title}
        titleHtml={inlineMarkdown(domain.title, cardMath(domain.title))}
        ontitle={card.onpage}
        tone={domainTone(domain.id)}
        record={domain}
        actions={card.actions}
        strip={['page']}
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

    /* A dormant domain is faded as archival; while the pointer is over it or the keyboard focus is
       inside it the fade lifts, so it is read at full strength. */
    .dormant {
        opacity: 0.62;
        transition: opacity 120ms ease;
    }

    .dormant:hover,
    .dormant:focus-within {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .dormant {
            transition: none;
        }
    }

    p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
