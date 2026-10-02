<script lang="ts">
    // Layer 3, shell. The top row of one pane, drawn under the two settings of
    // config/appearance.yml (strip-shape.ts): the tab strip of every tab (`show_tabs: multiple`) or
    // of the active tab alone (`single`), a title row naming the active tab above the actions
    // (`none`), or no row at all. The actions are the Split Right button, the lock mark of a locked
    // pane, and the pane menu's `...` opener; `editor_actions: hidden` leaves out the first and the
    // last, and a locked pane keeps its mark whatever either setting says, since the mark is what
    // unlocks the group.
    //
    // It draws and reports. Closing, selecting, the drag and every menu item are the pane's, which
    // hands them in.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Tabs from '$lib/ui/tabs/Tabs.svelte';
    import type { Tab } from '$lib/ui/tabs/tab-strip';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { stripShape } from './strip-shape';
    import { editorActions, showTabs } from '$lib/state/shared/words/appearance';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Every tab of the pane, in order; the settings decide which are drawn. */
        tabs: Tab[];
        active: string;
        /** Whether the pane is a locked group. */
        locked: boolean;
        /** Whether Split Right is offered: the pane holds a tab and is no float. */
        canSplit: boolean;
        /** The pane menu's items. */
        items: MenuItem[];
        /** Where a dragged tab would land, in the index of `tabs`. */
        dropIndex: number | null;
        focused: boolean;
        onselect: (id: string) => void;
        onclose: (id: string) => void;
        ondblclick: (id: string) => void;
        onpointerdown: (id: string, point: { x: number; y: number }) => void;
        /** The pointer moved over the strip during a drag; absent while nothing is dragged. */
        onhoverindex?: (index: number | null) => void;
        onsplit: () => void;
        onunlock: () => void;
        onpick: (id: string) => void;
    };

    const {
        tabs,
        active,
        locked,
        canSplit,
        items,
        dropIndex,
        focused,
        onselect,
        onclose,
        ondblclick,
        onpointerdown,
        onhoverindex,
        onsplit,
        onunlock,
        onpick
    }: Props = $props();

    const shape = $derived(stripShape(showTabs(), editorActions(), tabs, active, locked));
    const place = $derived(tabs.findIndex((tab) => tab.id === active));
    const title = $derived(tabs.find((tab) => tab.id === active)?.label ?? '');

    /**
     * An index of the tabs drawn, in the index of all the tabs. Under `single` the strip draws the
     * active tab alone, so before it is the tab's own place and after it is the place beyond.
     */
    function inAll(index: number | null): number | null {
        if (index === null || shape.tabs.length === tabs.length || place < 0) return index;
        return index === 0 ? place : place + 1;
    }

    /** The mark's index among the tabs drawn: the inverse of `inAll`. */
    const markAt = $derived(
        dropIndex === null || shape.tabs.length === tabs.length || place < 0
            ? dropIndex
            : dropIndex <= place
              ? 0
              : 1
    );
</script>

{#if shape.row === 'tabs'}
    <Tabs
        tabs={shape.tabs}
        {active}
        dropIndex={markAt}
        {onselect}
        {onclose}
        {ondblclick}
        {onpointerdown}
        onhoverindex={onhoverindex === undefined
            ? undefined
            : (i: number | null) => onhoverindex(inAll(i))}
        menu={actions}
        {focused}
    />
{:else if shape.row === 'title'}
    <div class="title" class:unfocused={!focused}>
        <span class="name">{title}</span>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        <div class="actions">{@render actions()}</div>
    </div>
{/if}

{#snippet actions()}
    {#if shape.lock}
        <ToolButton
            label={t('ui.strip_unlock')}
            glyph={t('ui.strip_lock_glyph')}
            compact
            bare
            tabindex={-1}
            onclick={onunlock}
        />
    {/if}
    {#if shape.actions}
        {#if canSplit}
            <ToolButton
                label={t('ui.split_right')}
                glyph={t('ui.split_right_glyph')}
                compact
                bare
                tabindex={-1}
                onclick={onsplit}
            />
        {/if}
        <Menu
            label={t('ui.pane_menu')}
            glyph={t('ui.pane_more_glyph')}
            compact
            bare
            placement="down"
            align="right"
            {items}
            {onpick}
        />
    {/if}
{/snippet}

<style>
    /* The row of `show_tabs: none`: the active tab's name at the left, the actions at the right,
       on the line a tab strip would stand on. */
    .title {
        display: flex;
        align-items: center;
        min-height: var(--tab-height);
        background: var(--bg);
        border-bottom: 1px solid var(--line);
        border-top: 1px solid var(--accent);
    }

    .title.unfocused {
        border-top-color: var(--line);
    }

    .name {
        flex: 1 1 auto;
        min-width: 0;
        padding: 0 var(--tab-action-gap);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-lg);
    }

    .actions {
        display: flex;
        align-items: center;
        gap: var(--tab-action-gap);
        flex: 0 0 auto;
        padding: 0 var(--tab-action-gap);
    }

    :global(body.wall) .title {
        background: color-mix(in srgb, var(--bg) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
