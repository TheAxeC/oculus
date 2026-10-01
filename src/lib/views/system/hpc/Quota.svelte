<script lang="ts">
    // Layer 3, view partial. Disk quota rows use the shared meter primitive and tone thresholds
    // used by other capacity gauges.
    import Meter from '$lib/ui/display/Meter.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { HpcQuotaItem } from '$lib/state/system/hpc';
    let { rows }: { rows: HpcQuotaItem[] } = $props();
    const tone = (pct: number): string => (pct >= 90 ? 'red' : pct >= 75 ? 'amber' : 'green');
</script>

<section class="quota">
    {#if rows.length}
        <h3>{t('hpc.disk')}</h3>
    {/if}
    <div class="meters">
        {#each rows as row (row.name)}
            <Meter
                value={row.pct / 100}
                tone={tone(row.pct)}
                label={t('hpc.disk_label', row.name)}
                text={t('hpc.used_of', row.used, row.limit, row.pct)}
            />
        {/each}
    </div>
</section>

<style>
    .quota {
        min-width: 0;
    }
    .meters {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr));
        gap: 4px 16px;
    }
    h3 {
        margin: 0 0 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        color: var(--muted-txt, var(--muted));
    }
</style>
