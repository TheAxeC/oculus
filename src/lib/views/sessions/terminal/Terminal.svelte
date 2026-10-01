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
    // The bar's `new terminal` starts a shell at once in the tab's folder, and the kinds dropdown
    // beside it starts Shell, Claude or Codex the same way, shows the composer (With a Prompt) in
    // the shown terminal's kind, or, under Attach to Session, joins a running terminal no Terminal
    // tab owns to the end of this tab and shows it alone. The bar's Split splits the shown
    // terminal; the font buttons beside it are TerminalFontTools.svelte. A start the server
    // refuses, a Split of a terminal the page knows nothing of, and a failed Copy as HTML are said
    // on the bar and change nothing. From two terminals on, the tab's list (TerminalList.svelte) is
    // drawn on the right of the body, and with one while the composer shows; a tab showing its only
    // terminal names it on the bar. A row dragged from another tab's list onto this tab's body,
    // when this tab draws no list, joins the end of this tab.
    //
    // The tab's label is the shown terminal's title, else its name, kept in its state as a terminal
    // is renamed while it runs. Rename opens an inline field on the row, or on the bar's title
    // while no list is drawn; Change Icon opens the glyph list (ui/forms/choice/GlyphDialog.svelte)
    // and Change Color takes the picked colour; Clear empties the grid and the terminal's history.
    //
    // The grid's and the list's right-click menus act through this tab: Split Terminal splits it as
    // a row's Split does, Kill Terminal arms the terminal and kills it on a second pick or press,
    // as the row's Kill does (terminal-list.ts, `pressKill`), the arm taken off when a terminal
    // joins or leaves the tab, and Join Terminals is offered the terminals the other Terminal tabs
    // own, each by its name.

    import Composer from './Composer.svelte';
    import { SvelteMap } from 'svelte/reactivity';
    import GlyphDialog from '$lib/ui/forms/choice/GlyphDialog.svelte';
    import TerminalGrid from './grid/TerminalGrid.svelte';
    import TerminalList from './TerminalList.svelte';
    import TerminalFontTools from './TerminalFontTools.svelte';
    import TerminalTitle from './TerminalTitle.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Sash from '$lib/ui/frame/Sash.svelte';
    import { SASH_PX } from '$lib/ui/frame/sash-size';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import {
        ROW_MIN,
        readTab,
        resizedShares,
        rowWidths,
        splitDrawn,
        tabTerminals,
        TERMINAL_VIEW,
        withLabel,
        withShares,
        withStarted,
        type TerminalTabState
    } from '$lib/state/sessions/terminal/terminal-tabs';
    import { sessionRows, terminalChoices } from '$lib/state/sessions/folds';
    import { glyphNames } from '$lib/state/workbench/navigation/rail';
    import { tabsOf } from '$lib/state/workbench/layout';
    import {
        BELL_MS,
        COMPOSER_REM,
        MENU_PROMPT,
        ROW_DRAG,
        attachedOf,
        kindsMenu,
        listDrawn,
        pressKill,
        profileOf,
        tabRows,
        terminalTip
    } from './terminal-list';
    import { terminalLabel } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config },
        layout: { instanceLayoutState, pages, restateInstance },
        selectors: { sessionsByWorkspace },
        terminals: {
            attachable,
            attachTerminal,
            clearHistory,
            composeInTab,
            moveTerminal,
            refusal,
            renameTerminal,
            restyleTerminal,
            say,
            splitTerminal,
            startInTab,
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
    let bellTimer: ReturnType<typeof setTimeout> | null = null;
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
    $effect(() => () => {
        if (bellTimer !== null) clearTimeout(bellTimer);
    });

    /**
     * Split one of this tab's terminals: one of its kind starts in its folder and takes the place
     * right of it, which the list row's Split, both menus and the bar's Split do. A refusal is said
     * on the bar.
     */
    function splitOn(terminal: string): void {
        void splitTerminal(instance.id, terminal);
    }

    /**
     * The kinds dropdown: a kind starts at once, With a Prompt shows the composer, and a terminal
     * under Attach to Session joins this tab.
     */
    function kindPicked(pick: string): void {
        const kind = profileOf(pick);
        const attaching = attachedOf(pick);
        if (pick === MENU_PROMPT) composeInTab(instance.id, terminal?.kind);
        else if (kind !== null) void startInTab(instance.id, kind);
        else if (attaching !== null) attachTerminal(instance.id, attaching);
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

    /** A drag of the handle right of the terminal at `at`, in pixels, as a change of the shares. */
    function moved(at: number, delta: number): void {
        if (rowSpace <= 0) return;
        restate(withShares(tab, resizedShares(tab.shares, at, delta, rowSpace, handles)));
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
        {#if said !== ''}
            <span class="failure" role="alert">{said}</span>
        {/if}
        {#if failure !== '' && !listed}
            <span class="failure" role="alert">{failure}</span>
        {/if}
        {#if !listed && shownRow !== null}
            <TerminalTitle
                shown={shownRow}
                tip={terminal === null ? shownRow.title : terminalTip(terminal)}
                ringing={ringing === shownRow.terminal}
                renaming={renaming === shownRow.terminal}
                onrename={() => rename(shownRow.terminal)}
                onsave={(value: string) => void renamed(shownRow.terminal, value)}
                oncancel={() => (renaming = '')}
            />
        {/if}
        <ToolButton
            label={t('sessions.new_terminal')}
            title={t('sessions.new_terminal_title')}
            glyph={t('sessions.terminal_glyph')}
            onclick={() => void startInTab(instance.id, 'shell')}
        />
        <Menu
            label={t('sessions.new_kinds')}
            items={kindsMenu(t, attachables)}
            glyph="disclosure"
            compact
            bare
            placement="down"
            align="right"
            onpick={kindPicked}
        />
        {#if tab.shown !== null}
            <ToolButton
                label={t('sessions.terminal_split')}
                title={t('sessions.terminal_split_tip')}
                glyph="split_right"
                onclick={() => tab.shown !== null && splitOn(tab.shown)}
            />
        {/if}
        <TerminalFontTools />
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
        onrename={rename}
        onicon={(which: string) => (iconFor = which)}
        oncolor={(which: string, color: string) => void restyle(which, { color })}
        onsay={(words: string) => say(instance.id, words)}
        oncontrol={control}
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
                onsplit={splitOn}
                {renaming}
                onrename={rename}
                onrenamed={(which: string, value: string) => void renamed(which, value)}
                onrenamecancel={() => (renaming = '')}
                onicon={(which: string) => (iconFor = which)}
                oncolor={(which: string, color: string) => void restyle(which, { color })}
                onclear={(which: string) => void clearOf(which)}
                {arming}
                {failure}
                onkill={kill}
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
