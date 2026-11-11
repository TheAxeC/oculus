<script lang="ts">
    // Layer 3, sessions view partial. One workspace's group of the sessions list, drawn as the
    // Repositories view draws a change group: a group row of the list's tree with the fold's
    // chevron, the workspace's name, its folder under the pointer and the number of its sessions as
    // a badge at the right edge, then, while it is open, its rows one step further in. A press on
    // the group row folds it, and Left and Right do from the keyboard; the group folds by its key
    // in the list's pane state (views/shared/card/pane-fold.ts), the workspace without a folder
    // under the empty key. A folded group's rows are not drawn.
    //
    // A row is one line of the tree's row height, in the look of the Files tree: the session's
    // state as a dot, the pin mark of a session pinned to the top of its group, the title, and how
    // long ago it last moved at the right. What else there is to say of a session is the row's
    // hover words (`sessionRowWords`). A session needing input keeps its amber left edge. A second
    // press on a row, or the row's menu, opens the title's field in place of the title. The field
    // holds what was typed in `typed`, so a title arriving on the channel leaves the words alone.
    // It answers as the Details section's does (views/shared/sessions/sections/title-field.ts):
    // Enter writes the title and an empty one clears it, Escape closes it with nothing written and
    // the focus leaving keeps it open; Enter and Escape give the focus back to the row.

    import { tick } from 'svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import NameField from '$lib/ui/tree/row/NameField.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { ago, rowState, type ListGroup, type ListStateKey } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import {
        groupRow,
        sessionRowId,
        sessionRowItems,
        sessionRowWords,
        stateLabel
    } from './session-list';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { escapeCloses } from '$lib/views/shared/sessions/sections/title-field';
    import { useState } from '$lib/state/client/use';

    const {
        selection: { selected }
    } = useState();
    const fold = usePaneFold();

    type Props = {
        group: ListGroup;
        /** The tree the group's head and rows are rows of. */
        nav: TreeNav;
        now: number;
        armedResume: string;
        /** The row whose title is being typed, and the empty string for none. */
        renaming: string;
        isArchived: (row: GroupedSession) => boolean;
        /** Whether a row is pinned to the top, the mark drawn ahead of its write included. */
        topOf: (row: GroupedSession) => boolean;
        onaction: (id: string, row: GroupedSession) => void;
        /** A press on a row picks its session. */
        onpick: (row: GroupedSession) => void;
        /** Open the row's title field. */
        onrename: (row: GroupedSession) => void;
        /** The row's title field closed: with the text Enter took, or with null for Escape. */
        onrenamed: (row: GroupedSession, text: string | null) => void;
    };

    let {
        group,
        nav,
        now,
        armedResume,
        renaming,
        isArchived,
        topOf,
        onaction,
        onpick,
        onrename,
        onrenamed
    }: Props = $props();

    /** What the rename field holds while it is open. */
    let typed = $state('');

    const TONES: Record<ListStateKey, string> = {
        input: 'amber',
        working: 'green',
        idle: 'blue',
        ended: 'grey',
        archived: 'slate'
    };

    function dotStyle(state: ListStateKey): string {
        return `--tone: var(--c-${TONES[state]})`;
    }

    /** How long ago the row last moved, in the list's own few words. */
    function since(row: GroupedSession): string {
        const told = ago(row.lastActivity ?? row.started, now, 'day');
        if (told === null) return '';
        if (told.unit === 'now') return t('sessions.ago_now');
        if (told.unit === 'minute') return t('sessions.ago_m', String(told.count));
        if (told.unit === 'hour') return t('sessions.ago_h', String(told.count));
        return t('sessions.ago_d', String(told.count));
    }

    function startRename(entry: GroupedSession): void {
        typed = entry.title;
        onrename(entry);
    }

    /** The title's field closed, with a text or with null: the focus goes back to the row. */
    async function renamed(entry: GroupedSession, text: string | null): Promise<void> {
        onrenamed(entry, text);
        await tick();
        nav.focus(sessionRowId(entry.id));
    }

    const open = $derived(fold.open(group.key));
</script>

{#snippet row(entry: GroupedSession)}
    {@const archived = isArchived(entry)}
    {@const state = rowState(entry, archived)}
    {@const top = topOf(entry)}
    {@const on = entry.id === selected()}
    <div
        class="row"
        class:input={state === 'input'}
        class:away={archived}
        data-session-row={entry.id}
        data-state={state}
    >
        {#if renaming === entry.id}
            <TreeItem
                label=""
                name={t('sessions.rename_field')}
                id={sessionRowId(entry.id)}
                {nav}
                level={3}
                depth={2}
                selected={on}
            >
                {#snippet field()}
                    <span class="box" {@attach escapeCloses(() => void renamed(entry, null))}>
                        <NameField
                            value={typed}
                            label={t('sessions.rename_field')}
                            oninput={(value: string) => (typed = value)}
                            onsubmit={(title: string) => void renamed(entry, title)}
                            oncancel={() => void renamed(entry, null)}
                            onleave={() => undefined}
                        />
                    </span>
                {/snippet}
            </TreeItem>
        {:else}
            <TreeItem
                label={entry.title}
                id={sessionRowId(entry.id)}
                {nav}
                level={3}
                depth={2}
                selected={on}
                title={sessionRowWords(entry, state)}
                onclick={() => onpick(entry)}
                onpressagain={(event: MouseEvent) => {
                    // The press would otherwise take the focus from the field it opens.
                    event.preventDefault();
                    startRename(entry);
                }}
            >
                {#snippet words()}
                    <span class="dot" style={dotStyle(state)} title={stateLabel(state)}></span>
                    {#if top}
                        <span class="mark" title={t('sessions.top_mark')}><Glyph name="pin" /></span
                        >
                    {/if}
                    {entry.title}
                {/snippet}
                {#snippet actions(reach: number)}
                    <Menu
                        label={t('ui.row_menu')}
                        items={sessionRowItems(entry, armedResume, { top, archived })}
                        glyph={t('ui.pane_menu_glyph')}
                        compact
                        bare
                        inherit={on}
                        tabindex={reach}
                        placement="down"
                        align="right"
                        onpick={(id: string) => {
                            if (id === 'rename') startRename(entry);
                            else onaction(id, entry);
                        }}
                    />
                {/snippet}
                {#snippet end()}
                    {since(entry)}
                {/snippet}
            </TreeItem>
        {/if}
    </div>
{/snippet}

<div class="rows" data-session-group={group.key}>
    <TreeItem
        label={group.name === '' ? t('sessions.no_workspace') : group.name}
        id={groupRow(group.key)}
        {nav}
        level={2}
        depth={1}
        expanded={open}
        count={group.rows.length}
        badge
        title={group.key === '' ? undefined : group.key}
        onclick={() => fold.toggle(group.key)}
    />
    {#if open}
        {#each group.rows as entry (entry.id)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render row(entry)}{/each}
    {/if}
</div>

<style>
    .rows {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* A row starts where its level puts it, as a row of the Files tree does. */
    .row {
        position: relative;
        min-width: 0;
    }

    .box {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
    }

    /* A session needing input is marked by a 2px amber bar at the row's left edge, laid over the
       row so it takes no width, the row's words stay where they are when it comes and goes, and it
       shows over the row's hover and selection tint. It stops 4px short of the row's top and bottom
       so it stays inside the rounded corners of the tint and the focus outline. */
    .row.input::after {
        position: absolute;
        inset: 4px auto 4px 0;
        width: 2px;
        border-radius: 1px;
        background: var(--c-amber);
        content: '';
        pointer-events: none;
    }

    .row.away {
        opacity: 0.6;
    }

    .mark {
        display: inline-flex;
        margin-right: 4px;
        font-size: var(--fs-xs);
    }

    .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 6px;
        border-radius: var(--radius-pill);
        background: var(--tone);
    }
</style>
