<script lang="ts">
    // Layer 3, primitive. The one place a glyph reaches the DOM. Every other component names a
    // glyph and this draws it, so config/catalogs/glyphs.yml stays the vocabulary and no source
    // file carries the character. It is decoration beside a label that already says the same thing,
    // so it is hidden from a screen reader.
    //
    // What it draws is the line icon config/catalogs/icons.yml maps the name to, as the drawing the
    // server read out of the icon package. A terminal palette has no icons: there the ASCII
    // stand-in is the vocabulary and the text is drawn instead, which is also what a name with no
    // icon falls back to. The drawing comes from a file rather than from this tree, so it passes
    // the icon filter of ui/html.ts before it is put into the page.

    import { glyph, iconSvg } from '$lib/state/words/text';
    import { sanitiseSvg } from '../html.ts';

    type Props = {
        /** A name in the `glyphs:` map of config/catalogs/glyphs.yml. An unknown name throws. */
        name: string;
    };

    let { name }: Props = $props();

    const drawing = $derived(iconSvg(name));
</script>

{#if drawing === undefined}
    <span class="glyph" aria-hidden="true">{glyph(name)}</span>
{:else}
    <span class="glyph" aria-hidden="true">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- the icon filter writes this -->
        {@html sanitiseSvg(drawing)}
    </span>
{/if}

<style>
    .glyph {
        display: inline-block;
        /* The vocabulary mixes emoji with box-drawing characters; a fixed box keeps a rail of them
           in one column whatever the character's own width is. */
        width: 1.2em;
        text-align: center;
        line-height: 1;
    }

    /* An icon is drawn at the size of the text it sits beside, inside the box above, and the shift
       puts its middle on the line's rather than its foot on the baseline. */
    .glyph :global(svg) {
        display: inline-block;
        width: 1em;
        height: 1em;
        vertical-align: -0.125em;
    }

    /* A terminal palette draws the ASCII stand-in of config/catalogs/glyphs.yml instead of the
       character, and a stand-in is up to three characters wide, so the box holds three of the
       theme's own face. */
    :global(body.rice) .glyph {
        width: 3ch;
    }
</style>
