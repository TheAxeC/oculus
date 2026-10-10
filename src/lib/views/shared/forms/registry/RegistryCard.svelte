<script lang="ts">
    // Layer 3, Structure partial. The card a registry line draws, whether a domain or a pillar: the
    // heading with its accent, the tag counting its projects and Edit in File in the meta row, the
    // line's own body and the cross-links to its projects. The Domains and the Pillars cards differ
    // only in the body they pass in.

    import type { Snippet } from 'svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import CardActions from '$lib/views/shared/card/CardActions.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import { fileNameOf, openEntry } from '$lib/views/shared/forms/entry-file';
    import { editAction, projectCount } from '$lib/views/shared/card/card';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, IdentityFault, SchemaField } from '$lib/state/boards/collection';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { useState } from '$lib/state/client/use';
    import type { Project } from '$lib/state/boards/structure/lines';

    const client = useState();

    type Props = {
        id: string;
        cursor: boolean;
        title: string;
        /** A hue name from state/shared/words/tones.ts, or none for a card without a bar. */
        tone?: string;
        /** The line's record, which says which hub the line is of. */
        record: { root?: string };
        projects: Project[];
        /** The file's entry for this line, or null for a line the file does not hold. */
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        /** The registry file, which Edit in File opens; null when the configuration names none. */
        file: ViewSource | null;
        fault: IdentityFault | undefined;
        onsaid: (said: string) => void;
        /** What the line says about itself, drawn above the cross-links. */
        children: Snippet;
    };

    let {
        id,
        cursor,
        title,
        tone,
        record,
        projects,
        entry,
        schema,
        file,
        fault,
        onsaid,
        children
    }: Props = $props();

    /** Edit in File is for a line the file holds, drawn while the card is hovered or focused. */
    const actions = $derived(
        entry !== null && schema !== undefined
            ? [
                  editAction(fileNameOf(file), () =>
                      openEntry(client, file, entry, schema, fault, onsaid)
                  )
              ]
            : []
    );
</script>

<Card {id} {cursor} {title} titleHtml={inlineMarkdown(title)} {tone}>
    {#snippet meta()}
        <RootChip {record} />
        <Tag label={projectCount(projects.length)} />
        {#if actions.length > 0}
            <CardActions {actions} />
        {/if}
    {/snippet}
    {@render children()}
    <CrossLinks {projects} />
</Card>
