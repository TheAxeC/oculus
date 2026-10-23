<script lang="ts">
    // Layer 3, shared view. The status marks of a project card: the project's form, then its chips,
    // each with its label and glyph from `forms` and `chips` of config/catalogs/vocab.yml. A form
    // or a chip has no colour of its own, so each is drawn in the neutral tone. The stage is the
    // card's filled chip, drawn by ProjectCard.svelte with the label and glyph of its word of
    // `stages`.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import type { BoardItem } from '$lib/state/boards/board';
    import { UNKNOWN_TONE, chipGlyphName, chipLabel } from '$lib/state/shared/words/tones';

    type Props = {
        /** The joined board item whose status is drawn. */
        item: BoardItem;
    };
    let { item }: Props = $props();
</script>

{#each item.chips as chip (chip)}
    <Chip label={chipLabel(chip)} glyph={chipGlyphName(chip)} tone={UNKNOWN_TONE} />
{/each}
