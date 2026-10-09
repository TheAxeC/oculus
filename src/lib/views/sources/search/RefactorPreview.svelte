<script module lang="ts">
    // Layer 3, view registration. The Refactor Preview opens when a preview is asked and is not
    // listed: opened bare it only says it has nothing to show.
    import { REFACTOR_VIEW } from '$lib/state/system/machine/refactor/preview.svelte';
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: REFACTOR_VIEW,
        label: 'views.refactor_preview',
        glyph: 'views.refactor_preview_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The edit a language server answered that is shown before anything is written,
    // as VS Code's Refactor Preview draws it: a header with Apply and Discard, then a tree of one
    // row per file (its check, its name, its folder and its count of edits) with a row per edit
    // under it (its check and its line, the text the edit takes out struck and the text that
    // replaces it marked). An unchecked edit is not made, and a file with none checked is not
    // written. A press on a file row or an edit row opens the diff of the file as it is against the
    // file with the checked edits, at the line of the edit (state/sources/repositories/ diff pane,
    // read from the preview, state/sources/repositories/diff/refactor-subject.ts).
    //
    // The store holds one pending preview (state/system/machine/refactor/preview.svelte.ts). A
    // second one asked for meanwhile is held back behind the question this view draws, whose
    // Continue drops the first. With nothing pending the view says what to do to see one. An Apply
    // that was refused says why under the header, and the preview stays for another try.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { rowsOf, type EditRow, type FileRow } from '$lib/state/system/machine/refactor/rows';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { refactor, repositories } = useState();

    const preview = $derived(refactor.pending());
    const incoming = $derived(refactor.incoming());
    const files = $derived(preview === null ? [] : rowsOf(preview));
    const failed = $derived(refactor.failed());
    const title = $derived(
        preview?.title ??
            (preview?.rename == null
                ? t('refactor_preview.title_plain')
                : t('refactor_preview.title_rename', preview.rename.from, preview.rename.to))
    );

    /** The tree's rows as the keyboard reads them: each file with its edits under it. */
    const rows = $derived(
        files.flatMap((file) => [
            { id: file.name, parent: null, open: true },
            ...file.edits.map((one) => ({
                id: `${file.name}#${String(one.index)}`,
                parent: file.name
            }))
        ])
    );

    /** Open the diff of a file of the preview, at a line. */
    function compare(file: FileRow, line: number): void {
        if (preview === null) return;
        repositories.openDiff(
            {
                root: file.root,
                path: file.path,
                staged: false,
                worktree: false,
                line,
                refactor: { id: preview.id }
            },
            t('refactor_preview.file_title', file.base)
        );
    }
</script>

{#snippet tools()}
    <Toolbar label={t('refactor_preview.results')}>
        <ToolButton
            label={t('refactor_preview.apply')}
            title={t('refactor_preview.apply_title')}
            glyph="check"
            disabled={preview === null || refactor.applying()}
            onclick={() => void refactor.apply()}
        />
        <ToolButton
            label={t('refactor_preview.discard')}
            title={t('refactor_preview.discard_title')}
            glyph="dismiss"
            disabled={preview === null || refactor.applying()}
            onclick={() => refactor.discard()}
        />
    </Toolbar>
{/snippet}

{#snippet editRow(file: FileRow, one: EditRow, nav: TreeNav)}
    <li class="edit" role="none" data-refactor-edit={`${file.name}:${String(one.line)}`}>
        <TreeItem
            label={`${file.name}:${String(one.line)}`}
            id={`${file.name}#${String(one.index)}`}
            {nav}
            level={2}
            depth={1}
            title={t('refactor_preview.edit_title', file.base, String(one.line))}
            onclick={() => compare(file, one.line)}
            showActions
        >
            {#snippet words()}
                <span class="number">{one.line}</span>
                <span class="text"
                    >{one.before}<span class="struck">{one.old}</span><span class="with"
                        >{one.added}</span
                    >{one.after}</span
                >
            {/snippet}
            {#snippet actions(tabindex: number)}
                <ToolButton
                    bare
                    label={t('refactor_preview.check_edit')}
                    glyph={one.checked ? 'checkbox_on' : 'checkbox_off'}
                    pressed={one.checked}
                    {tabindex}
                    onclick={() => refactor.setEdit(file.name, one.index, !one.checked)}
                />
            {/snippet}
        </TreeItem>
    </li>
{/snippet}

{#snippet fileRow(file: FileRow, nav: TreeNav)}
    <li class="file" role="none" data-refactor-file={file.name}>
        <TreeItem
            label={file.base}
            id={file.name}
            {nav}
            level={1}
            file={file.base}
            expanded
            count={file.count}
            badge
            title={file.name}
            onclick={() => compare(file, file.edits[0]?.line ?? 0)}
            showActions
        >
            {#snippet detail()}{file.folder}{/snippet}
            {#snippet actions(tabindex: number)}
                <ToolButton
                    bare
                    label={t('refactor_preview.check_file', file.name)}
                    glyph={file.checked === true
                        ? 'checkbox_on'
                        : file.checked === false
                          ? 'checkbox_off'
                          : 'cross_box'}
                    pressed={file.checked === true}
                    {tabindex}
                    onclick={() => refactor.setFile(file.name, file.checked !== true)}
                />
            {/snippet}
        </TreeItem>
        <ul class="edits" role="none">
            {#each file.edits as one (one.index)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render editRow(file, one, nav)}
            {/each}
        </ul>
    </li>
{/snippet}

<Pane {title} toolbar={tools} tinted>
    <div class="refactor" data-view="refactor-preview">
        {#if preview === null}
            <Empty message={t('refactor_preview.empty')} glyph="diff" />
        {:else}
            {#if failed !== ''}
                <p class="failed" role="alert" data-refactor-failed>{failed}</p>
            {/if}
            <div class="results">
                <TreeView label={t('refactor_preview.results')} {rows}>
                    {#snippet children(nav: TreeNav)}
                        <ul class="files" role="none">
                            {#each files as file (file.name)}
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                {@render fileRow(file, nav)}
                            {/each}
                        </ul>
                    {/snippet}
                </TreeView>
            </div>
        {/if}
    </div>
</Pane>

{#if incoming !== null}
    <Confirm
        message={t('refactor_preview.another')}
        detail={t('refactor_preview.another_detail')}
        confirm={t('refactor_preview.continue')}
        cancel={t('refactor_preview.cancel')}
        onconfirm={() => refactor.continueIncoming()}
        oncancel={() => refactor.cancelIncoming()}
    />
{/if}

<style>
    .refactor {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 6px;
        height: 100%;
        min-height: 0;
    }

    .failed {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }

    .results {
        min-height: 0;
        overflow: auto;
    }

    .files,
    .edits {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .number {
        flex: 0 0 auto;
        margin-right: 6px;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }

    .text {
        min-width: 0;
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        white-space: pre;
    }

    /* The text an edit takes out, then the text that replaces it. */
    .struck {
        color: var(--c-red-txt);
        text-decoration: line-through;
    }

    .with {
        color: var(--c-green-txt);
    }
</style>
