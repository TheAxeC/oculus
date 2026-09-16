<script lang="ts">
    // Layer 3, shell. One pane of a tree: the tab strip over its instances, the pane menu at the
    // right of that strip, and the active instance's view mounted below it. It reaches a view only
    // through the registry, so no module in the shell names a view, and a saved arrangement naming
    // a view this release does not have still renders: the tab says so and the body is empty, which
    // is the rule state/layout.ts states for a ViewId the registry does not hold.
    //
    // It is also where a drag begins and where most drops land. The strip reports a press and an
    // insertion index; the body turns the pointer's place inside its own rect into an edge or a
    // centre. Neither performs anything: the drag store holds what is hovered and the pointer coming
    // up is what performs it.
    //
    // Every item of the pane menu is an operation the pointer has another path to, which is what
    // makes the menu the keyboard path: the opener takes focus and Menu already handles arrows and
    // Escape.

    import { EMBED, PAGE, embedPageItems, foldable, pageMoveItems } from '$lib/shell/pane-view';
    import Confirm from '$lib/ui/Confirm.svelte';
    import Menu from '$lib/ui/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu-items';
    import Tabs from '$lib/ui/Tabs.svelte';
    import type { Tab } from '$lib/ui/tab-strip';
    import { edgeAt, markAt, withoutOwn } from '$lib/state/drag.svelte';
    import { t } from '$lib/state/text';
    import { badgeOf, registrationGlyph, registrationLabel } from '$lib/views/registry';
    import { showable, type Instance, type Layout } from '$lib/state/layout';
    import { useState } from '$lib/state/use';

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
            pages,
            restorePanes,
            splitInstance,
            touchPane
        },
        drag: { dragging, hover, start },
        registry: { viewFor }
    } = client;

    type Props = {
        /** The node SplitView handed the snippet. Only a pane is drawn; a split never reaches here. */
        node: Layout;
        /**
         * The page whose tree holds this pane, which is the page shown at a leaf when the pane is
         * inside one and the page on screen otherwise. Every store call the pane makes names it, so
         * a pane of a page shown inside another acts on its own page and not on the one around it.
         */
        page?: string;
        /** This pane's path in the page's tree, which is what a drop and every menu item name it by. */
        path?: number[];
    };

    let { node, page = currentPage().id, path = [] }: Props = $props();

    let body: HTMLDivElement | undefined = $state();

    const instances = $derived<Instance[]>(node.kind === 'pane' ? node.tabs : []);
    const active = $derived(node.kind === 'pane' ? node.active : '');
    const shown = $derived(instances.find((instance) => instance.id === active));
    const registration = $derived(shown === undefined ? undefined : viewFor(shown.view));
    const maximised = $derived(focused(page) !== null);

    /**
     * A tab per instance: the registry's words and glyph, or the view's own id when it has none. An
     * instance whose state carries a `label` shows that instead of the view's name, which is how
     * two documents or two projects read as two tabs rather than as "Document" twice.
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
                glyph: registrationGlyph(found),
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
                cells: badge.text === '' ? undefined : badge.cells
            };
        })
    );

    /** The `label` an instance state carries, or null for a state with none or an empty one. */
    function stateLabel(state: unknown): string | null {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
        const held = (state as Record<string, unknown>).label;
        return typeof held === 'string' && held !== '' ? held : null;
    }

    /** The drag, and where in this pane's own tabs the tab being dragged sits, if it is one of them. */
    const held = $derived(dragging());
    const own = $derived(held === null ? -1 : instances.findIndex((one) => one.id === held.id));

    /** The mark, when the drag is over this pane's strip: back in the indices the tabs are drawn in. */
    const dropIndex = $derived(
        held !== null && held.drop?.kind === 'strip' && here(held.drop)
            ? markAt(held.drop.index, own)
            : null
    );

    /** Whether the pane menu's close is waiting on the dialog. */
    let closing = $state(false);

    /** Every page but this pane's own, as the item that moves the active tab onto it. */
    const elsewhere = $derived<MenuItem[]>(pageMoveItems(pages(), page, t));

    /** Every page this one may show beside the pane, which is the keyboard path to embedding. */
    const shows = $derived<MenuItem[]>(embedPageItems(pages(), currentPage().id, page, t));

    const items = $derived<MenuItem[]>([
        { id: 'close', label: t('ui.pane_close') },
        maximised
            ? { id: 'restore', label: t('ui.pane_restore') }
            : { id: 'maximise', label: t('ui.pane_maximise') },
        // The root pane is in no split, and the last open child of a split stays open, so the item
        // is offered only where a fold would change the tree.
        ...(foldable(layout(page), path) ? [{ id: 'fold', label: t('ui.pane_fold') }] : []),
        ...elsewhere,
        ...shows,
        { id: 'split_right', label: t('ui.split_right') },
        { id: 'split_down', label: t('ui.split_down') }
    ]);

    /** Whether a drop is this pane's: the same page, and the same path inside that page's tree. */
    function here(drop: { path: number[]; page?: string }): boolean {
        if ((drop.page ?? currentPage().id) !== page) return false;
        return (
            drop.path.length === path.length &&
            drop.path.every((step, index) => step === path[index])
        );
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
            // Closing a pane closes every tab in it at once, and a tab holds a view's own state. One
            // tab is the tab's own close control by another name, so it goes; more than one is asked
            // about first.
            if (tabs.length > 1) closing = true;
            else closePane(path, page);
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
    onpointerdowncapture={() => touchPane(page)}
    onfocusin={() => touchPane(page)}
    data-pane-active={active}
    data-pane-view={shown?.view}
>
    <Tabs
        {tabs}
        {active}
        {dropIndex}
        onselect={(id: string) => activateInstance(id, page)}
        onclose={(id: string) => closeInstance(id, page)}
        ondblclick={(id: string) => keepPreview(id)}
        onpointerdown={press}
        onhoverindex={held === null ? undefined : stripHover}
        menu={paneMenu}
    />
    <!-- The body is where a view is mounted, and the two pointer handlers only report where a drop
         would land while a drag is in progress. Every drop they report has an item in the pane menu,
         which is the keyboard path. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="body"
        data-pane-body
        bind:this={body}
        onpointermove={bodyHover}
        onpointerleave={bodyLeave}
    >
        {#if shown !== undefined && registration !== undefined}
            {@const View = registration.component}
            <View instance={shown} />
        {/if}
    </div>
</div>

{#if closing}
    <Confirm
        message={t('ui.pane_close_confirm', tabs.length)}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            closing = false;
            closePane(path, page);
        }}
        oncancel={() => (closing = false)}
    />
{/if}

{#snippet paneMenu()}
    <Menu
        label={t('ui.pane_menu')}
        glyph={t('ui.pane_menu_glyph')}
        compact
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
       inside the body each keep their own fraction of their colour, so the picture reads through one
       translucent layer rather than two and shows plainly around whatever the view draws. */
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

    .body > :global(*) {
        height: 100%;
    }
</style>
