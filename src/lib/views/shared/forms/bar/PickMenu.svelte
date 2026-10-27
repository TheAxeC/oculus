<script lang="ts">
    // Layer 3, shared view partial of the bar FilterBar.svelte and SliceLine.svelte draw for the
    // project boards, the collection views and the Map, and of the Map's Show button
    // (views/structure/map/Map.svelte). A button of that bar that opens a list of values to pick: a
    // group button of line 1 (one facet), the More button (several facets, each headed by its
    // name), the "+<n>" button at the end of line 2 (the slices folded off the line, each category
    // headed by its name) and the Map's Show button (the kinds of node it draws). The list has a
    // search field at its top, then the values, each with a dot in its hue, its words and its
    // count; a picked value is ticked and its words are drawn filled in its hue, and the Venue list
    // draws behind each count a bar as long as the count is against the largest count of the list.
    // Typing filters the values by their words, over every heading; the arrows move; a press or
    // Enter picks or unpicks a value, and the list stays open, so several are picked in one go.
    // Escape and a press outside close it and give the focus back to the button.
    //
    // It is bits-ui's Popover holding bits-ui's Command, as the toolbar's popover and the palette
    // are: the opening, the closing, the focus going back, the keys and the selection are theirs,
    // and the filtering is done here over the words alone (`shouldFilter` off), so a value's id
    // never matches what was typed. The button is ui/menu/MenuOpener.svelte, handed the popover's
    // trigger, and the box is ui/frame/FloatingList.svelte, so the list looks as a menu's list
    // does, its rows, dots and badges in MenuList.svelte's tokens. The words, the counts and the
    // hues are the caller's, in the shapes of state/boards/board/filter-menu.ts (`FilterGroup`,
    // `FilterChoice`). Beside the button it draws the red badge and the amber mark of the counts a
    // group carries (`badge`, `warning`).

    import { Command, Popover } from 'bits-ui';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import FloatingList from '$lib/ui/frame/FloatingList.svelte';
    import MenuOpener from '$lib/ui/menu/MenuOpener.svelte';
    import type { FilterChoice, FilterGroup } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The button's words, which carry the picks ("Form: journal article +1"). */
        label: string;
        /** The groups of values the list holds. */
        groups: FilterGroup[];
        /** Whether each group is headed by its name, for a list of several. */
        headed?: boolean;
        /** Picks or unpicks one value of one group. */
        onpick: (group: string, value: string) => void;
        /** A red badge beside the button ("2 blocked"), or the empty string for none. */
        badge?: string;
        /** The words of an amber mark beside the button, its tip, or the empty string for none. */
        warning?: string;
    };

    let { label, groups, headed = false, onpick, badge = '', warning = '' }: Props = $props();

    /** Whether the list is open, and what is typed in its search field. */
    let open = $state(false);
    let query = $state('');

    /** The values whose words hold what is typed, each group with none left out. */
    const shown = $derived.by(() => {
        const needle = query.trim().toLowerCase();
        return groups
            .map((group) => ({
                ...group,
                items: group.items.filter((one) => one.label.toLowerCase().includes(needle))
            }))
            .filter((group) => group.items.length > 0);
    });

    /** The search starts empty each time the list opens. */
    function changed(next: boolean): void {
        if (next) query = '';
    }

    /** The hue of a value's dot, its bar and its fill while picked, as inline custom properties. */
    function toneStyle(choice: FilterChoice): string {
        return `--tone: var(--c-${choice.tone}); --on-tone: var(--on-c-${choice.tone})`;
    }

    /** The hue of a group's heading, and none for a group that has none (the "other" slices). */
    function headingStyle(group: FilterGroup): string | undefined {
        return group.tone === '' ? undefined : `--tone: var(--c-${group.tone}-txt)`;
    }
</script>

{#snippet row(group: FilterGroup, choice: FilterChoice)}
    <Command.Item value={`${group.id}\n${choice.id}`} onSelect={() => onpick(group.id, choice.id)}>
        {#snippet child({ props })}
            <div
                {...props}
                class="item"
                class:current={choice.active}
                title={choice.title}
                style={toneStyle(choice)}
            >
                <span class="label">{choice.label}</span>
                <span class="check" aria-hidden="true">
                    {#if choice.active}
                        <Glyph name="check" />
                    {/if}
                </span>
                <span class="dot"></span>
                <span class="count">{choice.count}</span>
                {#if choice.share !== undefined}
                    <span class="bar" style={`--share: ${choice.share}`}></span>
                {/if}
            </div>
        {/snippet}
    </Command.Item>
{/snippet}

<span class="pick">
    <Popover.Root bind:open onOpenChange={changed}>
        <Popover.Trigger>
            {#snippet child({ props })}
                <MenuOpener
                    small
                    {label}
                    title={warning === '' ? label : warning}
                    trigger={props}
                />
            {/snippet}
        </Popover.Trigger>
        <Popover.Portal>
            <Popover.Content side="bottom" align="start" sideOffset={4} collisionPadding={8}>
                {#snippet child({ wrapperProps, props })}
                    <div {...wrapperProps}>
                        <FloatingList {label} list={props} shape="grouped">
                            <Command.Root shouldFilter={false} loop vimBindings={false} {label}>
                                <Command.Input>
                                    {#snippet child({ props: input })}
                                        <Search
                                            value={query}
                                            placeholder={t('board.pick_search')}
                                            field={input}
                                            oninput={(value: string) => (query = value)}
                                        />
                                    {/snippet}
                                </Command.Input>
                                <Command.List>
                                    {#snippet child({ props: list })}
                                        <div {...list} class="values">
                                            {#each shown as group (group.id)}
                                                {#if headed}
                                                    <Command.Group value={`group:${group.id}`}>
                                                        <Command.GroupHeading>
                                                            {#snippet child({ props: heading })}
                                                                <span
                                                                    {...heading}
                                                                    class="heading"
                                                                    style={headingStyle(group)}
                                                                >
                                                                    {group.heading}
                                                                </span>
                                                            {/snippet}
                                                        </Command.GroupHeading>
                                                        <Command.GroupItems>
                                                            {#each group.items as choice (choice.id)}
                                                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                                                {@render row(group, choice)}
                                                            {/each}
                                                        </Command.GroupItems>
                                                    </Command.Group>
                                                {:else}
                                                    {#each group.items as choice (choice.id)}
                                                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                                        {@render row(group, choice)}
                                                    {/each}
                                                {/if}
                                            {/each}
                                            {#if shown.length === 0}
                                                <p class="empty">{t('board.empty')}</p>
                                            {/if}
                                        </div>
                                    {/snippet}
                                </Command.List>
                            </Command.Root>
                        </FloatingList>
                    </div>
                {/snippet}
            </Popover.Content>
        </Popover.Portal>
    </Popover.Root>
    {#if badge !== ''}
        <Chip label={badge} tone="red" filled />
    {/if}
    {#if warning !== ''}
        <span class="warning" aria-hidden="true">
            <Glyph name={t('board.warn_glyph')} />
        </span>
    {/if}
</span>

<style>
    /* The button with its badge and its mark: one piece of the bar that does not wrap. */
    .pick {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 4px;
    }

    .warning {
        display: inline-flex;
        color: var(--c-amber-txt);
    }

    .values {
        display: flex;
        flex-direction: column;
        margin-top: 4px;
    }

    /* A group's heading, as a menu's group heading is drawn, in its facet's or category's hue. */
    .heading {
        display: block;
        padding: 6px 6px 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--tone, var(--muted-txt, var(--muted)));
    }

    /* A value's row in a menu's look: the words first for the reader of a row's text, then the
       tick, the dot before them by the flex order, the count at the end as a menu item's badge,
       and the Venue list's bar after the count. */
    .item[data-selected] {
        background: var(--chip);
    }

    .label {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    /* A picked value's words are drawn as a chip filled in its hue, the pair of tokens a filled
       Chip.svelte paints, so a pick reads in its own colour. */
    .item.current .label {
        padding: 0 6px;
        border-radius: var(--radius-pill);
        background: var(--tone);
        color: var(--on-tone);
    }

    .check {
        order: -2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 1em;
        height: 1em;
    }

    .dot {
        order: -1;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--tone);
        flex: none;
    }

    .count {
        margin-left: auto;
        padding: 0 4px;
        border-radius: var(--radius-pill);
        background: var(--chip);
        color: var(--accent-txt, var(--accent));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .bar {
        flex: none;
        width: calc(var(--share) * 48px);
        min-width: 2px;
        height: 6px;
        border-radius: var(--radius-pill);
        background: var(--tone);
    }

    .empty {
        margin: 4px 6px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
