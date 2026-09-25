<script module lang="ts">
    // Layer 3, view registration. Domains follows Pillars in the structure group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'domains',
        label: 'views.domains',
        glyph: 'views.domains_glyph',
        group: 'structure',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The application-domain board over populated registry entries and real-project
    // membership, with the shared schema-driven add and edit forms.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import DomainCard from '$lib/views/structure/domains/DomainCard.svelte';
    import SourceToolbar from '$lib/views/shared/links/SourceToolbar.svelte';
    import RegistryHead from '$lib/views/shared/forms/RegistryHead.svelte';
    import Intro from '$lib/views/shared/prose/Intro.svelte';
    import type { Snippet } from 'svelte';
    import Reveal from '$lib/views/shared/card/Reveal.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        domainsWithMembers,
        registryLines,
        parseDomainsState,
        type DomainsState
    } from '$lib/state/boards/structure/lines';
    import { entryById } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        selectors: { archiveDead, collectionOf, configMap, projects },
        formDrafts: { toggleAdd, toggleEdit },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();
    const held = $derived(parseDomainsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const collection = $derived(collectionOf('domains'));
    /**
     * The registry file this view is drawn from, which the control at the end of the toolbar opens.
     */
    const source = $derived(viewSourceFile('domains', configMap()));
    const domains = $derived(registryLines(portfolio(), 'domains', collection?.entries ?? []));
    const shown = $derived(domainsWithMembers(domains, projects(), archiveDead()));
    let said = $state('');

    function write(next: Partial<DomainsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
</script>

{#snippet tools()}
    <SourceToolbar {source} />
{/snippet}

<Pane title={t('views.domains')} toolbar={tools}>
    <div class="domains-view" data-instance={instance.id}>
        <RegistryHead
            collection="domains"
            schema={collection?.schema}
            adding={held.adding}
            {said}
            ontoggle={() => write({ adding: toggleAdd(instance.id, 'domains', held.adding) })}
            onclose={() => write({ adding: false })}
            onsaid={(words: string) => (said = words)}
        >
            {#snippet intro(actions: Snippet)}
                <Intro html={inlineMarkdown(t('domains.intro'))} trusted {actions} />
            {/snippet}
        </RegistryHead>
        {#if shown.length === 0}
            <p class="empty">{t('domains.empty')}</p>
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
                            entry={entryById(collection, item.domain.id)}
                            schema={collection?.schema}
                            editing={held.editing === item.domain.id}
                            onedit={() =>
                                write({
                                    editing: toggleEdit(
                                        instance.id,
                                        'domains',
                                        held.editing,
                                        item.domain.id
                                    )
                                })}
                            onsaid={(words: string) => (said = words)}
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
        grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
        gap: 10px;
        margin-top: 10px;
    }

    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
