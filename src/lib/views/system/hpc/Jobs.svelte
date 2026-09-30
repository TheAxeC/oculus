<script lang="ts">
    // Layer 3, view partial. The queue exposes every squeue field, with cancellation behind Confirm
    // and logs limited to running jobs. An empty queue is said with the Empty primitive.
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Meter from '$lib/ui/display/Meter.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { startLabel, stateTone, walltimeFraction, type HpcJob } from '$lib/state/system/hpc';
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

{#if rows.length === 0}<Empty message={t('hpc.no_jobs')} />{:else}
    <div class="scroll">
        <table>
            <thead
                ><tr
                    >{#each heads as head (head)}<th>{head}</th>{/each}</tr
                ></thead
            ><tbody>
                {#each rows as row (row.id)}{@const fraction = walltimeFraction(row)}<tr>
                        <td>{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.partition}</td>
                        <td>
                            <Tag label={row.state} tone={stateTone(row.state)} />
                        </td>
                        <td>{row.time}</td>
                        <td>{row.limit}</td>
                        <td
                            >{#if fraction !== null}<Meter
                                    value={fraction}
                                    label={t('hpc.walltime')}
                                    text={`${Math.round(fraction * 100)}%`}
                                />{:else}{t('hpc.none')}{/if}</td
                        >
                        <td>{row.nodes}</td>
                        <td>{row.cpus}</td>
                        <td>{row.gpus || t('hpc.none')}</td>
                        <td>{row.mem || t('hpc.none')}</td>
                        <td>{row.priority || t('hpc.none')}</td>
                        <td>{startLabel(row.start) || t('hpc.none')}</td>
                        <td>{row.reason}</td>
                        <td class="actions"
                            ><ToolButton
                                label={t('hpc.cancel_ok')}
                                disabled={!live}
                                title={live ? undefined : t('hpc.controls_offline')}
                                onclick={() => (asking = row.id)}
                            />{#if row.state === 'RUNNING'}<ToolButton
                                    label={t('hpc.log')}
                                    disabled={!live}
                                    title={live ? undefined : t('hpc.controls_offline')}
                                    onclick={() => onlog(row.id)}
                                />{/if}</td
                        >
                    </tr>{/each}</tbody
            >
        </table>
    </div>{/if}
{#if asking}<Confirm
        message={t('hpc.cancel_confirm', asking)}
        confirm={t('hpc.cancel_ok')}
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
