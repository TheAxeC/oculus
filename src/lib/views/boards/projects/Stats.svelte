<script lang="ts">
    // Layer 3, view partial of views/boards/projects/Projects.svelte. The strip above the Projects
    // board: how many projects it holds, how many are ready to go out, how many are waiting on
    // somebody, how many are dated, and where they are aimed.
    //
    // It counts nothing itself. state/boards/board/'s stats() is the counting, over the board's own
    // projects before any filter, so the strip says what the board is rather than what a search has
    // left on screen. A venue at or over `venue_conc_warn` is marked: that is the config's own
    // threshold for too much of one board on one venue.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { BoardStats } from '$lib/state/boards/board';

    type Props = { stats: BoardStats };

    let { stats }: Props = $props();
</script>

<div class="stats" aria-label={t('board.stats')}>
    <span class="st">{t('board.stat_active', stats.active)}</span>
    <span class="st">{t('board.stat_submit_ready', stats.submitReady)}</span>
    <span class="st">{t('board.stat_blocked', stats.blocked)}</span>
    {#if stats.dated > 0}
        <span class="st">
            <Glyph name={t('project.card.deadline_glyph')} />
            {t('board.stat_dated', stats.dated)}
        </span>
    {/if}
    {#if stats.venues.length > 0}
        <span class="venues" title={t('board.stat_venues_tip')}>
            <Glyph name={t('board.venue_dist_glyph')} />
            {#each stats.venues as venue (venue.id)}
                <span title={t('board.stat_venue_tip', venue.name, venue.count)}>
                    <Tag
                        label={venue.count > 1
                            ? `${venue.short} ${t('board.stat_venue_count', venue.count)}`
                            : venue.short}
                        glyph={venue.warn ? t('board.warn_glyph') : undefined}
                        tone={venue.warn ? 'amber' : undefined}
                    />
                </span>
            {/each}
        </span>
    {/if}
</div>

<style>
    .stats,
    .venues {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .stats {
        margin-bottom: 8px;
    }

    .st {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
