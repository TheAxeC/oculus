<script lang="ts">
    // Layer 3, shared view partial. The header icon that adds an entry: a bare ToolButton on the
    // `add` glyph, its words as the tooltip and the accessible name. Pressing it is the view's Add,
    // which opens the box that asks the new entry's name (AddAsk.svelte). The Collection, Venues,
    // Data, Pillars, Domains, Leads and Lit Watch views each carry it in their header toolbar.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Open the view's Add box. */
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
