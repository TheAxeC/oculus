<script lang="ts">
    // Layer 3, shell. One pane of a tree: the tab strip over its instances, the pane menu at the
    // right of that strip, and below it the view of every tab the pane has shown, the active one
    // drawn and the rest hidden (panes/TabView.svelte). It reaches a view only through the
    // registry, so no module in the shell names a view, and a saved arrangement naming a view this
    // release does not have still renders: the tab says so and the body is empty, which is the rule
    // state/workbench/layout/ states for a ViewId the registry does not hold.
    //
    // The body under the strip is panes/PaneBody.svelte: the views of the tabs the pane has shown,
    // the pointer's report of where a drop would land, and the line of an empty pane.
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
    // The strip's right end is the pane's header, drawn as an editor group's: the split to the
    // right as a bare icon button, drawn while the pane shows a tab, and the menu as its bare
    // more-actions opener. The one pane the next view opened would land in draws its strip
    // focused, and it is the active pane of the page the reader is in, so one pane strip in the
    // window carries the accent and that tab is where a view will land. The rail's button drawn in
    // force is a different mark: it says which page is shown, not where a view opens. The split
    // button is the pointer's shortcut to an item the menu already holds, so it takes no stop of
    // its own and the pane's stops stay the strip and the menu.
    //
    // A right-click on the strip's empty area or in an empty pane's body opens VS Code's editor
    // group menu (pane-view.ts's stripMenu): Open File..., the four splits of the active tab, Close
    // through the pane menu's own close and its question, and New Terminal on the pane's page. A
    // right-click on a tab is left to the tab's own menu, so the strip's menu opens only where no
    // tab is under the pointer.

    import {
        EMBED,
        FLOAT_PANE,
        PAGE,
        floatMenu,
        foldable,
        isFloatItem,
        pageListItems,
        stripMark,
        stripMenu,
        stripPicked
    } from '$lib/shell/panes/pane-view';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import { closeAsk, closeOnce, closeWords } from '$lib/state/workbench/navigation/pages';
    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Tabs from '$lib/ui/tabs/Tabs.svelte';
    import type { Tab } from '$lib/ui/tabs/tab-strip';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { markAt, withoutOwn } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        badgeOf,
        registrationGlyph,
        registrationLabel
    } from '$lib/state/workbench/navigation/registry';
    import PaneBody from './PaneBody.svelte';
    import { instanceLabel, panes, type Instance, type Layout } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        layout: {
            activateInstance,
            closeInstance,
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
            maximisePane,
            moveInstanceToPage,
            openingInstance,
            pages,
            restorePanes,
            returnFloat,
            splitInstance,
            touchPane
        },
        drag: { dragging, hover, start },
        registry: { viewFor },
        terminals: { newTerminalIn, tabMark },
        ui: { unsaved, busyTerminals }
    } = client;

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

    const instances = $derived<Instance[]>(node.kind === 'pane' ? node.tabs : []);
    const active = $derived(node.kind === 'pane' ? node.active : '');
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
     * is typing in and not only for the tab last chosen from a strip.
     */
    function entered(): void {
        touchPane(page);
        if (active !== '' && !activePane) activateInstance(active, page);
    }

    /**
     * A tab per instance: the registry's words and glyph, or the view's own id when it has none. A
     * state carrying a `label` shows that instead of the view's name, so two documents read as two.
     */
    const tabs = $derived<Tab[]>(
        instances.map((instance) => {
            const found = viewFor(instance.view);
            if (found === undefined) {
                return { id: instance.id, label: t('ui.unknown_view', instance.view) };
            }
            const own = instanceLabel(instance.state);
            const badge = badgeOf(found, client);
            const preview = instance.preview === true;
            return {
                id: instance.id,
                label: own ?? registrationLabel(found),
                ...stripMark(registrationGlyph(found), tabMark(instance)),
                preview,
                hint: preview
                    ? t('ui.preview_tab')
                    : own === null
                      ? undefined
                      : registrationLabel(found),
                badge: badge.tabText,
                badgeGlyph: badge.glyph,
                badgeTone: badge.tone,
                badgeTitle: badge.title,
                cells: badge.text === '' ? undefined : badge.cells,
                dirty: unsaved(instance.id)
            };
        })
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
     * The mark, when the drag is over this pane's strip: back in the indices the tabs are drawn in.
     */
    const dropIndex = $derived(
        held !== null && held.drop?.kind === 'strip' && here(held.drop)
            ? markAt(held.drop.index, own)
            : null
    );

    /**
     * The close that is waiting on the dialog: the words it asks and what a yes does. One dialog
     * serves the pane menu's close and a tab holding unsaved text, since both ask the same question
     * about work that would be lost.
     */
    let confirming: { message: string; act: () => void } | null = $state(null);

    /**
     * The two page choices: every page but this pane's own, as the item that moves the active tab
     * onto it, and every page this one may show beside the pane, which is the keyboard path to
     * embedding. Each is one line of the menu that opens its pages in place of the menu's list.
     */
    const pageLists = $derived<MenuItem[]>(pageListItems(pages(), currentPage().id, page, t));

    const items = $derived<MenuItem[]>(
        float !== undefined
            ? floatMenu(float.place, pages(), t)
            : [
                  { id: 'close', label: t('ui.pane_close') },
                  maximised
                      ? { id: 'restore', label: t('ui.pane_restore') }
                      : { id: 'maximise', label: t('ui.pane_maximise') },
                  // The root pane is in no split, and the last open child of a split stays open,
                  // so the item is offered only where a fold would change the tree.
                  ...(foldable(layout(page), path)
                      ? [{ id: 'fold', label: t('ui.pane_fold') }]
                      : []),
                  ...pageLists,
                  { id: 'split_right', label: t('ui.split_right') },
                  { id: 'split_down', label: t('ui.split_down') },
                  ...(active === '' ? [] : [{ id: FLOAT_PANE, label: t('ui.float') }])
              ]
    );

    /** The strip's and the empty body's right-click menu. */
    const stripItems = $derived<MenuItem[]>(
        stripMenu(
            {
                holdsTab: active !== '',
                panes: panes(layout(page)).length,
                float: float?.place
            },
            t
        )
    );

    function stripPick(id: string): void {
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
                returnFloat
            }
        );
    }

    /**
     * Keep a right-click on a tab from reaching the strip's menu: a tab has a menu of its own, and
     * a right-click on it is not a right-click on the strip's empty area. A key's menu, dispatched
     * by the menu itself at the focused control, is let through.
     */
    function onTab(event: MouseEvent): void {
        const target = event.target;
        if (!event.isTrusted || !(target instanceof Element)) return;
        if (target.closest('[role="tab"]') !== null) event.stopPropagation();
    }

    /** Whether a drop is this pane's: the same page, and the same path inside that page's tree. */
    function here(drop: { path: number[]; page?: string }): boolean {
        if ((drop.page ?? currentPage().id) !== page) return false;
        return (
            drop.path.length === path.length &&
            drop.path.every((step, index) => step === path[index])
        );
    }

    const once = closeOnce();

    /**
     * Close these tabs, asking first when one holds text no save has taken or runs a program in a
     * terminal it owns. The rule is the instance ids and the ui store's answers for them, so the
     * close control, Delete and the pane menu take the same guard and no view is scanned for what
     * it holds. A second press while the read of the terminals is in flight does nothing.
     */
    function askAndClose(key: string, ids: string[], many: string, act: () => void): Promise<void> {
        const owned = instances.filter((one) => ids.includes(one.id));
        return once(
            key,
            () => busyTerminals(owned),
            (busy) => {
                const nameOf = (one: string): string =>
                    tabs.find((tab) => tab.id === one)?.label ?? one;
                const asked = closeAsk({ ids, unsaved, nameOf, many, busy });
                if (asked === null) act();
                else confirming = { message: closeWords(asked), act };
            }
        );
    }

    function closeTab(id: string): void {
        void askAndClose(`tab:${id}`, [id], t('ui.tab_close_dirty'), () => closeInstance(id, page));
    }

    /**
     * Perform the close the dialog was asking about. What to do is taken out of the state before
     * the dialog is taken away, since the markup reads the same state and would have nothing to
     * call.
     */
    function confirmed(): void {
        const act = confirming?.act;
        confirming = null;
        act?.();
    }

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
        hover({ kind: 'strip', path, index: withoutOwn(index, own), page });
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
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="pane"
    class:floated={float !== undefined}
    data-pane
    data-pane-path={path.join('.')}
    data-pane-page={page}
    onpointerdowncapture={entered}
    onfocusin={entered}
    data-pane-active={active}
    data-pane-view={shown?.view}
>
    <ContextMenu label={t('ui.pane_menu')} items={stripItems} onpick={stripPick}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="tabs-menu" oncontextmenu={onTab}>
            <Tabs
                {tabs}
                {active}
                {dropIndex}
                onselect={(id: string) => activateInstance(id, page)}
                onclose={closeTab}
                ondblclick={(id: string) => keepPreview(id)}
                onpointerdown={press}
                onhoverindex={held === null ? undefined : stripHover}
                menu={paneMenu}
                focused={activePane}
            />
        </div>
    </ContextMenu>
    <PaneBody
        {instances}
        {active}
        {page}
        {path}
        keeps={node.kind === 'pane' ? node.keeps : undefined}
        items={stripItems}
        onpick={stripPick}
    />
</div>

<CloseQuestion
    message={confirming?.message ?? null}
    onconfirm={confirmed}
    oncancel={() => (confirming = null)}
/>

{#snippet paneMenu()}
    {#if active !== '' && float === undefined}
        <ToolButton
            label={t('ui.split_right')}
            glyph={t('ui.split_right_glyph')}
            compact
            bare
            tabindex={-1}
            onclick={() => pick('split_right')}
        />
    {/if}
    <Menu
        label={t('ui.pane_menu')}
        glyph={t('ui.pane_more_glyph')}
        compact
        bare
        placement="down"
        align="right"
        {items}
        onpick={pick}
    />
{/snippet}

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

    /* The strip's menu wrapper, which draws nothing of its own around the tab strip. */
    .tabs-menu {
        display: contents;
    }
</style>
