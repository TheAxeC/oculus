<script lang="ts">
    // Layer 3, view partial. One cluster's section of Live HPC, under the cluster's name: its head
    // (Head.svelte) with its status and its own refresh, what its connection resolves to (the
    // `hostname`, `user`, `port` and `identityfile` that `ssh -G` printed for the options the poll
    // connects with), its capacity, queue, recent jobs, quota, Login node and one selected log.
    // The refresh control is in the head while the poll answers, and is the retry of the error box
    // while it fails; the box says which of the three failures it is, with the kind and the fix of
    // the hub's `connections.failures` row that told it apart when one did, or, when the cluster
    // answered for the queue and Slurm did not for a table, that the tables marked stale are older
    // than the queue. While the queue is this poll's the queue's controls, the log and the Login
    // node section stay live. While the queue is not this poll's, Capacity, Quota, Jobs and Recent
    // are each drawn only when they hold kept rows or, for Capacity and Recent, when the payload
    // names them in `stale`, so no empty queue is shown for a cluster that did not answer. A table
    // the payload names in `stale` carries its mark in its heading, and with no rows it draws its
    // heading and mark alone, whatever the status. Every press names this cluster, so a cancel or
    // a log reaches the job on the cluster its row came from.
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Head from './Head.svelte';
    import Capacity from './Capacity.svelte';
    import Jobs from './Jobs.svelte';
    import Log from './Log.svelte';
    import Login from './Login.svelte';
    import Quota from './Quota.svelte';
    import Recent from './Recent.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        failureWords,
        queueIsCurrent,
        type HpcPayload,
        type HpcViewState
    } from '$lib/state/system/machine/hpc/hpc';

    let {
        data,
        held,
        onheld
    }: {
        data: HpcPayload;
        /** The folds of the pane, which every cluster's section draws alike. */
        held: HpcViewState;
        onheld: (next: HpcViewState) => void;
    } = $props();

    const {
        hpc: { command, jobLog }
    } = useState();

    /** Whether the queue on screen is this poll's, so the controls asking the cluster are live. */
    const live = $derived(queueIsCurrent(data));
    let logId = $state('');
    let logStatus = $state('');
    let logOutput = $state('');

    /**
     * The words of a failed poll, for the error box and the Login node section: the kind and the
     * fix of the row that told the failure apart, else the failure's own sentence, and the hint
     * under it as code when there is one (ssh's line, Slurm's message or the poll's). While there
     * is no host to ask, the hint is the sentence for why and stands alone.
     */
    function failureMessage(payload: HpcPayload): string {
        const { hint, host, failure } = payload;
        if (host === '' && hint !== undefined && hint !== '') return hint;
        const sentence =
            failure === undefined
                ? (failureWords(payload)?.sentence ?? '')
                : t('hpc.failure_told', failure.kind, failure.fix);
        return hint === undefined || hint === ''
            ? sentence
            : t('hpc.unreachable_detail', sentence, hint);
    }

    /** What the connection resolves to, in one line, or empty before `ssh -G` answered. */
    const resolution = $derived.by(() => {
        const read = data.resolution;
        if (read === undefined) return '';
        if ('error' in read) return t('hpc.resolution_error', read.error);
        const keys = read.identityfile.length === 0 ? t('hpc.none') : read.identityfile.join(', ');
        return t('hpc.resolution', read.hostname, read.user, read.port, keys);
    });

    async function refresh(): Promise<void> {
        await command({ action: 'refresh', resource: data.resource });
    }
    async function cancel(id: string): Promise<void> {
        await command({ action: 'cancel', resource: data.resource, id });
    }
    async function showLog(id: string): Promise<void> {
        logId = id;
        logStatus = 'loading';
        const answer = await jobLog(data.resource, id);
        logStatus = answer.status;
        logOutput = answer.output;
    }
</script>

<section class="cluster" data-cluster={data.resource} aria-label={data.name}>
    <h3>{data.name}</h3>
    <Head {data} onrefresh={refresh} />
    {#if resolution !== ''}
        <p class="resolution">{resolution}</p>
    {/if}
    {#if data.status === 'starting'}
        <Empty message={t('hpc.fetching')} />
    {:else if data.status !== 'ok'}
        <Empty error message={failureMessage(data)}>
            {#snippet action()}
                <ToolButton small label={t('hpc.refresh_now')} onclick={refresh} />
            {/snippet}
        </Empty>
    {/if}
    {#if live || data.sinfo.length > 0 || data.stale?.sinfo !== undefined}
        <Capacity rows={data.sinfo} stale={data.stale?.sinfo} {held} {onheld} />
    {/if}
    {#if live || data.quota.length > 0}
        <Quota rows={data.quota} />
    {/if}
    {#if live || data.jobs.length > 0}
        <Jobs rows={data.jobs} {live} onlog={showLog} oncancel={cancel} />
    {/if}
    {#if live || data.recent.length > 0 || data.stale?.recent !== undefined}
        <Recent
            rows={data.recent}
            stale={data.stale?.recent}
            {live}
            {held}
            {onheld}
            onlog={showLog}
        />
    {/if}
    {#if data.status !== 'starting'}
        <Login
            resource={data.resource}
            reason={live ? '' : failureMessage(data)}
            open={held.login}
            ontoggle={() => onheld({ ...held, login: !held.login })}
        />
    {/if}
    {#if logId}
        <Log
            id={logId}
            {live}
            status={logStatus}
            output={logOutput}
            onrefresh={() => showLog(logId)}
            onclose={() => (logId = '')}
        />
    {/if}
    {#if data.host !== ''}
        <footer>{t('hpc.footer', data.host)}</footer>
    {/if}
</section>

<style>
    .cluster {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
    }
    h3 {
        margin: 0;
        font-size: var(--fs-md);
        font-weight: 600;
    }
    .resolution {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        overflow-wrap: anywhere;
    }
    footer {
        margin-top: 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
