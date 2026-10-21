<script lang="ts">
    // Layer 3, primitive. The box a view fills: a header row with the view's title and its
    // actions, a bar under it for the view's other controls, and a body that scrolls. A view
    // renders this at its root, so the shell's pane box is filled edge to edge and the scrolling
    // happens inside the view rather than around it.
    //
    // The header is VS Code's pane header: 22 px, one line, the title cut with an ellipsis, and the
    // actions in 20 px boxes that are always drawn. A view whose title is its file's path, which
    // the pane's breadcrumb draws, asks for `titled: false` and has no title row at all, or only
    // its actions. It holds icon actions only, in a Toolbar that asks for `overflow`, which
    // measures its controls against the empty `[data-toolbar-room]` box the header lays out beside
    // them; a search box, a select, a segment, a toggle, a chip and a text button go in the bar,
    // which wraps, does not scroll with the body and scrolls on its own past half the box.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The view's own words, already translated. */
        title: string;
        /** Whether the header draws the title; a view that has none still draws its actions. */
        titled?: boolean;
        /**
         * Whether the title is drawn at `--fs-md`, a step above the sidebar's `--fs-sm`, for a view
         * whose text is drawn at `--fs-sm` and whose headings a step above it (the Session view).
         */
        large?: boolean;
        /** The icon actions at the right of the header, a Toolbar that asks for `overflow`. */
        toolbar?: Snippet;
        /** The strip under the header for the view's other controls, usually a Toolbar. */
        bar?: Snippet;
        /**
         * Whether the box itself carries the translucent surface over a wallpaper. A view whose
         * content is rows or prose drawn straight into the box asks for it, so the text is read off
         * a surface rather than off the picture; a view that draws cards or a frame of its own
         * leaves it off, so its surfaces stay the one layer over the picture, and wraps what it
         * draws outside them in `Surface`.
         */
        tinted?: boolean;
        /**
         * Whose share of the panel a tinted box keeps over a wallpaper: the pane's
         * (`wallpaper.panel_opacity`) when left out, the editor's (`editor.opacity`) for a view
         * that is an editor, the terminal's (`terminal.opacity`) for the Terminal view.
         */
        share?: 'editor' | 'terminal';
        /**
         * Whether the body is drawn without its inset, so a view that fills it with an editor or a
         * terminal reaches the pane's edges, as VS Code's editors and terminals do.
         */
        flush?: boolean;
        /** The body. */
        children?: Snippet;
    };

    let {
        title,
        titled = true,
        large = false,
        toolbar,
        bar,
        tinted = false,
        share,
        flush = false,
        children
    }: Props = $props();
</script>

<section
    class="pane"
    class:tinted
    data-surface={tinted ? '' : undefined}
    style:--panel-on-wall={share === undefined ? undefined : `var(--${share}-on-wall)`}
>
    {#if titled || toolbar}
        <header>
            {#if titled}
                <h2 class="title" class:large>{title}</h2>
            {/if}
            {#if toolbar}
                <div class="tools">
                    <span class="room" data-toolbar-room aria-hidden="true"></span>
                    {@render toolbar()}
                </div>
            {/if}
        </header>
    {/if}
    {#if bar}
        <div class="viewbar">{@render bar()}</div>
    {/if}
    <div class="body" class:flush data-scroll>
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
       a frame or a `Surface` inside it is then the one translucent layer over the picture. */
    :global(body.wall) .pane {
        background: transparent;
    }

    /* A box a view asked to tint keeps the wallpaper fraction of its own colour, so the text the
       view draws straight into it is read off a surface instead of off the picture. It carries
       `data-surface`, so what it holds that paints a surface paints nothing in turn. Drawn inside
       a surface already (a free float's fill), it paints nothing itself. */
    :global(body.wall) .pane.tinted {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .pane.tinted {
        background: transparent;
        backdrop-filter: none;
    }

    /* The header and the bar of a box that is not tinted would leave the title and the bar's words
       on the picture, so over a wallpaper each is read off a surface of its own. Inside a tinted
       box, or a box inside a surface, either would be a second translucent layer over the first,
       which reads as one nearly solid one, so there they paint nothing, the terminal palettes'
       header strip included. */
    :global(body.wall) header,
    :global(body.wall) .viewbar {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) header,
    :global(body.wall [data-surface]) .viewbar,
    :global(body.rice.wall [data-surface]) header {
        background: transparent;
        backdrop-filter: none;
    }

    /* One line of `calc(22px * scale)`, whatever the title and the actions are, as VS Code's pane
       header is. The actions' boxes are `--header-action`, which the bare buttons in it read as
       `--bare-box`. The header is the box the room of the actions is measured in. */
    header {
        --bare-box: var(--header-action);
        --header-start: 12px;
        --header-end: 8px;
        --header-gap: 8px;
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--header-gap);
        flex: 0 0 auto;
        box-sizing: border-box;
        height: calc(22px * var(--text-scale, 1));
        padding: 0 var(--header-end) 0 var(--header-start);
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

    .title.large {
        font-size: var(--fs-md);
    }

    /* The actions keep their room up to everything but the title's three characters and the gap
       after them. */
    .tools {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        min-width: 0;
        max-width: calc(100% - 3ch - var(--header-gap));
        margin-left: auto;
    }

    /* The room of the actions: an empty box laid out from the header's edges, as wide as `.tools`
       may grow. The Toolbar measures its controls against this width, which depends on the header
       alone, so drawing or removing the toolbar's `more` button cannot change it. Its `ch` is the
       one `.tools` reads, since both inherit the header's font. */
    .room {
        position: absolute;
        top: 0;
        left: calc(var(--header-start) + 3ch + var(--header-gap));
        right: var(--header-end);
        height: 0;
        visibility: hidden;
        pointer-events: none;
    }

    /* The strip for the view's controls: 6px above and below, VS Code's view bar padding, wrapping.
       It draws nothing when the view's snippet draws nothing. It takes at most half the box and
       scrolls past that, so a bar of many filters never leaves the body too little room to scroll
       to its last entry. */
    .viewbar {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        max-height: 50%;
        overflow-y: auto;
        box-sizing: border-box;
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

    .body.flush {
        padding: 0;
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
