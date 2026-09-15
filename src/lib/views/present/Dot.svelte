<script lang="ts">
    // Layer 3, Present partial. The hue dot beside a summary row's field and an idea card's title.
    // The hue reaches the CSS as a custom property, as it does on a chip, so the rule below names a
    // token and not a colour.

    type Props = {
        /** A hue name from state/tones.ts; a dot with none is drawn in the hairline colour. */
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
        width: 9px;
        height: 9px;
        border-radius: var(--radius-pill);
        background: var(--line);
    }

    .dot.toned {
        background: var(--tone);
    }
</style>
