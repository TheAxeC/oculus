<script lang="ts">
    // Layer 3, shell. The frames of the tabs, drawn once in one layer outside the pane tree. A
    // frame is an iframe element, and moving one in the document, or drawing it again, loads its
    // document again; a layout change draws the panes again. So a view draws only a slot
    // (ui/tabs/FrameSlot.svelte) and describes its frame to the tab frames store
    // (ui/tabs/tab-frames.svelte.ts), and this layer draws that frame as one element keyed by the
    // tab's id, over the slot while the slot is on screen and hidden while it is not: a tab the
    // pane does not show, a pane or a page that is not drawn, a view drawn again.
    //
    // A frame goes when its tab closes or shows another view, when its view drops it, and when its
    // key changes, which draws a new element.
    //
    // The place of a frame is the slot's box, read each animation frame while any frame is held:
    // a slot moves with a sash, a split, a float, the window and the bars above it, and nothing
    // tells a layer outside the tree. A frame is written only when its place changed. A frame of a
    // tab in a free float is one above that float (float-geometry's depths leave the odd ones
    // free), so a float in front of another hides the other float's frames too; every other frame
    // is at depth 0, above the page and below every float, menu and dialog.
    //
    // A frame takes no pointer while a tab or a sash is being dragged, so the pane under it hears
    // the drop, and while the pane over it holds the keep layer that takes a double click
    // (PaneBody.svelte).
    //
    // The sandbox is a fixed attribute of each kind of frame, so the document it holds is
    // sandboxed from its first request.

    import { untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';
    import type { TabFrames } from '$lib/ui/tabs/tab-frames.svelte';

    type Props = {
        /** The store the workbench provided to its views. */
        frames: TabFrames;
    };

    let { frames }: Props = $props();

    const {
        drag: { dragging },
        layout: { instanceView }
    } = useState();

    // A frame whose tab is gone, or shows another view, is dropped.
    $effect(() => {
        const gone = frames.ids().filter((id) => instanceView(id) !== frames.specOf(id)?.view);
        if (gone.length > 0) {
            untrack(() => {
                for (const id of gone) frames.drop(id);
            });
        }
    });

    /** The place written to each element, so an element is written only when it moved. */
    const placed = new WeakMap<HTMLIFrameElement, string>();

    /** The depth of a frame over `slot`: one above the float it is in, or 0 in the page. */
    function depthOver(slot: HTMLElement): number {
        const float = slot.closest<HTMLElement>('[data-float]');
        const depth = float === null ? Number.NaN : Number.parseInt(float.style.zIndex, 10);
        return Number.isNaN(depth) ? 0 : depth + 1;
    }

    /** Lay every frame over its slot, or hide it while its slot is not on screen. */
    function place(): void {
        for (const id of frames.ids()) {
            const node = frames.frameOf(id);
            if (node === undefined) continue;
            const slot = frames.slotOf(id);
            const shown =
                slot !== undefined && slot.isConnected && slot.getClientRects().length > 0;
            const box = shown ? slot.getBoundingClientRect() : null;
            const where =
                box === null || slot === undefined
                    ? 'hidden'
                    : [box.left, box.top, box.width, box.height, depthOver(slot)].join(' ');
            if (placed.get(node) === where) continue;
            placed.set(node, where);
            if (box === null || slot === undefined) {
                node.style.display = 'none';
                continue;
            }
            node.style.left = `${box.left}px`;
            node.style.top = `${box.top}px`;
            node.style.width = `${box.width}px`;
            node.style.height = `${box.height}px`;
            node.style.zIndex = String(depthOver(slot));
            node.style.display = 'block';
        }
    }

    /** The frame that held the keyboard at the last animation frame. */
    let lastActive: Element | null = null;

    /**
     * A press that moves the keyboard from one frame into another blurs no window of the page, so
     * the page hears nothing; a frame that newly holds the keyboard raises a `focusin` on its slot,
     * as the window's blur does for a press from the page (shell/keys/workbench-keys.svelte.ts),
     * and the pane that holds the slot becomes the active one.
     */
    function followFocus(): void {
        const active = document.activeElement;
        if (active === lastActive) return;
        lastActive = active;
        if (!(active instanceof HTMLIFrameElement)) return;
        const id = frames.ids().find((held) => frames.frameOf(held) === active);
        if (id === undefined) return;
        frames.slotOf(id)?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    }

    // While any frame is held, the places and the frame that holds the keyboard are read each
    // animation frame.
    $effect(() => {
        if (frames.ids().length === 0) return;
        let wait = 0;
        const again = (): void => {
            place();
            followFocus();
            wait = requestAnimationFrame(again);
        };
        wait = requestAnimationFrame(again);
        return () => cancelAnimationFrame(wait);
    });

    /** Whether the frame of this tab takes no pointer. */
    function inert(id: string): boolean {
        return dragging() !== null || frames.shielded(id);
    }

    /**
     * What a view hears of each document its frame loads: the document's own events, handed to the
     * view's latest handlers.
     */
    function listen(id: string, node: HTMLIFrameElement): () => void {
        const loaded = (): void => {
            if (untrack(() => frames.specOf(id)?.hear) === undefined) return;
            const held = node.contentDocument;
            if (held === null) return;
            held.addEventListener('contextmenu', (event) =>
                frames.specOf(id)?.hear?.contextmenu?.(event)
            );
            held.addEventListener('keydown', (event) => frames.specOf(id)?.hear?.keydown?.(event));
            held.addEventListener('click', (event) => frames.specOf(id)?.hear?.click?.(event));
        };
        node.addEventListener('load', loaded);
        return () => node.removeEventListener('load', loaded);
    }

    /**
     * One element drawn: recorded, handed to its view's `attach`, heard, and placed. The attachment
     * reads no state it would run again for: an element's connection lives as long as the element,
     * whatever the slot does.
     */
    function drawn(id: string, node: HTMLIFrameElement): () => void {
        return untrack(() => {
            const forget = frames.framed(id, node);
            const ended = frames.specOf(id)?.attach?.(node);
            const unlisten = listen(id, node);
            place();
            return () => {
                unlisten();
                if (typeof ended === 'function') ended();
                forget();
            };
        });
    }
</script>

<div class="frames">
    {#each frames.ids() as id (id)}
        {@const spec = frames.specOf(id)}
        {#if spec !== undefined}
            {#key spec.key}
                {#if spec.kind === 'app'}
                    <iframe
                        class="frame clear"
                        class:inert={inert(id)}
                        data-frame-of={id}
                        title={spec.title}
                        src={spec.src}
                        sandbox="allow-scripts allow-downloads"
                        allow=""
                        referrerpolicy="no-referrer"
                        style:color-scheme={spec.colorScheme}
                        {@attach (node: HTMLIFrameElement) => drawn(id, node)}
                    ></iframe>
                {:else if spec.kind === 'document'}
                    <iframe
                        class="frame panel"
                        class:inert={inert(id)}
                        data-frame-of={id}
                        title={spec.title}
                        src={spec.src}
                        sandbox="allow-same-origin allow-scripts"
                        {@attach (node: HTMLIFrameElement) => drawn(id, node)}
                    ></iframe>
                {:else}
                    <iframe
                        class="frame panel"
                        class:inert={inert(id)}
                        data-frame-of={id}
                        title={spec.title}
                        src={spec.src}
                        {@attach (node: HTMLIFrameElement) => drawn(id, node)}
                    ></iframe>
                {/if}
            {/key}
        {/if}
    {/each}
</div>

<style>
    /* The layer has no box of its own, so no stacking context: a frame is placed in the window and
       its depth is compared with the floats' and the menus' depths, which it could not be from
       inside a context of its own. */
    .frames {
        display: contents;
    }

    /* A frame is hidden until it is placed over its slot, in the window's coordinates. */
    .frame {
        position: fixed;
        display: none;
        box-sizing: border-box;
        border: 0;
        pointer-events: auto;
    }

    .frame.clear {
        background: transparent;
    }

    .frame.panel {
        background: var(--panel);
    }

    :global(body.wall) .frame.panel {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .frame.inert,
    :global(body.sashing) .frame {
        pointer-events: none;
    }
</style>
