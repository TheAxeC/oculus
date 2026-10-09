<script module lang="ts">
    // Layer 3, view registration. Live HPC is shown in the float docked at the right edge that
    // config/layout.yml ships, beside Usage.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'hpc',
        label: 'views.hpc',
        glyph: 'views.hpc_glyph',
        group: 'focus',
        order: 1,
        unique: true,
        badge: (client) => client.hpc.badgeText(),
        badgeTitle: (client) => client.railBadges.queueBadgeTitle(),
        badgeCells: (client) => client.railBadges.queueCells(),
        badgeTabText: () => ''
    };
</script>

<script lang="ts">
    // Layer 3, view. Live HPC composes the socket state, explicit actions, capacity, queue, recent
    // jobs, quota, and one selected log. The refresh control is in the bar while the cluster
    // answers, and is the retry of the error box while it does not.
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Head from './Head.svelte';
    import Capacity from './Capacity.svelte';
    import Jobs from './Jobs.svelte';
    import Log from './Log.svelte';
    import Quota from './Quota.svelte';
    import Recent from './Recent.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import { parseHpcState, type HpcViewState } from '$lib/state/system/machine/hpc/hpc';

    const {
        hpc: { command, jobLog, queue },
        ui: { instanceState, setInstanceState }
    } = useState();
    let { instance }: ViewProps = $props();
    const data = $derived(queue());
    /** The capacity folds as this pane holds them. */
    const held = $derived(parseHpcState(instanceState(instance.id)));
    /** Keep the folds' new state in this pane's instance state, which goes when the tab closes. */
    function keepHeld(next: HpcViewState): void {
        setInstanceState(instance.id, next);
    }
    let logId = $state('');
    let logStatus = $state('');
    let logOutput = $state('');
    /**
     * The error box's words: the sentence, and the ssh line under it as code when there is one.
     * While there is no host to ask, the hint is the sentence for why and stands alone.
     */
    function unreachable(hint: string | undefined, host: string): string {
        if (host === '' && hint !== undefined && hint !== '') return hint;
        return hint === undefined || hint === ''
            ? t('hpc.unreachable_msg')
            : t('hpc.unreachable_detail', t('hpc.unreachable_msg'), hint);
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
        {:else if data && data.status !== 'ok'}
            <Empty error message={unreachable(data.hint, data.host)}>
                {#snippet action()}
                    <ToolButton small label={t('hpc.refresh_now')} onclick={refresh} />
                {/snippet}
            </Empty>
        {/if}
        {#if data && (data.status === 'ok' || data.sinfo.length > 0 || data.quota.length > 0)}
            <Capacity rows={data.sinfo} {held} onheld={keepHeld} />
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
