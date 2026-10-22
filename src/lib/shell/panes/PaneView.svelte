<script lang="ts">
    // Layer 3, shell. One pane of a tree: the tab strip over its instances, the pane menu at the
    // right of that strip, and below it the view of every tab the pane has shown, the active one
    // drawn and the rest hidden (panes/TabView.svelte). It reaches a view only through the
    // registry, so no module in the shell names a view, and a saved arrangement naming a view this
    // release does not have still renders: the tab says so and the body is empty, which is the rule
    // state/workbench/layout/ states for a ViewId the registry does not hold. A tab of a collection
    // no hub lists is left out of the strip and the body (state/workbench/layout/tabs/left-out.ts),
    // and a pane left with no tab names the missing key in its line.
    //
    // The body under the strip is panes/PaneBody.svelte: the views of the tabs the pane has shown,
    // the pointer's report of where a drop would land, the layer that takes a double click's second
    // press, and the line of an empty pane.
    //
    // It is where closing is guarded. A tab holding text no save has taken is asked about before it
    // goes, whether the close came from the tab's own control or from Delete on it, and so is a
    // pane close over more than one tab; the question is asked of the instance id, so the pane
    // learns nothing about what any view keeps.
    //
    // It is also where a drag begins and where most drops land, a tab's and a view's carried out of
    // the catalogue alike. The strip reports a press and an insertion index; the body reports an
    // edge or a centre. Neither performs anything: the drag store holds what is hovered and the
    // pointer coming up is what performs it.
    //
    // Every item of the pane menu is an operation the pointer has another path to, which is what
    // makes the menu the keyboard path: the opener takes focus and Menu already handles arrows and
    // Escape.
    //
    // The pane's top row is strip/PaneStrip.svelte's, drawn under show_tabs and editor_actions. Its
    // right end is the pane's header, drawn as an editor group's: the split to the right as a bare
    // icon button, drawn while the pane shows a tab, the lock mark of a locked group, and the menu
    // as its bare more-actions opener. The one pane the next view opened would land in draws its
    // strip focused, and it is the active pane of the page the reader is in, so one pane strip in
    // the window carries the accent and that tab is where a view will land. The split button is the
    // pointer's shortcut to an item the menu already holds, so it takes no stop of its own and the
    // pane's stops stay the strip and the menu.
    //
    // A right-click on a tab opens that tab's menu (strip/tab-menu-state.svelte.ts), whose closes
    // go through the pane's close question (strip/close-question.svelte.ts). The pane also provides
    // the store the active tab hands its own actions to (ui/tabs/tab-actions.svelte.ts): the strip
    // draws them at the right end of the breadcrumb bar, beside the breadcrumb of that tab's path.
    //
    // A right-click on the strip's empty area or in an empty pane's body opens VS Code's editor
    // group menu (pane-view.ts's stripMenu): Open File..., New Text File, Open View (the views by
    // rail page, strip/open-view.svelte.ts: a view a page or float holds is shown where it is held,
    // and any other view opens in this pane), the four splits of the active tab, Lock Group, the
    // Tab Bar and Editor Actions Position submenus (which write the two settings), Close through
    // the pane menu's own close and its question, and New Terminal. With editor_actions hidden it
    // also holds the pane menu's other items (Maximise or Restore, Fold, the page choices), and
    // Close is always offered, so nothing needs the `...` button.

    import {
        EMBED,
        PAGE,
        foldable,
        openLabels,
        isFloatItem,
        isPaneDrop,
        isPaneItem,
        paneMenu,
        stripMenu,
        shownTabPath,
        stripPicked
    } from '$lib/shell/panes/pane-view';
    import { createCloseQuestion } from './strip/close-question.svelte';
    import { createOpenView } from './strip/open-view.svelte';
    import { useFileProblems } from './strip/file-problems';
    import { stripTab } from './strip/strip-tab';
    import { createTabMenu } from './strip/tab-menu-state.svelte';
    import { caretSymbols, crumbPicked, tabCrumbs, type Crumb } from './strip/tab-crumbs';
    import { provideTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import type { Tab } from '$lib/ui/tabs/tab-strip';
    import { markAt, withoutOwn } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/shared/words/text';
    import PaneBody from './PaneBody.svelte';
    import PaneStrip from './strip/PaneStrip.svelte';
    import StripSaid from './strip/StripSaid.svelte';
    import { editorActions, showTabs } from '$lib/state/shared/words/appearance';
    import {
        carriedIndex,
        leftOutTabs,
        newTextFileOpener,
        panes,
        type Instance,
        type Layout,
        type WindowBounds
    } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';
    import { answersCommands, type PaneCommand } from '../keys/key-dom';
    import { windowBoundsOfPane } from './floats/window-bounds';

    const client = useState();
    const problemsOf = useFileProblems();

    const {
        layout: {
            activateInstance,
            closePane,
            currentPage,
            dockFloat,
            embedPage,
            floatPane,
            floats,
            focused,
            foldPane,
            freeFloat,
            keepPreview,
            layout,
            lockPane,
            maximisePane,
            moveInstanceToPage,
            openingInstance,
            openInPane,
            pages,
            restorePanes,
            returnFloat,
            showFolderInFiles,
            showInFiles,
            splitInstance,
            touchPane,
            unpinTab,
            windowFloat,
            windowPane
        },
        drag: { dragging, hover, start },
        fs: { roots: servedRoots, workspaces },
        documents,
        editorStatus,
        registry: { viewFor },
        selectors: { docPlaceFor, hubVocabs },
        terminals: { newTerminalIn, tabMark },
        ui: { unsaved, setPaneStrip }
    } = client;

    /** The store the views of this pane hand the active tab's own actions to. */
    const tabActions = provideTabActions();

    type Props = {
        /**
         * The node SplitView handed the snippet. Only a pane is drawn; a split never reaches here.
         */
        node: Layout;
        /**
         * The page whose tree holds this pane, which is the page shown at a leaf when the pane is
         * inside one and the page on screen otherwise. Every store call the pane makes names it, so
         * a pane of a page shown inside another acts on its own page and not on the one around it.
         */
        page?: string;
        /**
         * This pane's path in the page's tree, which is what a drop and every menu item name it by.
         */
        path?: number[];
        /** Open the palette with a prefill, as Cmd+K opens it; the strip menu's Open File... */
        onpalette?: (prefill: string) => void;
    };

    let { node, page = currentPage().id, path = [], onpalette = () => undefined }: Props = $props();

    /** The pane's tabs, the ones drawn and the collections' left out (tabs/left-out.ts). */
    const split = $derived(leftOutTabs(node.kind === 'pane' ? node.tabs : [], hubVocabs()));
    const instances = $derived<Instance[]>(split.drawn);
    const chosen = $derived(node.kind === 'pane' ? node.active : '');
    const active = $derived(
        instances.some((one) => one.id === chosen) ? chosen : (instances.at(0)?.id ?? '')
    );
    const shown = $derived(instances.find((instance) => instance.id === active));
    const maximised = $derived(focused(page) !== null);
    /** The float this pane is, when its page is the id of one: a float's pane has its own menus. */
    const float = $derived(floats().find((one) => one.id === page));
    /**
     * Whether this is the pane the next view opened lands in: the one holding the instance it
     * joins.
     */
    const activePane = $derived(active !== '' && openingInstance()?.id === active);

    /**
     * A press or the focus inside the pane makes it the active one, as a click in an editor group
     * does in VS Code, so the palette's editor items and go-to-line answer for the tab the reader
     * is typing in and not only for the tab last chosen from a strip. A press or the focus on a tab
     * of the strip leaves the shown tab alone, since the strip activates the tab pressed, which is
     * then the tab used last.
     */
    function entered(event: Event): void {
        touchPane(page);
        const onTab = event.target instanceof Element && event.target.closest('[role="tab"]');
        if (active !== '' && !activePane && !onTab) activateInstance(active, page);
    }

    /** The roots the server serves, which a file tab's path and breadcrumb are read against. */
    const served = $derived(workspaces());
    const roots = $derived(servedRoots());

    /** The path a tab shows, written from its root's folder with the home folder as `~`. */
    const pathOf = (instance: Instance): string | null =>
        shownTabPath(instance, roots, served.home, docPlaceFor(instance));

    /** A tab per instance (strip/strip-tab.ts). */
    const tabs = $derived<Tab[]>(
        instances.map((instance) =>
            stripTab(
                instance,
                {
                    viewFor,
                    client,
                    mark: tabMark,
                    pathOf,
                    place: docPlaceFor,
                    dirty: unsaved,
                    gone: (file) =>
                        client.fs.gone(file.root, file.path) ||
                        client.ui.fileGone(file.root, file.path),
                    problemsOf
                },
                t
            )
        )
    );

    /**
     * The drag, and where in this pane's own tabs the tab being dragged sits, if it is one of them.
     * A view carried out of the catalogue is no tab yet, so it sits nowhere in the strip.
     */
    const held = $derived(dragging());
    const own = $derived(
        held?.kind !== 'tab' ? -1 : instances.findIndex((one) => one.id === held.id)
    );

    /**
     * The mark, when the drag is over this pane's strip (pane-view.ts `isPaneDrop`): back in the
     * indices the tabs are drawn in.
     */
    const dropIndex = $derived(
        held?.drop?.kind === 'strip' && isPaneDrop(held.drop, page, path, currentPage().id)
            ? markAt(carriedIndex(split, held.drop.index, own, false), own)
            : null
    );

    const items = $derived<MenuItem[]>(
        paneMenu(
            {
                float: float?.place,
                pages: pages(),
                screen: currentPage().id,
                host: page,
                maximised,
                foldable: foldable(layout(page), path),
                holdsTab: active !== '',
                windows: client.desktop !== undefined
            },
            t
        )
    );

    const viewOpener = createOpenView({ client, page: () => page, path: () => path });

    /** The strip's and the empty body's right-click menu. */
    const stripItems = $derived<MenuItem[]>(
        stripMenu(
            {
                holdsTab: active !== '',
                panes: panes(layout(page)).length,
                float: float?.place,
                locked: node.kind === 'pane' && node.locked === true,
                tabBar: showTabs(),
                actions: editorActions(),
                paneItems: items,
                windows: client.desktop !== undefined,
                openView: viewOpener.item()
            },
            t
        )
    );

    const openText = newTextFileOpener(openInPane, () => openLabels(pages(), layout));

    function stripPick(id: string): void {
        if (viewOpener.picked(id)) return;
        if (isPaneItem(id)) {
            pick(id);
            return;
        }
        stripPicked(
            id,
            { active, path, page },
            {
                splitInstance,
                openPalette: onpalette,
                close: () => pick('close'),
                newTerminalIn,
                floatPane,
                dockFloat,
                freeFloat,
                returnFloat,
                windowPane: (at, host) => windowPane(at, windowBounds(), host),
                windowFloat: (id) => windowFloat(id, windowBounds()),
                switchMain: () => client.desktop?.bridge.focusMain(),
                newTextFileIn: openText,
                setLocked: (at, where, locked) => lockPane(where, locked, at),
                setAppearance: setPaneStrip
            }
        );
    }

    const question = createCloseQuestion({
        client,
        instances: () => instances,
        labelOf: (id) => tabs.find((tab) => tab.id === id)?.label ?? id,
        page: () => page
    });
    const { askAndClose, closeByKey, closeTab } = question;

    /** The pane's element, whose place on the screen a new window opens at. */
    let element: HTMLElement | undefined = $state();

    /** Cmd+W and Cmd+N arrive as commands (keys/key-dom.ts); Cmd+W spares a pinned tab. */
    function paneCommand(command: PaneCommand): void {
        if (command === 'close-tab' && active !== '') void closeByKey(active);
        else if (command === 'new-text-file') openText(page, path);
    }

    /** Where a new window made from this pane, or from the float it is, opens on the screen. */
    const windowBounds = (): WindowBounds => windowBoundsOfPane(element, float?.place);

    const tabMenu = createTabMenu({
        client,
        windowBounds,
        instances: () => instances,
        page: () => page,
        path: () => path,
        roots: () => roots,
        stripItems: () => stripItems,
        stripPick,
        closeTab,
        askAndClose
    });

    /**
     * The breadcrumb of the active tab's path, then the symbols of its file that hold its caret,
     * empty for a tab naming no file.
     */
    const crumbs = $derived.by(() => {
        if (shown === undefined) return [];
        const symbols = documents.symbolsOf(shown.id);
        const around = caretSymbols(symbols, editorStatus.statusOf(shown.id)?.caret);
        return tabCrumbs(
            shown,
            roots.map((one) => one.key),
            around,
            docPlaceFor(shown)
        );
    });

    function press(id: string, point: { x: number; y: number }): void {
        const tab = tabs.find((one) => one.id === id);
        if (tab === undefined) return;
        start(id, tab.label, point);
    }

    function stripHover(index: number | null): void {
        const carried = dragging();
        if (carried === null) return;
        // A page has no tab to put among a pane's, so over a strip it is refused in words as well.
        if (carried.kind === 'page') {
            hover(null, null, true);
            return;
        }
        if (index === null) {
            hover(null);
            return;
        }
        const at = carriedIndex(split, withoutOwn(index, own), own, true);
        hover({ kind: 'strip', path, index: at, page });
    }

    function pick(id: string): void {
        if (isFloatItem(id)) {
            stripPick(id);
            return;
        }
        if (id === 'close') {
            // Closing a pane closes every tab in it at once, and a tab holds a view's own state,
            // so the pane takes the same question a tab's own close control takes over the tabs it
            // would take away.
            const ids = tabs.map((tab) => tab.id);
            void askAndClose(
                `pane:${path.join('.')}`,
                ids,
                t('ui.pane_close_confirm', tabs.length),
                () => closePane(path, page)
            );
            return;
        }
        if (id === 'maximise') {
            maximisePane(path, page);
            return;
        }
        if (id === 'restore') {
            restorePanes(page);
            return;
        }
        if (id === 'fold') {
            foldPane(path, page);
            return;
        }
        // A page is shown beside the pane whether or not the pane holds a tab, so it is picked
        // before the items that act on the active one.
        if (id.startsWith(EMBED)) {
            embedPage(id.slice(EMBED.length), path, 'right', page);
            return;
        }
        if (active === '') return;
        if (id.startsWith(PAGE)) {
            moveInstanceToPage(active, id.slice(PAGE.length));
            return;
        }
        if (id === 'split_right') splitInstance(active, path, 'right', page);
        else if (id === 'split_down') splitInstance(active, path, 'bottom', page);
    }
</script>

<!-- The pointer press is taken on the way down, before the control under it takes the focus, so the
     page a view opens into is this pane's page from the first press. -->
<div
    class="pane"
    bind:this={element}
    {@attach answersCommands(paneCommand)}
    class:floated={float !== undefined}
    data-pane
    data-pane-path={path.join('.')}
    data-pane-page={page}
    onpointerdowncapture={entered}
    onfocusin={entered}
    data-pane-active={active}
    data-pane-view={shown?.view}
>
    <ContextMenu label={t('ui.pane_menu')} read={tabMenu.read} onpick={tabMenu.pick}>
        <PaneStrip
            {tabs}
            {active}
            locked={node.kind === 'pane' && node.locked === true}
            canSplit={active !== '' && float === undefined}
            {items}
            {crumbs}
            barActions={tabActions.of(active)}
            oncrumb={(crumb: Crumb) =>
                crumbPicked(crumb, {
                    showFolderInFiles,
                    showInFiles,
                    goTo: (line, column) => editorStatus.ask(active, { kind: 'goto', line, column })
                })}
            onunpin={unpinTab}
            {dropIndex}
            focused={activePane}
            lead={activePane || client.float === page}
            onselect={(id: string) => activateInstance(id, page)}
            onclose={closeTab}
            ondblclick={(id: string) => keepPreview(id)}
            onpointerdown={press}
            onhoverindex={held === null ? undefined : stripHover}
            onsplit={() => pick('split_right')}
            onunlock={() => lockPane(path, false, page)}
            onpick={pick}
        />
    </ContextMenu>
    {#if tabMenu.said() !== ''}
        <StripSaid words={tabMenu.said()} />
    {/if}
    <PaneBody
        {instances}
        left={split.left}
        {active}
        {page}
        {path}
        keeps={node.kind === 'pane' ? node.keeps : undefined}
        items={stripItems}
        onpick={stripPick}
    />
</div>

<CloseQuestion
    message={question.message()}
    onconfirm={question.confirmed}
    oncancel={question.cancel}
    onsave={question.saves() ? question.save : undefined}
/>

<style>
    .pane {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-sizing: border-box;
        overflow: hidden;
    }

    /* The float draws the border around its pane, so the pane inside it draws none. */
    .pane.floated {
        border: 0;
        border-radius: 0;
    }

    /* Over a wallpaper the pane box paints nothing and keeps its border: the tab strip and the view
       inside the body each keep their own fraction of their colour, so the picture reads through
       one translucent layer rather than two and shows plainly around whatever the view draws. */
    :global(body.wall) .pane {
        background: transparent;
    }
</style>
