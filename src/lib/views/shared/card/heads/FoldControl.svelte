<script lang="ts">
    // Layer 3, view partial of the headings beside it (GroupHead.svelte and FoldHead.svelte). The
    // fold control a heading that folds starts with: a bare button named "Fold <name>" or "Unfold
    // <name>" with the fold glyph of the state, written once so both headings name and draw it
    // alike.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The words the control is named with, after "Fold" or "Unfold". */
        name: string;
        /** Whether what the heading folds is open, and the press of the control. */
        open: boolean;
        ontoggle: () => void;
    };

    let { name, open, ontoggle }: Props = $props();
</script>

<ToolButton
    bare
    label={open ? t('focus.fold', name) : t('focus.unfold', name)}
    glyph={open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph')}
    expanded={open}
    onclick={ontoggle}
/>
