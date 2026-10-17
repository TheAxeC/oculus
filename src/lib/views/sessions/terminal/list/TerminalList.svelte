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
    // the pointer's way to the same two actions, shown on hover. An armed row (RowFace.svelte) says
    // in words, in place of its description, that a second press kills the terminal (the bar says
    // it while the list is narrow). An armed Kill is disarmed when the stop moves off its row, and
    // a held key arms nothing (terminal-list.ts, `rowKey`, and kill-arm.svelte.ts, `armKept`). The
    // arm is held by the tab (Terminal.svelte), since the grid's menu arms and kills through the
    // same `pressKill`, and the tab also takes it off at a press elsewhere, at Escape and after its
    // timeout (kill-arm.svelte.ts). A pointer press on a row shows it and hands the keyboard to its
    // grid, so the list holds focus only for a reader who came to it by the keyboard.
    //
    // The tab hands the list its width (list-width.svelte.ts). A narrow list draws each row as its
    // mark alone, with the bell while it rings, and no Split or Kill control; the row's name is its
    // accessible name and its tooltip, its menu and keys are the same, and Rename opens the field
    // on the bar and a refused kill is said there, since the list has no room for either.
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
    // the end of the row. The entries apps contribute to `terminal/title/context` follow them
    // (app-menus.ts). A right-click on the list's empty area offers New Terminal, a shell
    // started in the tab's folder as the bar's New starts it, New Terminal With Profile, the same
    // start of the kind picked, and Attach to Session, which joins a running terminal no Terminal
    // tab owns to the end of this tab and shows it. A pick is routed by terminal-list.ts's
    // `routePick`, the function the bar's menu of a sole terminal routes its own by, to the
    // handlers the tab hands the list.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { reordered, showingRow } from '$lib/state/sessions/terminal/terminal-tabs';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { nextStop } from '$lib/ui/tree/roving';
    import RenameField from '../RenameField.svelte';
    import { terminalAppMenus } from '../app-menus';
    import { armKept } from './kill-arm.svelte';
    import RowFace from './RowFace.svelte';
    import {
        MENU_NEW,
        ROW_DRAG,
        attachedOf,
        emptyListMenu,
        taskStateOf,
        movedOrder,
        profileOf,
        routePick,
        rowKey,
        terminalRowMenu,
        terminalTip,
        type TerminalListProps
    } from '../terminal-list';
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
        ondisarm,
        width,
        narrow
    }: TerminalListProps = $props();

    const client = useState();
    const {
        layout: { restateInstance },
        terminals: { attachTerminal, moveTerminal, startInTab, terminalById }
    } = client;
    const appMenus = terminalAppMenus(client);

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
    function rowPicked(row: TerminalChoice, pick: string, event: MouseEvent): void {
        if (appMenus.run(pick, row.terminal, event)) return;
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

<!-- The drag handlers report where a dragged row would land and take the drop; the rows' own
     controls carry the keyboard. -->
<ContextMenu
    label={t('sessions.terminal_list')}
    items={emptyListMenu(t, attachables)}
    onpick={emptyPicked}
>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="list"
        class:narrow
        style={`width: ${width}px`}
        data-terminal-list
        role="group"
        aria-label={t('sessions.terminal_list')}
        bind:this={list}
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
                read={() => [
                    ...terminalRowMenu(
                        tab,
                        row.terminal,
                        others,
                        arming === row.terminal,
                        t,
                        taskStateOf(row),
                        row.splittable
                    ),
                    ...appMenus.items('terminal/title/context', row.terminal)
                ]}
                own
                onpick={(pick: string, event: MouseEvent) => rowPicked(row, pick, event)}
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
                        {#if renaming === row.terminal && !narrow}
                            <!-- The field is not inside the row's button: a text box cannot be
                                 typed into within one. -->
                            <RowFace
                                {row}
                                armed={false}
                                ringing={false}
                                narrow={false}
                                onrename={() => undefined}
                            >
                                <RenameField
                                    value={row.title}
                                    label={t('sessions.terminal_rename_field')}
                                    onsave={(value: string) => onrenamed(row.terminal, value)}
                                    oncancel={onrenamecancel}
                                />
                            </RowFace>
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
                                <RowFace
                                    {row}
                                    armed={arming === row.terminal}
                                    ringing={ringing === row.terminal}
                                    {narrow}
                                    onrename={() => handlers.rename(row.terminal)}
                                />
                            </ToolButton>
                        {/if}
                    </span>
                    <span class="actions">
                        {#if row.splittable}
                            <ToolButton
                                compact
                                bare
                                label={t('sessions.terminal_split')}
                                title={t('sessions.terminal_split_tip')}
                                glyph="split_right"
                                tabindex={-1}
                                onclick={() => split(row)}
                            />
                        {/if}
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
                            data={{ kill: row.terminal }}
                            onclick={() => kill(row)}
                        />
                    </span>
                </div>
            </ContextMenu>
        {/each}
        {#if dropIndex !== null && dropIndex >= rows.length}
            <span class="mark" aria-hidden="true"></span>
        {/if}
        {#if failure !== '' && !narrow}
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
        min-height: 0;
        overflow-y: auto;
        border-left: 1px solid var(--line);
    }

    /* A narrow list draws a row's mark alone, centred, and the bell while it rings. */
    .narrow .row {
        justify-content: center;
        padding: 0;
    }

    .list.narrow .row .actions {
        display: none;
    }

    .narrow .pick {
        flex: 0 1 auto;
    }

    /* One row of VS Code's tabs list, 22 pixels. */
    .row {
        display: flex;
        align-items: center;
        gap: 2px;
        height: calc(var(--tree-row) * var(--text-scale, 1));
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

    /* The row's controls are drawn, and take room, only while the pointer or the keyboard's stop
       is on the row, while it is a terminal the tab shows, or while its Kill is armed, so the armed
       Kill shows while a Delete, a Backspace or a menu's Kill Terminal waits for its second press;
       they are always drawn on a screen that does not hover. They give up their room before the
       name gives up any of its own: a row too narrow for both drops controls, from the left, and
       the name keeps its width. A control is drawn whole or not at all: the controls are laid out
       from the right, Kill first, each at its own width, and one with no room left on the row's
       line wraps to a second line that the box, one line tall, does not draw. A line's first item
       never wraps, so an empty item of no width starts the line and Kill can wrap as well. */
    .actions {
        display: none;
        flex: 0 10000 auto;
        flex-direction: row-reverse;
        flex-wrap: wrap;
        align-content: flex-start;
        height: 100%;
        min-width: 0;
        overflow: hidden;
    }

    .actions::before {
        content: '';
        flex: none;
        width: 0;
        height: 100%;
    }

    .actions > :global(*) {
        flex: none;
    }

    .actions > :global(:not(:last-child)) {
        order: 1;
    }

    .row:hover .actions,
    .row:focus-within .actions,
    .row.current .actions,
    .row.armed .actions {
        display: flex;
    }

    @media (hover: none) {
        .actions {
            display: flex;
        }
    }

    .mark {
        height: 2px;
        background: var(--accent);
    }

    .failure {
        margin: 4px 6px;
    }
</style>
