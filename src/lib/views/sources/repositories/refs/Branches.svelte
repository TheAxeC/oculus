<script lang="ts">
    // Layer 3, partial of views/sources/repositories/repo/Repo.svelte. The branches of one
    // repository as a section: one explorer row per branch with its upstream after its name, the
    // checked-out one drawn as the one in force (a bold name with a check), the switch control on
    // every other one, and the row a new branch is named on, whose visible label is the name of its
    // field.
    //
    // A repository with no commit yet has a branch checked out that git does not list, so the empty
    // line says so. A new branch can still be made there: `git switch -c` moves the unborn HEAD to
    // the new name, so the create control is offered as it is on any repository.
    //
    // The section's head takes the focus when the view asks for it (`reveal`), which is what the
    // Branch control of a repository's row does after it has opened the section; the request is
    // answered once with `onrevealed`.
    //
    // The checked-out branch is switched to nowhere and deleted by nothing; every other row offers
    // Switch and Delete Branch. It draws and reports presses; the write and its confirm are the
    // view's.

    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { noCommitYet } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        git: GitState;
        nav: TreeNav;
        busy: boolean;
        open: boolean;
        ontoggle: () => void;
        onswitch: (name: string) => void;
        ondelete: (name: string) => void;
        onbranch: (name: string) => void;
        /** The view asked for the focus to go to the section's head. */
        reveal: boolean;
        /** The request was answered. */
        onrevealed: () => void;
    };

    let {
        git,
        nav,
        busy,
        open,
        ontoggle,
        onswitch,
        ondelete,
        onbranch,
        reveal,
        onrevealed
    }: Props = $props();

    let branchName = $state('');
    const unborn = $derived(noCommitYet(git));

    $effect(() => {
        if (!reveal) return;
        nav.focus('branches');
        onrevealed();
    });

    function created(): void {
        const name = branchName.trim();
        if (name === '') return;
        branchName = '';
        onbranch(name);
    }
</script>

<div data-group="branches">
    <TreeSection
        label={t('repositories.branches')}
        id="branches"
        {nav}
        count={git.branches.length}
        badge
        {open}
        {ontoggle}
    >
        {#if git.branches.length === 0}
            <li role="none">
                <TreeItem
                    label={unborn
                        ? t('repositories.branches_unborn', git.branch)
                        : t('repositories.branches_empty')}
                    depth={1}
                    tone="muted"
                />
            </li>
        {/if}
        {#each git.branches as branch (branch.name)}
            <li role="none" data-branch={branch.name}>
                <TreeItem
                    label={branch.name}
                    id={`branch:${branch.name}`}
                    {nav}
                    level={2}
                    depth={1}
                    glyph="branch"
                    current={branch.current}
                >
                    {#snippet detail()}
                        {branch.upstream}
                    {/snippet}
                    {#snippet actions(reach: number)}
                        {#if !branch.current}
                            <ToolButton
                                label={t('repositories.switch')}
                                title={t('repositories.switch_title', branch.name)}
                                glyph="goto"
                                compact
                                tabindex={reach}
                                disabled={busy}
                                onclick={() => onswitch(branch.name)}
                            />
                            <ToolButton
                                label={t('repositories.menu_delete_branch')}
                                title={t('repositories.branch_delete_title', branch.name)}
                                glyph="trash"
                                compact
                                tabindex={reach}
                                disabled={busy}
                                onclick={() => ondelete(branch.name)}
                            />
                        {/if}
                    {/snippet}
                </TreeItem>
            </li>
        {/each}
        <li role="none" data-form="branch">
            <TreeItem label={t('git.branch_new')} depth={1} glyph="branch">
                {#snippet field()}
                    <TextInput
                        value={branchName}
                        label={t('git.branch_new')}
                        oninput={(next: string) => (branchName = next)}
                    />
                    <ToolButton
                        label={t('git.branch_new_create')}
                        glyph="check"
                        compact
                        disabled={busy}
                        onclick={created}
                    />
                {/snippet}
            </TreeItem>
        </li>
    </TreeSection>
</div>
