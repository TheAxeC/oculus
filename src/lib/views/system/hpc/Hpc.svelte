<script module lang="ts">
    // Layer 3, view registration. Live HPC follows Gallery in the system group.
    import type { ViewRegistration } from '../../registry';
    export const registration: ViewRegistration = {
        id: 'hpc',
        label: 'views.hpc',
        glyph: 'views.hpc_glyph',
        group: 'system',
        order: 3,
        badge: (client) => client.hpc.badgeText(),
        badgeTitle: (client) => client.railBadges.queueBadgeTitle(),
        badgeCells: (client) => client.railBadges.queueCells(),
        badgeTabText: () => ''
    };
</script>

<script lang="ts">
    // Layer 3, view. Live HPC composes the socket state, explicit actions, capacity, queue, recent jobs, quota, and one selected log.
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Head from './Head.svelte';
    import Capacity from './Capacity.svelte';
    import Jobs from './Jobs.svelte';
    import Log from './Log.svelte';
    import Quota from './Quota.svelte';
    import Recent from './Recent.svelte';
    import { t } from '$lib/state/words/text';
    import type { ViewProps } from '../../registry';
    import { useState } from '$lib/state/client/use';

    const {
        hpc: { command, jobLog, queue }
    } = useState();
    let { instance }: ViewProps = $props();
    const data = $derived(queue());
    let logId = $state('');
    let logStatus = $state('');
    let logOutput = $state('');
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

<!-- The pane is the frame every view has; the head inside it is the cluster's own status line. -->
<Pane title={t('views.hpc')} tinted>
    <div class="hpc" data-instance={instance.id}>
        <Head {data} onrefresh={refresh} />
        {#if data?.status === 'starting'}
            <p>{t('hpc.fetching')}</p>
        {:else if data && data.status !== 'ok'}
            <p>{t('hpc.unreachable_msg')}</p>
        {/if}
        {#if data && (data.status === 'ok' || data.sinfo.length > 0 || data.quota.length > 0)}
            <Capacity rows={data.sinfo} />
            <Quota rows={data.quota} />
        {/if}
        {#if data && (data.status === 'ok' || data.jobs.length > 0 || data.recent.length > 0)}
            <Jobs rows={data.jobs} live={data.status === 'ok'} onlog={showLog} oncancel={cancel} />
            <Recent rows={data.recent} live={data.status === 'ok'} onlog={showLog} />
        {/if}
        {#if logId}
            <Log
                id={logId}
                live={data?.status === 'ok'}
                status={logStatus}
                output={logOutput}
                onrefresh={() => showLog(logId)}
                onclose={() => (logId = '')}
            />
        {/if}
        {#if data}
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
