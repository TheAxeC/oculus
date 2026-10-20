<script lang="ts">
    // Layer 3, Venues view partial. The next conference deadlines and the twelve-month ribbon.
    // Timing and density are prepared by state/sources/registries/venues.ts; this file only assigns
    // the catalog words and draws the density line as one SVG bar per month, in the colour of the
    // text it sits in, so no character stands for a height.
    //
    // Over a wallpaper the deadlines, the density line and the legend are read off one `Surface`,
    // and each month box is a surface of its own.

    import Surface from '$lib/ui/frame/Surface.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        SPARK_HEIGHT,
        sparkBars,
        timeline,
        type TimelineChip,
        type Venue
    } from '$lib/state/sources/registries/venues';

    type Props = { venues: Venue[]; todayMonth: number };

    let { venues, todayMonth }: Props = $props();

    const data = $derived(timeline(venues, todayMonth));
    const bars = $derived(sparkBars(data.counts));
    const monthLabels = $derived(t('venues.months').split(','));

    function short(venue: Venue): string {
        return venue.short ?? venue.name;
    }

    function tip(chip: TimelineChip, kind: string, month: string): string {
        const timing =
            chip.venue.timing === undefined ? '' : `${t('venues.sep')}${chip.venue.timing}`;
        return (
            t('venues.tip', chip.venue.name, kind, month, timing) +
            (chip.biennial ? t('venues.biennial_caveat') : '')
        );
    }

    function monthLabel(index: number): string {
        return monthLabels[index - 1] ?? '';
    }
</script>

<Surface>
    {#if data.next.length > 0}
        <div class="next">
            <strong>
                <Glyph name="timing" />
                {t('venues.next')}
            </strong>
            <span>{t('venues.next_from', monthLabel(todayMonth))}</span>
            {#each data.next as item (item.venue.id)}
                <span class="nextitem" title={item.venue.name}>
                    {short(item.venue)}
                    <i>
                        {item.distance === 0
                            ? t('venues.thismonth')
                            : t('venues.dist', item.distance)}
                    </i>
                </span>
            {/each}
        </div>
    {/if}

    <div class="spark" title={t('venues.spark_tip', Math.max(...data.counts, 0))}>
        <span class="spark-label">{t('venues.spark_lbl')}</span>
        <svg
            class="bars"
            viewBox={`0 0 ${bars.length} ${SPARK_HEIGHT}`}
            preserveAspectRatio="none"
            style={`width: ${bars.length * 0.6}em`}
            aria-hidden="true"
        >
            {#each bars as height, at (at)}
                <rect
                    x={at + 0.1}
                    y={SPARK_HEIGHT - height}
                    width="0.8"
                    {height}
                    fill="currentColor"
                />
            {/each}
        </svg>
        <span class="spark-months"
            >{data.months.map((month) => monthLabel(month.index)[0]).join('')}</span
        >
    </div>

    <div class="legend">
        <span class="deadline">
            <Tag label={t('venues.leg_deadline')} glyph="linkedin" />
        </span>
        <span class="held">
            <Tag label={t('venues.leg_held')} glyph="active" />
        </span>
        <Tag label={t('venues.leg_biennial')} glyph="refresh" />
        <Tag label={t('venues.leg_thismonth')} glyph="current_month" />
        <span>{t('venues.leg_approx')}</span>
    </div>
</Surface>

<div class="ribbon">
    {#each data.months as month (month.index)}
        <div class="month" class:current={month.current} data-surface>
            <div class="monthname">
                {#if month.current}
                    <Glyph name="current_month" />
                {/if}
                {monthLabel(month.index)}
            </div>
            {#each month.deadlines as chip (chip.venue.id)}
                <Tooltip text={tip(chip, t('venues.deadline'), monthLabel(month.index))}>
                    <span class="timed deadline">
                        <Tag label={short(chip.venue)} glyph="linkedin" />
                        {#if chip.biennial}
                            <Glyph name="refresh" />
                        {/if}
                    </span>
                </Tooltip>
            {/each}
            {#each month.held as chip (chip.venue.id)}
                <Tooltip text={tip(chip, t('venues.held'), monthLabel(month.index))}>
                    <span class="timed held">
                        <Tag label={short(chip.venue)} glyph="active" />
                        {#if chip.biennial}
                            <Glyph name="refresh" />
                        {/if}
                    </span>
                </Tooltip>
            {/each}
        </div>
    {/each}
</div>

<style>
    .next,
    .legend {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        color: var(--muted-txt, var(--muted));
    }

    .next {
        font-size: var(--fs-sm);
    }

    .legend {
        font-size: var(--fs-sm);
    }

    /* A deadline is one row of the tree's height, its venue in the main size and its distance in
       the secondary one. */
    .nextitem {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        padding-left: 6px;
        border-left: 1px solid var(--line);
        font-size: var(--fs-md);
    }

    .nextitem i {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
    }

    .spark {
        display: none;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    /* Each bar is 0.6em wide and the line 1em high, the box a character of the same size takes,
       and the bars are drawn in the text colour. */
    .spark .bars {
        height: 1em;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-xl);
    }

    .spark-label {
        font-size: var(--fs-xs);
    }

    .spark-months {
        font-size: var(--fs-xs);
    }

    :global(body.rice) .spark {
        display: flex;
    }

    .ribbon {
        display: grid;
        grid-template-columns: repeat(12, minmax(74px, 1fr));
        gap: 4px;
        min-width: 900px;
        margin-bottom: 12px;
    }

    /* The column may shrink under its content, so a tag of a venue with no short name is cut at
       the column's own edge with an ellipsis rather than pushed over its neighbour. */
    .month {
        min-width: 0;
        min-height: 54px;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
    }

    /* Over a wallpaper each month is the one translucent layer under its tags, so it carries
       `data-surface`; inside a surface already (a free float's fill) it paints nothing. */
    :global(body.wall) .month {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .month {
        background: transparent;
        backdrop-filter: none;
    }

    .month.current {
        border-color: var(--accent);
    }

    .monthname {
        margin-bottom: 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        font-weight: 700;
    }

    .timed {
        display: flex;
        align-items: center;
        min-width: 0;
        margin-top: 3px;
    }

    /* A deadline and a conference being held are told apart by the colour of the tag's mark: the
       icon is drawn in the text colour it inherits, so painting it through the wrapper paints the
       mark and leaves the tag's own words muted, and the biennial marker beside the tag keeps its
       own ink. The legend carries the same two wrappers. */
    .deadline :global(.tag .glyph) {
        color: var(--c-violet-txt);
    }

    .held :global(.tag .glyph) {
        color: var(--c-green-txt);
    }
</style>
