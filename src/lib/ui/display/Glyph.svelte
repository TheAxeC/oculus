<script lang="ts">
    // Layer 3, primitive. The one place a glyph reaches the DOM. Every other component names a
    // glyph and this draws it, so config/catalogs/glyphs.yml stays the vocabulary and no source
    // file carries a drawing or a stand-in. It is decoration beside a label that already says the
    // same thing, so it is hidden from a screen reader. It sits in ui/display, below the controls,
    // the menus and the frames that draw it, so the primitives' folders import downward only.
    //
    // What it draws is the line icon config/catalogs/icons.yml maps the name to, as the drawing the
    // server read out of the icon package, and nothing else. A terminal palette has no icons: there
    // the ASCII stand-in of config/catalogs/glyphs.yml is drawn as text instead. A name with no
    // drawing is a finding the server reports, and in the icon mode it draws an empty box rather
    // than any text. The drawing comes from a file rather than from this tree, so it passes the
    // icon filter of ui/html.ts before it is put into the page. The box carries the name it draws,
    // so what a surface draws is read by name in either mode rather than off the drawing.

    import { glyph, glyphMode, iconSvg } from '$lib/state/shared/words/text';
    import { sanitiseSvg } from '../html.ts';

    type Props = {
        /** A name in the `glyphs:` map of config/catalogs/glyphs.yml. An unknown name throws. */
        name: string;
    };

    let { name }: Props = $props();

    /**
     * The stand-in's text in the ASCII mode, and otherwise the icon's drawing, the empty string for
     * a name with none. The stand-in is read in both, so a name the vocabulary lacks throws in
     * both.
     */
    const drawn = $derived.by((): { text: string; svg: string } => {
        const standIn = glyph(name);
        return glyphMode() === 'ascii'
            ? { text: standIn, svg: '' }
            : { text: '', svg: iconSvg(name) ?? '' };
    });
</script>

{#if drawn.svg === ''}
    <span class="glyph" data-glyph={name} aria-hidden="true">{drawn.text}</span>
{:else}
    <span class="glyph" data-glyph={name} aria-hidden="true">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- the icon filter writes this -->
        {@html sanitiseSvg(drawn.svg)}
    </span>
{/if}

<style>
    .glyph {
        display: inline-block;
        /* A fixed box keeps a rail of glyphs in one column whatever the drawing or the stand-in is,
           and keeps the room of a name with no drawing. */
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
       icon, and a stand-in is at most three characters wide, which
       tests/checks/config/config-folder.test.ts holds, so the box holds three of the theme's own
       face. */
    :global(body.rice) .glyph {
        width: 3ch;
    }
</style>
