<script lang="ts">
    // Layer 3, primitive. A horizontal bar for a fraction: how full a context window is, how far a
    // deadline has run, how much of a target is met. It is a meter and not a progress bar, since
    // what it shows is a level rather than the progress of a task.
    //
    // The value is clamped rather than trusted: a caller dividing by a count that turned out to be
    // zero gets a full or an empty bar, never a bar drawn outside its track.

    type Props = {
        /** The level, 0 to 1. Anything outside that, or not a number, is clamped into it. */
        value: number;
        /** A hue name from state/words/tones.ts. A meter with none fills in the accent colour. */
        tone?: string;
        /** The accessible name, already translated by the view. */
        label: string;
        /** What the number says, shown at the right. A meter with none shows the bar alone. */
        text?: string;
    };

    let { value, tone, label, text }: Props = $props();

    const level = $derived(Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);
    const style = $derived(
        tone === undefined ? '--tone: var(--accent)' : `--tone: var(--c-${tone})`
    );
</script>

<div class="meter">
    <div
        class="track"
        role="meter"
        aria-label={label}
        aria-valuenow={level}
        aria-valuemin={0}
        aria-valuemax={1}
    >
        <span class="fill" style="{style}; width: {level * 100}%"></span>
    </div>
    {#if text !== undefined}
        <span class="text">{text}</span>
    {/if}
</div>

<style>
    .meter {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .track {
        flex: 1 1 auto;
        min-width: 0;
        height: 6px;
        border-radius: var(--radius-pill);
        background: var(--chip);
        overflow: hidden;
    }

    .fill {
        display: block;
        height: 100%;
        background: var(--tone);
    }

    .text {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    /* The terminal shape: a square gauge with a hairline round it, nothing rounded. */
    :global(body.rice) .track {
        height: 8px;
        border: 1px solid var(--line);
        border-radius: 0;
    }
</style>
