<script lang="ts">
    // Layer 3, shell. The body of one pane: the view of every tab the pane has shown, the active
    // one drawn and the rest hidden (panes/TabView.svelte), the pointer's report of where a drop
    // would land while a drag is in progress, and, for a pane holding no tab, the line saying that
    // opened files appear there.
    //
    // A tab's view is mounted the first time the tab is shown and stays mounted until the tab
    // closes or leaves the pane, so switching back to it neither builds the view again nor fetches
    // what it read again unless it was marked meanwhile (a hidden tab asks nothing, and asks once
    // when it is shown), and a tab never shown costs nothing. There is no cap on the views one
    // pane keeps: it is the number of tabs the reader has opened and looked at.
    //
    // The body turns the pointer's place inside its own rect into an edge or a centre. It performs
    // nothing: the drag store holds what is hovered and the pointer coming up is what performs it.
    // Every drop it reports has an item in the pane menu, which is the keyboard path.

    import { untrack } from 'svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { edgeAt } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/shared/words/text';
    import TabView from './TabView.svelte';
    import { showable, type Instance } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { currentPage, pages },
        drag: { dragging, hover },
        registry: { viewFor }
    } = useState();

    type Props = {
        /** The pane's tabs, in the order the strip draws them. */
        instances: Instance[];
        /** The id of the tab the pane shows. */
        active: string;
        /** The page whose tree holds the pane. */
        page: string;
        /** The pane's path in that page's tree, which a reported drop names it by. */
        path: number[];
        /** The items of the right-click menu of an empty pane. */
        items: MenuItem[];
        /** An item of that menu was picked. */
        onpick: (id: string) => void;
    };

    let { instances, active, page, path, items, onpick }: Props = $props();

    let body: HTMLDivElement | undefined = $state();

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
</script>

<!-- The body is where a view is mounted, and the two pointer handlers only report where a drop
     would land while a drag is in progress. -->
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
    <!-- A pane holding no tab is where a view opened for something lands on the page, so it says
         so rather than drawing nothing. It fills the body, so a right-click anywhere in an empty
         pane opens the strip's menu. -->
    {#if instances.length === 0}
        <ContextMenu label={t('ui.pane_menu')} {items} {onpick}>
            <div class="empty" data-pane-empty>
                <Empty message={t('ui.pane_empty')} />
            </div>
        </ContextMenu>
    {/if}
</div>

<style>
    /* The only thing on the page that scrolls is what a view puts in here. */
    .body {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    /* The empty pane's message, centred in the room the body leaves. */
    .empty {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 12px;
    }
</style>
