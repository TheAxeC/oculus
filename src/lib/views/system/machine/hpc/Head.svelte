<script lang="ts">
    // Layer 3, view partial. The head of one cluster's section of Live HPC presents its connection
    // state at its end and keeps refresh, of that cluster alone, as an explicit server action.
    // While a poll fails (ssh not connecting, Slurm not answering or another error, each with its
    // own word), the refresh control is the retry of the cluster's error box (Cluster.svelte) and
    // the head holds the failure word, the time the cluster last answered and the retry. A failed
    // poll whose queue is this poll's holds the failure word, the queue, its time and the retry.
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { clock } from '$lib/state/shared/words/format';
    import {
        failureWords,
        queueIsCurrent,
        type HpcPayload
    } from '$lib/state/system/machine/hpc/hpc';
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
    let { data, onrefresh }: { data: HpcPayload; onrefresh: () => void } = $props();

    // The head ages between publishes, so the minute the page is in is read as state.
    $effect(startMinuteClock);
    const now = $derived(minuteNow());

    /** The words of the poll's failure, which the error box in the body says in full, or null. */
    const failure = $derived(failureWords(data));
    const failed = $derived(failure !== null);

    function status(): string {
        if (data.status === 'starting') return t('hpc.polling');
        if (failure !== null) return failure.word;
        return t('hpc.live');
    }

    /** Whether the answer on screen is older than the poll that should have replaced it. */
    function late(): boolean {
        if (data.status !== 'ok') return false;
        const updated = Date.parse(data.updated);
        return Number.isFinite(updated) && now - updated > (data.pollMin + LATE_GRACE_MIN) * 60000;
    }

    /** The queue's words: empty, or its counts. */
    function queue(payload: HpcPayload): string {
        return payload.jobs.length === 0
            ? t('hpc.queue_empty')
            : t('hpc.queue_summary', payload.running, payload.pending, payload.total);
    }

    /** The meta parts after the state word; the overdue one carries the failure tone. */
    function parts(): { text: string; late: boolean }[] {
        if (failed) {
            const retry = [{ text: t('hpc.retrying', data.retryMin), late: false }];
            if (queueIsCurrent(data))
                return [
                    { text: queue(data), late: false },
                    { text: t('hpc.as_of', clock(data.updated)), late: false },
                    ...retry
                ];
            return [
                ...(data.lastOk
                    ? [{ text: t('hpc.last_ok', clock(data.lastOk)), late: false }]
                    : []),
                ...retry
            ];
        }
        if (data.status !== 'ok') return [];
        const overdue = late();
        return [
            { text: queue(data), late: false },
            {
                text: overdue
                    ? t('hpc.as_of_late', clock(data.updated))
                    : t('hpc.as_of', clock(data.updated)),
                late: overdue
            },
            { text: t('hpc.every', data.pollMin), late: false }
        ];
    }
</script>

<!-- The section's heading carries the cluster's name, so the head is the refresh control and the
     status line. -->
<Toolbar label={t('hpc.toolbar', data.name)}>
    {#if !failed}
        <ToolButton label={t('hpc.refresh_now')} onclick={onrefresh} />
    {/if}
    <p class="meta">
        <span class:ok={data.status === 'ok'} class:bad={failed}>
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
