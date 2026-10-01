<script lang="ts">
    // Layer 3, Structure partial. The card a registry line draws, whether a domain or a pillar: the
    // heading with its accent, the tag counting its projects and the edit control in the meta row,
    // the line's own body, the cross-links to its projects, and the schema-driven edit form while
    // it is open. The Domains and the Pillars cards differ only in the body they pass in.

    import type { Snippet } from 'svelte';
    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import CardActions from '$lib/views/shared/card/CardActions.svelte';
    import EntryForm from '$lib/views/shared/forms/EntryForm.svelte';
    import { editAction, projectCount } from '$lib/views/shared/card/card';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, SchemaField } from '$lib/state/boards/collection';
    import type { Project } from '$lib/state/boards/structure/lines';

    type Props = {
        /** The collection key the edit form writes by. */
        collection: string;
        id: string;
        cursor: boolean;
        title: string;
        /** A hue name from state/shared/words/tones.ts, or none for a card without a bar. */
        tone?: string;
        projects: Project[];
        /** The file's entry for this line, or null for a line the file does not hold. */
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        editing: boolean;
        onedit: () => void;
        onsaid: (said: string) => void;
        /** What the line says about itself, drawn above the cross-links. */
        children: Snippet;
    };

    let {
        collection,
        id,
        cursor,
        title,
        tone,
        projects,
        entry,
        schema,
        editing,
        onedit,
        onsaid,
        children
    }: Props = $props();

    /** The edit form is for a line the file holds, drawn while the card is hovered or focused. */
    const actions = $derived(
        entry !== null && schema !== undefined ? [editAction(editing, onedit)] : []
    );
</script>

<Card {id} {cursor} {title} titleHtml={inlineMarkdown(title)} {tone}>
    {#snippet meta()}
        <Tag label={projectCount(projects.length)} />
        {#if actions.length > 0}
            <CardActions {actions} />
        {/if}
    {/snippet}
    {@render children()}
    <CrossLinks {projects} />
    {#if editing && entry !== null}
        <EntryForm {collection} {schema} {entry} onclose={onedit} {onsaid} />
    {/if}
</Card>
