<script lang="ts">
    // Layer 3, shell. The status bar's repository, branch and sync items, for the repository the
    // bar follows (state/workbench/navigation/status.ts, `repoStatus`): the one holding the file of
    // the tab on screen, else the one holding the folder of the workbench on screen, else the one
    // last chosen here, else the hub's, as VS Code draws branch and sync for the active editor's
    // repository.
    //
    // The repository item names the repository and says in its tooltip which folder it is and why
    // it is the one followed. A press lists the repositories of the Files view and marks the one
    // followed; a pick is kept in the ui store and followed as soon as no file and no workbench
    // decides, which the list's heading says while one does. The branch item names the branch
    // checked out, or the commit a detached head is at, and opens a picker of the repository's
    // branches; a choice is checked out through the same confirm the Repositories view asks, since
    // the server takes a switch only with it. The sync item draws how far the branch is behind and
    // ahead of its upstream, once it has one, and a press synchronizes as VS Code's does: a branch
    // only ahead is pushed, and any other is pulled and then pushed, each after a confirm naming
    // the upstream. A branch with no upstream draws Publish Branch in the sync item's place, which
    // pushes it to a remote and makes that its upstream; with several remotes it lists them. A
    // write git refuses opens the Repositories view on the repository, whose line says why. The
    // writes are the page's, handed in, since the shell may not write.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { Portal } from 'bits-ui';
    import type {
        RepoChoice,
        RepoStatus,
        RepoWhy,
        StatusGit
    } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        ui: { setStatusRepository }
    } = useState();

    type Props = {
        repo: RepoStatus;
        git: StatusGit;
        /** The repositories the repository item lists. */
        choices: RepoChoice[];
        /** Whether each item is drawn, the reader having hidden none of them. */
        repository: boolean;
        branch: boolean;
        sync: boolean;
    };

    let { repo, git, choices: listed, repository, branch, sync }: Props = $props();

    /** A write waiting on the confirm: what it asks, the word of its button, and the write. */
    type Ask = { message: string; detail: string; verb: string; act: () => void };

    /** The repository item's glyph, the branch item's, and the commit's for a detached head. */
    const REPOSITORY_GLYPH = 'repositories';
    const BRANCH_GLYPH = 'branch';
    const DETACHED_GLYPH = 'commit';

    /** A pick of the repository item's list makes that repository the last chosen. */
    function chooseRepository(root: string): void {
        setStatusRepository(root);
    }

    /** The words that say why the repository is the one followed, by the rule that chose it. */
    function whyWords(why: RepoWhy): string {
        if (why === 'file') return t('statusbar.repository_why_file');
        if (why === 'workbench') return t('statusbar.repository_why_workbench');
        if (why === 'chosen') return t('statusbar.repository_why_chosen');
        return t('statusbar.repository_why_hub');
    }

    /** The picker's heading: what a pick comes to while a file or workbench decides. */
    function headingWords(why: RepoWhy): string {
        if (why === 'file') return t('statusbar.repository_heading_file');
        if (why === 'workbench') return t('statusbar.repository_heading_workbench');
        return t('statusbar.repository_heading');
    }

    /** The write waiting on the reader's confirm, or null when none is. */
    let asking: Ask | null = $state(null);

    /** The picker: one group, headed by what a pick comes to while a file or workbench decides. */
    const repositories = $derived<MenuGroup[]>([
        {
            id: 'repositories',
            heading: headingWords(repo.why),
            items: listed.map((one) => ({
                id: one.root,
                label: one.label,
                active: one.root === repo.root
            }))
        }
    ]);

    const detached = $derived(repo.branch === '');
    const choices = $derived<MenuItem[]>(
        repo.branches.map((name) => ({ id: name, label: name, active: name === repo.branch }))
    );
    const upstream = $derived(repo.upstream === '' ? t('statusbar.sync_upstream') : repo.upstream);
    const remotes = $derived<MenuItem[]>(
        repo.remotes.map((name) => ({ id: name, label: t('repositories.publish_to', name) }))
    );
    /** Whether a press of the sync item pushes, which is when the branch is only ahead. */
    const pushes = $derived(repo.ahead > 0 && repo.behind === 0);

    /** A branch picked from the list, checked out once the reader confirms. */
    function picked(name: string): void {
        if (name === repo.branch) return;
        const root = repo.root;
        asking = {
            message: t('git.branch_switch_confirm', name),
            detail: t('git.branch_switch_detail'),
            verb: t('repositories.switch'),
            act: () => void git.switchBranch(root, name)
        };
    }

    function synced(): void {
        const root = repo.root;
        asking = pushes
            ? {
                  message: t('git.push_confirm', repo.branch, upstream),
                  detail: t('git.push_detail', repo.ahead),
                  verb: t('git.push'),
                  act: () => void git.push(root)
              }
            : {
                  message: t('repositories.sync_confirm', repo.branch, upstream),
                  detail: t('repositories.sync_detail', repo.behind, repo.ahead),
                  verb: t('repositories.sync'),
                  act: () => void git.sync(root)
              };
    }

    /** Publish the branch to a remote, once the reader confirms. */
    function publish(remote: string): void {
        const root = repo.root;
        asking = {
            message: t('repositories.publish_confirm', repo.branch, remote),
            detail: t('repositories.publish_detail'),
            verb: t('repositories.publish'),
            act: () => void git.publish(root, remote)
        };
    }

    function answered(): void {
        const held = asking;
        asking = null;
        held?.act();
    }
</script>

{#if repository}
    <span data-status="repository" data-repo={repo.root}>
        <Menu
            status
            placement="above"
            label={t('statusbar.repository_menu', repo.name)}
            words={repo.name}
            glyph={REPOSITORY_GLYPH}
            title={t('statusbar.repository_tip', repo.name, repo.root, whyWords(repo.why))}
            items={[]}
            groups={repositories}
            onpick={chooseRepository}
        />
    </span>
{/if}
{#if branch}
    <span data-status="branch" data-repo={repo.root}>
        <Menu
            status
            placement="above"
            label={t('statusbar.branch_menu', repo.name)}
            words={detached ? repo.head : repo.branch}
            glyph={detached ? DETACHED_GLYPH : BRANCH_GLYPH}
            title={detached
                ? t('statusbar.branch_detached_tip', repo.head, repo.name)
                : t('statusbar.branch_tip', repo.branch, repo.name)}
            items={choices}
            onpick={picked}
        />
    </span>
{/if}
{#if sync && repo.tracked && !detached}
    <span data-status="sync">
        <ToolButton
            label={t('statusbar.sync_name', repo.behind, repo.ahead)}
            title={pushes
                ? t('statusbar.sync_tip_push', repo.ahead, upstream)
                : t('statusbar.sync_tip_sync', repo.behind, repo.ahead, upstream)}
            status
            onclick={synced}
        >
            <Glyph name="behind" />
            <span data-sync="behind">{repo.behind}</span>
            <Glyph name="ahead" />
            <span data-sync="ahead">{repo.ahead}</span>
        </ToolButton>
    </span>
{:else if sync && !detached && repo.remotes.length === 1}
    <span data-status="publish">
        <ToolButton
            label={t('repositories.publish')}
            title={t('statusbar.publish_tip', repo.branch, repo.remotes[0])}
            glyph="publish"
            compact
            status
            onclick={() => publish(repo.remotes[0])}
        />
    </span>
{:else if sync && !detached && repo.remotes.length > 1}
    <span data-status="publish">
        <Menu
            status
            placement="above"
            label={t('repositories.publish')}
            glyph="publish"
            title={t('statusbar.publish_tip_many', repo.branch)}
            items={remotes}
            onpick={publish}
        />
    </span>
{/if}
{#if asking !== null}
    <!-- On the body, through bits-ui's Portal: over a wallpaper the bar filters what it holds, and
         a dialog drawn inside it would be laid out in the bar's own box. -->
    <Portal>
        <Confirm
            message={asking.message}
            detail={asking.detail}
            confirm={asking.verb}
            cancel={t('ui.confirm_cancel')}
            onconfirm={answered}
            oncancel={() => (asking = null)}
        />
    </Portal>
{/if}
