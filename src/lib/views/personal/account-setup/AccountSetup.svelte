<script module lang="ts">
    // Layer 3, view registration. Account setup sits in the Personal group after the Calendar,
    // since what it sets up is the Calendar's and the Inbox's accounts. It is opened from their Add
    // and their `...` menus as much as from the rail.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'account-setup',
        label: 'views.account_setup',
        glyph: 'views.account_setup_glyph',
        group: 'personal',
        order: 2
    };
</script>

<script lang="ts">
    // Layer 3, view. The account setup page: one section per provider with the numbered steps that
    // register the reader's own application there, the values to enter, and the fields its client
    // half is saved from, once for every account of that provider in the Calendar and the Inbox.
    //
    // The redirect addresses and the scopes are the server's answer (GET /api/connect), read from
    // the constants the connect flow uses, so what the page asks the reader to register is what the
    // server sends. The page draws whether a provider is set up and never a saved half.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import GoogleSteps from './GoogleSteps.svelte';
    import HalfForm from './HalfForm.svelte';
    import MicrosoftSteps from './MicrosoftSteps.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { scopesOf, type ConnectProvider } from '$lib/state/life/accounts';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        accounts: { loadSetup, setup, setupFailed, waiting }
    } = useState();
    let { instance }: ViewProps = $props();

    $effect(() => {
        void loadSetup();
    });

    const held = $derived(setup());
    const pending = $derived(waiting());

    /** The provider's own name. */
    function named(provider: ConnectProvider): string {
        return provider === 'google'
            ? t('accounts.provider_google')
            : t('accounts.provider_microsoft');
    }
</script>

{#snippet heading(provider: ConnectProvider, words: string)}
    <h3>
        {words}
        {#if held !== null}
            <Tag
                label={held.ready[provider] ? t('accounts.ready') : t('accounts.not_ready')}
                tone={held.ready[provider] ? 'green' : 'amber'}
            />
        {/if}
    </h3>
{/snippet}

<Pane title={t('views.account_setup')} tinted>
    <div class="setup" data-instance={instance.id}>
        <p class="intro">{t('accounts.setup_intro')}</p>
        {#if pending !== null}
            <p class="waiting">{t('accounts.waiting', pending.label, named(pending.provider))}</p>
        {/if}
        {#if held === null && setupFailed() !== ''}
            <p class="failed" role="alert">{setupFailed()}</p>
        {:else if held === null}
            <p class="intro">{t('accounts.reading')}</p>
        {:else}
            <section data-provider="google">
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render heading('google', t('accounts.google_heading'))}
                <GoogleSteps scopes={scopesOf(held, 'google')} />
                <HalfForm provider="google" named={named('google')} />
            </section>
            <section data-provider="microsoft">
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render heading('microsoft', t('accounts.microsoft_heading'))}
                <MicrosoftSteps
                    redirects={[held.redirects.calendar, held.redirects.mail]}
                    permissions={scopesOf(held, 'microsoft')}
                />
                <HalfForm provider="microsoft" named={named('microsoft')} />
            </section>
        {/if}
    </div>
</Pane>

<style>
    .setup {
        display: grid;
        gap: 16px;
        min-width: 0;
    }
    .intro,
    .waiting {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .waiting {
        color: var(--ink-txt, var(--ink));
    }
    .failed {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
    section {
        display: grid;
        gap: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--line);
    }
    h3 {
        display: flex;
        gap: 8px;
        align-items: center;
        margin: 0;
        font-size: var(--fs-lg);
    }
</style>
