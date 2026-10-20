<script lang="ts">
    // Layer 3, primitive. The surface a part of a view outside its cards is read off over a
    // wallpaper: an intro, a status line, a heading, an empty message, a row of figures. Without a
    // wallpaper it is no box at all (`display: contents`): the content is laid out as the parent's
    // own item, though the element is still in the tree, so a parent's rule written with a child
    // combinator reaches this element and not the part. Such a rule names both, the box over a
    // wallpaper and the part without one:
    //
    //     .list > :global(*),
    //     .list > :global([data-surface]) > :global(*) { min-width: 0; }
    //
    // Over a picture (`body.wall`) it is a box around its content, an item that may shrink below
    // its content's width (`min-width: 0`), and it paints the panel at the wallpaper's opacity
    // (`--panel-on-wall`) with the wallpaper's blur, a card's corner radius and no border. A part
    // whose own flex or grid placement matters sits in a box of its own around the Surface, which
    // is the parent's item in both cases (shell/panes/strip/StripSaid.svelte).
    //
    // The paint is a layer behind the content. A block surface's layer lies inside its column: it
    // reaches 4 px above and below the box and not past its sides, and the box pads its content
    // 8 px on each side, so the words keep a margin of surface and the layer's edges line up with
    // the cards, lanes and fitted boxes beside it. Over a wallpaper the content of a block surface
    // therefore sits 8 px further in than without one; the margins of what it holds fall outside
    // it in a flow of blocks, as they do without one. The layer is absolutely placed, so the box is
    // the containing block and the stacking context of what it holds while a wallpaper is on.
    //
    // One translucent layer over the picture and never two: an element that paints that one layer
    // carries `data-surface` (a tinted pane, a card, a lane, a free float, this), and a Surface
    // inside one of them is again no box and paints nothing. A view wraps such a part in this, so
    // the colour of the surface is written here once.
    //
    // A block surface fills the line it is on. An `inline` one is a span for a heading inside a
    // flex row (a `summary`), which hugs its words and lays them out with the row's own gap. A
    // `fitted` one paints exactly under its content, for content that draws a border and a padding
    // of its own.

    import type { Snippet } from 'svelte';

    type Props = {
        /** Draw a span that hugs its content, for a part inside phrasing content or a flex row. */
        inline?: boolean;
        /** Paint exactly under the content's box, which has a border and a padding of its own. */
        fitted?: boolean;
        /** The part read off the surface. */
        children?: Snippet;
    };

    let { inline = false, fitted = false, children }: Props = $props();
</script>

<svelte:element
    this={inline ? 'span' : 'div'}
    class="surface"
    class:inline
    class:fitted
    data-surface
>
    {#if children}
        {@render children()}
    {/if}
</svelte:element>

<style>
    .surface {
        display: contents;
    }

    :global(body.wall) .surface {
        position: relative;
        isolation: isolate;
        display: block;
        min-width: 0;
    }

    /* A block surface pads its words inside its column, where its layer lies. */
    :global(body.wall) .surface:not(.inline, .fitted) {
        padding: 0 8px;
    }

    :global(body.wall) .surface.inline {
        display: inline-flex;
        align-items: center;
        gap: inherit;
    }

    :global(body.wall) .surface::before {
        content: '';
        position: absolute;
        inset: -4px 0;
        z-index: -1;
        border-radius: var(--input-radius);
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
        pointer-events: none;
    }

    :global(body.wall) .surface.inline::before {
        inset: -1px -6px;
    }

    :global(body.wall) .surface.fitted::before {
        inset: 0;
    }

    /* Inside a surface it is the plain wrapper it is without a wallpaper. */
    :global(body.wall [data-surface]) .surface {
        display: contents;
    }

    :global(body.wall [data-surface]) .surface::before {
        content: none;
    }
</style>
