<script lang="ts">
    // Layer 3, view partial. The Live HPC heading presents the four connection states and keeps refresh as an explicit server action.
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import { clock } from '$lib/state/format';
    import type { HpcPayload } from '$lib/state/hpc';
    let { data, onrefresh }: { data: HpcPayload | null; onrefresh: () => void } = $props();
    function status(): string {
        if (data === null || data.status === 'starting') return t('js.slurm.polling');
        if (data.status === 'unreachable') return t('js.slurm.unreachable');
        if (data.status === 'error') return t('js.slurm.error');
        return t('js.slurm.live');
    }
    function parts(): string[] {
        if (data === null || data.status !== 'ok') return [];
        return [
            data.jobs.length === 0
                ? t('js.slurm.queue_empty')
                : t('js.slurm.queue_summary', data.running, data.pending, data.total),
            t('js.slurm.as_of', clock(data.updated)),
            t('js.slurm.every', data.pollMin)
        ];
    }
</script>

<!-- The pane carries the view's name, so the head is the status line and the refresh control. -->
<header>
    <div>
        <p class="meta">
            <span
                class:ok={data?.status === 'ok'}
                class:bad={data?.status === 'error' || data?.status === 'unreachable'}
            >
                {status()}
            </span>
            {#each parts() as part (part)}
                <span class="separator">{t('js.sessions.meta_sep')}</span>
                <span>{part}</span>
            {/each}
        </p>
        {#if data?.hint}<code>{data.hint}</code>{/if}
    </div>
    <ToolButton label={t('hpc.refresh_now')} onclick={onrefresh} />
</header>

<style>
    header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: start;
    }
    .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin: 0 0 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .ok {
        color: var(--c-green-d-txt);
        font-weight: 600;
    }
    .bad {
        color: var(--c-red-d-txt);
        font-weight: 600;
    }
    code {
        color: var(--c-red-txt);
    }
</style>
