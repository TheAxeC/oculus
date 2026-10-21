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
    // Closing the tab, its pane or its page ends the terminals it owns (the layout asks the ui
    // store, which asks the terminals store); moving the tab ends none.
    //
    // The body draws start/TerminalStart.svelte alone while the tab shows no terminal (the
    // composer, or the line saying which kind New Terminal is starting there), and otherwise the
    // tab's row: one grid (grid/TerminalGrid.svelte) per terminal of `row`, left to right in one
    // keyed list so a grid is not torn down when another joins, each as wide as the shares give it
    // with at least ROW_MIN pixels (terminal-tabs.ts, `rowWidths`), a handle between two neighbours
    // moving their boundary, and the row scrolling sideways when it is wider than the pane. The
    // composer of a start with a prompt shows right of the row while `composing`, drawn the same
    // way.
    //
    // The header holds the icon actions (bar/TerminalActions.svelte): New terminal starts a shell
    // at once in the tab's folder, the kinds dropdown beside it starts Shell, Claude or Codex the
    // same way, shows the composer (With a Prompt) in the shown terminal's kind, or, under Attach
    // to Session, joins a running terminal no Terminal tab owns to the end of this tab and shows it
    // alone, and Split splits the shown terminal. The bar under the header (bar/TerminalBar.svelte)
    // holds the title of the terminal the tab names there, the font buttons and, at its end, what
    // the tab says. A start the server refuses, a Split of a terminal the page knows nothing of,
    // and a failed Copy as HTML are said on the bar and change nothing. From two terminals on, the
    // tab's list (list/TerminalList.svelte) is drawn on the right of the body, and with one while
    // the composer shows. The handle left of it drags its width, and a pane with no room for that
    // width draws it narrower, narrow (its rows as their marks) or not at all, so the row of
    // terminals keeps a usable width (list/list-width.svelte.ts). A tab showing its only terminal,
    // or with no room for its list, names the shown terminal on the bar; with no room for its list,
    // the header's terminals menu lists every terminal it owns. A row dragged from another
    // tab's list onto this tab's body, when this tab draws no list, joins the end of this tab.
    //
    // The tab's label is what a Terminal tab calls the shown terminal (`terminalTabTitle`: the
    // title the reader gave it, else the agent's or the task's words, else the process tmux
    // reports, as "zsh"), kept in its state as a terminal is renamed or runs another process.
    // Rename opens an inline field on the row, or on the bar's title while no list or a narrow one
    // is drawn; Change Icon opens the glyph list (ui/forms/choice/GlyphDialog.svelte) and Change
    // Color takes the picked colour; Clear empties the grid and the terminal's history.
    //
    // The grid's, the list's and the bar's right-click menus act through this tab (a right-click on
    // the bar's name of a sole terminal opens a list row's menu, and `routePick` sends a pick of
    // either to one set of handlers): Split Terminal splits it as a row's Split does, Kill Terminal
    // arms the terminal and kills it on a second pick or press, as the row's Kill does, and Join
    // Terminals is offered the terminals the other Terminal tabs own, each by its name. The arm is
    // the tab's (list/kill-arm.svelte.ts, which says what takes it off).

    import TerminalStart from './start/TerminalStart.svelte';
    import TerminalActions from './bar/TerminalActions.svelte';
    import TerminalBar from './bar/TerminalBar.svelte';
    import { SvelteMap } from 'svelte/reactivity';
    import GlyphDialog from '$lib/ui/forms/choice/GlyphDialog.svelte';
    import TerminalGrid from './grid/TerminalGrid.svelte';
    import TerminalList from './list/TerminalList.svelte';
    import { createKillArm } from './list/kill-arm.svelte';
    import { createListWidth } from './list/list-width.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Sash from '$lib/ui/frame/sash/Sash.svelte';
    import { SASH_PX } from '$lib/ui/frame/sash/sash-size';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import {
        ROW_MIN,
        joined,
        readTab,
        resizedShares,
        rowWidths,
        showingOne,
        showingRow,
        splitDrawn,
        unsplit,
        withLabel,
        withShares,
        withStarted,
        type TerminalTabState
    } from '$lib/state/sessions/terminal/terminal-tabs';
    import { sessionRows, terminalChoices } from '$lib/state/sessions/folds';
    import { glyphNames } from '$lib/state/workbench/navigation/rail';
    import { tabsOf } from '$lib/state/workbench/layout';
    import {
        bellMark,
        COMPOSER_REM,
        ROW_DRAG,
        listDrawn,
        ownedElsewhere,
        tabRows,
        taskStateOf,
        type PickHandlers
    } from './terminal-list';
    import { terminalLabel } from '$lib/state/sessions/terminals.svelte';
    import { terminalTabTitle } from '$lib/state/sessions/terminal/terminal-lists';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        appShell,
        commands: { pressRerun, pressRestart },
        entities: { config },
        layout: { holding, instanceLayoutState, restateInstance, hosts },
        selectors: { sessionsByWorkspace },
        terminals: {
            attachable,
            clearHistory,
            moveTerminal,
            refusal,
            renameTerminal,
            restyleTerminal,
            say,
            splitTerminal,
            stopTerminal,
            terminalById,
            terminals
        },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /**
     * The tab's own state: the terminals it owns, what it shows, and whether the composer shows.
     */
    const tab = $derived(readTab(instanceLayoutState(instance.id)));
    const split = $derived(splitDrawn(tab));
    const terminal = $derived(terminalById(tab.shown));
    /** What the bar says of the last refused action of this tab. */
    const said = $derived(refusal(instance.id));
    /** The names of the glyph vocabulary, which Change Icon lists. */
    const glyphs = $derived(glyphNames(config()?.config) ?? []);

    /** The title of an acting app, which a terminal the app made is described by. */
    function appTitle(app: string): string {
        return appShell.acting().find((one) => one.id === app)?.row.title ?? '';
    }

    /** The list's rows: the tab's own terminals, in the tab's own order. */
    const rows = $derived(
        tabRows(
            terminalChoices(terminals(), sessionRows(sessionsByWorkspace(true)), appTitle),
            tab.terminals
        )
    );
    const listed = $derived(listDrawn(rows.length, tab.composing));
    const shownRow = $derived(rows.find((row) => row.terminal === tab.shown) ?? null);
    /** The rows marked current: the terminals the row draws, or the shown one alone. */
    const current = $derived(split ? tab.row : tab.shown === null ? [] : [tab.shown]);

    /**
     * The terminals the other Terminal tabs own, on every page and float: what Join Terminals
     * offers.
     */
    const others = $derived(
        ownedElsewhere(
            hosts().flatMap((one) => tabsOf(one.workbench.root)),
            instance.id,
            terminalById
        )
    );

    /**
     * The running terminals no Terminal tab owns, each by the name the Sessions view labels it
     * with: what Attach to Session offers to join to the end of this tab.
     */
    const attachables = $derived(
        attachable().map((one) => ({ terminal: one.id, title: terminalLabel(one) }))
    );

    /**
     * The terminal whose Kill was pressed or picked once and waits for the second, held here since
     * the list's Kill and the grid's menu arm and kill the same way, and a kill the server refused,
     * said below the list's rows while a list that names them is drawn and on the bar otherwise.
     */
    const arm = createKillArm(stopTerminal, () => tab.terminals);

    /** The terminal whose bell rang in this tab, while its mark shows. */
    let ringing: string | null = $state(null);
    const bell = bellMark((which) => (ringing = which));
    /** The terminal whose title is being edited. */
    let renaming = $state('');
    /** The terminal a pointer press on its row asked for, whose grid takes focus. */
    let focusing: string | null = $state(null);
    /** The body, whose width gives each terminal of the row its width. */
    let bodyWidth = $state(0);
    /** The tab's content, the row and the list together, whose width gives the list its room. */
    let content: DOMRectReadOnly | undefined = $state();
    const listWidth = createListWidth({
        record: () => instanceState(instance.id),
        write: (record) => setInstanceState(instance.id, record),
        listed: () => listed,
        body: () => content?.width ?? 0
    });
    /** How the list is drawn, or null when it is not. */
    const fit = $derived(listWidth.fit());
    /**
     * The row whose title the bar names: the shown one while no list is drawn, and the one being
     * renamed while the list is narrow.
     */
    const titled = $derived(
        fit === null
            ? shownRow
            : fit.narrow
              ? (rows.find((row) => row.terminal === renaming) ?? null)
              : null
    );
    /** The terminal whose icon is being chosen. */
    let iconFor = $state('');
    /** The Clear of each mounted grid, by terminal, for a row's menu. */
    const clears = new SvelteMap<string, () => Promise<string>>();

    /** The width the row's terminals share: the body, less the composer while right of them. */
    const rowSpace = $derived(
        tab.composing
            ? Math.max(bodyWidth - COMPOSER_REM * 16, ROW_MIN * tab.row.length)
            : bodyWidth
    );
    /** The pixels the handles between the row's terminals take. */
    const handles = $derived(Math.max(0, tab.row.length - 1) * SASH_PX);
    const widths = $derived(rowWidths(tab.shares, rowSpace, handles));

    /** Replace this tab's state. */
    function restate(next: TerminalTabState): void {
        restateInstance(instance.id, next);
    }

    // A terminal is renamed while it runs, or runs another process; the tab's label follows what a
    // Terminal tab calls the shown terminal.
    $effect(() => {
        const live = terminal;
        const named = live === null ? '' : terminalTabTitle(live);
        if (live === null || named === '' || tab.label === named) return;
        restate(withLabel(tab, named));
    });

    // The bell's mark goes with the tab.
    $effect(() => bell.stop);

    /**
     * Split one of this tab's terminals: one of its kind starts in its folder and takes the place
     * right of it, which the list row's Split, both menus and the bar's Split do. A refusal is said
     * on the bar.
     */
    function splitOn(terminal: string): void {
        void splitTerminal(instance.id, terminal);
    }

    /** Open the rename field on a terminal's row, or on the bar's title while no list is drawn. */
    function rename(which: string): void {
        renaming = which;
    }

    /** Save the rename field: an empty value clears the title; a refusal is said on the bar. */
    async function renamed(which: string, value: string): Promise<void> {
        renaming = '';
        const answer = await renameTerminal(which, value);
        say(instance.id, answer.ok ? '' : answer.error);
    }

    /** Set or clear a terminal's icon or colour; a refusal is said on the bar. */
    async function restyle(which: string, style: { icon?: string; color?: string }): Promise<void> {
        const answer = await restyleTerminal(which, style);
        say(instance.id, answer.ok ? '' : answer.error);
    }

    /** A row's Clear: the mounted grid empties itself and the history; else only the history. */
    async function clearOf(which: string): Promise<void> {
        const failure = await (clears.get(which)?.() ??
            clearHistory(which).then((answer) => (answer.ok ? '' : answer.error)));
        if (failure !== '') say(instance.id, failure);
    }

    /** A grid hands over its Clear while it is mounted and takes it back when it goes. */
    function control(which: string, held: { clear: () => Promise<string> } | null): void {
        if (held === null) clears.delete(which);
        else clears.set(which, held.clear);
    }

    /** Join Terminals: a terminal another tab owns moves in after `terminal`, shown beside it. */
    function joinInto(terminal: string, moving: string): void {
        moveTerminal(moving, instance.id, pageId(), tab.terminals.indexOf(terminal) + 1);
        const moved = readTab(instanceLayoutState(instance.id));
        restate(joined(showingOne(moved, terminal), moving));
    }

    /** What a pick of a terminal's menu does, on a list row and on the bar's name alike. */
    const handlers: PickHandlers = {
        split: splitOn,
        kill: arm.kill,
        unsplit: (which: string) => restate(unsplit(tab, which)),
        rename,
        icon: (which: string) => (iconFor = which),
        clear: (which: string) => void clearOf(which),
        color: (which: string, color: string) => void restyle(which, { color }),
        join: joinInto,
        rerun: (which: string) => void pressRerun(which),
        restart: (which: string) => void pressRestart(which)
    };

    /** What a start from the composer does: the terminal joins this tab (terminal-tabs.ts). */
    function started(made: string, label: string): void {
        restate(withStarted(tab, made, label));
    }

    /** A drag of the handle right of the terminal at `at`, in pixels, as a change of the shares. */
    function moved(at: number, delta: number): void {
        if (rowSpace <= 0) return;
        restate(withShares(tab, resizedShares(tab.shares, at, delta, rowSpace, handles)));
    }

    /** The page or float holding this tab, which a row dropped on it moves to. */
    function pageId(): string {
        return holding(instance.id)?.id ?? '';
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
    <Toolbar label={t('sessions.view_terminal')} overflow>
        <TerminalActions
            instance={instance.id}
            shown={tab.shown}
            kind={terminal?.kind}
            {attachables}
            splittable={terminal !== null && terminal.cwd !== ''}
            onsplit={splitOn}
            task={taskStateOf(terminal)}
            onrerun={handlers.rerun}
            onrestart={handlers.restart}
            switching={fit === null ? rows : []}
            {current}
            onshow={(one: string) => {
                focusing = one;
                restate(showingRow(tab, one));
            }}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <TerminalBar
        row={titled}
        {tab}
        {others}
        armed={arm.armed()}
        {ringing}
        {renaming}
        {handlers}
        {said}
        failure={fit === null || fit.narrow ? arm.failure() : ''}
        arming={(fit === null || fit.narrow) && arm.armed() !== ''}
        onrenamed={(which: string, value: string) => void renamed(which, value)}
        onrenamecancel={() => (renaming = '')}
    />
{/snippet}

{#snippet grid(id: string)}
    <TerminalGrid
        {id}
        {focusing}
        onfocused={() => (focusing = null)}
        onbell={bell.ring}
        onsplit={splitOn}
        armed={arm.armed() === id}
        onkill={arm.kill}
        onrerun={handlers.rerun}
        onrestart={handlers.restart}
        onrename={rename}
        onicon={(which: string) => (iconFor = which)}
        oncolor={(which: string, color: string) => void restyle(which, { color })}
        onsay={(words: string) => say(instance.id, words)}
        oncontrol={control}
    />
{/snippet}

<Pane title={t('sessions.view_terminal')} toolbar={tools} {bar} tinted share="terminal" flush>
    <!-- The body takes a row dropped from another tab's list while this tab draws none. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="terminal"
        data-instance={instance.id}
        bind:contentRect={content}
        ondragover={fit === null ? rowOver : undefined}
        ondrop={fit === null ? rowDropped : undefined}
    >
        <div class="main" bind:clientWidth={bodyWidth}>
            {#if tab.row.length === 0}
                <TerminalStart owner={instance.id} onstarted={started} />
            {:else}
                {#each tab.row as id, at (id)}
                    <div
                        class="side"
                        data-row-grid={id}
                        style={bodyWidth > 0
                            ? `flex: 0 0 ${widths[at]}px`
                            : `flex: ${tab.shares[at]} 1 0`}
                    >
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render grid(id)}
                    </div>
                    {#if at < tab.row.length - 1}
                        <Sash
                            dir="row"
                            share={tab.shares[at]}
                            onresize={(delta: number) => moved(at, delta)}
                            onreset={() => restate(withShares(tab, []))}
                        />
                    {/if}
                {/each}
                {#if tab.composing}
                    <div class="side composer">
                        <TerminalStart owner={instance.id} onstarted={started} />
                    </div>
                {/if}
            {/if}
        </div>
        {#if fit !== null}
            <Sash
                dir="row"
                share={content !== undefined && content.width > 0
                    ? 1 - fit.width / content.width
                    : 1}
                onresize={listWidth.moved}
                onreset={listWidth.reset}
            />
            <TerminalList
                instance={instance.id}
                page={pageId()}
                {tab}
                {rows}
                {current}
                {ringing}
                {others}
                {attachables}
                onshown={(one: string) => (focusing = one)}
                {handlers}
                {renaming}
                onrenamed={(which: string, value: string) => void renamed(which, value)}
                onrenamecancel={() => (renaming = '')}
                arming={arm.armed()}
                failure={arm.failure()}
                ondisarm={arm.disarm}
                width={fit.width}
                narrow={fit.narrow}
            />
        {/if}
    </div>
</Pane>

{#if iconFor !== ''}
    <GlyphDialog
        value={terminalById(iconFor)?.icon ?? ''}
        choices={glyphs}
        title={t('sessions.icon_title')}
        label={t('sessions.icon_field')}
        empty={t('sessions.style_default')}
        onpick={(name: string) => {
            const which = iconFor;
            iconFor = '';
            void restyle(which, { icon: name });
        }}
        onclose={() => (iconFor = '')}
    />
{/if}

<style>
    /* The handle left of the list is the gap between the row and the list. */
    .terminal {
        display: flex;
        min-width: 0;
        height: 100%;
        padding: 4px 6px 6px;
        box-sizing: border-box;
    }

    /* The row of grids; wider than the pane it scrolls sideways. */
    .main {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow-x: auto;
    }

    .side {
        display: flex;
        min-width: 0;
        min-height: 0;
    }

    .composer {
        flex: 1 0 20rem;
    }
</style>
