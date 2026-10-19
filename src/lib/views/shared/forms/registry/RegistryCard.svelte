<script lang="ts">
    // Layer 3, Structure partial. The card a registry line draws, whether a domain or a pillar: the
    // heading with its accent, which opens the line's page, the tag counting its projects, Edit in
    // File and Delete in the meta row, the line's own body and the cross-links to its projects. The
    // Domains and the Pillars cards differ only in the body they pass in.

    import type { Snippet } from 'svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import CardActions from '$lib/views/shared/card/CardActions.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import DeleteAsk from '$lib/views/shared/forms/entry/DeleteAsk.svelte';
    import { createRecordCard, type RecordCardProps } from './record-card.svelte';
    import { projectCount } from '$lib/views/shared/card/card';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import { pageView } from '$lib/state/forms/page-entry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { openView }
    } = client;

    type Props = RecordCardProps & {
        id: string;
        /** The registry's collection key: `pillars` or `domains`. */
        collection: string;
        title: string;
        /** A hue name from state/shared/words/tones.ts, or none for a card without a bar. */
        tone?: string;
        /** The line's record, which says which hub the line is of. */
        record: { root?: string };
        /** What the line says about itself, drawn above the cross-links. */
        children: Snippet;
    };

    let {
        id,
        collection,
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

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();

    /** Edit in File and Delete are for a line the file holds, drawn while the card is hovered. */
    const card = createRecordCard(client, () => ({ file, entry, schema, fault, onsaid }));

    /** The line's page, opened from its heading. */
    function openPage(): void {
        if (entry === null) return;
        const page = pageView(collection, entry.id, title);
        openView(page.view, page.state);
    }
</script>

<Card
    {id}
    {cursor}
    {title}
    titleHtml={inlineMarkdown(title, cardMath(title))}
    ontitle={entry === null ? undefined : openPage}
    {tone}
>
    {#snippet meta()}
        <RootChip {record} />
        <Tag label={projectCount(projects.length)} />
        {#if card.actions.length > 0}
            <CardActions actions={card.actions} />
        {/if}
    {/snippet}
    {@render children()}
    <CrossLinks {projects} />
</Card>

{#if card.deleting && entry !== null}
    <DeleteAsk {collection} id={entry.id} {onsaid} onclose={card.close} />
{/if}
