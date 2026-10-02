<script lang="ts">
    // Layer 3, primitive. The list of choices a menu shows while it is open: its entries, the
    // submenu of a choice that holds a list of its own, and the headed groups. The two openers the
    // tree has draw it: Menu.svelte's button, on bits-ui's Dropdown Menu, and ContextMenu.svelte's
    // right-click on what it wraps, on bits-ui's Context Menu. Both share bits-ui's menu parts, so
    // the one list serves both.
    //
    // It is drawn inside the opener's bits-ui content, whose attributes it is handed as `list` and
    // hands on to ui/frame/FloatingList.svelte, which paints the box and the look its items share
    // with the icon dropdown's; what a menu item holds and how it answers the pointer is here. The
    // keys are bits-ui's: the arrows, Home and End, type-ahead on each label, ArrowRight or Enter
    // on a choice with a list of its own to open it to the side, and ArrowLeft or Escape in that
    // list to close it and give the keyboard back to its choice. Where the list is placed is
    // bits-ui's too; a list longer than the room it is given scrolls.
    //
    // Each entry holds its label first and draws its dot and glyph before it by the flex order, so
    // the text of an entry begins with its label, which is what bits-ui's type-ahead reads.
    //
    // A choice carrying `rule` draws bits-ui's separator above it, the line VS Code draws between
    // its menu groups; a separator is no choice, so the arrow keys and the type-ahead pass over
    // it, and the list's first choice draws none (menu-items.ts, `ruleAbove`).

    import { DropdownMenu } from 'bits-ui';
    import { clickOf, ruleAbove, type MenuGroup, type MenuItem } from '$lib/ui/menu/menu-items';
    import Glyph from '../display/Glyph.svelte';
    import FloatingList from '../frame/FloatingList.svelte';
    import MenuList from './MenuList.svelte';

    type Props = {
        /** The list's accessible name, which is its opener's words. */
        label: string;
        items: MenuItem[];
        /** Headed runs of choices drawn in place of `items`, or nothing for a flat list. */
        groups?: MenuGroup[];
        /** A pick, with the pointer event and, for a choice of a group, that group's id. */
        onpick: (id: string, event: MouseEvent, group?: string) => void;
        /** The attributes bits-ui's content gives the box that holds the choices. */
        list?: Record<string, unknown>;
    };

    let { label, items, groups, onpick, list = {} }: Props = $props();

    /** How near the window's edges a list may be laid out. */
    const MARGIN = 8;

    /** The trigger of each choice's submenu, by its place, to give the keyboard back to. */
    let subTriggers: Record<string, HTMLElement | null> = $state({});

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
</script>

{#snippet face(item: MenuItem)}
    <span class="label">{item.label}</span>
    {#if item.tone !== undefined}
        <span class="dot" style={dotStyle(item.tone)}></span>
    {/if}
    {#if item.glyph !== undefined}
        <span class="lead">
            <Glyph name={item.glyph} />
        </span>
    {/if}
    <!-- Hidden from the accessible name: the item keeps its label as its name, which is what a
         menuitem lookup by name relies on. The two forms are written out because a block inside
         the span would put the renderer's markers between the span and its count, which every
         reader of a count badge takes as one text node. -->
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
    {#if item.hint !== undefined && item.hint !== ''}
        <span class="hint">{item.hint}</span>
    {/if}
    {#if item.items !== undefined}
        <span class="more" aria-hidden="true">
            <Glyph name="chevron" />
        </span>
    {/if}
{/snippet}

{#snippet separator()}
    <DropdownMenu.Separator>
        {#snippet child({ props })}
            <div {...props} class="rule"></div>
        {/snippet}
    </DropdownMenu.Separator>
{/snippet}

{#snippet entry(item: MenuItem, at: string, group?: MenuGroup)}
    {#if item.items === undefined}
        <DropdownMenu.Item
            disabled={item.disabled === true}
            onclick={clickOf(item, onpick, group?.id)}
        >
            {#snippet child({ props })}
                <div
                    {...props}
                    class="item"
                    class:current={item.active === true}
                    aria-current={item.active === true}
                    title={item.title}
                >
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render face(item)}
                </div>
            {/snippet}
        </DropdownMenu.Item>
    {:else}
        {@const inner = item.items}
        <DropdownMenu.Sub>
            <!-- bits-ui's `ref` falls back to null and refuses a binding that reads undefined,
                 which an entry not yet drawn is in the record, so the binding reads null for
                 it. -->
            <DropdownMenu.SubTrigger
                bind:ref={
                    () => subTriggers[at] ?? null,
                    (node: HTMLElement | null) => (subTriggers[at] = node)
                }
            >
                {#snippet child({ props })}
                    <div
                        {...props}
                        class="item"
                        class:current={item.active === true}
                        aria-current={item.active === true}
                        title={item.title}
                    >
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render face(item)}
                    </div>
                {/snippet}
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                    collisionPadding={MARGIN}
                    strategy="fixed"
                    escapeKeydownBehavior="close"
                    onEscapeKeydown={() => subTriggers[at]?.focus()}
                >
                    {#snippet child({ wrapperProps, props })}
                        <div {...wrapperProps}>
                            <MenuList
                                label={item.label}
                                items={inner}
                                onpick={(id: string, event: MouseEvent) =>
                                    onpick(id, event, group?.id)}
                                list={props}
                            />
                        </div>
                    {/snippet}
                </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
        </DropdownMenu.Sub>
    {/if}
{/snippet}

<FloatingList {label} {list} shape={groups === undefined ? 'menu' : 'grouped'}>
    {#if groups !== undefined}
        {#each groups as group, g (group.id)}
            <DropdownMenu.Group>
                {#snippet child({ props })}
                    <div {...props} class="group">
                        <DropdownMenu.GroupHeading>
                            {#snippet child({ props: heading })}
                                <span {...heading} class="heading">{group.heading}</span>
                            {/snippet}
                        </DropdownMenu.GroupHeading>
                        {#each group.items as item, index (item.id)}
                            {#if ruleAbove(group.items, index)}
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                {@render separator()}
                            {/if}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render entry(item, `${g}:${index}`, group)}
                        {/each}
                    </div>
                {/snippet}
            </DropdownMenu.Group>
        {/each}
    {:else}
        {#each items as item, index (item.id)}
            {#if ruleAbove(items, index)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render separator()}
            {/if}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render entry(item, `${index}`)}
        {/each}
    {/if}
</FloatingList>

<style>
    .group {
        display: flex;
        flex-direction: column;
    }

    .heading {
        padding: 6px 6px 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    /* The line between two groups: one pixel of the border colour, clear of the choices above and
       below it by the list's own padding. */
    .rule {
        height: 1px;
        margin: 4px 0;
        background: var(--line);
    }

    .item .dot {
        order: -1;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--tone);
        flex: none;
    }

    .item-badge {
        margin-left: auto;
        padding: 0 4px;
        border-radius: var(--radius-pill);
        background: var(--badge-bg, var(--chip));
        color: var(--badge-fg, var(--accent-txt, var(--accent)));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    /* The keys of a choice sit at the end of its line, in the muted colour. */
    .hint {
        margin-left: auto;
        padding-left: 16px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .more {
        display: inline-flex;
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
    }

    .item-badge + .more {
        margin-left: 0;
    }

    /* A choice whose own list is open keeps the fill the pointer gave it while the list shows. */
    .item:hover,
    .item[data-state='open'] {
        background: var(--chip);
    }

    .item.current {
        color: var(--accent-txt, var(--accent));
    }

    .item[data-disabled] {
        opacity: 0.5;
    }

    .item:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
