<script module lang="ts">
    /** One tab: what it is called, what it is drawn with, and the id the callbacks name it by. */
    export type Tab = {
        id: string;
        label: string;
        /** A glyph name, or nothing for a tab that is drawn with its label alone. */
        glyph?: string;
        /** What the tooltip says, when it is not the label: a page tab names its shortcut. */
        hint?: string;
        /** Live text drawn after the label; an empty string draws no count pill. */
        badge?: string;
        /** A hue name from state/tones.ts; absent uses the accent pair. */
        badgeTone?: string;
        /** Hover text shared by the count badge and its split strip. */
        badgeTitle?: string;
        /** Coloured counts after the badge, with each colour already resolved to a theme hue. */
        cells?: { count: number; color: string; label: string }[];
    };

    /**
     * Where a tab dropped at `x` would be inserted, given the midpoint of every tab in the strip in
     * the same coordinates: before the first tab whose middle the pointer has not passed, and at the
     * end when it has passed them all. The midpoints are what a strip measures; the arithmetic is
     * here so it can be checked without a pointer.
     */
    export function insertionIndex(midpoints: number[], x: number): number {
        const found = midpoints.findIndex((middle) => x < middle);
        return found < 0 ? midpoints.length : found;
    }
</script>

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

    import type { Snippet } from 'svelte';
    import Glyph from './Glyph.svelte';
    import Tooltip from './Tooltip.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        tabs: Tab[];
        /** The id of the tab that is showing. */
        active: string;
        onselect: (id: string) => void;
        onclose: (id: string) => void;
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

<!-- svelte-ignore a11y_no_static_element_interactions the two handlers report where a dragged tab
     would be inserted and do nothing else; the strip is not a control and takes no focus. They sit
     on the wrapper rather than on the tab list, since a tablist with handlers on it is a widget
     that must take focus, and this one is still only a list of buttons. -->
<div class="strip" onpointermove={over} onpointerleave={out}>
    <div class="tabs" role="tablist">
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
                        role="tab"
                        aria-selected={tab.id === active}
                        data-drag-handle={onpointerdown === undefined ? undefined : ''}
                        onclick={() => onselect(tab.id)}
                        onpointerdown={(event) => down(tab.id, event)}
                    >
                        {#if tab.glyph !== undefined}
                            <Glyph name={tab.glyph} />
                        {/if}
                        <span class="label">{tab.label}</span>
                        {#if tab.badge !== undefined && tab.badge !== ''}
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
    {#if menu !== undefined}
        <div class="opener">{@render menu()}</div>
    {/if}
</div>

<style>
    .strip {
        display: flex;
        align-items: stretch;
        background: var(--bg);
        border-bottom: 1px solid var(--line);
    }

    .tabs {
        display: flex;
        align-items: stretch;
        gap: 2px;
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
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
