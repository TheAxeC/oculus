<script lang="ts">
    // Layer 3, view partial. A Terminal tab's list of its own terminals, drawn on the right of the
    // tab's body from two terminals on, as VS Code's terminal panel draws its tabs list there. One
    // row per terminal the tab owns, in the tab's own order, titled after what runs in it, with its
    // description muted after the title, the rows the tab shows marked (every terminal of the row
    // the tab draws side by side), and a bell mark while a shown terminal rings.
    //
    // A press on a row shows that terminal in this tab, alone, unless it is one of the terminals of
    // the row the tab draws, whose grid the press focuses
    // (state/sessions/terminal/terminal-tabs.ts, `showingRow`).
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
    // Split starts a terminal of the row's own kind in the row's own folder at once and puts it
    // right of that terminal in the tab's row, which holds any number of terminals (the terminals
    // store's `splitTerminal`).
    //
    // A double click on a row's name, and Rename on its menu, open the inline field
    // (RenameField.svelte) in the name's place: Enter saves, Escape cancels, an empty value clears
    // the title. Change Icon and Change Color on the menu dress the row's mark, and Clear empties
    // the terminal's history.
    //
    // A row dragged within the list moves there, in the tab's own order, kept in the tab's layout
    // state. A row dropped on another Terminal tab's list moves to that tab at the drop mark, by
    // the terminals store's `moveTerminal`, and a tab it leaves owning nothing closes.
    //
    // A right-click on a row opens VS Code's terminal tab menu (terminal-list.ts,
    // `terminalRowMenu`): Split Terminal and Kill Terminal, which the tab runs as the grid's menu
    // does, Kill Terminal arming first as the row's Kill does, Unsplit Terminal on a terminal of a
    // row of more than one, which takes it out of the row (it stays in the tab), and Join
    // Terminals, which moves a terminal another Terminal tab owns into this tab and appends it to
    // the end of the row. A right-click on the list's empty area offers New Terminal, a shell
    // started in the tab's folder as the bar's New starts it, New Terminal With Profile, the same
    // start of the kind picked, and Attach to Session, which joins a running terminal no Terminal
    // tab owns to the end of this tab and shows it. A pick is routed by terminal-list.ts's
    // `routePick`, the function the bar's menu of a sole terminal routes its own by, to the
    // handlers the tab hands the list.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { reordered, showingRow } from '$lib/state/sessions/terminal/terminal-tabs';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { nextStop } from '$lib/ui/tree/roving';
    import RenameField from './RenameField.svelte';
    import {
        MENU_NEW,
        ROW_DRAG,
        armKept,
        attachedOf,
        emptyListMenu,
        markStyle,
        movedOrder,
        profileOf,
        routePick,
        rowKey,
        terminalRowMenu,
        terminalTip,
        type TerminalListProps
    } from './terminal-list';
    import { markGlyph } from '$lib/state/sessions/terminal/terminal-marks';
    import { useState } from '$lib/state/client/use';

    let {
        instance,
        page,
        tab,
        rows,
        current,
        ringing,
        others,
        attachables,
        onshown,
        handlers,
        renaming,
        onrenamed,
        onrenamecancel,
        arming,
        failure,
        ondisarm
    }: TerminalListProps = $props();

    const {
        layout: { restateInstance },
        terminals: { attachTerminal, moveTerminal, startInTab, terminalById }
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

    /** Split this terminal: one of its kind and folder starts right of it. */
    function split(row: TerminalChoice): void {
        handlers.split(row.terminal);
    }

    /** A pick of a row's menu, routed as the bar's menu of a sole terminal routes its own. */
    function rowPicked(row: TerminalChoice, pick: string): void {
        routePick(pick, row.terminal, handlers);
    }

    /**
     * New Terminal, or New Terminal With Profile: a terminal of the kind starts at once. Attach to
     * Session: a running terminal no tab owns joins the end of this tab.
     */
    function emptyPicked(pick: string): void {
        const kind = profileOf(pick);
        const attaching = attachedOf(pick);
        if (pick === MENU_NEW) void startInTab(instance, 'shell');
        else if (kind !== null) void startInTab(instance, kind);
        else if (attaching !== null) attachTerminal(instance, attaching);
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
        handlers.kill(row.terminal);
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
<ContextMenu
    label={t('sessions.terminal_list')}
    items={emptyListMenu(t, attachables)}
    onpick={emptyPicked}
>
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
                        {#if renaming === row.terminal}
                            <!-- The field is not inside the row's button: a text box cannot be
                                 typed into within one. -->
                            <span class="face">
                                <span class="markglyph" style={markStyle(row.color)}>
                                    <Glyph name={markGlyph(row.kind, row.icon)} />
                                </span>
                                <RenameField
                                    value={row.title}
                                    label={t('sessions.terminal_rename_field')}
                                    onsave={(value: string) => onrenamed(row.terminal, value)}
                                    oncancel={onrenamecancel}
                                />
                            </span>
                        {:else}
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
                                    <span class="markglyph" style={markStyle(row.color)}>
                                        <Glyph name={markGlyph(row.kind, row.icon)} />
                                    </span>
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <span
                                        class="title"
                                        data-row-title
                                        ondblclick={() => handlers.rename(row.terminal)}
                                        >{row.title}</span
                                    >
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
                        {/if}
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
            <div class="failure">
                <Empty error message={failure} />
            </div>
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
        --row-reveal: 0;
        display: flex;
        align-items: center;
        gap: 2px;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
        padding: 0 2px 0 6px;
        border-left: 2px solid transparent;
    }

    .row:hover,
    .row:focus-within,
    .row.current,
    .row.armed {
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
        font-size: var(--fs-md);
    }

    .description {
        flex: 1 1 0;
        min-width: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .markglyph {
        display: inline-flex;
        flex: 0 0 auto;
    }

    .bell {
        flex: 0 0 auto;
        color: var(--accent-txt, var(--accent));
    }

    /* The row's controls are drawn clear, and drawn while the pointer or the keyboard's stop is on
       the row, while it is a terminal the tab shows, or while its Kill is armed, so the armed Kill
       shows while a Delete, a Backspace or a menu's Kill Terminal waits for its second press. They
       are always drawn on a screen that does not hover, and keep the focus while clear. */
    .actions {
        display: flex;
        flex: 0 0 auto;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    .mark {
        height: 2px;
        background: var(--accent);
    }

    .failure {
        margin: 4px 6px;
    }
</style>
