<script lang="ts">
    // Layer 3, primitive. A strip of tabs over one pane. It knows nothing about views, instances or
    // the layout tree: the caller passes labels and ids and is called back with an id, which is why
    // the same strip serves a pane of views and anything else with tabs.
    //
    // A tab is a button and its close control is a second button beside it, since a button inside a
    // button is not valid HTML. The pair sits in a presentation wrapper so the tab list still has
    // its tabs as its only meaningful children.
    //
    // The strip takes part in a drag without knowing what a drag is: a press on a tab face is
    // reported with the point it happened at, the pointer moving over the strip is reported as the
    // index a drop would land at, and `dropIndex` draws the mark at an index the caller chose.

    import {
        type Tab,
        type TabScrollState,
        horizontalWheelDelta,
        insertionIndex,
        tabScrollState
    } from '$lib/ui/tab-strip';
    import type { Snippet } from 'svelte';
    import Glyph from './Glyph.svelte';
    import ToolButton from './ToolButton.svelte';
    import Tooltip from './Tooltip.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        tabs: Tab[];
        /** The id of the tab that is showing. */
        active: string;
        onselect: (id: string) => void;
        onclose: (id: string) => void;
        /** A second press on a tab face, which is what keeps a preview tab. */
        ondblclick?: (id: string) => void;
        /** A pointer went down on a tab face, at this point in the viewport. */
        onpointerdown?: (id: string, point: { x: number; y: number }) => void;
        /** The pointer moved over the strip, and a drop would land at this index; null on leaving. */
        onhoverindex?: (index: number | null) => void;
        /** Draw the insertion mark at this index. */
        dropIndex?: number | null;
        /** A small opener at the right of the strip, for whatever the caller puts there. */
        menu?: Snippet;
    };

    let {
        tabs,
        active,
        onselect,
        onclose,
        ondblclick,
        onpointerdown,
        onhoverindex,
        dropIndex = null,
        menu
    }: Props = $props();

    /**
     * One entry per tab, in order, so the strip can measure where the tabs are. A tab that goes
     * leaves null behind rather than shortening the array, so every read skips what is not there.
     */
    let faces: (HTMLElement | undefined | null)[] = $state([]);
    let strip: HTMLDivElement | undefined = $state();
    let opener: HTMLDivElement | undefined = $state();
    let scroller: HTMLDivElement | undefined = $state();
    let scroll = $state<TabScrollState>({ overflowing: false, atStart: true, atEnd: true });

    function measureScroll(): void {
        // A measure queued before the strip unmounts finds the bindings null, not undefined.
        if (!scroller || !strip) return;
        const widthWithoutControls = strip.clientWidth - (opener?.offsetWidth ?? 0);
        scroll = tabScrollState(
            scroller.scrollWidth,
            scroller.clientWidth,
            scroller.scrollLeft,
            widthWithoutControls
        );
    }

    $effect(() => {
        const node = scroller;
        const watched = faces.slice(0, tabs.length);
        if (node === undefined || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measureScroll);
        observer.observe(node);
        if (strip !== undefined) observer.observe(strip);
        if (opener !== undefined) observer.observe(opener);
        for (const face of watched) if (face !== undefined && face !== null) observer.observe(face);
        queueMicrotask(measureScroll);
        return () => observer.disconnect();
    });

    $effect(() => {
        const selected = active;
        const index = tabs.findIndex((tab) => tab.id === selected);
        queueMicrotask(() => {
            faces[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            measureScroll();
        });
    });

    function scrollOne(direction: -1 | 1): void {
        if (scroller === undefined) return;
        const width = faces.find((face) => face !== undefined && face !== null)?.offsetWidth ?? 0;
        scroller.scrollBy({ left: direction * width, behavior: 'smooth' });
    }

    function wheel(event: WheelEvent): void {
        if (scroller === undefined || !scroll.overflowing) return;
        const delta = horizontalWheelDelta(event.deltaX, event.deltaY);
        if (delta === 0) return;
        event.preventDefault();
        scroller.scrollLeft += delta;
        measureScroll();
    }

    function down(id: string, event: PointerEvent): void {
        onpointerdown?.(id, { x: event.clientX, y: event.clientY });
    }

    function over(event: PointerEvent): void {
        if (onhoverindex === undefined) return;
        const midpoints: number[] = [];
        for (const face of faces.slice(0, tabs.length)) {
            if (face === undefined || face === null) continue;
            const rect = face.getBoundingClientRect();
            midpoints.push(rect.x + rect.width / 2);
        }
        onhoverindex(insertionIndex(midpoints, event.clientX));
    }

    function out(): void {
        onhoverindex?.(null);
    }

    /** The theme token pair for a count badge. */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--tab-badge-bg: var(--c-${tone}); --tab-badge-fg: var(--on-c-${tone})`;
    }

    /** The theme token pair for one configured split cell. */
    function cellStyle(color: string): string {
        return `--cell-bg: var(--c-${color}); --cell-fg: var(--on-c-${color})`;
    }
</script>

<!-- The two handlers report where a dragged tab would be inserted and do nothing else; the strip is
     not a control and takes no focus. They sit on the wrapper rather than on the tab list, since a
     tablist with handlers on it is a widget that must take focus, and this one is still only a list
     of buttons. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="strip" bind:this={strip} onpointermove={over} onpointerleave={out}>
    <div class="scroll-control scroll-left" hidden={!scroll.overflowing}>
        <ToolButton
            label={t('ui.tabs_scroll_left')}
            glyph="arrow_to"
            compact
            disabled={scroll.atStart}
            onclick={() => scrollOne(-1)}
        />
    </div>
    <!-- The wheel translates vertical wheel travel into the horizontal scrolling this strip already
         owns. -->
    <div class="tabs" role="tablist" bind:this={scroller} onscroll={measureScroll} onwheel={wheel}>
        {#each tabs as tab, index (tab.id)}
            {#if dropIndex === index}
                <span class="mark" aria-hidden="true"></span>
            {/if}
            <div
                class="tab"
                class:current={tab.id === active}
                role="presentation"
                bind:this={faces[index]}
            >
                <Tooltip text={tab.hint ?? tab.label} presentational>
                    <button
                        type="button"
                        class="face"
                        class:preview={tab.preview === true}
                        role="tab"
                        aria-selected={tab.id === active}
                        data-tab-preview={tab.preview === true ? '' : undefined}
                        data-drag-handle={onpointerdown === undefined ? undefined : ''}
                        onclick={() => onselect(tab.id)}
                        ondblclick={() => ondblclick?.(tab.id)}
                        onpointerdown={(event) => down(tab.id, event)}
                    >
                        {#if tab.glyph !== undefined}
                            <Glyph name={tab.glyph} />
                        {/if}
                        <span class="label">{tab.label}</span>
                        {#if (tab.badgeGlyph ?? '') !== ''}
                            <span
                                class="tab-badge"
                                style={badgeStyle(tab.badgeTone)}
                                title={tab.badgeTitle}
                                aria-hidden="true"
                            >
                                <Glyph name={tab.badgeGlyph ?? ''} />{tab.badge}
                            </span>
                        {:else if (tab.badge ?? '') !== ''}
                            <span
                                class="tab-badge"
                                style={badgeStyle(tab.badgeTone)}
                                title={tab.badgeTitle}
                                aria-hidden="true"
                            >
                                {tab.badge}
                            </span>
                        {/if}
                        {#if tab.cells !== undefined && tab.cells.length > 0}
                            <span class="cells" title={tab.badgeTitle} aria-hidden="true">
                                {#each tab.cells as cell (cell.label)}
                                    <span class="cell" style={cellStyle(cell.color)}>
                                        {cell.count}
                                    </span>
                                {/each}
                            </span>
                        {/if}
                    </button>
                </Tooltip>
                <Tooltip text={t('ui.close_tab')} presentational>
                    <button
                        type="button"
                        class="close"
                        aria-label={t('ui.close_tab')}
                        onclick={() => onclose(tab.id)}
                    >
                        <Glyph name={t('ui.close_glyph')} />
                    </button>
                </Tooltip>
            </div>
        {/each}
        {#if dropIndex !== null && dropIndex >= tabs.length}
            <span class="mark" aria-hidden="true"></span>
        {/if}
    </div>
    <div class="scroll-control" hidden={!scroll.overflowing}>
        <ToolButton
            label={t('ui.tabs_scroll_right')}
            glyph="arrow_to"
            compact
            disabled={scroll.atEnd}
            onclick={() => scrollOne(1)}
        />
    </div>
    {#if menu !== undefined}
        <div class="opener" bind:this={opener}>
            {@render menu()}
        </div>
    {/if}
</div>

<style>
    .strip {
        display: flex;
        align-items: stretch;
        background: var(--bg);
        border-bottom: 1px solid var(--line);
    }

    /* The strip is the pane's own top edge over a wallpaper: the shell's pane paints nothing behind it, so the picture reads through here too. */
    :global(body.wall) .strip {
        background: color-mix(in srgb, var(--bg) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .tabs {
        display: flex;
        align-items: stretch;
        gap: 2px;
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar {
        display: none;
    }

    .scroll-control {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        padding: 2px;
    }

    .scroll-control[hidden] {
        display: none;
    }

    .scroll-left :global(.glyph) {
        transform: rotate(180deg);
    }

    .opener {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        padding: 2px 4px;
    }

    .tab {
        display: flex;
        align-items: center;
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: var(--radius) var(--radius) 0 0;
        white-space: nowrap;
    }

    .tab.current {
        background: var(--panel);
        border-color: var(--line);
    }

    /* The current tab sits inside the strip, which is already translucent, so it paints nothing of
       its own: its border and the picture showing through it are what tell it apart. */
    :global(body.wall) .tab.current {
        background: transparent;
    }

    .tab-badge {
        display: inline-block;
        min-width: 16px;
        padding: 0 5px;
        border-radius: var(--radius-pill);
        background: var(--tab-badge-bg, var(--chip));
        color: var(--tab-badge-fg, var(--accent-txt, var(--accent)));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
        font-weight: 700;
        line-height: 16px;
        text-align: center;
    }

    .cells {
        display: inline-flex;
        overflow: hidden;
        border-radius: var(--radius-sm);
        font-family: var(--font-num);
        font-size: var(--fs-xxs);
        font-weight: 700;
    }

    .cell {
        padding: 1px 5px;
        background: var(--cell-bg);
        color: var(--cell-fg);
        line-height: 1.5;
    }

    /* Where a dragged tab would land. It takes part in the strip's layout rather than floating over
       it, so the tabs part around it and the mark is never drawn over a label. */
    .mark {
        flex: 0 0 auto;
        width: 2px;
        align-self: stretch;
        background: var(--accent);
    }

    .face,
    .close {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-lg);
        padding: 4px 6px;
        cursor: pointer;
    }

    .tab.current .face {
        color: var(--ink-txt, var(--ink));
    }

    /* The tab the next single click replaces. Italics rather than a colour of its own: it says the
       tab is provisional without taking a hue that stands for a status somewhere else. */
    .face.preview .label {
        font-style: italic;
    }

    .face:hover,
    .close:hover {
        color: var(--accent-txt, var(--accent));
    }

    .face:focus-visible,
    .close:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
</style>
