<script lang="ts">
    // Layer 3, primitive. The disclosure line above a part of a row that may be folded: one button
    // holding a chevron, the title and the words of the count, that names the body it shows in
    // `aria-controls` and says whether the body is shown in `aria-expanded`. The caller keeps the
    // fold and draws the body; the Settings view draws its rows' folded parts under it
    // (views/system/workbench/editors/Fold.svelte).

    import Glyph from '../../display/Glyph.svelte';

    type Props = {
        title: string;
        /** The words of how many items the part holds. */
        count: string;
        /** Whether the body is shown. */
        expanded: boolean;
        /** The id of the body the line shows or hides. */
        controls: string;
        onclick: (event: MouseEvent) => void;
    };

    let { title, count, expanded, controls, onclick }: Props = $props();
</script>

<button type="button" class="line" aria-expanded={expanded} aria-controls={controls} {onclick}>
    <span class="chevron" class:open={expanded}><Glyph name="chevron" /></span>
    <span class="title">{title}</span>
    <span class="count">{count}</span>
</button>

<style>
    .line {
        display: inline-flex;
        align-items: center;
        align-self: flex-start;
        gap: 6px;
        padding: 2px 4px 2px 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        font-size: var(--fs-md);
        cursor: pointer;
    }

    .line:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: 1px;
    }

    .chevron {
        display: inline-flex;
        transition: transform 120ms ease;
    }

    .chevron.open {
        transform: rotate(90deg);
    }

    @media (prefers-reduced-motion: reduce) {
        .chevron {
            transition: none;
        }
    }

    .count {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
