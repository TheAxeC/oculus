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

    import ActivityRail, { type NavGroup } from './ActivityRail.svelte';
    import DropLayer from './DropLayer.svelte';
    import PaneView from './PaneView.svelte';
    import SplitView from './SplitView.svelte';
    import Sash, { SASH_PX } from '$lib/ui/Sash.svelte';
    import { WALL_CLASS, applyTheme, applyWallpaper } from '$lib/ui/theme';
    import {
        change,
        dockedAt,
        focused,
        layout,
        panelSize,
        resizePanel,
        restorePanes
    } from '$lib/state/layout.svelte';
    import { dragging } from '$lib/state/drag.svelte';
    import { crt, theme, unicode, wallpaper } from '$lib/state/ui.svelte';
    import { PANEL_DEFAULT, paneAt, resize, type Layout } from '$lib/state/layout';
    import { setGlyphMode, t } from '$lib/state/text';
    import {
        terminalTheme,
        themeClass,
        wallpaperOnTheme,
        wallpaperSettings
    } from '$lib/state/appearance';

    type Props = {
        /** The `nav_groups`-shaped list from the merged config, for the rail. */
        groups?: NavGroup[];
    };

    let { groups = [] }: Props = $props();

    let area: HTMLDivElement | undefined = $state(undefined);

    const dock = $derived(dockedAt());
    const share = $derived(panelSize());
    /** The panel sits under the main area when it is docked at the bottom, and beside it otherwise. */
    const direction = $derived<'row' | 'col'>(dock === 'bottom' ? 'col' : 'row');

    /** The maximised pane, when one is: it is drawn alone and the rest of the workbench is not drawn. */
    const focus = $derived(focused());
    const zoomed = $derived(focus === null ? null : paneAt(layout(focus.target), focus.path));

    /**
     * Escape restores the arrangement. A drag in progress consumes its own Escape on the document,
     * where the drag store's listener calls preventDefault, so the two never both act on one press.
     */
    function keys(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        if (dragging() !== null || focus === null) return;
        event.preventDefault();
        restorePanes();
    }

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
        applyTheme(document, [themeClass(theme()), wall ? WALL_CLASS : ''].join(' '), crt());
        applyWallpaper(document, paper, wall);
        // The terminal palettes draw the ASCII stand-ins unless the viewer asked for the real
        // glyphs; every other theme draws what config/glyphs.yml names.
        setGlyphMode(terminalTheme(theme()) && !unicode() ? 'ascii' : 'unicode');
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

<svelte:window onkeydown={keys} />

<div class="workbench">
    {#if wall}
        <!-- Behind everything the workbench draws, and behind nothing else: a fixed layer at a
             negative depth paints over the page's own background and under every panel. -->
        <div class="wallpaper" style={image}></div>
    {/if}
    <ActivityRail {groups} />
    <div class="area {direction}" bind:this={area}>
        {#if zoomed !== null && focus !== null}
            <div class="tree" style="flex: 1 1 0">
                <PaneView node={zoomed} target={focus.target} path={focus.path} />
            </div>
        {:else}
            <div class="tree" style="flex: {dock === 'hidden' ? 1 : 1 - share} 1 0">
                <SplitView
                    layout={layout('main')}
                    pane={mainPane}
                    onresize={(path, sizes) => change('main', (tree) => resize(tree, path, sizes))}
                />
            </div>
            {#if dock !== 'hidden'}
                <Sash
                    dir={direction}
                    share={1 - share}
                    onresize={panelMoved}
                    onreset={() => resizePanel(PANEL_DEFAULT)}
                />
                <section class="tree panel" style="flex: {share} 1 0" aria-label={t('ui.panel')}>
                    <SplitView
                        layout={layout('panel')}
                        pane={panelPane}
                        onresize={(path, sizes) =>
                            change('panel', (tree) => resize(tree, path, sizes))}
                    />
                </section>
            {/if}
        {/if}
    </div>
</div>
<DropLayer />

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
