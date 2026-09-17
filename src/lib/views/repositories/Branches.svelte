<script lang="ts">
    // Layer 3, partial of views/Repositories.svelte. The branches of one repository as a section:
    // one explorer row per branch with its upstream after its name, the checked-out one drawn as the
    // one in force (a bold name with a check), the switch control on every other one, and the row a
    // new branch is named on, whose visible label is the name of its field.
    //
    // It draws and reports presses; the write and its confirm are the view's.

    import TextInput from '$lib/ui/TextInput.svelte';
    import TreeItem from '$lib/ui/TreeItem.svelte';
    import TreeSection from '$lib/ui/TreeSection.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree-keys';
    import type { GitState } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        git: GitState;
        nav: TreeNav;
        busy: boolean;
        open: boolean;
        ontoggle: () => void;
        onswitch: (name: string) => void;
        onbranch: (name: string) => void;
    };

    let { git, nav, busy, open, ontoggle, onswitch, onbranch }: Props = $props();

    let branchName = $state('');

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
        {open}
        {ontoggle}
    >
        {#if git.branches.length === 0}
            <li role="none">
                <TreeItem label={t('repositories.branches_empty')} tone="muted" />
            </li>
        {/if}
        {#each git.branches as branch (branch.name)}
            <li role="none" data-branch={branch.name}>
                <TreeItem
                    label={branch.name}
                    id={`branch:${branch.name}`}
                    {nav}
                    level={2}
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
                        {/if}
                    {/snippet}
                </TreeItem>
            </li>
        {/each}
        <li role="none" data-form="branch">
            <TreeItem label={t('git.branch_new')} glyph="branch">
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
