<script lang="ts">
    // Layer 3, primitive. The menu a right-click opens on what it wraps, on bits-ui's Context Menu:
    // the list MenuList.svelte draws, on the body through bits-ui's Portal, at the pointer. The
    // keyboard opens the same list with the context menu key or Shift+F10 on the focused control
    // inside, at that control's right edge, so every item a right-click offers is reached without
    // a pointer. It holds only where the list opens from: what the items are and what a pick means
    // are the caller's, and the keys, the placing, the submenus and the closing are bits-ui's.
    //
    // The wrapper takes no box of its own, so what it wraps is laid out as if it were not there.
    // With no items a right-click opens nothing. The list closes on a pick, on Escape and on a
    // press outside it, and the focus goes back to the control the menu was opened on, without
    // opening that control's tooltip. A pick is answered once the focus is back, so a dialog the
    // pick raises keeps the focus it takes.
    //
    // Choices that arrive after the list opened (`lead`) are drawn at its top.
    //
    // A menu whose items depend on the moment of the right-click (what is selected, what is under
    // the pointer) reads them from the right-click itself, through `read`, as it arrives. A menu
    // that is `own` keeps its right-click from every menu around it, so a text box inside a row
    // opens the box's menu and not the row's as well; the menu key and Shift+F10 open only the
    // innermost menu around the control either way.

    import { ContextMenu } from 'bits-ui';
    import type { Snippet } from 'svelte';
    import { menuClosing, type MenuItem } from '$lib/ui/menu/menu-items';
    import MenuList from './MenuList.svelte';

    type Props = {
        /** The list's accessible name. */
        label: string;
        /** The items, when they are known before the right-click. */
        items?: MenuItem[];
        /** The items read from the right-click as it arrives, in place of `items`. */
        read?: (event: MouseEvent) => MenuItem[];
        /**
         * Choices a caller learns only after the right-click, drawn first, above the rest and a
         * rule. They are state: choices that arrive while the list is open appear at its top.
         */
        lead?: MenuItem[];
        /** Keep the right-click from the menus around this one. */
        own?: boolean;
        /** A pick, with the pointer event, so a caller can read its modifiers. */
        onpick: (id: string, event: MouseEvent) => void;
        children: Snippet;
    };

    let { label, items = [], read, lead = [], onpick, children, own = false }: Props = $props();

    let open = $state(false);

    /** What the last right-click read, for a menu that reads its items then. */
    let heard: MenuItem[] = $state([]);
    const rest = $derived(read === undefined ? items : heard);
    const shown = $derived(
        lead.length === 0 || rest.length === 0
            ? [...lead, ...rest]
            : [...lead, ...rest.map((item, at) => (at === 0 ? { ...item, rule: true } : item))]
    );

    /** The control the menu was opened on, which takes the focus back when it closes. */
    let origin: HTMLElement | null = null;

    const closing = menuClosing(() => origin);

    /** The control a right-click or a key landed on: the button it is in, or the element itself. */
    function controlOf(target: EventTarget | null): HTMLElement | null {
        if (!(target instanceof HTMLElement)) return null;
        return target.closest<HTMLElement>('button') ?? target;
    }

    /**
     * Open the list at the right edge of the control the keyboard is on, by raising the right-click
     * bits-ui's trigger opens at, at that point.
     */
    function openAtEdge(target: EventTarget | null): void {
        if (!(target instanceof Element)) return;
        const rect = target.getBoundingClientRect();
        target.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: rect.right,
                clientY: rect.top
            })
        );
    }

    /**
     * A right-click, or the context menu a browser raises for a key it answers itself, at no
     * point: that one is raised again at the control's edge. With no items the browser's own menu
     * is kept away and nothing opens.
     */
    function pointed(event: MouseEvent): void {
        if (own) event.stopPropagation();
        if (read !== undefined) heard = read(event);
        if (shown.length === 0) {
            event.preventDefault();
            return;
        }
        origin = controlOf(event.target);
        if (event.isTrusted && event.clientX === 0 && event.clientY === 0) {
            event.preventDefault();
            openAtEdge(event.target);
        }
    }

    /**
     * The menu key or Shift+F10 on a control inside. A key a menu nested inside this one already
     * answered is left alone, so only the innermost menu around the control opens.
     */
    function keys(event: KeyboardEvent): void {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (read === undefined && items.length === 0) return;
        openAtEdge(event.target);
    }

    function pick(id: string, event: MouseEvent): void {
        closing.hold(() => onpick(id, event));
    }

    /**
     * The trigger's attributes on the wrapper, less a focus stop a wrapper with no box cannot be.
     */
    function wrapperOf(given: unknown): Record<string, unknown> {
        const props = given as Record<string, unknown>;
        const { tabindex: _tabindex, ...rest } = props;
        return rest;
    }
</script>

<ContextMenu.Root bind:open onOpenChange={closing.changed} onOpenChangeComplete={closing.completed}>
    <!-- The wrapper only hears the right-click and the menu keys of the controls inside it, which
         are the controls; it is not one itself. -->
    <ContextMenu.Trigger oncontextmenu={pointed} onkeydown={keys}>
        {#snippet child({ props })}
            <div {...wrapperOf(props)} class="context">
                {@render children()}
            </div>
        {/snippet}
    </ContextMenu.Trigger>
    <ContextMenu.Portal>
        <ContextMenu.Content sideOffset={0} {...closing.content}>
            {#snippet child({ wrapperProps, props })}
                <div {...wrapperProps}>
                    <MenuList {label} items={shown} onpick={pick} list={props} />
                </div>
            {/snippet}
        </ContextMenu.Content>
    </ContextMenu.Portal>
</ContextMenu.Root>

<style>
    .context {
        display: contents;
    }
</style>
