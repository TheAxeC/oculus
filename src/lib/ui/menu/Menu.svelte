<script module lang="ts">
    import type { MenuItem as Item } from '$lib/ui/menu/menu-items';

    /**
     * One headed run of choices, for a list whose choices fall under several headings (the board's
     * one filter control, a heading per facet). Two groups may hold choices of the same id, so a
     * pick names the group it came from.
     */
    export type MenuGroup = { id: string; heading: string; items: Item[] };
</script>

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
    //
    // A menu given `groups` draws each group's heading above its choices instead of the flat list,
    // and the arrow keys walk the choices of every group as one list; the headings are words, not
    // stops. A choice inside a group is always a pick.
    //
    // The button that opens the list, in each of its looks, is MenuOpener.svelte beside this.

    import { type MenuItem, menuLevel, menuPlacement } from '$lib/ui/menu/menu-items';
    import Glyph from '../controls/Glyph.svelte';
    import MenuOpener from './MenuOpener.svelte';
    import { t } from '$lib/state/words/text';

    type Props = {
        /** The button's own words. */
        label: string;
        items: MenuItem[];
        /** Headed runs of choices drawn in place of `items`, or nothing for a flat list. */
        groups?: MenuGroup[];
        /**
         * What picking a choice means. The pointer event is passed on so a caller can read its
         * modifiers: the rail opens a view where a view lands, and in a pane beside it when shift
         * is held, whether the view was picked from a button or from a group's list. A choice of a
         * group names that group's id as the third argument.
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
        /**
         * The opener as a strip's bare icon box, the same box a bare ToolButton draws: the glyph
         * alone, no border and no fill until the pointer is over it. The list it opens is unchanged.
         */
        bare?: boolean;
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
        groups,
        onpick,
        glyph,
        compact = false,
        placement = 'up',
        align = 'left',
        rail = false,
        bare = false,
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

    /** Where each group's first choice sits among the drawn entries, by the group's order. */
    const starts = $derived(
        (groups ?? []).reduce<number[]>(
            (held, group, at) => [
                ...held,
                at === 0 ? 0 : held[at - 1] + (groups ?? [])[at - 1].items.length
            ],
            []
        )
    );

    /** How many entries the arrow keys walk: every group's choices, or the shown list and Back. */
    const count = $derived(
        groups === undefined
            ? shown.length + offset
            : groups.reduce((sum, group) => sum + group.items.length, 0)
    );

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

    function pick(id: string, event: MouseEvent, group?: string): void {
        open = false;
        button?.focus();
        if (group === undefined) onpick(id, event);
        else onpick(id, event, group);
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
        if (count === 0) return;
        focusAt((index + step + count) % count);
    }
</script>

{#snippet entry(item: MenuItem, at: number, onchoose: (event: MouseEvent) => void)}
    <button
        type="button"
        class="item"
        class:current={item.active === true}
        role="menuitem"
        aria-current={item.active === true}
        aria-haspopup={item.items === undefined ? undefined : 'menu'}
        title={item.title}
        bind:this={entries[at]}
        onclick={(event) => onchoose(event)}
        onkeydown={(event) => keys(event, at)}
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
{/snippet}

<div class="menu" bind:this={box}>
    <MenuOpener
        {label}
        {open}
        onclick={toggle}
        bind:button
        {glyph}
        {compact}
        {rail}
        {bare}
        {stacked}
        {tabindex}
        {stop}
        {onkeydown}
    />
    {#if open}
        <div
            class="list"
            class:beside
            class:down={placement === 'down'}
            class:right={align === 'right'}
            class:grouped={groups !== undefined}
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
            {#if groups !== undefined}
                {#each groups as group, g (group.id)}
                    <div class="group" role="group" aria-label={group.heading}>
                        <span class="heading" aria-hidden="true">{group.heading}</span>
                        {#each group.items as item, index (item.id)}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render entry(item, starts[g] + index, (event: MouseEvent) =>
                                pick(item.id, event, group.id)
                            )}
                        {/each}
                    </div>
                {/each}
            {:else}
                {#each shown as item, index (item.id)}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render entry(item, index + offset, (event: MouseEvent) =>
                        choose(item, event)
                    )}
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .menu {
        position: relative;
        display: flex;
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

    /* A list of several headed groups can be longer than the pane under it, so it scrolls. */
    .list.grouped {
        max-height: min(60vh, 520px);
        overflow-y: auto;
    }

    .group {
        display: flex;
        flex-direction: column;
    }

    .heading {
        padding: 6px 6px 2px;
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
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

    .item:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
</style>
