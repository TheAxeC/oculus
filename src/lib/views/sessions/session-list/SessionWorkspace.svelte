<script lang="ts">
    // Layer 3, sessions view partial. One workspace's group of the sessions list: a side-bar
    // section header with the workspace's name and count, then its rows. A row is two lines of the
    // list's row height, as a VS Code list row is one: the state at the left and the title, then
    // the agent, the model, how long ago it last moved, the files it changed and its prompts. A
    // row being renamed holds the title's field in place of the title.

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
    import { useState } from '$lib/state/client/use';

    const {
        selection: { select, selected }
    } = useState();

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
        onrename: (row: GroupedSession, title: string | null) => void;
    };

    let { group, now, armedResume, renaming, isArchived, topOf, onaction, onrename }: Props =
        $props();

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
                onclick={() => select(entry.id)}
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
                    <span class="sep">{t('sessions.meta_sep')}</span>
                    <span>{since(entry)}</span>
                    <span class="sep">{t('sessions.meta_sep')}</span>
                    <span title={t('sessions.files_tip')}
                        >{t('sessions.files_n', String(entry.files.length))}</span
                    >
                    <span class="sep">{t('sessions.meta_sep')}</span>
                    <span title={t('sessions.prompts_tip')}
                        >{t('sessions.prompts_n', String(entry.prompts))}</span
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

<section class="group" data-session-group={group.key}>
    <h3 class="head" title={group.key}>
        <span class="nm">{group.name === '' ? t('sessions.no_workspace') : group.name}</span>
        <span class="n">{group.rows.length}</span>
    </h3>
    {#each group.rows as entry (entry.id)}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render row(entry)}{/each}
</section>

<style>
    .group {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* A side-bar section header: the name in small capitals on a line of the row height. */
    .head {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 22px;
        margin: 0;
        padding: 0 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .head .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .head .n {
        margin-left: auto;
        font-family: var(--font-num);
        font-weight: 400;
    }

    .row {
        display: flex;
        align-items: stretch;
        min-width: 0;
        border-left: 2px solid transparent;
    }

    .row:hover {
        background: var(--chip);
    }

    .row.on {
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    /* The selected row's second line and its menu read in the ink of the selection tint. */
    .row.on .two {
        color: inherit;
    }

    .row.input {
        border-left-color: var(--c-amber);
    }

    .row.away {
        opacity: 0.6;
    }

    /* Each line is one list row of VS Code's, 22 pixels. */
    .line {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 22px;
        min-width: 0;
        white-space: nowrap;
    }

    .one .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--fs-md);
    }

    .two {
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        padding-left: 12px;
    }

    .mark {
        flex: none;
        display: inline-flex;
        font-size: var(--fs-3xs);
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
    }

    .rename {
        flex: 1 1 auto;
        min-width: 0;
        padding: 2px 6px;
    }
</style>
