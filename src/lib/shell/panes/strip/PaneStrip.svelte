<script lang="ts">
    // Layer 3, shell. The top row of one pane (strip-shape.ts), drawn under the two settings of
    // config/defaults/appearance.yml: the tab strip of every tab (`show_tabs: multiple`) or
    // of the active tab alone (`single`), or with `none` no row but a title row naming the active
    // tab while the pane is locked. The actions are the Split Right button, the lock mark of a
    // locked pane, and the pane menu's `...` opener; `editor_actions: hidden` leaves out the first
    // and the last, and a locked pane keeps its mark whatever either setting says, since the mark
    // is what unlocks the group. Under `show_tabs: none` with `editor_actions: strip` the first and
    // the last go up to the window's title bar strip: the pane that leads the window (`lead`) hands
    // them up (shell/titlebar/strip-actions.svelte.ts), and no pane draws them in its own head. A
    // page in a browser has no window strip, so there every pane draws them in a title row. With
    // `wrap_tabs` and `show_tabs: multiple` the tabs wrap onto rows.
    //
    // The path of the active file tab is a breadcrumb: under the strip, or, when the strip shows
    // the active tab alone, in the strip's own row beside the tab. After the file it goes on with
    // the symbols that hold the caret, when a language server has answered the file's symbols, each
    // with its kind's icon. The file tab's own actions
    // (Save, Revert File, the star, Open in Program, Open Preview, Open Preview to the Side, Open
    // Source and Toggle Blame, handed in as `barActions`) stand at the right end of that same bar,
    // whole, while the path is cut from the left when the two do not fit. A tab naming no file
    // draws no path, a file tab that hands up actions draws the bar for them alone, as a HEAD tab
    // does, whose root is a repository's folder and not a served root, and a tab none of whose
    // actions applies hands up none, so with no path it draws no bar.
    //
    // A pane whose row is hidden (`hidden`, Hide Tab Row of the pane menu) draws the row and its
    // path bar out of sight, so the view fills the pane from its top, and draws them again over the
    // top of the view, the view keeping its size, while the pointer is in the band along the pane's
    // top edge or over the row, while a menu opened from the row or its path bar is open, while the
    // keyboard brought the focus into the row, and while a tab of the pane is dragged. The row
    // stays mounted and in the focus order, so its stop and its handlers stay. A pane whose row is
    // `none` hides and shows its path bar alone. The box the hidden top covers, the band or the
    // shown row, is marked `data-pane-top`, so the frame layer clips a frame of the pane's view
    // below it (shell/frames/FrameLayer.svelte).
    //
    // It draws and reports, and draws the right-click menu on its row, so it knows while that menu
    // is open, and provides the watch every other menu in the row and the path bar reports its
    // list to (ui/menu/menu-watch.ts). Closing, selecting, the drag, every menu item and what a
    // pick does are the pane's, which hands them in.
    //
    // The strip's scroll controls, the split-right button and its `...` opener on
    // `ui.pane_more_glyph` are `bare` ToolButton and Menu boxes of `--tab-action`, the same in a
    // terminal palette; `ui.pane_menu_glyph` stays the glyph of the Sessions view's row menus. The
    // Tab Bar and Editor Actions Position submenus of the strip menu write `show_tabs` and
    // `editor_actions`.

    import type { Snippet } from 'svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { provideMenuWatch } from '$lib/ui/menu/menu-watch';
    import Breadcrumb from '$lib/ui/tabs/Breadcrumb.svelte';
    import type { Crumb } from './tab-crumbs';
    import { colourOf } from '$lib/ui/controls/editor/kit/theme/colours';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Tabs from '$lib/ui/tabs/Tabs.svelte';
    import type { Tab } from '$lib/ui/tabs/tab-strip';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { StripShape } from './strip-shape';
    import { useStripActions } from '$lib/shell/titlebar/strip-actions.svelte';
    import { stripWraps } from '$lib/ui/tabs/tab-strip';
    import { showTabs, wrapTabs } from '$lib/state/shared/words/appearance';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Every tab of the pane, in order; the settings decide which are drawn. */
        tabs: Tab[];
        active: string;
        /** What the row draws under the two settings (strip-shape.ts), as the pane read it. */
        shape: StripShape;
        /** Whether the pane hides its row and path bar, which it does only while it draws one. */
        hidden: boolean;
        /**
         * The items of the right-click menu on the row, the strip's or a tab's, read from the
         * right-click (strip/tab-menu-state.svelte.ts).
         */
        menuRead: (event: MouseEvent) => MenuItem[];
        /** A pick of that menu. */
        onmenupick: (id: string, event: MouseEvent) => void;
        /** Whether a tab of the pane is being dragged, which keeps a hidden row shown. */
        carrying: boolean;
        /** Whether Split Right is offered: the pane holds a tab and is no float. */
        canSplit: boolean;
        /** The pane menu's items. */
        items: MenuItem[];
        /** The active file tab's own actions, drawn at the right end of the breadcrumb bar. */
        barActions?: Snippet;
        /** The segments of the active tab's path, or none. */
        crumbs?: Crumb[];
        oncrumb?: (crumb: Crumb) => void;
        /** The pin of a pinned tab was pressed. */
        onunpin?: (id: string) => void;
        /** Where a dragged tab would land, in the index of `tabs`. */
        dropIndex: number | null;
        focused: boolean;
        /**
         * Whether this pane leads the window: the active pane of the page the reader is in, or the
         * one pane of a float's window. Its actions are the ones the window strip draws.
         */
        lead?: boolean;
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
        shape,
        hidden,
        menuRead,
        onmenupick,
        carrying,
        canSplit,
        items,
        barActions,
        crumbs = [],
        oncrumb,
        onunpin,
        dropIndex,
        focused,
        lead = false,
        onselect,
        onclose,
        ondblclick,
        onpointerdown,
        onhoverindex,
        onsplit,
        onunlock,
        onpick
    }: Props = $props();

    /**
     * The window strip the actions go up to, when the settings send them there; a window that
     * draws no strip, a page in a browser, provides none.
     */
    const strip = useStripActions();

    /** The pane's top, whose focus the row keeps while the keyboard is in it. */
    let top: HTMLDivElement | undefined = $state();
    /** Whether the pointer is in the band along the pane's top edge or over the shown row. */
    let pointed = $state(false);
    /**
     * How many menus opened from the row or its path bar are open: the `...` list, and a menu a
     * view hands into the path bar's actions, each reporting to the watch the strip provides
     * (ui/menu/menu-watch.ts).
     */
    let opened = $state(0);
    /** Whether the right-click menu on the row is open. */
    let menuOpen = $state(false);
    /** Whether the focus is in the row and came there by a key. */
    let keyed = $state(false);

    provideMenuWatch({
        opened: () => (opened += 1),
        closed: () => (opened -= 1)
    });

    /**
     * Whether a hidden row shows: the pointer at the edge or over the row, a menu opened from the
     * row or its path bar open, the keyboard's focus in the row, or a tab of the pane dragged.
     */
    const showing = $derived(pointed || menuOpen || opened > 0 || keyed || carrying);

    /**
     * The focus coming into the row keeps it shown when the keyboard brought it, which the
     * browser's focus ring answers: a Tab, an arrow key, or a closing menu giving the focus back
     * after a pick by key, and never a press or a menu giving it back after a pick by the pointer.
     */
    function focusIn(event: FocusEvent): void {
        keyed = event.target instanceof Element && event.target.matches(':focus-visible');
    }

    /** The focus leaving the row for anything outside it. */
    function focusOut(event: FocusEvent): void {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || top?.contains(next) !== true) keyed = false;
    }

    $effect(() => {
        if (shape.up && lead && strip !== undefined) return strip.hand(heading);
    });
    const wrap = $derived(stripWraps(wrapTabs(), showTabs()));
    /** Whether the bar has anything to draw: a path, or the actions of the file tab. */
    const barred = $derived(crumbs.length > 0 || barActions !== undefined);
    const beside = $derived(showTabs() === 'single' && barred);
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

<!-- The pane's top: in place in the pane's column, or, while the pane hides it, over the top of the
     view. Its handlers only follow the pointer and the focus that show a hidden row. -->
<ContextMenu label={t('ui.pane_menu')} read={menuRead} onpick={onmenupick} bind:open={menuOpen}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="top"
        class:hidden
        class:shown={hidden && showing}
        bind:this={top}
        onpointerenter={() => (pointed = true)}
        onpointerleave={() => (pointed = false)}
        onfocusin={focusIn}
        onfocusout={focusOut}
    >
        {#if hidden}
            <div class="edge" data-pane-top={showing ? undefined : ''}></div>
        {/if}
        <div class="rows" data-pane-top={hidden && showing ? '' : undefined}>
            {#if shape.row === 'tabs'}
                <Tabs
                    tabs={shape.tabs}
                    {active}
                    dropIndex={markAt}
                    {onselect}
                    {onclose}
                    {onunpin}
                    {ondblclick}
                    {onpointerdown}
                    onhoverindex={onhoverindex === undefined
                        ? undefined
                        : (i: number | null) => onhoverindex(inAll(i))}
                    menu={actions}
                    beside={beside ? path : undefined}
                    {wrap}
                    {focused}
                />
            {:else if shape.row === 'title'}
                <div class="title" class:unfocused={!focused}>
                    <span class="name">{title}</span>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    <div class="actions">{@render actions()}</div>
                </div>
            {/if}
            {#if barred && !beside}
                <div class="path">
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render path()}
                </div>
            {/if}
        </div>
    </div>
</ContextMenu>

{#snippet path()}
    {#if crumbs.length > 0}
        <Breadcrumb
            label={t('ui.tab_path')}
            segments={crumbs.map((crumb, at) => ({
                id: String(at),
                label: crumb.label,
                glyph: crumb.symbol?.glyph,
                glyphStyle:
                    crumb.symbol === undefined
                        ? undefined
                        : `color: ${colourOf(crumb.symbol.colour)}`
            }))}
            onselect={(id: string) => oncrumb?.(crumbs[Number(id)])}
        />
    {/if}
    {#if barActions !== undefined}
        <div class="bar-actions">
            {@render barActions()}
        </div>
    {/if}
{/snippet}

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
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render heading()}
    {/if}
{/snippet}

<!-- The pane's own actions, drawn in its head or handed up to the window strip. -->
{#snippet heading()}
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
{/snippet}

<style>
    /* In place, the top and its rows take no box of their own, so the row and the path bar are laid
       out in the pane's column as if the two boxes were not there. */
    .top,
    .rows {
        display: contents;
    }

    /* A hidden top takes no height, so the view fills the pane from its top, and stands over the
       view: the band along the pane's top edge hears the pointer, and the row with its path bar is
       moved up out of sight, the pane's box clipping it, until it shows. Its depth puts it over the
       view's own depths, the pane's body being a stacking context of its own while the row is
       hidden (PaneView.svelte). */
    .top.hidden {
        display: block;
        position: relative;
        flex: none;
        height: 0;
        z-index: 1;
    }

    /* The band is 4 px high, the order of a sash, so it takes no click meant for the view's first
       line. */
    .top.hidden .edge {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
    }

    /* The row shown over a view stands on the pane's own surface, so it reads over the view and
       over a wallpaper. */
    .top.hidden .rows {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        background: var(--panel);
        transform: translateY(-100%);
    }

    .top.hidden.shown .rows {
        transform: none;
    }

    /* The path under the strip: a row of its own, on the surface of the view it heads. */
    .path {
        display: flex;
        align-items: center;
        flex: none;
        min-width: 0;
        background: var(--panel);
        border-bottom: 1px solid var(--line);
    }

    /* Over a wallpaper the row stands over the picture, outside the view's box, so it is read off
       a surface of its own; inside a surface already (a free float's fill) it paints nothing, and
       so does the title row of `show_tabs: none`. */
    :global(body.wall) .path {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .path,
    :global(body.wall [data-surface]) .title {
        background: transparent;
        backdrop-filter: none;
    }

    /* The file tab's actions stand whole at the right end of the bar, in the row's height. */
    .bar-actions {
        display: flex;
        align-items: center;
        flex: none;
        height: var(--crumb-row);
        margin-left: auto;
        padding: 0 var(--tab-action-gap);
    }

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
