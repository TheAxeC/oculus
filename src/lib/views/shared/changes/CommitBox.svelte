<script lang="ts">
    // Layer 3, shared view part. The commit box, as VS Code draws it above a repository's changes:
    // the message field, the button that writes a message from the staged diff, and the Commit
    // button with its list of Commit, Commit (Amend), Commit and Push and Commit and Sync. The
    // Repositories view and the sessions Changes panel both draw this one component, so there is
    // one commit and one message per repository whichever of them it is typed in.
    //
    // The message is state/sources/repositories/repositories.svelte.ts's, per root; the commit is
    // its too, and the confirm is this component's, since the server takes a commit only
    // confirmed. Ctrl or Cmd with Enter in the field commits as the button does.
    //
    // While a merge is in progress the field starts with the message git prepared for it, and the
    // commit waits until nothing is unmerged. An amend needs no staged path and no message: with
    // an empty field it keeps the last commit's message.

    import AskConfirm from '$lib/views/shared/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/ask';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { CommitHow } from '$lib/state/sources/repositories/repositories.svelte';
    import { upstreamOf } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = { root: string; git: GitState };

    let { root, git }: Props = $props();

    const { repositories } = useState();

    let asking: Ask | null = $state(null);
    /** The merge message already put in the field, so a cleared field is not filled again. */
    let offered = '';

    const message = $derived(repositories.message(root));
    const busy = $derived(repositories.busy(root));
    const suggesting = $derived(repositories.suggesting(root));
    const unmerged = $derived(git.conflicted.length);
    const upstream = $derived(upstreamOf(git));
    const tracked = $derived(git.upstream === true && upstream !== '');

    // A merge in progress puts git's prepared message in an empty field, once per merge.
    $effect(() => {
        const prepared = git.sequence === 'merging' ? git.mergeMessage : '';
        if (prepared === '' || prepared === offered) return;
        offered = prepared;
        if (repositories.message(root).trim() === '') repositories.setMessage(root, prepared);
    });

    /** Why a commit made this way cannot be made now, or the empty string when it can. */
    function blocked(how: CommitHow): string {
        if (busy) return t('git.busy');
        if (unmerged > 0) return t('git.commit_unmerged', unmerged);
        if ((how === 'push' || how === 'sync') && !tracked) return t('git.push_none');
        if (how === 'amend') return git.log.length === 0 ? t('git.amend_none') : '';
        if (git.staged.length === 0) return t('git.commit_none');
        if (message.trim() === '') return t('git.commit_empty');
        return '';
    }

    const choices = $derived<MenuItem[]>(
        (['commit', 'amend', 'push', 'sync'] as const).map((how) => ({
            id: how,
            label: wordsOf(how),
            title: blocked(how) === '' ? undefined : blocked(how)
        }))
    );

    /** The words of one way to commit. */
    function wordsOf(how: CommitHow): string {
        if (how === 'amend') return t('git.commit_amend');
        if (how === 'push') return t('git.commit_push');
        if (how === 'sync') return t('git.commit_sync');
        return t('git.commit');
    }

    /** Ask before the commit, in words naming what it will do. */
    function commit(how: CommitHow): void {
        if (blocked(how) !== '') return;
        const branch = git.branch;
        const count = git.staged.length;
        let question = t('git.commit_confirm', count, branch);
        let detail = t('git.commit_detail');
        if (how === 'amend') {
            question = t('git.amend_confirm', branch);
            detail = message.trim() === '' ? t('git.amend_keep') : t('git.amend_detail');
        } else if (how === 'push') {
            question = t('git.commit_push_confirm', count, branch, upstream);
        } else if (how === 'sync') {
            question = t('git.commit_sync_confirm', count, branch, upstream);
        }
        asking = {
            message: question,
            detail,
            act: () => void repositories.commit(root, how, message)
        };
    }

    /** Ctrl or Cmd with Enter commits, as it does in VS Code's box. */
    function keyed(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        commit('commit');
    }
</script>

<div class="commit" data-commit-box={root}>
    <TextArea
        value={message}
        label={t('git.commit_label')}
        rows={3}
        oninput={(next: string) => repositories.setMessage(root, next)}
        onkeydown={keyed}
    />
    <div class="cacts">
        <ToolButton
            label={suggesting ? t('git.suggest_pending') : t('git.suggest')}
            title={t('git.suggest_title')}
            glyph="spark"
            disabled={busy || suggesting || git.staged.length === 0}
            onclick={() => void repositories.suggest(root)}
        />
        <span class="split" data-commit-split>
            <ToolButton
                label={t('git.commit')}
                title={blocked('commit') === '' ? t('git.commit_title') : blocked('commit')}
                glyph="check"
                disabled={blocked('commit') !== ''}
                onclick={() => commit('commit')}
            />
            <Menu
                label={t('git.commit_more')}
                glyph="disclosure"
                compact
                placement="down"
                items={choices}
                onpick={(id: string) => commit(id as CommitHow)}
            />
        </span>
    </div>
    {#if unmerged > 0}
        <p class="none">{t('git.commit_unmerged', unmerged)}</p>
    {:else if git.staged.length === 0 && git.sequence === ''}
        <p class="none">{t('git.commit_none')}</p>
    {/if}
</div>

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .commit {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .cacts {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .split {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        margin-left: auto;
    }

    .none {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
</style>
