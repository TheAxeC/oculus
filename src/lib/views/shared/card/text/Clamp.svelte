<script lang="ts">
    // Layer 3, shared view. A card's long description cut to a few lines, with the control that
    // opens it whole and the one that cuts it again. The project card and the collection entry card
    // draw it the same way, so it lives here once.
    //
    // Whether it is open is the caller's, kept in the view instance's state, so a tab switch or a
    // reload keeps it. Whether the text is longer than the clamp is measured, since only the page
    // knows the card's width: the text's whole height against its own line height, with the gap
    // between its blocks off in both states so a text that fits is not called long when it is open.
    // Where the cut ends is measured in the same window: every line and every element drawn whole
    // or not at all gives a box, and the cut ends at the last one that fits (../card-layout.ts's
    // clampCutHeight), so no line, formula, table row, code block or image is sliced above the
    // control, except where no box fits whole, which keeps the cut at four lines. Both are read
    // again when the words change, and when the contents change size, which the resize observer
    // watches on an element inside the box since a cut box keeps its height when an image loads or
    // a font swaps; a measurement that lands after the component is gone is dropped
    // (../card-layout.ts's measureGate). A server rendering measures nothing and so draws no
    // control; the browser draws one once it has measured a text that does not fit.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        CLAMP_LINES,
        clampControl,
        clampCutHeight,
        measureGate,
        overflowsClamp,
        type ClampBox
    } from '../card-layout';

    type Props = {
        /** Whether the whole text is drawn. */
        open: boolean;
        /** Open or cut the text, which the caller writes to the instance. */
        ontoggle: () => void;
        /** The text, which may hold blocks (FieldMarkdown.svelte beside this file). */
        children: Snippet;
    };

    let { open, ontoggle, children }: Props = $props();

    /**
     * The elements drawn whole or not at all: a display formula, each piece of a formula on a line
     * of words (a long one wraps between its pieces, and the formula's own box is shorter than its
     * tall parts), a code block, a table's row and an image.
     */
    const WHOLE = '.katex-display, .katex-base:not(.katex-display *), pre, tr, img';

    /**
     * What holds text that makes no line of its own: those elements, and KaTeX's copy of a formula
     * for screen readers, which `.katex` holds beside what is drawn.
     */
    const NO_LINE = '.katex, pre, tr';

    /**
     * Every box `node`'s text draws, in px from the top of the text. The box's scroll position is
     * added, so a box that focus has scrolled answers the same. A text rectangle is the font's
     * height and shorter than its line, so a line's box is the line height of the element the words
     * stand in, centred on the rectangle: four plain lines end at the clamp's height.
     */
    function drawnBoxes(node: HTMLElement): ClampBox[] {
        const origin = node.getBoundingClientRect().top - node.scrollTop;
        const boxes: ClampBox[] = [];
        for (const whole of node.querySelectorAll(WHOLE)) {
            const rect = whole.getBoundingClientRect();
            if (rect.height === 0) continue;
            boxes.push({ top: rect.top - origin, bottom: rect.bottom - origin });
        }
        const range = document.createRange();
        const texts = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        while (texts.nextNode()) {
            const parent = texts.currentNode.parentElement ?? node;
            if (parent.closest(NO_LINE) !== null) continue;
            const line = parseFloat(getComputedStyle(parent).lineHeight);
            range.selectNodeContents(texts.currentNode);
            for (const rect of range.getClientRects()) {
                if (rect.width === 0 || rect.height === 0) continue;
                const middle = (rect.top + rect.bottom) / 2 - origin;
                boxes.push({ top: middle - line / 2, bottom: middle + line / 2 });
            }
        }
        return boxes;
    }

    let box: HTMLDivElement | undefined = $state();

    /** The element around the text, whose height is the whole text's whatever the cut. */
    let contents: HTMLDivElement | undefined = $state();

    /** Whether the text is taller than the clamp, as last measured. */
    let long = $state(false);

    /** The height the cut ends at, in px, as last measured. */
    let cutHeight = $state(0);

    const control = $derived(clampControl(open, long));

    const gate = measureGate();

    $effect(() => {
        const node = box;
        const inner = contents;
        if (node === undefined || inner === undefined || typeof ResizeObserver === 'undefined') {
            return;
        }
        const token = gate.begin();
        const measure = (): void => {
            if (!gate.current(token)) return;
            const line = parseFloat(getComputedStyle(node).lineHeight);
            node.style.setProperty('--field-gap', '0');
            const height = node.scrollHeight;
            cutHeight = clampCutHeight(drawnBoxes(node), line * CLAMP_LINES);
            node.style.removeProperty('--field-gap');
            long = overflowsClamp(height, line, CLAMP_LINES);
        };
        measure();
        // The contents' height is the whole text's whatever the cut, so a change of width or text
        // size, a font that swaps and an image that loads all run the measurement. The words and
        // KaTeX's typesetting are watched apart, since they can change boxes without that height.
        const resized = new ResizeObserver(measure);
        resized.observe(inner);
        const edited = new MutationObserver(measure);
        edited.observe(node, { childList: true, subtree: true, characterData: true });
        return () => {
            gate.close();
            resized.disconnect();
            edited.disconnect();
        };
    });
</script>

<div class="clamp" data-clamp={open ? 'open' : 'cut'}>
    <div
        class="text"
        class:cut={!open && long}
        style={`--clamp-cut: ${cutHeight}px`}
        bind:this={box}
    >
        <div bind:this={contents}>
            {@render children()}
        </div>
    </div>
    {#if control === 'more'}
        <ToolButton label={t('project.card.show_more')} onclick={ontoggle} />
    {:else if control === 'less'}
        <ToolButton label={t('project.card.show_less')} onclick={ontoggle} />
    {/if}
</div>

<style>
    .clamp {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        min-width: 0;
    }

    .text {
        align-self: stretch;
        line-height: 1.45;
        overflow-wrap: anywhere;
    }

    /* The cut is a height rather than a line clamp, so a text holding markup is cut the same way as
       plain words. The height is the measured end of the last line or block that fits whole, so
       nothing is sliced above the control except where no box fits whole, which keeps the cut at
       four lines. The height is set before this class first applies. Its blocks have no gap
       between them while it is cut, the layout the height is measured in, so the lines of a plain
       text stack to the clamp. A text that fits is not cut and keeps its gaps. */
    .text.cut {
        --field-gap: 0;
        max-height: var(--clamp-cut);
        overflow: hidden;
    }
</style>
