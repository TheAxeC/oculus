<script lang="ts">
    // Layer 3, Venues view partial. The next conference deadlines and the twelve-month ribbon.
    // Timing and density are prepared by state/venues.ts; this file only assigns the catalog words.

    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Tooltip from '$lib/ui/Tooltip.svelte';
    import { glyph, t } from '$lib/state/text';
    import { sparkline, timeline, type TimelineChip, type Venue } from '$lib/state/venues';

    type Props = { venues: Venue[]; todayMonth: number };

    let { venues, todayMonth }: Props = $props();

    const data = $derived(timeline(venues, todayMonth));
    const spark = $derived(sparkline(data.counts, glyph('spark_blocks')));
    const monthLabels = $derived(t('col.ven_months').split(','));

    function short(venue: Venue): string {
        return venue.short ?? venue.name;
    }

    function tip(chip: TimelineChip, kind: string, month: string): string {
        const timing =
            chip.venue.timing === undefined ? '' : `${t('col.ven_sep')}${chip.venue.timing}`;
        return (
            t('col.ven_tip', chip.venue.name, kind, month, timing) +
            (chip.biennial ? t('col.ven_biennial_caveat') : '')
        );
    }

    function monthLabel(index: number): string {
        return monthLabels[index - 1] ?? '';
    }
</script>

{#if data.next.length > 0}
    <div class="next">
        <strong>
            <Glyph name="timing" />
            {t('col.ven_next')}
        </strong>
        <span>{t('col.ven_next_from', monthLabel(todayMonth))}</span>
        {#each data.next as item (item.venue.id)}
            <span class="nextitem" title={item.venue.name}>
                {short(item.venue)}
                <i>
                    {item.distance === 0
                        ? t('col.ven_thismonth')
                        : t('col.ven_dist', item.distance)}
                </i>
            </span>
        {/each}
    </div>
{/if}

<div class="spark" title={t('col.ven_spark_tip', Math.max(...data.counts, 0))}>
    <span class="spark-label">{t('col.ven_spark_lbl')}</span>
    <pre>{spark}</pre>
    <span class="spark-months"
        >{data.months.map((month) => monthLabel(month.index)[0]).join('')}</span
    >
</div>

<div class="legend">
    <Chip label={t('col.ven_leg_deadline')} glyph="linkedin" />
    <Chip label={t('col.ven_leg_held')} glyph="active" />
    <Chip label={t('col.ven_leg_biennial')} glyph="refresh" />
    <Chip label={t('col.ven_leg_thismonth')} glyph="current_month" />
    <span>{t('col.ven_leg_approx')}</span>
</div>

<div class="ribbon">
    {#each data.months as month (month.index)}
        <div class="month" class:current={month.current}>
            <div class="monthname">
                {#if month.current}
                    <Glyph name="current_month" />
                {/if}
                {monthLabel(month.index)}
            </div>
            {#each month.deadlines as chip (chip.venue.id)}
                <Tooltip text={tip(chip, t('col.ven_deadline'), monthLabel(month.index))}>
                    <span class="timed deadline">
                        <Chip label={short(chip.venue)} glyph="linkedin" />
                        {#if chip.biennial}
                            <Glyph name="refresh" />
                        {/if}
                    </span>
                </Tooltip>
            {/each}
            {#each month.held as chip (chip.venue.id)}
                <Tooltip text={tip(chip, t('col.ven_held'), monthLabel(month.index))}>
                    <span class="timed held">
                        <Chip label={short(chip.venue)} glyph="active" />
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
        font-size: var(--fs-xs);
    }

    .nextitem {
        padding-left: 6px;
        border-left: 1px solid var(--line);
    }

    .nextitem i {
        color: var(--accent-txt, var(--accent));
    }

    .spark {
        display: none;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .spark pre {
        margin: 0;
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-xl);
    }

    .spark-label {
        font-size: var(--fs-xxs);
    }

    .spark-months {
        font-size: var(--fs-3xs);
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

    .month {
        min-height: 54px;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
    }

    .month.current {
        border-color: var(--accent);
    }

    .monthname {
        margin-bottom: 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xxs);
        font-weight: 700;
    }

    .timed {
        display: flex;
        align-items: center;
        margin-top: 3px;
    }

    .deadline :global(.chip) {
        border-color: var(--c-violet);
    }

    .held :global(.chip) {
        border-color: var(--c-green);
    }
</style>
