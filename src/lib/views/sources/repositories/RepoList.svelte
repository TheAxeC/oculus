<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. VS Code's Source Control
    // Repositories section: one row per root of the `git` channel, the chosen one drawn as the one
    // in force. Pressing a row chooses it, which the view keeps as its instance state. The section
    // folds like every other.
    //
    // A readable repository's row carries, always drawn and at its right, the Branch control (the
    // branch's glyph and name, cut when the row is narrow, the whole name as its hover words), then
    // the Sync control (the sync glyph, the behind count and the ahead count, each with its arrow
    // when above 0, and the distance as its hover words) or, for a branch with no upstream that can
    // be published, Publish Branch, then the `...` menu of the row (the items of its right-click
    // menu) and the number of changed paths as a badge. The controls give way before the
    // repository's name does. Sync and Publish ask the question the view's `...` menu asks and
    // press through the same store call; the Branch control asks the view to show the repository
    // and open its Branches section. Branch, Sync and Publish are disabled while a write runs on
    // the repository.
    //
    // A root that is no repository, that is gone or whose read failed keeps its row, with the few
    // words and the tone of views/shared/changes/repo-shape.ts at its end and git's reason as
    // their hover words, so a reader sees why a root has nothing to show before choosing it.
    //
    // A row whose folder is there opens a right-click menu (menus/repo-menu.ts) of a shell in the
    // repository and Reveal in Finder, which the view answers; a readable row draws the same items
    // under its `...` control.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { REPO_REVEAL, REPO_TERMINAL, repoRowMenu } from './menus/repo-menu';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import {
        canPublish,
        changeCount,
        publishWords,
        repoListRows,
        repoShape,
        syncWords,
        tracksUpstream
    } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { branchState } from '$lib/views/shared/changes/branch-state';
    import { shapeBadge, shapeBadgeTone } from '$lib/views/shared/changes/repo-shape';

    type Props = {
        roots: string[];
        labels: Record<string, string>;
        shown: string;
        stateOf: (root: string) => GitState | null;
        collapsed: string[];
        ontoggle: (id: string) => void;
        onpick: (root: string) => void;
        /** The Branch control of a row: show that repository and open its Branches section. */
        onbranch: (root: string) => void;
        /** Ask a question, then run what it is about on a yes. */
        ask: (message: string, detail: string, act: () => void) => void;
        /** A shell started in a repository's folder. */
        onterminal: (root: string) => void;
        /** A repository's folder revealed in Finder. */
        onreveal: (root: string) => void;
    };

    let {
        roots,
        labels,
        shown,
        stateOf,
        collapsed,
        ontoggle,
        onpick,
        onbranch,
        ask,
        onterminal,
        onreveal
    }: Props = $props();

    const { repositories } = useState();

    /** A pick from a repository row's menu. */
    function picked(root: string, pick: string): void {
        if (pick === REPO_TERMINAL) onterminal(root);
        else if (pick === REPO_REVEAL) onreveal(root);
    }

    const rows = $derived(repoListRows(roots, collapsed));

    /** The branch a row names: the detached sentence for a detached HEAD. */
    function branchOf(git: GitState): string {
        return git.detached ? t('sessions.ch_detached') : git.branch;
    }

    function sync(root: string, git: GitState): void {
        const words = syncWords(git);
        ask(words.message, words.detail, () => void repositories.sync(root));
    }

    function publish(root: string, git: GitState): void {
        const remote = git.remotes[0];
        const words = publishWords(git, remote);
        ask(words.message, words.detail, () => void repositories.publish(root, remote));
    }
</script>

<TreeView label={t('repositories.list')} {rows} {ontoggle}>
    {#snippet children(nav: TreeNav)}
        <div data-group="repos">
            <TreeSection
                label={t('repositories.list')}
                id="repos"
                {nav}
                count={roots.length}
                open={!collapsed.includes('repos')}
                ontoggle={() => ontoggle('repos')}
            >
                {#each roots as root (root)}
                    {@const git = stateOf(root)}
                    {@const shape = repoShape(root, git)}
                    {@const readable = shape === 'readable' && git !== null}
                    {@const count = git === null || !readable ? 0 : changeCount(git)}
                    <li role="none" data-repo-row={root}>
                        <ContextMenu
                            label={labels[root] ?? root}
                            items={repoRowMenu(shape !== 'missing' && shape !== 'unplaced', t)}
                            onpick={(pick: string) => picked(root, pick)}
                        >
                            <TreeItem
                                label={labels[root] ?? root}
                                id={`repo:${root}`}
                                {nav}
                                level={2}
                                glyph="repositories"
                                title={root}
                                current={root === shown}
                                count={count > 0 ? count : undefined}
                                badge
                                countTitle={t('repositories.list_changes', count)}
                                nameStyle="font-weight: 400"
                                showActions={readable}
                                yielding={readable}
                                onclick={() => onpick(root)}
                            >
                                {#snippet actions(reach: number)}
                                    {#if git !== null && readable}
                                        {@const working = repositories.busy(root)}
                                        <ToolButton
                                            label={branchOf(git)}
                                            title={working ? t('git.busy') : branchOf(git)}
                                            glyph="branch"
                                            small
                                            cut
                                            tabindex={reach}
                                            disabled={working}
                                            onclick={() => onbranch(root)}
                                        />
                                        {#if tracksUpstream(git)}
                                            <ToolButton
                                                label={branchState(git)}
                                                title={working ? t('git.busy') : branchState(git)}
                                                glyph="sync"
                                                small
                                                tabindex={reach}
                                                disabled={working}
                                                onclick={() => sync(root, git)}
                                            >
                                                {#if git.behind > 0}
                                                    <span class="steps"
                                                        >{git.behind}<Glyph name="behind" /></span
                                                    >
                                                {/if}
                                                {#if git.ahead > 0}
                                                    <span class="steps"
                                                        >{git.ahead}<Glyph name="ahead" /></span
                                                    >
                                                {/if}
                                            </ToolButton>
                                        {:else if canPublish(git)}
                                            <ToolButton
                                                label={t('repositories.publish')}
                                                title={working
                                                    ? t('git.busy')
                                                    : t('repositories.publish')}
                                                glyph="publish"
                                                compact
                                                tabindex={reach}
                                                disabled={working}
                                                onclick={() => publish(root, git)}
                                            />
                                        {/if}
                                        <Menu
                                            label={t('ui.row_menu')}
                                            glyph="more"
                                            compact
                                            bare
                                            placement="down"
                                            align="right"
                                            items={repoRowMenu(true, t)}
                                            tabindex={reach}
                                            onpick={(pick: string) => picked(root, pick)}
                                        />
                                    {/if}
                                {/snippet}
                                {#snippet end()}
                                    {#if !readable}
                                        <span
                                            class="shape"
                                            style={`--tone-txt: var(--c-${shapeBadgeTone(shape) ?? 'grey'}-txt)`}
                                            title={git?.error ?? undefined}
                                            >{shapeBadge(shape)}</span
                                        >
                                    {/if}
                                {/snippet}
                            </TreeItem>
                        </ContextMenu>
                    </li>
                {/each}
            </TreeSection>
        </div>
    {/snippet}
</TreeView>

<style>
    .shape {
        color: var(--tone-txt, var(--muted-txt));
    }

    .steps {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        margin-left: 4px;
    }
</style>
