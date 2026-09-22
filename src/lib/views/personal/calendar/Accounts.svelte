<script lang="ts">
    // Layer 3, view partial. One row per configured account: the provider, the label, the state word
    // and the Connect control.
    //
    // Connect is shown only while an account has no refresh token, and is unpressable while the
    // press it answered is still opening the provider's consent page. The hint under a not-connected
    // account is the path of the credential file the reader creates, which is the one place that
    // path is ever shown.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/words/text';
    import { clock } from '$lib/state/words/format';
    import { calendarKey, type CalendarAccount } from '$lib/state/life/calendar';

    let {
        rows,
        connecting,
        onconnect
    }: {
        rows: CalendarAccount[];
        connecting: (account: CalendarAccount) => boolean;
        onconnect: (account: CalendarAccount) => void;
    } = $props();

    /** The provider's own name, as the reader knows it. */
    function provider(account: CalendarAccount): string {
        return account.provider === 'google'
            ? t('calendar.provider_google')
            : t('calendar.provider_microsoft');
    }

    /** The account's state word. */
    function word(account: CalendarAccount): string {
        if (account.status === 'connected') return t('calendar.connected');
        if (account.status === 'error') return t('calendar.account_error');
        return t('calendar.not_connected');
    }

    /** The hue the state word carries. */
    function tone(account: CalendarAccount): string {
        if (account.status === 'connected') return 'green';
        return account.status === 'error' ? 'red' : 'amber';
    }
</script>

<ul class="accounts">
    {#each rows as account (calendarKey(account))}
        <li data-account={calendarKey(account)}>
            <span class="who">
                <Tag label={word(account)} tone={tone(account)} />
                <span class="label">{account.label}</span>
                <span class="provider">{provider(account)}</span>
                {#if account.lastOk}
                    <span class="when">{t('calendar.last_ok', clock(account.lastOk))}</span>
                {/if}
            </span>
            {#if account.status !== 'connected'}
                <ToolButton
                    label={connecting(account) ? t('calendar.connecting') : t('calendar.connect')}
                    disabled={connecting(account)}
                    onclick={() => onconnect(account)}
                />
            {/if}
        </li>
        {#if account.hint}
            <li class="hint">
                {#if account.status === 'not-connected'}
                    <code>{t('calendar.needs_file', account.hint)}</code>
                {:else}
                    <code class="bad">{account.hint}</code>
                {/if}
            </li>
        {/if}
    {/each}
</ul>

<style>
    .accounts {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }
    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        min-width: 0;
    }
    .who {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }
    .label {
        font-weight: 600;
    }
    .provider,
    .when {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .hint {
        font-size: var(--fs-sm);
    }
    .bad {
        color: var(--c-red-txt);
    }
</style>
