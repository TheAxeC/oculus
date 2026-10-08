<script lang="ts">
    // Layer 3, view partial under views/shared/. The head a registry-line view draws above its
    // cards: the view's intro and the line the last write or open said. The control that adds an
    // entry is the view's header icon (AddButton.svelte), which opens the view's file.
    //
    // The Pillars, Domains, Data and Venues views draw it the same way, so it lives here once. What
    // was last said belongs to the view, which a card of it also writes, so the view binds the
    // line.

    import type { Snippet } from 'svelte';

    type Props = {
        /**
         * The view's own intro. The view draws it, so its words are the view's own catalog line,
         * which a trusted Intro may carry.
         */
        intro: Snippet;
        /** The line the last write or open said, empty for none. */
        said?: string;
        /** Whether the said line keeps the gap above it that the Pillars view's notes carry. */
        spaced?: boolean;
    };

    let { intro, said = '', spaced = false }: Props = $props();
</script>

{@render intro()}
{#if said !== ''}
    <p class="said" class:spaced>{said}</p>
{/if}

<style>
    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .said.spaced {
        margin: 6px 0 0;
    }
</style>
