<script lang="ts">
    // Layer 3, view partial. The Login node section: oculus's own Recover sessions on the cluster's
    // tmux socket `oculus-recover`, which run on the login node and are not jobs, so squeue does
    // not show them. Each row is a dataset's fetch with its hub, the bytes its folder holds of what
    // the sources list, the rate those bytes grow at, its state and Stop.
    //
    // The section is a fold that starts shut. The sessions are the server's push (the `recover`
    // channel the page already holds), read on the login node by Live HPC's own poll and once a
    // minute while a Recover run on the cluster is followed, the server measuring the rate between
    // the last two readings; opening the fold asks nothing. Before the first reading, while Live
    // HPC's last poll had no answer, the section shows Live HPC's reason.
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import { type Column, cellText } from '$lib/ui/display/table/table-rows';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        refusalWords,
        sizeWords,
        type RecoverSession
    } from '$lib/state/system/machine/recover-words';

    /** Live HPC's words for why its last poll had no answer, or empty when it had one. */
    let { reason = '' }: { reason?: string } = $props();

    const {
        recover: { sessions, act }
    } = useState();

    /** The session a Stop is asked about, by its row key, or null. */
    let asking: { hub: string; key: string } | null = $state(null);
    /** What the last Stop answered when it was refused. */
    let outcome = $state('');

    /** The sessions of the last reading of the cluster, or null before one. */
    const held = $derived(sessions());

    /** A session's row key: its hub and its dataset. */
    const rowKey = (one: RecoverSession): string => `${one.hub}/${one.key}`;

    const columns: Column[] = [
        { key: 'hub', label: t('hpc.login_col_hub') },
        { key: 'key', label: t('hpc.login_col_dataset') },
        { key: 'done', label: t('hpc.login_col_done') },
        { key: 'rate', label: t('hpc.login_col_rate') },
        { key: 'state', label: t('hpc.col_state') },
        { key: 'actions', label: t('hpc.col_actions') }
    ];

    const tableRows = $derived(
        (held ?? []).map((one) => {
            const rate = one.rate;
            return {
                id: rowKey(one),
                hub: one.hub === '' ? t('hpc.none') : one.hub,
                hubName: one.hub,
                key: one.key,
                done:
                    one.total === null
                        ? sizeWords(one.done)
                        : t('hpc.login_of', sizeWords(one.done), sizeWords(one.total)),
                rate: rate === null ? t('hpc.none') : t('hpc.login_rate', sizeWords(rate)),
                state:
                    one.total !== null && one.done >= one.total
                        ? t('hpc.login_state_complete')
                        : t('hpc.login_state_fetching')
            };
        })
    );

    /** Stop a session; the server asks Live HPC for a poll, whose push draws the sessions left. */
    async function stop(hub: string, key: string): Promise<void> {
        const answer = await act(hub, key, 'cluster', 'stop');
        outcome = answer.ok
            ? ''
            : answer.refused === ''
              ? answer.error
              : refusalWords(answer.refused);
    }
</script>

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {#if column.key === 'state'}
        <Tag label={cellText(row.state)} tone="green" />
    {:else if column.key === 'actions'}
        {#if cellText(row.hubName) !== ''}
            <ToolButton
                small
                label={t('hpc.login_stop')}
                title={t('hpc.login_stop_title', cellText(row.key))}
                onclick={() => (asking = { hub: cellText(row.hubName), key: cellText(row.key) })}
            />
        {/if}
    {:else}
        {cellText(row[column.key])}
    {/if}
{/snippet}

<details class="login">
    <summary class="title">{t('hpc.login_title')}</summary>
    {#if held === null && reason !== ''}
        <Empty error message={reason} />
    {:else if held === null}
        <Empty message={t('hpc.login_loading')} />
    {:else if held.length === 0}
        <Empty message={t('hpc.login_none')} />
    {:else}
        <div class="scroll">
            <Table {columns} rows={tableRows} rowKey="id" {cell} />
        </div>
    {/if}
    {#if outcome !== ''}
        <p class="outcome">{outcome}</p>
    {/if}
</details>

{#if asking}
    <Confirm
        message={t('hpc.login_stop_confirm', asking.key, asking.hub)}
        confirm={t('hpc.login_stop')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            const one = asking;
            asking = null;
            if (one !== null) void stop(one.hub, one.key);
        }}
        oncancel={() => (asking = null)}
    />
{/if}

<style>
    .login {
        min-width: 0;
    }

    .title {
        cursor: pointer;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        color: var(--muted-txt);
        margin-bottom: 6px;
    }

    .title:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: 1px;
    }

    /* A table wider than the pane scrolls inside its own box. */
    .scroll {
        min-width: 0;
        overflow-x: auto;
    }

    .outcome {
        color: var(--ink-txt);
        font-size: var(--fs-md);
        margin: 4px 0 0;
    }
</style>
