<script lang="ts">
    // Layer 3, primitive. A button that opens a list of choices. It holds only whether the list is
    // open: what the choices are and what picking one means belong to the caller, and the list
    // itself, with its keys, its Back choice and its groups, is MenuList.svelte's.
    //
    // The list closes on Escape, on a pointer down anywhere outside the button and the list, and on
    // a pick. The pointer listener is installed only while the list is open and is removed with it,
    // so a page holding several menus adds one listener at a time and none when they are all
    // closed.
    //
    // A menu hung beside its button draws its list on the body at the button's right edge, rising
    // from the button's foot as VS Code's menus at the foot of its activity bar do, for a button
    // in the rail: over a wallpaper the rail filters what it holds, and a list laid out inside it
    // would be painted under the panes beside it.
    //
    // The button that opens the list, in each of its looks, is MenuOpener.svelte beside this.

    import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
    import MenuList from './MenuList.svelte';
    import { focusQuietly } from './tooltip-target';
    import MenuOpener from './MenuOpener.svelte';

    type Props = {
        /** The button's own words. */
        label: string;
        items: MenuItem[];
        /** Headed runs of choices drawn in place of `items`, or nothing for a flat list. */
        groups?: MenuGroup[];
        /**
         * What picking a choice means. The pointer event is passed on so a caller can read its
         * modifiers. A choice of a group names that group's id as the third argument.
         */
        onpick: (id: string, event: MouseEvent, group?: string) => void;
        /** A glyph name drawn before the label, or nothing. */
        glyph?: string;
        /**
         * Draw the glyph alone and leave the words to the button's accessible name, for a menu in a
         * strip too narrow to hold them. Only useful together with a glyph.
         */
        compact?: boolean;
        /**
         * Which way the list opens. `up` is the default, for a menu at the foot of the window; a
         * menu in a header opens `down`, or its list is drawn above the top of what holds it and
         * is clipped away; `beside` opens it upward to the right of the button, on the body.
         */
        placement?: 'up' | 'down' | 'beside';
        /**
         * Which edge of the button the list lines up with. `left` is the default; a menu at the
         * right edge of the window lines up `right`, or its list runs off the screen.
         */
        align?: 'left' | 'right';
        /**
         * The opener as a strip's bare icon box, the same box a bare ToolButton draws: the glyph
         * alone, no border and no fill until the pointer is over it. The list it opens is
         * unchanged.
         */
        bare?: boolean;
        /** The opener as one item of the activity rail, the box a rail ToolButton draws. */
        rail?: boolean;
        /**
         * The opener's place in the browser's focus order, for a strip that is one stop: 0 for the
         * control at the stop and -1 for the rest. An opener with none is an ordinary stop.
         */
        tabindex?: number;
        /**
         * This opener's name in the strip that carries the stop, rendered for that strip to read.
         */
        stop?: string;
        /** A key pressed on the opener, for a strip that moves its own stop with the arrow keys. */
        onkeydown?: (event: KeyboardEvent) => void;
    };

    let {
        label,
        items,
        groups,
        onpick,
        glyph,
        compact = false,
        placement = 'up',
        align = 'left',
        bare = false,
        rail = false,
        tabindex,
        stop,
        onkeydown
    }: Props = $props();

    /** How far from the button a list hung beside it sits. */
    const GAP = 4;

    let open = $state(false);
    let box: HTMLDivElement | undefined = $state();
    let button: HTMLButtonElement | undefined = $state();
    let list: HTMLDivElement | undefined = $state();

    /** Where a list hung beside the button is drawn, measured when it opens. */
    let at: { x: number; y: number } | undefined = $state();

    $effect(() => {
        if (!open) return;
        const outside = (event: PointerEvent): void => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (box?.contains(target) === true || list?.contains(target) === true) return;
            open = false;
        };
        // Capture, so a pointer down on a control that stops propagation still closes the menu.
        document.addEventListener('pointerdown', outside, true);
        return () => document.removeEventListener('pointerdown', outside, true);
    });

    function toggle(): void {
        if (!open && placement === 'beside' && button !== undefined) {
            const rect = button.getBoundingClientRect();
            at = { x: rect.right + GAP, y: rect.bottom };
        }
        open = !open;
    }

    function pick(id: string, event: MouseEvent, group?: string): void {
        open = false;
        if (button !== undefined) focusQuietly(button);
        if (group === undefined) onpick(id, event);
        else onpick(id, event, group);
    }

    function escape(): void {
        open = false;
        if (button !== undefined) focusQuietly(button);
    }
</script>

<div class="menu" bind:this={box}>
    <MenuOpener
        {label}
        {open}
        onclick={toggle}
        bind:button
        {glyph}
        {compact}
        {bare}
        {rail}
        {tabindex}
        {stop}
        {onkeydown}
    />
    {#if open}
        <MenuList
            {label}
            {items}
            {groups}
            onpick={pick}
            onescape={escape}
            placement={placement === 'down' ? 'down' : 'up'}
            {align}
            at={placement === 'beside' ? at : undefined}
            rise={placement === 'beside'}
            bind:element={list}
        />
    {/if}
</div>

<style>
    .menu {
        position: relative;
        display: flex;
    }
</style>
