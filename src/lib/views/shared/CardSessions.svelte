<script lang="ts">
    // Layer 3, shared view. Working project sessions live here because live-session navigation
    // changes independently of the project-card frame.

    import Chip from '$lib/ui/Chip.svelte';
    import type { BoardItem } from '$lib/state/board';
    import { findView } from '$lib/state/layout';
    import { folderOf, type GroupedSession } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { useState } from '$lib/state/use';

    const {
        layout: { openView, workbench },
        selection: { select },
        selectors: { sessionsForProject }
    } = useState();

    type Props = {
        /** The joined board item whose working sessions are shown. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    /** Views that already follow the selected session. */
    const SESSION_VIEWS = [
        'session-list',
        'session-detail',
        'terminal',
        'timeline',
        'changes',
        'agents'
    ] as const;

    const working = $derived.by(() => {
        const folder = folderOf(item.project);
        return folder === '' ? [] : sessionsForProject(folder);
    });

    /** The state dot's color for one grouped session. */
    function dotStyle(entry: GroupedSession): string {
        if (entry.state === 'working') return '--tone: var(--c-green)';
        if (entry.state === 'idle') return '--tone: var(--c-amber)';
        if (entry.state === 'ended') return '--tone: var(--c-grey)';
        return '--tone: var(--c-slate)';
    }

    /** Whether either workbench tree already shows a session-following view. */
    function sessionViewOpen(): boolean {
        const trees = [workbench().main, workbench().panel];
        return SESSION_VIEWS.some((view) =>
            trees.some((tree) => findView(tree, view, null) !== null)
        );
    }

    /** Select one session and open a detail view when no session view is visible. */
    function pick(entry: GroupedSession): void {
        select(entry.id);
        if (!sessionViewOpen()) openView('session-detail', 'panel');
    }
</script>

{#if working.length > 0}
    {@const live = working.filter((entry) => entry.live).length}
    <div class="sessions">
        <Chip
            label={working.length === 1
                ? t('sessions.card_one')
                : t('sessions.card_n', working.length)}
        />
        {#if live > 0}
            <Chip label={t('sessions.card_live', live)} tone="green" />
        {/if}
        {#each working as entry (entry.id)}
            <button
                type="button"
                class="session"
                title={t('sessions.select_tip')}
                onclick={() => pick(entry)}
            >
                <span class="dot" style={dotStyle(entry)}></span>
                <Chip label={entry.tool} />
                <span class="nm">{entry.title}</span>
            </button>
        {/each}
    </div>
{/if}

<style>
    .sessions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .session {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        max-width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: none;
        color: inherit;
        font: inherit;
        padding: 1px 6px;
        cursor: pointer;
        text-align: left;
        font-size: var(--fs-sm);
    }

    .session:hover {
        background: var(--chip);
    }

    .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--tone);
        flex: none;
    }

    .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
