<script lang="ts">
    // Layer 3, shell. The body of one pane: the view of every tab the pane has shown, the active
    // one drawn and the rest hidden (panes/TabView.svelte), the pointer's report of where a drop
    // would land while a drag is in progress, the layer that keeps a preview tab on the second
    // press of a double click, and, for a pane holding no tab, the line saying that opened files
    // appear there.
    //
    // A tab's view is mounted the first time the tab is shown and stays mounted until the tab
    // closes or leaves the pane, so switching back to it neither builds the view again nor fetches
    // what it read again unless it was marked meanwhile (a hidden tab asks nothing, and asks once
    // when it is shown), and a tab never shown costs nothing. There is no cap on the views one
    // pane keeps: it is the number of tabs the reader has opened and looked at.
    //
    // A pane that shows the preview tab a press in the file browser just opened draws a transparent
    // layer over its body while the tab's keep is armed
    // (state/workbench/layout/open/armed-keep.svelte.ts). In one pane the first press of a double
    // click has replaced the tree with the file, so the second press lands on the tab, in an editor
    // or a frame. The layer takes that press, keeps the tab and stops the press, so the editor
    // selects no word and a frame gets no click. A tab a double click kept, on the layer or on the
    // row when the file was read only after both presses, asks for the keyboard (`focusAsked`),
    // and once the pane has drawn the tab's editor, frame or marked box the keyboard goes there,
    // as a double click on a file of an editor's explorer puts it.
    // The layer stays up until the pointer is released, so the release and the click land on it
    // too. The keep ends when the double-click time (`KEEP_WINDOW_MS`) runs out, at any press
    // outside the layer, at any key, and when another tab of the pane is the active one.
    //
    // A tab whose view holds a frame draws a slot here and not the frame: the frame is laid over
    // the slot by the frame layer (shell/frames/FrameLayer.svelte), so a pane drawn again never
    // loads the frame's document again. The layer over the body is above the slot and not above
    // the frame, so the pane has the frame take no pointer while the layer is up.
    //
    // The body turns the pointer's place inside its own rect into an edge or a centre. It performs
    // nothing: the drag store holds what is hovered and the pointer coming up is what performs it.
    // Every drop it reports has an item in the pane menu, which is the keyboard path. The pane of a
    // float takes a drop on its strip and on its centre and no drop on an edge, since a float holds
    // one pane and is never split.

    import { tick, untrack } from 'svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { edgeAt } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/shared/words/text';
    import TabView from './TabView.svelte';
    import { showable, stillPreview, type Instance } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';
    import { useTabFrames } from '$lib/ui/tabs/tab-frames.svelte';

    const {
        layout: {
            armedKeep,
            askFocus,
            currentPage,
            disarmKeep,
            floats,
            focusAsked,
            focusGiven,
            keepPreview,
            pages
        },
        drag: { dragging, hover },
        registry: { viewFor }
    } = useState();

    /** The frames of the workbench's tabs, which are not drawn in this body (frames/FrameLayer). */
    const frames = useTabFrames();

    type Props = {
        /** The pane's tabs, in the order the strip draws them. */
        instances: Instance[];
        /** The id of the tab the pane shows. */
        active: string;
        /** The page whose tree holds the pane. */
        page: string;
        /** The pane's path in that page's tree, which a reported drop names it by. */
        path: number[];
        /** What an empty pane is kept for: terminals, or absent for documents. */
        keeps?: 'terminals';
        /** The items of the right-click menu of an empty pane. */
        items: MenuItem[];
        /** An item of that menu was picked. */
        onpick: (id: string) => void;
    };

    let { instances, active, page, path, keeps, items, onpick }: Props = $props();

    /**
     * The line an empty pane says: terminals for a pane kept for them, files and documents else.
     */
    const emptyWords = $derived(
        keeps === 'terminals' ? t('ui.pane_empty_terminals') : t('ui.pane_empty')
    );

    let body: HTMLDivElement | undefined = $state();
    let layer: HTMLDivElement | undefined = $state();

    /** The tab this pane shows whose keep is armed, or null when the keep is not for this tab. */
    const armed = $derived.by((): Instance | null => {
        const tab = stillPreview(armedKeep()?.instance ?? null, instances);
        return tab !== null && tab.id === active ? tab : null;
    });

    /** Whether a press on the layer kept the tab and the pointer has not been released since. */
    let pressing = $state(false);

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

    // A keep armed for a tab of this pane that is not its active tab ends.
    $effect(() => {
        const tab = stillPreview(armedKeep()?.instance ?? null, instances);
        if (tab !== null && tab.id !== active) untrack(() => disarmKeep());
    });

    // While the layer is up, a press anywhere else and any key end the keep.
    $effect(() => {
        if (armed === null) return;
        const away = (event: Event): void => {
            if (!(event.target instanceof Node) || layer?.contains(event.target) !== true) {
                disarmKeep();
            }
        };
        const typed = (): void => disarmKeep();
        window.addEventListener('pointerdown', away, true);
        window.addEventListener('keydown', typed, true);
        return () => {
            window.removeEventListener('pointerdown', away, true);
            window.removeEventListener('keydown', typed, true);
        };
    });

    // The layer stays up from the press that used it to the pointer's release.
    $effect(() => {
        if (!pressing) return;
        const released = (): void => {
            pressing = false;
        };
        window.addEventListener('pointerup', released, { once: true });
        window.addEventListener('pointercancel', released, { once: true });
        return () => {
            window.removeEventListener('pointerup', released);
            window.removeEventListener('pointercancel', released);
        };
    });

    // The frame of the tab takes no pointer while the layer is up, so the press reaches the layer.
    $effect(() => {
        const id = active;
        frames?.shield(id, armed !== null || pressing);
        return () => frames?.shield(id, false);
    });

    /**
     * What takes the keyboard in the view of tab `id`: the input of its code editor (the edit
     * context element Monaco uses where the browser has EditContext, else its input textarea),
     * else its frame, which the frame layer draws, else the box the view marks with
     * `data-tab-focus`; null while the view has drawn none of them.
     */
    function inputOf(view: HTMLElement, id: string): HTMLElement | null {
        return (
            view.querySelector<HTMLElement>('.monaco-editor .native-edit-context') ??
            view.querySelector<HTMLElement>('.monaco-editor textarea.inputarea') ??
            frames?.frameOf(id) ??
            view.querySelector<HTMLElement>('[data-tab-focus]')
        );
    }

    /**
     * The primary press on the layer keeps the tab, gives it the keyboard and reaches nothing
     * under the layer; any other press ends the keep and goes through.
     */
    function layerPressed(event: PointerEvent): void {
        if (armed === null || event.button !== 0) {
            disarmKeep();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const id = armed.id;
        keepPreview(id);
        disarmKeep();
        pressing = true;
        askFocus(id);
    }

    /**
     * Keep the keyboard in `input` through the end of the press that asked for it. The second press
     * of a double click on a tree row is still down when a view that draws at once (a picture)
     * takes the keyboard, and the row takes it back at that press's click, so the click that ends
     * the press gives it back. A press that has already ended sends no click, and the next press
     * drops the hold.
     */
    function keepThroughPress(input: HTMLElement): void {
        const back = (): void => {
            input.focus();
            drop();
        };
        const drop = (): void => {
            window.removeEventListener('click', back);
            window.removeEventListener('pointerdown', drop, true);
        };
        window.addEventListener('click', back);
        window.addEventListener('pointerdown', drop, true);
    }

    // A tab a double click kept takes the keyboard once this pane shows it. It waits for the keep's
    // redraw, which remakes an editor's model, and for a view that mounts with the keep, whose
    // editor is built after the editor has loaded: until the view holds an input, every change
    // inside it is a new try. The ask ends when one is focused, when another tab of the pane is
    // shown, and at the next press or key anywhere, which is the reader choosing where the
    // keyboard goes.
    $effect(() => {
        const asked = focusAsked();
        if (asked === null || !instances.some((one) => one.id === asked)) return;
        if (asked !== active) {
            untrack(() => focusGiven(asked));
            return;
        }
        let watch: MutationObserver | undefined;
        let ended = false;
        // The frame layer draws a frame after the view mounts, so the effect runs again when it
        // has.
        frames?.frameOf(asked);
        const give = (view: HTMLElement): boolean => {
            const input = inputOf(view, asked);
            if (input === null) return false;
            input.focus();
            keepThroughPress(input);
            watch?.disconnect();
            focusGiven(asked);
            return true;
        };
        const chosen = (): void => focusGiven(asked);
        window.addEventListener('pointerdown', chosen, true);
        window.addEventListener('keydown', chosen, true);
        void tick().then(() => {
            const view = body?.querySelector<HTMLElement>(
                `[data-tab-view=${JSON.stringify(asked)}]`
            );
            if (ended || view === null || view === undefined || view.hidden || give(view)) return;
            watch = new MutationObserver(() => give(view));
            watch.observe(view, { childList: true, subtree: true });
        });
        return () => {
            ended = true;
            watch?.disconnect();
            window.removeEventListener('pointerdown', chosen, true);
            window.removeEventListener('keydown', chosen, true);
        };
    });

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
        const edge = floats().some((one) => one.id === page) ? null : edgeAt(rect, point);
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
    {#if armed !== null || pressing}
        <!-- The layer takes the press of a double click only; every key goes to the tab. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="keep" data-keep-layer bind:this={layer} onpointerdown={layerPressed}></div>
    {/if}
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
                <Empty message={emptyWords} />
            </div>
        </ContextMenu>
    {/if}
</div>

<style>
    /* The only thing on the page that scrolls is what a view puts in here. */
    .body {
        position: relative;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    /* The layer over the body, above a frame, that takes the second press of a double click. */
    .keep {
        position: absolute;
        inset: 0;
        z-index: 1;
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
