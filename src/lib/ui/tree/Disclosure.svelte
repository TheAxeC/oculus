<script lang="ts">
    // Layer 3, primitive. A compact disclosure control on the same surface as a Chip. It keeps the
    // count, label and open state separate so grouped links read as a group rather than an action.

    import Glyph from '../display/Glyph.svelte';

    type Props = {
        count: number;
        label: string;
        expanded: boolean;
        onclick: (event: MouseEvent) => void;
    };

    let { count, label, expanded, onclick }: Props = $props();
</script>

<button type="button" class="disclosure" class:open={expanded} aria-expanded={expanded} {onclick}>
    <strong class="count">{count}</strong>
    <span class="label">{label}</span>
    <span class="marker">
        <Glyph name="disclosure" />
    </span>
</button>

<style>
    .disclosure {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-sizing: border-box;
        min-height: calc(18px * var(--text-scale, 1));
        padding: 3px 5px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-xs);
        line-height: calc(11px * var(--text-scale, 1));
        cursor: pointer;
        white-space: nowrap;
    }

    .disclosure:hover {
        border-color: var(--accent);
    }

    .disclosure:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* The 16 px marker is taller than the 11 px line; its margin gives the room back, so the pill
       is as high as a Chip. */
    .marker {
        display: inline-flex;
        margin: calc(-3px * var(--text-scale, 1)) 0;
        transition: transform 120ms ease;
    }

    .open .marker {
        transform: rotate(180deg);
    }

    :global(body.rice) .disclosure {
        padding: 1px 0;
        border: 0;
        background: none;
    }
</style>
