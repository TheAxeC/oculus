<script lang="ts">
    // Layer 3, Domains partial. One populated domain: the registry card (RegistryCard.svelte) with
    // its configured accent and its registry prose.

    import RegistryCard from '$lib/views/shared/forms/RegistryCard.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, SchemaField } from '$lib/state/boards/collection';
    import { isDormant, type Domain, type Project } from '$lib/state/boards/structure/lines';
    import { domainTone } from '$lib/state/shared/words/tones';

    type Props = {
        domain: Domain;
        cursor: boolean;
        projects: Project[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        editing: boolean;
        onedit: () => void;
        onsaid: (said: string) => void;
    };
    let { domain, cursor, projects, entry, schema, editing, onedit, onsaid }: Props = $props();
</script>

<div class:dormant={isDormant(projects)} data-domain={domain.id}>
    <RegistryCard
        collection="domains"
        id={domain.id}
        {cursor}
        title={domain.title}
        tone={domainTone(domain.id)}
        {projects}
        {entry}
        {schema}
        {editing}
        {onedit}
        {onsaid}
    >
        {#if domain.blurb}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p>{@html inlineMarkdown(domain.blurb)}</p>
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
