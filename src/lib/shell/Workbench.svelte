<script lang="ts">
    // Layer 3, shell. The page: the rail, the main tree, and the panel beside or below it. It reads
    // the arrangement from the store and every change goes back through the store, so the whole of
    // what is on screen is the saved workbench and a reload puts it back as it was.
    //
    // The panel is a second tree rather than a pane, so it splits exactly as the main area does.
    // Between them is the one sash the trees do not own, which trades the panel's share of the
    // window against the main area's.

    import ActivityRail, { type NavGroup } from './ActivityRail.svelte';
    import PaneView from './PaneView.svelte';
    import SplitView from './SplitView.svelte';
    import Sash, { SASH_PX } from '$lib/ui/Sash.svelte';
    import { applyTheme } from '$lib/ui/theme';
    import { change, dockedAt, layout, panelSize, resizePanel } from '$lib/state/layout.svelte';
    import { crt, theme } from '$lib/state/ui.svelte';
    import { PANEL_DEFAULT, resize, type Layout } from '$lib/state/layout';
    import { t, themeClass } from '$lib/state/text';

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

    $effect(() => {
        applyTheme(document, themeClass(theme()), crt());
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

{#snippet mainPane(node: Layout)}
    <PaneView {node} target="main" />
{/snippet}

{#snippet panelPane(node: Layout)}
    <PaneView {node} target="panel" />
{/snippet}

<div class="workbench">
    <ActivityRail {groups} />
    <div class="area {direction}" bind:this={area}>
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
                    onresize={(path, sizes) => change('panel', (tree) => resize(tree, path, sizes))}
                />
            </section>
        {/if}
    </div>
</div>

<style>
    .workbench {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100vh;
        overflow: hidden;
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
