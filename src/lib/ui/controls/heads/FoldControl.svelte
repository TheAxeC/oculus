<script lang="ts">
    // Layer 3, primitive. The fold control of what it folds: a heading's, before its words
    // (GroupHead.svelte and FoldHead.svelte), and a ticker row's, after its words, which its view
    // draws (the command center's line of emails, the Gallery's ticker). It is a bare button named
    // "Fold <name>" or "Unfold <name>" with the glyph of the state, written once so each names and
    // draws it alike: the fold glyph of a heading, or a chevron that points right closed and down
    // open.

    import ToolButton from '$lib/ui/controls/tool-button/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The words the control is named with, after "Fold" or "Unfold". */
        name: string;
        /** Whether what the heading folds is open, and the press of the control. */
        open: boolean;
        ontoggle: () => void;
        /** The control's place in the focus order: -1 where its heading is itself a tree row. */
        reach?: number;
        /** Draw the chevron of a row's control instead of a heading's fold glyph. */
        chevron?: boolean;
    };

    let { name, open, ontoggle, reach, chevron = false }: Props = $props();

    const glyph = $derived.by(() => {
        if (chevron) return open ? 'disclosure' : 'chevron';
        return open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph');
    });
</script>

<ToolButton
    bare
    label={open ? t('focus.fold', name) : t('focus.unfold', name)}
    {glyph}
    expanded={open}
    tabindex={reach}
    onclick={ontoggle}
/>
