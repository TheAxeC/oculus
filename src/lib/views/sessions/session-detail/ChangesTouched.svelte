<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/SessionDetail.svelte. The files one session
    // touched, as the first rows of the Changes section: they change independently of the
    // repository's status and controls, which ChangesRepository.svelte draws under them.
    //
    // Each file is a row of the section's tree (level 2, ids from rowKey). A row says the file's
    // name first with the mark of a file another live session holds open before it, then the file's
    // folder after it, muted and cut at its end before the name is, and at the right edge the
    // tool's verb and the count. The whole path is the tooltip of the name.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { relativeTo } from '$lib/state/shared/words/format';
    import { dirOf, leafOf } from '$lib/state/sources/repositories/change-tree';
    import type { SessionFile } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import SharedMark from './SharedMark.svelte';
    import { rowKey } from './session-sections';

    const {
        selectors: { touchers }
    } = useState();

    type Props = { recordId: string; files: SessionFile[]; workspace: string; nav: TreeNav };
    let { recordId, files, workspace, nav }: Props = $props();

    /** A path as the row says it: the file's name, then the folder it is in. */
    function split(path: string): { name: string; dir: string } {
        const shown = relativeTo(path, workspace);
        return { name: leafOf(shown), dir: dirOf(shown) };
    }

    /** Other live sessions holding one path open, by title. */
    function shared(path: string): string[] {
        return path === '' ? [] : touchers(path, recordId).map((session) => session.title);
    }
</script>

<li role="none">
    <div class="sec-h"><span>{t('sessions.ch_touched')}</span></div>
</li>
{#if files.length === 0}
    <li role="none">
        <Empty message={t('sessions.ch_touched_empty')} />
    </li>
{:else}
    {#each files as file (file.path)}
        {@const also = shared(file.path)}
        {@const parts = split(file.path)}
        <li role="none">
            <TreeItem
                label={parts.name}
                name={file.path}
                id={rowKey('file', file.path)}
                {nav}
                level={2}
            >
                {#snippet words()}
                    {#if also.length > 0}
                        <span class="lead"><SharedMark {also} /></span>
                    {/if}
                    <span title={file.path}>{parts.name}</span>
                {/snippet}
                {#snippet detail()}
                    {parts.dir}
                {/snippet}
                {#snippet end()}
                    {file.tool} {t('sessions.ch_times', file.count)}
                {/snippet}
            </TreeItem>
        </li>
    {/each}
{/if}

<style>
    /* A sub-heading of the section: the group label, in the size of a label, bold, in capitals. */
    .sec-h {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px 0;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        font-weight: 700;
    }
    .lead {
        margin-right: 6px;
    }
</style>
