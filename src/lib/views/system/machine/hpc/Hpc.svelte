<script module lang="ts">
    // Layer 3, view registration. Live HPC is the first tab of the float docked at the right edge
    // that config/defaults/layout.yml ships, before Usage, and the first entry of the catalogue's
    // Float group, which `w` then `1` opens.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'hpc',
        label: 'views.hpc',
        glyph: 'views.hpc_glyph',
        group: 'float',
        order: 0,
        unique: true,
        badge: (client) => client.hpc.badgeText(),
        badgeTitle: (client) => client.railBadges.queueBadgeTitle(),
        badgeCells: (client) => client.railBadges.queueCells(),
        badgeTabText: () => '',
        countPart: (client) => client.railBadges.queuePart()
    };
</script>

<script lang="ts">
    // Layer 3, view. Live HPC composes the socket state, explicit actions, capacity, queue, recent
    // jobs, quota, oculus's Recover sessions on the login node (Login.svelte), and one selected
    // log. The refresh control is in the bar while the poll answers, and is the retry of the error
    // box while it fails; the box says which of the three failures it is, or, when the cluster
    // answered for the queue and Slurm did not for a table, that the tables marked stale are older
    // than the queue. While the queue is this poll's the queue's controls, the log and the Login
    // node section stay live. While the queue is not this poll's, Capacity, Quota, Jobs and Recent
    // are each drawn only when they hold kept rows or, for Capacity and Recent, when the payload
    // names them in `stale`, so no empty queue is shown for a cluster that did not answer. A table
    // the payload names in `stale` carries its mark in its heading, and with no rows it draws its
    // heading and mark alone, whatever the status. A hub whose settings name no cluster
    // (`unconfigured`) shows the sentence that says so alone, in no error tone and with no retry,
    // since there is nothing to ask.
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Head from './Head.svelte';
    import Capacity from './Capacity.svelte';
    import Jobs from './Jobs.svelte';
    import Log from './Log.svelte';
    import Login from './Login.svelte';
    import Quota from './Quota.svelte';
    import Recent from './Recent.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { instanceMap } from '$lib/state/workbench/layout/instance';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import {
        failureWords,
        parseHpcState,
        queueIsCurrent,
        type HpcPayload,
        type HpcViewState
    } from '$lib/state/system/machine/hpc/hpc';

    const {
        hpc: { command, jobLog, queue },
        ui: { instanceState, setInstanceState }
    } = useState();
    let { instance }: ViewProps = $props();
    const data = $derived(queue());
    /** Whether the queue on screen is this poll's, so the controls asking the cluster are live. */
    const live = $derived(data !== null && queueIsCurrent(data));
    /** The folds of the capacity, the finished jobs and the Login node as this pane holds them. */
    const held = $derived(parseHpcState(instanceState(instance.id)));
    /**
     * Keep the folds' new state in this pane's instance state, which goes when the tab closes;
     * every other key it holds (the disk quota's fold) is kept.
     */
    function keepHeld(next: HpcViewState): void {
        setInstanceState(instance.id, { ...instanceMap(instanceState(instance.id)), ...next });
    }
    let logId = $state('');
    let logStatus = $state('');
    let logOutput = $state('');
    /**
     * The words of a failed poll, for the error box and the Login node section: the failure's own
     * sentence, and the hint under it as code when there is one (ssh's line, Slurm's message or the
     * poll's). While there is no host to ask, the hint is the sentence for why and stands alone.
     */
    function failureMessage(payload: HpcPayload): string {
        const { hint, host } = payload;
        if (host === '' && hint !== undefined && hint !== '') return hint;
        const sentence = failureWords(payload)?.sentence ?? '';
        return hint === undefined || hint === ''
            ? sentence
            : t('hpc.unreachable_detail', sentence, hint);
    }
    async function refresh(): Promise<void> {
        await command({ action: 'refresh' });
    }
    async function cancel(id: string): Promise<void> {
        await command({ action: 'cancel', id });
    }
    async function showLog(id: string): Promise<void> {
        logId = id;
        logStatus = 'loading';
        const answer = await jobLog(id);
        logStatus = answer.status;
        logOutput = answer.output;
    }
</script>

<!-- The pane is the frame every view has; the bar under its header is the cluster's own status
     line and the refresh control. -->
{#snippet bar()}
    <Head {data} onrefresh={refresh} />
{/snippet}

<Pane title={t('views.hpc')} tinted {bar}>
    <div class="hpc" data-instance={instance.id}>
        {#if data?.status === 'starting'}
            <Empty message={t('hpc.fetching')} />
        {:else if data?.status === 'unconfigured'}
            <Empty message={data.hint ?? ''} />
        {:else if data && data.status !== 'ok'}
            <Empty error message={failureMessage(data)}>
                {#snippet action()}
                    <ToolButton small label={t('hpc.refresh_now')} onclick={refresh} />
                {/snippet}
            </Empty>
        {/if}
        {#if data && (live || data.sinfo.length > 0 || data.stale?.sinfo !== undefined)}
            <Capacity rows={data.sinfo} stale={data.stale?.sinfo} {held} onheld={keepHeld} />
        {/if}
        {#if data && (live || data.quota.length > 0)}
            <Quota rows={data.quota} />
        {/if}
        {#if data && (live || data.jobs.length > 0)}
            <Jobs rows={data.jobs} {live} onlog={showLog} oncancel={cancel} />
        {/if}
        {#if data && (live || data.recent.length > 0 || data.stale?.recent !== undefined)}
            <Recent
                rows={data.recent}
                stale={data.stale?.recent}
                {live}
                {held}
                onheld={keepHeld}
                onlog={showLog}
            />
        {/if}
        {#if data && data.status !== 'unconfigured' && data.status !== 'starting'}
            <Login
                reason={live ? '' : failureMessage(data)}
                open={held.login}
                ontoggle={() => keepHeld({ ...held, login: !held.login })}
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
        {#if data && data.host !== ''}
            <footer>{t('hpc.footer', data.host)}</footer>
        {/if}
    </div>
</Pane>

<style>
    .hpc {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
    }
    footer {
        margin-top: 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
