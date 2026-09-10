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

    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Tabs, { type Tab } from '$lib/ui/Tabs.svelte';
    import {
        activateInstance,
        closeInstanceIn,
        closePaneIn,
        focused,
        layout,
        maximisePane,
        restorePanes,
        splitInstance,
        transferInstance
    } from '$lib/state/layout.svelte';
    import {
        AT_END,
        dragging,
        edgeAt,
        hover,
        markAt,
        start,
        withoutOwn
    } from '$lib/state/drag.svelte';
    import { lookup, t } from '$lib/state/text';
    import { viewFor } from '$lib/views/registry';
    import { panes, type Instance, type Layout, type Target } from '$lib/state/layout';

    type Props = {
        /** The node SplitView handed the snippet. Only a pane is drawn; a split never reaches here. */
        node: Layout;
        /** Which of the workbench's two trees this pane is in, so a close names the right one. */
        target: Target;
        /** This pane's path in that tree, which is what a drop and every menu item name it by. */
        path?: number[];
    };

    let { node, target, path = [] }: Props = $props();

    let body: HTMLDivElement | undefined = $state(undefined);

    const instances = $derived<Instance[]>(node.kind === 'pane' ? node.tabs : []);
    const active = $derived(node.kind === 'pane' ? node.active : '');
    const shown = $derived(instances.find((instance) => instance.id === active));
    const registration = $derived(shown === undefined ? undefined : viewFor(shown.view));
    const other = $derived<Target>(target === 'main' ? 'panel' : 'main');
    const maximised = $derived(focused() !== null);

    /** A tab per instance: the registry's words and glyph, or the view's own id when it has none. */
    const tabs = $derived<Tab[]>(
        instances.map((instance) => {
            const found = viewFor(instance.view);
            if (found === undefined) {
                return { id: instance.id, label: t('ui.unknown_view', instance.view) };
            }
            return { id: instance.id, label: lookup(found.label), glyph: lookup(found.glyph) };
        })
    );

    /** The drag, and where in this pane's own tabs the tab being dragged sits, if it is one of them. */
    const held = $derived(dragging());
    const own = $derived(held === null ? -1 : instances.findIndex((one) => one.id === held.id));

    /** The mark, when the drag is over this pane's strip: back in the indices the tabs are drawn in. */
    const dropIndex = $derived(
        held !== null &&
            held.drop?.kind === 'strip' &&
            held.drop.target === target &&
            here(held.drop.path)
            ? markAt(held.drop.index, own)
            : null
    );

    const items = $derived<MenuItem[]>([
        { id: 'close', label: t('ui.pane_close') },
        maximised
            ? { id: 'restore', label: t('ui.pane_restore') }
            : { id: 'maximise', label: t('ui.pane_maximise') },
        { id: 'move', label: target === 'main' ? t('ui.move_to_panel') : t('ui.move_to_main') },
        { id: 'split_right', label: t('ui.split_right') },
        { id: 'split_down', label: t('ui.split_down') }
    ]);

    /** Whether a drop's path is this pane's. A path is only ever compared inside one tree. */
    function here(candidate: number[]): boolean {
        return (
            candidate.length === path.length &&
            candidate.every((step, index) => step === path[index])
        );
    }

    function press(id: string, point: { x: number; y: number }): void {
        const tab = tabs.find((one) => one.id === id);
        if (tab === undefined) return;
        start(id, target, tab.label, point);
    }

    function stripHover(index: number | null): void {
        if (dragging() === null) return;
        if (index === null) {
            hover(null);
            return;
        }
        hover({ kind: 'strip', target, path, index: withoutOwn(index, own) });
    }

    /** The pointer over the body: an edge of it, or its middle, which is the end of the strip. */
    function bodyHover(event: PointerEvent): void {
        if (dragging() === null || body === undefined) return;
        const rect = body.getBoundingClientRect();
        const point = { x: event.clientX, y: event.clientY };
        const edge = edgeAt(rect, point);
        hover(
            edge === null ? { kind: 'centre', target, path } : { kind: 'edge', target, path, edge },
            rect
        );
    }

    function bodyLeave(): void {
        if (dragging() === null) return;
        hover(null);
    }

    function firstPane(where: Target): number[] {
        return panes(layout(where))[0]?.path ?? [];
    }

    function pick(id: string): void {
        if (id === 'close') {
            closePaneIn(target, path);
            return;
        }
        if (id === 'maximise') {
            maximisePane(target, path);
            return;
        }
        if (id === 'restore') {
            restorePanes();
            return;
        }
        if (active === '') return;
        // The other tree's first pane is where a moved tab lands: its root is a split as often as
        // not, and a path naming a split names no pane at all.
        if (id === 'move') transferInstance(active, other, firstPane(other), AT_END);
        else if (id === 'split_right') splitInstance(active, target, path, 'right');
        else if (id === 'split_down') splitInstance(active, target, path, 'bottom');
    }
</script>

<div class="pane">
    <Tabs
        {tabs}
        {active}
        {dropIndex}
        onselect={(id) => activateInstance(target, id)}
        onclose={(id) => closeInstanceIn(target, id)}
        onpointerdown={press}
        onhoverindex={held === null ? undefined : stripHover}
        menu={paneMenu}
    />
    <!-- svelte-ignore a11y_no_static_element_interactions the body is where a view is mounted, and
         the two pointer handlers only report where a drop would land while a drag is in progress.
         Every drop they report has an item in the pane menu, which is the keyboard path. -->
    <div class="body" bind:this={body} onpointermove={bodyHover} onpointerleave={bodyLeave}>
        {#if shown !== undefined && registration !== undefined}
            {@const View = registration.component}
            <View instance={shown} />
        {/if}
    </div>
</div>

{#snippet paneMenu()}
    <Menu
        label={t('ui.pane_menu')}
        glyph={lookup('ui.pane_menu_glyph')}
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
