<script lang="ts">
    // Layer 3, partial of ChangesSection.svelte beside it. The files one session touched, as the
    // first group row of the Changes section, headed with the words of `sessions.ch_touched`: a row
    // of the section's tree that folds, with the number of files as a badge, and under it while it
    // is open one row per file one step further in, or the line that says none was touched. They
    // change independently of the repository's status and controls, which ChangesRepository.svelte
    // draws under them.
    //
    // A file's row (ids from rowKey) says the file's name first with the mark of a file another
    // live session holds open before it, then the file's folder after it, muted and cut at its end
    // before the name is, and at the right edge the tool's verb and the count. The whole path is
    // the tooltip of the name.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { relativeTo } from '$lib/state/shared/words/format';
    import { dirOf, leafOf } from '$lib/state/sources/repositories/change-tree';
    import type { SessionFile } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import SharedMark from './SharedMark.svelte';
    import { rowKey } from '../session-sections';
    import { TOUCHED_ROW } from './changes-folds';

    const {
        selectors: { touchers }
    } = useState();

    type Props = {
        recordId: string;
        files: SessionFile[];
        workspace: string;
        nav: TreeNav;
        /** Whether the group row is open. */
        open: boolean;
        ontoggle: () => void;
    };
    let { recordId, files, workspace, nav, open, ontoggle }: Props = $props();

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

<li role="none" data-touched>
    <TreeItem
        label={t('sessions.ch_touched')}
        id={TOUCHED_ROW}
        {nav}
        level={2}
        depth={1}
        count={files.length > 0 ? files.length : undefined}
        badge
        expanded={open}
        onclick={ontoggle}
    />
</li>
{#if open && files.length === 0}
    <li role="none">
        <TreeItem label={t('sessions.ch_touched_empty')} tone="muted" depth={2} />
    </li>
{:else if open}
    {#each files as file (file.path)}
        {@const also = shared(file.path)}
        {@const parts = split(file.path)}
        <li role="none">
            <TreeItem
                label={parts.name}
                name={file.path}
                id={rowKey('file', file.path)}
                {nav}
                level={3}
                depth={2}
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
    .lead {
        margin-right: 6px;
    }
</style>
