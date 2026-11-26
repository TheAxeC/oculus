<script lang="ts">
    // Layer 3, primitive partial of ToolButton.svelte. What a tool button shows inside its box: the
    // glyph or the picture, then the words in the box of the class `label`, or, for a cell, the
    // caller's content alone. It is kept apart from ToolButton.svelte, which holds the button's
    // behaviour and the rules of its variants, since what a button shows changes apart from how
    // each variant draws its box. The variants reach the label through `:global(.label)`, the label
    // being this component's element.

    import type { Snippet } from 'svelte';
    import Glyph from '../../display/Glyph.svelte';

    type Props = {
        /** The button's words, drawn where no children are given. */
        label: string;
        /** A name in `glyphs:`, drawn in front of the words. */
        glyph?: string;
        /** The address of a picture drawn in the glyph's place, where no glyph is given. */
        picture?: string;
        /** Turn the glyph round and round, for an action that is under way. */
        turning: boolean;
        /** Whether the words are drawn: an icon-only button shows its glyph alone. */
        words: boolean;
        /** A cell of a grid, whose children are drawn with no label box around them. */
        cell: boolean;
        /** What the button draws in place of its words. */
        children?: Snippet;
    };

    let { label, glyph, picture, turning, words, cell, children }: Props = $props();
</script>

{#if glyph !== undefined}
    <Glyph name={glyph} {turning} />
{:else if picture !== undefined}
    <img class="picture" src={picture} alt="" />
{/if}
{#if cell}
    {#if children !== undefined}
        {@render children()}
    {/if}
{:else if words}
    {#if children !== undefined}
        <span class="label">{@render children()}</span>
    {:else}
        <span class="label">{label}</span>
    {/if}
{/if}

<style>
    /* A picture takes the glyph's box. */
    .picture {
        flex: none;
        width: calc(var(--icon-box) * var(--text-scale, 1));
        height: calc(var(--icon-box) * var(--text-scale, 1));
        object-fit: contain;
    }
</style>
