<script lang="ts">
    // Layer 3, primitive. A strip of tabs over one pane. It knows nothing about views, instances or
    // the layout tree: the caller passes labels and ids and is called back with an id, which is why
    // the same strip serves a pane of views and anything else with tabs.
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
    // and from a tab becoming the shown one, being pressed, or being crossed or hidden by a change
    // of width, which brings it in whole. A wheel or trackpad scrolls the strip freely and leaves
    // it where it stops. The strip's end is the browser's largest offset, so a control press or a
    // reveal there may rest short of a tab start. How it scrolls is ui/tabs/tab-scroll.svelte.ts.
    //
    // A surface that blurs what is behind it is the stacking context of everything inside it, so
    // the strip carries a depth of its own wherever it blurs, over the pane body beside it, and a
    // menu opened from its right end is drawn over what the pane holds rather than under it.
    //
    // It is drawn as an editor's tab strip, every measure a token of themes/tokens.css: the surface
    // the strip sits on, the line under it with a gap where the shown tab heads it, the mark where
    // a dragged tab would land, and the scroll controls as bare icons, as the caller's buttons at
    // the right are. One tab's own face, marks and close control are ui/tabs/TabFace.svelte.

    import { type Tab, insertionIndex } from '$lib/ui/tabs/tab-strip';
    import { createTabScroll } from '$lib/ui/tabs/tab-scroll.svelte';
    import { heldStop, nextStop } from '$lib/ui/tree/roving';
    import { focusIsFree } from '$lib/ui/frame/quiet-focus';
    import { type Snippet } from 'svelte';
    import TabFace from './TabFace.svelte';
    import ToolButton from '../controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

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
        /**
         * The pointer moved over the strip, and a drop would land at this index; null on leaving.
         */
        onhoverindex?: (index: number | null) => void;
        /** Draw the insertion mark at this index. */
        dropIndex?: number | null;
        /** The caller's buttons at the right end, drawn `bare` to match the scroll controls. */
        menu?: Snippet;
        /**
         * Whether what the strip heads is the active one: only then is the shown tab's line accent.
         */
        focused?: boolean;
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
        menu,
        focused = true
    }: Props = $props();

    /**
     * One entry per tab, in order, so the strip can measure where the tabs are. A tab that goes
     * leaves null behind rather than shortening the array, so every read skips what is not there.
     */
    let faces: (HTMLElement | undefined | null)[] = $state([]);
    /**
     * The tab buttons themselves, in the same order, which are what the arrow keys carry focus
     * between.
     */
    let heads: (HTMLButtonElement | undefined | null)[] = $state([]);
    let strip: HTMLDivElement | undefined = $state();
    let opener: HTMLDivElement | undefined = $state();
    let scroller: HTMLDivElement | undefined = $state();

    /**
     * The tab a Delete asked to close, with the ring it asked from. The caller may put a question
     * in front of the close, so the keyboard is carried only once the tab has actually gone; until
     * then it belongs to whatever is asking, and a close the reader refuses leaves the focus where
     * the question left it.
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
    // rule ui/tree/roving.ts states for a ring that has lost a control; a pane whose last tab went
    // is gone with it, and where the keyboard lands is then the tree's answer.
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
     * left holding the focus until the browser hands it to the document, so both that button and
     * the document count as nothing, and a dialog or a field that has taken it keeps it.
     */
    function recoverStop(index: number): void {
        queueMicrotask(() => {
            if (!focusIsFree()) return;
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
</script>

<!-- The two pointer handlers report where a dragged tab would be inserted and do nothing else. They
     sit on the wrapper rather than on the tab list, so the list holds the keyboard alone. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="strip"
    class:unfocused={!focused}
    bind:this={strip}
    onpointermove={over}
    onpointerleave={out}
>
    <!-- The scroll controls are the pointer's way along an overflowing strip and take no stop of
         their own: the arrow keys reach every tab whether it is on screen or not, and bring the one
         they land on into view, so a keyboard that had to scroll first would be doing it twice. -->
    <div class="scroll-control scroll-left" hidden={!scroll.overflowing}>
        <ToolButton
            label={t('ui.tabs_scroll_left')}
            glyph="arrow_to"
            compact
            bare
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
            <TabFace
                {tab}
                current={tab.id === active}
                stop={tab.id === stop}
                handle={onpointerdown !== undefined}
                onselect={() => press(index)}
                ondblclick={() => ondblclick?.(tab.id)}
                onclose={() => onclose(tab.id)}
                onkeydown={(event: KeyboardEvent) => keys(event, index)}
                onpointerdown={(event: PointerEvent) => down(tab.id, event)}
                bind:face={faces[index]}
                bind:head={heads[index]}
            />
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
            bare
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
        min-height: var(--tab-height);
        background: var(--bg);
    }

    /* The strip is the pane's own top edge over a wallpaper: the shell's pane paints nothing behind
       it, so the picture reads through here too. The blur makes the strip the stacking context of
       every list opened inside it, so the strip takes a depth of its own: above the view's own
       blurred box in the pane body, which is drawn after it and would otherwise cover an open menu,
       and below the drag layer at 10. */
    :global(body.wall) .strip {
        position: relative;
        z-index: 1;
        background: color-mix(in srgb, var(--bg) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The tabs sit on the strip's foot, so a strip made taller at the right keeps them on its
       line. */
    .tabs {
        display: flex;
        align-items: flex-end;
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar {
        display: none;
    }

    /* The line under the strip is drawn by what sits in it, so the shown tab can leave a gap in it;
       this filler carries it past the last tab, growing into free room only. */
    .tabs::after {
        content: '';
        flex: 1 0 0;
        align-self: stretch;
        border-bottom: 1px solid var(--line);
    }

    .scroll-control,
    .opener {
        display: flex;
        align-items: center;
        gap: var(--tab-action-gap);
        flex: 0 0 auto;
        padding: 0 var(--tab-action-gap);
        border-bottom: 1px solid var(--line);
    }

    .scroll-control[hidden] {
        display: none;
    }

    .scroll-left :global(.glyph) {
        transform: rotate(180deg);
    }

    /* Where a dragged tab would land. It takes part in the strip's layout rather than floating over
       it, so the tabs part around it and the mark is never drawn over a label. */
    .mark {
        flex: 0 0 auto;
        width: 2px;
        align-self: stretch;
        background: var(--accent);
    }
</style>
