<script lang="ts">
    // Layer 3, primitive. A strip of tabs over one pane. It knows nothing about views, instances or
    // the layout tree: the caller passes labels and ids and is called back with an id, which is why
    // the same strip serves a pane of views and anything else with tabs.
    //
    // A tab is a button and its close control is a second button beside it, since a button inside a
    // button is not valid HTML. The pair sits in a presentation wrapper so the tab list still has
    // its tabs as its only meaningful children.
    //
    // The strip is one stop of the browser's focus order: one tab carries tabindex 0 and everything
    // else in the strip carries -1, so a reader tabs past the whole strip in one press. The menu
    // the caller puts at the right keeps its own stop, being a control of the pane rather than of
    // the strip.
    //
    // The strip takes part in a drag without knowing what a drag is: a press on a tab face is
    // reported with the point it happened at, the pointer moving over the strip is reported as the
    // index a drop would land at, and `dropIndex` draws the mark at an index the caller chose.
    //
    // Whole tabs at the left edge come from the scroll controls, which jump to the next tab start,
    // and from a tab becoming the shown one, being pressed, or being crossed or hidden by a change of
    // width, which brings it in whole. A wheel or trackpad scrolls the strip freely and leaves it
    // where it stops. The strip's end is the browser's largest offset, so a control press or a
    // reveal there may rest short of a tab start. How it scrolls is ui/tab-scroll.svelte.ts.

    import { type Tab, insertionIndex } from '$lib/ui/tab-strip';
    import { createTabScroll } from '$lib/ui/tab-scroll.svelte';
    import { heldStop, nextStop } from '$lib/ui/roving';
    import { type Snippet } from 'svelte';
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
    /** The tab buttons themselves, in the same order, which are what the arrow keys carry focus between. */
    let heads: (HTMLButtonElement | undefined | null)[] = $state([]);
    let strip: HTMLDivElement | undefined = $state();
    let opener: HTMLDivElement | undefined = $state();
    let scroller: HTMLDivElement | undefined = $state();

    /**
     * The tab a Delete asked to close, with the ring it asked from. The caller may put a question in
     * front of the close, so the keyboard is carried only once the tab has actually gone; until then
     * it belongs to whatever is asking, and a close the reader refuses leaves the focus where the
     * question left it.
     */
    let asked: { id: string; ring: string[] } | null = null;

    /**
     * The tab the strip's one stop sits on: the tab the arrows last carried the focus to, and the
     * showing tab whenever that changes, so selecting a tab, or a change from anywhere else, brings
     * the stop back to what the reader is looking at. A stop naming a tab that has gone falls back
     * to the showing one.
     */
    let stopped = $derived(active);
    const stop = $derived(tabs.some((tab) => tab.id === stopped) ? stopped : active);

    const scrolling = createTabScroll({
        list: () => scroller,
        strip: () => strip,
        opener: () => opener,
        faces: () => faces.slice(0, tabs.length),
        shown: () => tabs.findIndex((tab) => tab.id === active)
    });
    const scroll = $derived(scrolling.state());

    $effect(() => {
        const node = scroller;
        const watched = faces.slice(0, tabs.length);
        if (node === undefined || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(scrolling.resized);
        observer.observe(node);
        if (strip !== undefined) observer.observe(strip);
        if (opener !== undefined) observer.observe(opener);
        for (const face of watched) if (face !== undefined && face !== null) observer.observe(face);
        queueMicrotask(scrolling.scrolled);
        return () => observer.disconnect();
    });

    $effect(() => {
        const selected = active;
        const index = tabs.findIndex((tab) => tab.id === selected);
        queueMicrotask(() => scrolling.reveal(index));
    });

    // A tab closed by Delete unmounts its button under the keyboard, which would drop the focus to
    // the document. The tab that now sits where it sat takes the stop and the keyboard, by the one
    // rule ui/roving.ts states for a ring that has lost a control; a pane whose last tab went is
    // gone with it, and where the keyboard lands is then the tree's answer.
    $effect(() => {
        const ring = tabs.map((tab) => tab.id);
        const held = asked;
        if (held === null || ring.includes(held.id)) return;
        asked = null;
        const moved = heldStop(held.ring, ring, held.id);
        if (moved === '') return;
        stopped = moved;
        recoverStop(ring.indexOf(moved));
    });

    /**
     * Take the keyboard for one tab, and only where nothing else holds it: the button that went is
     * left holding the focus until the browser hands it to the document, so both that button and the
     * document count as nothing, and a dialog or a field that has taken it keeps it.
     */
    function recoverStop(index: number): void {
        queueMicrotask(() => {
            const at = document.activeElement;
            if (at !== null && at !== document.body && at.isConnected) return;
            heads[index]?.focus();
        });
    }

    /**
     * A press on a tab face: the caller selects it, and the strip brings it in whole, which a tab
     * already showing and pressed where the far edge crosses it needs, since its selection changes
     * nothing the reveal on a change of the showing tab would answer.
     */
    function press(index: number): void {
        onselect(tabs[index].id);
        queueMicrotask(() => scrolling.reveal(index));
    }

    function down(id: string, event: PointerEvent): void {
        onpointerdown?.(id, { x: event.clientX, y: event.clientY });
    }

    /**
     * The keyboard on one tab. The strip is one stop of the browser's focus order, so the arrow
     * keys are what reach the other tabs: they carry the stop with the focus and bring the tab they
     * land on into view, since a strip that scrolls can hold it off screen. Delete closes the tab
     * under the focus through the same `onclose` the close control calls, so whatever guard the
     * caller puts in front of closing a tab is taken by both, and the effect above carries the
     * keyboard once the tab has gone. A key held with a modifier belongs to whatever else wants it,
     * the shell's page moves above all, so it is left alone.
     */
    function keys(event: KeyboardEvent, index: number): void {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const next = nextStop(event.key, index, tabs.length, 'row');
        if (next !== null) {
            event.preventDefault();
            stopped = tabs[next].id;
            heads[next]?.focus({ preventScroll: true });
            scrolling.reveal(next);
            return;
        }
        if (event.key !== 'Delete') return;
        event.preventDefault();
        asked = { id: tabs[index].id, ring: tabs.map((tab) => tab.id) };
        onclose(tabs[index].id);
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

<!-- The two pointer handlers report where a dragged tab would be inserted and do nothing else. They
     sit on the wrapper rather than on the tab list, so the list holds the keyboard alone. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="strip" bind:this={strip} onpointermove={over} onpointerleave={out}>
    <!-- The scroll controls are the pointer's way along an overflowing strip and take no stop of
         their own: the arrow keys reach every tab whether it is on screen or not, and bring the one
         they land on into view, so a keyboard that had to scroll first would be doing it twice. -->
    <div class="scroll-control scroll-left" hidden={!scroll.overflowing}>
        <ToolButton
            label={t('ui.tabs_scroll_left')}
            glyph="arrow_to"
            compact
            tabindex={-1}
            disabled={scroll.atStart}
            onclick={() => scrolling.step(-1)}
        />
    </div>
    <!-- The wheel translates vertical wheel travel into the horizontal scrolling this strip already
         owns. -->
    <div
        class="tabs"
        role="tablist"
        bind:this={scroller}
        onscroll={scrolling.scrolled}
        onwheel={scrolling.wheel}
    >
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
                        bind:this={heads[index]}
                        tabindex={tab.id === stop ? 0 : -1}
                        onclick={() => press(index)}
                        ondblclick={() => ondblclick?.(tab.id)}
                        onkeydown={(event) => keys(event, index)}
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
                        tabindex={-1}
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
            tabindex={-1}
            disabled={scroll.atEnd}
            onclick={() => scrolling.step(1)}
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
