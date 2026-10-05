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
    //
    // The new-worktree row makes the worktree and opens a shell in it (Create), or opens the
    // composer there for Claude or Codex (Create with Claude, Create with Codex). A worktree row
    // opens a right-click menu (menus/repo-menu.ts) of its shell, Start Claude Here, Start Codex
    // Here, Open Worktree, Open Worktree in New Window and Delete Worktree. The shell and the
    // removal run the row's own terminal and removal controls, the removal behind its question.
    // Open Worktree adds the worktree's folder as a root of the workspace and shows it in the Files
    // view (state/sources/repositories/repositories.ts's openWorktree), and the new-window form
    // opens this page's address again as well; a folder the workspace refuses is said in one muted
    // row under the section's rows until the next open.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import {
        WORKTREE_CLAUDE,
        WORKTREE_CODEX,
        WORKTREE_DELETE,
        WORKTREE_OPEN,
        WORKTREE_OPEN_WINDOW,
        REPO_TERMINAL,
        worktreeMenu
    } from '../menus/repo-menu';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        linkedWorktrees,
        openWorktree,
        plannedPath,
        worktreeLabel,
        type DiffSubject
    } from '$lib/state/sources/repositories/repositories';
    import type { WorktreeStart } from '$lib/state/sources/repositories/repositories.svelte';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

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
        /** Start Claude or Codex in an existing worktree. */
        onagent: (path: string, agent: 'claude' | 'codex') => void;
        oncreate: (name: string, start: WorktreeStart) => void;
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
        onagent,
        oncreate
    }: Props = $props();

    const {
        fs: { addRoot },
        layout: { showInFiles }
    } = useState();

    let name = $state('');
    /** Why the last Open Worktree was refused, or the empty string. */
    let refused = $state('');

    const planned = $derived(name.trim() === '' ? '' : plannedPath(root, name));
    const others = $derived(linkedWorktrees(git));

    function made(start: WorktreeStart): void {
        const wanted = name.trim();
        if (wanted === '') return;
        name = '';
        oncreate(wanted, start);
    }

    /** A pick from a worktree row's menu: what the row's own control of that name does. */
    function picked(path: string, label: string, pick: string): void {
        if (pick === REPO_TERMINAL) onterminal(path, label);
        else if (pick === WORKTREE_CLAUDE) onagent(path, 'claude');
        else if (pick === WORKTREE_CODEX) onagent(path, 'codex');
        else if (pick === WORKTREE_DELETE) onremove(path, label);
        else if (pick === WORKTREE_OPEN) void opened(path, false);
        else if (pick === WORKTREE_OPEN_WINDOW) void opened(path, true);
    }

    /** Add a worktree's folder to the workspace and show it in Files, in a new window if asked. */
    async function opened(path: string, newWindow: boolean): Promise<void> {
        refused = '';
        const answer = await openWorktree(path, newWindow, {
            addRoot,
            showInFiles: (dir: string) => showInFiles(dir),
            openWindow: (address: string) => void window.open(address, '_blank'),
            address: () => window.location.href
        });
        if (answer !== '') refused = t('repositories.worktree_open_failed', answer);
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
        badge
        {open}
        {ontoggle}
    >
        {#if !git.ignoresWorktrees}
            <li role="none">
                <TreeItem label={t('repositories.worktrees_unignored')} tone="warn" />
            </li>
        {/if}
        {#if refused !== ''}
            <li role="none" data-refused>
                <TreeItem label={refused} tone="error" />
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
                <ContextMenu
                    {label}
                    items={worktreeMenu(busy, t)}
                    onpick={(pick: string) => picked(tree.path, label, pick)}
                >
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
                </ContextMenu>
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
                        onclick={() => made('shell')}
                    />
                    <ToolButton
                        label={t('repositories.worktree_new_claude')}
                        title={t(
                            'repositories.worktree_new_agent_title',
                            t('sessions.kind_claude')
                        )}
                        glyph="terminal_claude"
                        compact
                        disabled={busy || name.trim() === ''}
                        onclick={() => made('claude')}
                    />
                    <ToolButton
                        label={t('repositories.worktree_new_codex')}
                        title={t('repositories.worktree_new_agent_title', t('sessions.kind_codex'))}
                        glyph="terminal_codex"
                        compact
                        disabled={busy || name.trim() === ''}
                        onclick={() => made('codex')}
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
