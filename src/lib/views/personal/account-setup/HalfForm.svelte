<script lang="ts">
    // Layer 3, view partial. The fields one provider's client half is typed into, and its Save.
    //
    // The shape is checked before anything is sent and a refusal is said in words under the form.
    // The fields are emptied once the half is saved, and the page never draws a saved id, secret or
    // tenant back: what it says of a saved half is that the provider is set up.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ConnectProvider } from '$lib/state/life/accounts';
    import { useState } from '$lib/state/client/use';

    const {
        accounts: { saveHalf }
    } = useState();
    let { provider, named }: { provider: ConnectProvider; named: string } = $props();

    let clientId = $state('');
    let clientSecret = $state('');
    let tenant = $state('');
    let saving = $state(false);
    let said = $state('');
    let refused = $state(false);

    async function save(): Promise<void> {
        saving = true;
        try {
            const answer = await saveHalf(provider, { clientId, clientSecret, tenant });
            refused = answer !== '';
            said = refused ? answer : t('accounts.saved', named);
            if (!refused) {
                clientId = '';
                clientSecret = '';
                tenant = '';
            }
        } finally {
            saving = false;
        }
    }
</script>

<div class="half" data-half={provider}>
    {#if provider === 'google'}
        <Field label={t('accounts.google_client_id')}>
            <TextInput
                value={clientId}
                label={t('accounts.google_client_id')}
                oninput={(value: string) => (clientId = value)}
            />
        </Field>
        <Field label={t('accounts.google_client_secret')}>
            <TextInput
                value={clientSecret}
                label={t('accounts.google_client_secret')}
                secret
                oninput={(value: string) => (clientSecret = value)}
            />
        </Field>
    {:else}
        <Field label={t('accounts.microsoft_client_id')}>
            <TextInput
                value={clientId}
                label={t('accounts.microsoft_client_id')}
                oninput={(value: string) => (clientId = value)}
            />
        </Field>
        <Field label={t('accounts.microsoft_tenant')}>
            <TextInput
                value={tenant}
                label={t('accounts.microsoft_tenant')}
                oninput={(value: string) => (tenant = value)}
            />
        </Field>
    {/if}
    <div class="buttons">
        <ToolButton
            label={saving ? t('accounts.saving') : t('accounts.save')}
            disabled={saving}
            onclick={() => void save()}
        />
        {#if said !== '' && !refused}
            <span class="said" role="status">{said}</span>
        {/if}
    </div>
    {#if said !== '' && refused}
        <Empty error message={said} />
    {/if}
</div>

<style>
    .half {
        display: grid;
        gap: 4px;
    }
    .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
    }
    .said {
        color: var(--c-green-d-txt);
        font-size: var(--fs-md);
    }
</style>
