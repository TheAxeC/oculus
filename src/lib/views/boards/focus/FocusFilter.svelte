<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The Filter action of the Focus
    // pane's header: a bare glyph button, drawn pressed while the filter hides a row of the page,
    // that opens a list which stays open on a pick, as a project board's group lists do
    // (views/shared/forms/bar/PickMenu.svelte). The list holds Mine only, then the Role checklist
    // (the roles of `roles:` that have a field), while a person is marked as the user; the Tier
    // checklist (the words of `tiers:`); the Pillar checklist (every pillar of the workspace, its
    // hub's name after its title while there is more than one hub) while a pillar exists; and the
    // Hub checklist while the workspace has more than one hub. Mine only is drawn disabled, with a
    // tip that says why, while it would hide no row.
    // Every pick hands the whole choice back; the rule that applies it is
    // state/boards/focus/filter.ts.
    //
    // It is bits-ui's Popover holding bits-ui's Command, as PickMenu.svelte is, with the popover
    // opened by the header's ToolButton and placed against it (`customAnchor`), since a ToolButton
    // draws the pressed state a header action carries and the menu opener does not. The list takes
    // the focus when it opens, so the arrows move and Enter picks; Escape and a press outside close
    // it and give the focus back to the button. The box is ui/frame/FloatingList.svelte, so the
    // list looks as a menu's list does.

    import { Command, Popover } from 'bits-ui';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import FloatingList from '$lib/ui/frame/FloatingList.svelte';
    import type { TierWord } from '$lib/state/boards/focus';
    import type { FocusFilter } from '$lib/state/boards/focus/filter';
    import { toggled } from '$lib/state/shared/lists/lists';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The choice in force. */
        filter: FocusFilter;
        /** Whether a person is marked as the user, which draws Mine only and the Role checklist. */
        named: boolean;
        /** The roles of `roles:` that have a field, each by its key and its words. */
        roles: { key: string; label: string }[];
        /** The words of `tiers:`. */
        tiers: TierWord[];
        /** The pillars of the workspace, each by its id and its words (`pillarRows`). */
        pillars: { key: string; label: string }[];
        /** The hubs of the workspace, none while it has one. */
        hubs: readonly string[];
        /** Whether Mine only would hide a row of the page. */
        mineHides: boolean;
        /** Whether the filter hides a row of the page, which draws the button pressed. */
        hides: boolean;
        /** Keep the choice after a pick. */
        onchange: (filter: FocusFilter) => void;
    };

    let { filter, named, roles, tiers, pillars, hubs, mineHides, hides, onchange }: Props =
        $props();

    /** Whether the list is open, the button it is placed against, and the list itself. */
    let open = $state(false);
    let anchor = $state<HTMLElement | null>(null);
    let list = $state<HTMLElement | null>(null);

    /** One row of the list: its words, its tick, its tip and what a pick of it does. */
    type Row = {
        id: string;
        label: string;
        ticked: boolean;
        title?: string;
        disabled?: boolean;
        pick: () => void;
    };

    /** One group of the list: its id, its heading (empty for none) and its rows. */
    type Group = { id: string; heading: string; rows: Row[] };

    /** The groups of the list, each under its heading, a group with no heading drawn bare. */
    const groups = $derived.by(() => {
        const made: Group[] = [];
        if (named) {
            made.push({
                id: 'mine',
                heading: '',
                rows: [
                    {
                        id: 'mine',
                        label: t('roles.mine'),
                        ticked: filter.mine,
                        title: mineHides ? t('roles.mine_tip') : t('focus.mine_all'),
                        disabled: !mineHides,
                        pick: () => onchange({ ...filter, mine: !filter.mine })
                    }
                ]
            });
        }
        if (named && roles.length > 0) {
            made.push({
                id: 'role',
                heading: t('roles.facet'),
                rows: roles.map((role) => ({
                    id: role.key,
                    label: role.label,
                    ticked: !filter.roles.includes(role.key),
                    pick: () => onchange({ ...filter, roles: toggled(filter.roles, role.key) })
                }))
            });
        }
        if (tiers.length > 0) {
            made.push({
                id: 'tier',
                heading: t('focus.filter_tier'),
                rows: tiers.map((tier) => ({
                    id: tier.key,
                    label: tier.label,
                    ticked: !filter.tiers.includes(tier.key),
                    pick: () => onchange({ ...filter, tiers: toggled(filter.tiers, tier.key) })
                }))
            });
        }
        if (pillars.length > 0) {
            made.push({
                id: 'pillar',
                heading: t('focus.filter_pillar'),
                rows: pillars.map((pillar) => ({
                    id: pillar.key,
                    label: pillar.label,
                    ticked: !filter.pillars.includes(pillar.key),
                    pick: () =>
                        onchange({ ...filter, pillars: toggled(filter.pillars, pillar.key) })
                }))
            });
        }
        if (hubs.length > 0) {
            made.push({
                id: 'hub',
                heading: t('focus.filter_hub'),
                rows: hubs.map((hub) => ({
                    id: hub,
                    label: hub,
                    ticked: !filter.hubs.includes(hub),
                    pick: () => onchange({ ...filter, hubs: toggled(filter.hubs, hub) })
                }))
            });
        }
        return made;
    });

    /** A press on the button is the button's own, so it does not also count as a press outside. */
    function outside(event: PointerEvent): void {
        if (event.target instanceof Node && anchor?.contains(event.target) === true) {
            event.preventDefault();
        }
    }

    /** The list takes the focus when it opens, so the keys move over its rows. */
    function opened(event: Event): void {
        event.preventDefault();
        list?.focus();
    }

    /** The focus goes back to the button when the list closes. */
    function closed(event: Event): void {
        event.preventDefault();
        anchor?.querySelector('button')?.focus();
    }
</script>

{#snippet body()}
    <Command.Root
        bind:ref={list}
        shouldFilter={false}
        loop
        vimBindings={false}
        label={t('focus.filter')}
    >
        <Command.List>
            {#snippet child({ props: rows })}
                <div {...rows} class="values">
                    {#each groups as group (group.id)}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render section(group)}
                    {/each}
                </div>
            {/snippet}
        </Command.List>
    </Command.Root>
{/snippet}

{#snippet section(group: Group)}
    <Command.Group value={`group:${group.id}`}>
        {#if group.heading !== ''}
            <Command.GroupHeading>
                {#snippet child({ props })}
                    <span {...props} class="heading">{group.heading}</span>
                {/snippet}
            </Command.GroupHeading>
        {/if}
        <Command.GroupItems>
            {#each group.rows as one (one.id)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render row(group.id, one)}
            {/each}
        </Command.GroupItems>
    </Command.Group>
{/snippet}

{#snippet row(group: string, one: Row)}
    <Command.Item
        value={`${group}\n${one.id}`}
        disabled={one.disabled === true}
        onSelect={one.pick}
    >
        {#snippet child({ props })}
            <div {...props} class="item" title={one.title}>
                <span class="check" aria-hidden="true">
                    {#if one.ticked}
                        <Glyph name={t('focus.filter_check_glyph')} />
                    {/if}
                </span>
                <span class="label">{one.label}</span>
            </div>
        {/snippet}
    </Command.Item>
{/snippet}

<span class="anchor" bind:this={anchor}>
    <ToolButton
        bare
        label={t('focus.filter')}
        glyph={t('focus.filter_glyph')}
        title={t('focus.filter_tip')}
        pressed={hides}
        expanded={open}
        onclick={() => (open = !open)}
    />
</span>
<Popover.Root bind:open>
    <Popover.Portal>
        <Popover.Content
            customAnchor={anchor}
            side="bottom"
            align="end"
            sideOffset={4}
            collisionPadding={8}
            onInteractOutside={outside}
            onOpenAutoFocus={opened}
            onCloseAutoFocus={closed}
        >
            {#snippet child({ wrapperProps, props })}
                <div {...wrapperProps}>
                    <FloatingList label={t('focus.filter')} list={props} shape="grouped">
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render body()}
                    </FloatingList>
                </div>
            {/snippet}
        </Popover.Content>
    </Popover.Portal>
</Popover.Root>

<style>
    .anchor {
        display: inline-flex;
    }

    .values {
        display: flex;
        flex-direction: column;
    }

    /* A group's heading, as a menu's group heading is drawn. */
    .heading {
        display: block;
        padding: 6px 6px 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .item[data-selected] {
        background: var(--chip);
    }

    /* A row Mine only cannot apply is drawn muted, its tip saying why. */
    .item[data-disabled] {
        color: var(--muted-txt, var(--muted));
    }

    .label {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .check {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 1em;
        height: 1em;
    }
</style>
