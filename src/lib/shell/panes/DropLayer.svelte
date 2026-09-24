<script lang="ts">
    // Layer 3, shell. What a drag looks like: the label of the tab being dragged beside the pointer
    // (of the view being opened, for a view carried out of the catalogue), and a rectangle over the
    // space the drop would take. It is rendered once, over the whole window, and it takes no
    // pointer events, so the pane under it still reports where the pointer is; it is drawn from the
    // drag store and holds nothing of its own.
    //
    // A drop on a strip is not drawn here. The strip draws its own insertion mark, which is at the
    // place between two tabs that this layer would have to cover them to show.
    //
    // What the pointer is over may be a place the thing being dragged cannot land: a page already
    // drawn on the screen, or one that would draw the page it is over. Then no rectangle is drawn
    // and the ghost says so, which is the one place a refusal is put into words.

    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import type { Rect } from '$lib/state/workbench/drag.svelte';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        drag: { dragging }
    } = useState();

    const held = $derived(dragging());
    const drop = $derived(held?.drop ?? null);
    const rect = $derived(held?.rect ?? null);
    const refused = $derived(held?.refused === true);

    /** How far from the pointer the ghost sits, so the pointer itself is never under it. */
    const OFFSET = 12;

    function box(area: Rect): string {
        return `left: ${area.x}px; top: ${area.y}px; width: ${area.width}px; height: ${area.height}px`;
    }

    /** The half of the body a new pane on this edge would take, or the whole of it for a centre. */
    function indicator(): string | null {
        if (rect === null || drop === null) return null;
        if (drop.kind === 'centre') return box(rect);
        if (drop.kind !== 'edge') return null;
        const half = { ...rect };
        if (drop.edge === 'left' || drop.edge === 'right') {
            half.width = rect.width / 2;
            if (drop.edge === 'right') half.x = rect.x + half.width;
        } else {
            half.height = rect.height / 2;
            if (drop.edge === 'bottom') half.y = rect.y + half.height;
        }
        return box(half);
    }

    const area = $derived(indicator());
</script>

{#if held !== null}
    <div class="layer" aria-hidden="true">
        {#if area !== null}
            <div class="target" style={area}></div>
        {/if}
        <div
            class="ghost"
            class:refused
            style="left: {held.point.x + OFFSET}px; top: {held.point.y + OFFSET}px"
        >
            {#if refused}
                <Glyph name={t('ui.embed_refused_glyph')} />
                {t('ui.embed_refused', held.label)}
            {:else if held.kind === 'view'}
                {t('ui.drag_open', held.label)}
            {:else}
                {t('ui.drag_hint', held.label)}
            {/if}
        </div>
    </div>
{/if}

<style>
    .layer {
        position: fixed;
        inset: 0;
        z-index: 10;
        pointer-events: none;
    }

    .target {
        position: fixed;
        border-radius: var(--radius);
        background: var(--accent);
        /* The one translucent fill on the page. It carries no text, so nothing is read through it
           and no contrast pair is created; opacity keeps it out of the colour rule, which reads
           the declared colour and cannot see through a colour-mix. */
        opacity: 0.25;
    }

    /* A refusal reads as one line on the filled red chip, with its glyph before the words. */
    .ghost.refused {
        background: var(--c-red);
        color: var(--on-c-red);
    }

    .ghost {
        position: fixed;
        max-width: 40ch;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        background: var(--line);
        color: var(--on-line);
        font-size: var(--fs-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
