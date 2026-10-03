<script module lang="ts">
    // Layer 3, view registration. The LaTeX view is opened from the Files menu on a folder or a
    // `.tex` file, never from the view catalogue: it is about one folder and says nothing alone.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'latex',
        label: 'views.latex',
        glyph: 'views.latex_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The LaTeX main files of one folder of a served root: every `.tex` file
    // directly in it that declares a document class, each with its build, clean, log and PDF
    // controls, its word count, its outline and the problems of its last build (shared/latex).
    //
    // The folder is the instance state's `root` and `path`; an empty path is the root itself. The
    // tab is named by the state's `label`, which the opener writes, and by the folder otherwise.
    // The folder's state is the latex store's, so a build started here, in the project tab or by a
    // save redraws this view when it ends.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { nameOf } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import Rows from '../../shared/latex/Rows.svelte';

    const {
        latex: { state: latexOf }
    } = useState();

    let { instance }: ViewProps = $props();

    const root = $derived(instanceText(instance.state, 'root'));
    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));

    const target = $derived({ root, path });
    const held = $derived(latexOf(target));

    /** The tab's words: the opener's label, else the folder's name, else the root's key. */
    const title = $derived(label !== '' ? label : path !== '' ? nameOf(path) : root);
</script>

<Pane {title} tinted>
    <div class="latex" data-instance={instance.id} data-root={root} data-path={path}>
        {#if root === ''}
            <Empty message={t('latex.none')} glyph={t('latex.none_glyph')} />
        {:else}
            <Rows {target} />
            {#if !held.loading && held.error === '' && held.mains.length === 0}
                <Empty message={t('latex.none')} glyph={t('latex.none_glyph')} />
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .latex {
        min-width: 0;
        padding: 8px;
    }
</style>
