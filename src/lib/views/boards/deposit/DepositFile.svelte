<script lang="ts">
    // Layer 3, partial of views/boards/deposit/Deposit.svelte. One file of a list the deposit
    // shows, the changed files of the sync plan or the files that differ from `origin/main`: its
    // path (with git's letters for a changed file) as a control that opens the file's diff below
    // it, in the diff editor (ui/controls/editor/diff/DiffEditor.svelte) over the two texts the
    // deposit route serves. The texts are asked for when the diff is opened and not again until the
    // row is made again; the parent makes its rows again whenever the plan or the comparison
    // changes, so an open diff never shows texts older than the list it sits in.

    import DiffEditor from '$lib/ui/controls/editor/diff/DiffEditor.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { CONTEXT } from '$lib/state/sources/repositories/diff/diff-hunks';
    import { languageOf } from '$lib/state/sources/fs';
    import type { FileTexts } from '$lib/state/system/deposit.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        deposit: { texts },
        selectors: { languages },
        ui: { codeTheme, editorLook }
    } = useState();

    type Props = {
        /** The project the deposit is of. */
        id: string;
        /** The comparison the texts are of: the sync plan's, or the one with `origin/main`. */
        against: 'plan' | 'main';
        path: string;
        /** git's two letters for a changed file of the plan, empty for the other list. */
        letters?: string;
        /** A name unique to the view instance, which names the editor's models. */
        model: string;
    };

    let { id, against, path, letters = '', model }: Props = $props();

    let open = $state(false);
    /** The texts once asked for, or null until then. */
    let held = $state<FileTexts | null>(null);
    const look = $derived(editorLook());

    /** Open or close the diff, asking the route for the texts the first time it opens. */
    async function toggle(): Promise<void> {
        open = !open;
        if (!open || held !== null) return;
        held = await texts(id, against, path);
    }
</script>

<div class="file">
    <div class="fl">
        {#if letters !== ''}
            <span class="st">{letters}</span>
        {/if}
        <RowButton
            title={open ? t('deposit.diff_close', path) : t('deposit.diff_open', path)}
            onclick={() => void toggle()}
        >
            <span class="pa">{path}</span>
        </RowButton>
    </div>
    {#if open}
        <div class="diff">
            {#if held === null}
                <p class="none">{t('deposit.diff_loading')}</p>
            {:else if !held.ok}
                <Empty error message={held.error}>
                    {#snippet action()}
                        <ToolButton
                            small
                            label={t('deposit.retry')}
                            onclick={async () => {
                                held = null;
                                held = await texts(id, against, path);
                            }}
                        />
                    {/snippet}
                </Empty>
            {:else}
                <DiffEditor
                    original={held.original}
                    modified={held.modified}
                    language={languageOf(path, languages())}
                    {model}
                    {path}
                    mode="side"
                    context={CONTEXT}
                    hideUnchanged
                    {look}
                    codeTheme={codeTheme()}
                    sized
                />
            {/if}
        </div>
    {/if}
</div>

<style>
    .file {
        display: flex;
        flex-direction: column;
    }

    /* A file is one line of the tree's row height, its words the main words of a row. */
    .fl {
        display: flex;
        gap: 8px;
        align-items: center;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    .st {
        color: var(--muted-txt);
        font-family: var(--font-mono);
        white-space: pre;
    }

    .pa {
        font-family: var(--font-mono);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .diff {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        overflow: hidden;
    }

    .none {
        margin: 0;
        padding: 6px 8px;
        color: var(--muted-txt);
        font-size: var(--fs-md);
    }
</style>
