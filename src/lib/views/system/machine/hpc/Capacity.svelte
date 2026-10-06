<script lang="ts">
    // Layer 3, view partial. Partition rows aggregate sinfo into idle, mixed, and allocated
    // segments while retaining the full source table. The meters and the table fold as one section,
    // and the table folds again inside it; both folds stand as the pane holds them.
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Table from '$lib/ui/display/Table.svelte';
    import type { Column } from '$lib/ui/display/table-rows';
    import {
        partitionMeters,
        toggledHpcState,
        type HpcPartition,
        type HpcViewState
    } from '$lib/state/system/machine/hpc/hpc';
    import { t } from '$lib/state/shared/words/text';
    let {
        rows,
        held,
        onheld
    }: {
        rows: HpcPartition[];
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

    /** The capacity section's heading: one partition, or that many partitions. */
    function title(count: number): string {
        return count === 1 ? t('hpc.capacity_title_one') : t('hpc.capacity_title', count);
    }

    /** The sinfo table's summary: one row, or that many rows. */
    function summary(count: number): string {
        return count === 1 ? t('hpc.capacity_summary_one') : t('hpc.capacity_summary', count);
    }

    /**
     * Keep a fold's new state. The toggle the `open` attribute itself fires finds the fold already
     * as held and writes nothing; `toggle` does not bubble, so the inner fold's never reaches here
     * for the outer one.
     */
    function toggled(
        key: keyof HpcViewState,
        event: Event & { currentTarget: HTMLDetailsElement }
    ): void {
        const next = toggledHpcState(held, key, event.currentTarget.open);
        if (next !== null) onheld(next);
    }
</script>

<!-- A grid of small meters, several to a row, so twenty partitions do not push the queue off the
     screen: the queue is what the view is opened for, and the capacity is the glance above it. -->
{#if meters.length}
    <details class="capacity" open={held.capacity} ontoggle={(event) => toggled('capacity', event)}>
        <summary class="title">{title(meters.length)}</summary>
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
        <details class="sinfo" open={held.sinfo} ontoggle={(event) => toggled('sinfo', event)}>
            <summary>{summary(rows.length)}</summary>
            <div class="scroll">
                <Table {columns} rows={tableRows} rowKey="key" />
            </div>
        </details>
    </details>
{/if}

<style>
    .meters {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr));
        gap: 4px 16px;
    }
    /* The view's own gap between its parts, kept inside the capacity fold. */
    .capacity > .meters {
        margin-block: 10px;
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
    /* The section's heading is the outer summary; the inner one is a disclosure's words. */
    summary {
        cursor: pointer;
        font-size: var(--fs-sm);
    }
    summary.title {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        color: var(--muted-txt, var(--muted));
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
