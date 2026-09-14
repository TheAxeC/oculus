<script module lang="ts">
    // Layer 3, shell. The pure document-title builder keeps its DOM-free string contract testable.

    import { t as catalogText } from '$lib/state/text';
    import { registrationLabel, viewFor } from '$lib/views/registry';
    import type { Instance } from '$lib/state/layout';

    /** The words on the active main tab, including the per-instance label when it has one. */
    export function activeLabel(instance: Instance | null): string {
        if (instance === null) return catalogText('app.title');
        if (typeof instance.state === 'object' && instance.state !== null) {
            const held = (instance.state as Record<string, unknown>).label;
            if (typeof held === 'string' && held !== '') return held;
        }
        const registered = viewFor(instance.view);
        return registered === undefined
            ? catalogText('ui.unknown_view', instance.view)
            : registrationLabel(registered);
    }

    /** The active main tab title, with a waiting count in front when a session needs attention. */
    export function windowTitle(waiting: number, label: string): string {
        const active = catalogText('app.nav.title_fmt', catalogText('app.nav.host'), label);
        return waiting > 0 ? catalogText('app.title_waiting', waiting, active) : active;
    }
</script>

<script lang="ts">
    // Layer 3, shell. The page: the rail, the main tree, and the panel beside or below it. It reads
    // the arrangement from the store and every change goes back through the store, so the whole of
    // what is on screen is the saved workbench and a reload puts it back as it was.
    //
    // The panel is a second tree rather than a pane, so it splits exactly as the main area does.
    // Between them is the one sash the trees do not own, which trades the panel's share of the
    // window against the main area's.
    //
    // It is also where the appearance is put on the document, in one effect: the theme's class and
    // its derived tokens, the wallpaper's layer and the properties its translucent surfaces read,
    // and which of the two glyph vocabularies renders.

    import ActivityRail, { railOrder, type Bookmark, type NavGroup } from './ActivityRail.svelte';
    import DropLayer from './DropLayer.svelte';
    import { createWorkbenchKeys } from './workbench-keys.svelte';
    import PageStrip, { type Arrangement } from './PageStrip.svelte';
    import Palette from './Palette.svelte';
    import PaneView from './PaneView.svelte';
    import SplitView from './SplitView.svelte';
    import UpdateTray from './UpdateTray.svelte';
    import KeySheet from '$lib/ui/KeySheet.svelte';
    import Sash, { SASH_PX } from '$lib/ui/Sash.svelte';
    import { WALL_CLASS, applyTheme, applyWallpaper } from '$lib/ui/theme';
    import {
        change,
        activeInstance,
        currentPage,
        dockedAt,
        focused,
        layout,
        panelSize,
        resizePanel
    } from '$lib/state/layout.svelte';
    import {
        crt,
        textScale,
        theme,
        unicode,
        updateTrayRequested,
        wallpaper
    } from '$lib/state/ui.svelte';
    import { PANEL_DEFAULT, paneAt, resize, type Layout } from '$lib/state/layout';
    import { setGlyphMode, t } from '$lib/state/text';
    import { views } from '$lib/views/registry';
    import {
        terminalTheme,
        themeClass,
        wallpaperOnTheme,
        wallpaperSettings
    } from '$lib/state/appearance';

    type Props = {
        /** The `nav_groups`-shaped list from the merged config, for the rail. */
        groups?: NavGroup[];
        /** The `bookmarks` list of the merged config, for the rail's Docs section. */
        bookmarks?: Bookmark[];
        /** The `arrangements:` of the merged config, for the page strip's menu. */
        arrangements?: Arrangement[];
        /**
         * How many sessions wait on a permission, for the document title. The page reads it from
         * the sessions channel and hands it on, since the shell may not read entities itself.
         */
        waiting?: number;
    };

    let { groups = [], bookmarks = [], arrangements = [], waiting = 0 }: Props = $props();

    let area: HTMLDivElement | undefined = $state(undefined);
    let paletteOpen = $state(false);
    let palettePrefill = $state('');
    let updateOpen = $state(false);
    let sheetOpen = $state(false);
    let handledUpdateRequest = $state(updateTrayRequested());

    const dock = $derived(dockedAt());
    const share = $derived(panelSize());
    /** The panel sits under the main area when it is docked at the bottom, and beside it otherwise. */
    const direction = $derived<'row' | 'col'>(dock === 'bottom' ? 'col' : 'row');

    /** The maximised pane, when one is: it is drawn alone and the rest of the workbench is not drawn. */
    const focus = $derived(focused());
    const zoomed = $derived(focus === null ? null : paneAt(layout(focus.target), focus.path));

    /** The page on screen: its trees are the ones drawn, and its id is what remounts them. */
    const page = $derived(currentPage());
    const activeMain = $derived(activeInstance('main'));
    const navigation = $derived(
        railOrder(
            views().filter((view) => view.listed !== false),
            groups
        )
    );
    const keyboard = createWorkbenchKeys({
        navigation: () => navigation,
        activeMain: () => activeMain,
        focus: () => focus,
        paletteOpen: () => paletteOpen,
        updateOpen: () => updateOpen,
        sheetOpen: () => sheetOpen,
        setPaletteOpen: (open) => (paletteOpen = open),
        setUpdateOpen: (open) => (updateOpen = open),
        setSheetOpen: (open) => (sheetOpen = open),
        openPalette: (prefill) => openPalette(prefill)
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
        // The terminal palettes draw the ASCII stand-ins unless the viewer asked for the real
        // glyphs; every other theme draws what config/glyphs.yml names.
        setGlyphMode(terminalTheme(theme()) && !unicode() ? 'ascii' : 'unicode');
    });

    /**
     * A tab in the background still says a session wants Axel: the document title carries the count
     * of sessions with an open permission prompt, so switching tabs is not the only way to notice.
     */
    $effect(() => {
        document.title = windowTitle(waiting, activeLabel(activeMain));
    });

    /** The space the two trees share along the dock's direction, the sash between them removed. */
    function room(): number {
        if (area === undefined) return 0;
        const rect = area.getBoundingClientRect();
        return (direction === 'row' ? rect.width : rect.height) - SASH_PX;
    }

    function panelMoved(delta: number): void {
        const free = room();
        if (free <= 0) return;
        resizePanel(share - delta / free);
    }
</script>

{#snippet mainPane(node: Layout, path: number[])}
    <PaneView {node} target="main" {path} />
{/snippet}

{#snippet panelPane(node: Layout, path: number[])}
    <PaneView {node} target="panel" {path} />
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
    <ActivityRail {groups} {bookmarks} onsearch={() => openPalette('')} onupdate={openUpdate} />
    <div class="column">
        <PageStrip {arrangements} />
        <div class="area {direction}" bind:this={area}>
            <!-- Keyed by the page, so a switch unmounts the hidden page's views and mounts the
                 shown page's: nothing is drawn twice, and every view rebuilds from the stores. -->
            {#key page.id}
                {#if zoomed !== null && focus !== null}
                    <div class="tree" style="flex: 1 1 0">
                        <PaneView node={zoomed} target={focus.target} path={focus.path} />
                    </div>
                {:else}
                    <div class="tree" style="flex: {dock === 'hidden' ? 1 : 1 - share} 1 0">
                        <SplitView
                            layout={layout('main')}
                            pane={mainPane}
                            onresize={(path, sizes) =>
                                change('main', (tree) => resize(tree, path, sizes))}
                        />
                    </div>
                    {#if dock !== 'hidden'}
                        <Sash
                            dir={direction}
                            share={1 - share}
                            onresize={panelMoved}
                            onreset={() => resizePanel(PANEL_DEFAULT)}
                        />
                        <section
                            class="tree panel"
                            style="flex: {share} 1 0"
                            aria-label={t('ui.panel')}
                        >
                            <SplitView
                                layout={layout('panel')}
                                pane={panelPane}
                                onresize={(path, sizes) =>
                                    change('panel', (tree) => resize(tree, path, sizes))}
                            />
                        </section>
                    {/if}
                {/if}
            {/key}
        </div>
    </div>
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
    .workbench {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100vh;
        overflow: hidden;
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

    /* The column right of the rail: the page strip over the area the two trees share. */
    .column {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }

    .area {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        padding: 4px;
        gap: 0;
        box-sizing: border-box;
    }

    .area.row {
        flex-direction: row;
    }

    .area.col {
        flex-direction: column;
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
