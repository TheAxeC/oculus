<script lang="ts">
    // Layer 3, view partial. The Add form the Calendar and the Inbox share: the provider, the
    // label, and the one press that adds the account and starts its Connect.
    //
    // The Calendar's form also offers a published link, the one provider that signs in nowhere:
    // while it is chosen the form asks for the link under the label, drawn as dots and never
    // offered to the browser's autofill since the link is the key to the calendar, and the press
    // adds the account with no Connect after it.
    //
    // The label's rule and its uniqueness are checked before anything is sent, and a refusal is
    // said in words under the form. A provider with no client half on this machine opens the
    // account setup page, and the account is added there once that provider is saved; the form
    // says so while the Add waits.

    import Field from '$lib/ui/forms/Field.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { untrack } from 'svelte';
    import {
        PROVIDERS_OF,
        signsIn,
        type AccountProvider,
        type ConnectKind
    } from '$lib/state/life/accounts';
    import { useState } from '$lib/state/client/use';

    const {
        accounts: { add, busy, waiting }
    } = useState();
    type Props = {
        kind: ConnectKind;
        onclose: () => void;
        /** The provider chosen when the form opens; the first the connector offers by default. */
        provider?: AccountProvider;
    };

    let { kind, onclose, provider: first = 'google' }: Props = $props();

    let provider: string = $state(untrack(() => first));
    let label = $state('');
    let url = $state('');
    let said = $state('');

    const held = $derived(waiting());

    /** The provider's own name, as the setup page and the rows name it. */
    function named(id: AccountProvider): string {
        if (id === 'ics') return t('accounts.provider_ics');
        return id === 'google' ? t('accounts.provider_google') : t('accounts.provider_microsoft');
    }

    /** The provider chosen now, as one the connector offers, or null for a value it does not. */
    const chosen = $derived(PROVIDERS_OF[kind].find((one) => one === provider) ?? null);
    /** Whether the chosen provider is the published link, which asks for its link. */
    const linked = $derived(chosen !== null && !signsIn({ provider: chosen, label: '' }));

    async function submit(): Promise<void> {
        said = await add(kind, provider as AccountProvider, label, linked ? url : '');
        if (said === '' && waiting() === null) {
            label = '';
            url = '';
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
            choices={PROVIDERS_OF[kind].map((id) => ({ id, label: named(id) }))}
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
    {#if linked}
        <Field label={t('accounts.add_link')} help={t('accounts.add_link_hint')}>
            <TextInput
                value={url}
                label={t('accounts.add_link')}
                secret
                oninput={(value: string) => (url = value)}
            />
        </Field>
    {/if}
    <div class="buttons">
        <ToolButton
            label={busy(kind)
                ? t('accounts.adding')
                : linked
                  ? t('accounts.add_go_link')
                  : t('accounts.add_go')}
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
