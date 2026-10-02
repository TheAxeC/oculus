<script module lang="ts">
    // Layer 3, view registration. Repositories follows the file browser in the Explorer page's
    // group: the same roots, read as repositories rather than as folders.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'repositories',
        label: 'views.repositories',
        glyph: 'views.repositories_glyph',
        group: 'explorer',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. VS Code's Source Control, one repository at a time: the Repositories section
    // listing every root of the `git` channel, each named by its last folder or, where two share
    // it, by its last two, and under it the one chosen, with its commit box, its changes, its
    // graph, its stashes, its tags, its branches and its worktrees.
    //
    // The list offers every root, not the repositories among them, and each row carries the few
    // words and tone its state comes to (views/shared/changes/repo-shape.ts), so a folder of notes,
    // a repository whose read failed and a folder the reader has deleted all stay in the list and
    // say which they are. A root that went quiet is a fact about that root, so the view neither
    // drops it from the list nor hands itself to another one, and repositories/Repo.svelte draws
    // the one sentence that state comes to in place of the sections.
    //
    // Which repository is shown, which sections and folders are closed, which commit of the graph
    // is open, the mode and the request the Branch control of a row makes for the Branches section
    // to open are the instance's own state, so the view comes back as it was left after a tab
    // switch, and a repository the list no longer offers hands the view to the first one it does.
    //
    // The header holds, whatever the state, a toggle between the list and the tree mode of the
    // changes (View as Tree, View as List; the list is the start) before its `...` menu, which
    // holds what VS Code's does: Pull, Push, Fetch, Sync and Publish Branch; the three stashes;
    // Create Tag and Push Tags. What asks first is asked here, in the one confirm dialog or, for
    // what needs words typed, in the prompt, and a yes presses through
    // state/sources/repositories/repositories.svelte.ts, which holds which roots have a write in
    // flight and what the last write on each answered.
    //
    // The state is the channel's, pushed, so nothing here polls: a commit made in a terminal moves
    // the sections within the watcher's two seconds. A diff, a page of the graph and a commit's
    // files are text rather than state and are read when a pane or a section asks for them.
    //
    // A repository row's right-click menu starts a shell in the repository through the store, as a
    // worktree's terminal control does, and reveals its folder in Finder through the open endpoint;
    // a reveal Finder refused is said on one line over the list until the next one.

    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import type { PromptRequest } from '$lib/ui/forms/prompt';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Repo from './Repo.svelte';
    import RepoList from './RepoList.svelte';
    import { toggleExpanded } from '$lib/state/sources/fs';
    import { prunedCollapsed } from '$lib/state/sources/repositories/change-tree';
    import {
        canPublish,
        pickerRoots,
        plannedPath,
        publishWords,
        pullWords,
        pushWords,
        repoShape,
        repositoriesViewOf,
        repositoryLabels,
        shownRoot,
        syncWords,
        upstreamOf,
        type RepositoriesView
    } from '$lib/state/sources/repositories/repositories';
    import type { StashMode } from '$lib/state/sources/repositories/repositories.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { instanceMap } from '$lib/state/workbench/layout';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { gitFor, gitRoots },
        ui: { instanceState, setInstanceState },
        writes: { openFolder }
    } = useState();

    let { instance }: ViewProps = $props();

    const roots = $derived(pickerRoots(gitRoots(), gitFor));
    const labels = $derived(repositoryLabels(roots));
    const view = $derived(repositoriesViewOf(instanceState(instance.id)));
    const shown = $derived(shownRoot(roots, view.root));
    const held = $derived(gitFor(shown));
    const readable = $derived(held !== null && repoShape(shown, held) === 'readable');
    let asking: Ask | null = $state(null);
    let prompting: PromptRequest | null = $state(null);
    /** What the last reveal of a repository's folder was refused with, or the empty string. */
    let refused = $state('');
    /** The reveals asked so far, so an answer a later one superseded is dropped. */
    let reveals = 0;

    /** Write part of what this instance remembers, keeping the rest of it as it was. */
    function patch(part: Partial<RepositoriesView>): void {
        setInstanceState(instance.id, { ...instanceMap(instanceState(instance.id)), ...part });
    }

    function ask(message: string, detail: string, act: () => void): void {
        asking = { message, detail, act };
    }

    /** Ask a question given as the words it is worded in. */
    function question(words: { message: string; detail: string }, act: () => void): void {
        ask(words.message, words.detail, act);
    }

    /** Open or close one section, group or folder, dropping the folders that no longer exist. */
    function toggled(id: string): void {
        const next = toggleExpanded(view.collapsed, id);
        patch({
            collapsed: held === null ? next : prunedCollapsed(next, shown, held, view.commit)
        });
    }

    /**
     * Show a repository and ask it to open its Branches section with the focus on its head. The
     * open commit of the graph stays while the repository is the one already shown.
     */
    function showBranches(root: string): void {
        const commit = root === shown ? view.commit : '';
        const opened = view.collapsed.filter((id) => id !== 'branches');
        const target = gitFor(root);
        patch({
            root,
            commit,
            reveal: 'branches',
            collapsed: target === null ? opened : prunedCollapsed(opened, root, target, commit)
        });
    }

    /** The `...` menu, in VS Code's groups, holding only what the repository can do now. */
    const menu = $derived.by<MenuGroup[]>(() => {
        if (held === null || !readable) return [];
        const upstream = upstreamOf(held);
        const remote = [
            { id: 'pull', label: t('repositories.pull'), glyph: 'pull' },
            { id: 'push', label: t('git.push'), glyph: 'push' },
            { id: 'fetch', label: t('repositories.fetch'), glyph: 'fetch' },
            { id: 'sync', label: t('repositories.sync'), glyph: 'sync' }
        ].filter((item) => item.id === 'fetch' || upstream !== '');
        const remotes: MenuItem[] = [...remote];
        // Publish Branch names its remote, one choice per remote the repository has.
        if (canPublish(held)) {
            for (const name of held.remotes) {
                remotes.push({
                    id: `publish:${name}`,
                    label: t('repositories.publish_to', name),
                    glyph: 'publish'
                });
            }
        }
        return [
            { id: 'remote', heading: t('repositories.menu_remote'), items: remotes },
            {
                id: 'stash',
                heading: t('repositories.menu_stash'),
                items: [
                    { id: 'tracked', label: t('repositories.stash_tracked'), glyph: 'stash' },
                    { id: 'untracked', label: t('repositories.stash_untracked'), glyph: 'stash' },
                    { id: 'staged', label: t('repositories.stash_staged'), glyph: 'stash' }
                ]
            },
            {
                id: 'tags',
                heading: t('repositories.menu_tags'),
                items: [
                    { id: 'create', label: t('repositories.tag_create'), glyph: 'tag' },
                    { id: 'push', label: t('repositories.tags_push'), glyph: 'push' }
                ]
            }
        ];
    });

    function picked(id: string, _event: MouseEvent, group?: string): void {
        if (held === null) return;
        const root = shown;
        const git = held;
        if (group === 'stash') {
            stash(root, id as StashMode);
        } else if (group === 'tags') {
            if (id === 'create') createTag(root);
            else
                ask(t('repositories.tags_push_confirm'), t('repositories.tags_push_detail'), () => {
                    void repositories.pushTags(root);
                });
        } else if (id === 'fetch') {
            void repositories.fetch(root);
        } else if (id === 'pull') {
            question(pullWords(git), () => void repositories.pull(root));
        } else if (id === 'push') {
            question(pushWords(git), () => void repositories.push(root));
        } else if (id === 'sync') {
            question(syncWords(git), () => void repositories.sync(root));
        } else if (id.startsWith('publish:')) {
            const remote = id.slice('publish:'.length);
            question(publishWords(git, remote), () => void repositories.publish(root, remote));
        }
    }

    function stash(root: string, mode: StashMode): void {
        const verbs: Record<StashMode, string> = {
            tracked: t('repositories.stash_tracked'),
            untracked: t('repositories.stash_untracked'),
            staged: t('repositories.stash_staged')
        };
        prompting = {
            message: verbs[mode],
            detail: t('repositories.stash_message_detail'),
            fields: [{ label: t('repositories.stash_message'), value: '' }],
            verb: t('repositories.stash_do'),
            act: ([message = '']) => {
                prompting = null;
                void repositories.stash(root, mode, message);
            }
        };
    }

    function createTag(root: string): void {
        prompting = {
            message: t('repositories.tag_create'),
            detail: t('repositories.tag_create_detail'),
            fields: [
                { label: t('repositories.tag_name'), value: '' },
                { label: t('repositories.tag_message'), value: '' }
            ],
            verb: t('repositories.tag_do'),
            act: ([name = '', message = '']) => {
                prompting = null;
                void repositories.createTag(root, name.trim(), message);
            }
        };
    }

    function switchTo(root: string, name: string): void {
        ask(t('git.branch_switch_confirm', name), t('git.branch_switch_detail'), () => {
            void repositories.switchBranch(root, name);
        });
    }

    function createBranch(root: string, name: string): void {
        ask(t('git.branch_new_confirm', name), t('git.branch_switch_detail'), () => {
            void repositories.createBranch(root, name);
        });
    }

    function createWorktree(root: string, name: string): void {
        ask(
            t('repositories.worktree_new_confirm', name),
            t('repositories.worktree_new_detail', plannedPath(root, name)),
            () => {
                void repositories.createWorktree(root, name);
            }
        );
    }

    function removeWorktree(root: string, path: string, label: string): void {
        ask(t('repositories.remove_confirm', label), t('repositories.remove_detail'), () => {
            void repositories.removeWorktree(root, path);
        });
    }

    async function reveal(root: string): Promise<void> {
        reveals += 1;
        const mine = reveals;
        refused = '';
        const answer = await openFolder(root);
        if (mine !== reveals || answer.ok) return;
        refused = t('repositories.reveal_failed', answer.error ?? '');
    }

    function mergeBack(root: string, branch: string, onto: string): void {
        ask(t('repositories.merge_confirm', branch, onto), t('repositories.merge_detail'), () => {
            void repositories.merge(root, branch);
        });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('views.repositories')} overflow>
        {#if view.mode === 'tree'}
            <ToolButton
                label={t('repositories.view_list')}
                glyph="list"
                compact
                bare
                onclick={() => patch({ mode: 'list' })}
            />
        {:else}
            <ToolButton
                label={t('repositories.view_tree')}
                glyph="view_tree"
                compact
                bare
                onclick={() => patch({ mode: 'tree' })}
            />
        {/if}
        {#if menu.length > 0}
            <span data-repo-menu>
                <Menu
                    label={t('repositories.menu')}
                    glyph="more"
                    compact
                    bare
                    placement="down"
                    align="right"
                    items={[]}
                    groups={menu}
                    onpick={picked}
                />
            </span>
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('views.repositories')} toolbar={tools} tinted>
    <div class="repos" data-instance={instance.id} data-view="repositories">
        {#if roots.length === 0}
            <Empty message={t('repositories.empty')} glyph={t('repositories.empty_glyph')} />
        {:else}
            {#if refused !== ''}
                <Empty error message={refused} />
            {/if}
            <RepoList
                {roots}
                {labels}
                {shown}
                stateOf={gitFor}
                collapsed={view.collapsed}
                ontoggle={toggled}
                onpick={(root: string) => patch({ root, commit: '' })}
                onbranch={showBranches}
                {ask}
                onterminal={(root: string) =>
                    void repositories.shellIn(root, root, labels[root] ?? root)}
                onreveal={(root: string) => void reveal(root)}
            />
            {#if held !== null}
                {#key shown}
                    <Repo
                        root={shown}
                        git={held}
                        collapsed={view.collapsed}
                        commit={view.commit}
                        ontoggle={toggled}
                        oncommit={(hash: string) => patch({ commit: hash })}
                        mode={view.mode}
                        reveal={view.reveal}
                        onrevealed={() => patch({ reveal: '' })}
                        {ask}
                        onswitch={(name: string) => switchTo(shown, name)}
                        onbranch={(name: string) => createBranch(shown, name)}
                        onworktree={(name: string) => createWorktree(shown, name)}
                        onremove={(path: string, label: string) =>
                            removeWorktree(shown, path, label)}
                        onmerge={(branch: string, onto: string) => mergeBack(shown, branch, onto)}
                        onterminal={(path: string, label: string) =>
                            void repositories.shellIn(shown, path, label)}
                    />
                {/key}
            {/if}
        {/if}
    </div>
</Pane>

<AskConfirm {asking} onclose={() => (asking = null)} />

{#if prompting !== null}
    <Prompt
        request={prompting}
        cancel={t('ui.confirm_cancel')}
        oncancel={() => (prompting = null)}
    />
{/if}

<style>
    /* The icon controls of the rows draw 1px of padding round the 16px icon, and are a 20px box
       because the compact control's min-width and height are `--header-action`, with no border;
       the last part of a row (its count or status letter) sits 12px from the row's edge. */
    .repos {
        --tree-end-inset: 12px;
        --action-pad: 1px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }
</style>
