<script lang="ts">
    // Layer 3, view partial. Disk quota rows use the shared meter primitive and tone thresholds
    // used by other capacity gauges. The rows are the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), headed Disk and folded under the key `quota` in the
    // pane's state (views/shared/card/pane-fold.ts); with no row there is no group.
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Meter from '$lib/ui/display/meters/Meter.svelte';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { t } from '$lib/state/shared/words/text';
    import type { HpcQuotaItem } from '$lib/state/system/machine/hpc/hpc';
    let { rows }: { rows: HpcQuotaItem[] } = $props();
    const tone = (pct: number): string => (pct >= 90 ? 'red' : pct >= 75 ? 'amber' : 'green');

    /** Whether the group is open, kept in the pane's state. */
    const fold = usePaneFold();
</script>

{#if rows.length}
    <GroupHead
        data-quota
        label={t('hpc.disk')}
        open={fold.open('quota')}
        ontoggle={() => fold.toggle('quota')}
    >
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
    </GroupHead>
{/if}

<style>
    .meters {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr));
        gap: 4px 16px;
    }
</style>
