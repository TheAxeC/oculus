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
    import { recordActions } from '$lib/views/shared/forms/entry/entry-actions';
    import { blockedBy } from '$lib/views/shared/forms/entry-file';
    import { projectCount } from '$lib/views/shared/card/card';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import type { Entry, IdentityFault, SchemaField } from '$lib/state/boards/collection';
    import { pageView } from '$lib/state/forms/page-entry';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { useState } from '$lib/state/client/use';
    import type { Project } from '$lib/state/boards/structure/lines';

    const client = useState();
    const {
        layout: { openView },
        source: { unsavedFile }
    } = client;

    type Props = {
        id: string;
        /** The registry's collection key: `pillars` or `domains`. */
        collection: string;
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

    /** True while the question before a delete is open. */
    let deleting = $state(false);

    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    /** Edit in File and Delete are for a line the file holds, drawn while the card is hovered. */
    const actions = $derived(
        recordActions(
            { client, file, entry, schema, fault, onsaid },
            blocked,
            () => (deleting = true)
        )
    );

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
        {#if actions.length > 0}
            <CardActions {actions} />
        {/if}
    {/snippet}
    {@render children()}
    <CrossLinks {projects} />
</Card>

{#if deleting && entry !== null}
    <DeleteAsk {collection} id={entry.id} {onsaid} onclose={() => (deleting = false)} />
{/if}
