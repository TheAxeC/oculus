<script lang="ts">
    // Layer 3, primitive. An exclusive group of buttons: a filter with three settings, a mode with
    // two. It holds nothing; the chosen id comes in as a prop and a click goes out as a call, so
    // the choice lives wherever the caller keeps its state.

    import type { SegmentItem } from './segment-items';
    import ToolButton from '../ToolButton.svelte';

    type Props = {
        items: SegmentItem[];
        /** The id of the chosen item. An id no item carries leaves the group with none chosen. */
        value: string;
        onchange: (id: string) => void;
        /** The group's accessible name, already translated by the view. */
        label: string;
    };

    let { items, value, onchange, label }: Props = $props();
</script>

<div class="segment" role="radiogroup" aria-label={label}>
    {#each items as item (item.id)}
        <ToolButton
            label={item.label}
            glyph={item.glyph}
            active={item.id === value}
            checked={item.id === value}
            onclick={() => onchange(item.id)}
        />
    {/each}
</div>

<style>
    .segment {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        min-width: 0;
    }
</style>
