<script lang="ts">
    // Layer 3, partial of Source.svelte. What the source tab hands up to the right end of the
    // pane's breadcrumb bar through ui/tabs/tab-actions.svelte.ts: Save and Revert File before the
    // star and Open in Program (shared/links/FileBarActions.svelte), and Open Preview, Open Preview
    // to the Side, Submit Job and Toggle Blame after them. Each is drawn only where it applies:
    //
    //   Save                       a tab whose text may be written and whose folder is served;
    //                              disabled while nothing is unsaved
    //   Revert File                a tab whose text may be written and has unsaved text
    //   Open Preview               a Markdown file shown as source, the file's preview tab in
    //                              this pane
    //   Open Preview to the Side   the same preview tab, in a new pane to the right
    //   Submit Job                 a .slurm file on disk under a served root; disabled, its
    //                              glyph turning and its hover words saying what runs, while a
    //                              Submit of the tab is planning or running
    //   Toggle Blame               a file in a repository, including its version at HEAD and in
    //                              the index
    //   Build, View PDF, Build Log a LaTeX file on disk (latex/LatexButtons.svelte), before Save
    //
    // The star and Open in Program are the shared row's, for a file under a served root.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { chordHint, SAVE_KEY } from '$lib/ui/controls/editor/chords';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import { markdownPreviewState, MARKDOWN_PREVIEW_VIEW } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import FileBarActions from '../../../shared/links/FileBarActions.svelte';
    import LatexButtons from '../latex/LatexButtons.svelte';
    import type { LatexTab } from '../latex/latex-tab.svelte';

    type Props = {
        /** The tab's instance id, which its draft and its pane are kept under. */
        id: string;
        root: string;
        path: string;
        /** Whether the tab shows a file under a served root: not a version, not untitled. */
        onDisk: boolean;
        /** Whether the text may be written, which is when Save and Revert File apply. */
        editing: boolean;
        /** Whether the file is a served Markdown file the tab shows as source. */
        previewable: boolean;
        /** Whether the file is in a repository and its text is loaded. */
        blameable: boolean;
        /** Whether the file is a .slurm job script on disk under a served root. */
        submittable: boolean;
        /**
         * What a Submit of the tab runs now, planning or running, as words; the empty string while
         * nothing runs.
         */
        submitting: string;
        /** The LaTeX side of the tab, whose controls lead the bar for a LaTeX file. */
        latex: LatexTab;
        /** Save, which the tab performs since an untitled text asks for a name first. */
        onsave: () => void;
        /** Submit Job, which the tab performs since it saves first and asks the server. */
        onsubmit: () => void;
    };

    let {
        id,
        root,
        path,
        onDisk,
        editing,
        previewable,
        blameable,
        submittable,
        submitting,
        latex,
        onsave,
        onsubmit
    }: Props = $props();

    const {
        layout: { keepPreview, openBeside, openView },
        source: { revertSourceDraft, sourceDraft, toggleSourceBlame }
    } = useState();

    const draft = $derived(sourceDraft(id));
    /** Whether the text differs from the saved one. */
    const dirty = $derived(draft.text !== draft.saved);
    /**
     * Whether Save has work: unsaved text, or a file deleted on disk to write again. A file whose
     * folder is not served is not written.
     */
    const savable = $derived(dirty || draft.disk === 'gone');

    /** Open Preview to the Side: the preview tab in a new pane to the right, or the open one. */
    function previewSide(): void {
        openBeside(MARKDOWN_PREVIEW_VIEW, markdownPreviewState(root, path));
    }

    /** Open Preview: the file's Markdown preview tab, kept, in this tab's pane. */
    function preview(): void {
        keepPreview(openView(MARKDOWN_PREVIEW_VIEW, markdownPreviewState(root, path)));
    }
</script>

{#snippet lead()}
    {#if latex.applies}
        <LatexButtons tab={latex} />
    {/if}
    {#if editing && draft.disk !== 'unserved'}
        <ToolButton
            bare
            label={t('source.bar_save')}
            title={t('source.bar_save_title', chordHint([SAVE_KEY], onMac()))}
            glyph="save"
            disabled={!savable}
            onclick={onsave}
        />
        {#if dirty}
            <ToolButton
                bare
                label={t('source.bar_revert')}
                glyph="revert"
                onclick={() => void revertSourceDraft(id)}
            />
        {/if}
    {/if}
{/snippet}

{#snippet tail()}
    {#if previewable}
        <ToolButton bare label={t('files.menu_preview')} glyph="open_preview" onclick={preview} />
    {/if}
    {#if previewable}
        <ToolButton
            bare
            label={t('source.preview_side')}
            glyph="preview_side"
            onclick={previewSide}
        />
    {/if}
    {#if submittable}
        <ToolButton
            bare
            label={t('source.submit')}
            glyph="submit_job"
            title={submitting === '' ? undefined : submitting}
            turning={submitting !== ''}
            waiting={submitting !== ''}
            onclick={onsubmit}
        />
    {/if}
    {#if blameable}
        <ToolButton
            bare
            label={t('source.bar_blame')}
            title={t('source.bar_blame_title')}
            glyph="blame"
            pressed={draft.blame}
            active={draft.blame}
            onclick={() => toggleSourceBlame(id)}
        />
    {/if}
{/snippet}

<FileBarActions {root} {path} {onDisk} {lead} {tail} />
