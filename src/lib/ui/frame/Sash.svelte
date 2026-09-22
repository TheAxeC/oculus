<script lang="ts">
    // Layer 3, primitive. The handle between two children of a split. It holds no layout and no
    // sizes: it reports how far the pointer moved since the last report and the caller decides what
    // that means. The pointer is captured on the way down, so a fast drag that leaves the handle
    // keeps resizing, which is the whole reason this is not a mousemove listener on the window.
    //
    // It is drawn as an editor's handle: nothing at rest, since what it parts already shows where
    // it parts; the accent line once the pointer has rested on it for `--sash-delay`, and at once
    // while it is dragged or holds the keyboard, where the line widens to `--sash-focus-line` in
    // place of the browser's focus ring. A pointer catches it past its own thickness on either
    // side, over the border of what sits there and never inside it, at every device pixel ratio, on
    // a layer that takes no room, so the thickness a split lays out is still SASH_PX.

    import { SASH_PX, STEP } from '$lib/ui/frame/sash-size';
    import { t } from '$lib/state/words/text';

    type Props = {
        /**
         * The direction of the split. A row of children is separated by a handle that moves
         * sideways.
         */
        dir: 'row' | 'col';
        /**
         * The share of the split held by the child before the handle, 0 to 1. It is read for
         * aria-valuenow and for nothing else: a focusable separator is a widget and must say where
         * it sits, and the handle itself never decides what a drag means.
         */
        share: number;
        /** The pointer's movement along the split's direction since the last call, in pixels. */
        onresize: (delta: number) => void;
        /** A double click asks for the split's children to go back to equal shares. */
        onreset: () => void;
    };

    let { dir, share, onresize, onreset }: Props = $props();

    let dragging = $state(false);
    let last = 0;

    const percent = $derived(Math.round(Math.min(1, Math.max(0, share)) * 100));

    function along(event: PointerEvent): number {
        return dir === 'row' ? event.clientX : event.clientY;
    }

    function down(event: PointerEvent): void {
        const handle = event.currentTarget;
        if (!(handle instanceof HTMLElement)) return;
        handle.setPointerCapture(event.pointerId);
        dragging = true;
        last = along(event);
        document.body.style.userSelect = 'none';
    }

    function move(event: PointerEvent): void {
        if (!dragging) return;
        const now = along(event);
        const delta = now - last;
        last = now;
        if (delta !== 0) onresize(delta);
    }

    function up(event: PointerEvent): void {
        if (!dragging) return;
        dragging = false;
        document.body.style.userSelect = '';
        const handle = event.currentTarget;
        if (handle instanceof HTMLElement && handle.hasPointerCapture(event.pointerId)) {
            handle.releasePointerCapture(event.pointerId);
        }
    }

    function key(event: KeyboardEvent): void {
        const back = dir === 'row' ? 'ArrowLeft' : 'ArrowUp';
        const forward = dir === 'row' ? 'ArrowRight' : 'ArrowDown';
        if (event.key !== back && event.key !== forward) return;
        event.preventDefault();
        onresize(event.key === back ? -STEP : STEP);
    }
</script>

<!-- This is the WAI-ARIA window splitter: a separator that takes focus is a widget and carries
     aria-valuenow, which is what the four aria attributes below are. aria-query models the role as
     structure only, so svelte cannot tell the focusable variant from the decorative one and warns
     on both. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
    class="sash {dir}"
    class:dragging
    role="separator"
    aria-orientation={dir === 'row' ? 'vertical' : 'horizontal'}
    aria-label={t('ui.sash')}
    aria-valuenow={percent}
    aria-valuemin={0}
    aria-valuemax={100}
    tabindex="0"
    style="flex: 0 0 {SASH_PX}px"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    ondblclick={onreset}
    onkeydown={key}
>
    <span class="line"></span>
</div>

<style>
    .sash {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        /* The handle is a pointer target, not a scroll target: without this a drag on a touch
           screen scrolls the page instead of resizing. */
        touch-action: none;
    }

    /* The reach: the handle's own box grown along the split's direction over the border on each
       side, by `--sash-reach-start` before it and `--sash-reach` after it (themes/tokens.css says
       why the two differ). */
    .sash::before {
        content: '';
        position: absolute;
    }

    .sash.row {
        cursor: col-resize;
    }

    .sash.row::before {
        top: 0;
        bottom: 0;
        left: calc(-1 * var(--sash-reach-start));
        right: calc(-1 * var(--sash-reach));
    }

    .sash.col {
        cursor: row-resize;
    }

    .sash.col::before {
        left: 0;
        right: 0;
        top: calc(-1 * var(--sash-reach-start));
        bottom: calc(-1 * var(--sash-reach));
    }

    .sash:focus-visible {
        outline: none;
    }

    /* Hidden at rest, and gone the moment the pointer leaves. */
    .line {
        display: block;
        background: transparent;
        transition: background-color 0s;
    }

    .row .line {
        width: var(--sash-line);
        height: 100%;
    }

    .col .line {
        height: var(--sash-line);
        width: 100%;
    }

    /* A resting pointer draws it after the delay: a change of colour that takes no time, only a
       wait. */
    .sash:hover .line {
        background: var(--accent);
        transition: background-color 0s var(--sash-delay);
    }

    /* A drag and the keyboard draw it at once, whether or not the pointer rests there. */
    .sash.dragging .line,
    .sash:focus-visible .line {
        background: var(--accent);
        transition: none;
    }

    .sash.row:focus-visible .line {
        width: var(--sash-focus-line);
    }

    .sash.col:focus-visible .line {
        height: var(--sash-focus-line);
    }
</style>
