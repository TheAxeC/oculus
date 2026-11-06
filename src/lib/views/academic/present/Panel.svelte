<script lang="ts">
    // Layer 3, Present partial. One visual of a project slide: a figure the deck's folder holds, or
    // the inline diagram markup the slide wrote, with the caption and the explanation under it.
    //
    // A figure is drawn in the slide's room at the box the slide's layout gives it
    // (screen/slide-layout.ts), its image whole at its own proportions inside the box's padding and
    // border, the caption and the explanation under it in the box's column. Its image names its
    // index on the slide (`data-figure`), by which the slide reads its ratio once it has loaded and
    // gives it its box; until then the figure is not drawn. The slide's layout reads the image's
    // padding and border and the panel's bottom margin, the gap between two figures, from the
    // drawn figure. A figure the folder does not hold, and one whose image fails to load, is drawn
    // as its name in its place, the same name the finding gives the reader who wrote the slide;
    // that name, like a diagram, is drawn with the slide's text.
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
    import type { Box } from './screen/slide-layout';

    type Props = {
        panel: PresentPanel;
        /** The panel's index on the slide, which names its figure to the slide's layout. */
        index: number;
        /** Whether the figure's image failed to load, so its name is drawn in its place. */
        failed?: boolean;
        /** The figure's box in the slide's room; none while its image has not loaded. */
        box?: Box;
    };

    let { panel, index, failed = false, box }: Props = $props();

    /** The address the deck's route gave the figure, absent for one the deck's folder lacks. */
    const src = $derived(panel.missing === true || failed ? '' : (panel.src ?? ''));
    const diagram = $derived(
        panel.diagramHtml === undefined ? '' : sanitiseDiagram(panel.diagramHtml)
    );
</script>

{#snippet notes()}
    {#if panel.caption !== undefined}
        <div class="cap"><Words text={panel.caption} /></div>
    {/if}
    {#if panel.explain !== undefined}
        <div class="explain"><Words text={panel.explain} /></div>
    {/if}
{/snippet}

{#if src !== ''}
    <div
        class="panel placed"
        class:waiting={box === undefined}
        data-figure-box={index}
        style:left={box === undefined ? undefined : `${box.x}px`}
        style:top={box === undefined ? undefined : `${box.y}px`}
        style:width={box === undefined ? undefined : `${box.width}px`}
    >
        <img
            class="fig"
            data-figure={index}
            {src}
            alt={t('present.figure_alt')}
            style:height={box === undefined ? undefined : `${box.height}px`}
        />
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render notes()}
    </div>
{:else}
    <div class="panel">
        {#if panel.figure !== undefined}
            <p class="gap">{t('present.figure_missing', panel.figure)}</p>
        {:else if diagram !== ''}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- the slide's own markup, cut down by the diagram profile of the app's one sanitiser -->
            <div class="diagram">{@html diagram}</div>
        {/if}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render notes()}
    </div>
{/if}

<style>
    .panel {
        margin-bottom: 14px;
    }

    /* A figure stands at its box in the slide's room (parts/project/Project.svelte). It keeps the
       panel's bottom margin, which moves nothing at its place and which the slide's layout reads
       as the gap between two figures. */
    .placed {
        position: absolute;
    }

    /* A figure whose image has not loaded takes no room; its image loads all the same. */
    .waiting {
        display: none;
    }

    .fig {
        display: block;
        box-sizing: border-box;
        width: 100%;
        object-fit: contain;
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

    /* Inside the slide's frame (screen/Stage.svelte), the one translucent layer over a wallpaper,
       the figure, the diagram, its nodes and bar, and the explanation paint nothing. */
    :global(body.wall [data-surface]) .fig,
    :global(body.wall [data-surface]) .diagram,
    :global(body.wall [data-surface]) .diagram :global(.dnode),
    :global(body.wall [data-surface]) .diagram :global(.dbar),
    :global(body.wall [data-surface]) .explain {
        background: transparent;
        backdrop-filter: none;
    }
</style>
