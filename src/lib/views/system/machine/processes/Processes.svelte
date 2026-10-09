<script module lang="ts">
    // Layer 3, view registration. The Processes view is the last view of the System page's group,
    // after Gallery, past the nine a chord reaches.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'processes',
        label: 'views.processes',
        glyph: 'views.processes_glyph',
        group: 'views',
        order: 9,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. The processes oculus started in tmux, grouped under their terminal, and the
    // local processes whose program the `processes.patterns` list names. The read comes from the
    // `processes` channel every ten seconds while a page is open; a failed read keeps the rows of
    // the last good one under its sentence. Stop ends an oculus terminal, behind a question, and
    // the view signals no process itself.
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import { t } from '$lib/state/shared/words/text';
    import { clock } from '$lib/state/shared/words/format';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import {
        parseProcessesState,
        pressed,
        type ProcessGroup,
        type ProcessesSort
    } from '$lib/state/system/machine/processes/processes';
    import ProcessTable from './ProcessTable.svelte';

    const {
        processes,
        ui: { instanceState, setInstanceState }
    } = useState();
    let { instance }: ViewProps = $props();
    const data = $derived(processes.read());
    const arranged = $derived(processes.arranged());
    /** The sort as this pane holds it; it goes when the tab closes. */
    const sort = $derived(parseProcessesState(instanceState(instance.id)).sort);
    let asking: Ask | null = $state(null);

    function sortBy(key: ProcessesSort['key']): void {
        setInstanceState(instance.id, { sort: pressed(sort, key) });
    }
</script>

<Pane title={t('views.processes')}>
    <div class="processes" data-instance={instance.id}>
        {#if data === null}
            <Empty message={t('processes.reading')} />
        {:else}
            {#if data.updated !== ''}
                <p class="headline">{processes.head()}</p>
            {/if}
            {#if data.status === 'failed'}
                <Empty error message={t('processes.failed', data.error ?? '')} />
            {/if}
            {#if data.rows.length > 0}
                <div class="scroll">
                    <ProcessTable
                        {arranged}
                        {sort}
                        onsort={sortBy}
                        onstop={(group: ProcessGroup) => (asking = processes.stopAsk(group))}
                    />
                </div>
            {:else if data.status === 'ok'}
                <Empty message={t('processes.empty')} />
            {/if}
            {#if data.updated !== ''}
                <footer>{t('processes.read_at', clock(data.updated))}</footer>
            {/if}
        {/if}
    </div>
</Pane>
<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .processes {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
    }

    .headline {
        margin: 0;
    }

    /* A table wider than the pane scrolls inside its own box. */
    .scroll {
        min-width: 0;
        overflow-x: auto;
    }

    footer {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
