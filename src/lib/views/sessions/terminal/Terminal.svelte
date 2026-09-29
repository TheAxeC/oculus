<script module lang="ts">
    // Layer 3, view registration. Terminal follows the session list in the Sessions page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'terminal',
        label: 'sessions.view_terminal',
        glyph: 'sessions.terminal_glyph',
        group: 'sessions',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. One Terminal tab, a terminal panel of its own as VS Code's terminal panel is:
    // the tab owns one or more terminals, kept in its own layout state and read through
    // state/sessions/terminal/terminal-tabs.ts, and draws only those. A terminal belongs to exactly
    // one tab; the terminals store (state/sessions/terminals.svelte.ts) keeps which, shows a
    // terminal started anywhere in the tab that owns it or in the page's Terminal tab, and takes an
    // ended terminal out of its tab, closing a tab left with none unless it shows the composer.
    // Closing a tab stops nothing.
    //
    // The body draws the composer alone while the tab shows no terminal; one grid
    // (TerminalGrid.svelte) for the shown terminal; and, in a split, the shown terminal on the left
    // and the second one, or the composer while a Split or New waits for its start, on the right,
    // with the handle between them moving the left half's share. The bar's `new terminal` shows the
    // composer in this tab, in a new composer's folder and kind, and what it starts joins this tab.
    // From two terminals on, the tab's list (TerminalList.svelte) is drawn on the right of the
    // body, and with one while the composer shows; a tab showing its only terminal names it on the
    // bar. A row dragged from another tab's list onto this tab's body, when this tab draws no list,
    // joins the end of this tab.
    //
    // The tab's label is the shown terminal's name, kept in its state as a terminal is renamed
    // while it runs.
    //
    // The grid's and the list's right-click menus act through this tab: Split Terminal splits it as
    // a row's Split does, Kill Terminal arms the terminal and kills it on a second pick or press,
    // as the row's Kill does (terminal-list.ts, `pressKill`), the arm taken off when a terminal
    // joins or leaves the tab, and Join Terminals is offered the terminals the other Terminal tabs
    // own, each by its name.

    import Composer from './Composer.svelte';
    import TerminalGrid from './TerminalGrid.svelte';
    import TerminalList from './TerminalList.svelte';
    import TerminalTitle from './TerminalTitle.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Sash from '$lib/ui/frame/Sash.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import {
        readTab,
        splitAt,
        splitDrawn,
        tabTerminals,
        TERMINAL_VIEW,
        withLabel,
        withShare,
        withStarted,
        SPLIT_SHARE,
        type TerminalTabState
    } from '$lib/state/sessions/terminal/terminal-tabs';
    import { sessionRows, terminalChoices } from '$lib/state/sessions/folds';
    import { splitState } from '$lib/state/sessions/terminal/composer';
    import { tabsOf } from '$lib/state/workbench/layout';
    import {
        BELL_MS,
        ROW_DRAG,
        gridFontSize,
        listDrawn,
        pressKill,
        tabRows,
        terminalTip
    } from './terminal-list';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { instanceLayoutState, pages, restateInstance },
        selectors: { sessionsByWorkspace },
        terminals: { composeInTab, moveTerminal, stopTerminal, terminalById, terminals },
        ui: { instanceState, setInstanceState, setTerminalFont, terminalFont, textScale }
    } = useState();

    let { instance }: ViewProps = $props();

    /**
     * The tab's own state: the terminals it owns, what it shows, and whether the composer shows.
     */
    const tab = $derived(readTab(instanceLayoutState(instance.id)));
    const split = $derived(splitDrawn(tab));
    const terminal = $derived(terminalById(tab.shown));

    /** The list's rows: the tab's own terminals, in the tab's own order. */
    const rows = $derived(
        tabRows(terminalChoices(terminals(), sessionRows(sessionsByWorkspace(true))), tab.terminals)
    );
    const listed = $derived(listDrawn(rows.length, tab.composing));
    const shownRow = $derived(rows.find((row) => row.terminal === tab.shown) ?? null);
    /** The rows marked current: the shown one, and the right half of a split. */
    const current = $derived(
        [tab.shown, split && !tab.composing ? tab.beside : null].filter(
            (one): one is string => one !== null
        )
    );

    /**
     * The terminals the other Terminal tabs own, on every page, each by its name: what Join
     * Terminals on a row offers to move into this tab.
     */
    const others = $derived(
        pages()
            .flatMap((one) => tabsOf(one.workbench.root))
            .filter((one) => one.view === TERMINAL_VIEW && one.id !== instance.id)
            .flatMap((one) => tabTerminals(one.state))
            .map((id) => terminalById(id))
            .filter((one): one is NonNullable<typeof one> => one !== null && one.foreign !== true)
            .map((one) => ({ terminal: one.id, title: one.name }))
    );

    /**
     * The terminal whose Kill was pressed or picked once and waits for the second, held here since
     * the list's Kill and the grid's menu arm and kill the same way; the list takes it off when its
     * stop moves or focus leaves it (TerminalList.svelte).
     */
    let arming = $state('');
    /**
     * A kill the server refused, said below the list's rows while the list is drawn and on the bar
     * otherwise, until the next kill.
     */
    let failure = $state('');

    /** The terminal whose bell rang in this tab, while its mark shows. */
    let ringing: string | null = $state(null);
    let bellTimer: ReturnType<typeof setTimeout> | null = null;
    /** The terminal a pointer press on its row asked for, whose grid takes focus. */
    let focusing: string | null = $state(null);
    /** The body, whose width turns a drag of the handle into a share. */
    let bodyWidth = $state(0);

    /** Replace this tab's state. */
    function restate(next: TerminalTabState): void {
        restateInstance(instance.id, next);
    }

    // A terminal is renamed while it runs; the tab's label follows the shown terminal's name.
    $effect(() => {
        const live = terminal;
        if (live === null || live.name === '' || tab.label === live.name) return;
        restate(withLabel(tab, live.name));
    });

    // An arm holds only while the tab's terminals stay the same: one joining or leaving takes it
    // off, so an arm set from the grid of a lone terminal never turns a later Delete on its row
    // into a kill.
    let armedAmong = '';
    $effect(() => {
        const now = tab.terminals.join(' ');
        if (now === armedAmong) return;
        armedAmong = now;
        arming = '';
    });

    // The bell's mark goes with the tab.
    $effect(() => () => {
        if (bellTimer !== null) clearTimeout(bellTimer);
    });

    /** Move the chosen size by one CSS pixel from the value currently in force. */
    function stepFont(by: number): void {
        const current = gridFontSize(terminalFont(), textScale() ?? 1);
        if (current !== undefined) setTerminalFont(current + by);
    }

    /**
     * Split this tab on one of its terminals: that terminal on the left, the composer in its
     * folder and kind on the right, which the list row's Split and both menus do.
     */
    function splitOn(terminal: string): void {
        const held = terminalById(terminal);
        if (held === null) return;
        setInstanceState(instance.id, splitState(held.cwd, held.kind, instanceState(instance.id)));
        restate(splitAt(tab, terminal));
    }

    /** A press of a row's Kill, or Kill Terminal from a menu: the first arms, the second kills. */
    function kill(terminal: string): void {
        void pressKill(arming, terminal, {
            arm: (one) => (arming = one),
            stop: stopTerminal,
            fail: (error) => (failure = error)
        });
    }

    /** What a start from the composer does: the terminal joins this tab (terminal-tabs.ts). */
    function started(made: string, label: string): void {
        restate(withStarted(tab, made, label));
    }

    /** Mark a terminal's row for the bell's moment, the timer of an earlier ring replaced. */
    function ring(which: string): void {
        if (bellTimer !== null) clearTimeout(bellTimer);
        ringing = which;
        bellTimer = setTimeout(() => {
            bellTimer = null;
            ringing = null;
        }, BELL_MS);
    }

    /** A drag of the handle, in pixels, as a change of the left half's share. */
    function moved(delta: number): void {
        if (bodyWidth <= 0) return;
        restate(withShare(tab, tab.share + delta / bodyWidth));
    }

    /** The page holding this tab, which a row dropped on it moves to. */
    function pageId(): string {
        const holding = pages().find((page) =>
            tabsOf(page.workbench.root).some((one) => one.id === instance.id)
        );
        return holding?.id ?? '';
    }

    /** A row of another tab dragged over this tab's body while it draws no list. */
    function rowOver(event: DragEvent): void {
        if (event.dataTransfer?.types.includes(ROW_DRAG) === true) event.preventDefault();
    }

    /** A row of another tab dropped on this tab's body joins the end of this tab. */
    function rowDropped(event: DragEvent): void {
        const moving = event.dataTransfer?.getData(ROW_DRAG) ?? '';
        if (moving === '') return;
        event.preventDefault();
        moveTerminal(moving, instance.id, pageId(), tab.terminals.length);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_terminal')}>
        {#if failure !== '' && !listed}
            <span class="failure" role="alert">{failure}</span>
        {/if}
        {#if !listed && shownRow !== null}
            <TerminalTitle
                shown={shownRow}
                tip={terminal === null ? shownRow.title : terminalTip(terminal)}
                ringing={ringing === shownRow.terminal}
            />
        {/if}
        <ToolButton
            label={t('sessions.new_terminal')}
            title={t('sessions.new_terminal_title')}
            glyph={t('sessions.terminal_glyph')}
            onclick={() => composeInTab(instance.id)}
        />
        <ToolButton
            label={t('sessions.terminal_smaller')}
            glyph="collapse"
            compact
            onclick={() => stepFont(-1)}
        />
        <ToolButton
            label={t('sessions.terminal_larger')}
            glyph="expand"
            compact
            onclick={() => stepFont(1)}
        />
        <ToolButton
            label={t('sessions.terminal_reset')}
            glyph="refresh"
            compact
            onclick={() => setTerminalFont(null)}
        />
    </Toolbar>
{/snippet}

{#snippet grid(id: string)}
    <TerminalGrid
        {id}
        {focusing}
        onfocused={() => (focusing = null)}
        onbell={ring}
        onsplit={splitOn}
        armed={arming === id}
        onkill={kill}
    />
{/snippet}

<Pane title={t('sessions.view_terminal')} toolbar={tools} tinted>
    <!-- The body takes a row dropped from another tab's list while this tab draws none. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="terminal"
        data-instance={instance.id}
        ondragover={listed ? undefined : rowOver}
        ondrop={listed ? undefined : rowDropped}
    >
        <div class="main" bind:clientWidth={bodyWidth}>
            {#if tab.shown === null}
                <div class="start">
                    <Composer owner={instance.id} onstarted={started} />
                </div>
            {:else if split}
                <div class="side" style="flex: {tab.share} 1 0">
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render grid(tab.shown)}
                </div>
                <Sash
                    dir="row"
                    share={tab.share}
                    onresize={moved}
                    onreset={() => restate(withShare(tab, SPLIT_SHARE))}
                />
                <div class="side" style="flex: {1 - tab.share} 1 0">
                    {#if tab.composing || tab.beside === null}
                        <div class="start">
                            <Composer owner={instance.id} onstarted={started} />
                        </div>
                    {:else}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render grid(tab.beside)}
                    {/if}
                </div>
            {:else}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render grid(tab.shown)}
            {/if}
        </div>
        {#if listed}
            <TerminalList
                instance={instance.id}
                page={pageId()}
                {tab}
                {rows}
                {current}
                {ringing}
                {others}
                onshown={(one: string) => (focusing = one)}
                onsplit={splitOn}
                {arming}
                {failure}
                onkill={kill}
                ondisarm={() => (arming = '')}
            />
        {/if}
    </div>
</Pane>

<style>
    .terminal {
        display: flex;
        gap: 6px;
        min-width: 0;
        height: 100%;
        padding: 4px 6px 6px;
        box-sizing: border-box;
    }

    .main {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }

    .side {
        display: flex;
        min-width: 0;
        min-height: 0;
    }

    /* A refused Kill Terminal from a menu, on the bar. */
    .failure {
        color: var(--c-red-txt, var(--ink));
        font-size: var(--fs-xs);
    }

    .start {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        gap: 8px;
        min-width: 0;
    }
</style>
