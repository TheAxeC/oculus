<script lang="ts">
    // Layer 3, view partial. The Add form the Calendar and the Inbox share: the provider, the
    // label, and the one press that adds the account and starts its Connect.
    //
    // The label's rule and its uniqueness are checked before anything is sent, and a refusal is
    // said in words under the form. A provider with no client half on this machine opens the
    // account setup page, and the account is added there once that provider is saved; the form
    // says so while the Add waits.

    import Field from '$lib/ui/forms/Field.svelte';
    import Select from '$lib/ui/forms/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { PROVIDERS, type ConnectKind, type ConnectProvider } from '$lib/state/life/accounts';
    import { useState } from '$lib/state/client/use';

    const {
        accounts: { add, busy, waiting }
    } = useState();
    let { kind, onclose }: { kind: ConnectKind; onclose: () => void } = $props();

    let provider: string = $state('google');
    let label = $state('');
    let said = $state('');

    const held = $derived(waiting());

    /** The provider's own name, as the setup page and the rows name it. */
    function named(id: ConnectProvider): string {
        return id === 'google' ? t('accounts.provider_google') : t('accounts.provider_microsoft');
    }

    async function submit(): Promise<void> {
        said = await add(kind, provider as ConnectProvider, label);
        if (said === '' && waiting() === null) {
            label = '';
            onclose();
        }
    }
</script>

<div class="add" data-add-account={kind}>
    <Field label={t('accounts.add_provider')}>
        <Select
            value={provider}
            label={t('accounts.add_provider')}
            empty={t('accounts.refused_provider')}
            choices={PROVIDERS.map((id) => ({ id, label: named(id) }))}
            onchange={(value: string) => (provider = value)}
        />
    </Field>
    <Field label={t('accounts.add_label')} help={t('accounts.add_label_hint')}>
        <TextInput
            value={label}
            label={t('accounts.add_label')}
            oninput={(value: string) => (label = value)}
        />
    </Field>
    <div class="buttons">
        <ToolButton
            label={busy(kind) ? t('accounts.adding') : t('accounts.add_go')}
            disabled={busy(kind)}
            onclick={() => void submit()}
        />
        <ToolButton label={t('accounts.cancel')} onclick={onclose} />
    </div>
    {#if said !== ''}
        <p class="said" role="alert">{said}</p>
    {/if}
    {#if held !== null && held.kind === kind}
        <p class="waiting">{t('accounts.waiting', held.label, named(held.provider))}</p>
    {/if}
</div>

<style>
    .add {
        display: grid;
        gap: 4px;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
    }
    .buttons {
        display: flex;
        gap: 6px;
        align-items: center;
    }
    .said {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
    .waiting {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
