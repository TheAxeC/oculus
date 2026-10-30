<script lang="ts">
    // Layer 3, shared view. The frame every record's page is drawn in, a project, an entry, a
    // person, the career file, a project set and a LinkedIn post, so they read as one: the Pane
    // with no tint, one column at a gap of 12 px, the outcome line of the last write on a
    // `Surface`, in the danger colour for a view that says so (`saidError`), the record's card,
    // then the page's sections, each the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), folded through views/shared/card/pane-fold.ts by the
    // view that draws it. With no tint under it, a section a view draws outside a card sits on a
    // `Surface` of its own.
    //
    // A board opens a page as the preview tab of the pane beside it, which the next record opened
    // takes over. Typing anywhere in the tab keeps the tab, so a half-typed form is never replaced.
    //
    // The view hands the column its own data attributes, so the frame names no kind of record.

    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
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
        /** The page's sections. */
        children?: Snippet;
    };

    let {
        title,
        instance,
        toolbar,
        said = '',
        saidError = false,
        card,
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
