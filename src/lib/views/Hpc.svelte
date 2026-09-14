<script module lang="ts">
    // Layer 3, view registration. Live HPC follows Gallery in the system group.
    import type { ViewRegistration } from './registry';
    import { badgeText } from '$lib/state/hpc.svelte';
    import { queueBadgeTitle, queueCells } from '$lib/state/rail-badges.svelte';
    export const registration: ViewRegistration = {
        id: 'hpc',
        label: 'views.hpc',
        glyph: 'views.hpc_glyph',
        group: 'system',
        order: 3,
        badge: badgeText,
        badgeTitle: queueBadgeTitle,
        badgeCells: queueCells,
        badgeTabText: () => ''
    };
</script>

<script lang="ts">
    // Layer 3, view. Live HPC composes the socket state, explicit actions, capacity, queue, recent jobs, quota, and one selected log.
    import Pane from '$lib/ui/Pane.svelte';
    import Head from './hpc/Head.svelte';
    import Capacity from './hpc/Capacity.svelte';
    import Jobs from './hpc/Jobs.svelte';
    import Log from './hpc/Log.svelte';
    import Quota from './hpc/Quota.svelte';
    import Recent from './hpc/Recent.svelte';
    import { queue } from '$lib/state/hpc.svelte';
    import { writeToken } from '$lib/state/writes.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    let { instance }: ViewProps = $props();
    const data = $derived(queue());
    let logId = $state('');
    let logStatus = $state('');
    let logOutput = $state('');
    async function action(body: Record<string, string>): Promise<Record<string, unknown>> {
        const response = await fetch('/api/hpc', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': writeToken() },
            body: JSON.stringify(body)
        });
        return response.json();
    }
    async function refresh(): Promise<void> {
        await action({ action: 'refresh' });
    }
    async function cancel(id: string): Promise<void> {
        await action({ action: 'cancel', id });
    }
    async function showLog(id: string): Promise<void> {
        logId = id;
        logStatus = 'loading';
        const answer = await action({ action: 'log', id });
        logStatus = String(answer.status ?? 'error');
        logOutput = String(answer.log ?? '');
    }
</script>

<!-- The pane is the frame every view has; the head inside it is the cluster's own status line. -->
<Pane title={t('views.hpc')} tinted>
    <div class="hpc" data-instance={instance.id}>
        <Head {data} onrefresh={refresh} />
        {#if data?.status === 'ok'}
            <Capacity rows={data.sinfo} />
            <Quota rows={data.quota} />
            <Jobs rows={data.jobs} onlog={showLog} oncancel={cancel} />
            <Recent rows={data.recent} onlog={showLog} />
        {:else if data?.status === 'starting'}
            <p>{t('hpc.fetching')}</p>
        {:else if data}
            <p>{t('hpc.unreachable_msg')}</p>
        {/if}
        {#if logId}
            <Log
                id={logId}
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
