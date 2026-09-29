<script lang="ts">
    // Layer 3, view partial. A Terminal tab's list of its own terminals, drawn on the right of the
    // tab's body from two terminals on, as VS Code's terminal panel draws its tabs list there. One
    // row per terminal the tab owns, in the tab's own order, titled after what runs in it, with its
    // description muted after the title, the rows the tab shows marked (both halves of a split),
    // and a bell mark while a shown terminal rings.
    //
    // A press on a row shows that terminal in this tab, alone, unless it is a half of the split the
    // tab draws, whose grid the press focuses (state/sessions/terminal/terminal-tabs.ts,
    // `showingRow`).
    //
    // The list is one stop of the browser's focus order, by ui/tree/roving.ts's rule: the row at
    // the stop carries tabindex 0 and everything else in the list -1, Split and Kill included. The
    // arrow keys move the stop, Enter shows the row, Shift+Enter splits it, and Delete or Backspace
    // kills it as Kill does, the first press arming and the second killing; the two controls are
    // the pointer's way to the same two actions, shown on hover. An armed Kill is disarmed when the
    // stop moves or focus leaves the list, and a held key arms nothing (terminal-list.ts, `rowKey`
    // and `armKept`). The arm is held by the tab (Terminal.svelte), since the grid's menu arms and
    // kills through the same `pressKill`. A pointer press on a row shows it and hands the keyboard
    // to its grid, so the list holds focus only for a reader who came to it by the keyboard.
    //
    // Split divides this tab: the row's terminal on the left, and on the right the composer in the
    // row's own folder and kind, offered as a place of its own when no place of the composer holds
    // it (state/sessions/terminal/composer.ts); what it starts becomes the right half.
    //
    // A row dragged within the list moves there, in the tab's own order, kept in the tab's layout
    // state. A row dropped on another Terminal tab's list moves to that tab at the drop mark, by
    // the terminals store's `moveTerminal`, and a tab it leaves owning nothing closes.
    //
    // A right-click on a row opens VS Code's terminal tab menu (terminal-list.ts,
    // `terminalRowMenu`): Split Terminal and Kill Terminal, which the tab runs as the grid's menu
    // does, Kill Terminal arming first as the row's Kill does, Unsplit Terminal on a half of the
    // split the tab shows, which shows that terminal alone, and Join Terminals, which moves a
    // terminal another Terminal tab owns into this tab after the row and shows it split with the
    // row. A right-click on the list's empty area offers New Terminal, the composer in this tab as
    // the bar's New shows it, and New Terminal With Profile, the same composer set to the kind
    // picked.

    import { untrack } from 'svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { composerOf, withComposer } from '$lib/state/sessions/terminal/composer';
    import {
        readTab,
        reordered,
        showingOne,
        showingRow,
        splitWith,
        type TerminalTabState
    } from '$lib/state/sessions/terminal/terminal-tabs';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { nextStop } from '$lib/ui/tree/roving';
    import {
        MENU_KILL,
        MENU_NEW,
        MENU_SPLIT,
        MENU_UNSPLIT,
        ROW_DRAG,
        armKept,
        emptyListMenu,
        joinedOf,
        movedOrder,
        profileOf,
        rowKey,
        terminalRowMenu,
        terminalTip
    } from './terminal-list';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The Terminal tab the list is drawn in. */
        instance: string;
        /** The page holding that tab. */
        page: string;
        /** The tab's own state. */
        tab: TerminalTabState;
        /** The rows, in the order they are drawn. */
        rows: TerminalChoice[];
        /** The terminals the tab shows now: the shown one, and the right half of a split. */
        current: string[];
        /** The terminal whose bell is ringing in this tab, or null. */
        ringing: string | null;
        /** The terminals the other Terminal tabs own, by name, which Join Terminals offers. */
        others: { terminal: string; title: string }[];
        /** Called with a row's terminal when a pointer press shows it, before it is shown. */
        onshown: (terminal: string) => void;
        /** Split the tab on a row's terminal, as the row's Split and its menu do. */
        onsplit: (terminal: string) => void;
        /** The terminal whose Kill was pressed or picked once and waits for the second, or ''. */
        arming: string;
        /** A kill the server refused, said below the rows until the next one. */
        failure: string;
        /**
         * A press of a row's Kill, a Delete or Backspace on it, or Kill Terminal from its menu: the
         * tab's `pressKill`, which arms the terminal first and kills it on the second.
         */
        onkill: (terminal: string) => void;
        /** Take the arm off, when the stop moves off the armed row or focus leaves the list. */
        ondisarm: () => void;
    };

    let {
        instance,
        page,
        tab,
        rows,
        current,
        ringing,
        others,
        onshown,
        onsplit,
        arming,
        failure,
        onkill,
        ondisarm
    }: Props = $props();

    const {
        layout: { instanceLayoutState, restateInstance },
        terminals: { composeInTab, moveTerminal, terminalById },
        ui: { instanceState, setInstanceState }
    } = useState();

    let list: HTMLDivElement | null = $state(null);

    /** The row the keyboard stop was moved to, while it is still a row. */
    let stopped = $state('');
    /** Where a dragged row would be dropped, as an index of the rows drawn, or null. */
    let dropIndex: number | null = $state(null);

    const order = $derived(rows.map((row) => row.terminal));
    const stop = $derived(
        order.includes(stopped)
            ? stopped
            : (current.find((one) => order.includes(one)) ?? (order.length > 0 ? order[0] : ''))
    );

    // Whatever moves the stop (the arrow keys, a selection made elsewhere, the stopped row going
    // away), an armed Kill on another row is disarmed.
    $effect(() => {
        const at = stop;
        untrack(() => {
            if (arming !== '' && !armKept(arming, at)) ondisarm();
        });
    });

    function kindGlyph(kind: TerminalChoice['kind']): string {
        if (kind === 'claude') return t('sessions.kind_claude_glyph');
        if (kind === 'codex') return t('sessions.kind_codex_glyph');
        return t('sessions.kind_shell_glyph');
    }

    /** The row's tooltip: the terminal's name, command, folder and start time. */
    function tip(row: TerminalChoice): string {
        const held = terminalById(row.terminal);
        return held === null ? row.title : terminalTip(held);
    }

    /** Show a row's terminal in this tab. */
    function show(row: TerminalChoice): void {
        const next = showingRow(tab, row.terminal);
        if (next !== tab) restateInstance(instance, next);
    }

    /** Split this tab: the row on the left, the composer in its folder and kind on the right. */
    function split(row: TerminalChoice): void {
        onsplit(row.terminal);
    }

    /**
     * Join Terminals: the terminal another tab owns moves into this tab after the row, and the tab
     * shows the row with it beside. The tab's state is read again after the move, which changed it.
     */
    function join(row: TerminalChoice, moving: string): void {
        moveTerminal(moving, instance, page, tab.terminals.indexOf(row.terminal) + 1);
        const moved = readTab(instanceLayoutState(instance));
        restateInstance(instance, splitWith(showingOne(moved, row.terminal), moving));
    }

    function rowPicked(row: TerminalChoice, pick: string): void {
        const joining = joinedOf(pick);
        if (joining !== null) join(row, joining);
        else if (pick === MENU_SPLIT) split(row);
        else if (pick === MENU_KILL) kill(row);
        else if (pick === MENU_UNSPLIT) restateInstance(instance, showingOne(tab, row.terminal));
    }

    /** New Terminal, or New Terminal With Profile, which sets the composer to the kind picked. */
    function emptyPicked(pick: string): void {
        const kind = profileOf(pick);
        if (pick !== MENU_NEW && kind === null) return;
        composeInTab(instance);
        if (kind === null) return;
        const held = instanceState(instance);
        setInstanceState(instance, withComposer(held, { ...composerOf(held), agent: kind }));
    }

    /** A press on a row: a pointer's hands the keyboard to the grid, a key's leaves it here. */
    function pressed(event: MouseEvent, row: TerminalChoice): void {
        if (event.detail > 0) onshown(row.terminal);
        show(row);
    }

    /**
     * Focus leaving the list disarms Kill, so a later Delete or Backspace arms it again. A row's
     * menu takes the focus into its own content, outside the list, as it opens; that keeps the
     * arm, so Kill Terminal picked from it a second time kills.
     */
    function left(event: FocusEvent): void {
        const to = event.relatedTarget;
        if (to instanceof Node && list?.contains(to) === true) return;
        if (to instanceof Element && to.closest('[role="menu"]') !== null) return;
        if (arming !== '') ondisarm();
    }

    /** The first press arms Kill and the second stops the terminal, as the Sessions list's does. */
    function kill(row: TerminalChoice): void {
        onkill(row.terminal);
    }

    /**
     * Move the stop with the arrow keys, Home and End, and act on the row at it: Enter shows it,
     * Shift+Enter splits it, Delete and Backspace kill it.
     */
    function keys(event: KeyboardEvent, index: number): void {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const action = rowKey(event.key, event.shiftKey, event.repeat);
        if (action !== null) {
            event.preventDefault();
            if (action === 'show') show(rows[index]);
            else if (action === 'split') split(rows[index]);
            else kill(rows[index]);
            return;
        }
        const next = nextStop(event.key, index, rows.length, 'column');
        if (next === null) return;
        event.preventDefault();
        stopped = rows[next].terminal;
        list?.querySelector<HTMLElement>(`[data-stop="${CSS.escape(stopped)}"]`)?.focus();
    }

    function dragStart(event: DragEvent, row: TerminalChoice): void {
        event.dataTransfer?.setData(ROW_DRAG, row.terminal);
        if (event.dataTransfer !== null) event.dataTransfer.effectAllowed = 'move';
    }

    /** A dragged row over a row: it would land before it, or after it past the row's middle. */
    function dragOver(event: DragEvent, index: number): void {
        if (event.dataTransfer?.types.includes(ROW_DRAG) !== true) return;
        event.preventDefault();
        event.stopPropagation();
        const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
        dropIndex = event.clientY > box.top + box.height / 2 ? index + 1 : index;
    }

    /** A dragged row over the list below its rows lands last. */
    function listOver(event: DragEvent): void {
        if (event.dataTransfer?.types.includes(ROW_DRAG) !== true) return;
        event.preventDefault();
        dropIndex = rows.length;
    }

    /**
     * A row dropped at the mark: one of this tab's rows is reordered in the tab, and one of another
     * tab moves into this one before the row at the mark, or last.
     */
    function dropped(event: DragEvent): void {
        const moved = event.dataTransfer?.getData(ROW_DRAG) ?? '';
        const at = dropIndex;
        dropIndex = null;
        if (moved === '' || at === null) return;
        event.preventDefault();
        if (order.includes(moved)) {
            restateInstance(instance, reordered(tab, movedOrder(order, moved, at)));
            return;
        }
        const index =
            at < rows.length ? tab.terminals.indexOf(rows[at].terminal) : tab.terminals.length;
        moveTerminal(moved, instance, page, index);
    }
</script>

<!-- The drag handlers report where a dragged row would land and take the drop, and focus leaving
     the list disarms Kill; the rows' own controls carry the keyboard. -->
<ContextMenu label={t('sessions.terminal_list')} items={emptyListMenu(t)} onpick={emptyPicked}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="list"
        data-terminal-list
        role="group"
        aria-label={t('sessions.terminal_list')}
        bind:this={list}
        onfocusout={left}
        ondragover={listOver}
        ondrop={dropped}
        ondragleave={(event: DragEvent) => {
            if (!list?.contains(event.relatedTarget as Node | null)) dropIndex = null;
        }}
    >
        {#each rows as row, index (row.terminal)}
            {#if dropIndex === index}
                <span class="mark" aria-hidden="true"></span>
            {/if}
            <ContextMenu
                label={row.title}
                read={() => terminalRowMenu(tab, row.terminal, others, arming === row.terminal, t)}
                own
                onpick={(pick: string) => rowPicked(row, pick)}
            >
                <div
                    class="row"
                    class:current={current.includes(row.terminal)}
                    class:armed={arming === row.terminal}
                    data-terminal-row={row.terminal}
                    data-current={current.includes(row.terminal) || undefined}
                    draggable="true"
                    ondragstart={(event: DragEvent) => dragStart(event, row)}
                    ondragover={(event: DragEvent) => dragOver(event, index)}
                >
                    <span class="pick">
                        <ToolButton
                            cell
                            label={`${row.title} ${row.description}`}
                            title={tip(row)}
                            tabindex={row.terminal === stop ? 0 : -1}
                            stop={row.terminal}
                            onclick={(event: MouseEvent) => pressed(event, row)}
                            onkeydown={(event: KeyboardEvent) => keys(event, index)}
                        >
                            <span class="face">
                                <Glyph name={kindGlyph(row.kind)} />
                                <span class="title" data-row-title>{row.title}</span>
                                <span class="description" data-row-description
                                    >{row.description}</span
                                >
                                {#if ringing === row.terminal}
                                    <span
                                        class="bell"
                                        data-bell
                                        title={t('sessions.terminal_bell')}
                                    >
                                        <Glyph name="bell" />
                                    </span>
                                {/if}
                            </span>
                        </ToolButton>
                    </span>
                    <span class="actions">
                        <ToolButton
                            compact
                            bare
                            label={t('sessions.terminal_split')}
                            title={t('sessions.terminal_split_tip')}
                            glyph="split_right"
                            tabindex={-1}
                            onclick={() => split(row)}
                        />
                        <ToolButton
                            compact
                            bare
                            label={arming === row.terminal
                                ? t('sessions.terminal_kill_armed')
                                : t('sessions.terminal_kill')}
                            title={arming === row.terminal
                                ? t('sessions.terminal_kill_armed')
                                : t('sessions.terminal_kill_tip')}
                            glyph="trash"
                            pressed={arming === row.terminal}
                            tabindex={-1}
                            onclick={() => kill(row)}
                        />
                    </span>
                </div>
            </ContextMenu>
        {/each}
        {#if dropIndex !== null && dropIndex >= rows.length}
            <span class="mark" aria-hidden="true"></span>
        {/if}
        {#if failure !== ''}
            <p class="failure" role="alert">{failure}</p>
        {/if}
    </div>
</ContextMenu>

<style>
    .list {
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        width: 180px;
        min-height: 0;
        overflow-y: auto;
        border-left: 1px solid var(--line);
    }

    /* One row of VS Code's tabs list, 22 pixels. */
    .row {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 22px;
        min-width: 0;
        padding: 0 2px 0 6px;
        border-left: 2px solid transparent;
    }

    .row:hover {
        background: var(--chip);
    }

    .row.current {
        border-left-color: var(--accent);
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    .pick {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        height: 100%;
    }

    .face {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 100%;
        min-width: 0;
        cursor: pointer;
    }

    .title,
    .description {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .title {
        flex: 0 1 auto;
        font-size: var(--fs-sm);
    }

    .description {
        flex: 1 1 0;
        min-width: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .bell {
        flex: 0 0 auto;
        color: var(--accent-txt, var(--accent));
    }

    /* The row's controls are drawn clear, and drawn while the pointer or the keyboard's stop is on
       the row, or while its Kill is armed, so the armed Kill shows while a Delete, a Backspace or
       a menu's Kill Terminal waits for its second press. */
    .actions {
        display: flex;
        flex: 0 0 auto;
        opacity: 0;
    }

    .row:hover .actions,
    .row:focus-within .actions,
    .row.armed .actions {
        opacity: 1;
    }

    .mark {
        height: 2px;
        background: var(--accent);
    }

    .failure {
        margin: 4px 6px;
        color: var(--c-red-txt, var(--ink));
        font-size: var(--fs-xs);
    }
</style>
