<script module lang="ts">
    // Layer 3, view registration. Domains follows Pillars in the structure group.
    import type { ViewRegistration } from './registry';
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

    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import DomainCard from '$lib/views/domains/DomainCard.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import Intro from '$lib/views/shared/Intro.svelte';
    import Reveal from '$lib/views/shared/Reveal.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { cardCursor } from '$lib/state/instance';
    import { domainMembers, parseDomainsState, type DomainsState } from '$lib/state/lines';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        entities: { portfolio },
        selectors: { archiveDead, collectionOf, projects },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();
    const held = $derived(parseDomainsState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const collection = $derived(collectionOf('domains'));
    const domains = $derived.by(() => {
        const entities = Object.values(portfolio()?.entities.domains ?? {});
        const byId = new Map(entities.map((domain) => [domain.id, domain]));
        const ordered = (collection?.entries ?? [])
            .map((entry) => byId.get(entry.id))
            .filter((domain) => domain !== undefined);
        const seen = new Set(ordered.map((domain) => domain.id));
        return [...ordered, ...entities.filter((domain) => !seen.has(domain.id))];
    });
    const allProjects = $derived(projects());
    const dead = $derived(archiveDead());
    const shown = $derived(
        domains
            .map((domain) => ({ domain, projects: domainMembers(domain, allProjects, dead) }))
            .filter((item) => item.projects.length > 0)
    );
    let adding = $state(false);
    let editing = $state<string | null>(null);
    let said = $state('');

    function write(next: Partial<DomainsState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }
    function entryFor(id: string) {
        return collection?.entries.find((entry) => entry.id === id) ?? null;
    }
</script>

{#snippet introActions()}
    {#if collection?.schema !== undefined}
        <ToolButton
            label={t('collection.add')}
            title={t('collection.add_tip')}
            active={adding}
            onclick={() => (adding = !adding)}
        />
    {/if}
{/snippet}

<Pane title={t('views.domains')}>
    <div class="domains-view" data-instance={instance.id}>
        <Intro html={inlineMarkdown(t('domains.intro'))} trusted actions={introActions} />
        {#if adding && collection?.schema !== undefined}
            <EntryForm
                collection="domains"
                schema={collection.schema}
                entry={null}
                onclose={() => (adding = false)}
                onsaid={(words: string) => (said = words)}
            />
        {/if}
        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}
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
                            entry={entryFor(item.domain.id)}
                            schema={collection?.schema}
                            editing={editing === item.domain.id}
                            onedit={() =>
                                (editing = editing === item.domain.id ? null : item.domain.id)}
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

    .empty,
    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
