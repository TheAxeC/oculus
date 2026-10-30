<script module lang="ts">
    // Layer 3, view registration. Domains follows Pillars in the Pillars page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'domains',
        label: 'views.domains',
        glyph: 'views.domains_glyph',
        group: 'pillars',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The application-domain board over populated registry entries and real-project
    // membership, its cards in the shared card grid (views/shared/card/record/CardGrid.svelte),
    // with Add and Edit in File, which open the registry file.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import DomainCard from '$lib/views/shared/card/record/registry/DomainCard.svelte';
    import RegistryHead from '$lib/views/shared/forms/registry/RegistryHead.svelte';
    import RegistryTools from '$lib/views/shared/forms/registry/RegistryTools.svelte';
    import { registryFile } from '$lib/views/shared/forms/registry/registry-file.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import CardGrid from '$lib/views/shared/card/record/CardGrid.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import { cardCursor, storedState } from '$lib/state/workbench/layout/instance';
    import {
        domainsWithMembers,
        registryLines,
        parseDomainsState,
        type DomainsState
    } from '$lib/state/boards/structure/lines';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const client = useState();
    const {
        entities: { portfolio },
        selectors: { configMap, projects },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();
    const held = $derived(parseDomainsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const file = registryFile(client, 'domains');
    const domains = $derived(registryLines(portfolio(), 'domains', file.collection?.entries ?? []));
    const shown = $derived(domainsWithMembers(domains, projects(), configMap(), vocabOf));
    function write(next: Partial<DomainsState>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }
</script>

{#snippet tools()}
    <RegistryTools {file} />
{/snippet}

<Pane title={t('views.domains')} toolbar={tools}>
    <div class="domains-view" data-instance={instance.id}>
        <RegistryHead {file} />
        {#if shown.length === 0}
            <Empty message={t('domains.empty')} />
        {:else}
            <CardGrid>
                {#each shown as item (item.domain.id)}
                    <Reveal
                        id={item.domain.id}
                        wanted={held.reveal}
                        onrevealed={() => write({ reveal: '' })}
                    >
                        <DomainCard
                            domain={item.domain}
                            cursor={cursor === item.domain.id}
                            projects={item.projects}
                            entry={file.entryOf(item.domain.id)}
                            schema={file.schemaOf(item.domain.id)}
                            file={file.sourceOf(item.domain.id)}
                            fault={file.faultOf(item.domain.id)}
                            onsaid={file.say}
                        />
                    </Reveal>
                {/each}
            </CardGrid>
        {/if}
    </div>
</Pane>

<style>
    /* The said line and the cards, 8px apart. */
    .domains-view {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }
</style>
