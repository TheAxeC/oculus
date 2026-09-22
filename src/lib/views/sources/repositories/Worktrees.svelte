<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. The worktrees of one
    // repository as a section: one explorer row per worktree, pressing it opening what the worktree
    // holds that the repository does not, with its diff, its shell, its merge back and its removal
    // as the row's controls, and the row another worktree is named on, whose visible label is the
    // name of its field. An empty section, the warning and the planned path are each one muted row
    // in the row geometry.
    //
    // A worktree goes under the repository's own worktrees folder, and the path is said before the
    // control is pressed, so nothing is made somewhere the reader did not see. A repository whose
    // .gitignore does not keep that folder out of its history is warned about here rather than
    // edited: what a repository ignores is its owner's to decide.
    //
    // The checkout itself is not a row: it is not a worktree to remove, to merge back, or to open a
    // diff of. The merge back is offered only while the repository has a branch checked out, since
    // a detached HEAD has nothing to merge into.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { plannedPath, worktreeLabel, type DiffSubject } from '$lib/state/sources/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/words/text';

    type Props = {
        root: string;
        git: GitState;
        nav: TreeNav;
        busy: boolean;
        open: boolean;
        ontoggle: () => void;
        ondiff: (subject: DiffSubject, label: string) => void;
        onremove: (path: string, label: string) => void;
        onmerge: (branch: string, onto: string) => void;
        onterminal: (path: string, label: string) => void;
        oncreate: (name: string) => void;
    };

    let {
        root,
        git,
        nav,
        busy,
        open,
        ontoggle,
        ondiff,
        onremove,
        onmerge,
        onterminal,
        oncreate
    }: Props = $props();

    let name = $state('');

    const planned = $derived(name.trim() === '' ? '' : plannedPath(root, name));
    const others = $derived(git.worktrees.filter((one) => !one.main));

    function made(): void {
        const wanted = name.trim();
        if (wanted === '') return;
        name = '';
        oncreate(wanted);
    }

    function diff(path: string, label: string): void {
        ondiff({ root, path, staged: false, worktree: true }, label);
    }
</script>

<div data-group="worktrees">
    <TreeSection
        label={t('repositories.worktrees')}
        id="worktrees"
        {nav}
        count={others.length}
        {open}
        {ontoggle}
    >
        {#if !git.ignoresWorktrees}
            <li role="none">
                <TreeItem label={t('repositories.worktrees_unignored')} tone="warn" />
            </li>
        {/if}
        {#if others.length === 0}
            <li role="none">
                <TreeItem label={t('repositories.worktrees_empty')} tone="muted" />
            </li>
        {/if}
        {#each others as tree (tree.path)}
            {@const label = worktreeLabel(root, tree.path)}
            <li role="none" data-entry={tree.path}>
                <TreeItem
                    {label}
                    id={`worktree:${tree.path}`}
                    {nav}
                    level={2}
                    glyph="worktree"
                    title={tree.path}
                    onclick={() => diff(tree.path, label)}
                >
                    {#snippet detail()}
                        {tree.branch === '' ? t('repositories.worktree_detached') : tree.branch}
                    {/snippet}
                    {#snippet actions(reach: number)}
                        <ToolButton
                            label={t('repositories.diff')}
                            title={t('repositories.diff_worktree_title')}
                            glyph="diff"
                            compact
                            tabindex={reach}
                            onclick={() => diff(tree.path, label)}
                        />
                        <ToolButton
                            label={t('repositories.terminal')}
                            title={t('repositories.terminal_title')}
                            glyph="terminal"
                            compact
                            tabindex={reach}
                            onclick={() => onterminal(tree.path, label)}
                        />
                        <ToolButton
                            label={t('repositories.merge')}
                            title={git.detached
                                ? t('repositories.merge_detached')
                                : t('repositories.merge_title')}
                            glyph="merge"
                            compact
                            tabindex={reach}
                            disabled={busy || tree.branch === '' || git.detached}
                            onclick={() => onmerge(tree.branch, git.branch)}
                        />
                        <ToolButton
                            label={t('repositories.remove')}
                            title={t('repositories.remove_title')}
                            glyph="trash"
                            compact
                            tabindex={reach}
                            disabled={busy}
                            onclick={() => onremove(tree.path, label)}
                        />
                    {/snippet}
                </TreeItem>
            </li>
        {/each}
        <li role="none" data-form="worktree">
            <TreeItem label={t('repositories.worktree_new')} glyph="worktree">
                {#snippet field()}
                    <TextInput
                        value={name}
                        label={t('repositories.worktree_new')}
                        oninput={(next: string) => (name = next)}
                    />
                    <ToolButton
                        label={t('repositories.worktree_new_create')}
                        glyph="check"
                        compact
                        disabled={busy}
                        onclick={made}
                    />
                {/snippet}
            </TreeItem>
        </li>
        {#if planned !== ''}
            <li role="none">
                <TreeItem label={t('repositories.worktree_path', planned)} tone="muted" />
            </li>
        {/if}
    </TreeSection>
</div>
