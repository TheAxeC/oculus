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
    // Layer 3, view. Live HPC draws one section per cluster of `slurm.resource`, in its order and
    // under its name (Cluster.svelte), each with its own head, status and refresh, capacity, queue,
    // recent jobs, quota, Recover sessions on its login node and selected log; with one cluster the
    // one section is drawn under its name. The folds of the capacity, the finished jobs and the
    // Login node are the pane's, and every section draws them alike. Before the first message the
    // pane says it is fetching, and a hub whose settings name no cluster shows the sentence that
    // says so alone, in no error tone and with no retry, since there is nothing to ask.
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Cluster from './Cluster.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { instanceMap } from '$lib/state/workbench/layout/instance';
    import { parseHpcState, type HpcViewState } from '$lib/state/system/machine/hpc/hpc';

    const {
        hpc: { clusters, hint, heard },
        ui: { instanceState, setInstanceState }
    } = useState();
    let { instance }: ViewProps = $props();
    const shown = $derived(clusters());
    /** The folds of the capacity, the finished jobs and the Login node as this pane holds them. */
    const held = $derived(parseHpcState(instanceState(instance.id)));
    /**
     * Keep the folds' new state in this pane's instance state, which goes when the tab closes;
     * every other key it holds (the disk quota's fold) is kept.
     */
    function keepHeld(next: HpcViewState): void {
        setInstanceState(instance.id, { ...instanceMap(instanceState(instance.id)), ...next });
    }
</script>

<Pane title={t('views.hpc')} tinted>
    <div class="hpc" data-instance={instance.id}>
        {#if !heard()}
            <Empty message={t('hpc.fetching')} />
        {:else if shown.length === 0}
            <Empty message={hint()} />
        {/if}
        {#each shown as one (one.resource)}
            <Cluster data={one} {held} onheld={keepHeld} />
        {/each}
    </div>
</Pane>

<style>
    .hpc {
        display: flex;
        flex-direction: column;
        gap: 18px;
        min-width: 0;
    }
</style>
