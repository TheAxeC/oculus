<script lang="ts">
    // Layer 3, sessions view partial. Files touched by one session live here because session-file
    // activity changes independently of repository status and controls.

    import { elide, relativeTo } from '$lib/state/format';
    import { touchers, type SessionFile } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';

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
        <p class="none">{t('sessions.ch_touched_empty')}</p>
    {:else}
        {#each files as file (file.path)}
            {@const also = shared(file.path)}
            <div class="file" class:shared={also.length > 0}>
                <span class="pa" title={file.path}>{elide(relativeTo(file.path, workspace))}</span>
                {@render mark(also)}
                <span class="to">{file.tool}</span>
                <span class="ct">{t('sessions.ch_times', file.count)}</span>
            </div>
        {/each}
    {/if}
</section>

<style>
    .sec-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-sm);
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }
    .sec-h .n {
        margin-left: auto;
        font-family: var(--font-num);
    }
    .file {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }
    .pa {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ct,
    .mark {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .to {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .to,
    .ct {
        margin-left: auto;
    }
    .ct {
        font-family: var(--font-num);
    }
    .mark {
        color: var(--c-amber-txt, var(--muted));
    }
    .none {
        margin: 2px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
</style>
