<script lang="ts">
    // Layer 3, view partial. Account setup's git section: one part per git host of the hub's
    // `sign_in` (a row with `credential_address`), each with the numbered steps that register the
    // reader's own OAuth App with the device flow on at the row's `register` page, the field its
    // client id is saved from, Sign in, which shows the code to type and the address to type it
    // at while the device flow waits, and Sign out once a login holds a token granted for the
    // row's address. With no git host row the section says that none is set and where it is set.
    // Under the hosts, each key whose saved token no row names with its address (its row gone, or
    // naming another address) is listed with the sentence why git is given none and its Sign out.
    //
    // The section reads where each Sign in stands from POST /api/connect/git (`status`) when it is
    // drawn and after each press, and again every few seconds while a Sign in waits on the reader;
    // the wait is cleared when the section is taken away. No client id or token is ever drawn.

    import CopyValue from './CopyValue.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { GitFlow, GitHosts } from '$lib/state/life/accounts';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';

    const {
        accounts: { gitStatus, gitAction }
    } = useState();

    let { hosts }: { hosts: GitHosts } = $props();

    /** How often the section asks again while a Sign in waits on the reader, in milliseconds. */
    const WAIT_MS = 3000;

    const fold = usePaneFold();
    /** The section as the gated status last answered it, or the setup's answer before it. */
    let status: GitHosts | null = $state(null);
    const held = $derived(status ?? hosts);
    /** The client id typed per host, and the sentence each host's last press answered. */
    let typed: Record<string, string> = $state({});
    let said: Record<string, string> = $state({});
    let pressing = $state('');

    async function refresh(): Promise<void> {
        const read = await gitStatus();
        if (read !== null) status = read;
    }

    $effect(() => {
        void refresh();
    });

    // Each answer is a new `held`, so the wait is set again after every answer while one waits.
    $effect(() => {
        if (!held.hosts.some((host) => host.flow?.state === 'waiting')) return;
        const timer = setTimeout(() => void refresh(), WAIT_MS);
        return () => clearTimeout(timer);
    });

    async function press(key: string, action: string, clientId?: string): Promise<void> {
        pressing = key;
        try {
            const answer = await gitAction(key, action, clientId);
            said = { ...said, [key]: answer };
            if (answer === '' && action === 'client_id') typed = { ...typed, [key]: '' };
            await refresh();
        } finally {
            pressing = '';
        }
    }

    /** The words of where a Sign in stands. */
    function flowWords(flow: GitFlow): string {
        switch (flow.state) {
            case 'waiting':
                return t('accounts.git_waiting');
            case 'granted':
                return t('accounts.git_granted');
            case 'denied':
                return t('accounts.git_denied');
            case 'expired':
                return t('accounts.git_expired');
            case 'cancelled':
                return t('accounts.git_cancelled');
            case 'failed':
                return t('accounts.git_failed', flow.said);
        }
    }
</script>

<GroupHead
    data-provider="git"
    label={t('accounts.git_heading')}
    open={fold.open('git')}
    ontoggle={() => fold.toggle('git')}
>
    {#if held.helperRefused !== ''}
        <p class="missing">{held.helperRefused}</p>
    {/if}
    {#if held.hosts.length === 0}
        <p class="missing" data-git-none>{held.none}</p>
    {/if}
    {#each held.hosts as host (host.key)}
        <section class="host" data-git-host={host.key}>
            <h3>{host.name}</h3>
            {#if host.missing !== ''}
                <p class="missing">{host.missing}</p>
            {:else}
                <ol class="steps">
                    <li>
                        {t('accounts.git_step_register', host.address)}
                        {#if host.register !== ''}
                            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is the host's own registration page, rather than a route id resolve() takes -->
                            <a href={host.register} target="_blank" rel="noopener noreferrer"
                                >{host.register} <Glyph name={t('accounts.link_glyph')} /></a
                            >
                        {/if}
                    </li>
                    <li>
                        <Field label={t('accounts.git_client_id_field')}>
                            <TextInput
                                value={typed[host.key] ?? ''}
                                label={t('accounts.git_client_id_field')}
                                oninput={(value: string) =>
                                    (typed = { ...typed, [host.key]: value })}
                            />
                        </Field>
                        <ToolButton
                            label={t('accounts.save')}
                            disabled={pressing !== ''}
                            onclick={() => void press(host.key, 'client_id', typed[host.key] ?? '')}
                        />
                        {#if host.clientSaved}
                            <span class="said">{t('accounts.git_client_saved')}</span>
                        {/if}
                    </li>
                    <li>
                        {#if host.flow?.state === 'waiting'}
                            <p>{t('accounts.git_type_code')}</p>
                            <CopyValue value={host.flow.code} />
                            {#if host.flow.address.startsWith('https://')}
                                <!-- eslint-disable svelte/no-navigation-without-resolve -- the address is the host's own device page from its answer, rather than a route id resolve() takes -->
                                <a
                                    href={host.flow.address}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    >{host.flow.address}
                                    <Glyph name={t('accounts.link_glyph')} /></a
                                >
                                <!-- eslint-enable svelte/no-navigation-without-resolve -->
                            {/if}
                            <ToolButton
                                label={t('accounts.cancel')}
                                disabled={pressing !== ''}
                                onclick={() => void press(host.key, 'cancel')}
                            />
                        {:else}
                            <ToolButton
                                label={t('accounts.git_sign_in')}
                                disabled={pressing !== '' || !host.clientSaved}
                                onclick={() => void press(host.key, 'sign_in')}
                            />
                        {/if}
                        {#if host.flow !== null}
                            <p class="state" role="status">{flowWords(host.flow)}</p>
                        {/if}
                    </li>
                    {#if host.login !== ''}
                        <li>
                            <span class="said">{t('accounts.git_signed_in', host.login)}</span>
                            <ToolButton
                                label={t('accounts.git_sign_out')}
                                disabled={pressing !== ''}
                                onclick={() => void press(host.key, 'sign_out')}
                            />
                        </li>
                    {/if}
                </ol>
            {/if}
            {#if (said[host.key] ?? '') !== ''}
                <Empty error message={said[host.key]} />
            {/if}
        </section>
    {/each}
    {#if held.unlisted.length > 0}
        <section class="host" data-git-unlisted>
            <h3>{t('accounts.git_unlisted_heading')}</h3>
            {#each held.unlisted as one (one.key)}
                <p class="missing">{one.missing}</p>
                {#if one.login !== ''}
                    <span class="said">{t('accounts.git_signed_in', one.login)}</span>
                {/if}
                <ToolButton
                    label={t('accounts.git_sign_out')}
                    disabled={pressing !== ''}
                    onclick={() => void press(one.key, 'sign_out')}
                />
                {#if (said[one.key] ?? '') !== ''}
                    <Empty error message={said[one.key]} />
                {/if}
            {/each}
        </section>
    {/if}
</GroupHead>

<style>
    .host {
        display: grid;
        gap: 8px;
    }
    h3 {
        margin: 0;
        font-size: var(--fs-md);
    }
    .steps {
        display: grid;
        gap: 10px;
        margin: 0;
        padding-left: 20px;
    }
    .said {
        color: var(--c-green-d-txt);
        font-size: var(--fs-md);
    }
    .state {
        margin: 4px 0 0;
        font-size: var(--fs-md);
    }
    .missing {
        margin: 0;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
