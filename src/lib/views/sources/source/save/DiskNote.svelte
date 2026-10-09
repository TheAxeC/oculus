<script lang="ts">
    // Layer 3, view partial of Source.svelte. The line under the editor about the file on disk, in
    // the three states that call for one:
    //
    //   changed   the file changed after the tab read it and the tab holds unsaved text; the text
    //             is kept, and a Save is refused
    //   conflict  a Save was refused because the file is not the one the tab read; Compare opens
    //             the file on disk against the tab's own text in a tab beside the source tab,
    //             Overwrite saves the tab's text over whatever the file holds, and Revert File
    //             reads the file again and drops the tab's edits
    //   gone      the file was deleted on disk; the text is kept, and a Save writes it again
    //
    // The state is the draft's (state/sessions/source/disk.svelte.ts); this draws it and performs
    // the three actions of a refused Save. It is drawn inside the row of save/SourceNote.svelte.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { diffState } from '$lib/state/sources/repositories/repositories';
    import { DIFF_VIEW } from '$lib/state/sources/repositories/repositories.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The tab's instance id, which its draft is kept under. */
        id: string;
        root: string;
        path: string;
    };

    let { id, root, path }: Props = $props();

    const {
        layout: { keepPreview, openView },
        source: { revertSourceDraft, saveSourceDraft, sourceDraft }
    } = useState();

    const draft = $derived(sourceDraft(id));
    const name = $derived(path.split('/').filter(Boolean).at(-1) ?? path);

    /** The words of the line: the refusal when a Save was refused, else what the file did. */
    const words = $derived(
        draft.conflict
            ? draft.message
            : draft.disk === 'gone'
              ? t('source.disk_gone')
              : draft.disk === 'unserved'
                ? t('source.disk_unserved')
                : t('source.disk_changed')
    );

    /** Compare: the file on disk against this tab's text, in a tab after this one. */
    function compare(): void {
        const subject = { root, path, staged: false, worktree: false, unsaved: id };
        keepPreview(openView(DIFF_VIEW, diffState(subject, t('source.conflict_title', name))));
    }
</script>

<span class="words" role="alert" aria-live="polite">
    {#if draft.conflict}
        <Glyph name="cross" />
    {/if}
    {words}
</span>
{#if draft.conflict}
    <ToolButton small label={t('source.compare')} onclick={compare} />
    <ToolButton
        small
        label={t('source.overwrite')}
        onclick={() => void saveSourceDraft(id, root, path, { overwrite: true })}
    />
    <ToolButton small label={t('source.revert')} onclick={() => void revertSourceDraft(id)} />
{/if}

<style>
    .words {
        flex: 1 1 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
