<script lang="ts">
    // Layer 3, shell. The status bar's branch and sync items, for the repository holding the file
    // of the tab on screen, as VS Code draws them for the active editor's repository.
    //
    // The branch item names the branch checked out, or the commit a detached head is at, and opens
    // a picker of the repository's branches; a choice is checked out through the same confirm the
    // Repositories view asks, since the server takes a switch only with it. The sync item draws
    // how far the branch is behind and ahead of its upstream, once it has one. A branch only ahead
    // is pushed, after the same confirm; any other state opens the Repositories view on the
    // repository, which is where a pull will be. The writes are the page's, handed in, since the
    // shell may not write.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { onBody } from '$lib/ui/frame/on-body';
    import type { RepoStatus, StatusGit } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/words/text';

    type Props = {
        repo: RepoStatus;
        git: StatusGit;
        /** Whether each item is drawn, the reader having hidden neither. */
        branch: boolean;
        sync: boolean;
    };

    let { repo, git, branch, sync }: Props = $props();

    /** A write waiting on the confirm: what it asks, the word of its button, and the write. */
    type Ask = { message: string; detail: string; verb: string; act: () => void };

    /** The branch item's glyph, and the commit's for a detached head. */
    const BRANCH_GLYPH = 'branch';
    const DETACHED_GLYPH = 'commit';

    /** The write waiting on the reader's confirm, or null when none is. */
    let asking: Ask | null = $state(null);

    const detached = $derived(repo.branch === '');
    const choices = $derived<MenuItem[]>(
        repo.branches.map((name) => ({ id: name, label: name, active: name === repo.branch }))
    );
    const upstream = $derived(repo.upstream === '' ? t('statusbar.sync_upstream') : repo.upstream);
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
        if (!pushes) {
            git.show(root);
            return;
        }
        asking = {
            message: t('git.push_confirm', repo.branch, upstream),
            detail: t('git.push_detail', repo.ahead),
            verb: t('git.push'),
            act: () => void git.push(root)
        };
    }

    function answered(): void {
        const held = asking;
        asking = null;
        held?.act();
    }
</script>

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
                : t('statusbar.sync_tip_open', repo.behind, repo.ahead, upstream)}
            status
            onclick={synced}
        >
            <Glyph name="behind" />
            <span data-sync="behind">{repo.behind}</span>
            <Glyph name="ahead" />
            <span data-sync="ahead">{repo.ahead}</span>
        </ToolButton>
    </span>
{/if}
{#if asking !== null}
    <!-- On the body: over a wallpaper the bar filters what it holds, and a dialog drawn inside it
         would be laid out in the bar's own box. -->
    <div use:onBody>
        <Confirm
            message={asking.message}
            detail={asking.detail}
            confirm={asking.verb}
            cancel={t('ui.confirm_cancel')}
            onconfirm={answered}
            oncancel={() => (asking = null)}
        />
    </div>
{/if}
