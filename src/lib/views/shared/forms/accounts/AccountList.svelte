<script lang="ts">
    // Layer 3, view partial. The account rows the Calendar and the Inbox share: the state word, the
    // label, the provider, the hub whose local.yml holds the account, when it was last read, the
    // Connect control, and a row menu whose Remove asks first, naming the account.
    //
    // A published calendar link signs in nowhere, so its row has no Connect: it is read, or it
    // says why not in its hint, at every poll. Its Remove says that the file keeping its link goes.
    //
    // Connect is shown only while an account has no refresh token, and is unpressable while the
    // press it answered is still opening the provider's consent page. An account whose provider has
    // no client half on this machine says so and offers the account setup page in place of
    // Connect, naming the provider as the setup page does. The hint under an account in error is
    // the server's own sentence. The confirm of a Remove says when the account's own file carries
    // its client id, since that id is deleted with the file.
    //
    // Over a wallpaper the rows and the said line are each read off a `Surface`, which paints
    // nothing inside the Calendar's tinted box.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import RemoveAccount from './RemoveAccount.svelte';
    import RootChip from '../../card/RootChip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { clock } from '$lib/state/shared/words/format';
    import {
        connectKey,
        signsIn,
        type AccountProvider,
        type ConnectAccountStatus,
        type ConnectKind
    } from '$lib/state/life/accounts';
    import { useState } from '$lib/state/client/use';

    /** What one row draws, which a calendar and a mail account both carry. */
    type Row = {
        provider: AccountProvider;
        label: string;
        hub?: string;
        status: ConnectAccountStatus;
        lastOk?: string;
        hint?: string;
        needsSetup?: boolean;
        ownHalf?: boolean;
    };

    const {
        accounts: { connect, connecting, openSetup, remove }
    } = useState();
    let { kind, rows }: { kind: ConnectKind; rows: Row[] } = $props();

    /** The account whose Remove is being asked about, or null. */
    let asking: Row | null = $state(null);
    /** What the last press on a row answered, when it was refused. */
    let said = $state('');

    /** The provider's own name, in the words of the connector the row belongs to. */
    function provider(row: Row): string {
        if (row.provider === 'ics') return t('calendar.provider_ics');
        if (kind === 'calendar') {
            return row.provider === 'google'
                ? t('calendar.provider_google')
                : t('calendar.provider_microsoft');
        }
        return row.provider === 'google'
            ? t('inbox.provider_google')
            : t('inbox.provider_microsoft');
    }

    /** The provider's name as the account setup page gives it, where the rows' words may differ. */
    function setupName(row: Row): string {
        return row.provider === 'google'
            ? t('accounts.provider_google')
            : t('accounts.provider_microsoft');
    }

    /** The account's state word. */
    function word(row: Row): string {
        if (row.status === 'connected') return t('accounts.connected');
        if (row.status === 'error') return t('accounts.account_error');
        return t('accounts.not_connected');
    }

    /** The hue the state word carries. */
    function tone(row: Row): string {
        if (row.status === 'connected') return 'green';
        return row.status === 'error' ? 'red' : 'amber';
    }

    async function press(row: Row): Promise<void> {
        said = await connect(kind, row);
    }

    async function removeAsked(): Promise<void> {
        const row = asking;
        asking = null;
        if (row !== null) said = await remove(kind, row);
    }
</script>

<Surface>
    <ul class="accounts">
        {#each rows as row (connectKey(row))}
            <li
                data-calendar-account={kind === 'calendar' ? connectKey(row) : undefined}
                data-mail-account={kind === 'mail' ? connectKey(row) : undefined}
            >
                <span class="who">
                    <Tag label={word(row)} tone={tone(row)} />
                    <span class="label">{row.label}</span>
                    <span class="provider">{provider(row)}</span>
                    <RootChip record={{ root: row.hub }} />
                    {#if row.lastOk}
                        <span class="when">{t('accounts.last_ok', clock(row.lastOk))}</span>
                    {/if}
                </span>
                <span class="controls">
                    {#if row.needsSetup === true}
                        <ToolButton
                            small
                            label={t('accounts.open_setup', setupName(row))}
                            glyph={t('views.account_setup_glyph')}
                            onclick={openSetup}
                        />
                    {:else if row.status !== 'connected' && signsIn(row)}
                        <ToolButton
                            small
                            label={connecting(kind, row)
                                ? t('accounts.connecting')
                                : t('accounts.connect')}
                            disabled={connecting(kind, row)}
                            onclick={() => void press(row)}
                        />
                    {/if}
                    <span class="more">
                        <Menu
                            label={t('ui.row_menu')}
                            items={[
                                {
                                    id: 'remove',
                                    label: t('accounts.remove'),
                                    glyph: t('accounts.remove_glyph')
                                }
                            ]}
                            glyph={t('accounts.menu_glyph')}
                            compact
                            bare
                            placement="down"
                            align="right"
                            onpick={() => (asking = row)}
                        />
                    </span>
                </span>
            </li>
            {#if row.needsSetup === true}
                <li class="hint">{t('accounts.needs_setup', setupName(row))}</li>
            {:else if row.status === 'error' && row.hint}
                <li class="hint"><code class="bad">{row.hint}</code></li>
            {/if}
        {/each}
    </ul>
</Surface>
{#if said !== ''}
    <Surface>
        <p class="said">{said}</p>
    </Surface>
{/if}
{#if asking !== null}
    <RemoveAccount
        label={asking.label}
        ownHalf={asking.ownHalf === true}
        published={asking.provider === 'ics'}
        provider={provider(asking)}
        onconfirm={() => void removeAsked()}
        oncancel={() => (asking = null)}
    />
{/if}

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
    /* One line of the tree's row height. The row's menu is drawn while the pointer is over the row
       or the focus is inside it, and always where nothing hovers; it keeps its place and its
       place in the tab order while clear. */
    li {
        --row-reveal: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
        font-size: var(--fs-md);
    }

    li:hover,
    li:focus-within {
        --row-reveal: 1;
    }

    @media (hover: none) {
        li {
            --row-reveal: 1;
        }
    }

    .more {
        display: inline-flex;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }
    .who,
    .controls {
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
    .when,
    .hint {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .bad,
    .said {
        color: var(--c-red-txt);
    }
    .said {
        margin: 0;
        font-size: var(--fs-sm);
    }
</style>
