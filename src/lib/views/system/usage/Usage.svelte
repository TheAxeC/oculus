<script module lang="ts">
    // Layer 3, view registration. Usage closes the current system views.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'usage',
        label: 'views.usage',
        glyph: 'views.usage_glyph',
        group: 'system',
        order: 4
    };
</script>

<script lang="ts">
    // Layer 3, view. Show each configured Claude or Codex subscription, its current windows, live
    // Claude sessions and seven-day token totals.
    //
    // A healthy refresher's line names its last refresh and its next one. The next is the last plus
    // `usage_refresh_min` of config/behavior.yml, read off the config channel the page already
    // holds, so the refresher's payload carries no time it can be computed from.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Meter from '$lib/ui/display/Meter.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Table from '$lib/ui/display/Table.svelte';
    import type { Column } from '$lib/ui/display/table-rows';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { basename, clock } from '$lib/state/shared/words/format';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import {
        hasUsageStatus,
        nextRefresh,
        orderedWindows,
        usageRows,
        type UsageAccount,
        type UsageWindow
    } from '$lib/state/system/usage';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config, usage },
        usageRefresh: { refreshRefusal, refreshUsageAccount }
    } = useState();

    let { instance }: ViewProps = $props();
    const data = $derived(usage());
    const cursor = $derived(cardCursor(instance.state));
    /** Minutes between two refreshes, and 0 until the config channel has delivered the cadence. */
    const cadence = $derived.by(() => {
        const held = config()?.config.usage_refresh_min;
        return typeof held === 'number' && Number.isFinite(held) && held > 0 ? held : 0;
    });

    const columns: Column[] = [
        { key: 'day', label: t('usage.col_day') },
        { key: 'tool', label: t('usage.col_tool') },
        { key: 'account', label: t('usage.col_account') },
        { key: 'model', label: t('usage.col_model') },
        { key: 'input', label: t('usage.col_input'), numeric: true },
        { key: 'output', label: t('usage.col_output'), numeric: true },
        { key: 'cacheRead', label: t('usage.col_cache_read'), numeric: true },
        { key: 'cacheCreation', label: t('usage.col_cache_creation'), numeric: true }
    ];

    function tone(window: UsageWindow): string {
        if (window.severity === 'critical') return 'red';
        if (window.severity === 'warning') return 'amber';
        if (window.severity === 'normal') return 'green';
        return window.usedPercent >= 90 ? 'red' : window.usedPercent >= 75 ? 'amber' : 'green';
    }

    function duration(resetsAt: number, builtAt: string): string {
        const minutes = Math.max(0, Math.ceil((resetsAt * 1000 - Date.parse(builtAt)) / 60000));
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        if (days > 0) return t('usage.duration_days_hours', days, hours);
        if (hours > 0) return t('usage.duration_hours_minutes', hours, minutes % 60);
        return t('usage.duration_minutes', minutes);
    }

    function windowLabel(window: UsageWindow): string {
        if (window.name === 'five_hour') return t('usage.five_hour');
        if (window.name === 'seven_day') return t('usage.seven_day');
        if (window.name === 'weekly_model') return t('usage.weekly_model', window.model ?? '');
        if (window.name === 'primary') return t('usage.primary');
        return t('usage.secondary');
    }

    function windowText(window: UsageWindow, builtAt: string): string {
        if (window.name === 'five_hour' && window.observedAt === '' && window.resetsAt === 0) {
            return t('usage.no_window');
        }
        return t(
            'usage.window_text',
            Math.round(window.usedPercent),
            t('usage.resets_in', duration(window.resetsAt, builtAt))
        );
    }

    function hasStatus(account: UsageAccount): boolean {
        return hasUsageStatus(account);
    }

    function accountId(account: UsageAccount): string {
        return `${account.tool}:${account.label}`;
    }

    function refresherReason(reason: string): string {
        if (reason === 'login_required') return t('usage.refresher_login_required');
        if (reason === 'usage_limit') return t('usage.refresher_usage_limit');
        if (reason === 'offline') return t('usage.refresher_offline');
        if (reason === 'prompt_missing') return t('usage.refresher_prompt_missing');
        if (reason === 'start_failed') return t('usage.refresher_start_failed');
        return t('usage.refresher_refresh_failed');
    }

    function refresherText(account: UsageAccount): string {
        const refusal = refreshRefusal(account.label);
        if (refusal !== '') return refusal;
        const refresher = account.refresher;
        if (refresher === undefined) return '';
        if (refresher.state === 'down') {
            return t(
                'usage.refresher',
                t('usage.refresher_down', clock(refresher.since), refresherReason(refresher.reason))
            );
        }
        if (refresher.state === 'refreshing') {
            return t('usage.refresher', t('usage.refresher_refreshing'));
        }
        // A refresh inside Claude Code's five-minute window changes no figure; the card says so.
        const stale = !refresher.renewed && account.fetchedAt !== undefined;
        return t(
            'usage.refresher',
            stale
                ? t('usage.refresher_stale', clock(account.fetchedAt ?? ''))
                : healthyText(refresher.lastRefresh)
        );
    }

    /**
     * A healthy refresher's words: the last refresh and the next one, the last alone while the
     * cadence is not known yet, and the bare word before the first refresh has a time.
     */
    function healthyText(lastRefresh: string): string {
        const last = clock(lastRefresh);
        if (last === '') return t('usage.refresher_ok_bare');
        const next = nextRefresh(lastRefresh, cadence);
        if (next === '') return t('usage.refresher_ok_last', last);
        return t('usage.refresher_ok', last, clock(next));
    }
</script>

<Pane title={t('views.usage')}>
    <div class="usage" data-instance={instance.id}>
        {#if data?.accounts.length}
            <div class="accounts">
                {#each data.accounts as account (`${account.tool}:${account.label}`)}
                    {@const windows = orderedWindows(account.windows)}
                    <Card
                        id={accountId(account)}
                        cursor={cursor === accountId(account)}
                        title={account.label}
                        level={3}
                    >
                        {#snippet meta()}
                            <Tag label={account.tool} />
                            {#if account.email}
                                <Tag label={account.email} />
                            {/if}
                            {#if account.organisation}
                                <Tag label={account.organisation} />
                            {/if}
                            {#if account.tierLabel}
                                <Tag label={account.tierLabel} tone="teal" />
                            {/if}
                            {#if account.billing}
                                <Tag label={account.billing} />
                            {/if}
                            {#if account.tool === 'claude'}
                                <ToolButton
                                    label={t('usage.refresh')}
                                    glyph="refresh"
                                    onclick={() => refreshUsageAccount(account.label)}
                                />
                            {/if}
                        {/snippet}
                        {#if hasStatus(account)}
                            {#if windows.length}
                                <div class="windows">
                                    {#each windows as window (`${window.name}:${window.model ?? ''}`)}
                                        <div class="window">
                                            <span class="window-name">{windowLabel(window)}</span>
                                            <Meter
                                                value={window.usedPercent / 100}
                                                tone={tone(window)}
                                                label={windowLabel(window)}
                                                text={windowText(window, data.builtAt)}
                                            />
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                            {#if account.live.length}
                                <section class="live">
                                    <h3>{t('usage.live')}</h3>
                                    {#each account.live as session (session.sessionId)}
                                        <div class="live-row">
                                            <span>{session.model}</span>
                                            {#if session.contextPercent !== null}
                                                <span
                                                    >{t(
                                                        'usage.context',
                                                        Math.round(session.contextPercent)
                                                    )}</span
                                                >
                                            {/if}
                                            {#if session.costUsd !== null}
                                                <span
                                                    >{t(
                                                        'usage.cost',
                                                        session.costUsd.toFixed(2)
                                                    )}</span
                                                >
                                            {/if}
                                            <span class="session"
                                                >{t(
                                                    'usage.session',
                                                    session.sessionId.slice(0, 8)
                                                )}</span
                                            >
                                            <span>{basename(session.cwd)}</span>
                                        </div>
                                    {/each}
                                </section>
                            {/if}
                        {:else if account.tool === 'claude'}
                            <Empty message={t('usage.no_line')} glyph="circle_empty" />
                        {:else}
                            <Empty message={t('usage.no_data')} glyph="circle_empty" />
                        {/if}
                        {#if account.tool === 'claude' && (account.refresher !== undefined || refreshRefusal(account.label) !== '')}
                            <p class="refresher">{refresherText(account)}</p>
                        {/if}
                    </Card>
                {/each}
            </div>
        {:else if data}
            <Empty message={t('usage.no_accounts')} glyph="circle_empty" />
        {/if}
        {#if data}
            <section class="history">
                <h2>{t('usage.history')}</h2>
                {#if data.days.length}
                    <Table
                        {columns}
                        rows={usageRows(data.days, t('usage.total'))}
                        rowKey="rowKey"
                    />
                {:else}
                    <Empty message={t('usage.no_history')} glyph="circle_empty" />
                {/if}
            </section>
        {/if}
    </div>
</Pane>

<style>
    .usage {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
    }

    .accounts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 10px;
    }

    .windows {
        display: grid;
        gap: 8px;
    }

    .window {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
    }

    .window-name,
    .live-row {
        font-size: var(--fs-sm);
    }

    .refresher {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .live {
        margin-top: 10px;
    }

    .live h3,
    .history h2 {
        margin: 0 0 6px;
        font-size: var(--fs-sm);
    }

    .live-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 10px;
        padding: 4px 0;
        border-top: 1px solid var(--line);
    }

    .session {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .history {
        min-width: 0;
        overflow-x: auto;
    }
</style>
