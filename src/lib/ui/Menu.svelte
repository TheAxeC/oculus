<script lang="ts">
    // Layer 3, primitive. A button that opens a list of choices below it. It holds only whether it
    // is open and which item has the keyboard: what the choices are and what picking one means
    // belong to the caller.
    //
    // A choice that holds a list of its own shows that list in place of the menu's when picked, with a
    // first choice that goes back, so a list that would grow by one line per page stays the length of
    // its own choices. Opening the menu always starts on its own list.
    //
    // The list closes on Escape, on a pointer down anywhere outside it, and on a pick. The pointer
    // listener is installed only while the list is open and is removed with it, so a page holding
    // several menus adds one listener at a time and none when they are all closed.

    import { type MenuItem, menuLevel, menuPlacement } from '$lib/ui/menu-items';
    import Glyph from './Glyph.svelte';
    import Tooltip from './Tooltip.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        /** The button's own words. */
        label: string;
        items: MenuItem[];
        /**
         * What picking a choice means. The pointer event is passed on so a caller can read its
         * modifiers: the rail opens a view where a view lands, and in a pane beside it when shift
         * is held, whether the view was picked from a button or from a group's list.
         */
        onpick: (id: string, event: MouseEvent) => void;
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
         * is clipped away.
         */
        placement?: 'up' | 'down';
        /**
         * Which edge of the button the list lines up with. `left` is the default; a menu at the
         * right edge of the window lines up `right`, or its list runs off the screen.
         */
        align?: 'left' | 'right';
        /** Use the activity rail's one full-width, 34 px opener box. */
        rail?: boolean;
        /** Draw a compact rail glyph above its visible label instead of hiding the label. */
        stacked?: boolean;
        /**
         * The opener's place in the browser's focus order, for a strip that is one stop: 0 for the
         * control at the stop and -1 for the rest. An opener with none is an ordinary stop.
         */
        tabindex?: number;
        /** This opener's name in the strip that carries the stop, rendered for that strip to read. */
        stop?: string;
        /** A key pressed on the opener, for a strip that moves its own stop with the arrow keys. */
        onkeydown?: (event: KeyboardEvent) => void;
    };

    let {
        label,
        items,
        onpick,
        glyph,
        compact = false,
        placement = 'up',
        align = 'left',
        rail = false,
        stacked = false,
        tabindex,
        stop,
        onkeydown
    }: Props = $props();

    let open = $state(false);
    let box: HTMLDivElement | undefined = $state();
    let button: HTMLButtonElement | undefined = $state();
    let entries: (HTMLButtonElement | undefined)[] = $state([]);

    /** The choice whose own list is showing in place of the menu's, or null for the menu's list. */
    let opened: string | null = $state(null);

    /** The list inside the choice that is open, or null while the menu shows its own. */
    const level = $derived(menuLevel(items, opened));

    /** The choices drawn after the Back choice, which is drawn first and only inside a choice. */
    const shown = $derived(level ?? items);

    /** Where the first of `shown` sits among the drawn entries: after Back, when Back is drawn. */
    const offset = $derived(level === null ? 0 : 1);

    $effect(() => {
        if (!open) return;
        const outside = (event: PointerEvent): void => {
            const target = event.target;
            if (box !== undefined && target instanceof Node && box.contains(target)) return;
            open = false;
        };
        // Capture, so a pointer down on a control that stops propagation still closes the menu.
        document.addEventListener('pointerdown', outside, true);
        return () => document.removeEventListener('pointerdown', outside, true);
    });

    /** Whether the list opens beside its button rather than above or below it: a compact menu opening upward sits in the rail. */
    const beside = $derived(compact && placement !== 'down');

    /** The inline position of a list opening beside the rail, measured when it opens. */
    let placed = $state('');

    /**
     * Where a list beside the rail goes, in window coordinates: level with its button, hanging down
     * from the button's top when the button is in the upper half of the window and rising from its
     * bottom when it is in the lower half, and never taller than the room on that side. A list of
     * seventeen themes at the foot therefore grows upward and scrolls, and a group's list at the top
     * of the rail hangs beside its button rather than at the foot of the window.
     */
    function place(): string {
        if (!beside || button === undefined || typeof window === 'undefined') return '';
        const rect = button.getBoundingClientRect();
        const rail = button.closest('[data-rail]')?.getBoundingClientRect() ?? null;
        return menuPlacement(rect, rail, window.innerHeight);
    }

    /** The hue of one item's dot, as the one inline style this primitive writes. */
    function dotStyle(tone: string): string {
        return `--tone: var(--c-${tone})`;
    }

    /** The status pair for one item's badge. */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--badge-bg: var(--c-${tone}); --badge-fg: var(--on-c-${tone})`;
    }

    function toggle(): void {
        open = !open;
        if (open) {
            opened = null;
            placed = place();
            focusAt(0);
        }
    }

    /** A choice with a list of its own opens that list; any other choice is the caller's pick. */
    function choose(item: MenuItem, event: MouseEvent): void {
        if (item.items === undefined) {
            pick(item.id, event);
            return;
        }
        opened = item.id;
        focusAt(0);
    }

    /** Back to the menu's own list, the keyboard on the choice that was opened. */
    function back(): void {
        const was = items.findIndex((item) => item.id === opened);
        opened = null;
        focusAt(Math.max(0, was));
    }

    function focusAt(index: number): void {
        // The list is rendered by the same update that opened it, so the focus waits for the DOM.
        queueMicrotask(() => entries[index]?.focus());
    }

    function pick(id: string, event: MouseEvent): void {
        open = false;
        button?.focus();
        onpick(id, event);
    }

    function keys(event: KeyboardEvent, index: number): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            open = false;
            button?.focus();
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const count = shown.length + offset;
        if (count === 0) return;
        focusAt((index + step + count) % count);
    }
</script>

<div class="menu" bind:this={box}>
    <!-- A compact menu is an icon in a narrow column, so its words go beside it; a menu that shows
         its label has room underneath. -->
    <Tooltip text={label} placement={compact ? 'beside' : 'below'} presentational block={rail}>
        <button
            type="button"
            class="opener"
            class:compact
            class:rail-control={rail}
            class:stacked
            bind:this={button}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={label}
            data-stop={stop}
            {tabindex}
            onclick={toggle}
            {onkeydown}
        >
            {#if glyph !== undefined}
                <Glyph name={glyph} />
            {/if}
            {#if !compact || stacked}
                <span class="label">{label}</span>
            {/if}
        </button>
    </Tooltip>
    {#if open}
        <div
            class="list"
            class:beside
            class:down={placement === 'down'}
            class:right={align === 'right'}
            style={placed}
            role="menu"
            aria-label={label}
        >
            {#if level !== null}
                <button
                    type="button"
                    class="item back"
                    role="menuitem"
                    bind:this={entries[0]}
                    onclick={back}
                    onkeydown={(event) => keys(event, 0)}
                >
                    <span class="label">{t('ui.menu_back')}</span>
                </button>
            {/if}
            {#each shown as item, index (item.id)}
                <button
                    type="button"
                    class="item"
                    class:current={item.active === true}
                    role="menuitem"
                    aria-current={item.active === true}
                    aria-haspopup={item.items === undefined ? undefined : 'menu'}
                    title={item.title}
                    bind:this={entries[index + offset]}
                    onclick={(event) => choose(item, event)}
                    onkeydown={(event) => keys(event, index + offset)}
                >
                    {#if item.tone !== undefined}
                        <span class="dot" style={dotStyle(item.tone)}></span>
                    {/if}
                    {#if item.glyph !== undefined}
                        <Glyph name={item.glyph} />
                    {/if}
                    <span class="label">{item.label}</span>
                    <!-- Hidden from the accessible name: the item keeps its label as its name,
                         which is what a menuitem lookup by name and the browser suite rely on. The
                         two forms are written out because a block inside the span would put the
                         renderer's markers between the span and its count, which every reader of a
                         count badge takes as one text node. -->
                    {#if (item.badgeGlyph ?? '') !== ''}
                        <span
                            class="item-badge"
                            style={badgeStyle(item.badgeTone)}
                            title={item.badgeTitle}
                            aria-hidden="true"
                        >
                            <Glyph name={item.badgeGlyph ?? ''} />{item.badge}
                        </span>
                    {:else if item.badge}
                        <span
                            class="item-badge"
                            style={badgeStyle(item.badgeTone)}
                            title={item.badgeTitle}
                            aria-hidden="true"
                        >
                            {item.badge}
                        </span>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .menu {
        position: relative;
        display: flex;
    }

    .opener {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 4px 6px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
    }

    .opener:hover {
        border-color: var(--accent);
    }

    .opener.compact {
        justify-content: center;
        font-size: var(--fs-lg);
    }

    .opener.rail-control {
        height: 34px;
        box-sizing: border-box;
        background: none;
        font-size: var(--fs-xl);
        padding: 0;
    }

    .opener.stacked {
        flex-direction: column;
        gap: 1px;
    }

    .opener.stacked :global(.label) {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-3xs);
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .list {
        position: absolute;
        bottom: 100%;
        left: 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        min-width: 160px;
        margin-bottom: 4px;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    /* A list floats over a pane, so at the pane's own opacity it would be read through two
       translucent layers and the picture. It keeps more of its colour than the pane does. */
    :global(body.wall) .list {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .list.down {
        top: 100%;
        bottom: auto;
        margin-top: 4px;
        margin-bottom: 0;
    }

    .list.right {
        left: auto;
        right: 0;
    }

    /* A compact menu that opens upward sits in the rail, a strip too narrow for the list, so the
       list opens beside the rail rather than above the button: fixed to the window, level with its
       button, and bounded by the room on that side, all of which place() measures when it opens and
       writes as the inline style. Under a wallpaper the rail's backdrop filter makes the rail the
       containing block instead of the viewport; the rail spans the window's height from its left
       edge, so the two agree. A compact menu that opens downward (a pane's menu) keeps its
       placement. The list carries `beside` itself: the tooltip wrapper sits between the opener and
       the list, so a sibling selector on the opener would not reach it. */
    .list.beside {
        position: fixed;
        right: auto;
        top: auto;
        bottom: auto;
        overflow-y: auto;
        box-sizing: border-box;
        margin: 0;
    }

    .item .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--tone);
        flex: none;
    }

    .item {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        text-align: left;
        padding: 4px 6px;
        cursor: pointer;
    }

    .item-badge {
        margin-left: auto;
        padding: 0 4px;
        border-radius: var(--radius-pill);
        background: var(--badge-bg, var(--chip));
        color: var(--badge-fg, var(--accent-txt, var(--accent)));
        font-family: var(--font-num);
        font-size: var(--fs-3xs);
    }

    .item:hover {
        background: var(--chip);
    }

    .item.back {
        color: var(--muted-txt, var(--muted));
    }

    .item.current {
        color: var(--accent-txt, var(--accent));
    }

    .opener:focus-visible,
    .item:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
</style>
