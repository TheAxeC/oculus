<script lang="ts">
    // Layer 3, primitive. A button that opens a list of choices, on bits-ui's Dropdown Menu. It
    // holds only whether the list is open (`open`, closed at first), which a caller may bind to
    // know when the list is open, and which it reports to the watch of the region it is rendered
    // in (menu-watch.ts), so a region that draws itself differently while one of its menus is open
    // knows: what the choices are and what picking one means belong to the caller, the list's
    // drawing is MenuList.svelte's, and its keys, its placing, its submenus and its closing on a
    // press outside are bits-ui's.
    //
    // The list is drawn on the body through bits-ui's Portal and placed against the button, moved
    // inside the window when it would run past an edge. A menu hung beside its button rises from
    // the button's foot at its right edge, as VS Code's menus at the foot of its activity bar do.
    //
    // Escape and a pick close the list and give the focus back to the button without opening its
    // tooltip. A pick is answered once the list is gone and the focus is back, so a dialog the pick
    // raises keeps the focus it takes. A press outside and Tab leave the focus where they put it.
    //
    // A choice's action (menu-items.ts, `MenuAction`) is answered the same way as a pick: once the
    // list is gone and the focus is back.
    //
    // The button that opens the list, in each of its looks, is MenuOpener.svelte beside this.

    import { untrack } from 'svelte';
    import { DropdownMenu } from 'bits-ui';
    import { menuClosing, type MenuGroup, type MenuItem } from '$lib/ui/menu/menu-items';
    import MenuList from './MenuList.svelte';
    import MenuOpener from './MenuOpener.svelte';
    import { useMenuWatch } from './menu-watch';

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
         * The opener's words as the small text button ToolButton draws, 22 px high, for a menu in a
         * 22 px row.
         */
        small?: boolean;
        /**
         * Which way the list opens. `up` is the default, for a menu at the foot of the window; a
         * menu in a header opens `down`; `beside` opens it upward to the right of the button, for
         * a menu in the rail, and `above` upward from the button's top left corner. A list with
         * no room on its side opens on the other.
         */
        placement?: 'up' | 'down' | 'beside' | 'above';
        /**
         * Which edge of the button the list lines up with. `left` is the default; a menu at the
         * right edge of the window lines up `right`. Ignored for `beside` and `above`.
         */
        align?: 'left' | 'right';
        /**
         * The opener as a strip's bare icon box, the same box a bare ToolButton draws: the glyph
         * alone, no border and no fill until the pointer is over it. The list it opens is
         * unchanged.
         */
        bare?: boolean;
        /**
         * A bare opener's glyph in the ink of what it sits in, for an opener on a row whose tint
         * sets its own ink, where the muted colour would not read.
         */
        inherit?: boolean;
        /** The opener as one item of the activity rail, the box a rail ToolButton draws. */
        rail?: boolean;
        /** The opener as the dropdown part of a joined primary ToolButton. */
        primary?: boolean;
        /**
         * The opener as one item of the status bar, the box a status ToolButton draws, with its
         * own few words and its tooltip; its list rises from the item on the body.
         */
        status?: boolean;
        /** The status item's own few words. */
        words?: string;
        /** The status item's tooltip. */
        title?: string;
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
        /** The opener's glyph going round, while what the menu started runs. */
        turning?: boolean;
        /**
         * The opener waiting on what the menu started: drawn disabled, it opens no list on a press
         * or a key, and it stays in the focus order (MenuOpener.svelte).
         */
        waiting?: boolean;
        /** Whether the list is open; a caller binds it to know, and it starts closed. */
        open?: boolean;
    };

    let {
        label,
        items,
        groups,
        onpick,
        glyph,
        compact = false,
        small = false,
        placement = 'up',
        align = 'left',
        bare = false,
        inherit = false,
        rail = false,
        primary = false,
        status = false,
        words,
        title,
        tabindex,
        stop,
        onkeydown,
        turning = false,
        waiting = false,
        open = $bindable(false)
    }: Props = $props();

    /** How far from the button the list sits. */
    const GAP = 4;

    let button: HTMLButtonElement | undefined = $state();

    /** The side of the button the list opens on, and which of its edges it lines up with. */
    const side = $derived(
        placement === 'down' ? 'bottom' : placement === 'beside' ? 'right' : 'top'
    );
    const edge = $derived(
        placement === 'beside' ? 'end' : placement === 'above' || align === 'left' ? 'start' : 'end'
    );

    const closing = menuClosing(() => button);

    /** The watch of the region the menu is rendered in, told while the list is open. */
    const watch = useMenuWatch();

    $effect(() => {
        if (!open || watch === undefined) return;
        // The watch counts the open menus, so telling it reads its count; untracked, this
        // effect follows `open` alone.
        untrack(() => watch.opened());
        return () => watch.closed();
    });

    function pick(id: string, event: MouseEvent, group?: string): void {
        closing.hold(() => {
            if (group === undefined) onpick(id, event);
            else onpick(id, event, group);
        });
    }
</script>

<DropdownMenu.Root
    bind:open
    onOpenChange={closing.changed}
    onOpenChangeComplete={closing.completed}
>
    <DropdownMenu.Trigger {tabindex} {onkeydown}>
        {#snippet child({ props })}
            <MenuOpener
                {label}
                trigger={props}
                bind:button
                {glyph}
                {compact}
                {small}
                {bare}
                {inherit}
                {rail}
                {primary}
                {status}
                {words}
                {title}
                {stop}
                {turning}
                {waiting}
            />
        {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
        <DropdownMenu.Content {side} align={edge} sideOffset={GAP} {...closing.content}>
            {#snippet child({ wrapperProps, props })}
                <div {...wrapperProps}>
                    <MenuList
                        {label}
                        {items}
                        {groups}
                        onpick={pick}
                        onact={closing.hold}
                        list={props}
                    />
                </div>
            {/snippet}
        </DropdownMenu.Content>
    </DropdownMenu.Portal>
</DropdownMenu.Root>
