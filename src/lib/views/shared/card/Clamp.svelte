<script lang="ts">
    // Layer 3, shared view. A card's long description cut to a few lines, with the control that
    // opens it whole and the one that cuts it again. The project card and the collection entry card
    // draw it the same way, so it lives here once.
    //
    // Whether it is open is the caller's, kept in the view instance's state, so a tab switch or a
    // reload keeps it. Whether the text is longer than the clamp is measured, since only the page
    // knows the card's width: the text's whole height against its own line height, read again when
    // the box is resized or its words change, and dropped when it lands after the component is gone
    // (card-layout.ts's measureGate). A server rendering measures nothing and so draws no control;
    // the browser draws one once it has measured a text that does not fit.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/words/text';
    import { CLAMP_LINES, clampControl, measureGate, overflowsClamp } from './card-layout';

    type Props = {
        /** Whether the whole text is drawn. */
        open: boolean;
        /** Open or cut the text, which the caller writes to the instance. */
        ontoggle: () => void;
        /** The text, as inline content with no block margins of its own. */
        children: Snippet;
    };

    let { open, ontoggle, children }: Props = $props();

    let box: HTMLDivElement | undefined = $state();

    /** Whether the text is taller than the clamp, as last measured. */
    let long = $state(false);

    const control = $derived(clampControl(open, long));

    const gate = measureGate();

    $effect(() => {
        const node = box;
        if (node === undefined || typeof ResizeObserver === 'undefined') return;
        const token = gate.begin();
        const measure = (): void => {
            if (!gate.current(token)) return;
            const line = parseFloat(getComputedStyle(node).lineHeight);
            long = overflowsClamp(node.scrollHeight, line, CLAMP_LINES);
        };
        measure();
        // A cut box keeps its height when its words change, so a change of the words is watched
        // apart from a change of the box's size.
        const resized = new ResizeObserver(measure);
        resized.observe(node);
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
    <div class="text" class:cut={!open} style={`--clamp-lines: ${CLAMP_LINES}`} bind:this={box}>
        {@render children()}
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

    /* The cut is a height of whole lines rather than a line clamp, so a text holding inline markup
       is cut the same way as plain words. */
    .text.cut {
        max-height: calc(var(--clamp-lines) * 1.45em);
        overflow: hidden;
    }
</style>
