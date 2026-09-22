<script lang="ts">
    // Layer 3, primitive. A compact disclosure control on the same surface as a Chip. It keeps the count, label and open state separate so grouped links read as a group rather than an action.

    import Glyph from '../controls/Glyph.svelte';

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
        padding: 1px 8px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-sm);
        cursor: pointer;
        white-space: nowrap;
    }

    .disclosure:hover {
        border-color: var(--accent);
    }

    .disclosure:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
    }

    .marker {
        display: inline-flex;
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
