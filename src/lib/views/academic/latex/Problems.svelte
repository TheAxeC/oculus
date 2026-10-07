<script lang="ts">
    // Layer 3, partial of the TeX view. The Problems section: the errors and then the warnings of
    // the last build of the followed root, each row with its place (the file and the line) and its
    // message, drawn in the error or the warning hue. A press opens the file at the line; a problem
    // that names no file is the main file's. The list is the LaTeX store's state of the root's
    // folder (state/sessions/latex/latex.svelte.ts), so a build that ends redraws it. A root whose
    // last build left no problem says so, and a root not built says that.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { LatexMain } from '$lib/state/sessions/latex/latex-state';
    import { t } from '$lib/state/shared/words/text';
    import { placeOf, problemFile, problemRows } from '../../shared/latex/places';
    import type { SourceFile } from '../../shared/links/source-file';

    type Props = {
        main: LatexMain | null;
        root: string;
        /** The main file's path against the root. */
        mainPath: string;
        open: boolean;
        ontoggle: () => void;
        onopen: (file: SourceFile) => void;
    };

    let { main, root, mainPath, open, ontoggle, onopen }: Props = $props();

    const problems = $derived(main === null ? [] : problemRows(main.errors, main.warnings));

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? problems.map((_, at) => ({ id: `problem:${at}`, parent: 'head' })) : [])
    ]);
</script>

<div class="problems" data-latex-problems>
    <TreeView label={t('latex.problems_head')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={t('latex.problems_head')}
                id="head"
                {nav}
                count={problems.length}
                {open}
                {ontoggle}
            >
                {#if main?.log == null}
                    <li role="none">
                        <TreeItem label={t('latex.problems_unbuilt')} tone="muted" />
                    </li>
                {:else if problems.length === 0}
                    <li role="none"><TreeItem label={t('latex.no_errors')} tone="muted" /></li>
                {/if}
                {#each problems as { issue, severity }, at (at)}
                    <li role="none">
                        <TreeItem
                            label={issue.message}
                            id={`problem:${at}`}
                            {nav}
                            level={2}
                            tone={severity === 'error' ? 'error' : 'warn'}
                            title={placeOf(issue)}
                            onclick={() => onopen(problemFile(issue, root, mainPath))}
                        >
                            {#snippet detail()}{placeOf(issue)}{/snippet}
                        </TreeItem>
                    </li>
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
