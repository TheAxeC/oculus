<script lang="ts">
    // Layer 3, primitive. The box a view fills: a header row with the view's title and its
    // controls, and a body that scrolls. A view renders this at its root, so the shell's pane box
    // is filled edge to edge and the scrolling happens inside the view rather than around it.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The view's own words, already translated. */
        title: string;
        /** The controls at the right of the header, usually a Toolbar. */
        toolbar?: Snippet;
        /**
         * Whether the box itself carries the translucent surface over a wallpaper. A view whose
         * content draws its text straight into the box asks for it, so the text is read off a
         * surface rather than off the picture; a view that draws cards or frames of its own leaves
         * it off, so its surfaces stay the one layer over the picture.
         */
        tinted?: boolean;
        /** The body. */
        children?: Snippet;
    };

    let { title, toolbar, tinted = false, children }: Props = $props();
</script>

<section class="pane" class:tinted>
    <header>
        <h2 class="title">{title}</h2>
        {#if toolbar}
            <div class="tools">{@render toolbar()}</div>
        {/if}
    </header>
    <div class="body" data-scroll>
        {#if children}
            {@render children()}
        {/if}
    </div>
</section>

<style>
    .pane {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        background: var(--panel);
    }

    /* Over a wallpaper the box paints nothing, as the shell's pane around it does: a card, a lane,
       a frame or a form inside it is then the one translucent layer over the picture, and content
       the box holds directly sits on the picture itself. */
    :global(body.wall) .pane {
        background: transparent;
    }

    /* A box a view asked to tint keeps the wallpaper fraction of its own colour, so the text the
       view draws straight into it is read off a surface instead of off the picture. */
    :global(body.wall) .pane.tinted {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* Inside a tinted box the terminal palettes' header strip would be a second translucent layer
       over the first, which reads as one nearly solid one, so the strip paints nothing there. */
    :global(body.rice.wall) .pane.tinted header {
        background: transparent;
        backdrop-filter: none;
    }

    header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        padding: 6px 12px;
        border-bottom: 1px solid var(--line);
    }

    .title {
        margin: 0;
        font-size: var(--fs-sm);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tools {
        margin-left: auto;
        display: flex;
        align-items: center;
        min-width: 0;
    }

    /* The one thing that scrolls: min-height zero is what lets it, inside a column flex box. */
    .body {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: auto;
        padding: 10px 12px;
        box-sizing: border-box;
    }

    /* The terminal shape: the header row is a titlebar strip on the chip colour. */
    :global(body.rice) header {
        background: var(--chip);
    }

    /* The titlebar strip keeps the same fraction of the chip colour as the box keeps of its own. */
    :global(body.rice.wall) header {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.rice) .title {
        text-transform: none;
        letter-spacing: 0.06em;
    }
</style>
