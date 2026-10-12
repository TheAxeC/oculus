<script lang="ts">
    // Layer 3, view partial. The Customizations section at the foot of the sessions list, as VS
    // Code's Agents window draws it: for one agent, account and workspace, a row per kind of thing
    // the agent reads before its first turn, each with its count, listing its items when pressed.
    // An item opens in a source tab when a root the file server serves holds it, and otherwise in
    // the read-only Customization viewer, since the account's own folder is served by no root.
    //
    // The section keeps what it was scoped to and which rows are open in the list's instance state,
    // beside the list's own filter, under `custom`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import WorkspacePicker from '$lib/views/shared/sessions/WorkspacePicker.svelte';
    import {
        accountFor,
        accountsOf,
        composerPlaces,
        customizationScopeOf,
        withCustomizationScope,
        type CustomizationScopeState
    } from '$lib/state/sessions/terminal/composer/composer';
    import type { CustomizationKind, CustomizationItem } from '$lib/state/sessions/agents.svelte';
    import { rootHolding } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The list instance whose state keeps the section's scope. */
        owner: string;
    };

    let { owner }: Props = $props();

    const {
        agents: { agentChoices, customizations, refreshCustomizations },
        fs: { workspaces },
        layout: { openView },
        selectors: { hubRoot, sessionsByWorkspace },
        ui: { instanceState, setInstanceState }
    } = useState();

    const held = $derived(customizationScopeOf(instanceState(owner)));
    const hub = $derived(hubRoot());
    const places = $derived(composerPlaces(hub, workspaces().folders, sessionsByWorkspace(true)));
    const workspace = $derived(
        held.workspace !== '' && places.includes(held.workspace) ? held.workspace : (hub ?? '')
    );
    const allAccounts = $derived(agentChoices().value?.accounts ?? []);
    const accounts = $derived(accountsOf(allAccounts, held.agent));
    const account = $derived(accountFor(allAccounts, held.agent, held.account || undefined));
    const scope = $derived({ agent: held.agent, account, workspace });
    const read = $derived(workspace === '' ? null : customizations(scope));
    const rows = $derived(read?.value?.rows ?? []);

    function keep(next: Partial<CustomizationScopeState>): void {
        setInstanceState(owner, withCustomizationScope(instanceState(owner), { ...held, ...next }));
    }

    function toggleRow(kind: CustomizationKind): void {
        keep({
            expanded: held.expanded.includes(kind)
                ? held.expanded.filter((one) => one !== kind)
                : [...held.expanded, kind]
        });
    }

    function kindLabel(kind: CustomizationKind): string {
        if (kind === 'instructions') return t('customize.instructions');
        if (kind === 'skills') return t('customize.skills');
        if (kind === 'agents') return t('customize.agents');
        if (kind === 'hooks') return t('customize.hooks');
        if (kind === 'mcp') return t('customize.mcp');
        if (kind === 'plugins') return t('customize.plugins');
        return t('customize.tools');
    }

    /**
     * Open one item's file: in a source tab when a root of the workspace in force serves it, else
     * in the Customization viewer, which reads it through the listing that named it.
     */
    function open(item: CustomizationItem): void {
        const name = item.path.slice(item.path.lastIndexOf('/') + 1);
        const served = rootHolding(workspaces().folders, item.path);
        if (served !== null && served.path !== '') {
            openView('source', { ...sourceTabState(served.root.key, served.path), label: name });
            return;
        }
        openView('customization', {
            ...scope,
            path: item.path,
            label: name,
            id: `${scope.agent}:${scope.account}:${item.path}`
        });
    }
</script>

<div class="customize" data-customizations>
    <TreeSection
        label={t('customize.title')}
        id="customizations"
        open={held.open}
        ontoggle={() => keep({ open: !held.open })}
        title={t('customize.title_tip', workspace)}
    >
        {#snippet actions(reach: number)}
            <ToolButton
                label={t('customize.refresh')}
                glyph="refresh"
                compact
                tabindex={reach}
                onclick={() => refreshCustomizations(scope)}
            />
        {/snippet}
        <li class="scope" role="none">
            <span data-custom-picker="agent">
                <Menu
                    label={held.agent === 'codex'
                        ? t('sessions.kind_codex')
                        : t('sessions.kind_claude')}
                    placement="up"
                    items={[
                        {
                            id: 'claude',
                            label: t('sessions.kind_claude'),
                            active: held.agent === 'claude'
                        },
                        {
                            id: 'codex',
                            label: t('sessions.kind_codex'),
                            active: held.agent === 'codex'
                        }
                    ]}
                    onpick={(id: string) =>
                        keep({ agent: id === 'codex' ? 'codex' : 'claude', account: '' })}
                />
            </span>
            {#if accounts.length > 1}
                <span data-custom-picker="account">
                    <Menu
                        label={account}
                        placement="up"
                        items={accounts.map((one) => ({
                            id: one.label,
                            label: one.label,
                            title: one.dir,
                            active: one.label === account
                        }))}
                        onpick={(id: string) => keep({ account: id })}
                    />
                </span>
            {/if}
            <WorkspacePicker
                {workspace}
                {places}
                {hub}
                placement="up"
                onpick={(dir: string) => keep({ workspace: dir })}
            />
        </li>
        {#if read !== null && read.error !== ''}
            <li role="none"><Empty error message={read.error} /></li>
        {:else if read?.pending === true}
            <li class="line" role="none">{t('customize.loading')}</li>
        {/if}
        {#each rows as row (row.kind)}
            {@const listing = held.expanded.includes(row.kind)}
            <li role="none" data-custom-row={row.kind}>
                <TreeItem
                    label={kindLabel(row.kind)}
                    level={2}
                    depth={0}
                    expanded={listing}
                    count={row.count ?? undefined}
                    tone={row.findings.length > 0 ? 'warn' : undefined}
                    title={row.count === null ? t('customize.uncounted') : undefined}
                    onclick={() => toggleRow(row.kind)}
                />
            </li>
            {#if listing}
                {#each row.findings as finding (finding.path)}
                    <li role="none" data-custom-finding>
                        <TreeItem
                            label={t('customize.finding', finding.path)}
                            level={3}
                            depth={1}
                            tone="error"
                            title={finding.path}
                        />
                    </li>
                {/each}
                {#each row.items as item, at (`${at}:${item.path}:${item.name}`)}
                    <li role="none" data-custom-item={item.name}>
                        <TreeItem
                            label={item.name}
                            level={3}
                            depth={1}
                            title={item.path}
                            onclick={() => open(item)}
                        />
                    </li>
                {/each}
                {#if row.items.length === 0 && row.findings.length === 0}
                    <li role="none">
                        <TreeItem
                            label={row.count === null
                                ? t('customize.uncounted')
                                : t('customize.none')}
                            level={3}
                            depth={1}
                            tone="muted"
                            title={row.looked.join('\n')}
                        />
                    </li>
                {/if}
            {/if}
        {/each}
    </TreeSection>
</div>

<style>
    .customize {
        flex: none;
        max-height: 50%;
        overflow: auto;
        min-width: 0;
    }

    .scope {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
    }

    .line {
        padding: 2px 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
