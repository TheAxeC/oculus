<script lang="ts">
    // Layer 3, primitive. An exclusive group of buttons: a filter with three settings, a mode with
    // two. It holds nothing; the chosen id comes in as a prop and a click goes out as a call, so
    // the choice lives wherever the caller keeps its state.
    //
    // The keyboard is a radio group's: the group is one Tab stop, on the chosen item, and the
    // arrow keys, Home and End move the choice and the focus together (`segmentMove`).

    import { segmentMove, segmentStop, type SegmentItem } from './segment-items';
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

    let group: HTMLDivElement | undefined = $state();

    const stop = $derived(segmentStop(items, value));

    /** Move the choice and the focus to the item a key names, from the item it was pressed on. */
    function moved(event: KeyboardEvent, at: number): void {
        const next = segmentMove(event.key, at, items.length);
        if (next === null) return;
        event.preventDefault();
        onchange(items[next].id);
        Array.from(group?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])
            .at(next)
            ?.focus();
    }
</script>

<div class="segment" role="radiogroup" aria-label={label} bind:this={group}>
    {#each items as item, at (item.id)}
        <ToolButton
            label={item.label}
            glyph={item.glyph}
            active={item.id === value}
            checked={item.id === value}
            tabindex={at === stop ? 0 : -1}
            onkeydown={(event: KeyboardEvent) => moved(event, at)}
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
