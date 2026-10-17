<script lang="ts">
    // Layer 3, partial of views/boards/deposit/Deposit.svelte. How the mirror's current branch
    // stands against its upstream and against `origin/main`: the commits ahead of the upstream
    // (left out when the upstream is `origin/main`, whose count is said already), the ahead and
    // behind counts against `origin/main`, Fetch beside them, and the files the mirror's commits
    // and `origin/main` differ in, each opening its diff (views/boards/deposit/DepositFile.svelte).
    // Before the mirror knows `origin/main` it says to fetch. Fetch asks the parent to run the
    // `fetch` action, which writes the remote-tracking branches of the mirror and nothing else, so
    // the branch and the files are as they were.

    import DepositFile from './DepositFile.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { REMOTE_MAIN, type MainComparison } from '$lib/state/system/deposit.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        id: string;
        comparison: MainComparison;
        /** Commits the current branch is ahead of its upstream. */
        upstream: number;
        /** The current branch's upstream as git names it, or the empty name without one. */
        upstreamName: string;
        /** Whether a request is in flight, which disables Fetch. */
        busy: boolean;
        /** A name unique to the view instance, which names the diff editors' models. */
        model: string;
        onfetch: () => void;
    };

    let { id, comparison, upstream, upstreamName, busy, model, onfetch }: Props = $props();

    /**
     * Whether the count against the upstream is said: not when the upstream is the branch the
     * comparison already counts against, which would say the same count twice.
     */
    const aheadSaid = $derived(upstream > 0 && !(comparison.known && upstreamName === REMOTE_MAIN));

    /**
     * Changes whenever the comparison does, which makes the file rows again with their diffs shut.
     */
    const stamp = $derived(
        `${comparison.known}|${comparison.ahead}|${comparison.behind}|${comparison.differ.join('\0')}`
    );
</script>

<div class="grp">
    <div class="grp-h line">
        <span>
            {comparison.known
                ? t('deposit.compared', comparison.ahead, comparison.behind)
                : t('deposit.compared_unknown')}
        </span>
        {#if aheadSaid}
            <span>{t('deposit.ahead', upstream)}</span>
        {/if}
        <ToolButton
            small
            label={t('deposit.fetch')}
            title={t('deposit.fetch_title')}
            disabled={busy}
            onclick={onfetch}
        />
    </div>
    {#if comparison.known}
        <div class="grp-h">{t('deposit.differ', comparison.differ.length)}</div>
        {#if comparison.differ.length === 0}
            <Empty message={t('deposit.differ_none')} />
        {:else}
            {#key stamp}
                {#each comparison.differ as path (path)}
                    <DepositFile {id} against="main" {path} model={`${model}:main:${path}`} />
                {/each}
            {/key}
        {/if}
    {/if}
</div>

<style>
    .grp {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 6px 8px;
    }

    .grp-h {
        color: var(--muted-txt);
        font-size: var(--fs-xs);
        margin-bottom: 4px;
    }

    .line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }
</style>
