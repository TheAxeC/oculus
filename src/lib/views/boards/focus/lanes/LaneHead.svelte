<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The header of one column of the
    // board: the lane's name and its count on a surface tinted with the lane's hue. Lanes.svelte
    // draws it over every project lane and Band.svelte over the Funding, Jobs and Teaching columns,
    // so the one rule lives here.
    //
    // The surface is `--c-<hue>-lane`, the hue mixed into the panel by themes/derive.ts, and the
    // name and the count are drawn in `--c-<hue>-lane-txt`, which derive.ts makes readable on that
    // surface and which no other text uses. That pair is what tests/checks/look/contrast.test.ts
    // measures under every theme, so the header is painted as that pair and nothing else: it is
    // filled rather than translucent over a wallpaper, and Lanes.svelte fades a muted lane's body
    // and sub-line rather than the lane, so the header keeps full opacity.

    type Props = {
        /** The lane's words, already translated by the view. */
        label: string;
        /** How many cards the lane holds. */
        count: number;
        /** A hue name from state/words/tones.ts. */
        tone: string;
    };

    let { label, count, tone }: Props = $props();

    const style = $derived(`--lane: var(--c-${tone}-lane); --lane-txt: var(--c-${tone}-lane-txt)`);
</script>

<div class="lane-h" {style}>
    <span class="lane-name">{label}</span>
    <span class="count">{count}</span>
</div>

<style>
    .lane-h {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
        padding: 3px 6px;
        border-radius: var(--radius-sm);
        background: var(--lane);
        color: var(--lane-txt);
    }

    .lane-name {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-md);
        font-weight: 700;
    }

    .count {
        font-size: var(--fs-xs);
        font-weight: 600;
    }
</style>
