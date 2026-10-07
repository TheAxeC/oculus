<script lang="ts">
    // Layer 3, shell. The status bar along the foot of the window, drawn as VS Code's: 22 px high,
    // its items 12 px words after an icon, flush one against the next, in a left group and a right
    // group (shell/status/status-items.ts names them and their order). Every item is a button that
    // says more in its tooltip and opens what it names.
    //
    // What the items say comes from three places. The page hands in the words made from stores the
    // shell's row of the boundary table does not name (state/workbench/navigation/status.ts): the
    // machine, the repository of the tab on screen, the findings, the HPC poll, the usage
    // refreshers, the server connection and the live sessions, with the git writes the branch and
    // sync items ask for. The source tab on screen publishes its own items' state to the editor
    // status store, which the shell reads. The unsaved tabs and the notifications are the shell's
    // own, from the layout, ui and notices stores.
    //
    // The debug item is drawn once a debug session has run since the server started: the name of
    // the last configuration with the bug glyph, and a press lists the repository's configurations,
    // whose pick starts it. While a session runs or is paused the whole bar is painted in the
    // orange the theme defines, with the ink derived for it.
    //
    // A right-click anywhere on the bar lists every item with a check, and unchecking one hides it;
    // the hidden set is the ui store's, saved with the appearance.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Bell from './Bell.svelte';
    import LatexItem from './LatexItem.svelte';
    import RepoItems from './RepoItems.svelte';
    import SourceItems from './SourceItems.svelte';
    import { STATUS_ITEMS, isStatusItem, itemName, type StatusItem } from './status-items';
    import { firstUnsaved, unsavedCount } from '$lib/state/workbench/navigation/pages';
    import { sourceOnScreen } from '$lib/state/workbench/navigation/editor-status.svelte';
    import {
        NO_GIT,
        type StatusGit,
        type StatusWords
    } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        debug,
        editorStatus: { statusOf },
        layout: { activeInstance, activateInstance, hosts, openView, switchPage },
        ui: { setStatusHidden, statusHidden, unsaved }
    } = useState();

    type Props = {
        status: StatusWords;
        /** The git writes the branch and sync items ask the page for. */
        git?: StatusGit;
        /** Open the palette on a query, which the caret and language items do. */
        onpalette?: (prefill: string) => void;
    };

    let { status, git = NO_GIT, onpalette = () => undefined }: Props = $props();

    const held = $derived(hosts());
    const dirty = $derived(unsavedCount(held, unsaved));
    const hidden = $derived(statusHidden());

    /** The source tab on screen, when the tab on screen is one and has said what it holds. */
    const source = $derived(sourceOnScreen(activeInstance(), statusOf));

    /** Every item in the right-click menu, checked while it is drawn. */
    const choices = $derived<MenuItem[]>(
        STATUS_ITEMS.map((item) => ({
            id: item,
            label: itemName(item),
            active: !hidden.includes(item)
        }))
    );

    function shown(item: StatusItem): boolean {
        return !hidden.includes(item);
    }

    function toggled(id: string): void {
        if (isStatusItem(id)) setStatusHidden(id, shown(id));
    }

    /** The repository's launch file is read while the debug item is drawn. */
    const debugRepo = $derived(debug.ran() && shown('debug') ? debug.repo() : null);
    $effect(() => {
        const path = debugRepo;
        if (path === null) return undefined;
        return debug.watch(path);
    });
    const debugListed = $derived(debugRepo === null ? null : debug.launches(debugRepo));
    const debugChosen = $derived(debugRepo === null ? null : debug.chosen(debugRepo, debugListed));
    /** The configurations the item lists; a repository with none offers the open file. */
    const debugChoices = $derived<MenuItem[]>(
        debugListed === null || debugListed.configurations.length === 0
            ? [{ id: '', label: t('debug.default_name') }]
            : debugListed.configurations.map((one) => ({
                  id: one.name,
                  label: one.name,
                  active: one.name === debugChosen?.name
              }))
    );
    /** The configuration that ran last, which the server names in the session it holds. */
    const debugName = $derived(debug.payload().session?.name ?? t('debug.default_name'));

    function debugPicked(name: string): void {
        if (debugRepo !== null && name !== '') debug.choose(debugRepo, name);
        void debug.start();
    }

    /** Show the first tab holding unsaved text, on its own page; a float needs no page switch. */
    function openUnsaved(): void {
        const found = firstUnsaved(held, unsaved);
        if (found === null) return;
        switchPage(found.page);
        activateInstance(found.instance, found.page);
    }
</script>

<ContextMenu label={t('statusbar.hide_menu')} items={choices} onpick={toggled}>
    <footer
        class="bar"
        class:debugging={debug.active() && debug.status() !== 'starting'}
        aria-label={t('statusbar.label')}
        data-status-bar
    >
        <div class="group" data-status-group="left">
            {#if shown('host')}
                <span data-status="host">
                    <ToolButton
                        label={status.host?.name ?? t('statusbar.host_waiting')}
                        glyph="host"
                        title={status.host === null
                            ? t('statusbar.host_waiting_tip')
                            : t('statusbar.host_tip', status.host.name, status.host.address)}
                        status
                        onclick={() => openView('status')}
                    />
                </span>
            {/if}
            {#if status.repo !== null}
                <RepoItems repo={status.repo} {git} branch={shown('branch')} sync={shown('sync')} />
            {/if}
            {#if shown('findings')}
                <span data-status="findings">
                    <ToolButton
                        label={t('statusbar.findings_name', status.findings)}
                        glyph="warn"
                        title={t('statusbar.findings_tip', status.findings)}
                        status
                        onclick={() => openView('findings')}
                    >
                        {status.findings}
                    </ToolButton>
                </span>
            {/if}
            {#if debug.ran() && shown('debug')}
                <span data-status="debug">
                    <Menu
                        status
                        label={t('statusbar.debug_name', debugName)}
                        words={debugName}
                        glyph="debug"
                        title={t('statusbar.debug_tip', debugName)}
                        items={debugChoices}
                        onpick={debugPicked}
                    />
                </span>
            {/if}
            {#if shown('hpc')}
                <span data-status="hpc">
                    <ToolButton
                        label={status.hpc.short}
                        glyph="hpc"
                        title={t('statusbar.hpc_tip', status.hpc.long)}
                        status
                        onclick={() => openView('hpc')}
                    />
                </span>
            {/if}
            {#if shown('usage')}
                <span data-status="usage">
                    <ToolButton
                        label={status.usage}
                        glyph="usage"
                        title={t('statusbar.usage_tip', status.usage)}
                        status
                        onclick={() => openView('usage')}
                    />
                </span>
            {/if}
            {#if shown('server')}
                <span data-status="server">
                    <ToolButton
                        label={status.socket}
                        glyph="server"
                        title={t('statusbar.server_tip', status.socket)}
                        status
                        onclick={() => openView('status')}
                    />
                </span>
            {/if}
            {#if shown('latex')}
                <LatexItem />
            {/if}
        </div>
        <div class="group" data-status-group="right">
            {#if source !== null}
                <SourceItems
                    instance={source.instance}
                    status={source.status}
                    {shown}
                    {onpalette}
                />
            {/if}
            {#if shown('sessions')}
                <span data-status="sessions">
                    <ToolButton
                        label={t('statusbar.sessions_name', status.live)}
                        glyph="agents"
                        title={t('statusbar.sessions_tip', status.live)}
                        status
                        onclick={() => openView('session-list')}
                    >
                        {status.live}
                    </ToolButton>
                </span>
            {/if}
            {#if shown('unsaved')}
                <span data-status="unsaved">
                    <ToolButton
                        label={t('statusbar.unsaved_name', dirty)}
                        glyph="save"
                        title={dirty === 0
                            ? t('statusbar.unsaved_none')
                            : t('statusbar.unsaved_tip', dirty)}
                        status
                        disabled={dirty === 0}
                        onclick={openUnsaved}
                    >
                        {dirty}
                    </ToolButton>
                </span>
            {/if}
            <Bell drawn={shown('bell')} />
        </div>
    </footer>
</ContextMenu>

<style>
    /* VS Code's status bar (statusbarpart.css): one row the bar's height, a left group and a right
       group pushed apart, the ground's colour with a line along its top. */
    .bar {
        display: flex;
        flex: 0 0 auto;
        align-items: stretch;
        justify-content: space-between;
        box-sizing: border-box;
        height: var(--status-height);
        min-width: 0;
        overflow: hidden;
        border-top: 1px solid var(--line);
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font-size: var(--status-text);
    }

    /* A group narrower than its items clips them at its inner edge, so a long item never draws
       over the other group: the left group loses its last items, the right group its first. */
    .group {
        display: flex;
        align-items: stretch;
        min-width: 0;
        overflow: hidden;
    }

    .group[data-status-group='right'] {
        justify-content: flex-end;
    }

    .group > :global(*) {
        display: flex;
        flex: 0 0 auto;
    }

    /* A session runs or is paused: the whole bar takes the orange and the ink derived for it. A
       hovered or open item takes the fill derived from the orange (themes/derive.ts), and an item
       in the warning tone, whose amber does not read on the orange, takes the bar's ink in bold;
       the status ToolButton reads both from these properties. */
    .bar.debugging {
        background: var(--c-orange);
        color: var(--on-c-orange);
        --status-hover: var(--c-orange-hover);
        --status-warning: var(--on-c-orange);
        --status-warning-weight: 600;
    }

    :global(body.wall) .bar {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall) .bar.debugging {
        background: var(--c-orange);
        backdrop-filter: none;
    }
</style>
