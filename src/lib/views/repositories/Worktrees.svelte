<script lang="ts">
    // Layer 3, partial of views/Repositories.svelte. The worktrees of one repository, and the
    // control that makes another.
    //
    // A worktree goes under the repository's own worktrees folder, and the path is said before the
    // control is pressed, so nothing is made somewhere the reader did not see. A repository whose
    // .gitignore does not keep that folder out of its history is warned about here rather than
    // edited: what a repository ignores is its owner's to decide.
    //
    // The checkout itself is the first row and carries no control: it is not a worktree to remove,
    // to merge back, or to open a diff of. The merge back is offered only while the repository has a
    // branch checked out, since a detached HEAD has nothing to merge into.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import { plannedPath, worktreeLabel, type DiffSubject } from '$lib/state/repositories';
    import { elide } from '$lib/state/format';
    import type { GitState } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        root: string;
        git: GitState;
        busy: boolean;
        ondiff: (subject: DiffSubject, label: string) => void;
        onremove: (path: string, label: string) => void;
        onmerge: (branch: string, onto: string) => void;
        onterminal: (path: string, label: string) => void;
        oncreate: (name: string) => void;
    };

    let { root, git, busy, ondiff, onremove, onmerge, onterminal, oncreate }: Props = $props();

    let name = $state('');

    const planned = $derived(name.trim() === '' ? '' : plannedPath(root, name));
    const others = $derived(git.worktrees.filter((one) => !one.main));

    function made(): void {
        const wanted = name.trim();
        if (wanted === '') return;
        name = '';
        oncreate(wanted);
    }
</script>

<div class="group" data-group="worktrees">
    <div class="group-h"><span>{t('repositories.worktrees')}</span></div>
    {#if !git.ignoresWorktrees}
        <p class="warn">{t('repositories.worktrees_unignored')}</p>
    {/if}
    {#if others.length === 0}
        <p class="none">{t('repositories.worktrees_empty')}</p>
    {:else}
        <ul class="list">
            {#each others as tree (tree.path)}
                {@const label = worktreeLabel(root, tree.path)}
                <li class="row" data-entry={tree.path}>
                    <span class="nm" title={tree.path}>{elide(label)}</span>
                    <span class="br">
                        {tree.branch === '' ? t('repositories.worktree_detached') : tree.branch}
                    </span>
                    <span class="acts">
                        <ToolButton
                            label={t('repositories.diff')}
                            title={t('repositories.diff_worktree_title')}
                            onclick={() =>
                                ondiff(
                                    { root, path: tree.path, staged: false, worktree: true },
                                    label
                                )}
                        />
                        <ToolButton
                            label={t('repositories.terminal')}
                            title={t('repositories.terminal_title')}
                            onclick={() => onterminal(tree.path, label)}
                        />
                        <ToolButton
                            label={t('repositories.merge')}
                            title={git.detached
                                ? t('repositories.merge_detached')
                                : t('repositories.merge_title')}
                            disabled={busy || tree.branch === '' || git.detached}
                            onclick={() => onmerge(tree.branch, git.branch)}
                        />
                        <ToolButton
                            label={t('repositories.remove')}
                            title={t('repositories.remove_title')}
                            disabled={busy}
                            onclick={() => onremove(tree.path, label)}
                        />
                    </span>
                </li>
            {/each}
        </ul>
    {/if}
    <div class="add">
        <span class="lb">{t('repositories.worktree_new')}</span>
        <TextInput
            value={name}
            label={t('repositories.worktree_new_label')}
            oninput={(next: string) => (name = next)}
        />
        <ToolButton label={t('repositories.worktree_new_create')} disabled={busy} onclick={made} />
    </div>
    {#if planned !== ''}
        <p class="none">{t('repositories.worktree_path', planned)}</p>
    {/if}
</div>

<style>
    .group-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
    }
    .group {
        margin-top: 8px;
    }
    .list {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }
    .nm {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .br {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .acts {
        flex: 0 0 auto;
        display: flex;
        gap: 2px;
        margin-left: auto;
    }
    .add {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 4px;
        font-size: var(--fs-sm);
    }
    .add .lb {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .none {
        margin: 2px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .warn {
        margin: 2px 0 0;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-xs);
    }
</style>
