<script lang="ts">
    // Layer 3, view partial. Finished jobs stay collapsed and show memory and CPU efficiency tones with an on-demand log action.
    import Chip from '$lib/ui/Chip.svelte';
    import Table, { type Column } from '$lib/ui/Table.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { efficiencyTone, type HpcRecent } from '$lib/state/hpc';
    import { t } from '$lib/state/text';
    let { rows, onlog }: { rows: HpcRecent[]; onlog: (id: string) => void } = $props();
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
    {#if column.key === 'state'}<Chip
            label={String(row.state)}
            tone={String(row.state) === 'COMPLETED'
                ? 'green'
                : String(row.state) === 'CANCELLED'
                  ? 'slate'
                  : 'red'}
        />
    {:else if column.key === 'mem'}<Chip
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
    {:else if column.key === 'cpu'}<Chip
            label={row.cpuPct === null ? t('hpc.none') : t('hpc.percent', Number(row.cpuPct))}
            tone={efficiencyTone(row.cpuPct as number | null)}
        />
    {:else if column.key === 'actions'}<ToolButton
            label={t('js.slurm.log')}
            onclick={() => onlog(String(row.id))}
        />
    {:else}{String(row[column.key] ?? '')}{/if}
{/snippet}
{#if rows.length}<details>
        <summary>{t('js.slurm.recent_summary', rows.length)}</summary><Table
            {columns}
            rows={tableRows}
            rowKey="id"
            {cell}
        />
    </details>{/if}

<style>
    details :global(table) {
        font-size: var(--fs-sm);
    }
</style>
