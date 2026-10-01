<script lang="ts">
    // Layer 3, view partial. The Live HPC bar presents the four connection states at its end and
    // keeps refresh as an explicit server action. While the cluster does not answer, the refresh
    // control is the retry of the error box (Hpc.svelte) and the bar holds the status words alone.
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { clock } from '$lib/state/shared/words/format';
    import type { HpcPayload } from '$lib/state/system/hpc';
    import { useState } from '$lib/state/client/use';

    /**
     * Minutes past the poll's own period before the head calls the next poll late. One period plus
     * this is a poll that did not happen rather than a poll still on its way, since a poll that
     * answers publishes a new time and a poll that fails publishes the failure at its own budget.
     */
    const LATE_GRACE_MIN = 2;

    const {
        clock: { minuteNow, startMinuteClock }
    } = useState();
    let { data, onrefresh }: { data: HpcPayload | null; onrefresh: () => void } = $props();

    // The head ages between publishes, so the minute the page is in is read as state.
    $effect(startMinuteClock);
    const now = $derived(minuteNow());

    /** Whether the cluster is not answering, which the error box in the body says in words. */
    const failed = $derived(data?.status === 'unreachable' || data?.status === 'error');

    function status(): string {
        if (data === null || data.status === 'starting') return t('hpc.polling');
        if (data.status === 'unreachable') return t('hpc.unreachable');
        if (data.status === 'error') return t('hpc.error');
        return t('hpc.live');
    }

    /** Whether the answer on screen is older than the poll that should have replaced it. */
    function late(): boolean {
        if (data?.status !== 'ok') return false;
        const updated = Date.parse(data.updated);
        return Number.isFinite(updated) && now - updated > (data.pollMin + LATE_GRACE_MIN) * 60000;
    }

    /** The meta parts after the state word; the stale one carries the failure tone. */
    function parts(): { text: string; late: boolean }[] {
        if (data === null) return [];
        if (data.status === 'unreachable' || data.status === 'error')
            return [
                ...(data.lastOk
                    ? [{ text: t('hpc.last_ok', clock(data.lastOk)), late: false }]
                    : []),
                ...(data.retryMin === undefined
                    ? []
                    : [{ text: t('hpc.retrying', data.retryMin), late: false }])
            ];
        if (data.status !== 'ok') return [];
        const stale = late();
        return [
            {
                text:
                    data.jobs.length === 0
                        ? t('hpc.queue_empty')
                        : t('hpc.queue_summary', data.running, data.pending, data.total),
                late: false
            },
            {
                text: stale
                    ? t('hpc.as_of_late', clock(data.updated))
                    : t('hpc.as_of', clock(data.updated)),
                late: stale
            },
            { text: t('hpc.every', data.pollMin), late: false }
        ];
    }
</script>

<!-- The pane carries the view's name, so the bar is the refresh control and the status line. -->
<Toolbar label={t('hpc.toolbar')}>
    {#if !failed}
        <ToolButton label={t('hpc.refresh_now')} onclick={onrefresh} />
    {/if}
    <p class="meta">
        <span
            class:ok={data?.status === 'ok'}
            class:bad={data?.status === 'error' || data?.status === 'unreachable'}
        >
            {status()}
        </span>
        {#each parts() as part (part.text)}
            <span class="separator">{t('sessions.meta_sep')}</span>
            <span class:late={part.late}>{part.text}</span>
        {/each}
    </p>
</Toolbar>

<style>
    /* The status words at the bar's end; they wrap inside the pane rather than widening it. */
    .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        min-width: 0;
        margin: 0 0 0 auto;
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
    .late {
        color: var(--c-red-d-txt);
    }
</style>
