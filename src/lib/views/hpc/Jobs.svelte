<script lang="ts">
    // Layer 3, view partial. The queue exposes every squeue field, with cancellation behind Confirm and logs limited to running jobs.
    import Chip from '$lib/ui/Chip.svelte';
    import Confirm from '$lib/ui/Confirm.svelte';
    import Meter from '$lib/ui/Meter.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { startLabel, stateTone, walltimeFraction, type HpcJob } from '$lib/state/hpc';
    import { t } from '$lib/state/text';
    let {
        rows,
        onlog,
        oncancel
    }: { rows: HpcJob[]; onlog: (id: string) => void; oncancel: (id: string) => void } = $props();
    let asking: string | null = $state(null);
    const heads = [
        t('hpc.col_job'),
        t('hpc.col_name'),
        t('hpc.col_partition'),
        t('hpc.col_state'),
        t('hpc.col_time'),
        t('hpc.col_limit'),
        t('hpc.col_used'),
        t('hpc.col_nodes'),
        t('hpc.col_cpu'),
        t('hpc.col_gpu_col'),
        t('hpc.col_mem'),
        t('hpc.col_prio'),
        t('hpc.col_start'),
        t('hpc.col_reason'),
        t('hpc.col_actions')
    ];
</script>

{#if rows.length === 0}<p>{t('js.slurm.no_jobs')}</p>{:else}
    <div class="scroll">
        <table>
            <thead
                ><tr
                    >{#each heads as head (head)}<th>{head}</th>{/each}</tr
                ></thead
            ><tbody>
                {#each rows as row (row.id)}{@const fraction = walltimeFraction(row)}<tr>
                        <td>{row.id}</td><td>{row.name}</td><td>{row.partition}</td><td
                            ><Chip label={row.state} tone={stateTone(row.state)} /></td
                        ><td>{row.time}</td><td>{row.limit}</td>
                        <td
                            >{#if fraction !== null}<Meter
                                    value={fraction}
                                    label={t('hpc.walltime')}
                                    text={`${Math.round(fraction * 100)}%`}
                                />{:else}{t('hpc.none')}{/if}</td
                        >
                        <td>{row.nodes}</td><td>{row.cpus}</td><td>{row.gpus || t('hpc.none')}</td
                        ><td>{row.mem || t('hpc.none')}</td><td>{row.priority || t('hpc.none')}</td
                        ><td>{startLabel(row.start) || t('hpc.none')}</td><td>{row.reason}</td>
                        <td class="actions"
                            ><ToolButton
                                label={t('js.slurm.cancel_ok')}
                                onclick={() => (asking = row.id)}
                            />{#if row.state === 'RUNNING'}<ToolButton
                                    label={t('js.slurm.log')}
                                    onclick={() => onlog(row.id)}
                                />{/if}</td
                        >
                    </tr>{/each}</tbody
            >
        </table>
    </div>{/if}
{#if asking}<Confirm
        message={t('js.slurm.cancel_confirm', asking)}
        confirm={t('js.slurm.cancel_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            const id = asking ?? '';
            asking = null;
            oncancel(id);
        }}
        oncancel={() => (asking = null)}
    />{/if}

<style>
    .scroll {
        overflow-x: auto;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-sm);
    }
    th,
    td {
        padding: 4px 6px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        white-space: nowrap;
    }
    .actions {
        display: flex;
        gap: 4px;
    }
</style>
