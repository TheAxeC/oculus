<script module lang="ts">
    // Layer 3, view registration. Account setup follows Settings in the System page's group, a tab
    // beside it. It is opened from the Calendar's and the Inbox's Add and `...` menus
    // as much as from the catalogue, since what it sets up is their accounts.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'account-setup',
        label: 'views.account_setup',
        glyph: 'views.account_setup_glyph',
        group: 'views',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The account setup page: one section per provider with the numbered steps that
    // register the reader's own application there, the values to enter, and the fields its client
    // half is saved from, once for every account of that provider in the Calendar and the Inbox.
    //
    // The redirect addresses and the scopes are the server's answer (GET /api/connect), read from
    // what the connect flow uses, the hub's `sign_in` rows among it, so what the page asks the
    // reader to register is what the server sends. A provider whose row is missing or lacks a field
    // is drawn as the server's sentence naming them, with no steps and no form. The page draws
    // whether a provider is set up and never a saved half.
    //
    // Below the providers are the git hosts of `sign_in`, one part each (GitSteps.svelte), and the
    // clusters of `slurm.resource`, one part each under its name (ClusterSteps.svelte), read from
    // POST /api/clusters and read again once a row is saved.
    //
    // Each provider is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), its ready tag at the heading's right end, folded by the
    // provider's key under `folded` of the pane's state through the pane's folds
    // (views/shared/card/pane-fold.ts).

    import Empty from '$lib/ui/frame/Empty.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import GoogleSteps from './GoogleSteps.svelte';
    import HalfForm from './HalfForm.svelte';
    import MicrosoftSteps from './MicrosoftSteps.svelte';
    import ClusterSteps from './ClusterSteps.svelte';
    import GitSteps from './GitSteps.svelte';
    import type { ClusterSetup } from '$lib/state/system/machine/hpc/setup';
    import { t } from '$lib/state/shared/words/text';
    import { scopesOf, type ConnectProvider } from '$lib/state/life/accounts';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';

    const {
        accounts: { loadSetup, setup, setupFailed, waiting },
        hpc: { readSetup }
    } = useState();
    let { instance }: ViewProps = $props();

    /** The folds of the providers, by key, kept in the pane's state. */
    const fold = usePaneFold();

    $effect(() => {
        void loadSetup();
        void loadClusters();
    });

    /** The clusters of `slurm.resource` and this machine's rows, or null before they are read. */
    let clusters: ClusterSetup | null = $state(null);
    let clustersFailed = $state(false);

    async function loadClusters(): Promise<void> {
        const read = await readSetup();
        clustersFailed = read === null;
        if (read !== null) clusters = read;
    }

    const held = $derived(setup());
    const pending = $derived(waiting());

    /** The provider's own name. */
    function named(provider: ConnectProvider): string {
        return provider === 'google'
            ? t('accounts.provider_google')
            : t('accounts.provider_microsoft');
    }
</script>

{#snippet ready(provider: ConnectProvider)}
    {#if held !== null}
        <Tag
            label={held.ready[provider] ? t('accounts.ready') : t('accounts.not_ready')}
            tone={held.ready[provider] ? 'green' : 'amber'}
        />
    {/if}
{/snippet}

<Pane title={t('views.account_setup')} tinted>
    <div class="setup" data-instance={instance.id}>
        <Intro html={t('accounts.setup_intro')} trusted />
        {#if pending !== null}
            <p class="waiting">{t('accounts.waiting', pending.label, named(pending.provider))}</p>
        {/if}
        {#if held === null && setupFailed() !== ''}
            <Empty error message={setupFailed()}>
                {#snippet action()}
                    <ToolButton
                        small
                        label={t('accounts.retry')}
                        onclick={() => void loadSetup()}
                    />
                {/snippet}
            </Empty>
        {:else if held === null}
            <Intro html={t('accounts.reading')} trusted />
        {:else}
            <GroupHead
                data-provider="google"
                label={t('accounts.google_heading')}
                open={fold.open('google')}
                ontoggle={() => fold.toggle('google')}
            >
                {#snippet actions()}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render ready('google')}
                {/snippet}
                {#if held.missing.google !== ''}
                    <p class="missing" data-missing="google">{held.missing.google}</p>
                {:else}
                    <div class="provider">
                        <GoogleSteps scopes={scopesOf(held, 'google')} />
                        <HalfForm provider="google" named={named('google')} />
                    </div>
                {/if}
            </GroupHead>
            <GroupHead
                data-provider="microsoft"
                label={t('accounts.microsoft_heading')}
                open={fold.open('microsoft')}
                ontoggle={() => fold.toggle('microsoft')}
            >
                {#snippet actions()}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render ready('microsoft')}
                {/snippet}
                {#if held.missing.microsoft !== ''}
                    <p class="missing" data-missing="microsoft">{held.missing.microsoft}</p>
                {:else}
                    <div class="provider">
                        <MicrosoftSteps
                            redirects={[held.redirects.calendar, held.redirects.mail]}
                            permissions={scopesOf(held, 'microsoft')}
                        />
                        <HalfForm provider="microsoft" named={named('microsoft')} />
                    </div>
                {/if}
            </GroupHead>
            <GitSteps hosts={held.git} />
        {/if}
        <GroupHead
            data-provider="clusters"
            label={t('accounts.clusters_heading')}
            open={fold.open('clusters')}
            ontoggle={() => fold.toggle('clusters')}
        >
            {#if clusters === null && clustersFailed}
                <Empty error message={t('accounts.cluster_unreachable')} />
            {:else if clusters === null}
                <Intro html={t('accounts.reading')} trusted />
            {:else if clusters.clusters.length === 0}
                <p class="missing">{clusters.hint}</p>
            {:else}
                {#each clusters.clusters as cluster (cluster.resource)}
                    <section class="provider" data-cluster-part={cluster.resource}>
                        <h3>{cluster.name}</h3>
                        <ClusterSteps
                            {cluster}
                            keyMissing={clusters.keyMissing}
                            onsaved={() => void loadClusters()}
                        />
                    </section>
                {/each}
            {/if}
        </GroupHead>
    </div>
</Pane>

<style>
    .setup {
        display: grid;
        gap: 16px;
        min-width: 0;
    }
    .waiting {
        margin: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }
    .provider {
        display: grid;
        gap: 10px;
    }
    h3 {
        margin: 0;
        font-size: var(--fs-md);
    }
    .missing {
        margin: 0;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
