<script lang="ts">
    // Layer 3, primitive. The menu a right-click opens on what it wraps: the list MenuList.svelte
    // draws, at the pointer, on the body. The keyboard opens the same list with the context menu
    // key or Shift+F10 on the focused control inside, at that control's right edge, so every item a
    // right-click offers is reached without a pointer. It holds only whether the list is open and
    // where: what the items are and what a pick means are the caller's.
    //
    // The wrapper takes no box of its own, so what it wraps is laid out as if it were not there.
    // The list closes on a pick, on Escape and on a pointer down outside it, and the focus goes
    // back to the control the menu was opened on, without opening that control's tooltip.

    import type { Snippet } from 'svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import MenuList from './MenuList.svelte';
    import { focusQuietly } from './tooltip-target';

    type Props = {
        /** The list's accessible name. */
        label: string;
        items: MenuItem[];
        /** A pick, with the pointer event, so a caller can read its modifiers. */
        onpick: (id: string, event: MouseEvent) => void;
        children: Snippet;
    };

    let { label, items, onpick, children }: Props = $props();

    let open = $state(false);
    let at = $state({ x: 0, y: 0 });
    let list: HTMLDivElement | undefined = $state();

    /** The control the menu was opened on, which takes the focus back when it closes. */
    let origin: HTMLElement | null = null;

    $effect(() => {
        if (!open) return;
        const outside = (event: PointerEvent): void => {
            const target = event.target;
            if (target instanceof Node && list?.contains(target) === true) return;
            open = false;
        };
        // Capture, so a pointer down on a control that stops propagation still closes the menu.
        document.addEventListener('pointerdown', outside, true);
        return () => document.removeEventListener('pointerdown', outside, true);
    });

    /** Open at a point, remembering the control the focus goes back to. */
    function show(point: { x: number; y: number }, from: EventTarget | null): void {
        if (items.length === 0) return;
        const control = from instanceof HTMLElement ? from.closest<HTMLElement>('button') : null;
        origin = control ?? (from instanceof HTMLElement ? from : null);
        at = point;
        open = true;
    }

    /** The right edge of the control the keyboard is on, where a list opened by a key goes. */
    function edgeOf(target: EventTarget | null): { x: number; y: number } {
        if (!(target instanceof Element)) return { x: 0, y: 0 };
        const rect = target.getBoundingClientRect();
        return { x: rect.right, y: rect.top };
    }

    /** A right-click, or the context menu a browser raises for a key it answers itself. */
    function pointed(event: MouseEvent): void {
        event.preventDefault();
        const byKey = event.clientX === 0 && event.clientY === 0;
        show(byKey ? edgeOf(event.target) : { x: event.clientX, y: event.clientY }, event.target);
    }

    function keys(event: KeyboardEvent): void {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        event.preventDefault();
        show(edgeOf(event.target), event.target);
    }

    function close(): void {
        open = false;
        const back = origin;
        origin = null;
        if (back?.isConnected === true) focusQuietly(back);
    }

    function pick(id: string, event: MouseEvent): void {
        close();
        onpick(id, event);
    }
</script>

<!-- The wrapper only hears the right-click and the menu keys of the controls inside it, which are
     the controls; it is not one itself. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="context" oncontextmenu={pointed} onkeydown={keys}>
    {@render children()}
</div>
{#if open}
    <MenuList {label} {items} onpick={pick} onescape={close} {at} bind:element={list} />
{/if}

<style>
    .context {
        display: contents;
    }
</style>
