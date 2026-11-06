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
    // hover belong to the control, and what it holds is the same tag as the ones beside it. A
    // surface that sets its tags' words in a size of its own gives that size as `--tag-text`.
    //
    // The glyph may carry a hue and words of its own, for a mark that says something the words
    // beside it do not, as a project card's Venue tag draws the venue's tier: the hue paints the
    // glyph alone as `--c-<tone>-txt`, the words keeping the tag's own colour, and the words are
    // the glyph's tip through ui/menu/Tooltip.svelte, which shows them on hover and on keyboard
    // focus. Such a glyph takes a tab stop of its own, since words on content that is no control
    // are reached by keyboard only through one, and the stop is an image named by the same words,
    // since the glyph itself is hidden from a screen reader: Tab to it reads the words as its name.
    // The tooltip is presentational, so the words are not read a second time as a description.

    import Glyph from '../display/Glyph.svelte';
    import Tooltip from '../menu/Tooltip.svelte';
    import { bracketedGlyph } from '$lib/state/shared/words/text';

    type Props = {
        /** The tag's words, already translated by the view. */
        label: string;
        /** A name in `glyphs:`, drawn before the label. Empty draws none. */
        glyph?: string;
        /** A hue name from state/shared/words/tones.ts. A tag with none is muted. */
        tone?: string;
        /** Whether a label longer than the line wraps onto the next, for a tag whose whole name
         * must stay readable with no tooltip. Without it the label is cut with an ellipsis. */
        wrap?: boolean;
        /** A hue name the glyph alone is drawn in, the label keeping the tag's colour. */
        glyphTone?: string;
        /** The words the glyph carries as its tip, already translated. Empty gives it none. */
        glyphTip?: string;
    };

    let { label, glyph, tone, wrap = false, glyphTone, glyphTip = '' }: Props = $props();

    const style = $derived(tone === undefined ? undefined : `--tone-txt: var(--c-${tone}-txt)`);

    /** The custom property the glyph's own hue reaches the CSS by, as the tag's tone does. */
    const markStyle = $derived(
        glyphTone === undefined ? undefined : `--mark-txt: var(--c-${glyphTone}-txt)`
    );

    /**
     * Whether the glyph in force already reads as a bracketed tag, which the ASCII stand-ins of a
     * terminal theme do. The tag's own brackets are left off such a one so the reader is given one
     * pair rather than two.
     */
    const bracketed = $derived(glyph !== undefined && glyph !== '' && bracketedGlyph(glyph));
</script>

<span class="tag" class:toned={tone !== undefined} class:bracketed class:wrap {style}>
    {#if glyph !== undefined && glyph !== ''}
        {#if glyphTip !== ''}
            <Tooltip text={glyphTip} presentational>
                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <span class="mark" style={markStyle} tabindex="0" role="img" aria-label={glyphTip}>
                    <Glyph name={glyph} />
                </span>
            </Tooltip>
        {:else if markStyle !== undefined}
            <span class="mark" style={markStyle}>
                <Glyph name={glyph} />
            </span>
        {:else}
            <Glyph name={glyph} />
        {/if}
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
        font-size: var(--tag-text, var(--fs-sm));
        white-space: nowrap;
    }

    .tag.toned {
        color: var(--tone-txt, var(--muted-txt));
    }

    .mark {
        display: inline-flex;
        color: var(--mark-txt, inherit);
    }

    /* A long value is cut at the tag's own edge rather than at the card's, so a run of tags keeps
       its line and the caller's tooltip carries the whole value. */
    .tag .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tag.wrap {
        white-space: normal;
    }

    .tag.wrap .label {
        overflow-wrap: anywhere;
    }

    /* The terminal shape: a bracketed run of text, the same delimiter a chip is given there, so a
       tag beside a chip is still one mark rather than a word loose in the row. It is the option
       `rice.brackets`'s (the Settings view's option, written into the workspace file's
       `settings:`): with the option off, the body carries `rice-plain` and the tag is its text
       alone, as under every other theme. */
    :global(body.rice:where(:not(.rice-plain))) .tag:not(.bracketed)::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice:where(:not(.rice-plain))) .tag:not(.bracketed)::after {
        content: ']';
        opacity: 0.5;
    }
</style>
