<script lang="ts">
    // Layer 3, view partial. The Terminal view's list of terminals, drawn on the right of the
    // view's body from two terminals on, as VS Code's terminal panel draws its tabs list there. One
    // row per terminal oculus runs, titled after what runs in it, with its description muted after
    // the title, the row this tab shows marked, and a bell mark while the shown terminal rings.
    //
    // A press on a row shows that terminal in this tab by the rule the tab already goes by: a tab
    // that follows the selection selects it, so the other session views move with it, and a tab
    // that owns its terminal is pinned to the one pressed.
    //
    // The list is one stop of the browser's focus order, by ui/tree/roving.ts's rule: the row at
    // the stop carries tabindex 0 and everything else in the list -1, Split and Kill included. The
    // arrow keys move the stop, Enter shows the row, Shift+Enter splits it, and Delete or Backspace
    // kills it as Kill does, the first press arming and the second killing; the two controls are
    // the pointer's way to the same two actions, shown on hover. An armed Kill is disarmed when the
    // stop moves or focus leaves the list, and a held key arms nothing (terminal-list.ts, `rowKey`
    // and `armKept`). A pointer press on a row shows it and hands the keyboard to its grid, so the
    // list holds focus only for a reader who came to it by the keyboard.
    //
    // Split opens a Terminal tab beside whose composer starts in the row's own folder, offered as
    // a place of its own when no place of the composer holds it (state/sessions/composer.ts).
    //
    // A row dragged within the list moves there. The order is the reader's and is kept in the
    // page's layout state for the Terminal view, so every Terminal tab of the page draws the same
    // order and it comes back after a reload.

    import { untrack } from 'svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { splitState } from '$lib/state/sessions/composer';
    import { followsSelection } from '$lib/state/sessions/terminals.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { nextStop } from '$lib/ui/tree/roving';
    import { armKept, movedOrder, rowKey, terminalTip, withOrder } from './terminal-list';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The Terminal tab the list is drawn in. */
        instance: string;
        /** The rows, in the order they are drawn. */
        rows: TerminalChoice[];
        /** The terminal the tab shows now, or null. */
        current: string | null;
        /** The terminal whose bell is ringing in this tab, or null. */
        ringing: string | null;
        /** Called with a row's terminal when a pointer press shows it, before it is shown. */
        onshown: (terminal: string) => void;
    };

    let { instance, rows, current, ringing, onshown }: Props = $props();

    const {
        layout: { instanceLayoutState, openBeside, pageViewState, pinInstance, setPageViewState },
        selection: { select },
        terminals: { stopTerminal, terminalById },
        ui: { setInstanceState }
    } = useState();

    /** The type a dragged row carries its terminal id under, which no other drag carries. */
    const ROW_DRAG = 'application/x-oculus-terminal-row';

    let list: HTMLDivElement | null = $state(null);

    /** The row the keyboard stop was moved to, while it is still a row. */
    let stopped = $state('');
    /** The row whose Kill was pressed once and waits for the second press. */
    let arming = $state('');
    /** Where a dragged row would be dropped, as an index of the rows drawn, or null. */
    let dropIndex: number | null = $state(null);
    let failure = $state('');

    const order = $derived(rows.map((row) => row.terminal));
    const stop = $derived(
        order.includes(stopped)
            ? stopped
            : current !== null && order.includes(current)
              ? current
              : (order[0] ?? '')
    );

    // Whatever moves the stop (the arrow keys, a selection made elsewhere, the stopped row going
    // away), an armed Kill on another row is disarmed.
    $effect(() => {
        const at = stop;
        untrack(() => {
            if (arming !== '' && !armKept(arming, at)) arming = '';
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
        if (followsSelection(instanceLayoutState(instance))) select(row.id);
        else pinInstance(instance, row.terminal, row.title);
    }

    /** Open a Terminal tab beside, holding the composer in this row's own folder and kind. */
    function split(row: TerminalChoice): void {
        const folder = terminalById(row.terminal)?.cwd ?? '';
        const opened = openBeside('terminal', { id: crypto.randomUUID() });
        if (opened === '') return;
        setInstanceState(opened, splitState(folder, row.kind));
    }

    /** A press on a row: a pointer's hands the keyboard to the grid, a key's leaves it here. */
    function pressed(event: MouseEvent, row: TerminalChoice): void {
        if (event.detail > 0) onshown(row.terminal);
        show(row);
    }

    /** Focus leaving the list disarms Kill, so a later Delete or Backspace arms it again. */
    function left(event: FocusEvent): void {
        const to = event.relatedTarget;
        if (to instanceof Node && list?.contains(to) === true) return;
        arming = '';
    }

    /** The first press arms Kill and the second stops the terminal, as the Sessions list's does. */
    async function kill(row: TerminalChoice): Promise<void> {
        if (arming !== row.terminal) {
            arming = row.terminal;
            return;
        }
        arming = '';
        failure = '';
        const answer = await stopTerminal(row.terminal);
        if (!answer.ok) failure = answer.error;
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
            else void kill(rows[index]);
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
        const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
        dropIndex = event.clientY > box.top + box.height / 2 ? index + 1 : index;
    }

    function dropped(event: DragEvent): void {
        const moved = event.dataTransfer?.getData(ROW_DRAG) ?? '';
        const at = dropIndex;
        dropIndex = null;
        if (moved === '' || at === null) return;
        event.preventDefault();
        const next = movedOrder(order, moved, at);
        setPageViewState(instance, withOrder(pageViewState(instance), next));
    }
</script>

<!-- The drag handlers report where a dragged row would land and take the drop, and focus leaving
     the list disarms Kill; the rows' own controls carry the keyboard. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="list"
    data-terminal-list
    role="group"
    aria-label={t('sessions.terminal_list')}
    bind:this={list}
    onfocusout={left}
    ondrop={dropped}
    ondragleave={(event: DragEvent) => {
        if (!list?.contains(event.relatedTarget as Node | null)) dropIndex = null;
    }}
>
    {#each rows as row, index (row.terminal)}
        {#if dropIndex === index}
            <span class="mark" aria-hidden="true"></span>
        {/if}
        <div
            class="row"
            class:current={row.terminal === current}
            data-terminal-row={row.terminal}
            data-current={row.terminal === current || undefined}
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
                        <span class="description" data-row-description>{row.description}</span>
                        {#if ringing === row.terminal}
                            <span class="bell" data-bell title={t('sessions.terminal_bell')}>
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
                    onclick={() => void kill(row)}
                />
            </span>
        </div>
    {/each}
    {#if dropIndex !== null && dropIndex >= rows.length}
        <span class="mark" aria-hidden="true"></span>
    {/if}
    {#if failure !== ''}
        <p class="failure" role="alert">{failure}</p>
    {/if}
</div>

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
       the row, so the armed Kill shows while a Delete or Backspace waits for its second press. */
    .actions {
        display: flex;
        flex: 0 0 auto;
        opacity: 0;
    }

    .row:hover .actions,
    .row:focus-within .actions {
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
