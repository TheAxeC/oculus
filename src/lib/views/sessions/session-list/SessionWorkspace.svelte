<script lang="ts">
    // Layer 3, sessions view partial. One workspace's group of the sessions list: the group every
    // grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), headed with the
    // workspace's name and count and its folder under the pointer, then its rows. The heading is a
    // row of the list's tree, and the group folds by its key in the list's pane state
    // (views/shared/card/pane-fold.ts), the workspace without a folder under the empty key.
    //
    // A row is one line of the tree's row height, in the look of the Files tree: the session's
    // state as a dot, the pin mark of a session pinned to the top of its group, the title, and how
    // long ago it last moved at the right. What else there is to say of a session is the row's
    // hover words (`sessionRowWords`). A session needing input keeps its amber left edge. A second
    // press on a row, or the row's menu, opens the title's field in place of the title. The field
    // holds what was typed in `typed`, so a title arriving on the channel leaves the words alone.

    import { tick } from 'svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
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
        onrename: (row: GroupedSession, title: string | null) => void;
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
        onrename
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
        onrename(entry, null);
    }

    /** The title's field closed, with a title or with '': the focus goes back to the row. */
    async function renamed(entry: GroupedSession, title: string): Promise<void> {
        onrename(entry, title);
        await tick();
        nav.focus(sessionRowId(entry.id));
    }

    // Escape closes the title's field without a title wherever the focus is, so the key is read on
    // the document while a field is open. With the focus in the field the field's own Escape does
    // it, which brings the focus back to the row.
    $effect(() => {
        const open = renaming;
        if (open === '') return;
        const entry = group.rows.find((one) => one.id === open);
        if (entry === undefined) return;
        const field = `[data-session-row="${CSS.escape(open)}"] input`;
        const escape = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') return;
            if (event.target instanceof Element && event.target.closest(field) !== null) return;
            event.preventDefault();
            event.stopPropagation();
            onrename(entry, '');
        };
        document.addEventListener('keydown', escape, true);
        return () => document.removeEventListener('keydown', escape, true);
    });
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
                depth={1}
                selected={on}
            >
                {#snippet field()}
                    <NameField
                        value={typed}
                        label={t('sessions.rename_field')}
                        oninput={(value: string) => (typed = value)}
                        onsubmit={(title: string) => void renamed(entry, title)}
                        oncancel={() => void renamed(entry, '')}
                        onleave={() => undefined}
                    />
                {/snippet}
            </TreeItem>
        {:else}
            <TreeItem
                label={entry.title}
                id={sessionRowId(entry.id)}
                {nav}
                level={3}
                depth={1}
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

<GroupHead
    data-session-group={group.key}
    label={group.name === '' ? t('sessions.no_workspace') : group.name}
    tip={group.key === '' ? undefined : group.key}
    count={group.rows.length}
    open={fold.open(group.key)}
    ontoggle={() => fold.toggle(group.key)}
    row={{ id: groupRow(group.key), nav }}
>
    <div class="rows">
        {#each group.rows as entry (entry.id)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render row(entry)}{/each}
    </div>
</GroupHead>

<style>
    .rows {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .row {
        min-width: 0;
        border-left: 2px solid transparent;
    }

    .row.input {
        border-left-color: var(--c-amber);
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
