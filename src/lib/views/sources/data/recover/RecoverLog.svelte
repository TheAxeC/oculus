<script lang="ts">
    // Layer 3, Recover view partial. The last lines of the dataset's log on the target, each with
    // its time: on this Mac `~/.oculus/recover/<hub>/<key>.log`, on the cluster `recover.log` in
    // the dataset's folder. The log is the record of every request, command and result; nothing is
    // written back to the registry.
    import Empty from '$lib/ui/frame/Empty.svelte';
    import { t } from '$lib/state/shared/words/text';

    let { lines }: { lines: string[] } = $props();
</script>

<section class="log" aria-label={t('recover.log')}>
    <div class="head">{t('recover.log')}</div>
    {#if lines.length === 0}
        <Empty message={t('recover.log_empty')} />
    {:else}
        <pre>{lines.join('\n')}</pre>
    {/if}
</section>

<style>
    .log {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 6px 8px;
        min-width: 0;
    }

    .head {
        color: var(--muted-txt);
        font-size: var(--fs-xs);
        margin-bottom: 4px;
    }

    pre {
        margin: 0;
        max-height: 240px;
        overflow: auto;
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }
</style>
