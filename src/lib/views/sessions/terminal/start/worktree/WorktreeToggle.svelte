<script lang="ts">
    // Layer 3, view partial. The composer's branch and its New worktree control, in the composer's
    // foot after the folder picker. The branch is the one checked out where the session starts, or
    // the new branch's name while New worktree is chosen. The control is drawn only for a folder a
    // repository the `git` channel watches holds, and a press chooses New worktree or takes the
    // choice back (state/sessions/terminal/composer/worktree.ts).

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The branch checked out in the folder; empty when git names none there. */
        branch: string;
        /** The repository the folder lies in; empty when no watched repository holds it. */
        root: string;
        /** The name typed while New worktree is chosen, null while it is not. */
        name: string | null;
        ontoggle: () => void;
    };

    let { branch, root, name, ontoggle }: Props = $props();

    const shown = $derived(name === null ? branch : name.trim());
</script>

{#if shown !== ''}
    <span
        class="branch"
        data-composer-branch
        title={name === null ? t('composer.branch_title') : t('composer.worktree_branch_title')}
    >
        <Glyph name="branch" />
        <span class="branch-name">{shown}</span>
    </span>
{/if}
{#if root !== ''}
    <ToolButton
        label={t('composer.worktree')}
        title={name === null ? t('composer.worktree_title') : t('composer.worktree_back_title')}
        glyph="worktree"
        compact
        bare
        pressed={name !== null}
        onclick={ontoggle}
    />
{/if}

<style>
    .branch {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        padding: 0 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .branch-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
