<script lang="ts">
    // Layer 3, shell. One pane of a tree: the tab strip over its instances, the pane menu at the
    // right of that strip, and below it the view of every tab the pane has shown, the active one
    // drawn and the rest hidden (panes/TabView.svelte). It reaches a view only through the
    // registry, so no module in the shell names a view, and a saved arrangement naming a view this
    // release does not have still renders: the tab says so and the body is empty, which is the rule
    // state/workbench/layout/ states for a ViewId the registry does not hold.
    //
    // A tab's view is mounted the first time the tab is shown and stays mounted until the tab
    // closes or leaves the pane, so switching back to it neither builds the view again nor fetches
    // what it read again, and a tab never shown costs nothing. There is no cap on the views one
    // pane keeps: it is the number of tabs the reader has opened and looked at.
    // A pane holding no tab draws one line saying that opened files appear there, since an empty
    // pane is where a view opened for something lands on its page.
    //
    // It is where closing is guarded. A tab holding text no save has taken is asked about before it
    // goes, whether the close came from the tab's own control or from Delete on it, and so is a
    // pane close over more than one tab; the question is asked of the instance id, so the pane
    // learns nothing about what any view keeps.
    //
    // It is also where a drag begins and where most drops land, a tab's and a view's carried out of
    // the catalogue alike. The strip reports a press and an insertion index; the body turns the
    // pointer's place inside its own rect into an edge or a centre. Neither performs anything: the
    // drag store holds what is hovered and the pointer coming up is what performs it.
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

    import { untrack } from 'svelte';
    import {
        EMBED,
        PAGE,
        foldable,
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
    import { edgeAt, markAt, withoutOwn } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        badgeOf,
        registrationGlyph,
        registrationLabel
    } from '$lib/state/workbench/navigation/registry';
    import TabView from './TabView.svelte';
    import { panes, showable, type Instance, type Layout } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        layout: {
            activateInstance,
            closeInstance,
            closePane,
            currentPage,
            embedPage,
            focused,
            foldPane,
            keepPreview,
            layout,
            maximisePane,
            moveInstanceToPage,
            openingInstance,
            pages,
            restorePanes,
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

    let body: HTMLDivElement | undefined = $state();

    const instances = $derived<Instance[]>(node.kind === 'pane' ? node.tabs : []);
    const active = $derived(node.kind === 'pane' ? node.active : '');
    const shown = $derived(instances.find((instance) => instance.id === active));
    const maximised = $derived(focused(page) !== null);
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
     * The tabs this pane has shown, in the order they were first shown. A closed tab, or one moved
     * to another pane, is dropped as soon as the pane no longer holds it.
     */
    let seen: string[] = $state([]);
    $effect(() => {
        const open = instances.map((one) => one.id);
        const held = untrack(() => seen).filter((id) => open.includes(id));
        if (active !== '' && !held.includes(active)) held.push(active);
        if (held.join('\n') !== untrack(() => seen).join('\n')) seen = held;
    });

    /** The tabs whose views are mounted: the one shown, and every other one shown before it. */
    const kept = $derived(instances.filter((one) => one.id === active || seen.includes(one.id)));

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
            const own = stateLabel(instance.state);
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

    /** The `label` an instance state carries, or null for a state with none or an empty one. */
    function stateLabel(state: unknown): string | null {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
        const held = (state as Record<string, unknown>).label;
        return typeof held === 'string' && held !== '' ? held : null;
    }

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

    const items = $derived<MenuItem[]>([
        { id: 'close', label: t('ui.pane_close') },
        maximised
            ? { id: 'restore', label: t('ui.pane_restore') }
            : { id: 'maximise', label: t('ui.pane_maximise') },
        // The root pane is in no split, and the last open child of a split stays open, so the item
        // is offered only where a fold would change the tree.
        ...(foldable(layout(page), path) ? [{ id: 'fold', label: t('ui.pane_fold') }] : []),
        ...pageLists,
        { id: 'split_right', label: t('ui.split_right') },
        { id: 'split_down', label: t('ui.split_down') }
    ]);

    /** The strip's and the empty body's right-click menu. */
    const stripItems = $derived<MenuItem[]>(
        stripMenu({ holdsTab: active !== '', panes: panes(layout(page)).length }, t)
    );

    function stripPick(id: string): void {
        stripPicked(
            id,
            { active, path, page },
            {
                splitInstance,
                openPalette: onpalette,
                close: () => pick('close'),
                newTerminalIn
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

    /** The pointer over the body: an edge of it, or its middle, which is the end of the strip. */
    function bodyHover(event: PointerEvent): void {
        const carried = dragging();
        if (carried === null || body === undefined) return;
        // A page already drawn on this screen, or one that would draw the page this pane is in, is
        // no drop at all: nothing is drawn over the body and the ghost says why.
        if (carried.kind === 'page' && !showable(pages(), currentPage().id, page, carried.id)) {
            hover(null, null, true);
            return;
        }
        const rect = body.getBoundingClientRect();
        const point = { x: event.clientX, y: event.clientY };
        const edge = edgeAt(rect, point);
        hover(
            edge === null ? { kind: 'centre', path, page } : { kind: 'edge', path, edge, page },
            rect
        );
    }

    function bodyLeave(): void {
        if (dragging() === null) return;
        hover(null);
    }

    function pick(id: string): void {
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
    <!-- The body is where a view is mounted, and the two pointer handlers only report where a drop
         would land while a drag is in progress. Every drop they report has an item in the pane
         menu, which is the keyboard path. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="body"
        data-pane-body
        bind:this={body}
        onpointermove={bodyHover}
        onpointerleave={bodyLeave}
    >
        {#each kept as instance (instance.id)}
            {@const found = viewFor(instance.view)}
            {#if found !== undefined}
                <TabView {instance} registration={found} shown={instance.id === active} />
            {/if}
        {/each}
        <!-- A pane holding no tab is where a view opened for something lands on the page, so it
             says so rather than drawing nothing. -->
        {#if instances.length === 0}
            <ContextMenu label={t('ui.pane_menu')} items={stripItems} onpick={stripPick}>
                <p class="empty" data-pane-empty>
                    {t('ui.pane_empty')}
                </p>
            </ContextMenu>
        {/if}
    </div>
</div>

<CloseQuestion
    message={confirming?.message ?? null}
    onconfirm={confirmed}
    oncancel={() => (confirming = null)}
/>

{#snippet paneMenu()}
    {#if active !== ''}
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

    /* Over a wallpaper the pane box paints nothing and keeps its border: the tab strip and the view
       inside the body each keep their own fraction of their colour, so the picture reads through
       one translucent layer rather than two and shows plainly around whatever the view draws. */
    :global(body.wall) .pane {
        background: transparent;
    }

    /* The only thing on the page that scrolls is what a view puts in here. */
    .body {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    /* The strip's menu wrapper, which draws nothing of its own around the tab strip. */
    .tabs-menu {
        display: contents;
    }

    /* The one line of a pane with no tab, in the muted ink, clear of the strip above it. It fills
       the body, so a right-click anywhere in an empty pane opens the strip's menu. */
    .empty {
        box-sizing: border-box;
        height: 100%;
        margin: 0;
        padding: 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
