<script lang="ts">
    // Layer 3, view partial. Disk quota rows use the shared meter primitive and tone thresholds used by other capacity gauges.
    import Meter from '$lib/ui/Meter.svelte';
    import { t } from '$lib/state/text';
    import type { HpcQuotaItem } from '$lib/state/hpc';
    let { rows }: { rows: HpcQuotaItem[] } = $props();
    const tone = (pct: number): string => (pct >= 90 ? 'red' : pct >= 75 ? 'amber' : 'green');
</script>

{#if rows.length}<h3>{t('hpc.disk')}</h3>{/if}
{#each rows as row (row.name)}<Meter
        value={row.pct / 100}
        tone={tone(row.pct)}
        label={t('hpc.disk_label', row.name)}
        text={t('hpc.used_of', row.used, row.limit, row.pct)}
    />{/each}
