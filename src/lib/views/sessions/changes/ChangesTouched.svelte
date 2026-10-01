<script lang="ts">
    // Layer 3, sessions view partial. Files touched by one session live here because session-file
    // activity changes independently of repository status and controls.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import { elide, relativeTo } from '$lib/state/shared/words/format';
    import type { SessionFile } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { touchers }
    } = useState();

    type Props = { recordId: string; files: SessionFile[]; workspace: string };
    let { recordId, files, workspace }: Props = $props();

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
        {#each files as file (file.path)}
            {@const also = shared(file.path)}
            <div class="file" class:shared={also.length > 0}>
                <span class="pa" title={file.path}>{elide(relativeTo(file.path, workspace))}</span>
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render mark(also)}
                <span class="to">{file.tool}</span>
                <span class="ct">{t('sessions.ch_times', file.count)}</span>
            </div>
        {/each}
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
    /* One line of the tree's row height; the path is the row's main words. */
    .file {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }
    .pa {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ct,
    .to {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .to,
    .ct {
        margin-left: auto;
    }
    .ct {
        font-family: var(--font-num);
    }
    .mark {
        flex: 0 0 auto;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-xs);
    }
</style>
