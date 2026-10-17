<script lang="ts">
    // Layer 3, view partial of graph/Graph.svelte. The Graph section head's actions: Go to Current
    // History Item while the repository has a commit, Fetch, and Pull and Push for a branch with an
    // upstream or Publish Branch for one that can be published, each write behind the question the
    // `...` menu's item asks and none offered while a write runs.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        canPublish,
        noCommitYet,
        publishWords,
        pullWords,
        pushWords,
        upstreamOf
    } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        root: string;
        git: GitState;
        /** Whether a write is in flight on the repository. */
        busy: boolean;
        /** The tab index the section head hands its actions. */
        reach: number;
        /** Ask a question, then run what it is about on a yes. */
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        /** Scroll HEAD's row into view and put the focus on it. */
        ongoto: () => void;
    };

    let { root, git, busy, reach, ask, ongoto }: Props = $props();

    const { repositories } = useState();

    /** Whether the branch has an upstream to pull from and push to. */
    const tracked = $derived(git.upstream === true && upstreamOf(git) !== '');

    /** Ask a question, then run the write it names. */
    function question(words: { message: string; detail: string }, act: () => void): void {
        ask(words.message, words.detail, act);
    }
</script>

{#if !noCommitYet(git)}
    <ToolButton
        label={t('repositories.goto_current')}
        glyph="goto_current"
        compact
        tabindex={reach}
        onclick={ongoto}
    />
{/if}
<ToolButton
    label={t('repositories.fetch')}
    title={busy ? repositories.busyWords(root) : undefined}
    glyph="fetch"
    compact
    tabindex={reach}
    disabled={busy}
    onclick={() => void repositories.fetch(root)}
/>
{#if tracked}
    <ToolButton
        label={t('repositories.pull')}
        title={busy ? repositories.busyWords(root) : undefined}
        glyph="pull"
        compact
        tabindex={reach}
        disabled={busy}
        onclick={() => question(pullWords(git), () => void repositories.pull(root))}
    />
    <ToolButton
        label={t('git.push')}
        title={busy ? repositories.busyWords(root) : undefined}
        glyph="push"
        compact
        tabindex={reach}
        disabled={busy}
        onclick={() => question(pushWords(git), () => void repositories.push(root))}
    />
{:else if canPublish(git)}
    <ToolButton
        label={t('repositories.publish')}
        title={busy ? repositories.busyWords(root) : undefined}
        glyph="publish"
        compact
        tabindex={reach}
        disabled={busy}
        onclick={() =>
            question(
                publishWords(git, git.remotes[0]),
                () => void repositories.publish(root, git.remotes[0])
            )}
    />
{/if}
