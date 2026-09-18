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
    // Layer 3, view. One repository at a time, read like a source control view: a picker over every
    // root of the `git` channel, each named by its last folder or, where two share it, by its last
    // two, and under it the one picked, with its changes, its commits, its branches and its
    // worktrees as collapsible sections of explorer rows.
    //
    // The picker offers every root, not the repositories among them, and each row carries the few
    // words its state comes to (`views/shared/repo-shape.ts`'s shapeBadge), the row's hover words
    // being its path and the badge's own git's reason: a folder of notes, a repository whose read
    // failed and a folder the reader has deleted all stay in the list and say which they are. A root that went quiet is a
    // fact about that root, so the view neither drops it from the list nor hands itself to another
    // one, and repositories/Repo.svelte draws the one sentence that state comes to in place of the
    // sections.
    //
    // Which repository is shown and which sections are closed are the instance's own state, so the
    // view comes back as it was left after a tab switch, and a repository the picker no longer offers
    // hands the view to the first one it does.
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
    import Menu from '$lib/ui/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu-items';
    import Pane from '$lib/ui/Pane.svelte';
    import Repo from './repositories/Repo.svelte';
    import { toggleExpanded } from '$lib/state/fs';
    import {
        pickerRoots,
        plannedPath,
        repositoriesViewOf,
        repositoryLabels,
        shownRoot,
        type RepositoriesView
    } from '$lib/state/repositories';
    import { t } from '$lib/state/text';
    import { repoShape, shapeBadge } from '$lib/views/shared/repo-shape';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        repositories,
        selectors: { gitFor, gitRoots },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    type Ask = { message: string; detail: string; act: () => void };

    const roots = $derived(pickerRoots(gitRoots(), gitFor));
    const labels = $derived(repositoryLabels(roots));
    const view = $derived(repositoriesViewOf(instanceState(instance.id)));
    const shown = $derived(shownRoot(roots, view.root));
    const held = $derived(gitFor(shown));
    const choices = $derived<MenuItem[]>(
        roots.map((root) => ({
            id: root,
            label: labels[root],
            title: root,
            active: root === shown,
            badge: shapeBadge(repoShape(root, gitFor(root))),
            badgeTitle: gitFor(root)?.error ?? undefined
        }))
    );
    let asking: Ask | null = $state(null);

    /** Write part of what this instance remembers, keeping the rest of it as it was. */
    function patch(part: Partial<RepositoriesView>): void {
        const kept = instanceState(instance.id);
        const keep = typeof kept === 'object' && kept !== null && !Array.isArray(kept) ? kept : {};
        setInstanceState(instance.id, { ...keep, ...part });
    }

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
            <div class="picker" data-repo-picker>
                <Menu
                    label={labels[shown] ?? ''}
                    glyph="repositories"
                    items={choices}
                    placement="down"
                    onpick={(root: string) => patch({ root })}
                />
            </div>
            {#if held !== null}
                {#key shown}
                    <Repo
                        root={shown}
                        git={held}
                        busy={repositories.busy(shown)}
                        outcome={repositories.outcome(shown)}
                        collapsed={view.collapsed}
                        ontoggle={(id: string) =>
                            patch({ collapsed: toggleExpanded(view.collapsed, id) })}
                        onstage={(path: string) => void repositories.stage(shown, path)}
                        onunstage={(path: string) => void repositories.unstage(shown, path)}
                        ondiscard={(path: string) => discardPath(shown, path)}
                        ondiff={repositories.openDiff}
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
        gap: 6px;
        min-width: 0;
    }

    .picker {
        display: flex;
        min-width: 0;
    }
</style>
