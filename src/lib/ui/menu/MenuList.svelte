<script lang="ts">
    // Layer 3, primitive. The list of choices a menu shows while it is open: its entries, the Back
    // choice inside a choice that holds a list of its own, the headed groups, and the keys that
    // walk them. It is apart from the button that opens it so the one list serves both openers the
    // tree has: Menu.svelte's button, and ContextMenu.svelte's right-click on what it wraps.
    //
    // Where it is drawn is the opener's to say. Hung under or over its opener it is laid out
    // against the opener's box. Given a point it is drawn on the body at that point in viewport
    // coordinates, for a list opened from a strip whose surface filters or clips what it holds (the
    // rail over a wallpaper), as a tooltip's bubble is; it is moved inside the window once its own
    // size is known.
    //
    // The list takes the keyboard when it appears, on its first choice. Escape is the opener's to
    // answer, since only the opener knows where the focus goes back to.

    import { onMount, tick } from 'svelte';
    import { type MenuGroup, type MenuItem, menuLevel } from '$lib/ui/menu/menu-items';
    import Glyph from '../display/Glyph.svelte';
    import { onBody } from '../frame/on-body';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The list's accessible name, which is its opener's words. */
        label: string;
        items: MenuItem[];
        /** Headed runs of choices drawn in place of `items`, or nothing for a flat list. */
        groups?: MenuGroup[];
        /** A pick, with the pointer event and, for a choice of a group, that group's id. */
        onpick: (id: string, event: MouseEvent, group?: string) => void;
        /** Escape pressed inside the list. */
        onescape: () => void;
        /** Hung over its opener (`up`) or under it (`down`). Ignored when `at` is given. */
        placement?: 'up' | 'down';
        /** Which edge of the opener the list lines up with. Ignored when `at` is given. */
        align?: 'left' | 'right';
        /** A point in the viewport the list's top left corner is drawn at, on the body. */
        at?: { x: number; y: number };
        /**
         * Draw a list given a point upward from it: the point is its bottom left corner, as a menu
         * at the foot of a bar opens up from its button.
         */
        rise?: boolean;
        /** The list element, bound so an opener can tell a press inside it from one outside. */
        element?: HTMLDivElement;
    };

    let {
        label,
        items,
        groups,
        onpick,
        onescape,
        placement = 'up',
        align = 'left',
        at,
        rise = false,
        element = $bindable()
    }: Props = $props();

    /** How near the window's edges a list drawn at a point may come. */
    const MARGIN = 8;

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
            (held, group, index) => [
                ...held,
                index === 0 ? 0 : held[index - 1] + (groups ?? [])[index - 1].items.length
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

    /**
     * Where a list drawn at a point sits, moved up and left from the point by as much as it would
     * run past the window's bottom and right edges.
     */
    let shift = $state({ x: 0, y: 0 });

    /** Whether a list drawn at a point was measured and moved; it is not shown before that. */
    let placed = $state(false);

    // A rising list is no taller than the space above its point, and scrolls past that, so a list
    // longer than that space still ends on the point instead of running past the window's bottom.
    const pointStyle = $derived(
        at === undefined
            ? undefined
            : `left: ${at.x - shift.x}px; top: ${at.y - shift.y}px` +
                  (rise
                      ? `; max-height: ${at.y - MARGIN}px; box-sizing: border-box; overflow-y: auto`
                      : '') +
                  (placed ? '' : '; visibility: hidden')
    );

    onMount(() => {
        const point = at;
        if (point === undefined) {
            focusAt(0);
            return;
        }
        // Measured once the list is on the body, where its box is the one the reader sees, and
        // given the keyboard once it is shown there, since a hidden choice takes no focus.
        queueMicrotask(() => {
            if (!element) return;
            const rect = element.getBoundingClientRect();
            shift = {
                x: Math.max(0, rect.right - (window.innerWidth - MARGIN)),
                // A rising list stands on the point, down to the window's top margin at most; any
                // other hangs from it, moved up by as much as it would run past the bottom.
                y: rise
                    ? Math.min(rect.height, point.y - MARGIN)
                    : Math.max(0, rect.bottom - (window.innerHeight - MARGIN))
            };
            placed = true;
            void tick().then(() => focusAt(0));
        });
    });

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

    /** A choice with a list of its own opens that list; any other choice is the caller's pick. */
    function choose(item: MenuItem, event: MouseEvent): void {
        if (item.items === undefined) {
            onpick(item.id, event);
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

    function keys(event: KeyboardEvent, index: number): void {
        if (event.key === 'Escape') {
            event.preventDefault();
            onescape();
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        if (count === 0) return;
        focusAt((index + step + count) % count);
    }
</script>

{#snippet entry(item: MenuItem, index: number, onchoose: (event: MouseEvent) => void)}
    <button
        type="button"
        class="item"
        class:current={item.active === true}
        role="menuitem"
        aria-current={item.active === true}
        aria-haspopup={item.items === undefined ? undefined : 'menu'}
        title={item.title}
        bind:this={entries[index]}
        onclick={(event) => onchoose(event)}
        onkeydown={(event) => keys(event, index)}
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

<div
    class="list"
    class:down={placement === 'down'}
    class:right={align === 'right'}
    class:grouped={groups !== undefined}
    class:point={at !== undefined}
    role="menu"
    aria-label={label}
    style={pointStyle}
    bind:this={element}
    use:onBody={at !== undefined}
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
                        onpick(item.id, event, group.id)
                    )}
                {/each}
            </div>
        {/each}
    {:else}
        {#each shown as item, index (item.id)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render entry(item, index + offset, (event: MouseEvent) => choose(item, event))}
        {/each}
    {/if}
</div>

<style>
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

    /* A list drawn at a point is on the body, over every overlay a tooltip is under, and its
       place is the inline style. */
    .list.point {
        position: fixed;
        bottom: auto;
        right: auto;
        z-index: 70;
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
