<script lang="ts">
    // Layer 3, shared view partial. One session as a row of the lists that name the sessions
    // working in a folder: the project page's and the entry page's. A row shows the session's tool
    // and title, whether it is live, its model and when it started, and pressing it selects the
    // session for the page, so it is the same row the session list draws.

    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import { modelShort, stamp } from '$lib/state/shared/words/format';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        selection: { select, selected }
    } = useState();

    type Props = {
        entry: GroupedSession;
        /** Read once by the page, so the stamps of its rows agree on what day it is. */
        now: number;
    };

    let { entry, now }: Props = $props();

    /** What a live row says of itself, the same two words the session list uses. */
    const liveLabel = $derived(
        entry.liveStatus === 'busy'
            ? t('sessions.live_busy')
            : entry.liveStatus === 'idle'
              ? t('sessions.live_idle')
              : (entry.liveStatus ?? '')
    );
</script>

<div class="session" class:on={entry.id === selected()}>
    <RowButton title={t('sessions.select_tip')} onclick={() => select(entry.id)}>
        <span class="top">
            <Tag label={entry.tool} />
            <span class="nm">{entry.title}</span>
        </span>
        <span class="meta">
            {#if entry.live}
                <span class="st">{liveLabel}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
            {/if}
            <span class="mo">{modelShort(entry.model)}</span>
            <span class="sep">{t('sessions.meta_sep')}</span>
            <span class="ts">{stamp(entry.started, now)}</span>
        </span>
    </RowButton>
</div>

<style>
    .session {
        display: flex;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        margin-bottom: 4px;
        padding: 0 2px;
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .session.on {
        border-color: var(--accent);
    }

    .top {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
    }

    .meta {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
