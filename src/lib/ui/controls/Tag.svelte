<script lang="ts">
    // Layer 3, primitive. One tag: a glyph and its words, with no capsule. Everything a card lists
    // that is not a status word is drawn this way, so a card of datasets, people, pillars and
    // counts reads as text and the capsule keeps its one meaning.
    //
    // A tag that stands for a state carries that state's hue as the colour of its words and of its
    // mark, which a line icon takes through `currentColor`; a tag that stands for a name or a count
    // carries none and is muted. The hue reaches the CSS as one custom property this component sets
    // from the tone, so the rule below names only tokens and paints `--c-<tone>-txt` on the surface
    // the tag sits on, which is a pair tests/checks/look/contrast.test.ts measures under every
    // theme.
    //
    // A tag that is pressed is this inside the caller's own button: the click, the title and the
    // hover belong to the control, and what it holds is the same tag as the ones beside it.

    import Glyph from '../display/Glyph.svelte';
    import { bracketedGlyph } from '$lib/state/shared/words/text';

    type Props = {
        /** The tag's words, already translated by the view. */
        label: string;
        /** A name in `glyphs:`, drawn before the label. Empty draws none. */
        glyph?: string;
        /** A hue name from state/shared/words/tones.ts. A tag with none is muted. */
        tone?: string;
    };

    let { label, glyph, tone }: Props = $props();

    const style = $derived(tone === undefined ? undefined : `--tone-txt: var(--c-${tone}-txt)`);

    /**
     * Whether the glyph in force already reads as a bracketed tag, which the ASCII stand-ins of a
     * terminal theme do. The tag's own brackets are left off such a one so the reader is given one
     * pair rather than two.
     */
    const bracketed = $derived(glyph !== undefined && glyph !== '' && bracketedGlyph(glyph));
</script>

<span class="tag" class:toned={tone !== undefined} class:bracketed {style}>
    {#if glyph !== undefined && glyph !== ''}
        <Glyph name={glyph} />
    {/if}
    <span class="label">{label}</span>
</span>

<style>
    .tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        max-width: 100%;
        min-width: 0;
        padding: 1px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        white-space: nowrap;
    }

    .tag.toned {
        color: var(--tone-txt, var(--muted-txt));
    }

    /* A long value is cut at the tag's own edge rather than at the card's, so a run of tags keeps
       its line and the caller's tooltip carries the whole value. */
    .tag .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* The terminal shape: a bracketed run of text, the same delimiter a chip is given there, so a
       tag beside a chip is still one mark rather than a word loose in the row. */
    :global(body.rice) .tag:not(.bracketed)::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice) .tag:not(.bracketed)::after {
        content: ']';
        opacity: 0.5;
    }
</style>
