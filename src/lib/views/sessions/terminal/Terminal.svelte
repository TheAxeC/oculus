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
    // Layer 3, view. One terminal pane, drawn as VS Code's terminal panel: xterm.js over the `pty:`
    // channel, the steer box under the grid only when Claude or Codex runs in it (a shell is typed
    // into at the grid, which then takes the whole height), and the composer of a new session when
    // the tab shows no terminal. From two terminals on, the list of terminals (TerminalList.svelte)
    // is drawn on the right of the body whatever the tab shows, and with one terminal while the tab
    // shows the composer; a tab showing its only terminal names it on the bar. A paste of several
    // lines is asked about before it is sent, since each line would run; a file dropped from the
    // Files view types its quoted path; a bell marks the terminal's row.
    //
    // A selected session that runs in no terminal of oculus cannot be typed into, so the tab draws
    // its steer box disabled with the sentence saying why; a new session is reached by New.
    //
    // A tab owns the terminal it was opened on or started, kept in its own instance state as
    // `session`, so several terminals show at once, one per tab. The bar's `new terminal` control
    // opens another Terminal tab, which carries an identity of its own and no terminal and so shows
    // the composer rather than the selection; a start from such a tab makes the terminal it started
    // that tab's own. A tab opened with neither follows the selection: the terminal selected, or
    // the oculus terminal the selected session runs in; a start from it selects what it started and
    // it goes on following. New in the sessions list puts a composer in that following tab
    // (state/sessions/terminals.svelte.ts, `composerState`), which returns to following once it
    // starts.
    //
    // xterm.js is loaded inside the effect rather than at the top of the module: it needs a DOM,
    // and this view renders on the server like every other. The effect runs in the browser alone,
    // so the server render is the mount point and nothing else. Its stylesheet is loaded there too:
    // a static import of it is folded into the route's own stylesheet, which every page then
    // carries for a grid most readers never open.
    //
    // The grid's colours are the theme's, read off the root element with getComputedStyle. They
    // cannot be CSS: xterm paints the glyphs itself and takes its palette as strings through its
    // own API. This is the one file in the application that reads a computed token.

    import Composer from './Composer.svelte';
    import TerminalList from './TerminalList.svelte';
    import TerminalTitle from './TerminalTitle.svelte';
    import SteerBox from '$lib/views/shared/sessions/SteerBox.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import { terminalFontPx } from '$lib/state/shared/words/appearance';
    import { pinnedTerminal } from '$lib/state/workbench/selection.svelte';
    import { stateId } from '$lib/state/workbench/layout/instance';
    import { followsSelection, titleStripper } from '$lib/state/sessions/terminals.svelte';
    import { sessionRows, terminalChoices } from '$lib/state/sessions/folds';
    import { FILE_DRAG } from '$lib/state/sources/fs';
    import {
        BELL_MS,
        fileOver,
        holdPastes,
        listDrawn,
        orderedRows,
        shellQuote,
        storedOrder,
        terminalTip
    } from './terminal-list';
    import { t } from '$lib/state/shared/words/text';
    import { scheduleReflow } from './reflow';
    import { untrack } from 'svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import type { ITheme, Terminal as Grid } from '@xterm/xterm';
    import { useState } from '$lib/state/client/use';

    const {
        layout: {
            instanceLayoutState,
            openView,
            pageViewState,
            pinInstance,
            restateInstance,
            unpinInstance
        },
        selectors: { sessionById, sessionsByWorkspace },
        selection: { select, selected, selectedTerminal },
        terminals: {
            resizeTerminal,
            sendInput,
            sendResize,
            subscribePty,
            terminalById,
            terminalOfSession,
            terminals,
            unsubscribePty
        },
        ui: { setTerminalFont, terminalFont, textScale, theme }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How long the pane must hold still before the tmux window is told its new size. */
    const SETTLE = 100;

    /** The sixteen ANSI slots, in xterm's order, and the token each one is painted from. */
    const ANSI: [keyof ITheme, string][] = [
        ['black', '--muted'],
        ['red', '--c-red'],
        ['green', '--c-green'],
        ['yellow', '--c-gold'],
        ['blue', '--c-blue'],
        ['magenta', '--c-magenta'],
        ['cyan', '--c-cyan'],
        ['white', '--ink'],
        ['brightBlack', '--muted'],
        ['brightRed', '--c-red'],
        ['brightGreen', '--c-green'],
        ['brightYellow', '--c-gold'],
        ['brightBlue', '--c-blue'],
        ['brightMagenta', '--c-magenta'],
        ['brightCyan', '--c-cyan'],
        ['brightWhite', '--ink']
    ];

    /** The mount point, once the browser has it. */
    let body: HTMLDivElement | null = $state(null);

    /** The grid and its fit addon, while one is mounted. */
    let grid: Grid | null = null;
    let measure: (() => { cols: number; rows: number } | null) | null = null;
    let refit: (() => void) | null = null;

    const pinned = $derived(pinnedTerminal(instanceLayoutState(instance.id)));
    /**
     * Whether the tab was opened to start a terminal of its own: it carries an identity and no
     * terminal yet, so it shows the start form rather than whatever the rail has selected.
     */
    const fresh = $derived(pinned === null && stateId(instanceLayoutState(instance.id)) !== null);
    /** The session selected, when the selection is a session rather than a terminal. */
    const selectedSession = $derived(
        pinned !== null || fresh || selectedTerminal() !== null ? null : sessionById(selected())
    );
    const id = $derived(
        pinned ??
            (fresh ? null : (selectedTerminal() ?? terminalOfSession(selectedSession)?.id ?? null))
    );
    const terminal = $derived(terminalById(id));
    /** Whether an agent runs in the terminal shown, which is what the steer box is drawn under. */
    const agent = $derived(terminal !== null && terminal.kind !== 'shell');

    /** The list's rows, in the reader's order for the page, else in the order they were started. */
    const rows = $derived(
        orderedRows(
            terminalChoices(terminals(), sessionRows(sessionsByWorkspace(true))),
            storedOrder(pageViewState(instance.id))
        )
    );
    const listed = $derived(listDrawn(rows.length, id === null && selectedSession === null));
    const shown = $derived(rows.find((row) => row.terminal === id) ?? null);

    /** The terminal whose bell rang in this tab, while its mark shows. */
    let ringing: string | null = $state(null);
    let bellTimer: ReturnType<typeof setTimeout> | null = null;

    /** A paste of several lines waiting for its answer, and how many lines it holds. */
    let pasting: { text: string; lines: number } | null = $state(null);
    /** The terminal a pointer press on its row asked for, whose grid takes focus on mounting. */
    let focusing: string | null = null;

    /**
     * A pinned tab carries the session's name, and a terminal is renamed while it runs; the label
     * follows the name rather than staying at what it was when the pin was made.
     */
    $effect(() => {
        const held = pinned;
        if (held === null) return;
        const live = terminalById(held);
        if (live === null || live.name === '') return;
        const state = instanceLayoutState(instance.id);
        const label =
            typeof state === 'object' && state !== null && !Array.isArray(state)
                ? (state as Record<string, unknown>).label
                : undefined;
        if (label === live.name) return;
        restateInstance(instance.id, { session: held, label: live.name });
    });

    /** Pin this terminal to what it shows, or return it to following the terminal selection. */
    function togglePanePin(): void {
        if (pinned !== null) unpinInstance(instance.id);
        else if (terminal !== null) pinInstance(instance.id, terminal.id, terminal.name);
    }

    /**
     * The palette in force, read off the body, which is where the theme's class sits and where its
     * tokens are set (`body.rice.dracula` and the like in themes.css); the root element carries the
     * light defaults only, and reading there painted a white grid under every dark theme.
     */
    function palette(): ITheme {
        const root = getComputedStyle(document.body);
        const of = (name: string) => root.getPropertyValue(name).trim();
        const colours: ITheme = {
            background: of('--panel'),
            foreground: of('--ink'),
            cursor: of('--accent')
        };
        for (const [slot, token] of ANSI) {
            (colours as Record<string, string>)[slot] = of(token);
        }
        return colours;
    }

    /** The configured grid size, or the body type scale when config leaves it unset. */
    function fontSize(chosen: number | null, scale = textScale() ?? 1): number | undefined {
        const configured = chosen ?? terminalFontPx();
        if (configured !== null) return configured;
        const root = getComputedStyle(document.body);
        const base = Number.parseFloat(
            /[\d.]+px/.exec(root.getPropertyValue('--fs-md'))?.[0] ?? ''
        );
        const computed = base * scale;
        return Number.isFinite(computed) && computed >= 1 ? computed : undefined;
    }

    /** Move the chosen size by one CSS pixel from the value currently in force. */
    function stepFont(by: number): void {
        const current = fontSize(terminalFont());
        if (current !== undefined) setTerminalFont(current + by);
    }

    /** Tell the terminal its pane's size, over the socket, or by the endpoint when it is closed. */
    function resized(to: string): void {
        const size = measure?.() ?? null;
        if (size === null || size.cols < 1 || size.rows < 1) return;
        if (!sendResize(to, size.cols, size.rows)) void resizeTerminal(to, size.cols, size.rows);
    }

    /**
     * What a start from the composer does with the terminal it made. A tab that owns what it shows
     * owns this one, named after the agent until the terminal's own name arrives, which the effect
     * above then puts on it. A tab that follows the selection selects it and goes on following, so
     * the list and this tab agree on what is being read.
     */
    function started(made: string, label: string): void {
        const owner = instance.id;
        if (followsSelection(instanceLayoutState(owner))) {
            restateInstance(owner, {});
            select(made);
            return;
        }
        restateInstance(owner, { session: made, label });
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

    /** Send the paste the question held, or drop it. */
    function answerPaste(send: boolean): void {
        const held = pasting;
        pasting = null;
        if (held === null || grid === null) return;
        if (send) grid.paste(held.text);
        grid.focus();
    }

    /** A file dropped on the grid from the Files view: its path typed, quoted, and no Enter. */
    function droppedOnGrid(event: DragEvent): void {
        const path = event.dataTransfer?.getData(FILE_DRAG) ?? '';
        if (path === '' || id === null) return;
        event.preventDefault();
        sendInput(id, `${shellQuote(path)} `);
        grid?.focus();
    }

    /** A row pressed by the pointer: the grid shown takes focus, or the one about to mount. */
    function pointed(terminal: string): void {
        if (terminal === id) grid?.focus();
        else focusing = terminal;
    }

    /** Open another Terminal tab, with an identity of its own, showing the composer. */
    function openAnother(): void {
        openView('terminal', { id: crypto.randomUUID() });
    }

    // One effect for one mounted grid: it is torn down and built again when the terminal changes,
    // which is what makes the pane show one terminal at a time and leave no listener behind.
    $effect(() => {
        const at = body;
        const wanted = id;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- bind:this fills body, which the checker does not see, so it reads the declaration's null here
        if (at === null || wanted === null) return;
        let alive = true;
        let close: (() => void) | null = null;
        void (async () => {
            const [xterm, addon] = await Promise.all([
                import('@xterm/xterm'),
                import('@xterm/addon-fit'),
                import('@xterm/xterm/css/xterm.css')
            ]);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the teardown below sets the flag after this closure was written, which the checker does not see
            if (!alive) return;
            const fit = new addon.FitAddon();
            const size = fontSize(untrack(terminalFont), untrack(textScale) ?? 1);
            const options = {
                theme: palette(),
                convertEol: false
            };
            const term = new xterm.Terminal(
                size === undefined ? options : { ...options, fontSize: size }
            );
            term.loadAddon(fit);
            term.open(at);
            fit.fit();
            grid = term;
            if (focusing === wanted) term.focus();
            focusing = null;
            measure = () => ({ cols: term.cols, rows: term.rows });
            refit = () => fit.fit();
            const typed = term.onData((data: string) => sendInput(wanted, data));
            const rang = term.onBell(() => ring(wanted));
            // The mount point typed as the element it is: the checker reads `body` as its
            // declaration's null, so `at` would otherwise carry no methods it can resolve.
            const host: HTMLElement = at;
            const unhold = holdPastes(host, (held) => (pasting = held));
            // A shell names its tmux window after the running command with `ESC k <name> ESC \`,
            // which xterm does not know and would print as the name itself; the title is dropped,
            // and a sequence cut across two chunks is carried to the next one.
            const titles = titleStripper();
            const off = subscribePty(wanted, (bytes, scrollback) => {
                // The scrollback is sent to this socket alone at version 0, so a reconnect hands it
                // over again; repainting from it is what keeps a second copy off the grid.
                if (scrollback) term.reset();
                term.write(titles(bytes));
            });
            resized(wanted);
            let settle: ReturnType<typeof setTimeout> | null = null;
            const watcher = new ResizeObserver(() => {
                if (settle !== null) clearTimeout(settle);
                settle = setTimeout(() => {
                    settle = null;
                    fit.fit();
                    resized(wanted);
                }, SETTLE);
            });
            watcher.observe(at);
            close = () => {
                if (settle !== null) clearTimeout(settle);
                watcher.disconnect();
                off();
                unsubscribePty(wanted);
                typed.dispose();
                rang.dispose();
                unhold();
                if (bellTimer !== null) clearTimeout(bellTimer);
                bellTimer = null;
                ringing = null;
                pasting = null;
                term.dispose();
                grid = null;
                measure = null;
                refit = null;
            };
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the teardown below sets the flag after this closure was written, which the checker does not see
            if (!alive) close();
        })();
        return () => {
            alive = false;
            close?.();
        };
    });

    // A theme or terminal-size change updates the mounted grid: xterm holds the values it was given
    // rather than reading CSS or the UI store again.
    $effect(() => {
        const name = theme();
        const chosen = terminalFont();
        const scale = textScale() ?? 1;
        const wanted = id;
        if (name === '') return;
        // The class that carries the new tokens is put on the body by the workbench's own effect,
        // and this one may run before it in the same flush; reading the palette on the next frame
        // reads it after the body has changed, where reading it at once would read the old palette.
        return scheduleReflow(
            requestAnimationFrame,
            cancelAnimationFrame,
            () => {
                if (grid === null) return false;
                grid.options.theme = palette();
                const size = fontSize(chosen, scale);
                if (size !== undefined && grid.options.fontSize !== size) {
                    grid.options.fontSize = size;
                }
                return true;
            },
            () => {
                refit?.();
                if (wanted !== null) resized(wanted);
            }
        );
    });
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_terminal')}>
        {#if !listed && shown !== null}
            <TerminalTitle
                {shown}
                tip={terminal === null ? shown.title : terminalTip(terminal)}
                ringing={ringing === shown.terminal}
            />
        {/if}
        <ToolButton
            label={t('sessions.new_terminal')}
            title={t('sessions.new_terminal_title')}
            glyph={t('sessions.terminal_glyph')}
            onclick={openAnother}
        />
        {#if terminal !== null || pinned !== null}
            <ToolButton
                label={pinned === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                title={pinned === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                glyph={t('sessions.pin_glyph')}
                compact
                pressed={pinned !== null}
                onclick={togglePanePin}
            />
        {/if}
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

<Pane title={t('sessions.view_terminal')} toolbar={tools} tinted>
    <div class="terminal" data-instance={instance.id}>
        <div class="main">
            {#if id === null && selectedSession !== null}
                <div class="start">
                    <p class="elsewhere" data-runs-elsewhere>
                        {t('composer.selected_elsewhere', selectedSession.title)}
                    </p>
                    <SteerBox terminal={null} />
                </div>
            {:else if id === null}
                <div class="start">
                    <Composer owner={instance.id} onstarted={started} />
                </div>
            {:else}
                <!-- The grid takes a file dropped from the Files view; its keyboard is xterm's. -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="grid"
                    bind:this={body}
                    data-terminal={id}
                    ondragover={fileOver}
                    ondrop={droppedOnGrid}
                ></div>
                {#if agent}
                    <SteerBox {terminal} />
                {/if}
            {/if}
        </div>
        {#if listed}
            <TerminalList instance={instance.id} {rows} current={id} {ringing} onshown={pointed} />
        {/if}
    </div>
</Pane>

{#if pasting !== null}
    <Confirm
        message={t('sessions.paste_confirm', pasting.lines)}
        confirm={t('sessions.paste_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => answerPaste(true)}
        oncancel={() => answerPaste(false)}
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

    .main {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }

    .start {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .elsewhere {
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .grid {
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
    }
</style>
