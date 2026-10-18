<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. VS Code's Source Control
    // Repositories section: one row per root of the `git` channel, the chosen one drawn as the one
    // in force. Pressing a row chooses it, which the view keeps as its instance state. The section
    // folds like every other, and its rows stand one step in from its head.
    //
    // A readable repository's row carries, always drawn and at its right, the Branch control (the
    // branch's glyph and name, or for a detached HEAD the first 8 characters of HEAD's commit, cut
    // when the row is narrow, the whole name as its hover words), then the Sync control (the sync
    // glyph, the behind count and the ahead count, each with its arrow when above 0, and the
    // distance as its hover words) or, for a branch with no upstream that can be published, Publish
    // Branch, then the number of changed paths as a badge, and last the `...` menu of the row (the
    // items of its right-click menu). The Branch, Sync and Publish controls give way before the
    // repository's name does; the badge and the `...` keep their room. Sync and Publish ask the
    // question the view's `...` menu asks and press through the same store call; the Branch control
    // asks the view to show the repository and open its Branches section. Branch, Sync and Publish
    // are disabled while a write runs on the repository, and say what runs as their hover words:
    // the words of the action, or Working for an action that says none. While an action that says
    // words of its own runs on any root of the repository, a moving line is laid along the foot of
    // the row, over it so the row keeps its height and passing the pointer through to the row, with
    // those words as its name; under the system's reduce-motion setting it is drawn still.
    //
    // A root that is no repository, that is gone or whose read failed keeps its row, with the few
    // words and the tone of views/shared/changes/repo-shape.ts at its end and git's reason as
    // their hover words, so a reader sees why a root has nothing to show before choosing it.
    //
    // A row opens a right-click menu (menus/repo-menu.ts) of a shell in the repository and Reveal
    // in Finder, Open Containing Folder off macOS (for a folder that is there), then Close
    // Repository and, while more than one is listed, Close Other Repositories. The view answers
    // them: a closed repository leaves this list for the tab and comes back through Reopen Closed
    // Repositories. A readable row draws the same items under its `...` control.
    //
    // The source controls of the apps' hosts follow the repositories, one row each
    // (apps/AppSourceItem.svelte); pressing one shows it in place of a repository.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Progress from '$lib/ui/display/meters/Progress.svelte';
    import AppSourceItem from './apps/AppSourceItem.svelte';
    import { repoPick, repoRowMenu } from './menus/repo-menu';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import {
        canPublish,
        changeCount,
        publishWords,
        repoShape,
        syncWords,
        tracksUpstream
    } from '$lib/state/sources/repositories/repositories';
    import { repoListRows } from '$lib/state/sources/repositories/change-tree';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { scmKey } from '$lib/state/system/apps/tools/scm.svelte';
    import type { AppScmState } from '$lib/state/system/apps/tools/scm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { branchState } from '$lib/views/shared/changes/branch-state';
    import { branchOf, branchTitle } from './repo/branch-words';
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
        /** A repository's folder revealed in Finder, or in the file manager off macOS. */
        onreveal: (root: string) => void;
        /** A repository closed in this tab. */
        onclose: (root: string) => void;
        /** Every other repository closed in this tab. */
        oncloseothers: (root: string) => void;
        /** The source controls the apps' hosts created, listed after the repositories. */
        sources: AppScmState[];
        /** The key of the source control the view shows, or the empty string. */
        source: string;
        /** A source control was pressed: show it in place of a repository. */
        onsource: (key: string) => void;
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
        onreveal,
        onclose,
        oncloseothers,
        sources,
        source,
        onsource
    }: Props = $props();

    const { repositories, selectors } = useState();

    /** A pick from a repository row's menu. */
    function picked(root: string, pick: string): void {
        const asked = repoPick(pick);
        if (asked === 'terminal') onterminal(root);
        else if (asked === 'reveal') onreveal(root);
        else if (asked === 'close') onclose(root);
        else if (asked === 'close-others') oncloseothers(root);
    }

    const rows = $derived(
        repoListRows(
            roots,
            collapsed,
            sources.map((one) => scmKey(one.app, one.id))
        )
    );

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
                count={roots.length + sources.length}
                open={!collapsed.includes('repos')}
                ontoggle={() => ontoggle('repos')}
            >
                {#each roots as root (root)}
                    {@const git = stateOf(root)}
                    {@const shape = repoShape(root, git)}
                    {@const readable = shape === 'readable' && git !== null}
                    {@const count = git === null || !readable ? 0 : changeCount(git)}
                    {@const running = repositories.running(selectors.rootsOfRepository(root))}
                    <li role="none" data-repo-row={root}>
                        <ContextMenu
                            label={labels[root] ?? root}
                            items={repoRowMenu(
                                shape !== 'missing' && shape !== 'unplaced',
                                roots.length,
                                t
                            )}
                            onpick={(pick: string) => picked(root, pick)}
                        >
                            <TreeItem
                                label={labels[root] ?? root}
                                id={`repo:${root}`}
                                {nav}
                                level={2}
                                depth={1}
                                glyph="repositories"
                                title={root}
                                current={root === shown}
                                count={count > 0 ? count : undefined}
                                badge
                                countTitle={count === 1
                                    ? t('repositories.list_changes_one')
                                    : t('repositories.list_changes', count)}
                                nameStyle="font-weight: 400"
                                showActions={readable}
                                yielding={readable}
                                onclick={() => onpick(root)}
                            >
                                {#snippet actions(reach: number)}
                                    {#if git !== null && readable}
                                        {@const working = repositories.busy(root)}
                                        {@const words = working ? repositories.busyWords(root) : ''}
                                        <ToolButton
                                            label={branchOf(git)}
                                            title={working ? words : branchTitle(git)}
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
                                                title={working ? words : branchState(git)}
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
                                                title={working ? words : t('repositories.publish')}
                                                glyph="publish"
                                                compact
                                                tabindex={reach}
                                                disabled={working}
                                                onclick={() => publish(root, git)}
                                            />
                                        {/if}
                                    {/if}
                                {/snippet}
                                {#snippet after(reach: number)}
                                    {#if git !== null && readable}
                                        <Menu
                                            label={t('ui.row_menu')}
                                            glyph="more"
                                            compact
                                            bare
                                            placement="down"
                                            align="right"
                                            items={repoRowMenu(true, roots.length, t)}
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
                        {#if running !== null}
                            <div class="running">
                                <Progress percent={null} label={running.words} />
                            </div>
                        {/if}
                    </li>
                {/each}
                {#each sources as one (scmKey(one.app, one.id))}
                    <AppSourceItem
                        control={one}
                        {nav}
                        current={source === scmKey(one.app, one.id)}
                        onpick={() => onsource(scmKey(one.app, one.id))}
                    />
                {/each}
            </TreeSection>
        </div>
    {/snippet}
</TreeView>

<style>
    /* The row's own box, so its moving line is laid along the row's foot. */
    [data-repo-row] {
        position: relative;
    }

    .running {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        pointer-events: none;
    }

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
