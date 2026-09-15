<script lang="ts">
    // Layer 3, Present partial. One row of the deck drawn as the slide it is. It is the one place
    // that knows which component each kind is, so the pane and the overview both draw a slide by
    // handing this the row and nothing else.

    import Closing from './Closing.svelte';
    import Framing from './Framing.svelte';
    import Ideas from './Ideas.svelte';
    import Project from './Project.svelte';
    import Summary from './Summary.svelte';
    import Title from './Title.svelte';
    import { framingOf, summaryOf, tagToneOf, themeOf } from '$lib/state/present';
    import { useState } from '$lib/state/use';
    import type { DeckSlide } from '$lib/state/present';

    const {
        present: { deck, projectOf, slideOf }
    } = useState();

    type Props = { row: DeckSlide };

    let { row }: Props = $props();

    const held = $derived(deck());
    const project = $derived(projectOf(row.key));
    const slide = $derived(slideOf(row.key));
</script>

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
    <Project {slide} {project} theme={themeOf(held, project)} tagTone={tagToneOf(held, slide)} />
{/if}
