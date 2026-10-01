<script lang="ts">
    // Layer 3, primitive. The box a view fills: a header row with the view's title and its
    // actions, a bar under it for the view's other controls, and a body that scrolls. A view
    // renders this at its root, so the shell's pane box is filled edge to edge and the scrolling
    // happens inside the view rather than around it.
    //
    // The header is VS Code's pane header: 22 px, one line, the title cut with an
    // ellipsis, and the actions in 20 px boxes that are always drawn. It holds icon actions only,
    // in a Toolbar that asks for `overflow`; a search box, a select, a segment, a toggle, a chip
    // and a text button go in the bar, which wraps and does not scroll with the body.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The view's own words, already translated. */
        title: string;
        /** The icon actions at the right of the header, a Toolbar that asks for `overflow`. */
        toolbar?: Snippet;
        /** The strip under the header for the view's other controls, usually a Toolbar. */
        bar?: Snippet;
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

    let { title, toolbar, bar, tinted = false, children }: Props = $props();
</script>

<section class="pane" class:tinted>
    <header>
        <h2 class="title">{title}</h2>
        {#if toolbar}
            <div class="tools">{@render toolbar()}</div>
        {/if}
    </header>
    {#if bar}
        <div class="viewbar">{@render bar()}</div>
    {/if}
    <div class="body" data-scroll>
        {#if children}
            {@render children()}
        {/if}
    </div>
</section>

<style>
    /* The words a view draws without a size of their own are VS Code's body text, 13px. */
    .pane {
        font-size: var(--fs-md);
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

    /* One line of `calc(22px * scale)`, whatever the title and the actions are, as VS Code's pane
       header is. The actions' boxes are `--header-action`, which the bare buttons in it read as
       `--bare-box`. */
    header {
        --bare-box: var(--header-action);
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        box-sizing: border-box;
        height: calc(22px * var(--text-scale, 1));
        padding: 0 8px 0 12px;
        border-bottom: 1px solid var(--line);
    }

    /* VS Code's pane title: 11px, weight 700, uppercase, cut with an ellipsis
       when the actions leave it no room, and never narrower than three characters. */
    .title {
        flex: 1 1 auto;
        min-width: 3ch;
        margin: 0;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* The actions keep their room up to everything but the title's three characters; the Toolbar
       inside measures against this width. */
    .tools {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        min-width: 0;
        max-width: calc(100% - 3ch - 8px);
        margin-left: auto;
    }

    /* The strip for the view's controls: 6px above and below, VS Code's view bar padding, wrapping.
       It draws nothing when the view's snippet draws nothing. */
    .viewbar {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-bottom: 1px solid var(--line);
    }

    .viewbar:empty {
        display: none;
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
