<script lang="ts">
    // Layer 3, sessions view partial. Files touched by one session live here because session-file
    // activity changes independently of repository status and controls.
    //
    // The list is one grid of four columns (the mark of a file another session holds open, the
    // path, the tool's verb and the count) and each row takes the list's columns by subgrid, so a
    // verb and a count start at one x in every row whatever the length of the path before them. A
    // path is the file's name first and its folder after it, dimmed, in one line cut at its end by
    // the stylesheet, and the whole path is the tooltip.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import { relativeTo } from '$lib/state/shared/words/format';
    import { dirOf, leafOf } from '$lib/state/sources/repositories/change-tree';
    import type { SessionFile } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { touchers }
    } = useState();

    type Props = { recordId: string; files: SessionFile[]; workspace: string };
    let { recordId, files, workspace }: Props = $props();

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

{#snippet mark(also: string[])}
    {#if also.length > 0}
        <span class="mark" title={t('sessions.ch_shared_tip', also.join(', '))}
            >{t('sessions.ch_shared')}</span
        >
    {/if}
{/snippet}

<section class="sec">
    <div class="sec-h">
        <span>{t('sessions.ch_touched')}</span>
        <span class="n">{files.length}</span>
    </div>
    {#if files.length === 0}
        <Empty message={t('sessions.ch_touched_empty')} />
    {:else}
        <div class="files">
            {#each files as file (file.path)}
                {@const also = shared(file.path)}
                {@const parts = split(file.path)}
                <div class="file" class:shared={also.length > 0}>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render mark(also)}
                    <span class="pa" title={file.path}>
                        <span>{parts.name}</span>
                        {#if parts.dir !== ''}
                            <span class="dir">{parts.dir}</span>
                        {/if}
                    </span>
                    <span class="to">{file.tool}</span>
                    <span class="ct">{t('sessions.ch_times', file.count)}</span>
                </div>
            {/each}
        </div>
    {/if}
</section>

<style>
    /* A section heading: the group label in the size of a label, bold and in capitals. */
    .sec-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        font-weight: 700;
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }
    .sec-h .n {
        margin-left: auto;
        font-family: var(--font-num);
    }
    /* The list's columns: the mark, the path, the verb and the count. The gaps between them are
       margins of the cells, so a column no row fills takes no room. */
    .files {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr) max-content max-content;
    }
    /* One line of the tree's row height; the path is the row's main words. */
    .file {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        align-items: center;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }
    .pa {
        grid-column: 2;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    /* The folder after the file's name: 0.9 of the row's size, dimmed, cut at its end. */
    .dir {
        margin-left: 0.5em;
        font-size: 0.9em;
        color: var(--muted-txt, var(--muted));
    }
    .ct,
    .to {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .to {
        grid-column: 3;
        margin-left: 6px;
    }
    .ct {
        grid-column: 4;
        margin-left: 6px;
        justify-self: end;
        font-family: var(--font-num);
        text-align: right;
    }
    .mark {
        grid-column: 1;
        margin-right: 6px;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-xs);
    }
</style>
