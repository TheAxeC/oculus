<script lang="ts">
    // Layer 3, primitive. One tab of a strip: the face, what the face carries, and the close
    // control beside it. It is given one tab and the callbacks that name it, so ui/tabs/Tabs.svelte
    // keeps the measuring, the scrolling and the keyboard while this keeps the drawing.
    //
    // The face is a button and the close control is a second button beside it, since a button
    // inside a button is not valid HTML. The pair sits in a presentation wrapper, so the strip's
    // tab list still has its tabs as its only meaningful children, and that wrapper is what the
    // strip measures: the caller binds it, and the face button too, which is what the arrow keys
    // carry the focus between.
    //
    // A pinned tab draws a pin where the close control stands, and a press on it unpins the tab: a
    // pinned tab is closed from the tab menu and kept by Close All, so the control that closes
    // would be the wrong one to leave under the pointer. A pinned tab holding unsaved text draws
    // the dot there until hovered, as an unpinned one does.
    //
    // It is drawn as an editor's tab, every measure a token of themes/tokens.css: one height with a
    // line down its right side; the shown tab on the surface it heads, over a gap in the line under
    // the strip, with an accent line along its top on a focused strip only; a close control on the
    // shown tab and under the pointer, keeping its room on every tab; and a tab holding unsaved
    // text showing a dot there until hovered, and named for it, since a dot says nothing to a
    // screen reader. On a strip that does not hold the focus the labels and the control are drawn
    // at half strength, as VS Code draws an editor group that is not the active one. A tab is never
    // wider than the strip: its label is cut with an ellipsis and its close control keeps its room.

    import { type Tab } from '$lib/ui/tabs/tab-strip';
    import Glyph from '../display/Glyph.svelte';
    import Tooltip from '../menu/Tooltip.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        tab: Tab;
        /** Whether this is the tab showing, which is what puts it on the surface it heads. */
        current: boolean;
        /** Whether this tab carries the strip's one stop of the browser's focus order. */
        stop: boolean;
        /** Whether a press on the face is reported, which is what marks the face a drag handle. */
        handle: boolean;
        onselect: () => void;
        ondblclick: () => void;
        onclose: () => void;
        /** The pin was pressed: the tab is unpinned. */
        onunpin: () => void;
        onkeydown: (event: KeyboardEvent) => void;
        onpointerdown: (event: PointerEvent) => void;
        /** The wrapper around the pair, which is the element the strip measures. */
        face?: HTMLElement | null;
        /** The face button, which the arrow keys carry the focus to. */
        head?: HTMLButtonElement | null;
    };

    let {
        tab,
        current,
        stop,
        handle,
        onselect,
        ondblclick,
        onclose,
        onunpin,
        onkeydown,
        onpointerdown,
        face = $bindable(),
        head = $bindable()
    }: Props = $props();

    /**
     * The theme token pair a count badge is drawn from, or nothing for a badge that takes the
     * accent. It is written here rather than beside the strip's arithmetic because the token names
     * are built from a hue, and tests/ui/theme/colours.test.ts reads a built token name through the
     * component that sets it.
     */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--tab-badge-bg: var(--c-${tone}); --tab-badge-fg: var(--on-c-${tone})`;
    }

    /** The theme token pair one configured split cell is drawn from, set on the same terms. */
    function cellStyle(color: string): string {
        return `--cell-bg: var(--c-${color}); --cell-fg: var(--on-c-${color})`;
    }
</script>

<div
    class="tab"
    class:current
    class:dirty={tab.dirty === true}
    class:pinned={tab.pinned === true}
    role="presentation"
    bind:this={face}
>
    <Tooltip text={tab.hint ?? tab.label} presentational>
        <button
            type="button"
            class="face"
            class:preview={tab.preview === true}
            role="tab"
            aria-selected={current}
            aria-label={tab.dirty === true ? t('ui.tab_unsaved', tab.label) : undefined}
            data-tab={tab.id}
            data-tab-preview={tab.preview === true ? '' : undefined}
            data-drag-handle={handle ? '' : undefined}
            bind:this={head}
            tabindex={stop ? 0 : -1}
            onclick={onselect}
            {ondblclick}
            {onkeydown}
            {onpointerdown}
        >
            {#if tab.glyph !== undefined}
                <span
                    class="mark"
                    style={tab.tint === undefined ? undefined : `color: var(${tab.tint})`}
                >
                    <Glyph name={tab.glyph} />
                </span>
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
    <Tooltip text={tab.pinned === true ? t('ui.tab_unpin') : t('ui.close_tab')} presentational>
        <button
            type="button"
            class="close"
            aria-label={tab.pinned === true ? t('ui.tab_unpin') : t('ui.close_tab')}
            tabindex={-1}
            onclick={tab.pinned === true ? onunpin : onclose}
        >
            {#if tab.dirty === true}
                <span class="dot">
                    <Glyph name={t('ui.dirty_glyph')} />
                </span>
            {/if}
            <span class="cross">
                <Glyph name={tab.pinned === true ? t('ui.pin_glyph') : t('ui.close_glyph')} />
            </span>
        </button>
    </Tooltip>
</div>

<style>
    .tab {
        display: flex;
        align-items: stretch;
        flex: 0 0 auto;
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
        height: var(--tab-height);
        border-top: var(--tab-accent-line) solid transparent;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        color: var(--tab-inactive-txt, var(--muted-txt, var(--muted)));
        white-space: nowrap;
    }

    .mark {
        display: contents;
    }

    /* The face gives way to the close control, which keeps its room whatever the tab is cut to. */
    .tab > :global(.tip:last-child) {
        flex: none;
    }

    .tab.current {
        background: var(--panel);
        border-top-color: var(--accent);
        border-bottom-color: var(--tab-active-border, transparent);
        color: var(--tab-active-txt, var(--ink-txt, var(--ink)));
    }

    /* The accent line along the top is the strip's answer to being the active one, so the strip is
       what carries that state and this reads it off the wrapper the tab sits in. */
    :global(.strip.unfocused) .tab.current {
        border-top-color: var(--line);
    }

    /* The current tab sits inside the strip, which is already translucent, so it paints nothing of
       its own: its borders and the picture showing through it are what tell it apart. */
    :global(body.wall) .tab.current {
        background: transparent;
    }

    .tab-badge {
        display: inline-block;
        min-width: var(--tab-badge-min);
        padding: 0 var(--tab-badge-pad);
        border-radius: var(--radius-pill);
        background: var(--tab-badge-bg, var(--chip));
        color: var(--tab-badge-fg, var(--accent-txt, var(--accent)));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
        font-weight: 700;
        line-height: var(--tab-badge-line);
        text-align: center;
    }

    .cells {
        display: inline-flex;
        overflow: hidden;
        border-radius: var(--radius-sm);
        font-family: var(--font-num);
        font-size: var(--fs-xs);
        font-weight: 700;
    }

    .cell {
        padding: 1px 5px;
        background: var(--cell-bg);
        color: var(--cell-fg);
        line-height: 1.5;
    }

    /* The label is VS Code's tab label: the workbench's 13px. */
    .face {
        display: flex;
        align-items: center;
        gap: var(--tab-icon-gap);
        min-width: 0;
        overflow: hidden;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        font-size: var(--fs-md);
        padding: 0 0 0 var(--tab-pad);
        cursor: pointer;
    }

    .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tab-badge,
    .cells {
        flex: none;
    }

    /* Seen only on the shown tab, under the pointer and as the unsaved dot. It takes no stop, so it
       has no keyboard look; Delete on the tab is the keyboard's close. */
    .close {
        display: flex;
        align-items: center;
        align-self: center;
        justify-content: center;
        box-sizing: border-box;
        width: var(--tab-close);
        height: var(--tab-close);
        margin: 0 calc((var(--tab-actions) - var(--tab-close)) / 2);
        padding: 0;
        border: none;
        border-radius: var(--radius-sm);
        background: none;
        color: inherit;
        font: inherit;
        font-size: var(--fs-xl);
        cursor: pointer;
        opacity: 0;
    }

    .tab.current .close,
    .tab.dirty .close,
    .tab.pinned .close,
    .tab:hover .close {
        opacity: 1;
    }

    /* A strip that does not hold the focus draws the control at half strength where it shows, and
       its labels the same. */
    :global(.strip.unfocused) .tab.current .close,
    :global(.strip.unfocused) .tab.dirty .close,
    :global(.strip.unfocused) .tab.pinned .close,
    :global(.strip.unfocused) .tab:hover .close {
        opacity: 0.5;
    }

    :global(.strip.unfocused) .label {
        opacity: 0.5;
    }

    .close:hover {
        background: var(--chip);
    }

    .dot,
    .cross {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* The dot is centred on the cross's box at any icon size, and its icon, larger than the
       control, takes no press. It shows on a tab holding unsaved text until the pointer is over the
       tab. */
    .dot {
        position: relative;
        display: none;
        width: 1em;
        height: 1em;
    }

    .close .dot :global(svg) {
        position: absolute;
        top: 50%;
        left: 50%;
        width: var(--tab-dot-size);
        height: var(--tab-dot-size);
        fill: currentColor;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    .tab.dirty:not(:hover) .dot {
        display: flex;
    }

    .tab.dirty:not(:hover) .cross {
        display: none;
    }

    /* The tab the next single click replaces. Italics rather than a colour of its own: it says the
       tab is provisional without taking a hue that stands for a status somewhere else. */
    .face.preview .label {
        font-style: italic;
    }

    .face:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
