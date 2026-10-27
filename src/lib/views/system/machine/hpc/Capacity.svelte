<script lang="ts">
    // Layer 3, view partial. Partition rows aggregate sinfo into idle, mixed, and allocated
    // segments while retaining the full source table. The meters and the table are the group every
    // grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), headed Cluster capacity
    // with the count of partitions, and the table folds again inside it; both folds stand as the
    // pane holds them. Rows older than the queue carry the stale mark at the right end of the
    // heading, which is drawn even with no rows, so the mark shows; with no rows the group holds no
    // meters and no sinfo table.
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import StaleMark from './StaleMark.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import type { Column } from '$lib/ui/display/table/table-rows';
    import {
        partitionMeters,
        toggledHpcState,
        type HpcPartition,
        type HpcViewState
    } from '$lib/state/system/machine/hpc/hpc';
    import { t } from '$lib/state/shared/words/text';
    let {
        rows,
        stale,
        held,
        onheld
    }: {
        rows: HpcPartition[];
        /**
         * The time the rows came from when they are older than the queue, null when no poll has
         * read them since the server started, and undefined when they are the queue's.
         */
        stale?: string | null;
        /** The folds as this pane holds them. */
        held: HpcViewState;
        /** Keep the folds' new state in the pane's instance state. */
        onheld: (next: HpcViewState) => void;
    } = $props();
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

    /** The sinfo table's summary: one row, or that many rows. */
    function summary(count: number): string {
        return count === 1 ? t('hpc.capacity_summary_one') : t('hpc.capacity_summary', count);
    }

    /**
     * Keep the sinfo table's new fold. The toggle the `open` attribute itself fires finds the fold
     * already as held and writes nothing.
     */
    function toggled(event: Event & { currentTarget: HTMLDetailsElement }): void {
        const next = toggledHpcState(held, 'sinfo', event.currentTarget.open);
        if (next !== null) onheld(next);
    }
</script>

<!-- A grid of small meters, several to a row, so twenty partitions do not push the queue off the
     screen: the queue is what the view is opened for, and the capacity is the glance above it. -->
{#if meters.length || stale !== undefined}
    <GroupHead
        data-capacity
        label={t('hpc.capacity_title')}
        count={meters.length}
        open={held.capacity}
        ontoggle={() => onheld({ ...held, capacity: !held.capacity })}
    >
        {#snippet actions()}
            <StaleMark {stale} />
        {/snippet}
        {#if rows.length}
            <div class="meters">
                {#each meters as meter (meter.name)}
                    <div class="meter">
                        <span class="name">{meter.name}</span>
                        {#if meter.gpu}
                            <Tag label={t('hpc.gpu')} tone="violet" />
                        {/if}
                        <span class="bar" aria-label={t('hpc.capacity_label', meter.name)}>
                            <i class="idle" style={`flex:${meter.idle}`}></i>
                            <i class="mixed" style={`flex:${meter.mixed}`}></i>
                            <i class="allocated" style={`flex:${meter.allocated}`}></i>
                        </span>
                        <span class="count">{t('hpc.idle_count', meter.idle)}</span>
                    </div>
                {/each}
            </div>
            <details class="sinfo" open={held.sinfo} ontoggle={toggled}>
                <summary>{summary(rows.length)}</summary>
                <div class="scroll">
                    <Table {columns} rows={tableRows} rowKey="key" />
                </div>
            </details>
        {/if}
    </GroupHead>
{/if}

<style>
    /* The meters, with the space between them and the sinfo table under them. */
    .meters {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr));
        gap: 4px 16px;
        margin-bottom: 10px;
    }
    .meter {
        display: flex;
        gap: 8px;
        align-items: center;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }
    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
    }
    .count {
        font-size: var(--fs-sm);
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
    /* The sinfo table's disclosure words. */
    summary {
        cursor: pointer;
        font-size: var(--fs-sm);
    }
    summary:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: 1px;
    }
    /* A table wider than the pane scrolls inside its own box. */
    .scroll {
        min-width: 0;
        overflow-x: auto;
    }
</style>
