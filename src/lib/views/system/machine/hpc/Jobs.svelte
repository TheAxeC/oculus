<script lang="ts">
    // Layer 3, view partial. The queue exposes every squeue field, with cancellation behind Confirm
    // and logs limited to running jobs. An empty queue is said with the Empty primitive. The rows
    // are the Table primitive's, so a row is one line of the tree's row height; a row's controls
    // are drawn while the pointer is over the row or the focus is inside it.
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Meter from '$lib/ui/display/Meter.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import { type Column, cellText } from '$lib/ui/display/table/table-rows';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        startLabel,
        stateTone,
        walltimeFraction,
        type HpcJob
    } from '$lib/state/system/machine/hpc/hpc';
    import { t } from '$lib/state/shared/words/text';
    let {
        rows,
        live,
        onlog,
        oncancel
    }: {
        rows: HpcJob[];
        /**
         * Whether the cluster is answering; a control that would run a doomed ssh command is shown
         * and not pressable.
         */
        live: boolean;
        onlog: (id: string) => void;
        oncancel: (id: string) => void;
    } = $props();
    let asking: string | null = $state(null);
    const columns: Column[] = [
        { key: 'id', label: t('hpc.col_job') },
        { key: 'name', label: t('hpc.col_name') },
        { key: 'partition', label: t('hpc.col_partition') },
        { key: 'state', label: t('hpc.col_state') },
        { key: 'time', label: t('hpc.col_time') },
        { key: 'limit', label: t('hpc.col_limit') },
        { key: 'used', label: t('hpc.col_used') },
        { key: 'nodes', label: t('hpc.col_nodes') },
        { key: 'cpus', label: t('hpc.col_cpu') },
        { key: 'gpus', label: t('hpc.col_gpu_col') },
        { key: 'mem', label: t('hpc.col_mem') },
        { key: 'priority', label: t('hpc.col_prio') },
        { key: 'start', label: t('hpc.col_start') },
        { key: 'reason', label: t('hpc.col_reason') },
        { key: 'actions', label: t('hpc.col_actions') }
    ];
    /** One row as the table draws it: the words of the dashes already filled in. */
    const tableRows = $derived(
        rows.map((row) => ({
            ...row,
            used: walltimeFraction(row),
            gpus: row.gpus || t('hpc.none'),
            mem: row.mem || t('hpc.none'),
            priority: row.priority || t('hpc.none'),
            start: startLabel(row.start) || t('hpc.none'),
            actions: row.id
        }))
    );
</script>

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {#if column.key === 'state'}
        <Tag label={cellText(row.state)} tone={stateTone(cellText(row.state))} />
    {:else if column.key === 'used'}
        {#if typeof row.used === 'number'}
            <Meter
                value={row.used}
                label={t('hpc.walltime')}
                text={`${Math.round(row.used * 100)}%`}
            />
        {:else}
            {t('hpc.none')}
        {/if}
    {:else if column.key === 'actions'}
        <span class="reveal">
            <ToolButton
                small
                label={t('hpc.cancel_ok')}
                disabled={!live}
                title={live ? undefined : t('hpc.controls_offline')}
                onclick={() => (asking = cellText(row.id))}
            />
            {#if row.state === 'RUNNING'}
                <ToolButton
                    small
                    label={t('hpc.log')}
                    disabled={!live}
                    title={live ? undefined : t('hpc.controls_offline')}
                    onclick={() => onlog(cellText(row.id))}
                />
            {/if}
        </span>
    {:else}
        {cellText(row[column.key])}
    {/if}
{/snippet}

{#if rows.length === 0}
    <Empty message={t('hpc.no_jobs')} />
{:else}
    <div class="scroll">
        <Table {columns} rows={tableRows} rowKey="id" {cell} />
    </div>
{/if}
{#if asking}
    <Confirm
        message={t('hpc.cancel_confirm', asking)}
        confirm={t('hpc.cancel_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            const id = asking ?? '';
            asking = null;
            oncancel(id);
        }}
        oncancel={() => (asking = null)}
    />
{/if}

<style>
    /* A table wider than the pane scrolls inside its own box. */
    .scroll {
        min-width: 0;
        overflow-x: auto;
    }

    /* A row's controls are drawn while the pointer is over the row or the focus is inside it, and
       always where nothing hovers. They stay in the layout and in the tab order while clear. */
    .scroll :global(tr) {
        --row-reveal: 0;
    }

    .scroll :global(tr:hover),
    .scroll :global(tr:focus-within) {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .scroll :global(tr) {
            --row-reveal: 1;
        }
    }

    .reveal {
        display: inline-flex;
        gap: 4px;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }
</style>
