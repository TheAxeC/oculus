<script module lang="ts">
    // Layer 3, view registration. The Apps view is the first row of the Apps group, before the
    // views the apps themselves add, and the view the Apps page shows.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'apps',
        label: 'views.apps',
        glyph: 'views.apps_glyph',
        group: 'apps',
        order: 0,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. Every app the apps store holds, machine apps and root apps, as VS Code's
    // Extensions view lists the extensions: one row per app with its glyph, its title, the root a
    // root app belongs to and the state it is in (state/system/apps/words.ts, `appStateWords`). A
    // search box over the list keeps the rows whose title or name holds what is typed, held in
    // the instance's state so a tab comes back filtered as it was.
    //
    // A press on a row opens the app's tab in the page's documents pane, beside the list and never
    // over it, as VS Code opens an extension's page beside the Extensions view; an app that waits
    // for approval, or a kept app whose files changed since it was approved, opens on its approval
    // panel (`apps.review`). The row's
    // right-click menu and its hover menu hold the choices the Views catalogue's menu holds
    // (`apps.choices`, picked through `apps.pick`): Disable, Disable (Workspace), Enable, Enable
    // (Workspace) and, for a machine app alone, Remove, each asking first as it does there.
    //
    // The title bar holds Add app from folder. With no app installed the view says so, with Add
    // app from folder under the sentence; a search that keeps no row says that no app matches.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import { appViewId, type AppRow } from '$lib/state/system/apps/apps.svelte';
    import { appStateWords } from '$lib/state/system/apps/words';
    import { instanceMap, instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        apps,
        layout: { openView },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const search = $derived(instanceText(instanceState(instance.id), 'search'));
    const all = $derived(apps.rows());
    const shown = $derived(matching(all, search));
    let asked: Ask | null = $state(null);

    /** The rows whose title or name holds the typed words, ignoring case. */
    function matching(rows: AppRow[], typed: string): AppRow[] {
        const needle = typed.trim().toLowerCase();
        if (needle === '') return rows;
        return rows.filter(
            (row) =>
                row.title.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle)
        );
    }

    /** Whether the app opens on its approval panel: it waits for approval or changed since. */
    function asksApproval(row: AppRow): boolean {
        return !row.approved || (row.kept && !row.hashApproved);
    }

    /** Open the app's tab, on its approval panel when it asks for approval. */
    function open(row: AppRow): void {
        const id = appViewId(row.root, row.name);
        if (asksApproval(row)) apps.review(id, true);
        else openView(id, undefined, undefined, { document: true });
    }

    /** One of the app's choices, which asks first through the question this view draws. */
    function pick(row: AppRow, choice: string): void {
        void apps.pick(appViewId(row.root, row.name), choice, (question) => (asked = question));
    }
</script>

{#snippet tools()}
    <Toolbar label={t('views.apps')}>
        <ToolButton
            bare
            glyph={t('apps.add_glyph')}
            label={t('apps.menu_add')}
            title={t('apps.list_add_tip')}
            onclick={() => void apps.addFromPanel()}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('apps.list_search')}>
        <Search
            fill
            value={search}
            placeholder={t('apps.list_search')}
            oninput={(typed: string) =>
                setInstanceState(instance.id, {
                    ...instanceMap(instanceState(instance.id)),
                    search: typed
                })}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.apps')} toolbar={tools} {bar} tinted>
    <div class="apps" data-instance={instance.id}>
        {#if all.length === 0}
            <Empty message={t('apps.list_none')} glyph={t('views.apps_glyph')}>
                {#snippet action()}
                    <ToolButton
                        label={t('apps.menu_add')}
                        glyph={t('apps.add_glyph')}
                        onclick={() => void apps.addFromPanel()}
                    />
                {/snippet}
            </Empty>
        {:else if shown.length === 0}
            <Empty message={t('apps.list_no_match')} />
        {:else}
            {#each shown as row (appViewId(row.root, row.name))}
                {@const choices = apps.choices(row)}
                <ContextMenu
                    label={row.title}
                    items={choices}
                    onpick={(choice: string) => pick(row, choice)}
                >
                    <div class="row" data-app={appViewId(row.root, row.name)}>
                        <RowButton
                            title={asksApproval(row)
                                ? t('apps.list_review_tip', row.title)
                                : t('apps.list_open_tip', row.title)}
                            onclick={() => open(row)}
                        >
                            <span class="top">
                                <Glyph name={row.glyph} />
                                <span class="name">{row.title}</span>
                                {#if row.root !== ''}
                                    <span class="root">{row.root}</span>
                                {/if}
                            </span>
                            <span class="state">{appStateWords(row)}</span>
                        </RowButton>
                        <span class="more">
                            <Menu
                                label={t('apps.list_actions')}
                                items={choices}
                                glyph="more"
                                compact
                                bare
                                align="right"
                                placement="down"
                                onpick={(choice: string) => pick(row, choice)}
                            />
                        </span>
                    </div>
                </ContextMenu>
            {/each}
        {/if}
    </div>
</Pane>
<AskConfirm asking={asked} onclose={() => (asked = null)} />

<style>
    .apps {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 4px 0;
    }

    .row {
        display: flex;
        align-items: center;
        padding: 2px 4px;
        border-radius: var(--radius-sm);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .row:hover,
    .row:focus-within {
        background: var(--chip);
    }

    .top {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
    }

    .root,
    .state {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* The row's menu, drawn while the pointer is over the row or the focus is inside it, as
       VS Code draws an extension's gear. */
    .more {
        opacity: 0;
    }

    .row:hover .more,
    .row:focus-within .more {
        opacity: 1;
    }
</style>
