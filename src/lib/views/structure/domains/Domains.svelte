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
    // membership, with Add and Edit in File, which open the registry file.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import DomainCard from '$lib/views/structure/domains/DomainCard.svelte';
    import RegistryHead from '$lib/views/shared/forms/registry/RegistryHead.svelte';
    import Intro from '$lib/views/shared/prose/Intro.svelte';
    import RegistryTools from '$lib/views/shared/forms/registry/RegistryTools.svelte';
    import { registryFile } from '$lib/views/shared/forms/registry/registry-file.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        domainsWithMembers,
        registryLines,
        parseDomainsState,
        type DomainsState
    } from '$lib/state/boards/structure/lines';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        selectors: { configMap, projects },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();
    const held = $derived(parseDomainsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const file = registryFile(client, 'domains', 'domains');
    const domains = $derived(registryLines(portfolio(), 'domains', file.collection?.entries ?? []));
    const shown = $derived(domainsWithMembers(domains, projects(), configMap()));
    function write(next: Partial<DomainsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <RegistryTools {file} />
{/snippet}

<Pane title={t('views.domains')} toolbar={tools}>
    <div class="domains-view" data-instance={instance.id}>
        <RegistryHead {file}>
            {#snippet intro()}
                <Intro html={inlineMarkdown(t('domains.intro'))} trusted />
            {/snippet}
        </RegistryHead>
        {#if shown.length === 0}
            <Empty message={t('domains.empty')} />
        {:else}
            <div class="cards">
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
            </div>
        {/if}
    </div>
</Pane>

<style>
    .domains-view {
        min-width: 0;
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(290px, 100%), 1fr));
        gap: 10px;
        margin-top: 10px;
    }
</style>
