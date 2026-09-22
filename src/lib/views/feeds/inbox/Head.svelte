<script lang="ts">
    // Layer 3, view partial. The Inbox heading: the connector's state word, how old the plate on
    // screen is, the cadence, and the one explicit refresh.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/words/text';
    import { clock } from '$lib/state/words/format';
    import type { InboxPayload } from '$lib/state/feeds/inbox';
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
    let { data, onrefresh }: { data: InboxPayload | null; onrefresh: () => void } = $props();

    // The head ages between publishes, so the minute the page is in is read as state.
    $effect(startMinuteClock);
    const now = $derived(minuteNow());

    function status(): string {
        if (data === null) return t('inbox.polling');
        if (data.status === 'unconfigured') return t('inbox.unconfigured');
        if (data.status === 'error') return t('inbox.error');
        return t('inbox.live');
    }

    /** Whether the plate on screen is older than the poll that should have replaced it. */
    function late(): boolean {
        if (data === null) return false;
        const updated = Date.parse(data.updated);
        return Number.isFinite(updated) && now - updated > (data.pollMin + LATE_GRACE_MIN) * 60000;
    }

    /** The meta parts after the state word; the stale one carries the failure tone. */
    function parts(): { text: string; late: boolean }[] {
        if (data === null || data.status === 'unconfigured') return [];
        const stale = late();
        return [
            {
                text: stale
                    ? t('inbox.as_of_late', clock(data.updated))
                    : t('inbox.as_of', clock(data.updated)),
                late: stale
            },
            {
                text:
                    data.status === 'error'
                        ? t('inbox.retrying', data.retryMin)
                        : t('inbox.every', data.pollMin),
                late: false
            }
        ];
    }
</script>

<!-- The pane carries the view's name, so the head is the connector's status line and its refresh. -->
<header>
    <p class="meta">
        <span class:ok={data?.status === 'ok'} class:bad={data?.status === 'error'}>
            {status()}
        </span>
        {#if data?.notesError}
            <span class="separator">{t('sessions.meta_sep')}</span>
            <span class="late">{t('inbox.notes_error', data.notesError)}</span>
        {/if}
        {#each parts() as part (part.text)}
            <span class="separator">{t('sessions.meta_sep')}</span>
            <span class:late={part.late}>{part.text}</span>
        {/each}
    </p>
    <ToolButton label={t('inbox.refresh_now')} onclick={onrefresh} />
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
    .late {
        color: var(--c-red-d-txt);
    }
</style>
