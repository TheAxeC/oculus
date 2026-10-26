<script lang="ts">
    // Layer 3, shell. The status bar along the foot of the window, drawn as VS Code's: 22 px high,
    // its items 12 px words after an icon, flush one against the next, in a left group and a right
    // group (shell/status/status-items.ts names them and their order). Every item is a button that
    // says more in its tooltip and opens what it names.
    //
    // What the items say comes from three places. The page hands in the words made from stores the
    // shell's row of the boundary table does not name (state/workbench/navigation/status.ts): the
    // machine, the repository the bar follows, the findings, the problems, the HPC poll, the usage
    // refreshers, the server connection and the live sessions, with the git writes the branch and
    // sync items ask for. The source tab on screen publishes its own items' state to the editor
    // status store, which the shell reads; while a view tab of another pane is on screen the bar
    // keeps the items of the source tab on screen last, until that tab closes or is covered. The
    // unsaved tabs and the notifications are the shell's own, from the layout, ui and notices
    // stores.
    //
    // The problems item is VS Code's: the error and warning counts after their icons, and the info
    // count when there are infos, packed as `1K` from 1000 and `10K+` from 10000. Its tooltip names
    // the severities that have problems, and a press shows the Problems view or hides it.
    //
    // The debug item is drawn once a debug session has run since the server started: the name of
    // the last configuration with the bug glyph, and a press lists the repository's configurations,
    // whose pick starts it. While a session runs or is paused the whole bar is painted in the
    // orange the theme defines, with the ink derived for it.
    //
    // A right-click anywhere on the bar lists every item with a check, and unchecking one hides it;
    // the hidden set is the ui store's, saved with the appearance. The items apps add stand last in
    // the list, each named as `<name> (<app title>)` and kept hidden under `<view id>/<item id>`.
    //
    // The bar is one row and never wraps, and every item is drawn. When the items fit, the left
    // group stands at the bar's left edge and the right group at its right edge; when they do not,
    // the right group follows the left one and the bar scrolls sideways, opening at its left end.
    // A trackpad's sideways swipe scrolls it, a wheel's turn moves it sideways by the tab strip's
    // rule (ui/tabs/tab-strip.ts `horizontalWheelDelta`), and an item the Tab key focuses is
    // scrolled into view. No scrollbar is drawn, so the bar keeps its height, and a swipe that
    // reaches either end stops there rather than reaching the browser's back gesture. An item that
    // arrives or leaves keeps the scroll where it is, the browser clamping it to the new width. The
    // right group's markup is written in reverse order and the row reverses it back, so the bell
    // stands last at the right end and the Tab key walks the right group from its right end to its
    // left.
    // An item is at most 40 % of the window wide, a longer text ends in an ellipsis, and the
    // several buttons of the linter item share its width, each ending in an ellipsis.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import AppItems from './AppItems.svelte';
    import Bell from './notices/Bell.svelte';
    import LatexItem from './LatexItem.svelte';
    import RepoItems from './RepoItems.svelte';
    import SourceItems from './SourceItems.svelte';
    import { toggleView } from '$lib/shell/keys/keys';
    import { horizontalWheelDelta } from '$lib/ui/tabs/tab-strip';
    import {
        STATUS_ITEMS,
        isStatusItem,
        itemName,
        packNumber,
        type StatusItem
    } from './status-items';
    import { firstUnsaved, unsavedCount } from '$lib/state/workbench/navigation/pages';
    import { sourceKept } from '$lib/state/workbench/navigation/editor-status.svelte';
    import {
        NO_GIT,
        hpcTip,
        type StatusGit,
        type StatusWords
    } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        appShell,
        debug,
        editorStatus: { statusOf },
        layout,
        ui
    } = useState();
    const { setStatusHidden, statusHidden, unsaved } = ui;
    const { activeInstance, activateInstance, hosts, openView, switchPage } = layout;

    type Props = {
        status: StatusWords;
        /** The git writes the branch and sync items ask the page for. */
        git?: StatusGit;
        /** Open the palette on a query, which the caret and language items do. */
        onpalette?: (prefill: string) => void;
        /** Open the palette as Go to Line, which the caret item does. */
        ongoto?: () => void;
    };

    let {
        status,
        git = NO_GIT,
        onpalette = () => undefined,
        ongoto = () => undefined
    }: Props = $props();

    const held = $derived(hosts());
    const dirty = $derived(unsavedCount(held, unsaved));
    const hidden = $derived(statusHidden());

    /** The source tab on screen last, which the bar keeps while a view tab of another pane is. */
    let kept = $state<string | null>(null);
    $effect(() => {
        const tab = activeInstance();
        if (tab?.view === 'source') kept = tab.id;
    });

    /** The source tab whose items the bar draws, once it has said what it holds. */
    const source = $derived(sourceKept(activeInstance(), kept, layout.layout(), statusOf));

    /**
     * Every item in the right-click menu, checked while it is drawn: the bar's own, then those the
     * apps add, each as its name and the app's title.
     */
    const choices = $derived<MenuItem[]>([
        ...STATUS_ITEMS.map((item) => ({
            id: item,
            label: itemName(item),
            active: !hidden.includes(item)
        })),
        ...(['left', 'right'] as const).flatMap((side) =>
            appShell.statusItems(side).map(({ key, appTitle, item }) => ({
                id: key,
                label: t('statusbar.item_app', item.name === '' ? item.id : item.name, appTitle),
                active: !hidden.includes(key)
            }))
        )
    ]);

    function shown(item: StatusItem): boolean {
        return !hidden.includes(item);
    }

    function toggled(id: string): void {
        if (isStatusItem(id)) setStatusHidden(id, shown(id));
        else setStatusHidden(id, !hidden.includes(id));
    }

    /** The problems of the page by severity, which the problems item counts. */
    const counts = $derived(status.problems);
    /** The tooltip: the severities that have problems, as VS Code words them. */
    const problemsTip = $derived.by(() => {
        const parts = [
            counts.errors > 0 ? t('statusbar.problems_part_errors', counts.errors) : '',
            counts.warnings > 0 ? t('statusbar.problems_part_warnings', counts.warnings) : '',
            counts.infos > 0 ? t('statusbar.problems_part_infos', counts.infos) : ''
        ].filter((part) => part !== '');
        return parts.length === 0
            ? t('statusbar.problems_none')
            : parts.join(t('statusbar.problems_join'));
    });

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

    /**
     * A wheel or a trackpad over the bar while its items do not fit: either axis of the gesture
     * moves the bar sideways, and the page neither scrolls nor goes back.
     */
    function wheeled(event: WheelEvent & { currentTarget: HTMLElement }): void {
        const bar = event.currentTarget;
        if (bar.scrollWidth <= bar.clientWidth) return;
        const delta = horizontalWheelDelta(event.deltaX, event.deltaY);
        if (delta === 0) return;
        event.preventDefault();
        bar.scrollLeft += delta;
    }
</script>

<ContextMenu label={t('statusbar.hide_menu')} items={choices} onpick={toggled}>
    <footer
        class="bar"
        class:debugging={debug.active() && debug.status() !== 'starting'}
        aria-label={t('statusbar.label')}
        data-status-bar
        onwheel={wheeled}
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
                <RepoItems
                    repo={status.repo}
                    {git}
                    choices={status.choices}
                    repository={shown('repository')}
                    branch={shown('branch')}
                    sync={shown('sync')}
                />
            {/if}
            {#if shown('problems')}
                <span data-status="problems">
                    <ToolButton
                        label={problemsTip}
                        glyph="cross"
                        title={problemsTip}
                        status
                        onclick={() => toggleView(layout, ui, 'problems', layout.currentPage().id)}
                    >
                        {packNumber(counts.errors)}
                        <Glyph name="warn" />
                        {packNumber(counts.warnings)}
                        {#if counts.infos > 0}
                            <Glyph name="info" />
                            {packNumber(counts.infos)}
                        {/if}
                    </ToolButton>
                </span>
            {/if}
            {#if shown('findings')}
                <span data-status="findings">
                    <ToolButton
                        label={status.findings === 1
                            ? t('statusbar.findings_name_one')
                            : t('statusbar.findings_name', status.findings)}
                        glyph="warn"
                        title={status.findings === 1
                            ? t('statusbar.findings_tip_one')
                            : t('statusbar.findings_tip', status.findings)}
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
                        title={hpcTip(status.hpc.long)}
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
            <AppItems side="left" {hidden} />
        </div>
        <div class="group" data-status-group="right">
            <Bell drawn={shown('bell')} />
            {#if shown('unsaved')}
                <span data-status="unsaved">
                    <ToolButton
                        label={dirty === 1
                            ? t('statusbar.unsaved_name_one')
                            : t('statusbar.unsaved_name', dirty)}
                        glyph="save"
                        title={dirty === 0
                            ? t('statusbar.unsaved_none')
                            : dirty === 1
                              ? t('statusbar.unsaved_tip_one')
                              : t('statusbar.unsaved_tip', dirty)}
                        status
                        disabled={dirty === 0}
                        onclick={openUnsaved}
                    >
                        {dirty}
                    </ToolButton>
                </span>
            {/if}
            {#if shown('sessions')}
                <span data-status="sessions">
                    <ToolButton
                        label={status.live === 1
                            ? t('statusbar.sessions_name_one')
                            : t('statusbar.sessions_name', status.live)}
                        glyph="agents"
                        title={status.live === 1
                            ? t('statusbar.sessions_tip_one')
                            : t('statusbar.sessions_tip', status.live)}
                        status
                        onclick={() => openView('session-list')}
                    >
                        {status.live}
                    </ToolButton>
                </span>
            {/if}
            <AppItems side="right" {hidden} />
            {#if source !== null}
                <SourceItems
                    instance={source.instance}
                    status={source.status}
                    {shown}
                    {onpalette}
                    {ongoto}
                />
            {/if}
        </div>
    </footer>
</ContextMenu>

<style>
    /* VS Code's status bar (statusbarpart.css): one row the bar's height, a left group and a right
       group, the ground's colour with a line along its top. The bar scrolls sideways when its
       items do not fit, with no scrollbar drawn, so the focus brings an item into view. A swipe
       past either end stays in the bar (overscroll-behavior-x), and the scroll is not moved to
       follow an item when another arrives or leaves (overflow-anchor). The ground is the bar's
       own, so it fills the bar at any scroll position. */
    .bar {
        --status-item-max: 40vw;
        display: flex;
        flex: 0 0 auto;
        align-items: stretch;
        box-sizing: border-box;
        height: var(--status-height);
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-x: contain;
        overflow-anchor: none;
        scrollbar-width: none;
        border-top: 1px solid var(--line);
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font-size: var(--status-text);
    }

    .bar::-webkit-scrollbar {
        display: none;
    }

    /* A group lays its items out on one row and never wraps, as wide as its items. The right group
       stands at the bar's right edge while there is room (its left margin takes the room) and
       follows the left group when there is none; it lays its items out from its right end, its
       markup written reversed (flex-direction: row-reverse draws the first item at the right). */
    .group {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-items: stretch;
    }

    .group[data-status-group='right'] {
        flex-direction: row-reverse;
        margin-left: auto;
    }

    .group > :global(*) {
        display: flex;
        flex: 0 0 auto;
        max-width: var(--status-item-max);
    }

    /* A session runs or is paused: the whole bar takes the orange and the ink derived for it. A
       hovered or open item takes the fill derived from the orange (themes/derive.ts), and an item
       in the warning tone, whose amber does not read on the orange, takes the bar's ink in bold;
       the status ToolButton reads both from these properties, and the status MenuOpener reads
       the fill. */
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
