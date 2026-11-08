<script lang="ts">
    // Layer 3, Present partial. One visual of a project slide: a figure the deck's folder holds, or
    // the inline diagram markup the slide wrote, with the caption and the explanation under it.
    //
    // A figure is drawn in the slide's room at the box the slide's layout gives it, in container
    // units of the frame (screen/slide-layout.ts), its image whole at its own proportions inside
    // the box's padding, the caption and the explanation under it in the box's column. Every size
    // here is a fraction of the frame's width (`cqw`), as every size inside a slide is
    // (themes/slide.css), and a hairline is a shadow or an outline one pixel wide, which takes no
    // room. Its image names its index on the slide (`data-figure`), by which the slide reads its
    // ratio once it has loaded and gives it its box; until then the figure is not drawn. The
    // slide's layout reads the image's padding and the panel's bottom margin, the gap between two
    // figures, from the drawn figure. A figure the folder does not hold, and one whose image fails
    // to load, is drawn as its name in its place, the same name the finding gives the reader who
    // wrote the slide; that name, like a diagram, is drawn with the slide's text.
    //
    // A diagram is a grid of labelled boxes, and a slide writes its columns and its per-box colour
    // on the elements themselves, so it goes through the diagram profile of ui/html/html.ts, which
    // is the ordinary profile plus `style`. The classes the deck's diagrams are written with are
    // laid out below, so a diagram is drawn in the app's own surfaces and type rather than in the
    // deck's.

    import { sanitiseDiagram } from '$lib/ui/html/html';
    import { t } from '$lib/state/shared/words/text';
    import Words from './parts/Words.svelte';
    import type { PresentPanel } from '$lib/state/life/present';
    import { cqw, type Box } from './screen/slide-layout';

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
        style:left={box === undefined ? undefined : cqw(box.x)}
        style:top={box === undefined ? undefined : cqw(box.y)}
        style:width={box === undefined ? undefined : cqw(box.width)}
    >
        <img
            class="fig"
            data-figure={index}
            {src}
            alt={t('present.figure_alt')}
            style:height={box === undefined ? undefined : cqw(box.height)}
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
        margin-bottom: 1.09375cqw;
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
        padding: 0.46875cqw;
        box-shadow: inset 0 0 0 1px var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    .gap {
        margin: 0;
        padding: 0.703125cqw 0.859375cqw;
        outline: 1px dashed var(--line);
        outline-offset: -1px;
        border-radius: var(--radius-sm);
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }

    .diagram {
        overflow-x: auto;
        padding: 1.25cqw;
        box-shadow: inset 0 0 0 1px var(--line);
        border-radius: var(--radius);
        background: var(--card);
    }

    .cap {
        margin-top: 0.546875cqw;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        font-style: italic;
        line-height: 1.4;
    }

    .explain {
        margin-top: 0.46875cqw;
        padding: 0.703125cqw 0.859375cqw;
        box-shadow: inset 0 0 0 1px var(--line);
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
        gap: 0.703125cqw;
    }

    .diagram :global(.dnode) {
        padding: 0.859375cqw 0.546875cqw;
        box-shadow: inset 0 0 0 0.15625cqw var(--line);
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
        margin: 0.859375cqw 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        font-weight: 600;
        text-align: center;
    }

    .diagram :global(.dbar) {
        padding: 0.859375cqw;
        outline: 1px dashed var(--line);
        outline-offset: -1px;
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
