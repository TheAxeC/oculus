<script lang="ts">
    // Layer 3, primitive. The one place a glyph character reaches the DOM. Every other component
    // names a glyph and this renders it, so config/glyphs.yml stays the vocabulary and no source
    // file carries the character. It is decoration beside a label that already says the same thing,
    // so it is hidden from a screen reader.

    import { glyph } from '$lib/state/text';

    type Props = {
        /** A name in the `glyphs:` map of config/glyphs.yml. An unknown name throws. */
        name: string;
    };

    let { name }: Props = $props();
</script>

<span class="glyph" aria-hidden="true">{glyph(name)}</span>

<style>
    .glyph {
        display: inline-block;
        /* The vocabulary mixes emoji with box-drawing characters; a fixed box keeps a rail of them
           in one column whatever the character's own width is. */
        width: 1.2em;
        text-align: center;
        line-height: 1;
    }
</style>
