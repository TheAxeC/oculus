<script lang="ts">
    // Layer 3, view partial. The grid of one terminal in a Terminal tab, drawn as VS Code's
    // terminal panel draws one: xterm.js over the `pty:` channel, with the steer box under it only
    // when Claude or Codex runs in it (a shell is typed into at the grid, which then takes the
    // whole height). A split tab draws two of these side by side, so everything one grid holds (the
    // mount, the subscription, the resize, the bell, the paste question and the file drop) is this
    // component's own. A paste of several lines is asked about before it is sent, since each line
    // would run; a file dropped from the Files view types its quoted path; a bell is reported to
    // the tab, which marks the terminal's row.
    //
    // xterm.js is loaded inside the effect rather than at the top of the module: it needs a DOM,
    // and this view renders on the server like every other. The effect runs in the browser alone,
    // so the server render is the mount point and nothing else. Its stylesheet is loaded there too:
    // a static import of it is folded into the route's own stylesheet, which every page then
    // carries for a grid most readers never open.
    //
    // The grid's colours, its selection and its font are the theme's, read off the body with
    // getComputedStyle by grid-look.ts, and its size by gridFontSize (terminal-list.ts). They
    // cannot be CSS: xterm paints the glyphs itself and takes its palette and its font as strings
    // through its own API.
    //
    // A right-click on the grid opens VS Code's terminal menu (terminal-list.ts, `gridMenu`): Copy
    // and Copy as HTML while xterm holds a selection, Paste, Select All, Clear, then Split
    // Terminal, Rename, Change Icon, Change Color and Kill Terminal on this grid's terminal, Kill
    // arming first as the row's Kill does and reading as the armed control while the terminal is
    // armed. Copy as HTML is the serialize addon's `serializeAsHTML` of the selection written as
    // `text/html` beside its plain text, and Clear empties this grid and the terminal's tmux
    // history (grid-actions.ts); a failure of either is said on the tab's bar through `onsay`. The
    // tab reaches Clear for a row's menu through `oncontrol`, which hands it this grid's Clear
    // while the grid is mounted. The items are read when the right-click arrives, so Copy follows
    // the selection xterm holds at that moment. Paste reads the clipboard and takes the same path a
    // browser paste takes, so a paste of several lines is asked about; a clipboard the browser
    // refuses to read leaves the grid as it was. The context menu key and Shift+F10 open the menu
    // at the cursor rather than reaching the shell (terminal-list.ts, `holdMenuKeys`).
    //
    // Cmd+F (Ctrl+F off macOS) at the grid opens the find bar over its top right (FindBar.svelte),
    // as VS Code's terminal find: the search addon marks every match on the theme's `--accent-bg`
    // and the active one in `--accent` (grid-look.ts, `findLook`), read again when the theme
    // changes. The bar's state and its searches are grid-find.svelte.ts's. The find keys are taken
    // with xterm's own key hook before xterm handles the key, so the shell never sees them and the
    // browser's find does not open. A URL in the output is a link (the web links addon), opened in
    // a new tab on Cmd+click (Ctrl+click off macOS) and left to the program on a plain click. The
    // Unicode 11 width tables draw an emoji and a wide character over two cells, as the shell
    // counts them. In a task terminal a line naming a file of the command's repository is a link to
    // it (grid-links.ts).
    //
    // The grid is subscribed once its window has the grid's size (`subscribePty`), and an effect of
    // its own follows the `terminal:` cursor, Option and copy settings (grid-look.ts).

    import SteerBox from '$lib/views/shared/sessions/SteerBox.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import { titleStripper } from '$lib/state/sessions/terminals.svelte';
    import { scrollTarget, viewportOf } from '$lib/state/sessions/terminal/viewport';
    import { FILE_DRAG } from '$lib/state/sources/fs';
    import {
        MENU_CLEAR,
        MENU_COPY,
        MENU_COPY_HTML,
        MENU_ICON,
        MENU_KILL,
        MENU_RENAME,
        MENU_RERUN,
        MENU_RESTART,
        MENU_PASTE,
        MENU_SELECT_ALL,
        MENU_SPLIT,
        colorOf,
        fileOver,
        gridFontSize,
        gridMenu,
        holdMenuKeys,
        holdPastes,
        pasteRoute,
        shellQuote,
        taskStateOf
    } from '../terminal-list';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { scheduleReflow } from './reflow';
    import { applyLook, followTerminalOptions, gridLook, gridOptions } from './grid-look';
    import { GridFind } from './grid-find.svelte';
    import {
        clearGrid,
        copyAsHtml,
        copySelection,
        pageClipboard,
        type HtmlSerializer
    } from './grid-actions';
    import { errorLinks } from './grid-links';
    import { gridKeys } from './grid-keys';
    import FindBar from './FindBar.svelte';
    import { FIND_LIMIT, linkHandler, type FindAction, type FindToggles } from '../terminal-list';
    import { untrack } from 'svelte';
    import type { Terminal as Grid } from '@xterm/xterm';
    import { terminalOptions } from '$lib/state/shared/words/appearance';
    import { useState } from '$lib/state/client/use';
    import { onMac } from '$lib/ui/controls/editor/kit/load';

    type Props = {
        /** The terminal this grid shows. */
        id: string;
        /** The terminal a pointer press asked to focus, whose grid takes focus; null for none. */
        focusing: string | null;
        /** Called once this grid took the focus it was asked for. */
        onfocused: () => void;
        /** Called when the terminal's bell rings. */
        onbell: (id: string) => void;
        /** Split Terminal from the grid's menu, as the list row's Split does. */
        onsplit: (id: string) => void;
        /** Whether this grid's terminal is armed to be killed, as its row's armed Kill shows. */
        armed: boolean;
        /** Kill Terminal from the grid's menu, as a press of the row's Kill: arm, then kill. */
        onkill: (id: string) => void;
        /** Rerun and Restart from the menu of a task terminal. */
        onrerun: (id: string) => void;
        onrestart: (id: string) => void;
        /** Rename from the grid's menu. */
        onrename: (id: string) => void;
        /** Change Icon from the grid's menu. */
        onicon: (id: string) => void;
        /** Change Color from the grid's menu; the empty string is Default. */
        oncolor: (id: string, color: string) => void;
        /** A failure to say on the tab's bar. */
        onsay: (words: string) => void;
        /** Hands the tab this grid's Clear while it is mounted, and null when it goes. */
        oncontrol: (id: string, control: { clear: () => Promise<string> } | null) => void;
    };

    let {
        id,
        focusing,
        onfocused,
        onbell,
        onsplit,
        armed,
        onkill,
        onrerun,
        onrestart,
        onrename,
        onicon,
        oncolor,
        onsay,
        oncontrol
    }: Props = $props();

    const {
        commands: { errorFile, note, openAt },
        debug,
        terminals: {
            clearHistory,
            keepViewport,
            resizeTerminal,
            sendInput,
            sendResize,
            subscribePty,
            takeViewport,
            terminalById,
            unsubscribePty
        },
        ui: { terminalFont, textScale, theme }
    } = useState();

    /** How long the pane must hold still before the tmux window is told its new size. */
    const SETTLE = 100;

    /** The mount point, once the browser has it. */
    let body: HTMLDivElement | null = $state(null);

    /** The grid and its fit addon, while one is mounted. */
    let grid: Grid | null = $state(null);
    let measure: (() => { cols: number; rows: number } | null) | null = null;
    let refit: (() => void) | null = null;

    /** A paste of several lines waiting for its answer, and how many lines it holds. */
    let pasting: { text: string; lines: number } | null = $state(null);

    /** Whether the page runs on macOS, where the find and link modifier is Cmd. */
    const mac = onMac();

    /** The serialize addon of the mounted grid, which Copy as HTML reads the selection through. */
    let serializer: HtmlSerializer | null = null;

    /** The find bar's state and what it does with the mounted grid's search addon. */
    const find = new GridFind(() => grid?.focus());

    const terminal = $derived(terminalById(id));
    /** Whether an agent runs in the terminal, which is what the steer box is drawn under. */
    const agent = $derived(terminal !== null && terminal.kind !== 'shell');

    /** Tell the terminal its pane's size, over the socket, or by the endpoint when it is closed. */
    function resized(to: string): void {
        const size = measure?.() ?? null;
        if (size === null || size.cols < 1 || size.rows < 1) return;
        if (!sendResize(to, size.cols, size.rows)) void resizeTerminal(to, size.cols, size.rows);
    }

    /** Paste the clipboard's text the way a browser paste goes; a refused read changes nothing. */
    async function pasteClipboard(): Promise<void> {
        let text: string;
        try {
            text = await navigator.clipboard.readText();
        } catch {
            return;
        }
        if (grid === null || text === '') return;
        const route = pasteRoute(text);
        if ('ask' in route) pasting = { text, lines: route.ask };
        else grid.paste(route.send);
    }

    /** Empty the grid and the terminal's history; a refusal is said on the bar. */
    async function clear(): Promise<string> {
        if (grid === null) return '';
        const failure = await clearGrid(grid, id, clearHistory);
        if (failure !== '') onsay(failure);
        return failure;
    }

    /** Copy the selection as HTML beside its plain text; a clipboard that refuses is said. */
    async function copyHtml(): Promise<void> {
        if (grid === null || serializer === null) return;
        const item = typeof ClipboardItem === 'undefined' ? undefined : ClipboardItem;
        const failure = await copyAsHtml(serializer, grid.getSelection(), pageClipboard(), item);
        if (failure !== '') onsay(failure);
    }

    function picked(pick: string): void {
        if (pick === MENU_CLEAR) void clear();
        else if (pick === MENU_COPY_HTML) void copyHtml();
        else if (pick === MENU_RENAME) onrename(id);
        else if (pick === MENU_ICON) onicon(id);
        else if (colorOf(pick) !== null) oncolor(id, colorOf(pick) ?? '');
        else if (pick === MENU_COPY) {
            copySelection(grid?.getSelection() ?? '', pageClipboard());
        } else if (pick === MENU_PASTE) void pasteClipboard();
        else if (pick === MENU_SELECT_ALL) grid?.selectAll();
        else if (pick === MENU_SPLIT) onsplit(id);
        else if (pick === MENU_KILL) onkill(id);
        else if (pick === MENU_RERUN) onrerun(id);
        else if (pick === MENU_RESTART) onrestart(id);
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
        if (path === '') return;
        event.preventDefault();
        sendInput(id, `${shellQuote(path)} `);
        grid?.focus();
    }

    // A pointer press on this terminal's row hands the keyboard to the grid, mounted or mounting.
    $effect(() => {
        if (focusing !== id || grid === null) return;
        grid.focus();
        untrack(onfocused);
    });

    // One effect for one mounted grid: it is torn down and built again when the terminal changes,
    // which is what leaves no listener behind.
    $effect(() => {
        const at = body;
        const wanted = id;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- bind:this fills body, which the checker does not see, so it reads the declaration's null here
        if (at === null) return;
        let alive = true;
        let close: (() => void) | null = null;
        void (async () => {
            const [xterm, addon, finder, links, wide, serialize] = await Promise.all([
                import('@xterm/xterm'),
                import('@xterm/addon-fit'),
                import('@xterm/addon-search'),
                import('@xterm/addon-web-links'),
                import('@xterm/addon-unicode11'),
                import('@xterm/addon-serialize'),
                import('@xterm/xterm/css/xterm.css')
            ]);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the teardown below sets the flag after this closure was written, which the checker does not see
            if (!alive) return;
            const fit = new addon.FitAddon();
            const size = gridFontSize(untrack(terminalFont), untrack(textScale) ?? 1);
            const term = new xterm.Terminal(
                gridOptions(gridLook(), size, untrack(terminalOptions))
            );
            term.loadAddon(fit);
            const searcher = new finder.SearchAddon({ highlightLimit: FIND_LIMIT });
            term.loadAddon(searcher);
            const opened = (url: string) => window.open(url, '_blank', 'noopener');
            term.loadAddon(new links.WebLinksAddon(linkHandler(mac, opened)));
            term.loadAddon(new wide.Unicode11Addon());
            const serializing = new serialize.SerializeAddon();
            term.loadAddon(serializing);
            serializer = serializing;
            term.unicode.activeVersion = '11';
            // A find key is the bar's, on its press and on its release, and never the shell's; a
            // debug key is the debugger's while a session runs (grid/grid-keys.ts).
            term.attachCustomKeyEventHandler(
                gridKeys({
                    mac,
                    finding: () => find.finding,
                    find: (action) => find.action(action),
                    debugging: debug.active
                })
            );
            const detachFind = find.attach(searcher);
            term.open(at);
            fit.fit();
            grid = term;
            oncontrol(wanted, { clear });
            measure = () => ({ cols: term.cols, rows: term.rows });
            refit = () => fit.fit();
            const typed = term.onData((data: string) => sendInput(wanted, data));
            const rang = term.onBell(() => onbell(wanted));
            // The mount point typed as the element it is: the checker reads `body` as its
            // declaration's null, so `at` would otherwise carry no methods it can resolve.
            const host: HTMLElement = at;
            const unhold = holdPastes(host, (held) => (pasting = held));
            const unkey = holdMenuKeys(host);
            // A shell names its tmux window after the running command with `ESC k <name> ESC \`,
            // which xterm does not know and would print as the name itself; the title is dropped,
            // and a sequence cut across two chunks is carried to the next one.
            const titles = titleStripper();
            // The text of a task terminal's output is read for errors, so its bytes are decoded
            // once more here; a character cut across two chunks is carried to the next.
            let decoder = new TextDecoder();
            // A line naming a file of the command's repository that is there is a link to it.
            const linking = term.registerLinkProvider(
                errorLinks(term, {
                    isTask: () => terminalById(wanted)?.task === true,
                    errorFile: (file: string) => errorFile(wanted, file),
                    openAt
                })
            );
            // The viewport the last grid of this terminal kept, scrolled to once the scrollback is
            // written (a grid drawn again by Float or Return to Page).
            let kept = takeViewport(wanted);
            // The window takes the grid's size before the channel is asked for (`subscribePty`).
            const off = subscribePty(
                wanted,
                () => ({ cols: term.cols, rows: term.rows }),
                (bytes, scrollback) => {
                    // The scrollback is sent to this socket alone at version 0, so a reconnect
                    // hands it over again; repainting from it keeps a second copy off the grid.
                    if (scrollback) {
                        term.reset();
                        decoder = new TextDecoder();
                    }
                    const shown = titles(bytes);
                    if (scrollback && kept !== undefined) {
                        const place = kept;
                        kept = undefined;
                        term.write(shown, () =>
                            term.scrollToLine(scrollTarget(place, term.buffer.active.baseY))
                        );
                    } else term.write(shown);
                    note(wanted, decoder.decode(shown, { stream: true }), scrollback);
                }
            );
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
                linking.dispose();
                detachFind();
                // A terminal that ended keeps nothing.
                if (terminalById(wanted) !== null) {
                    const { viewportY, baseY } = term.buffer.active;
                    keepViewport(wanted, viewportOf(viewportY, baseY));
                }
                serializer = null;
                oncontrol(wanted, null);
                unhold();
                unkey();
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

    // The config's cursor, Option and copy settings follow onto the mounted grid, with no refit.
    $effect(() => {
        const held = grid;
        const options = terminalOptions();
        if (held === null) return;
        return followTerminalOptions(held, options, pageClipboard);
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
                const held = untrack(() => grid);
                if (held === null) return false;
                applyLook(held.options, gridLook());
                find.restyle();
                const size = gridFontSize(chosen, scale);
                if (size !== undefined && held.options.fontSize !== size) {
                    held.options.fontSize = size;
                }
                return true;
            },
            () => {
                refit?.();
                resized(wanted);
            }
        );
    });
</script>

<div class="half">
    <ContextMenu
        label={t('sessions.view_terminal')}
        read={() => gridMenu(grid?.hasSelection() === true, armed, t, taskStateOf(terminal))}
        onpick={picked}
    >
        <!-- The grid takes a file dropped from the Files view; its keyboard is xterm's. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="grid"
            bind:this={body}
            data-terminal={id}
            ondragover={fileOver}
            ondrop={droppedOnGrid}
        ></div>
    </ContextMenu>
    {#if find.finding}
        <FindBar
            term={find.term}
            toggles={find.toggles}
            results={find.results}
            {mac}
            asked={find.asked}
            onterm={(typed: string) => find.typed(typed)}
            ontoggles={(flipped: FindToggles) => find.toggled(flipped)}
            onaction={(action: FindAction) => find.action(action)}
        />
    {/if}
    {#if agent}
        <SteerBox {terminal} />
    {/if}
</div>

{#if pasting !== null}
    <Confirm
        message={pasting.lines === 1
            ? t('sessions.paste_confirm_one')
            : t('sessions.paste_confirm', pasting.lines)}
        confirm={t('sessions.paste_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => answerPaste(true)}
        oncancel={() => answerPaste(false)}
    />
{/if}

<style>
    .half {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        height: 100%;
    }

    .grid {
        flex: 1 1 auto;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
    }
</style>
