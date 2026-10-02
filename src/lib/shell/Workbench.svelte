<script lang="ts">
    // Layer 3, shell. The window: the rail, the one tree the page on screen is, and the status bar
    // along the foot under both. It reads the arrangement from the store and every change goes back
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
    // It is also where the appearance is put on the document, in one effect: the theme's class and
    // its derived tokens, the wallpaper's layer and the properties its translucent surfaces read,
    // and which of the two glyph vocabularies renders.

    import { activeLabel, windowTitle } from '$lib/shell/panes/workbench-title';
    import ActivityRail from './rail/ActivityRail.svelte';
    import type { Bookmark } from './rail/rail';
    import DropLayer from './panes/DropLayer.svelte';
    import { createWorkbenchKeys } from './keys/workbench-keys.svelte';
    import Palette from './keys/Palette.svelte';
    import FoldedPane from './panes/FoldedPane.svelte';
    import PageLeaf from './panes/PageLeaf.svelte';
    import PaneView from './panes/PaneView.svelte';
    import FloatLayer from './panes/floats/FloatLayer.svelte';
    import { bodyTracks } from './panes/floats/float-geometry';
    import SplitView from './panes/SplitView.svelte';
    import UpdateTray from './rail/UpdateTray.svelte';
    import KeySheet from '$lib/ui/menu/keys/KeySheet.svelte';
    import { WALL_CLASS, applyTheme, applyWallpaper } from '$lib/ui/theme';
    import { paneAt, resize, type FloatSpec, type Layout } from '$lib/state/workbench/layout';
    import {
        docState,
        railOrder,
        type DocEntry,
        type NavGroup
    } from '$lib/state/workbench/navigation/catalogue';
    import type { RailEntry, RailPage } from '$lib/state/workbench/navigation/rail';
    import {
        NO_GIT,
        NO_STATUS,
        type StatusGit,
        type StatusWords
    } from '$lib/state/workbench/navigation/status';
    import StatusBar from './status/StatusBar.svelte';
    import { setGlyphMode, t } from '$lib/state/shared/words/text';
    import {
        terminalTheme,
        themeClass,
        wallpaperOnTheme,
        wallpaperSettings
    } from '$lib/state/shared/words/appearance';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        layout: { change, activeInstance, currentPage, expandChild, floats, focused, layout },
        ui: { crt, icons, textScale, theme, updateTrayRequested, wallpaper },
        registry: { views }
    } = client;

    type Props = {
        /** The `nav_groups` of the merged config, which the chords count into. */
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
         * The reader's own bookmarks, for the rail's Bookmarks menu. The page reads them off the
         * fs store and hands them on, since the shell may not read that store itself.
         */
        saved?: Bookmark[];
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
         * the repository, the findings, the HPC poll, the usage, the server and the live sessions.
         * The page makes them and hands them on.
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
    };

    let {
        groups = [],
        docs = [],
        pages = [],
        floats: shipped = [],
        configured = true,
        saved = [],
        editRail,
        directChord,
        status = NO_STATUS,
        git = NO_GIT,
        waiting = 0
    }: Props = $props();

    /** The area the page's tree fills, which a float let go beside it docks on. */
    let area: HTMLElement | undefined = $state();

    let paletteOpen = $state(false);
    let palettePrefill = $state('');
    let updateOpen = $state(false);
    let sheetOpen = $state(false);
    let handledUpdateRequest = $state(updateTrayRequested());

    /**
     * The maximised pane, when one is: it is drawn alone and the rest of the workbench is not
     * drawn.
     */
    const focus = $derived(focused());
    const zoomed = $derived(focus === null ? null : paneAt(layout(), focus.path));

    /** The page on screen: its trees are the ones drawn, and its id is what remounts them. */
    const page = $derived(currentPage());
    const activeMain = $derived(activeInstance());
    const navigation = $derived(
        railOrder(
            views().filter((view) => view.listed !== false),
            groups,
            directChord,
            docs
        )
    );
    const keyboard = createWorkbenchKeys({
        drag: client.drag,
        layout: client.layout,
        ui: client.ui,
        navigation: () => navigation,
        activeMain: () => activeMain,
        focus: () => focus,
        paletteOpen: () => paletteOpen,
        updateOpen: () => updateOpen,
        sheetOpen: () => sheetOpen,
        setPaletteOpen: (open) => (paletteOpen = open),
        setUpdateOpen: (open) => (updateOpen = open),
        setSheetOpen: (open) => (sheetOpen = open),
        openDoc: (path, at) => {
            const entry = docs.find((one) => one.path === path);
            if (entry !== undefined) client.layout.openView('doc', docState(entry), at);
        },
        composeIn: (page) => client.terminals.composeIn(page),
        railPage: (index) => {
            const entry = pages.at(index - 1);
            if (index < 1 || entry === undefined) return false;
            return client.layout.openRailPage(entry.page, entry.label, entry.node);
        },
        openPalette: (prefill) => openPalette(prefill)
    });

    // A browser with no saved layout starts on the first rail page rather than on a page no button
    // owns. The rail list comes with the config push, so this waits for it; the store answers only
    // while its pages are still the untouched default.
    $effect(() => {
        if (!configured) return;
        const first = pages.at(0);
        if (first !== undefined) {
            client.layout.startOnRailPage(first.page, first.label, first.node, shipped);
        } else client.layout.keepDefaultPage(shipped);
        client.layout.adoptFloats(shipped);
    });

    $effect(() => {
        currentPage();
        keyboard.syncCards();
        return keyboard.stopCards;
    });

    function openPalette(prefill: string): void {
        keyboard.clearCursor();
        sheetOpen = false;
        updateOpen = false;
        palettePrefill = prefill;
        paletteOpen = true;
    }

    function openUpdate(): void {
        keyboard.clearCursor();
        sheetOpen = false;
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

    /** The wallpaper is drawn when the viewer wants one and the theme is one it shows under. */
    const wall = $derived(wallpaper() && wallpaperOnTheme(theme()));
    const paper = $derived(wallpaperSettings());

    /**
     * The image's own two numbers, as the properties its layer's filter reads: the dim is how much
     * light is taken out of the picture, so the brightness left is what the filter wants.
     */
    const image = $derived(
        `--wall-dim: ${paper === null ? 1 : 1 - paper.dim}; --wall-image-blur: ${paper === null ? 0 : paper.blur}px`
    );

    $effect(() => {
        document.documentElement.style.setProperty('--text-scale', String(textScale() ?? 1));
        applyTheme(document, [themeClass(theme()), wall ? WALL_CLASS : ''].join(' '), crt());
        applyWallpaper(document, paper, wall);
        // The terminal palettes draw the ASCII stand-ins unless the viewer asked for the icons;
        // every other theme draws the icon config/catalogs/icons.yml maps each glyph name to.
        setGlyphMode(terminalTheme(theme()) && !icons() ? 'ascii' : 'icon');
    });

    /**
     * A tab in the background still says a session wants Axel: the document title carries the count
     * of sessions with an open permission prompt, so switching tabs is not the only way to notice.
     */
    $effect(() => {
        document.title = windowTitle(waiting, activeLabel(client.registry, activeMain));
    });
</script>

{#snippet paneOf(node: Layout, path: number[], of: string)}
    <PaneView {node} {path} page={of} onpalette={openPalette} />
{/snippet}

{#snippet foldOf(node: Layout, dir: 'row' | 'col', onexpand: () => void)}
    <FoldedPane {node} {dir} {onexpand} />
{/snippet}

{#snippet leafOf(nested: string, path: number[], of: string)}
    <PageLeaf {nested} {path} host={of} onpalette={openPalette} />
{/snippet}

<svelte:window
    onkeydown={keyboard.keys}
    onfocusin={keyboard.paneFocused}
    onpointerdown={keyboard.panePressed}
/>

<div class="workbench">
    {#if wall}
        <!-- Behind everything the workbench draws, and behind nothing else: a fixed layer at a
             negative depth paints over the page's own background and under every panel. -->
        <div class="wallpaper" style={image}></div>
    {/if}
    <div class="body" style={bodyTracks(floats())}>
        <ActivityRail
            {pages}
            {saved}
            {editRail}
            onsearch={() => openPalette('')}
            onupdate={openUpdate}
        />
        <div class="column">
            <div class="area" bind:this={area}>
                <!-- Keyed by the page, so a switch unmounts the hidden page's views and mounts
                     the shown page's: nothing is drawn twice, and every view rebuilds from the
                     stores. -->
                {#key page.id}
                    {#if client.layout.startingFresh()}
                        <!-- No page until the rail list chose the first, so no view mounts
                             twice. -->
                    {:else if zoomed !== null && focus !== null}
                        <div class="tree" style="flex: 1 1 0">
                            <PaneView
                                node={zoomed}
                                path={focus.path}
                                page={page.id}
                                onpalette={openPalette}
                            />
                        </div>
                    {:else}
                        <div class="tree" style="flex: 1 1 0">
                            <SplitView
                                layout={layout()}
                                page={page.id}
                                pane={paneOf}
                                fold={foldOf}
                                leaf={leafOf}
                                onresize={(path: number[], sizes: number[]) =>
                                    change((tree) => resize(tree, path, sizes))}
                                onexpand={(path: number[], index: number) =>
                                    expandChild(path, index)}
                            />
                        </div>
                    {/if}
                {/key}
            </div>
        </div>
        <FloatLayer {area} onpalette={openPalette} />
    </div>
    <StatusBar {status} {git} onpalette={openPalette} />
</div>
<DropLayer />
<Palette
    open={paletteOpen}
    prefill={palettePrefill}
    onclose={() => (paletteOpen = false)}
    onupdate={openUpdate}
/>
<UpdateTray open={updateOpen} onclose={() => (updateOpen = false)} />
{#if sheetOpen}
    <KeySheet
        title={t('app.keys.title')}
        hint={t('app.keys.hint')}
        rows={t('app.keys.rows')}
        onclose={() => (sheetOpen = false)}
    />
{/if}

<style>
    /* The rail and the column beside it over the status bar, which runs the window's whole width
       under both, as VS Code's status bar runs under its activity bar. */
    .workbench {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100vh;
        overflow: hidden;
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
        background-image: url(/api/wallpaper);
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        filter: brightness(var(--wall-dim, 1)) blur(var(--wall-image-blur, 0px));
        pointer-events: none;
    }

    /* The column right of the rail: the area the page's tree fills. */
    .column {
        display: flex;
        flex-direction: column;
        grid-column: 3;
        grid-row: 1;
        min-width: 0;
        min-height: 0;
    }

    /* One stacking context for the page, so a depth a view sets inside it (Monaco's overview ruler
       and scrollbars) stays below the floats drawn over the page. */
    .area {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        padding: 4px;
        gap: 0;
        box-sizing: border-box;
        isolation: isolate;
    }

    .tree {
        display: flex;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    .tree > :global(*) {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }
</style>
