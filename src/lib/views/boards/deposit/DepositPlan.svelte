<script lang="ts">
    // Layer 3, partial of views/boards/deposit/Deposit.svelte. The sync plan of a deposit: the
    // files of the project's `code/` the mirror takes, the changed files, each a row that opens its
    // diff (DepositFile.svelte), and the findings of the scan, each in words. The rows of the
    // changed files are made again whenever the branch or the changes are, so an open diff is shut
    // and never shows texts older than the plan it sits in.

    import DepositFile from './DepositFile.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import type { Finding, Plan } from '$lib/state/system/deposit.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The project the deposit is of. */
        id: string;
        plan: Plan;
        /** The branch of the mirror the plan was made on. */
        branch: string;
        /** A name unique to the view instance, which names the diff editors' models. */
        model: string;
    };

    let { id, plan, branch, model }: Props = $props();

    /** Changes with the plan, which makes its file rows again with their diffs shut. */
    const planStamp = $derived(
        `${branch}|${plan.changes.map((one) => one.letters + one.path).join('\0')}`
    );

    function findingWords(one: Finding): string {
        if (one.kind === 'secret') return t('deposit.finding_secret', one.path);
        if (one.kind === 'large') return t('deposit.finding_large', one.mb, one.path);
        return t('deposit.finding_readme');
    }
</script>

<div class="grp">
    <div class="grp-h">
        <span>{t('deposit.files', plan.files.length)}</span>
    </div>
    {#each plan.files as file (file)}
        <div class="fl"><span class="pa">{file}</span></div>
    {/each}
</div>
<div class="grp">
    <div class="grp-h">
        <span>{t('deposit.changes', plan.changes.length)}</span>
    </div>
    {#if plan.changes.length === 0}
        <Empty message={t('deposit.changes_none')} />
    {:else}
        {#key planStamp}
            {#each plan.changes as change (change.path)}
                <DepositFile
                    {id}
                    against="plan"
                    path={change.path}
                    letters={change.letters}
                    model={`${model}:plan:${change.path}`}
                />
            {/each}
        {/key}
    {/if}
</div>
{#if plan.findings.length > 0}
    <div class="grp">
        <div class="grp-h"><span>{t('deposit.findings')}</span></div>
        {#each plan.findings as finding (finding.kind + finding.path)}
            <p class="warn">{findingWords(finding)}</p>
        {/each}
    </div>
{/if}

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

    /* A file of the plan is one line of the tree's row height, its words the main words of a
       row. */
    .fl {
        display: flex;
        gap: 8px;
        align-items: center;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    .pa {
        font-family: var(--font-mono);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .warn {
        color: var(--c-amber-txt);
        font-size: var(--fs-md);
        margin: 0;
    }
</style>
