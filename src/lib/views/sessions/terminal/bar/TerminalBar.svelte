<script lang="ts">
    // Layer 3, view partial. The bar under the Terminal view's header: the name of the terminal the
    // tab names there (TerminalTitle.svelte), the font buttons (TerminalFontTools.svelte) and, at
    // its end, what the tab said of its last refused action, and, while no list, or a narrow one,
    // is drawn to say them on its rows, that a Kill waits for its second press and a kill the
    // server refused. The tab names a terminal on the bar while it draws no list (its only
    // terminal, or a list with no room), and the one being renamed while its list is narrow. A
    // right-click on the name opens the menu of a list row on that terminal, whose pick goes to the
    // tab's handlers as a row's does (terminal-list.ts, `routePick`).

    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import type { TerminalTabState } from '$lib/state/sessions/terminal/terminal-tabs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import TerminalFontTools from '../TerminalFontTools.svelte';
    import TerminalTitle from '../TerminalTitle.svelte';
    import {
        routePick,
        taskStateOf,
        terminalRowMenu,
        terminalTip,
        type Attachable,
        type PickHandlers
    } from '../terminal-list';

    type Props = {
        /** The row of the terminal the bar names, or null when it names none. */
        row: TerminalChoice | null;
        /** The tab's own state, which the name's menu is made for. */
        tab: TerminalTabState;
        /** The terminals the other Terminal tabs own, which Join Terminals offers. */
        others: Attachable[];
        /** The terminal whose Kill waits for its second press, or ''. */
        armed: string;
        /** The terminal whose bell is ringing in this tab, or null. */
        ringing: string | null;
        /** The terminal whose title is being edited, or ''. */
        renaming: string;
        /** What a pick of the name's menu does, and the double click that opens Rename. */
        handlers: PickHandlers;
        /** What the tab said of its last refused action, or ''. */
        said: string;
        /** A kill the server refused, said here while no list says it, or ''. */
        failure: string;
        /** A Kill waits for its second press while no list, or a narrow one, says so on its row. */
        arming: boolean;
        /** The rename field saved a value (an empty one clears the title). */
        onrenamed: (terminal: string, value: string) => void;
        /** The rename field was cancelled. */
        onrenamecancel: () => void;
    };

    let {
        row,
        tab,
        others,
        armed,
        ringing,
        renaming,
        handlers,
        said,
        failure,
        arming,
        onrenamed,
        onrenamecancel
    }: Props = $props();

    const {
        terminals: { terminalById }
    } = useState();
</script>

<Toolbar label={t('sessions.terminal_bar')}>
    {#if row !== null}
        {@const held = terminalById(row.terminal)}
        <TerminalTitle
            shown={row}
            tip={held === null ? row.title : terminalTip(held)}
            ringing={ringing === row.terminal}
            renaming={renaming === row.terminal}
            onrename={() => handlers.rename(row.terminal)}
            menu={() =>
                terminalRowMenu(
                    tab,
                    row.terminal,
                    others,
                    armed === row.terminal,
                    t,
                    taskStateOf(row),
                    row.splittable
                )}
            onpick={(pick: string) => routePick(pick, row.terminal, handlers)}
            onsave={(value: string) => onrenamed(row.terminal, value)}
            oncancel={onrenamecancel}
        />
    {/if}
    <TerminalFontTools />
    {#if arming}
        <span class="note" role="status">{t('sessions.terminal_kill_armed')}</span>
    {/if}
    {#if said !== ''}
        <span class="note" role="alert">{said}</span>
    {/if}
    {#if failure !== ''}
        <span class="note" role="alert">{failure}</span>
    {/if}
</Toolbar>

<style>
    /* What the tab said of a refused action and an armed Kill, at the end of the bar. */
    .note {
        margin-left: auto;
        color: var(--c-red-txt, var(--ink));
        font-size: var(--fs-xs);
    }

    .note ~ .note {
        margin-left: 0;
    }
</style>
