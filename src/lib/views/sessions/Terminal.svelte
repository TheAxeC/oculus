<script lang="ts">
    // Layer 3, view. One terminal pane: xterm.js over the `pty:` channel of O17, the composer under
    // it, and the control that starts one when nothing is selected. DESIGN.md's migration order puts
    // this at step 6, and its "PTY" is what the two halves do: the grid is the pane's own bytes, and
    // the composer is how a prompt is given to an agent, including to an agent in another pane.
    //
    // xterm.js is loaded inside the effect rather than at the top of the module: it needs a DOM, and
    // this view renders on the server like every other. The effect runs in the browser alone, so the
    // server render is the mount point and nothing else.
    //
    // The grid's colours are the theme's, read off the root element with getComputedStyle. They
    // cannot be CSS: xterm paints the glyphs itself and takes its palette as strings through its own
    // API. This is the one file in the application that reads a computed token.

    import '@xterm/xterm/css/xterm.css';
    import Composer from '$lib/ui/Composer.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Segment from '$lib/ui/Segment.svelte';
    import Select from '$lib/ui/Select.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { terminalFontPx } from '$lib/state/appearance';
    import { hubRoot, sessionsByWorkspace } from '$lib/state/selectors.svelte';
    import { pinnedTerminal, select, selectedTerminal } from '$lib/state/selection.svelte';
    import {
        resizeTerminal,
        sendInput,
        sendResize,
        startTerminal,
        subscribePty,
        terminals,
        titleStripper,
        unsubscribePty,
        type TerminalKind
    } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';
    import { instanceState, setTerminalFont, terminalFont, theme } from '$lib/state/ui.svelte';
    import { untrack } from 'svelte';
    import type { MenuItem } from '$lib/ui/Menu.svelte';
    import type { ViewProps } from '$lib/views/registry';
    import type { ITheme, Terminal as Grid } from '@xterm/xterm';

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

    const pinned = $derived(pinnedTerminal(instanceState(instance.id)));
    const id = $derived(pinned ?? selectedTerminal());
    const roots = $derived(sessionsByWorkspace(true).map((one) => one.key));
    const hub = $derived(hubRoot());

    /** Where the next terminal starts: what was picked, and the hub until something is. */
    const chosen = $derived(where === '' ? hub : where);

    /** Where a terminal may be started: the workspaces the payload knows, and the hub itself. */
    const places = $derived(
        [...new Set([hub, ...roots])]
            .filter((key) => key !== '')
            .sort()
            .map((key) => ({ id: key, label: key }))
    );

    /** The other terminals the composer may route to. One in the payload is a live tmux session. */
    const routes: MenuItem[] = $derived(
        terminals()
            .filter((one) => one.id !== id)
            .map((one) => ({ id: one.id, label: one.name }))
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
    function fontSize(chosen: number | null): number | undefined {
        const configured = chosen ?? terminalFontPx();
        if (configured !== null) return configured;
        const root = getComputedStyle(document.body);
        const computed = Number.parseFloat(root.getPropertyValue('--fs-md').trim());
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

    /** What the composer sends goes to this pane's terminal, and Enter with it. */
    function sendHere(text: string): void {
        if (id !== null) sendInput(id, `${text}\r`);
    }

    /** What the composer routed goes to another terminal, which is DESIGN.md's human routing. */
    function sendThere(to: string, text: string): void {
        sendInput(to, `${text}\r`);
    }

    // One effect for one mounted grid: it is torn down and built again when the terminal changes,
    // which is what makes the pane show one terminal at a time and leave no listener behind.
    $effect(() => {
        const at = body;
        const wanted = id;
        if (at === null || wanted === null) return;
        let alive = true;
        let close: (() => void) | null = null;
        void (async () => {
            const [xterm, addon] = await Promise.all([
                import('@xterm/xterm'),
                import('@xterm/addon-fit')
            ]);
            if (!alive) return;
            const fit = new addon.FitAddon();
            const size = fontSize(untrack(terminalFont));
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
        const wanted = id;
        if (name === '') return;
        // The class that carries the new tokens is put on the body by the workbench's own effect,
        // and this one may run before it in the same flush; reading the palette on the next frame
        // reads it after the body has changed. (The first Chrome check read the old palette.)
        const frame = requestAnimationFrame(() => {
            if (grid === null) return;
            grid.options.theme = palette();
            const size = fontSize(chosen);
            if (size !== undefined && grid.options.fontSize !== size) {
                grid.options.fontSize = size;
            }
            refit?.();
            if (wanted !== null) resized(wanted);
        });
        return () => cancelAnimationFrame(frame);
    });
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_terminal')}>
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

<Pane title={t('sessions.view_terminal')} toolbar={tools}>
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
                    onchange={(picked) => (where = picked)}
                />
                <ToolButton label={t('sessions.start_terminal')} onclick={() => void start()} />
                {#if failure !== ''}
                    <p class="failure">{failure}</p>
                {/if}
            </div>
        {:else}
            <div class="grid" bind:this={body} data-terminal={id}></div>
            <Composer
                label={t('sessions.compose')}
                send={t('sessions.send')}
                routeLabel={t('sessions.route_to')}
                {routes}
                onsend={sendHere}
                onroute={sendThere}
            />
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
