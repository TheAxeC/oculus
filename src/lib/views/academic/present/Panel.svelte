<script lang="ts">
    // Layer 3, Present partial. One visual of a project slide: a figure the deck's folder holds, or
    // the inline diagram markup the slide wrote, with the caption and the explanation under it.
    //
    // A figure the folder does not hold is named in its place rather than left as a dead image, and
    // the reader who wrote the slide gets the same name as the finding does.
    //
    // A diagram is a grid of labelled boxes, and a slide writes its columns and its per-box colour
    // on the elements themselves, so it goes through the diagram profile of ui/html.ts, which is
    // the ordinary profile plus `style`. The classes the deck's diagrams are written with are laid
    // out below, so a diagram is drawn in the app's own surfaces and type rather than in the
    // deck's.

    import { sanitiseDiagram } from '$lib/ui/html';
    import { t } from '$lib/state/shared/words/text';
    import Words from './parts/Words.svelte';
    import type { PresentPanel } from '$lib/state/life/present';

    type Props = { panel: PresentPanel };

    let { panel }: Props = $props();

    /** The address the deck's route gave the figure, absent for one the deck's folder lacks. */
    const src = $derived(panel.missing === true ? '' : (panel.src ?? ''));
    const diagram = $derived(
        panel.diagramHtml === undefined ? '' : sanitiseDiagram(panel.diagramHtml)
    );
</script>

<div class="panel">
    {#if src !== ''}
        <img class="fig" {src} alt={t('present.figure_alt')} />
    {:else if panel.figure !== undefined}
        <p class="gap">{t('present.figure_missing', panel.figure)}</p>
    {:else if diagram !== ''}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- the slide's own markup, cut down by the diagram profile of the app's one sanitiser -->
        <div class="diagram">{@html diagram}</div>
    {/if}
    {#if panel.caption !== undefined}
        <div class="cap"><Words text={panel.caption} /></div>
    {/if}
    {#if panel.explain !== undefined}
        <div class="explain"><Words text={panel.explain} /></div>
    {/if}
</div>

<style>
    .panel {
        margin-bottom: 14px;
    }

    .fig {
        width: 100%;
        padding: 6px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    .gap {
        margin: 0;
        padding: 9px 11px;
        border: 1px dashed var(--line);
        border-radius: var(--radius-sm);
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }

    .diagram {
        overflow-x: auto;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    .cap {
        margin-top: 7px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        font-style: italic;
        line-height: 1.4;
    }

    .explain {
        margin-top: 6px;
        padding: 9px 11px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--card);
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        line-height: 1.5;
    }

    /* The four classes a deck diagram is written with: a grid of nodes, an arrow line between two
       rows of them, and a bar across the foot. A node's own `grid-template-columns` and border
       colour ride on the element, which is why the diagram keeps its `style`. */
    .diagram :global(.dgrid) {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 9px;
    }

    .diagram :global(.dnode) {
        padding: 11px 7px;
        border: 2px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--card);
        font-size: var(--slide-fs-small);
        font-weight: 700;
        text-align: center;
    }

    .diagram :global(.dnode small) {
        color: var(--muted-txt, var(--muted));
        font-weight: 500;
    }

    .diagram :global(.darrow) {
        margin: 11px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        font-weight: 600;
        text-align: center;
    }

    .diagram :global(.dbar) {
        padding: 11px;
        border: 1px dashed var(--line);
        border-radius: var(--radius-sm);
        background: var(--card);
        font-size: var(--slide-fs-small);
        font-weight: 600;
        text-align: center;
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .fig {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .diagram {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .diagram :global(.dnode) {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .diagram :global(.dbar) {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .explain {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
