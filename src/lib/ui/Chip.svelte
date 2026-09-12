<script lang="ts">
    // Layer 3, primitive. An inline label in a hue: the status chips, the type pills, anything a
    // view wants to say in one word. Outline is the default and the filled form is for the one chip
    // that has to carry a row.
    //
    // The hue reaches the CSS as three custom properties the component sets from the tone, so the
    // rules below name only tokens: the tinted form paints `--c-<tone>-txt` on `--chip` and the
    // filled form paints `--on-c-<tone>` on `--c-<tone>`, which are the pairs tests/contrast.test.ts
    // measures under every theme.

    import Glyph from './Glyph.svelte';
    import { asciiOf } from '$lib/state/text';

    type Props = {
        /** The chip's words, already translated by the view. */
        label: string;
        /** A hue name from state/tones.ts. A chip with none is muted. */
        tone?: string;
        /** A name in `glyphs:`, drawn before the label. */
        glyph?: string;
        /**
         * A character the config already carries, for a chip whose icon is data rather than a name
         * in config/glyphs.yml: the `icon` of a `status_legend` row, through chipGlyph(). It goes
         * through asciiOf() so a terminal theme swaps it for its stand-in like every other glyph. It
         * is decoration beside the label, so it is hidden from a screen reader like Glyph's own.
         */
        icon?: string;
        /** Fill the chip with its hue instead of tinting the text. */
        filled?: boolean;
    };

    let { label, tone, glyph, icon, filled = false }: Props = $props();

    const style = $derived(
        tone === undefined
            ? undefined
            : `--tone: var(--c-${tone}); --tone-txt: var(--c-${tone}-txt); --on-tone: var(--on-c-${tone})`
    );
</script>

<span class="chip" class:toned={tone !== undefined} class:filled {style}>
    {#if glyph !== undefined}
        <Glyph name={glyph} />
    {/if}
    {#if icon !== undefined && icon !== ''}
        <span class="icon" aria-hidden="true">{asciiOf(icon)}</span>
    {/if}
    <span class="label">{label}</span>
</span>

<style>
    .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 1px 8px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        white-space: nowrap;
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

    :global(body.rice) .chip::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice) .chip::after {
        content: ']';
        opacity: 0.5;
    }
</style>
