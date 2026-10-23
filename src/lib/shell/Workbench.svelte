<script lang="ts">
    // Layer 3, shell. The window: in the desktop app the title bar strip across its top
    // (titlebar/TitleBar.svelte), which a page in a browser does not draw, the rail, the one tree
    // the page on screen is (panes/leaf/PageArea.svelte), and the status bar along the foot under
    // both. It reads the arrangement from the store and every change goes back
    // through the store, so the whole of what is on screen is the saved workbench and a reload puts
    // it back as it was. Several of the status bar's items read stores the shell may not, so the
    // page hands in their words, and the git writes two of them ask for, and the shell draws the
    // bar.
    //
    // A page is one tree, so every split is the same kind of split and every child of one can be
    // collapsed to its edge and shown again through the same control. The floats are not part of
    // any tree: panes/floats/FloatLayer.svelte draws them once, outside the block keyed by the
    // page, so they stay on screen across a page switch and while a pane of the page is maximised.
    // The body is a grid so that a float docked to an edge takes a track of its own beside the
    // area.
    //
    // A float docked on an edge its toggle in the strip hides is drawn by no one, and its grid
    // track takes no room (the layout store's `shownFloats`). The window's navigation history,
    // which the strip's Back and Forward, their keys and the palette walk, is handed in by the page
    // and provided to everything under it (titlebar/history-walk.ts), and so is the store the
    // leading pane hands its editor actions up to while the strip draws them
    // (titlebar/strip-actions).
    //
    // The frames of the tabs are not part of any tree either: frames/FrameLayer.svelte draws each
    // once, outside the block keyed by the page, and a pane draws only the slot a frame is laid
    // over, so a layout change never loads a frame's document again.
    //
    // In the desktop app, and in a browser tab opened for a float, the page of a popped-out window
    // (`?float=<id>`) is this component with the body drawn as that one float alone, filling the
    // window (panes/floats/FloatWindow.svelte), under a strip of its own: no rail, no status bar
    // and no page, and none of the work that fills the rail's pages and takes in the shipped
    // floats, which the main window's page does for every window.
    //
    // It is also where the appearance is put on the document (window/appearance.svelte.ts): the
    // theme, the wallpaper and which of the two glyph vocabularies renders.
    //
    // It is also where the languages the acting apps add are handed to the editor's kit
    // (window/app-languages.svelte.ts), in the main window and in a popped-out window alike, and
    // where the commands of the desktop app's menu are answered (window/menu-commands.svelte.ts),
    // on the area the window draws.

    import { activeLabel, pageActiveTab, windowTitle } from '$lib/shell/panes/workbench-title';
    import ActivityRail from './rail/ActivityRail.svelte';
    import DropLayer from './panes/DropLayer.svelte';
    import { createWorkbenchKeys } from './keys/workbench-keys.svelte';
    import Asks from './commands/Asks.svelte';
    import DebugToolbar from './commands/debug/DebugToolbar.svelte';
    import { pressDebug } from './commands/debug/debug-key';
    import Palette from './keys/Palette.svelte';
    import type { PaletteStart } from './keys/palette-modes';
    import PageArea from './panes/leaf/PageArea.svelte';
    import FloatLayer from './panes/floats/FloatLayer.svelte';
    import FloatWindow from './panes/floats/FloatWindow.svelte';
    import FrameLayer from './frames/FrameLayer.svelte';
    import { bodyTracks } from './panes/floats/float-geometry';
    import UpdateTray from './rail/UpdateTray.svelte';
    import { provideTabFrames } from '$lib/ui/tabs/tab-frames.svelte';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import { useAppearance } from './window/appearance.svelte';
    import { useAppLanguages } from './window/app-languages.svelte';
    import { sourceKeys } from './window/source-keys';
    import { useMenuCommands } from './window/menu-commands.svelte';
    import TitleBar from './titlebar/TitleBar.svelte';
    import { NO_WALK, provideWalk, type HistoryWalk } from './titlebar/history-walk';
    import { provideStripActions } from './titlebar/strip-actions.svelte';
    import type { FloatSpec } from '$lib/state/workbench/layout';
    import type { PaletteKey } from '$lib/data/helpers/keys/oculus/palette-keys';
    import type { FirstThemeFiles } from '$lib/ui/theme/app-theme';
    import { modeOf } from '$lib/state/workbench/palette';
    import { COMMAND_PALETTE_EVENT, PIN_EDITOR_EVENT } from '$lib/ui/controls/editor/chords';
    import {
        docState,
        heldDocState,
        railOrder,
        type DocEntry,
        type NavGroup
    } from '$lib/state/workbench/navigation/catalogue';
    import type { RailEntry, RailPage } from '$lib/state/workbench/navigation/rail';
    import { arrangedDocs } from '$lib/state/workbench/navigation/arrangement';
    import {
        NO_GIT,
        NO_STATUS,
        type StatusGit,
        type StatusWords
    } from '$lib/state/workbench/navigation/status';
    import Bell from './status/notices/Bell.svelte';
    import StatusBar from './status/StatusBar.svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    /** The frames of every tab under the workbench, drawn by the frame layer. */
    const frames = provideTabFrames();

    // A tab put in a window, or copied there, starts from the places its viewers hold back.
    $effect(() => client.layout.settleBeforeWindow(() => frames.flush()));

    const {
        layout: { activeInstance, currentPage, floats, focused, shownFloats },
        ui: { paletteRequested, updateTrayRequested },
        registry: { views }
    } = client;

    type Props = {
        /** The view catalogue's groups of the merged config, which the chords count into. */
        groups?: NavGroup[];
        /** The `docs` list of the merged config: the hub documents a chord counts after views. */
        docs?: DocEntry[];
        /** The rail's pages: the `rail:` list of the merged config with their arrangements. */
        pages?: RailPage[];
        /**
         * The `floats` of the merged config: the floats a first load and Reset all pages start
         * with.
         */
        floats?: FloatSpec[];
        /**
         * Whether the merged config has come. It carries the rail list a browser with no saved
         * layout starts on, so until then such a browser draws no page.
         */
        configured?: boolean;
        /**
         * Rewrite the rail's list with an edit, a page button moved or hidden, answering why the
         * write was refused or the empty string. The page owns it, since the shell may not write.
         */
        editRail?: (edit: (rail: RailEntry[]) => RailEntry[]) => Promise<string>;
        /**
         * The `direct_chord` of the merged config: the letter a digit after it counts into the
         * views no catalogue group holds.
         */
        directChord?: string;
        /**
         * The words of the status bar's items whose stores the shell may not read: the machine,
         * the repository, the findings, the problems, the HPC poll, the usage, the server and the
         * live sessions. The page makes them and hands them on.
         */
        status?: StatusWords;
        /**
         * The git writes the status bar's branch and sync items ask for. The page owns them, since
         * the shell may not write.
         */
        git?: StatusGit;
        /**
         * How many sessions wait on a permission, for the document title. The page reads it from
         * the sessions channel and hands it on, since the shell may not read entities itself.
         */
        waiting?: number;
        /** The F8 walk: opens the next or previous problem, and answers false with none. */
        walkProblem?: (by: 1 | -1) => boolean;
        /** The window's navigation history, which the page reads since the shell may not. */
        history?: HistoryWalk;
        /** Save every tab's unsaved edits, the menu's Save All; the page owns it. */
        saveAll?: () => void;
        /**
         * The files of the app themes the `theme` and `app_theme` options name, which the page's
         * first load carries, so the first draw of such a theme is made without a load.
         */
        appThemes?: FirstThemeFiles;
    };

    let {
        groups = [],
        docs = [],
        pages = [],
        floats: shipped = [],
        configured = true,
        editRail,
        directChord,
        status = NO_STATUS,
        git = NO_GIT,
        waiting = 0,
        walkProblem = () => false,
        history = NO_WALK,
        saveAll = () => undefined,
        appThemes = {}
    }: Props = $props();

    const walk = provideWalk(() => history);
    /** Whether the window draws the title bar strip: the app's windows do, a browser does not. */
    const stripped = client.desktop !== undefined;
    if (stripped) provideStripActions();

    /** The float this page draws alone in a popped-out window of the app, or null. */
    const floatId = client.float;

    /** The area the page's tree fills, which a float let go beside it docks on. */
    let area: HTMLElement | undefined = $state();

    let paletteOpen = $state(false);
    let paletteStart = $state<PaletteStart>({ text: '', files: false, line: false });
    let paletteQuery = $state('');
    let updateOpen = $state(false);
    let handledUpdateRequest = $state(updateTrayRequested());
    let handledPaletteRequest = $state(paletteRequested().seq);

    /** The maximised pane, when one is, which the keys move the card cursor in. */
    const focus = $derived(focused());
    const activeMain = $derived(activeInstance());
    /** The active tab of the area the page draws: its float's in a popped-out window. */
    const pageTab = () => pageActiveTab(floatId, floats(), activeMain);
    /** The engine documents the rail pages' arrangements show, then the `docs:` entries. */
    const listedDocs = $derived([
        ...pages.flatMap((one) => arrangedDocs(one.page, one.node)),
        ...docs
    ]);
    const navigation = $derived(
        railOrder(
            views().filter((view) => view.listed !== false),
            groups,
            directChord,
            listedDocs
        )
    );
    const keyboard = createWorkbenchKeys({
        drag: client.drag,
        layout: client.layout,
        history: walk,
        ui: client.ui,
        navigation: () => navigation,
        activeTab: pageTab,
        focus: () => focus,
        paletteOpen: () => paletteOpen,
        paletteMode: () => (paletteOpen ? modeOf(paletteQuery, paletteStart.files) : null),
        updateOpen: () => updateOpen,
        setPaletteOpen: (open) => (paletteOpen = open),
        setUpdateOpen: (open) => (updateOpen = open),
        openDoc: (id, at) => {
            const entry = listedDocs.find((one) => docState(one).id === id);
            if (entry === undefined) return;
            void client.selectors.engineAtSettled().then((engineAt) => {
                const held = heldDocState(
                    entry,
                    engineAt,
                    (tab) => client.layout.heldInstance('doc', tab) !== null
                );
                client.layout.openView('doc', held ?? docState(entry), at, { held: true });
            });
        },
        composeIn: (page) => client.terminals.composeIn(page),
        focusSearchBox: (id, box) => client.search.wantFocus(id, box),
        runDefault: (which) => void client.commands.runDefault(which),
        debugging: () => client.debug.active(),
        ...sourceKeys(client, pageTab),
        debugKey: (which) => pressDebug(client.debug, which),
        walkProblem: (by) => walkProblem(by),
        mac: onMac(),
        app: client.desktop !== undefined,
        find: () => client.desktop?.bridge.showFind(),
        railPage: (index) => {
            const entry = pages.at(index - 1);
            if (index < 1 || entry === undefined) return false;
            return client.layout.openRailPage(entry.page, entry.label, entry.node);
        },
        openPalette: (prefill) => openPalette(prefill),
        showPalette: (key) => showPalette(key)
    });

    useMenuCommands(client, {
        covered: keyboard.covered,
        act: keyboard.act,
        openPalette: (prefill, files, line) => openPalette(prefill, files, line),
        openUpdate: () => openUpdate(),
        saveAll: () => saveAll(),
        tab: pageTab
    });

    // A browser with no saved layout starts on the first rail page rather than on a page no button
    // owns. The rail list comes with the config push, so this waits for it; the store answers only
    // while its pages are still the untouched default.
    $effect(() => {
        if (!configured || floatId !== null) return;
        const first = pages.at(0);
        if (first !== undefined) {
            client.layout.startOnRailPage(first.page, first.label, first.node, shipped);
        } else client.layout.keepDefaultPage(shipped);
    });

    // A page of the rail, saved or adopted by its button, is given each of the hub's documents it
    // lacks, once, as a tab.
    $effect(() => {
        if (!configured || floatId !== null) return;
        client.layout.giveDocuments(pages.map(({ page, docs }) => ({ page, docs })));
    });

    // The files this page's source tabs hold open are told to the language server relay, which
    // tells another page a rename or a code action names one of them (state/system/machine/lsp/).
    $effect(() => {
        client.lspEdits.publish();
    });

    $effect(() => {
        currentPage();
        keyboard.syncCards();
        return keyboard.stopCards;
    });

    function openPalette(prefill: string, files = false, line = false): void {
        keyboard.clearCursor();
        updateOpen = false;
        paletteStart = { text: prefill, files, line };
        paletteOpen = true;
    }

    /** Open the palette in the mode a palette key names: the commands, or the files. */
    const showPalette = (key: PaletteKey): void =>
        key === 'commands' ? openPalette(':') : openPalette('', true);

    // F1 arrives as a keydown, its Monaco binding being freed; the editor's menu item raises this.
    $effect(() => {
        const open = (): void => showPalette('commands');
        window.addEventListener(COMMAND_PALETTE_EVENT, open);
        return () => window.removeEventListener(COMMAND_PALETTE_EVENT, open);
    });

    // Cmd+K Shift+Enter in the editor raises this, and pins or unpins the tab on screen.
    $effect(() => {
        const pin = (): void => {
            const tab = activeInstance();
            if (tab === null) return;
            if (tab.pinned === true) client.layout.unpinTab(tab.id);
            else client.layout.pinTab(tab.id);
        };
        window.addEventListener(PIN_EDITOR_EVENT, pin);
        return () => window.removeEventListener(PIN_EDITOR_EVENT, pin);
    });

    function openUpdate(): void {
        keyboard.clearCursor();
        paletteOpen = false;
        updateOpen = true;
    }

    /** A view requests the shell-owned tray by changing the ui store's transient counter. */
    $effect(() => {
        const requested = updateTrayRequested();
        if (requested === handledUpdateRequest) return;
        handledUpdateRequest = requested;
        openUpdate();
    });

    /** A view requests the palette with a text typed in it, as the Files view's menu does. */
    $effect(() => {
        const asked = paletteRequested();
        if (asked.seq === handledPaletteRequest) return;
        handledPaletteRequest = asked.seq;
        openPalette(asked.text);
    });

    const appearance = useAppearance(client, () => appThemes);
    useAppLanguages(client);
    const wall = $derived(appearance.wall());
    const image = $derived(appearance.image());

    /**
     * A tab in the background still says a session wants the user: the document title carries the
     * count of sessions with an open permission prompt, so switching tabs is not the only way to
     * notice. A popped-out window's page names its float's active tab, the words its strip draws.
     */
    $effect(() => {
        const tab = pageActiveTab(floatId, floats(), activeMain);
        document.title = windowTitle(waiting, activeLabel(client.registry, tab));
    });
</script>

<svelte:window
    onkeydown={keyboard.keys}
    onfocusin={keyboard.paneFocused}
    onblur={keyboard.frameFocused}
    onpointerdown={keyboard.panePressed}
/>

{#if floatId !== null}
    {#if client.layout.loaded()}
        <FloatWindow id={floatId} onpalette={openPalette} />
        <!-- The window has no status bar, so the bell is mounted undrawn to show the toasts of what
         the float's own actions say: a build that failed, a jump no main window could take. -->
        <Bell drawn={false} />
    {/if}
{:else}
    <div class="workbench" class:stripless={!stripped}>
        {#if wall}
            <!-- Behind everything the workbench draws, and behind nothing else: a fixed layer at a
             negative depth paints over the page's own background and under every panel. -->
            <div class="wallpaper" style={image}></div>
        {/if}
        {#if stripped}
            <TitleBar onpalette={openPalette} />
        {/if}
        <div class="body" style={bodyTracks(shownFloats())}>
            <ActivityRail {pages} {editRail} onupdate={openUpdate} />
            <div class="column">
                <PageArea bind:area onpalette={openPalette} />
            </div>
            <FloatLayer {area} onpalette={openPalette} />
        </div>
        <StatusBar
            {status}
            {git}
            onpalette={openPalette}
            ongoto={() => openPalette(':', false, true)}
        />
    </div>
{/if}
<FrameLayer {frames} />
<DropLayer />
<Palette
    open={paletteOpen}
    start={paletteStart}
    bind:query={paletteQuery}
    onclose={() => (paletteOpen = false)}
    onupdate={openUpdate}
/>
<UpdateTray open={updateOpen} onclose={() => (updateOpen = false)} />
<Asks />
<DebugToolbar />

<style>
    /* The title bar strip over the rail and the column beside it over the status bar, the strip
       and the bar each running the window's whole width, as VS Code's title bar and status bar run
       above and under its activity bar. */
    .workbench {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100vh;
        overflow: hidden;
    }

    /* A page in a browser draws no strip, so a free float may reach the window's top. */
    .workbench.stripless {
        --titlebar-height: 0px;
    }

    /* The rail, the left dock, the area, the right dock across, and the area over the bottom dock
       down; the tracks come from the floats docked (float-geometry's bodyTracks). */
    .body {
        display: grid;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }

    .body > :global([data-rail]) {
        grid-column: 1;
        grid-row: 1 / -1;
    }

    .wallpaper {
        position: fixed;
        inset: 0;
        z-index: -1;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        filter: brightness(var(--wall-dim, 1)) blur(var(--wall-image-blur, 0px));
        pointer-events: none;
    }

    /* The column right of the rail: the area the page's tree fills (panes/leaf/PageArea.svelte). */
    .column {
        display: flex;
        flex-direction: column;
        grid-column: 3;
        grid-row: 1;
        min-width: 0;
        min-height: 0;
    }
</style>
