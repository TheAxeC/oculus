<script lang="ts">
    // Layer 3, primitive. An inline label in a hue: a status word and the project type, and a
    // filter the reader presses. The capsule is what marks a status out of the run of words on a
    // card, so every other tag a view lists is ui/controls/Tag.svelte instead. It is VS Code's
    // count badge in shape: 11px words, an 18 px minimum, a full round end. Outline is
    // the default and the filled form is for the one chip that has to carry a row; a pressed
    // toggle is drawn filled in its hue.
    //
    // The hue reaches the CSS as three custom properties the component sets from the tone, so the
    // rules below name only tokens: the tinted form paints `--c-<tone>-txt` on `--chip` and the
    // filled form paints `--on-c-<tone>` on `--c-<tone>`, which are the pairs
    // tests/checks/look/contrast.test.ts measures under every theme.
    //
    // Given an `onclick` it is a toggle with `aria-pressed`, toned or untoned (the Joint-work and
    // disclosure pills are untoned).

    import Glyph from '../display/Glyph.svelte';
    import Tooltip from '../menu/Tooltip.svelte';
    import { bracketedGlyph } from '$lib/state/shared/words/text';

    type Props = {
        /** The chip's words, already translated by the view. */
        label: string;
        /** A hue name from state/shared/words/tones.ts. A chip with none is muted. */
        tone?: string;
        /**
         * A name in `glyphs:`, drawn before the label. Empty draws none, as an unlisted chip's is.
         */
        glyph?: string;
        /** Fill the chip with its hue instead of tinting the text. */
        filled?: boolean;
        /**
         * Makes the chip a toggle the reader presses. A chip given none is a mark and not a
         * control.
         */
        onclick?: (event: MouseEvent) => void;
        /** A toggle chip's own state, which is what a reader is told it is pressing. */
        pressed?: boolean;
        /** The tooltip of a toggle chip, when it should say more than the label does. */
        title?: string;
    };

    let { label, tone, glyph, filled = false, onclick, pressed, title }: Props = $props();

    const solid = $derived(filled || pressed === true);
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

{#if onclick === undefined}
    <span
        class="chip"
        class:toned={tone !== undefined}
        class:filled={solid}
        class:bracketed
        {style}
    >
        {#if glyph !== undefined && glyph !== ''}
            <span class="mark"><Glyph name={glyph} /></span>
        {/if}
        <span class="label">{label}</span>
    </span>
{:else}
    <Tooltip text={title ?? ''}>
        <button
            type="button"
            class="chip pressable"
            class:toned={tone !== undefined}
            class:filled={solid}
            class:bracketed
            aria-pressed={pressed}
            {style}
            {onclick}
        >
            {#if glyph !== undefined && glyph !== ''}
                <span class="mark"><Glyph name={glyph} /></span>
            {/if}
            <span class="label">{label}</span>
        </button>
    </Tooltip>
{/if}

<style>
    .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-sizing: border-box;
        max-width: 100%;
        min-width: 0;
        min-height: calc(18px * var(--text-scale, 1));
        padding: 3px 5px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        line-height: calc(11px * var(--text-scale, 1));
        white-space: nowrap;
    }

    /* The 16 px icon of a chip is taller than the chip's 11 px line; its margin gives the room
       back, so a chip with an icon is as high as one without. */
    .chip .mark {
        display: inline-flex;
        margin: calc(-3px * var(--text-scale, 1)) 0;
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

    /* A chip the reader presses is the same capsule with a button's behaviour: the words keep the
       page's own font, and the hue says which state it is in. */
    .chip.pressable {
        font-family: inherit;
        cursor: pointer;
    }

    .chip.pressable:hover {
        border-color: var(--accent);
    }

    /* A pressed toggle with no hue of its own is marked in the accent. */
    .chip.pressable[aria-pressed='true']:not(.toned) {
        border-color: var(--accent);
        color: var(--ink-txt, var(--ink));
    }

    .chip.pressable:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
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

    /* The terminal shape: a bracketed text tag in its own colour, no pill and no fill. It is the
       option `rice.brackets`'s (the Settings view's option, written into the workspace file's
       `settings:`): with the option off, the body carries `rice-plain` and the chip keeps its
       capsule in the rice palette and shape. */
    :global(body.rice:where(:not(.rice-plain))) .chip {
        min-height: 0;
        padding: 1px 0;
        border: 0;
        background: none;
    }

    :global(body.rice:where(:not(.rice-plain))) .chip .mark {
        margin: 0;
    }

    :global(body.rice:where(:not(.rice-plain))) .chip.filled {
        background: none;
        color: var(--tone-txt, var(--muted-txt));
    }

    /* The terminal stand-in of a glyph carries its own brackets, so the chip draws none of its
       own around it and the reader is not given two pairs. */
    :global(body.rice:where(:not(.rice-plain))) .chip:not(.bracketed)::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice:where(:not(.rice-plain))) .chip:not(.bracketed)::after {
        content: ']';
        opacity: 0.5;
    }
</style>
