<script lang="ts">
    // Layer 3, primitive. A horizontal bar for the progress of a task: the share done as a bar that
    // fills, or a bar that runs back and forth while the task reports none. Unlike the Meter it
    // shows a task that ends. The share is clamped into 0 to 100 rather than trusted.

    type Props = {
        /** The share done, 0 to 100, or null while the task reports none. */
        percent: number | null;
        /** The accessible name, already translated by the view. */
        label: string;
    };

    let { percent, label }: Props = $props();

    const done = $derived(
        percent === null || !Number.isFinite(percent) ? null : Math.min(100, Math.max(0, percent))
    );
</script>

<div
    class="track"
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={done ?? undefined}
>
    <span class="fill" class:running={done === null} style:width={done === null ? '' : `${done}%`}
    ></span>
</div>

<style>
    .track {
        flex: 1 1 auto;
        min-width: 0;
        height: 4px;
        border-radius: var(--radius-pill);
        background: var(--chip);
        overflow: hidden;
    }

    .fill {
        display: block;
        height: 100%;
        background: var(--accent);
    }

    .running {
        width: 30%;
        animation: run 1.2s ease-in-out infinite alternate;
    }

    @keyframes run {
        from {
            margin-left: 0;
        }
        to {
            margin-left: 70%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .running {
            width: 100%;
            animation: none;
            opacity: 0.5;
        }
    }

    :global(body.rice) .track {
        border: 1px solid var(--line);
        border-radius: 0;
        height: 6px;
    }
</style>
