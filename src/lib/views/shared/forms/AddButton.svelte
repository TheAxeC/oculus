<script lang="ts">
    // Layer 3, shared view partial. The header icon that opens the form adding an entry: a bare
    // ToolButton on the `add` glyph, its words as the tooltip and the accessible name, pressed
    // while the form is open. The Collection, Venues, Data, Pillars and Domains views each carry
    // it at the start of their header toolbar.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Whether the add form is open. */
        open: boolean;
        /** Open or close the add form. */
        onclick: () => void;
    };

    let { open, onclick }: Props = $props();
</script>

<ToolButton
    bare
    glyph="add"
    label={t('collection.add')}
    title={t('collection.add_tip')}
    active={open}
    pressed={open}
    {onclick}
/>
