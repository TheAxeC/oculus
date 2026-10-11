<script module lang="ts">
    // Layer 3, view registration. The component that draws the tree views apps contribute. Its
    // registrations are built from the rows of the `apps` channel in routes/views.ts
    // (registerApps), so this export only marks the module as the one that draws them.
    export const appRegistration = 'tree';
</script>

<script lang="ts">
    // Layer 3, view. One tree view of an app, as its manifest declares it under
    // `contributes.views`. The rows are the host's: the app's program answers `getChildren` and
    // `getTreeItem` for the elements it keeps, oculus holds a handle for each
    // (state/system/apps/shell/show/tree-feed.svelte.ts) and draws them with the tree of ui/tree
    // and its virtual rows, so the keys of every tree work here. A press selects a row, runs its
    // command and opens or closes it; a right-click opens the `view/item/context` entries whose
    // `when` holds for the row's `contextValue`, and the entries of the group `inline` are buttons
    // on the row. `view/title` entries stand in the view's header.
    //
    // The view says why it has no rows: the app is not approved or is disabled (its own tab offers
    // the choices), a `when` of the view does not hold, the app declares no program, the program
    // stopped, or the program has not registered the tree yet. The first drawing fires `onView`,
    // which starts the program of an app that names it.

    import { tick, untrack } from 'svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ActionStrip from '$lib/ui/tabs/ActionStrip.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { treeTarget } from '$lib/state/system/apps/frame/target';
    import { appIcon, type AppIcon } from '$lib/state/system/apps/shell/show/icons';
    import {
        createTreeFeed,
        type TreeRow
    } from '$lib/state/system/apps/shell/show/tree-feed.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import AppTreeRows from './AppTreeRows.svelte';

    const { appShell, apps, layout } = useState();

    let { instance }: ViewProps = $props();

    const target = $derived(treeTarget(instance.view, (app) => apps.rowOf(app)));
    const row = $derived(target === null ? undefined : apps.rowOf(target.app));
    const entry = $derived(target?.entry);
    const host = $derived(target === null ? undefined : apps.hostOf(target.app));
    const tree = $derived(
        target === null
            ? undefined
            : appShell.hostOf(target.app)?.trees.find((one) => one.view === target.entry.id)
    );
    const name = $derived(
        tree?.title !== undefined && tree.title !== '' ? tree.title : (entry?.name ?? '')
    );

    /** Whether the start-up of the app for this view has been asked and answered. */
    let activated = $state(false);
    $effect(() => {
        const app = target?.app;
        const view = target?.entry.id;
        if (app === undefined || view === undefined || !row?.approved) return;
        untrack(() => {
            activated = false;
            void apps.drawn(app, view).then(() => (activated = true));
        });
    });

    const feed = createTreeFeed({
        tree: () => tree,
        provide: (kind, handle) =>
            target === null
                ? Promise.resolve({ ok: false, word: 'missing' })
                : appShell.provide(target.app, kind, target.entry.id, handle)
    });

    /** The line saying why there are no rows, or the empty string while there are. */
    const line = $derived.by((): string => {
        if (row === undefined || entry === undefined) return t('ui.unknown_view', instance.view);
        if (row.disabled) return t('apps.disabled_line');
        if (!row.approved || !row.hashApproved) return t('apps.view_unapproved', row.title);
        if (!appShell.holds(entry.when)) return t('apps.view_when_line');
        if (row.host === '') return t('apps.tree_no_host');
        if (tree !== undefined) {
            return feed.failed() === '' ? '' : t('apps.tree_failed', feed.failed());
        }
        const running = host?.state === 'running' || host?.state === 'starting';
        return running || !activated ? t('apps.tree_loading') : t('apps.tree_host_stopped');
    });
    /** Whether the line has the button that opens the app's own tab. */
    const opensApp = $derived(
        row !== undefined && (row.disabled || !row.approved || !row.hashApproved)
    );

    const rows = $derived(feed.rows());
    const index = $derived(new Map(rows.map((one, at) => [one.handle, at])));
    const keyRows = $derived(
        rows.map((one) => ({ id: one.handle, parent: one.parent, open: one.open }))
    );

    let selected: string[] = $state([]);
    let navigation: TreeNav | undefined;

    /** The parts of the place a row's menus are drawn in. */
    function placeOf(one: TreeRow): Parameters<typeof appShell.choices>[1] {
        return {
            view: entry?.id,
            viewItem: one.contextValue,
            ...(one.resource === null ? {} : { resource: { ...one.resource, language: '' } })
        };
    }

    /**
     * The entries of `view/item/context` for a row, and those of them that stand on its line, each
     * with the icon its command names.
     */
    function menuOf(one: TreeRow) {
        const shown = appShell.choices('view/item/context', placeOf(one));
        const inline = shown.offers.flatMap((offer, at) =>
            offer.group === 'inline'
                ? [
                      {
                          at,
                          icon: appIcon(offer.command.icon, (path) =>
                              appShell.picture(offer.app, path)
                          )
                      }
                  ]
                : []
        );
        return { ...shown, inline };
    }

    /** The icon a row names. */
    function iconOf(one: TreeRow): AppIcon {
        return appIcon(one.iconPath, (path) =>
            target === null ? '' : appShell.picture(target.app, path)
        );
    }

    function report(kind: 'selection' | 'expand' | 'collapse', params: Record<string, unknown>) {
        if (target !== null)
            void appShell.report(target.app, kind, { view: target.entry.id, ...params });
    }

    function toggle(handle: string): void {
        report(feed.toggle(handle) ? 'expand' : 'collapse', { handle });
    }

    /** Select a row: it alone, or with Ctrl or Cmd added or taken off when the tree takes many. */
    function select(one: TreeRow, event: MouseEvent): void {
        const many = tree?.canSelectMany === true && (event.ctrlKey || event.metaKey);
        selected = many
            ? selected.includes(one.handle)
                ? selected.filter((handle) => handle !== one.handle)
                : [...selected, one.handle]
            : [one.handle];
        report('selection', { handles: selected });
    }

    function press(one: TreeRow, event: MouseEvent): void {
        select(one, event);
        if (one.command !== null && target !== null) {
            void appShell.run(target.app, one.command.command, one.command.arguments);
        }
        if (one.open !== undefined) toggle(one.handle);
    }

    function pick(one: TreeRow, pickId: string, event: MouseEvent): void {
        const { offers } = menuOf(one);
        const element = { $treeViewId: target?.entry.id ?? '', $treeItemHandle: one.handle };
        void appShell.runEntry(offers, pickId, [element], event.altKey);
    }

    // The tree is shown to the program while it is drawn.
    $effect(() => {
        if (target === null || tree === undefined) return;
        const app = target.app;
        const view = target.entry.id;
        untrack(() => void appShell.report(app, 'visibility', { view, visible: true }));
        return () => void appShell.report(app, 'visibility', { view, visible: false });
    });

    // A reveal the program asked for opens the rows on the way and puts the cursor on the row.
    let revealed = 0;
    $effect(() => {
        const asked = tree?.reveal;
        if (asked === null || asked === undefined) return;
        untrack(() => {
            if (asked.count <= revealed) return;
            revealed = asked.count;
            if (!feed.reveal(asked.handle)) return;
            selected = [asked.handle];
            void tick().then(() => navigation?.focus(asked.handle));
        });
    });

    const title = $derived(appShell.strip('view/title', { view: entry?.id }));
</script>

<Pane title={name} {toolbar}>
    {#if line !== ''}
        <Empty message={line}>
            {#snippet action()}
                {#if opensApp && target !== null}
                    <ToolButton
                        label={t('apps.open_app')}
                        onclick={() => layout.openView(target.app)}
                    />
                {/if}
            {/snippet}
        </Empty>
    {:else}
        {#if tree?.message !== undefined && tree.message !== ''}
            <p class="message">{tree.message}</p>
        {/if}
        {#if tree?.description !== undefined && tree.description !== ''}
            <p class="message">{tree.description}</p>
        {/if}
        {#if feed.loaded() && rows.length === 0}
            <Empty message={t('apps.tree_empty')} />
        {/if}
        <div class="rows" data-app-tree={entry?.id}>
            <TreeView
                label={name}
                rows={keyRows}
                current={selected.at(-1) ?? ''}
                ontoggle={(handle: string) => toggle(handle)}
            >
                {#snippet children(nav: TreeNav)}
                    <AppTreeRows
                        {nav}
                        {rows}
                        {index}
                        {selected}
                        {menuOf}
                        {iconOf}
                        onpress={press}
                        onpick={pick}
                        onnav={(held: TreeNav) => (navigation = held)}
                    />
                {/snippet}
            </TreeView>
        </div>
    {/if}
</Pane>

{#snippet toolbar()}
    {#if tree?.badge !== null && tree?.badge !== undefined}
        <Chip label={String(tree.badge.value)} title={tree.badge.tooltip} filled />
    {/if}
    {#if tree?.showCollapseAll === true}
        <ToolButton
            label={t('apps.tree_collapse')}
            glyph="collapse_all"
            compact
            bare
            onclick={feed.collapseAll}
        />
    {/if}
    <ActionStrip
        label={t('apps.view_actions')}
        actions={title.actions}
        onpick={(id: string, event: MouseEvent) =>
            void appShell.runEntry(title.offers, id, [], event.altKey)}
    />
{/snippet}

<style>
    .message {
        margin: 0;
        padding: 4px 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .rows {
        min-width: 0;
    }
</style>
