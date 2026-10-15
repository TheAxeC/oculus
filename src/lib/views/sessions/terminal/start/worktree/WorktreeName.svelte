<script lang="ts">
    // Layer 3, view partial. The name of the worktree a start with New worktree makes, drawn in the
    // composer under its foot while the choice stands: the name field, which takes the cursor when
    // it opens, the folder the session will start in, and the Repositories view's warning when the
    // repository's .gitignore does not keep its worktrees out. Esc in the field takes the choice
    // back and Enter starts, as Enter in the prompt does. A name `validName` refuses marks the
    // field.

    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import { validName } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The name typed. */
        name: string;
        /** The folder the session starts in once the worktree is made. */
        planned: string;
        /** Whether the repository's .gitignore keeps its worktrees out of its history. */
        ignored: boolean;
        oninput: (name: string) => void;
        oncancel: () => void;
        onstart: () => void;
    };

    let { name, planned, ignored, oninput, oncancel, onstart }: Props = $props();

    let field = $state<HTMLInputElement | null>(null);

    $effect(() => {
        field?.focus();
    });

    function keyed(event: KeyboardEvent): boolean {
        if (event.key === 'Escape') oncancel();
        else if (event.key === 'Enter' && !event.isComposing) onstart();
        else return false;
        return true;
    }
</script>

<div class="worktree" data-composer-worktree>
    <TextInput
        value={name}
        label={t('composer.worktree_name')}
        placeholder={t('composer.worktree_name')}
        invalid={name.trim() === '' || validName(name.trim())
            ? undefined
            : t('composer.worktree_invalid')}
        {oninput}
        onkey={keyed}
        bind:input={field}
    />
    {#if validName(name.trim())}
        <span class="planned" title={planned}>{t('composer.worktree_path', planned)}</span>
    {/if}
    {#if !ignored}
        <p class="warning" data-composer-unignored>{t('repositories.worktrees_unignored')}</p>
    {/if}
</div>

<style>
    .worktree {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        padding: 0 8px 6px;
    }

    .planned {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* The Repositories view draws the same sentence in its warning colour (ui/tree/TreeItem). */
    .warning {
        margin: 0;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
