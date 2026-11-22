<script lang="ts">
    // Layer 3, primitive. The fold control that stands before what it folds: a heading's beside it
    // (GroupHead.svelte and FoldHead.svelte) and a ticker row's, which its view draws (the command
    // center's line of emails, the Gallery's ticker). It is a bare button named "Fold <name>" or
    // "Unfold <name>" with the fold glyph of the state, written once so each names and draws it
    // alike.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The words the control is named with, after "Fold" or "Unfold". */
        name: string;
        /** Whether what the heading folds is open, and the press of the control. */
        open: boolean;
        ontoggle: () => void;
        /** The control's place in the focus order: -1 where its heading is itself a tree row. */
        reach?: number;
    };

    let { name, open, ontoggle, reach }: Props = $props();
</script>

<ToolButton
    bare
    label={open ? t('focus.fold', name) : t('focus.unfold', name)}
    glyph={open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph')}
    expanded={open}
    tabindex={reach}
    onclick={ontoggle}
/>
