<script lang="ts">
    // Layer 3, Present partial. One row of the deck drawn as the slide it is. It is the one place
    // that knows which component each kind is, so the pane draws a slide by handing this the row
    // and nothing else. The slide sits in a reading column of at most `--slide-reading` (the
    // frame's width less its padding, set by Present.svelte), centred in the frame, and a part
    // that centres its content takes the column's height.

    import Closing from './parts/Closing.svelte';
    import Framing from './parts/Framing.svelte';
    import Ideas from './parts/Ideas.svelte';
    import Project from './parts/Project.svelte';
    import Summary from './parts/Summary.svelte';
    import Title from './parts/Title.svelte';
    import { framingOf, summaryOf, tagToneOf, themeOf } from '$lib/state/life/present';
    import { useState } from '$lib/state/client/use';
    import type { DeckSlide } from '$lib/state/life/present';

    const {
        present: { deck, projectOf, slideOf }
    } = useState();

    type Props = { row: DeckSlide };

    let { row }: Props = $props();

    const held = $derived(deck());
    const project = $derived(projectOf(row.key));
    const slide = $derived(slideOf(row.key));
</script>

<div class="reading">
    {#if row.kind === 'title'}
        <Title meta={held.meta} />
    {:else if row.kind === 'closing'}
        <Closing meta={held.meta} />
    {:else if row.kind === 'ideas'}
        {#if held.ideas !== null}
            <Ideas ideas={held.ideas} />
        {/if}
    {:else if row.kind === 'framing'}
        {@const framing = framingOf(held, row.ref)}
        {#if framing !== undefined}
            <Framing {framing} />
        {/if}
    {:else if row.kind === 'summary'}
        {@const summary = summaryOf(held, row.ref)}
        {#if summary !== undefined}
            <Summary {summary} />
        {/if}
    {:else if slide !== null && project !== null}
        <Project
            {slide}
            {project}
            theme={themeOf(held, project)}
            tagTone={tagToneOf(held, slide)}
        />
    {/if}
</div>

<style>
    .reading {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: var(--slide-reading);
        min-height: 100%;
        margin-inline: auto;
    }
</style>
