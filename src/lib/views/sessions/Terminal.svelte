<script module lang="ts">
    // Layer 3, view registration. Terminal follows session detail in the sessions flyout.
    import type { ViewRegistration } from '$lib/views/registry';
    export const registration: ViewRegistration = {
        id: 'terminal',
        label: 'sessions.view_terminal',
        glyph: 'sessions.terminal_glyph',
        group: 'sessions',
        order: 2
    };
</script>

<script lang="ts">
    // Layer 3, view. One terminal pane: xterm.js over the `pty:` channel and the control that
    // starts one when nothing is selected. The grid takes keyboard input and carries its own bytes.
    //
    // xterm.js is loaded inside the effect rather than at the top of the module: it needs a DOM, and
    // this view renders on the server like every other. The effect runs in the browser alone, so the
    // server render is the mount point and nothing else. Its stylesheet is loaded there too: a
    // static import of it is folded into the route's own stylesheet, which every page then carries
    // for a grid most readers never open.
    //
    // The grid's colours are the theme's, read off the root element with getComputedStyle. They
    // cannot be CSS: xterm paints the glyphs itself and takes its palette as strings through its own
    // API. This is the one file in the application that reads a computed token.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Segment from '$lib/ui/Segment.svelte';
    import Select from '$lib/ui/Select.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { terminalFontPx } from '$lib/state/appearance';
    import { pinnedTerminal } from '$lib/state/selection.svelte';
    import { titleStripper, type TerminalKind } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';
    import { scheduleReflow } from './reflow';
    import { untrack } from 'svelte';
    import type { ViewProps } from '$lib/views/registry';
    import type { ITheme, Terminal as Grid } from '@xterm/xterm';
    import { useState } from '$lib/state/use';

    const {
        layout: { instanceLayoutState, pinInstance, restateInstance, unpinInstance },
        selectors: { hubRoot, sessionsByWorkspace },
        selection: { select, selectedTerminal },
        terminals: {
            resizeTerminal,
            sendInput,
            sendResize,
            startTerminal,
            subscribePty,
            terminalById,
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

    /** What the last start was refused with, in the server's own words, or the empty string. */
    let failure = $state('');

    /** The start control's two fields. */
    let kind: TerminalKind = $state('shell');
    let where = $state('');

    /** The grid and its fit addon, while one is mounted. */
    let grid: Grid | null = null;
    let measure: (() => { cols: number; rows: number } | null) | null = null;
    let refit: (() => void) | null = null;

    const pinned = $derived(pinnedTerminal(instanceLayoutState(instance.id)));
    const id = $derived(pinned ?? selectedTerminal());
    const terminal = $derived(terminalById(id));
    const roots = $derived(sessionsByWorkspace(true).map((one) => one.key));
    const hub = $derived(hubRoot());

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

    /** Where the next terminal starts: what was picked, and the hub until something is. */
    const chosen = $derived(where === '' ? hub : where);

    /** Pin this terminal to what it shows, or return it to following the terminal selection. */
    function togglePanePin(): void {
        if (pinned !== null) {
            unpinInstance(instance.id);
            return;
        }
        if (terminal !== null) {
            pinInstance(instance.id, terminal.id, terminal.name);
        }
    }

    /** Where a terminal may be started: the workspaces the payload knows, and the hub itself. */
    const places = $derived(
        [...new Set([hub, ...roots])]
            .filter((key) => key !== '')
            .sort()
            .map((key) => ({ id: key, label: key }))
    );

    const kinds = $derived([
        { id: 'claude', label: t('sessions.kind_claude'), glyph: t('sessions.kind_claude_glyph') },
        { id: 'codex', label: t('sessions.kind_codex'), glyph: t('sessions.kind_codex_glyph') },
        { id: 'shell', label: t('sessions.kind_shell'), glyph: t('sessions.kind_shell_glyph') }
    ]);

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

    async function start(): Promise<void> {
        const size = measure?.() ?? null;
        const answer =
            size === null
                ? await startTerminal(kind, chosen)
                : await startTerminal(kind, chosen, size.cols, size.rows);
        failure = answer.error;
        if (answer.ok && answer.id !== '') select(answer.id);
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
            measure = () => ({ cols: term.cols, rows: term.rows });
            refit = () => fit.fit();
            const typed = term.onData((data: string) => sendInput(wanted, data));
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
        // reads it after the body has changed. (The first Chrome check read the old palette.)
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
        {#if id === null}
            <div class="start">
                <Empty message={t('sessions.no_terminal')} glyph={t('sessions.terminal_glyph')} />
                <Segment
                    items={kinds}
                    value={kind}
                    label={t('sessions.start_terminal')}
                    onchange={(picked) => (kind = picked as TerminalKind)}
                />
                <Select
                    value={chosen}
                    label={t('sessions.cwd')}
                    empty={t('sessions.cwd_empty')}
                    choices={places}
                    onchange={(picked: string) => (where = picked)}
                />
                <ToolButton label={t('sessions.start_terminal')} onclick={() => void start()} />
                {#if failure !== ''}
                    <p class="failure">{failure}</p>
                {/if}
            </div>
        {:else}
            <div class="grid" bind:this={body} data-terminal={id}></div>
        {/if}
    </div>
</Pane>

<style>
    .terminal {
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
        padding: 4px 6px 6px;
        box-sizing: border-box;
    }

    .start {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .grid {
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
    }

    .failure {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--c-red-txt, var(--ink));
    }
</style>
