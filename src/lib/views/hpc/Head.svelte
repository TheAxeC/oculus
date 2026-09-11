<script lang="ts">
    // Layer 3, view partial. The Live HPC heading presents the four connection states and keeps refresh as an explicit server action.
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import { clock } from '$lib/state/format';
    import type { HpcPayload } from '$lib/state/hpc';
    let { data, onrefresh }: { data: HpcPayload | null; onrefresh: () => void } = $props();
    function meta(): string {
        if (data === null || data.status === 'starting') return t('js.slurm.polling');
        if (data.status === 'unreachable') return t('js.slurm.unreachable');
        if (data.status === 'error') return t('js.slurm.error');
        return `${t('js.slurm.live')} | ${t('js.slurm.queue_summary', data.running, data.pending, data.total)} | ${t('js.slurm.as_of', clock(data.updated))} | ${t('js.slurm.every', data.pollMin)}`;
    }
</script>

<!-- The pane carries the view's name, so the head is the status line and the refresh control. -->
<header>
    <div>
        <p class:bad={data?.status === 'error' || data?.status === 'unreachable'}>{meta()}</p>
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
    p {
        margin: 0 0 4px;
    }
    p {
        color: var(--muted-txt, var(--muted));
    }
    .bad {
        color: var(--c-red-txt);
    }
    code {
        color: var(--c-red-txt);
    }
</style>
