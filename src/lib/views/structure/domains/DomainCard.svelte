<script lang="ts">
    // Layer 3, Domains partial. One populated domain: the registry card (RegistryCard.svelte) with
    // its configured accent and its registry prose.

    import RegistryCard from '$lib/views/shared/forms/registry/RegistryCard.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import type { Entry, IdentityFault, SchemaField } from '$lib/state/boards/collection';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { isDormant, type Domain, type Project } from '$lib/state/boards/structure/lines';
    import { domainTone } from '$lib/state/shared/words/tones';

    type Props = {
        domain: Domain;
        cursor: boolean;
        projects: Project[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        file: ViewSource | null;
        fault: IdentityFault | undefined;
        onsaid: (said: string) => void;
    };
    let { domain, cursor, projects, entry, schema, file, fault, onsaid }: Props = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();
</script>

<div class:dormant={isDormant(projects)} data-domain={domain.id}>
    <RegistryCard
        collection="domains"
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
    .dormant {
        opacity: 0.62;
    }

    p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
