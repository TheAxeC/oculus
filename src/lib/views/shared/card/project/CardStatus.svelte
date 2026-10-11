<script lang="ts">
    // Layer 3, shared view. The status marks of a project card: the project's chips, each in the
    // hue of its status. A project of every tier is drawn from its chips.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import type { BoardItem } from '$lib/state/boards/board';
    import { chipGlyphName, chipLabel, statusTone } from '$lib/state/shared/words/tones';

    type Props = {
        /** The joined board item whose status is drawn. */
        item: BoardItem;
    };
    let { item }: Props = $props();
</script>

{#each item.chips as chip (chip)}
    <Chip label={chipLabel(chip)} glyph={chipGlyphName(chip)} tone={statusTone(chip)} />
{/each}
