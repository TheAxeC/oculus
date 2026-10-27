<script lang="ts">
    // Layer 3, sessions view partial. One workspace's group of the sessions list: the group every
    // grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), headed with the
    // workspace's name and count and its folder under the pointer, then its rows. The group folds
    // by its key in the list's pane state (views/shared/card/pane-fold.ts), the workspace without a
    // folder under the empty key.
    //
    // A row is VS Code's agent session item, two lines 3px in from the row's edges (40 px): an 18
    // px line with the state at the left and the title, and a 16 px line with the agent, the model,
    // how long ago it last moved, the files it changed and its prompts. The model and the age are
    // left out when the session has none, and the whole line is cut with an ellipsis where the pane
    // ends. A row being renamed holds the title's field in place of the title and is as high as
    // that field.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { modelShort } from '$lib/state/shared/words/format';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { ago, rowState, type ListGroup, type ListStateKey } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { sessionRowItems, stateLabel } from './session-list';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { useState } from '$lib/state/client/use';

    const {
        selection: { selected }
    } = useState();
    const fold = usePaneFold();

    type Props = {
        group: ListGroup;
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

    function agentWords(row: GroupedSession): string {
        return row.tool === 'codex' ? t('sessions.kind_codex') : t('sessions.kind_claude');
    }

    function startRename(row: GroupedSession): void {
        typed = row.title;
        onrename(row, null);
    }

    // Escape closes the rename field without a title. The field is a primitive that takes no key
    // handler, so the key is read on the document while a field is open.
    $effect(() => {
        const open = renaming;
        if (open === '') return;
        const row = group.rows.find((one) => one.id === open);
        if (row === undefined) return;
        const escape = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            onrename(row, '');
        };
        document.addEventListener('keydown', escape, true);
        // The field opens with the focus in it and its text selected, as an inline rename does.
        const field = document.querySelector(`[data-rename="${CSS.escape(open)}"] input`);
        if (field instanceof HTMLInputElement) {
            field.focus();
            field.select();
        }
        return () => document.removeEventListener('keydown', escape, true);
    });
</script>

{#snippet row(entry: GroupedSession)}
    {@const archived = isArchived(entry)}
    {@const state = rowState(entry, archived)}
    {@const top = topOf(entry)}
    {@const age = since(entry)}
    <div
        class="row"
        class:on={entry.id === selected()}
        class:input={state === 'input'}
        class:away={archived}
        data-session-row={entry.id}
        data-state={state}
    >
        {#if renaming === entry.id}
            <form
                class="rename"
                data-rename={entry.id}
                onsubmit={(event) => {
                    event.preventDefault();
                    onrename(entry, typed);
                }}
            >
                <TextInput
                    value={typed}
                    label={t('sessions.rename_field')}
                    oninput={(value: string) => (typed = value)}
                />
            </form>
        {:else}
            <RowButton
                title={t('sessions.select_tip')}
                selected={entry.id === selected()}
                onclick={() => onpick(entry)}
                ondblclick={() => startRename(entry)}
            >
                <span class="line one">
                    <span class="dot" style={dotStyle(state)} title={stateLabel(state)}></span>
                    <span class="nm">{entry.title}</span>
                    {#if top}
                        <span class="mark" title={t('sessions.top_mark')}><Glyph name="pin" /></span
                        >
                    {/if}
                    {#if state === 'input'}
                        <span class="mark" title={entry.hook?.message ?? undefined}
                            ><Tag label={t('sessions.state_input')} tone="amber" /></span
                        >
                    {/if}
                </span>
                <span class="line two">
                    <span>{agentWords(entry)}</span>
                    {#if entry.model !== null}
                        <span class="sep">{t('sessions.meta_sep')}</span>
                        <span>{modelShort(entry.model)}</span>
                    {/if}
                    {#if age !== ''}
                        <span class="sep">{t('sessions.meta_sep')}</span>
                        <span>{age}</span>
                    {/if}
                    <span class="sep">{t('sessions.meta_sep')}</span>
                    <span title={t('sessions.files_tip')}
                        >{entry.files.length === 1
                            ? t('sessions.files_one')
                            : t('sessions.files_n', String(entry.files.length))}</span
                    >
                    <span class="sep">{t('sessions.meta_sep')}</span>
                    <span title={t('sessions.prompts_tip')}
                        >{entry.prompts === 1
                            ? t('sessions.prompts_one')
                            : t('sessions.prompts_n', String(entry.prompts))}</span
                    >
                </span>
            </RowButton>
            <div class="menu">
                <Menu
                    label={t('ui.row_menu')}
                    items={sessionRowItems(entry, armedResume, { top, archived })}
                    glyph={t('ui.pane_menu_glyph')}
                    compact
                    bare
                    inherit={entry.id === selected()}
                    placement="down"
                    align="right"
                    onpick={(id: string) => {
                        if (id === 'rename') startRename(entry);
                        else onaction(id, entry);
                    }}
                />
            </div>
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

    /* The row's menu is drawn while the pointer is on the row, the focus is inside it, it is the
       selected row, and always on a screen that does not hover. */
    .row {
        --row-reveal: 0;
        display: flex;
        align-items: stretch;
        min-width: 0;
        border-left: 2px solid transparent;
    }

    .row:hover,
    .row:focus-within,
    .row.on {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .row {
            --row-reveal: 1;
        }
    }

    .row:hover {
        background: var(--chip);
    }

    .row.on {
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    /* The selected row's details line and its menu read in the ink of the selection tint. */
    .row.on .two {
        color: inherit;
    }

    .row.input {
        border-left-color: var(--c-amber);
    }

    .row.away {
        opacity: 0.6;
    }

    .line {
        min-width: 0;
        white-space: nowrap;
    }

    /* The title line of VS Code's agent session item: 18 px, 3px below the row's top edge. */
    .one {
        display: flex;
        align-items: center;
        gap: 4px;
        height: calc(18px * var(--text-scale, 1));
        margin-top: 3px;
    }

    .one .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--fs-sm);
    }

    /* The details line: 16 px, 3px above the row's bottom edge, under the title and past the
       state's dot. It is a block of inline parts and not a flex box, so the whole line is cut with
       one ellipsis where the pane ends. */
    .two {
        display: block;
        height: calc(16px * var(--text-scale, 1));
        margin-bottom: 3px;
        padding-left: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: calc(16px * var(--text-scale, 1));
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .mark {
        flex: none;
        display: inline-flex;
        font-size: var(--fs-xs);
    }

    .dot {
        flex: none;
        width: 8px;
        height: 8px;
        border-radius: var(--radius-pill);
        background: var(--tone);
    }

    .menu {
        display: flex;
        align-items: flex-start;
        padding-top: 1px;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    .rename {
        flex: 1 1 auto;
        min-width: 0;
        padding: 2px 6px;
    }
</style>
