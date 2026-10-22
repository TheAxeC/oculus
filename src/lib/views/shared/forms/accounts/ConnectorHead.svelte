<script lang="ts">
    // Layer 3, view partial. The bar the Calendar and the Inbox share under their header: the one
    // explicit refresh, and at the bar's end the connector's state word, how old what is on screen
    // is and the cadence. Add account and the `...` menu are the header's (AccountActions.svelte).
    //
    // Refresh carries the refresh glyph beside its words, and the glyph turns while `refreshing`
    // says a press of it waits for its answer. Which presses wait is the view's store's, never this
    // head's own state, so every view of one connector turns together, a view opened while a press
    // waits turns until the answer, and one connector's press never turns the other's glyph.
    //
    // The words are the view's own, since each connector names its state in its own terms; the
    // rule for when the next poll is late is this head's, once for both.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { clock } from '$lib/state/shared/words/format';
    import type { ConnectStatus, HeadWords } from '$lib/state/life/accounts';
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
    let {
        data,
        words,
        notice = '',
        refreshing,
        onrefresh
    }: {
        data: { status: ConnectStatus; updated: string; pollMin: number; retryMin: number } | null;
        words: HeadWords;
        /** One more part after the state word, in the failure tone, or nothing. */
        notice?: string;
        /** Whether a press of Refresh waits for its answer, which turns its glyph. */
        refreshing: boolean;
        onrefresh: () => void;
    } = $props();

    // The head ages between publishes, so the minute the page is in is read as state.
    $effect(startMinuteClock);
    const now = $derived(minuteNow());

    function status(): string {
        if (data === null) return words.polling;
        if (data.status === 'unconfigured') return words.unconfigured;
        if (data.status === 'error') return words.error;
        return words.live;
    }

    /** Whether what is on screen is older than the poll that should have replaced it. */
    function late(): boolean {
        if (data === null) return false;
        const updated = Date.parse(data.updated);
        return Number.isFinite(updated) && now - updated > (data.pollMin + LATE_GRACE_MIN) * 60000;
    }

    /** The meta parts after the state word; the stale one carries the failure tone. */
    function parts(): { text: string; late: boolean }[] {
        if (data === null || data.status === 'unconfigured') return [];
        const stale = late();
        const updated = clock(data.updated);
        return [
            { text: stale ? words.asOfLate(updated) : words.asOf(updated), late: stale },
            {
                text:
                    data.status === 'error'
                        ? words.retrying(data.retryMin)
                        : words.every(data.pollMin),
                late: false
            }
        ];
    }
</script>

<!-- The pane carries the view's name, so the bar is the refresh and the connector's status
     line. -->
<Toolbar label={t('accounts.bar')}>
    <ToolButton label={words.refresh} glyph="refresh" turning={refreshing} onclick={onrefresh} />
    <p class="meta">
        <span class:ok={data?.status === 'ok'} class:bad={data?.status === 'error'}>
            {status()}
        </span>
        {#if notice !== ''}
            <span class="separator">{t('sessions.meta_sep')}</span>
            <span class="late">{notice}</span>
        {/if}
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
