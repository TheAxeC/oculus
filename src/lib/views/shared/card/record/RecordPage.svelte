<script lang="ts">
    // Layer 3, shared view. The frame every record's page is drawn in, a project, an entry, a
    // person, the career file, a project set and a LinkedIn post, so they read as one: the Pane
    // with no tint, one column at a gap of 12 px, the outcome line of the last write on a
    // `Surface`, in the danger colour for a view that says so (`saidError`), the record's card,
    // then, for a record whose page counts its projects (`row`), the row of count buttons
    // (RecordCounts.svelte), then the page's blocks. A project's, a person's and an entry's page
    // hand the row and draw each block under its small label (RecordField.svelte); a record with no
    // project and no project waiting on it draws no row. A lead's and a Lit Watch paper's page,
    // the career file, a project set and a LinkedIn post hand no row, and draw their sections as
    // they choose. With no tint under it, a block a view draws outside a card sits on a `Surface`
    // of its own.
    //
    // A board opens a page as the preview tab of the pane beside it, which the next record opened
    // takes over. Typing anywhere in the tab keeps the tab, so a half-typed form is never replaced.
    //
    // The view hands the column its own data attributes, so the frame names no kind of record.

    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import RecordCounts from './RecordCounts.svelte';
    import type { RecordRow } from '$lib/state/boards/record-board';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children' | 'title'> & {
        title: string;
        /** The instance the page is drawn in, whose preview tab a keystroke keeps. */
        instance: ViewProps['instance'];
        toolbar?: Snippet;
        /** The page's outcome line, drawn over the card; the empty text for none. */
        said?: string;
        /** Whether `said` reports a failure. */
        saidError?: boolean;
        /** The record's card, or the line that stands in for it. */
        card?: Snippet;
        /** The record's row of count buttons, drawn under the card; none draws no row. */
        row?: RecordRow;
        /** The page's blocks. */
        children?: Snippet;
    };

    let {
        title,
        instance,
        toolbar,
        said = '',
        saidError = false,
        card,
        row,
        children,
        ...attributes
    }: Props = $props();

    const {
        layout: { keepPreview }
    } = useState();

    /** Keep the tab when the reader types in it, while it is a preview tab. */
    function typed(): void {
        if (instance.preview === true) keepPreview(instance.id);
    }
</script>

<Pane {title} {toolbar}>
    <div {...attributes} class="page" data-instance={instance.id} oninput={typed}>
        {#if said !== ''}
            <Surface>
                <p class="said" class:error={saidError}>{said}</p>
            </Surface>
        {/if}
        {@render card?.()}
        {#if row !== undefined && (row.total > 0 || row.waiting > 0)}
            <Surface>
                <RecordCounts {row} />
            </Surface>
        {/if}
        {@render children?.()}
    </div>
</Pane>

<style>
    .page {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .said {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .said.error {
        color: var(--danger);
    }

    /* The terminal shape: the whole tab follows the card's folder name, as the board does. */
    :global(body.rice:where(:not(.rice-sans))) .page {
        font-family: var(--font-mono);
    }
</style>
