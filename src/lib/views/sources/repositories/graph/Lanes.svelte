<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. The lane drawing of one
    // row of the Source Control Graph, in the units of a 22-high row: the strokes
    // state/sources/repositories/graph-lanes.ts lays out, each in its lane's colour, and the
    // commit's circle with the ring in the row's own background that parts it from the lines
    // behind it. The SVG's viewBox is 22 units high and 11 units wide per lane, and its height and
    // width are those units at the tree row's height, so the lanes of two rows meet at every text
    // size.
    //
    // Given `passing` instead of a row it draws only the verticals of the lanes that pass beside
    // one file of an open commit, 3 px wide on the open commit's lane and 1 px on the others.

    import { HUES } from '$lib/ui/display/hues';
    import {
        commitCircles,
        laneWidth,
        laneX,
        lanePaths,
        type CommitKind,
        type LaneRow
    } from '$lib/state/sources/repositories/graph-lanes';

    type Props = {
        /** The row a commit sits in, drawn with its strokes and its circle. */
        row?: LaneRow;
        /** Which circle the commit is drawn with. */
        kind?: CommitKind;
        /** The lanes that pass beside a file row of an open commit. */
        passing?: number[];
        /** The open commit's lane, drawn wider among the passing ones. */
        open?: number;
    };

    let { row, kind = 'commit', passing = [], open = -1 }: Props = $props();

    function hue(lane: number): string {
        return `var(--c-${HUES[lane % HUES.length]}-txt)`;
    }

    const strokes = $derived(
        row !== undefined
            ? lanePaths(row).map((one) => ({ ...one, wide: false }))
            : passing.map((lane) => ({
                  d: `M ${String(laneX(lane))} 0 V 22`,
                  lane,
                  wide: lane === open
              }))
    );
    const lanes = $derived(
        row !== undefined ? row.width : Math.max(0, ...passing.map((n) => n + 1))
    );
    const width = $derived(laneWidth(lanes));
    const circles = $derived(row === undefined ? [] : commitCircles(kind));
</script>

<svg
    class="lanes"
    viewBox={`0 0 ${String(width)} 22`}
    style={`width: calc(var(--graph-lane) * ${String(width / laneX(0))} * var(--text-scale, 1)); height: calc(var(--tree-row) * var(--text-scale, 1))`}
    aria-hidden="true"
>
    {#each strokes as stroke, at (at)}
        <path
            d={stroke.d}
            stroke-width={stroke.wide ? 3 : 1}
            style={`stroke: ${hue(stroke.lane)}`}
        />
    {/each}
    {#if row !== undefined}
        {#each circles as circle, at (at)}
            <circle
                cx={laneX(row.lane)}
                cy="11"
                r={circle.r}
                stroke-width={circle.ring}
                stroke-dasharray={circle.dash}
                style={`stroke: ${circle.stroke === 'row' ? 'var(--row-bg)' : hue(row.lane)}; fill: ${circle.fill === 'lane' ? hue(row.lane) : 'none'}`}
            />
        {/each}
    {/if}
</svg>

<style>
    .lanes {
        flex: 0 0 auto;
        overflow: visible;
    }

    path {
        fill: none;
        stroke-linecap: round;
    }
</style>
