<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. The lane drawing of one
    // commit's row: the strokes state/sources/repositories/graph-lanes.ts laid out, each in its
    // lane's colour, and the commit's dot, filled for the checked-out head. It is drawn in lane
    // and row units scaled to the row's own height, so it lines up with the row whatever the text
    // size is.

    import { HUES } from '$lib/ui/display/hues';
    import type { LaneRow } from '$lib/state/sources/repositories/graph-lanes';

    type Props = { row: LaneRow; head: boolean };

    let { row, head }: Props = $props();

    /** How wide one lane is, in the drawing's units, against a row one unit tall. */
    const LANE = 0.7;

    function hue(lane: number): string {
        return `var(--c-${HUES[lane % HUES.length]}-txt)`;
    }

    const width = $derived(Math.max(1, row.width) * LANE);

    /** The middle of a lane across the drawing. */
    function x(lane: number): number {
        return lane * LANE + LANE / 2;
    }
</script>

<svg
    class="lanes"
    viewBox={`0 0 ${width} 1`}
    preserveAspectRatio="xMinYMid meet"
    style={`width: calc(${width} * var(--row))`}
    aria-hidden="true"
>
    {#each row.lines as line, at (at)}
        <path
            d={line.x1 === line.x2
                ? `M ${x(line.x1)} ${line.y1} L ${x(line.x2)} ${line.y2}`
                : `M ${x(line.x1)} ${line.y1} C ${x(line.x1)} ${(line.y1 + line.y2) / 2} ${x(line.x2)} ${(line.y1 + line.y2) / 2} ${x(line.x2)} ${line.y2}`}
            stroke={hue(line.lane)}
        />
    {/each}
    <circle cx={x(row.lane)} cy="0.5" r="0.16" class:head stroke={hue(row.lane)} />
</svg>

<style>
    .lanes {
        --row: 22px;
        flex: 0 0 auto;
        height: var(--row);
        overflow: visible;
    }

    path {
        fill: none;
        stroke-width: 0.08;
    }

    circle {
        fill: var(--panel);
        stroke-width: 0.08;
    }

    circle.head {
        fill: currentColor;
    }
</style>
