<script lang="ts">
    // Layer 3, primitive. The list the icon dropdown shows while it is open: the empty choice, a
    // value the choices lack, then every name of the glyph vocabulary with its icon beside it.
    // GlyphSelect.svelte draws it inside bits-ui's Select content, whose attributes it is handed as
    // `list` and puts on the box it paints, so a test can hold it open inside a Select of its own.
    //
    // The keys are bits-ui's: the arrows, Home and End, Enter to pick, and type-ahead, which reads
    // each item's text. So each item holds its name first and draws its icon before it by the flex
    // order, and the text of an item begins with its name. Where the list is placed is bits-ui's.
    // The box is ui/frame/FloatingList.svelte, the menus' own, and the items sit in bits-ui's
    // viewport inside it, which scrolls and which bits-ui scrolls to keep the keys' item in view.

    import { Select } from 'bits-ui';
    import Glyph from '../../display/Glyph.svelte';
    import FloatingList from '../../frame/FloatingList.svelte';
    import type { GlyphItem } from './choices';

    type Props = {
        /** The list's accessible name, which is its field's. */
        label: string;
        /** The entries in the order they are listed, as `glyphItems` of ./choices.ts makes them. */
        items: GlyphItem[];
        /** The attributes bits-ui's content gives the box that holds the choices. */
        list?: Record<string, unknown>;
    };

    let { label, items, list = {} }: Props = $props();
</script>

<FloatingList {label} {list} shape="field">
    <Select.Viewport>
        {#snippet child({ props })}
            <div {...props} class="viewport">
                {#each items as item (item.value)}
                    <Select.Item value={item.value} label={item.label}>
                        {#snippet child({ props: entry })}
                            <div {...entry} class="item">
                                <span class="name">{item.label}</span>
                                {#if item.icon}
                                    <span class="lead">
                                        <Glyph name={item.value} />
                                    </span>
                                {/if}
                            </div>
                        {/snippet}
                    </Select.Item>
                {/each}
            </div>
        {/snippet}
    </Select.Viewport>
</FloatingList>

<style>
    /* The box that scrolls: bits-ui scrolls the item the keys reach into view only inside its
       viewport, so the arrows, Home, End and type-ahead never leave the item out of sight. It
       shrinks to the room the box has, which is what makes it scroll. */
    .viewport {
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    /* bits-ui hides its viewport's scrollbar with an !important rule of one attribute, so nothing
       would show that the list goes on past its rows; this draws the page's thin bar again, in
       the theme's two scrollbar tokens as every scrolling box draws it. */
    .viewport[data-select-viewport] {
        scrollbar-width: thin !important;
        scrollbar-color: var(--scroll-thumb) var(--scroll-track) !important;
    }

    /* The empty choice and a stray value have no icon, so their words keep the icons' column: the
       glyph box is 1.2em wide, and three characters wide under the terminal theme. */
    .item .name:only-child {
        padding-left: calc(1.2em + 6px);
    }

    :global(body.rice) .item .name:only-child {
        padding-left: calc(3ch + 6px);
    }

    .item[data-highlighted] {
        background: var(--chip);
    }

    .item[data-selected] {
        color: var(--accent-txt, var(--accent));
    }
</style>
