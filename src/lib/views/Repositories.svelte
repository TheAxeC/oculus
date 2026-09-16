<script module lang="ts">
    // Layer 3, view registration. Repositories sits in the rail's Sources section, after the file
    // browser: the same roots, read as repositories rather than as folders.
    import type { ViewRegistration } from './registry';

    export const registration: ViewRegistration = {
        id: 'repositories',
        label: 'views.repositories',
        glyph: 'views.repositories_glyph',
        group: 'sources',
        order: 5
    };
</script>

<script lang="ts">
    // Layer 3, view. Every root the `git` channel carries, one section each: the branch line, the
    // three change groups, the newest commits, the branches, and the worktrees of the root.
    //
    // The state is the channel's, pushed, so nothing here polls: a commit made in a terminal moves
    // the section within the watcher's two seconds. The one thing the channel does not carry is a
    // diff, which is text rather than state and is read when a pane opens it, so a repository with
    // two hundred changed files costs the socket nothing.
    //
    // What a press does is state/repositories.svelte.ts's, which holds which roots have a write in
    // flight and what the last write on each answered; this file draws that and owns the confirm
    // dialog, which is the one part of a press that is a dialog rather than a fact.

    import Confirm from '$lib/ui/Confirm.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Repo from './repositories/Repo.svelte';
    import { plannedPath } from '$lib/state/repositories';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        repositories,
        selectors: { gitFor, gitRoots }
    } = useState();

    let { instance }: ViewProps = $props();

    type Ask = { message: string; detail: string; act: () => void };

    const roots = $derived(gitRoots());
    let asking: Ask | null = $state(null);

    function ask(message: string, detail: string, act: () => void): void {
        asking = { message, detail, act };
    }

    function answered(): void {
        const held = asking;
        asking = null;
        held?.act();
    }

    function discardPath(root: string, path: string): void {
        ask(t('git.discard_confirm', path), t('git.discard_detail'), () => {
            void repositories.discard(root, path);
        });
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

    function mergeBack(root: string, branch: string, onto: string): void {
        ask(t('repositories.merge_confirm', branch, onto), t('repositories.merge_detail'), () => {
            void repositories.merge(root, branch);
        });
    }
</script>

<Pane title={t('views.repositories')} tinted>
    <div class="repos" data-instance={instance.id} data-view="repositories">
        {#if roots.length === 0}
            <Empty message={t('repositories.empty')} glyph={t('repositories.empty_glyph')} />
        {:else}
            {#each roots as root (root)}
                {@const held = gitFor(root)}
                {#if held !== null}
                    <Repo
                        {root}
                        git={held}
                        busy={repositories.busy(root)}
                        outcome={repositories.outcome(root)}
                        onstage={(path: string) => void repositories.stage(root, path)}
                        onunstage={(path: string) => void repositories.unstage(root, path)}
                        ondiscard={(path: string) => discardPath(root, path)}
                        ondiff={repositories.openDiff}
                        onswitch={(name: string) => switchTo(root, name)}
                        onbranch={(name: string) => createBranch(root, name)}
                        onworktree={(name: string) => createWorktree(root, name)}
                        onremove={(path: string, label: string) =>
                            removeWorktree(root, path, label)}
                        onmerge={(branch: string, onto: string) => mergeBack(root, branch, onto)}
                        onterminal={(path: string, label: string) =>
                            void repositories.shellIn(root, path, label)}
                    />
                {/if}
            {/each}
        {/if}
    </div>
</Pane>

{#if asking !== null}
    <Confirm
        message={asking.message}
        detail={asking.detail}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={answered}
        oncancel={() => (asking = null)}
    />
{/if}

<style>
    .repos {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
</style>
