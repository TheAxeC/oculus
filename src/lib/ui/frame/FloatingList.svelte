<script lang="ts">
    // Layer 3, primitive. The box a list of choices floats in while it is open, over the page:
    // a menu's list (ui/menu/MenuList.svelte) and the icon dropdown's list
    // (ui/forms/choice/GlyphList.svelte). bits-ui places it and hands it its attributes as `list`;
    // this paints it and the look every item in it shares, so the two lists look alike under every
    // theme. What an item holds, and how it answers the pointer and the keys, is its list's own.
    //
    // `shape` says how tall it may grow: a menu as tall as the room bits-ui measured, a menu of
    // headed groups no taller than most of the window, and a field's list at least as wide as its
    // field, holding a viewport of its own that scrolls while the box keeps its padding.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The list's accessible name. */
        label: string;
        /** The attributes bits-ui's content gives the box that holds the choices. */
        list?: Record<string, unknown>;
        shape?: 'menu' | 'grouped' | 'field';
        children: Snippet;
    };

    let { label, list = {}, shape = 'menu', children }: Props = $props();
</script>

<div
    {...list}
    class="list"
    class:grouped={shape === 'grouped'}
    class:field={shape === 'field'}
    aria-label={label}
>
    {@render children()}
</div>

<style>
    /* The box bits-ui places: over every overlay a tooltip is under, never taller than the room
       bits-ui measured for it, and scrolling past that. */
    .list {
        z-index: 70;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        min-width: 160px;
        max-height: var(--bits-floating-available-height, none);
        overflow-y: auto;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
        outline: none;
    }

    /* A list floats over a pane, so at the pane's own opacity it would be read through two
       translucent layers and the picture. It keeps more of its colour than the pane does. */
    :global(body.wall) .list {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* A list of several headed groups can be longer than the pane under it, so it scrolls. */
    .list.grouped {
        max-height: min(60vh, 520px, var(--bits-floating-available-height, 520px));
    }

    /* A field's list is at least as wide as its field and no taller than most of the window; the
       viewport inside it scrolls, so the box itself does not. */
    .list.field {
        min-width: var(--bits-floating-anchor-width, 160px);
        max-height: min(60vh, var(--bits-floating-available-height, 60vh));
        overflow-y: hidden;
    }

    /* The items a list draws in the box. `:where` keeps these at the weight of the box's own
       scoped class, two classes, the same as a list's plain `.item` rule; a list's rule for its
       items that must win, a hover, a current or a highlighted one, names more than one class. */
    .list :global(:where(.item)) {
        display: flex;
        flex: none;
        align-items: center;
        gap: 6px;
        border-radius: var(--radius-sm);
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-sm);
        text-align: left;
        padding: 4px 6px;
        cursor: pointer;
        outline: none;
    }

    /* An item holds its words first, which is what bits-ui's type-ahead reads, and draws its
       glyph before them by the flex order. */
    .list :global(:where(.item) .lead) {
        order: -1;
        display: inline-flex;
    }
</style>
