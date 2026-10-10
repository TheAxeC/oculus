<script lang="ts">
    // Layer 3, shared view. The switch between a board's cards and its table, drawn the same on the
    // Projects boards and the Personal board; each keeps the chosen mode in its own instance state.

    import Segment from '$lib/ui/controls/segment/Segment.svelte';
    import type { SegmentItem } from '$lib/ui/controls/segment/segment-items';
    import type { BoardMode } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The mode in force. */
        mode: BoardMode;
        /** Called with the mode the reader chose. */
        onchange: (mode: BoardMode) => void;
    };
    let { mode, onchange }: Props = $props();

    const modes: SegmentItem[] = [
        { id: 'cards', label: t('board.view_cards'), glyph: t('board.view_cards_glyph') },
        { id: 'list', label: t('board.view_list'), glyph: t('board.view_list_glyph') }
    ];
</script>

<Segment
    label={t('board.view')}
    items={modes}
    value={mode}
    onchange={(id) => onchange(id === 'list' ? 'list' : 'cards')}
/>
