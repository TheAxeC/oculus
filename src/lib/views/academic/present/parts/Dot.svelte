<script lang="ts">
    // Layer 3, Present partial. The hue dot beside a summary row's field, an idea card's title and
    // a hued fact of a project's facts strip (parts/project/Facts.svelte). The hue reaches the CSS
    // as a custom property, as it does on a chip, so the rule below names a token and not a
    // colour. The dot is 0.703125 hundredths of the frame's width across (`cqw`, as every size
    // inside a slide is, themes/slide.css) unless an element around it sets `--dot-size`, which the
    // strip sets to follow its own type.

    type Props = {
        /**
         * A hue name from state/shared/words/tones.ts; a dot with none is drawn in the hairline
         * colour.
         */
        tone?: string;
    };

    let { tone }: Props = $props();

    const style = $derived(tone === undefined ? undefined : `--tone: var(--c-${tone})`);
</script>

<span class="dot" class:toned={tone !== undefined} {style}></span>

<style>
    .dot {
        display: inline-block;
        flex: 0 0 auto;
        width: var(--dot-size, 0.703125cqw);
        height: var(--dot-size, 0.703125cqw);
        border-radius: var(--radius-pill);
        background: var(--line);
    }

    .dot.toned {
        background: var(--tone);
    }
</style>
