<script lang="ts">
    // Layer 3, view partial of the project tab. The manuscript's main files under their heading:
    // the rows are shared/latex/Rows.svelte, each main with its build state and its Build, Clean,
    // View PDF and Count Words controls, over the project form of the target, and a link that opens
    // the TeX view (views/academic/latex/) on the first main.
    //
    // A main file is content rather than configuration, so the rows are whatever the folder holds:
    // server/content/latex.ts answers with every `.tex` directly under `manuscript/` that declares
    // a document class, and a project whose folder holds none draws no panel at all.
    //
    // The panel is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), folded under the key `latex` in the tab's state
    // (views/shared/card/pane-fold.ts). Over a wallpaper its body is read off a `Surface`.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import Rows from '../../shared/latex/Rows.svelte';
    import { usePaneFold } from '../../shared/card/pane-fold';

    type Props = {
        /** The project this panel is for, which is the tab's own id. */
        id: string;
    };

    let { id }: Props = $props();

    const {
        latex: { state: latexOf },
        layout: { openView }
    } = useState();

    /** Whether the panel is open, kept in the tab's state. */
    const fold = usePaneFold();

    const target = $derived({ id });
    const held = $derived(latexOf(target));
</script>

{#if held.mains.length > 0 || held.error !== ''}
    <GroupHead
        data-latex={id}
        label={t('project.latex.heading')}
        open={fold.open('latex')}
        ontoggle={() => fold.toggle('latex')}
    >
        <Surface>
            <Rows {target} />
            <ToolButton
                small
                label={t('project.latex.open_view')}
                title={t('project.latex.open_view_tip')}
                glyph={t('views.latex_glyph')}
                onclick={() =>
                    openView('latex', {
                        root: held.root,
                        path: held.dir,
                        main: held.mains[0]?.main
                    })}
            />
        </Surface>
    </GroupHead>
{/if}
