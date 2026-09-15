<script lang="ts">
    // Layer 3, view partial. Partition rows aggregate sinfo into idle, mixed, and allocated segments while retaining the full source table.
    import Tag from '$lib/ui/Tag.svelte';
    import Table from '$lib/ui/Table.svelte';
    import type { Column } from '$lib/ui/table-rows';
    import { partitionMeters, type HpcPartition } from '$lib/state/hpc';
    import { t } from '$lib/state/text';
    let { rows }: { rows: HpcPartition[] } = $props();
    const meters = $derived(partitionMeters(rows));
    // sinfo answers one row per partition and node state, so the partition name repeats and cannot
    // key a row; the key is the row's position, which is unique and which the browser insists on.
    const tableRows = $derived(rows.map((row, at) => ({ ...row, key: `${row.partition}:${at}` })));
    const columns: Column[] = [
        { key: 'partition', label: t('hpc.col_partition') },
        { key: 'avail', label: t('hpc.col_avail') },
        { key: 'nodes', label: t('hpc.col_nodes'), numeric: true },
        { key: 'state', label: t('hpc.col_state') },
        { key: 'gres', label: t('hpc.col_gres') }
    ];
</script>

<!-- A grid of small meters, several to a row, so twenty partitions do not push the queue off the
     screen: the queue is what the view is opened for, and the capacity is the glance above it. -->
<div class="meters">
    {#each meters as meter (meter.name)}
        <div class="meter">
            <span>{meter.name}</span>
            {#if meter.gpu}<Tag label={t('hpc.gpu')} tone="violet" />{/if}
            <span class="bar" aria-label={t('hpc.capacity_label', meter.name)}>
                <i class="idle" style={`flex:${meter.idle}`}></i>
                <i class="mixed" style={`flex:${meter.mixed}`}></i>
                <i class="allocated" style={`flex:${meter.allocated}`}></i>
            </span>
            <span>{t('hpc.idle_count', meter.idle)}</span>
        </div>
    {/each}
</div>
{#if rows.length}<details>
        <summary>{t('hpc.capacity_summary', rows.length)}</summary><Table
            {columns}
            rows={tableRows}
            rowKey="key"
        />
    </details>{/if}

<style>
    .meters {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 4px 16px;
    }
    .meter {
        display: flex;
        gap: 8px;
        align-items: center;
        min-width: 0;
        font-size: var(--fs-sm);
    }
    .meter > span:first-child {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .bar {
        display: flex;
        height: 8px;
        flex: 1;
        background: var(--chip);
        overflow: hidden;
        border-radius: var(--radius-pill);
    }
    i {
        min-width: 0;
    }
    .idle {
        background: var(--c-green);
    }
    .mixed {
        background: var(--c-amber);
    }
    .allocated {
        background: var(--c-red);
    }
    summary {
        cursor: pointer;
        font-size: var(--fs-sm);
    }
    details :global(table) {
        font-size: var(--fs-sm);
    }
</style>
