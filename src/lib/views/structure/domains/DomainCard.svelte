<script lang="ts">
    // Layer 3, Domains partial. One populated domain: the registry card (RegistryCard.svelte) with
    // its configured accent and its registry prose.

    import RegistryCard from '$lib/views/shared/forms/registry/RegistryCard.svelte';
    import type { RecordCardProps } from '$lib/views/shared/forms/registry/record-card.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import { isDormant, type Domain } from '$lib/state/boards/structure/lines';
    import { domainTone, vocabOf } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';
    import { rootOf } from '$lib/state/shared/page/hubs';

    type Props = RecordCardProps & { domain: Domain };
    let { domain, cursor, projects, entry, schema, file, fault, onsaid }: Props = $props();

    const {
        selectors: { configMap, registryKey }
    } = useState();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();
</script>

<div class:dormant={isDormant(projects, configMap(), vocabOf)} data-domain={domain.id}>
    <RegistryCard
        collection={registryKey('domains', rootOf(domain))}
        id={domain.id}
        {cursor}
        title={domain.title}
        tone={domainTone(domain.id)}
        record={domain}
        {projects}
        {entry}
        {schema}
        {file}
        {fault}
        {onsaid}
    >
        {#if domain.blurb}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p>{@html inlineMarkdown(domain.blurb, cardMath(domain.blurb))}</p>
        {/if}
    </RegistryCard>
</div>

<style>
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
