<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. VS Code's Source Control
    // Repositories section: one row per root of the `git` channel, each its name, its branch, how
    // far it is behind and ahead of its upstream and how many paths it has changed, the chosen one
    // drawn as the one in force. Pressing a row chooses it, which the view keeps as its instance
    // state. The section folds like every other.
    //
    // A root that is no repository, that is gone or whose read failed keeps its row, with the few
    // words and the tone of views/shared/changes/repo-shape.ts at its end and git's reason as the
    // badge's hover words, so a reader sees why a root has nothing to show before choosing it.
    //
    // A row whose folder is there opens a right-click menu (menus/repo-menu.ts) of a shell in the
    // repository and Reveal in Finder, which the view answers.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import { REPO_REVEAL, REPO_TERMINAL, repoRowMenu } from './menus/repo-menu';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import {
        changeCount,
        repoListRows,
        repoShape
    } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { shapeBadge, shapeBadgeTone } from '$lib/views/shared/changes/repo-shape';

    type Props = {
        roots: string[];
        labels: Record<string, string>;
        shown: string;
        stateOf: (root: string) => GitState | null;
        collapsed: string[];
        ontoggle: (id: string) => void;
        onpick: (root: string) => void;
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
        onterminal,
        onreveal
    }: Props = $props();

    /** A pick from a repository row's menu. */
    function picked(root: string, pick: string): void {
        if (pick === REPO_TERMINAL) onterminal(root);
        else if (pick === REPO_REVEAL) onreveal(root);
    }

    const rows = $derived(repoListRows(roots, collapsed));

    /** What a row says after its name: the branch and, for a repository that reads, its counts. */
    function detailOf(root: string, git: GitState | null): string {
        if (git === null || repoShape(root, git) !== 'readable') return '';
        const bits = [git.detached ? t('sessions.ch_detached') : git.branch];
        if (git.upstream === true) bits.push(t('repositories.list_sync', git.behind, git.ahead));
        return bits.join(' ');
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
                    {@const count = git === null || shape !== 'readable' ? 0 : changeCount(git)}
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
                                onclick={() => onpick(root)}
                            >
                                {#snippet detail()}
                                    {detailOf(root, git)}
                                {/snippet}
                                {#snippet end()}
                                    {#if shape !== 'readable'}
                                        <span
                                            class="badge"
                                            style={`--tone-txt: var(--c-${shapeBadgeTone(shape) ?? 'grey'}-txt)`}
                                            title={git?.error ?? undefined}
                                            >{shapeBadge(shape)}</span
                                        >
                                    {:else if count > 0}
                                        <span
                                            class="count"
                                            title={t('repositories.list_changes', count)}
                                            >{count}</span
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
    .badge {
        color: var(--tone-txt, var(--muted-txt));
    }

    .count {
        font-family: var(--font-num);
    }
</style>
