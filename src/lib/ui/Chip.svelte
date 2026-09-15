<script lang="ts">
    // Layer 3, primitive. An inline label in a hue: a status word and the project type, and nothing
    // else. The capsule is what marks a status out of the run of words on a card, so every other
    // tag a view lists is ui/Tag.svelte instead. Outline is the default and the filled form is for
    // the one chip that has to carry a row.
    //
    // The hue reaches the CSS as three custom properties the component sets from the tone, so the
    // rules below name only tokens: the tinted form paints `--c-<tone>-txt` on `--chip` and the
    // filled form paints `--on-c-<tone>` on `--c-<tone>`, which are the pairs tests/contrast.test.ts
    // measures under every theme.

    import Glyph from './Glyph.svelte';
    import { bracketedGlyph } from '$lib/state/text';

    type Props = {
        /** The chip's words, already translated by the view. */
        label: string;
        /** A hue name from state/tones.ts. A chip with none is muted. */
        tone?: string;
        /** A name in `glyphs:`, drawn before the label. Empty draws none, as an unlisted chip's is. */
        glyph?: string;
        /** Fill the chip with its hue instead of tinting the text. */
        filled?: boolean;
    };

    let { label, tone, glyph, filled = false }: Props = $props();

    const style = $derived(
        tone === undefined
            ? undefined
            : `--tone: var(--c-${tone}); --tone-txt: var(--c-${tone}-txt); --on-tone: var(--on-c-${tone})`
    );

    /**
     * Whether the glyph in force already reads as a bracketed tag, which the ASCII stand-ins of a
     * terminal theme do. The chip's own brackets are left off such a chip so the reader is given
     * one pair rather than two.
     */
    const bracketed = $derived(glyph !== undefined && glyph !== '' && bracketedGlyph(glyph));
</script>

<span class="chip" class:toned={tone !== undefined} class:filled class:bracketed {style}>
    {#if glyph !== undefined && glyph !== ''}
        <Glyph name={glyph} />
    {/if}
    <span class="label">{label}</span>
</span>

<style>
    .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        max-width: 100%;
        min-width: 0;
        padding: 1px 8px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        white-space: nowrap;
    }

    /* A long value is cut at the chip's own edge rather than at the card's, so a column of chips
       keeps its column and the caller's tooltip carries the whole value. */
    .chip .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chip.toned {
        color: var(--tone-txt, var(--muted-txt));
    }

    .chip.filled {
        border-color: transparent;
        background: var(--tone);
        color: var(--on-tone);
    }

    /* A tone is what fills a chip, so a filled chip without one stays the muted outline. */
    .chip.filled:not(.toned) {
        border-color: var(--line);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: a bracketed text tag in its own colour, no pill and no fill. */
    :global(body.rice) .chip {
        padding: 1px 0;
        border: 0;
        background: none;
    }

    :global(body.rice) .chip.filled {
        background: none;
        color: var(--tone-txt, var(--muted-txt));
    }

    /* The terminal stand-in of a glyph carries its own brackets, so the chip draws none of its
       own around it and the reader is not given two pairs. */
    :global(body.rice) .chip:not(.bracketed)::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice) .chip:not(.bracketed)::after {
        content: ']';
        opacity: 0.5;
    }
</style>
