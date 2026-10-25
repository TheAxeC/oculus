<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The header of one column of the
    // board: its glyph, its name and its count on a surface tinted with the lane's hue, and before
    // the count how many cards the Focus filter hides from the lane ("3 hidden"), when it hides
    // any.
    // Lanes.svelte draws it over every project lane with the lane's `icon` of `focus_lanes`, and
    // Band.svelte over the Funding, Jobs and Teaching columns with each column's glyph, so the one
    // rule lives here. A name the glyph vocabulary does not hold, the empty string of a row naming
    // no `icon` among them, draws the Focus board's own glyph (views/shared/card/card.ts
    // `laneGlyph`, which a project card's lane draws with too), so every header carries a glyph and
    // no name from a hub's file reaches a Glyph that would throw.
    //
    // The surface is `--c-<hue>-lane`, the hue mixed into the panel by themes/derive.ts, and the
    // glyph, the name and the count are drawn in `--c-<hue>-lane-txt`, which derive.ts makes
    // readable on that surface and which no other text uses. That pair is what
    // tests/checks/look/contrast.test.ts measures under every theme, so the header is painted as
    // that pair and nothing else: it is filled rather than translucent over a wallpaper, and
    // Lanes.svelte fades a muted lane's body and sub-line rather than the lane, so the header keeps
    // full opacity.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { laneGlyph } from '$lib/views/shared/card/card';

    type Props = {
        /** The lane's words, already translated by the view. */
        label: string;
        /** A name in `glyphs:` drawn before the words; another draws the Focus board's glyph. */
        glyph: string;
        /** How many cards the lane holds. */
        count: number;
        /** A hue name from state/shared/words/tones.ts. */
        tone: string;
        /** How many cards the Focus filter hides from the lane, said before the count when any. */
        hidden?: number;
    };

    let { label, glyph, count, tone, hidden = 0 }: Props = $props();

    const style = $derived(`--lane: var(--c-${tone}-lane); --lane-txt: var(--c-${tone}-lane-txt)`);
</script>

<div class="lane-h" {style}>
    <span class="lane-title">
        <Glyph name={laneGlyph(glyph)} />
        <span class="lane-name">{label}</span>
    </span>
    <span class="counts">
        {#if hidden > 0}
            <span class="hidden">{t('focus.hidden', hidden)}</span>
        {/if}
        <span class="count">{count}</span>
    </span>
</div>

<style>
    /* One row of the tree's height, VS Code's section head: the name in 11px capitals, cut with an
       ellipsis where the count begins. */
    .lane-h {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        padding: 0 6px;
        border-radius: var(--radius-sm);
        background: var(--lane);
        color: var(--lane-txt);
    }

    /* The glyph and the name sit on one line at the name's size; the name is its own element, so
       what it says is the lane's words and nothing else. */
    .lane-title {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
    }

    .lane-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* The hidden count and the count stay on the row's line, at its end. */
    .counts {
        display: flex;
        flex: none;
        align-items: center;
        gap: 6px;
    }

    .count {
        font-size: var(--fs-xs);
        font-weight: 600;
    }

    .hidden {
        font-size: var(--fs-xs);
        font-weight: 400;
    }
</style>
