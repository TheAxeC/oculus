<script lang="ts">
    // Layer 3, shared view partial. The header icon that adds an entry: a bare ToolButton on the
    // `add` glyph, its words as the tooltip and the accessible name. Pressing it is the view's Add,
    // which opens the view's file with a new entry. The Collection, Venues, Data, Pillars, Domains
    // and Leads views each carry it at the start of their header toolbar.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Add an entry in the view's file. */
        onclick: () => void;
    };

    let { onclick }: Props = $props();
</script>

<ToolButton
    bare
    glyph="add"
    label={t('collection.add')}
    title={t('collection.add_tip')}
    {onclick}
/>
