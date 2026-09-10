<script lang="ts">
    // Layer 3, view. Two sections over one session: the files it touched itself, and what git says
    // about the workspace it is sitting in.
    //
    // The first is the session's own record. The mark on a row is the thing worth seeing at once:
    // another live session holding the same file open, named in the tooltip, which is how two agents
    // about to overwrite each other show up before they do.
    //
    // The second is the `git` payload for that workspace, read only. A workspace that is not a
    // repository says so, with git's own reason in the tooltip.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import { elide, relativeTo } from '$lib/state/format';
    import {
        gitFor,
        sessionFor,
        touchers,
        type GitEntry,
        type GitState,
        type SessionFile
    } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();

    /** git's own letters, kept as git's letters, given a hue by what each of them means. */
    const LETTERS: Record<string, string> = {
        M: 'amber',
        A: 'green',
        D: 'red',
        R: 'violet',
        C: 'violet',
        '?': 'slate'
    };

    const record = $derived(sessionFor(instance.id));
    const workspace = $derived(record?.workspace ?? '');
    const files = $derived(record?.files ?? []);
    const repo = $derived(workspace === '' ? null : gitFor(workspace));

    /** The other live sessions holding one path open, by their titles. */
    function shared(file: SessionFile): string[] {
        if (record === null) return [];
        return touchers(file.path, record.id).map((session) => session.title);
    }

    function letterStyle(status: string): string {
        const tone = LETTERS[status] ?? 'grey';
        return `--tone-txt: var(--c-${tone}-txt)`;
    }

    /** The branch line: where the checkout is against its upstream, in as few words as it takes. */
    function branchState(state: GitState): string {
        const bits: string[] = [];
        if (state.detached) bits.push(t('js.sessions.ch_detached'));
        if (state.ahead > 0) bits.push(t('js.sessions.ch_ahead', state.ahead));
        if (state.behind > 0) bits.push(t('js.sessions.ch_behind', state.behind));
        if (bits.length === 0) bits.push(t('js.sessions.ch_insync'));
        return bits.join(` ${t('js.sessions.meta_sep')} `);
    }
</script>

{#snippet counts(entry: GitEntry)}
    {#if entry.added === null && entry.deleted === null}
        <span class="bin">{t('js.sessions.ch_binary')}</span>
    {:else}
        {#if entry.added}
            <span class="add">{t('js.sessions.ch_added', entry.added)}</span>
        {/if}
        {#if entry.deleted}
            <span class="del">{t('js.sessions.ch_deleted', entry.deleted)}</span>
        {/if}
    {/if}
{/snippet}

{#snippet group(label: string, entries: GitEntry[])}
    <div class="group">
        <div class="group-h">
            <span>{label}</span>
            <span class="n">{entries.length}</span>
        </div>
        {#if entries.length === 0}
            <p class="none">{t('js.sessions.ch_group_empty')}</p>
        {:else}
            {#each entries as entry (entry.path)}
                <div class="file">
                    <span class="st" style={letterStyle(entry.status)}>{entry.status}</span>
                    <span class="pa" title={entry.path}>{elide(entry.path)}</span>
                    {@render counts(entry)}
                </div>
            {/each}
        {/if}
    </div>
{/snippet}

<Pane title={t('sessions.view_changes')}>
    <div class="changes" data-instance={instance.id}>
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            <section class="sec">
                <div class="sec-h">
                    <span>{t('js.sessions.ch_touched')}</span>
                    <span class="n">{files.length}</span>
                </div>
                {#if files.length === 0}
                    <p class="none">{t('js.sessions.ch_touched_empty')}</p>
                {:else}
                    {#each files as file (file.path)}
                        {@const also = shared(file)}
                        <div class="file" class:shared={also.length > 0}>
                            <span class="pa" title={file.path}>
                                {elide(relativeTo(file.path, workspace))}
                            </span>
                            {#if also.length > 0}
                                <span
                                    class="mark"
                                    title={t('js.sessions.ch_shared_tip', also.join(', '))}
                                >
                                    {t('js.sessions.ch_shared')}
                                </span>
                            {/if}
                            <span class="to">{file.tool}</span>
                            <span class="ct">{t('js.sessions.ch_times', file.count)}</span>
                        </div>
                    {/each}
                {/if}
            </section>

            <section class="sec">
                <div class="sec-h"><span>{t('js.sessions.ch_repo')}</span></div>
                {#if repo === null || repo.error !== null}
                    <p class="none" title={repo?.error ?? undefined}>
                        {t('js.sessions.ch_norepo')}
                    </p>
                {:else}
                    <div class="branch">
                        <span class="lb">{t('js.sessions.ch_branch')}</span>
                        <span class="nm">{repo.branch}</span>
                        <span class="mt">{branchState(repo)}</span>
                    </div>
                    {@render group(t('js.sessions.ch_staged'), repo.staged)}
                    {@render group(t('js.sessions.ch_changed'), repo.unstaged)}
                    {@render group(t('js.sessions.ch_untracked'), repo.untracked)}
                {/if}
            </section>
        {/if}
    </div>
</Pane>

<style>
    .changes {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .sec-h,
    .group-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .sec-h {
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }

    .group {
        margin-top: 6px;
    }

    .sec-h .n,
    .group-h .n {
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

    .st {
        flex: 0 0 auto;
        width: 1.2em;
        text-align: center;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }

    .to,
    .ct,
    .mark,
    .bin,
    .none {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .to,
    .ct {
        margin-left: auto;
    }

    .ct,
    .add,
    .del {
        flex: 0 0 auto;
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .add {
        color: var(--c-green-txt, var(--muted));
    }

    .del {
        color: var(--c-red-txt, var(--muted));
    }

    .mark {
        color: var(--c-amber-txt, var(--muted));
    }

    .none {
        margin: 2px 0 0;
    }

    .branch {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: var(--fs-sm);
    }

    .branch .lb,
    .branch .mt {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .branch .mt {
        margin-left: auto;
    }

    /* The terminal shape: a status listing, in the face git prints it in. */
    :global(body.rice) .changes {
        font-family: var(--font-mono);
    }
</style>
