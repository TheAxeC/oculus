<script lang="ts">
    // Layer 3, view partial. Finished jobs stay collapsed and show memory and CPU efficiency tones
    // with an on-demand log action, drawn while the pointer is over the row or the focus is inside
    // it.
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Table from '$lib/ui/display/Table.svelte';
    import { type Column, cellText } from '$lib/ui/display/table-rows';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { efficiencyTone, type HpcRecent } from '$lib/state/system/machine/hpc';
    import { t } from '$lib/state/shared/words/text';
    let {
        rows,
        live,
        onlog
    }: {
        rows: HpcRecent[];
        /**
         * Whether the cluster is answering; a control that would run a doomed ssh command is shown
         * and not pressable.
         */
        live: boolean;
        onlog: (id: string) => void;
    } = $props();
    const columns: Column[] = [
        { key: 'job', label: t('hpc.col_job') },
        { key: 'name', label: t('hpc.col_name') },
        { key: 'state', label: t('hpc.col_state') },
        { key: 'exit', label: t('hpc.col_exit') },
        { key: 'elapsed', label: t('hpc.col_elapsed') },
        { key: 'mem', label: t('hpc.col_mem') },
        { key: 'cpu', label: t('hpc.col_cpu') },
        { key: 'end', label: t('hpc.col_end') },
        { key: 'actions', label: t('hpc.col_actions') }
    ];
    const tableRows = $derived(
        rows.map((row) => ({
            ...row,
            job: row.id,
            mem: row.memPct,
            cpu: row.cpuPct,
            actions: row.id
        }))
    );
</script>

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {#if column.key === 'state'}
        <Tag
            label={String(row.state)}
            tone={String(row.state) === 'COMPLETED'
                ? 'green'
                : String(row.state) === 'CANCELLED'
                  ? 'slate'
                  : 'red'}
        />
    {:else if column.key === 'mem'}
        <Tag
            label={row.memPct === null
                ? t('hpc.none')
                : t(
                      'hpc.memory_efficiency',
                      String(row.memUsed),
                      String(row.memReq),
                      Number(row.memPct)
                  )}
            tone={efficiencyTone(row.memPct as number | null)}
        />
    {:else if column.key === 'cpu'}
        <Tag
            label={row.cpuPct === null ? t('hpc.none') : t('hpc.percent', Number(row.cpuPct))}
            tone={efficiencyTone(row.cpuPct as number | null)}
        />
    {:else if column.key === 'actions'}
        <span class="reveal">
            <ToolButton
                small
                label={t('hpc.log')}
                disabled={!live}
                title={live ? undefined : t('hpc.controls_offline')}
                onclick={() => onlog(cellText(row.id))}
            />
        </span>
    {:else}
        {cellText(row[column.key])}
    {/if}
{/snippet}
{#if rows.length}
    <details>
        <summary>{t('hpc.recent_summary', rows.length)}</summary>
        <div class="scroll">
            <Table {columns} rows={tableRows} rowKey="id" {cell} />
        </div>
    </details>
{/if}

<style>
    /* The section's heading. */
    summary {
        cursor: pointer;
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

    /* A row's control is drawn while the pointer is over the row or the focus is inside it, and
       always where nothing hovers. It stays in the layout and in the tab order while clear. */
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
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }
</style>
