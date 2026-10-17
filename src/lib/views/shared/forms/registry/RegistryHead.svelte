<script lang="ts">
    // Layer 3, view partial under views/shared/. The head a registry-line view draws above its
    // cards: the hub's own intro, the view's intro and the line the last write or open said. The
    // hub's intro is the `intro:` of the view's data file, a hub value, so it is drawn through the
    // sanitiser, with its `$...$` math drawn as the cards draw theirs. The control that adds an
    // entry is the view's header icon (AddButton.svelte), which opens the Add box this draws.
    //
    // The Pillars, Domains, Data and Venues views draw it the same way, so it lives here once. What
    // was last said belongs to the view's registry file (registry-file.svelte.ts), which a card of
    // the view also writes.

    import type { Snippet } from 'svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import Intro from '$lib/views/shared/prose/Intro.svelte';
    import AddAsk from '../entry/AddAsk.svelte';
    import type { RegistryFile } from './registry-file.svelte';

    type Props = {
        /**
         * The view's own intro. The view draws it, so its words are the view's own catalog line,
         * which a trusted Intro may carry.
         */
        intro: Snippet;
        /** The view's registry file: the line the last write or open said, and the Add box. */
        file: RegistryFile;
        /** Whether the said line keeps the gap above it that the Pillars view's notes carry. */
        spaced?: boolean;
    };

    let { intro, file, spaced = false }: Props = $props();

    const cardMath = createCardMath();
</script>

{#if file.collection?.intro}
    <Intro html={inlineMarkdown(file.collection.intro, cardMath(file.collection.intro))} />
{/if}
{@render intro()}
{#if file.said !== ''}
    <p class="said" class:spaced>{file.said}</p>
{/if}
{#if file.asking !== null}
    <AddAsk ask={file.asking} onclose={file.closeAsk} />
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
