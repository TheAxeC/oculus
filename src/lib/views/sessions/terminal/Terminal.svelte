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
    // The body draws the composer alone while the tab shows no terminal, and otherwise the tab's
    // row: one grid (grid/TerminalGrid.svelte) per terminal of `row`, left to right in one keyed
    // list so a grid is not torn down when another joins, each as wide as the shares give it with
    // at least ROW_MIN pixels (terminal-tabs.ts, `rowWidths`), a handle between two neighbours
    // moving their boundary, and the row scrolling sideways when it is wider than the pane. The
    // composer of a start with a prompt shows right of the row while `composing`.
    //
    // The header holds the icon actions (bar/TerminalActions.svelte): New terminal starts a shell
    // at once in the tab's folder, the kinds dropdown beside it starts Shell, Claude or Codex the
    // same way, shows the composer (With a Prompt) in the shown terminal's kind, or, under Attach
    // to Session, joins a running terminal no Terminal tab owns to the end of this tab and shows
    // it alone, and Split splits the shown terminal. The bar under the header holds the shown
    // terminal's title, the font buttons (TerminalFontTools.svelte) and, at its end, what the tab
    // says. A start the server refuses, a Split of a terminal the page knows nothing of, and a
    // failed Copy as HTML are said on the bar and change nothing. From two terminals on, the tab's
    // list (TerminalList.svelte) is drawn on the right of the body, and with one while the composer
    // shows; a tab showing its only terminal names it on the bar. A row dragged from another tab's
    // list onto this tab's body, when this tab draws no list, joins the end of this tab.
    //
    // The tab's label is the shown terminal's title, else its name, kept in its state as a terminal
    // is renamed while it runs. Rename opens an inline field on the row, or on the bar's title
    // while no list is drawn; Change Icon opens the glyph list (ui/forms/choice/GlyphDialog.svelte)
    // and Change Color takes the picked colour; Clear empties the grid and the terminal's history.
    //
    // The grid's, the list's and the bar's right-click menus act through this tab (a right-click on
    // the bar's name of a sole terminal opens a list row's menu, and `routePick` sends a pick of
    // either to one set of handlers): Split Terminal splits it as a row's Split does, Kill Terminal
    // arms the terminal and kills it on a second pick or press, as the row's Kill does
    // (terminal-list.ts, `pressKill`), the arm taken off when a terminal joins or leaves the tab,
    // and Join Terminals is offered the terminals the other Terminal tabs own, each by its name.

    import Composer from './Composer.svelte';
    import TerminalActions from './bar/TerminalActions.svelte';
    import { SvelteMap } from 'svelte/reactivity';
    import GlyphDialog from '$lib/ui/forms/choice/GlyphDialog.svelte';
    import TerminalGrid from './grid/TerminalGrid.svelte';
    import TerminalList from './TerminalList.svelte';
    import TerminalFontTools from './TerminalFontTools.svelte';
    import TerminalTitle from './TerminalTitle.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Sash from '$lib/ui/frame/Sash.svelte';
    import { SASH_PX } from '$lib/ui/frame/sash-size';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import {
        ROW_MIN,
        joined,
        readTab,
        resizedShares,
        rowWidths,
        showingOne,
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
        pressKill,
        routePick,
        tabRows,
        terminalRowMenu,
        terminalTip,
        type PickHandlers
    } from './terminal-list';
    import { terminalLabel } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
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
        }
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

    /** The list's rows: the tab's own terminals, in the tab's own order. */
    const rows = $derived(
        tabRows(terminalChoices(terminals(), sessionRows(sessionsByWorkspace(true))), tab.terminals)
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
    const bell = bellMark((which) => (ringing = which));
    /** The terminal a pointer press on its row asked for, whose grid takes focus. */
    let focusing: string | null = $state(null);
    /** The body, whose width gives each terminal of the row its width. */
    let bodyWidth = $state(0);
    /** The terminal whose title is being edited, and the one whose icon is being chosen. */
    let renaming = $state('');
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

    // A terminal is renamed while it runs; the tab's label follows the shown terminal's title, else
    // its name.
    $effect(() => {
        const live = terminal;
        const named = live === null ? '' : terminalLabel(live);
        if (live === null || named === '' || tab.label === named) return;
        restate(withLabel(tab, named));
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

    /** A press of a row's Kill, or Kill Terminal from a menu: the first arms, the second kills. */
    function kill(terminal: string): void {
        void pressKill(arming, terminal, {
            arm: (one) => (arming = one),
            stop: stopTerminal,
            fail: (error) => (failure = error)
        });
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
        kill,
        unsplit: (which: string) => restate(unsplit(tab, which)),
        rename,
        icon: (which: string) => (iconFor = which),
        clear: (which: string) => void clearOf(which),
        color: (which: string, color: string) => void restyle(which, { color }),
        join: joinInto
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
            onsplit={splitOn}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('sessions.terminal_bar')}>
        {#if !listed && shownRow !== null}
            <TerminalTitle
                shown={shownRow}
                tip={terminal === null ? shownRow.title : terminalTip(terminal)}
                ringing={ringing === shownRow.terminal}
                renaming={renaming === shownRow.terminal}
                onrename={() => rename(shownRow.terminal)}
                menu={() =>
                    terminalRowMenu(
                        tab,
                        shownRow.terminal,
                        others,
                        arming === shownRow.terminal,
                        t
                    )}
                onpick={(pick: string) => routePick(pick, shownRow.terminal, handlers)}
                onsave={(value: string) => void renamed(shownRow.terminal, value)}
                oncancel={() => (renaming = '')}
            />
        {/if}
        <TerminalFontTools />
        {#if said !== ''}
            <span class="failure" role="alert">{said}</span>
        {/if}
        {#if failure !== '' && !listed}
            <span class="failure" role="alert">{failure}</span>
        {/if}
    </Toolbar>
{/snippet}

{#snippet grid(id: string)}
    <TerminalGrid
        {id}
        {focusing}
        onfocused={() => (focusing = null)}
        onbell={bell.ring}
        onsplit={splitOn}
        armed={arming === id}
        onkill={kill}
        onrename={rename}
        onicon={(which: string) => (iconFor = which)}
        oncolor={(which: string, color: string) => void restyle(which, { color })}
        onsay={(words: string) => say(instance.id, words)}
        oncontrol={control}
    />
{/snippet}

<Pane title={t('sessions.view_terminal')} toolbar={tools} {bar} tinted>
    <!-- The body takes a row dropped from another tab's list while this tab draws none. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="terminal"
        data-instance={instance.id}
        ondragover={listed ? undefined : rowOver}
        ondrop={listed ? undefined : rowDropped}
    >
        <div class="main" bind:clientWidth={bodyWidth}>
            {#if tab.row.length === 0}
                <div class="start">
                    <Composer owner={instance.id} onstarted={started} />
                </div>
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
                        <div class="start">
                            <Composer owner={instance.id} onstarted={started} />
                        </div>
                    </div>
                {/if}
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
                {attachables}
                onshown={(one: string) => (focusing = one)}
                {handlers}
                {renaming}
                onrenamed={(which: string, value: string) => void renamed(which, value)}
                onrenamecancel={() => (renaming = '')}
                {arming}
                {failure}
                ondisarm={() => (arming = '')}
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
    .terminal {
        display: flex;
        gap: 6px;
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

    /* What the tab said of a refused action, at the end of the bar. */
    .failure {
        margin-left: auto;
        color: var(--c-red-txt, var(--ink));
        font-size: var(--fs-xs);
    }

    .failure ~ .failure {
        margin-left: 0;
    }

    .start {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        gap: 8px;
        min-width: 0;
    }
</style>
