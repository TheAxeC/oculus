<script lang="ts">
    // Layer 3, partial of the TeX view. The Structure section: the sections of the root's document
    // from parts to subsubsections in reading order, indented by level, followed through its
    // includes; its labels; and its floats (figures, tables, algorithms, listings) with the number
    // the build gave each and its caption. A press opens the file at the line. The section the
    // caret of the followed source tab is in is drawn as the one in force. The files the parser
    // refused are named under the list as read in part, since the list holds what a line scan found
    // in them, and the files too large or unreadable as not read. Numbers come from the build's
    // `.aux` file, so a root not built yet lists its floats without them.
    //
    // The outline is the LaTeX store's, asked for when this is first drawn and again after the
    // main file is built again.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { LatexOutline } from '$lib/state/sessions/latex/latex-state';
    import { t } from '$lib/state/shared/words/text';
    import { toggled } from '$lib/state/shared/lists/lists';
    import { floatWords } from '../../shared/latex/state-words';

    /** The deepest sectioning level listed: parts down to subsubsections. */
    const DEEPEST = 4;

    type Props = {
        outline: LatexOutline;
        /** The place of the caret of the followed source tab, or null for none. */
        caret: { file: string; line: number } | null;
        open: boolean;
        ontoggle: () => void;
        onopen: (file: string, line: number) => void;
    };

    let { outline, caret, open, ontoggle, onopen }: Props = $props();

    /** The groups the reader opened; the sections are always listed. */
    let opened: string[] = $state([]);

    const sections = $derived(outline.sections.filter((one) => one.level <= DEEPEST));

    /**
     * The index of the section the caret is in: the last that starts at or before it in its file.
     */
    const here = $derived.by(() => {
        if (caret === null) return -1;
        let found = -1;
        sections.forEach((one, at) => {
            if (one.file === caret.file && one.line <= caret.line) found = at;
        });
        return found;
    });

    const count = $derived(sections.length + outline.labels.length + outline.floats.length);

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? [
                  ...sections.map((_, at) => ({ id: `section:${at}`, parent: 'head' })),
                  ...(outline.labels.length > 0
                      ? [{ id: 'labels', parent: 'head', open: opened.includes('labels') }]
                      : []),
                  ...(opened.includes('labels')
                      ? outline.labels.map((_, at) => ({ id: `label:${at}`, parent: 'labels' }))
                      : []),
                  ...(outline.floats.length > 0
                      ? [{ id: 'floats', parent: 'head', open: opened.includes('floats') }]
                      : []),
                  ...(opened.includes('floats')
                      ? outline.floats.map((_, at) => ({ id: `float:${at}`, parent: 'floats' }))
                      : [])
              ]
            : [])
    ]);

    function toggle(id: string): void {
        if (id === 'head') {
            ontoggle();
            return;
        }
        opened = toggled(opened, id);
    }

    /** How a float is named: its kind, its number when it has one, and its caption. */
    function floatName(float: LatexOutline['floats'][number]): string {
        const kind = floatWords(float.kind);
        const numbered = float.number === '' ? kind : `${kind} ${float.number}`;
        return float.caption === '' ? numbered : `${numbered}: ${float.caption}`;
    }
</script>

<div class="structure" data-latex-structure>
    <TreeView label={t('latex.structure')} {rows} ontoggle={toggle}>
        {#snippet children(nav: TreeNav)}
            <TreeSection label={t('latex.structure')} id="head" {nav} {count} {open} {ontoggle}>
                {#if outline.error !== ''}
                    <li role="none">
                        <TreeItem label={t('latex.outline_failed', outline.error)} tone="error" />
                    </li>
                {:else if count === 0 && !outline.loading && outline.partial.length + outline.unread.length === 0}
                    <li role="none"><TreeItem label={t('latex.outline_empty')} tone="muted" /></li>
                {/if}
                {#each sections as section, at (at)}
                    <li role="none">
                        <TreeItem
                            label={section.title}
                            id={`section:${at}`}
                            {nav}
                            level={2}
                            depth={section.level}
                            current={at === here}
                            onclick={() => onopen(section.file, section.line)}
                        />
                    </li>
                {/each}
                {#if outline.labels.length > 0}
                    <li role="none">
                        <TreeItem
                            label={t('latex.labels')}
                            id="labels"
                            {nav}
                            level={2}
                            expanded={opened.includes('labels')}
                            count={outline.labels.length}
                            onclick={() => toggle('labels')}
                        />
                    </li>
                    {#if opened.includes('labels')}
                        {#each outline.labels as label, at (at)}
                            <li role="none">
                                <TreeItem
                                    label={label.number === ''
                                        ? label.name
                                        : `${label.name} (${label.number})`}
                                    id={`label:${at}`}
                                    {nav}
                                    level={3}
                                    depth={1}
                                    onclick={() => onopen(label.file, label.line)}
                                />
                            </li>
                        {/each}
                    {/if}
                {/if}
                {#if outline.floats.length > 0}
                    <li role="none">
                        <TreeItem
                            label={t('latex.floats')}
                            id="floats"
                            {nav}
                            level={2}
                            expanded={opened.includes('floats')}
                            count={outline.floats.length}
                            onclick={() => toggle('floats')}
                        />
                    </li>
                    {#if opened.includes('floats')}
                        {#each outline.floats as float, at (at)}
                            <li role="none">
                                <TreeItem
                                    label={floatName(float)}
                                    id={`float:${at}`}
                                    {nav}
                                    level={3}
                                    depth={1}
                                    onclick={() => onopen(float.file, float.line)}
                                />
                            </li>
                        {/each}
                    {/if}
                {/if}
                {#if outline.partial.length > 0}
                    <li role="none">
                        <TreeItem
                            label={t('latex.outline_partial', outline.partial.join(', '))}
                            tone="muted"
                        />
                    </li>
                {/if}
                {#if outline.unread.length > 0}
                    <li role="none">
                        <TreeItem
                            label={t('latex.outline_unread', outline.unread.join(', '))}
                            tone="muted"
                        />
                    </li>
                {/if}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
