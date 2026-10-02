<script lang="ts">
    // Layer 3, shared view part. The commit box, as VS Code draws it above a repository's changes:
    // the message field in a box of its own with Suggest inside it at the right, and under it one
    // button that says what the repository needs next. That button is Commit while anything is
    // staged, changed, untracked or unmerged, or a merge or a rebase is in progress; Sync Changes,
    // with the behind and ahead counts, when nothing is to commit and the branch is ahead of or
    // behind its upstream; and Publish Branch when nothing is to commit and the branch has no
    // upstream (state/sources/repositories/repositories.ts's actionButton()). Commit carries the
    // list of Commit, Commit (Amend), Commit and Push and Commit and Sync at its right end, and
    // where it cannot be pressed its hover words say why. The Repositories view and the sessions
    // Changes panel both draw this one component, so there is one commit and one message per
    // repository whichever of them it is typed in.
    //
    // The message is state/sources/repositories/repositories.svelte.ts's, per root; the commit is
    // its too, and the confirm is this component's, since the server takes a commit only
    // confirmed. Sync Changes and Publish Branch ask the questions the view's `...` menu asks.
    // Ctrl or Cmd with Enter in the field commits as the button does. The field opens one line
    // high and grows with its lines to ten and then scrolls.
    //
    // While a merge or a cherry pick is in progress the field starts with the message git prepared
    // for it, and the commit waits until nothing is unmerged. An amend needs no staged path and no
    // message: with an empty field it keeps the last commit's message.

    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { CommitHow } from '$lib/state/sources/repositories/repositories.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import {
        actionButton,
        checkedOutBranch,
        messageRows,
        preparedMessage,
        publishWords,
        syncWords,
        upstreamOf
    } from '$lib/state/sources/repositories/repositories';
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
    const action = $derived(actionButton(git));
    const branch = $derived(checkedOutBranch(git));
    const placeholder = $derived(
        branch === '' ? t('git.commit_placeholder_bare') : t('git.commit_placeholder', branch)
    );

    // A merge or a cherry pick in progress puts git's prepared message in an empty field, once.
    $effect(() => {
        const prepared = preparedMessage(git);
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
        const count = git.staged.length;
        let question = t('git.commit_confirm', count, git.branch);
        let detail = t('git.commit_detail');
        if (how === 'amend') {
            question = t('git.amend_confirm', git.branch);
            detail = message.trim() === '' ? t('git.amend_keep') : t('git.amend_detail');
        } else if (how === 'push') {
            question = t('git.commit_push_confirm', count, git.branch, upstream);
        } else if (how === 'sync') {
            question = t('git.commit_sync_confirm', count, git.branch, upstream);
        }
        asking = {
            message: question,
            detail,
            act: () => void repositories.commit(root, how, message)
        };
    }

    /** Ask the question of a sync or a publish, then run the write on a yes. */
    function ask(words: { message: string; detail: string }, act: () => void): void {
        asking = { message: words.message, detail: words.detail, act };
    }

    /** Press the one button: the commit, the sync or the publish it stands for. */
    function pressed(): void {
        if (action === 'sync') ask(syncWords(git), () => void repositories.sync(root));
        else if (action === 'publish') {
            const remote = git.remotes[0];
            ask(publishWords(git, remote), () => void repositories.publish(root, remote));
        } else commit('commit');
    }

    /** Ctrl or Cmd with Enter commits, as it does in VS Code's box. */
    function keyed(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        commit('commit');
    }
</script>

<div class="commit" data-commit-box={root}>
    <div class="box">
        <div class="field">
            <TextArea
                value={message}
                label={t('git.commit_label')}
                {placeholder}
                rows={messageRows(message)}
                size="tree"
                grow={{ min: 1, max: 10 }}
                bare
                oninput={(next: string) => repositories.setMessage(root, next)}
                onkeydown={keyed}
            />
        </div>
        <div class="tools">
            <ToolButton
                label={suggesting ? t('git.suggest_pending') : t('git.suggest')}
                title={t('git.suggest')}
                glyph="spark"
                compact
                bare
                disabled={busy || suggesting || git.staged.length === 0}
                onclick={() => void repositories.suggest(root)}
            />
        </div>
    </div>
    <div class="acts">
        {#if action === 'sync'}
            <ToolButton
                label={t('repositories.sync_changes')}
                title={busy ? t('git.busy') : undefined}
                glyph="sync"
                primary
                disabled={busy}
                onclick={pressed}
            >
                {t('repositories.sync_changes')}
                {#if git.behind > 0}
                    <span class="count"><Glyph name="behind" />{git.behind}</span>
                {/if}
                {#if git.ahead > 0}
                    <span class="count"><Glyph name="ahead" />{git.ahead}</span>
                {/if}
            </ToolButton>
        {:else if action === 'publish'}
            <ToolButton
                label={t('repositories.publish')}
                title={busy ? t('git.busy') : undefined}
                glyph="publish"
                primary
                disabled={busy}
                onclick={pressed}
            />
        {:else}
            <ToolButton
                label={t('git.commit')}
                title={blocked('commit') === '' ? t('git.commit_title') : blocked('commit')}
                glyph="check"
                primary
                joined
                disabled={blocked('commit') !== ''}
                onclick={pressed}
            />
            <Menu
                label={t('git.commit_more')}
                glyph="disclosure"
                compact
                primary
                placement="down"
                align="right"
                items={choices}
                onpick={(id: string) => commit(id as CommitHow)}
            />
        {/if}
    </div>
</div>

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .commit {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .box {
        display: flex;
        align-items: flex-start;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--panel);
    }

    :global(body.wall) .box {
        background: transparent;
    }

    .box:focus-within {
        border-color: var(--accent);
    }

    /* Under body.rice the box is the terminal form of a field, as TextArea draws one: a line at
       its left, no radius, no fill. The field in it is TextArea's bare one, which takes the mono
       font there. The line takes the accent while the field holds the focus. */
    :global(body.rice) .box {
        border: 0;
        border-left: 1px solid var(--line);
        border-radius: 0;
        background: none;
    }

    :global(body.rice) .box:focus-within {
        border-left-color: var(--accent);
    }

    .field {
        flex: 1 1 auto;
        min-width: 0;
        padding: 3px 0 3px 6px;
    }

    .tools {
        display: flex;
        flex: none;
        padding: 1px 3px 1px 1px;
    }

    /* The button takes the box's width less its dropdown part, which keeps its own: the button's
       wrapper is as wide as its column, and a lone button (Sync Changes, Publish Branch) has the
       whole row. */
    .acts {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: stretch;
        min-width: 0;
    }

    /* Top-aligned in the label's line, so the counts add nothing to the button's 16px line. */
    .count {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        margin-left: 4px;
        vertical-align: top;
    }
</style>
