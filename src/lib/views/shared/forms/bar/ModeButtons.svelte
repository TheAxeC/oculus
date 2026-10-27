<script lang="ts">
    // Layer 3, view partial, shared by the project boards (views/boards/projects/Projects.svelte)
    // and the collection views (views/boards/collection/Collection.svelte), each drawing it in its
    // header's toolbar. The Cards and List buttons: each is pressed while its mode is drawn, and a
    // press hands the caller that mode, which the caller keeps in its own state.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The mode drawn: the cards or the list. */
        mode: 'cards' | 'list';
        /** Draw the cards or the list. */
        onmode: (mode: 'cards' | 'list') => void;
    };

    let { mode, onmode }: Props = $props();
</script>

<ToolButton
    bare
    glyph="cards"
    label={t('board.view_cards')}
    pressed={mode === 'cards'}
    onclick={() => onmode('cards')}
/>
<ToolButton
    bare
    glyph="list"
    label={t('board.view_list')}
    pressed={mode === 'list'}
    onclick={() => onmode('list')}
/>
