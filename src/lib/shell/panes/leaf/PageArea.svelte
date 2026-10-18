<script lang="ts">
    // Layer 3, shell. The area of the window the page on screen fills: the page's tree, drawn with
    // its panes (PaneView), its folded children (FoldedPane) and the pages shown at its leaves
    // (PageLeaf), or the page's maximised pane alone while one is. The area is keyed by the page,
    // so a switch unmounts the hidden page's views and mounts the shown page's: nothing is drawn
    // twice, and every view rebuilds from the stores. Until the rail's list chose the first page of
    // a browser with no saved layout, the area draws no page, so no view mounts twice.
    //
    // A page that throws while it is drawn, outside the views its tabs draw (TabView.svelte catches
    // those), is caught here and the area says so with the error and a control that draws it
    // again, so the throw stops at the page: the rest of the window, the palette and the rail
    // among it, goes on, and a switch to another page draws that one.
    //
    // The area is one stacking context, so a depth a view sets inside it (Monaco's overview ruler
    // and scrollbars) stays below the floats drawn over the page. The workbench takes the area's
    // element, whose edges a float let go beside them docks on.

    import Failed from './Failed.svelte';
    import FoldedPane from './FoldedPane.svelte';
    import PageLeaf from './PageLeaf.svelte';
    import PaneView from '../PaneView.svelte';
    import SplitView from '../SplitView.svelte';
    import { paneAt, type Layout } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    const client = useState();
    const {
        layout: { currentPage, expandChild, focused, layout, resizeSplit }
    } = client;

    type Props = {
        /** The area's element, which the workbench reads a float's docking edges from. */
        area?: HTMLElement;
        /** Open the palette with a prefill, as a pane's strip menu opens it. */
        onpalette: (prefill: string) => void;
    };

    let { area = $bindable(), onpalette }: Props = $props();

    /**
     * The maximised pane, when one is: it is drawn alone and the rest of the page is not drawn.
     */
    const focus = $derived(focused());
    const zoomed = $derived(focus === null ? null : paneAt(layout(), focus.path));

    /** The page on screen: its trees are the ones drawn, and its id is what remounts them. */
    const page = $derived(currentPage());
</script>

{#snippet paneOf(node: Layout, path: number[], of: string)}
    <PaneView {node} {path} page={of} {onpalette} />
{/snippet}

{#snippet foldOf(node: Layout, dir: 'row' | 'col', onexpand: () => void)}
    <FoldedPane {node} {dir} {onexpand} />
{/snippet}

{#snippet leafOf(nested: string, path: number[], of: string)}
    <PageLeaf {nested} {path} host={of} {onpalette} />
{/snippet}

<div class="area" bind:this={area}>
    {#key page.id}
        <svelte:boundary onerror={(error: unknown) => console.error(error)}>
            {#if client.layout.startingFresh()}
                <!-- No page until the rail list chose the first. -->
            {:else if zoomed !== null && focus !== null}
                <div class="tree" style="flex: 1 1 0">
                    <PaneView node={zoomed} path={focus.path} page={page.id} {onpalette} />
                </div>
            {:else}
                <div class="tree" style="flex: 1 1 0">
                    <SplitView
                        layout={layout()}
                        page={page.id}
                        pane={paneOf}
                        fold={foldOf}
                        leaf={leafOf}
                        onresize={(path: number[], sizes: number[]) => resizeSplit(path, sizes)}
                        onexpand={(path: number[], index: number) => expandChild(path, index)}
                    />
                </div>
            {/if}
            {#snippet failed(error: unknown, reset: () => void)}
                <Failed {error} {reset} wording={(words: string) => t('app.page_failed', words)} />
            {/snippet}
        </svelte:boundary>
    {/key}
</div>

<style>
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
