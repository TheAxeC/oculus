<script lang="ts">
    // Layer 3, shell. Another page drawn at one spot of a page's tree: a header naming it and the
    // one control that stops showing it there, over that page's own tree. It is the same page and
    // never a copy, so it is read out of the store by id and every pane inside it addresses it,
    // which is what makes a tab opened there open on the page itself.
    //
    // A page shown here draws its own maximised pane when it has one, exactly as it does when the
    // strip is on it: the leaf draws that page's whole workbench and not only its tree.
    //
    // The header is also the leaf's own drop target. Everything below it belongs to the page shown,
    // whose panes report their own drops, so the one line at the top is where a tab or a page is
    // dropped to land beside the whole leaf in the host's tree. The edge is measured against the
    // header's own box, so its four sides are the leaf's four sides and its middle is the top.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FoldedPane from './FoldedPane.svelte';
    import PaneView from './PaneView.svelte';
    import SplitView from './SplitView.svelte';
    import PageLeaf from './PageLeaf.svelte';
    import { pageNameOf } from '$lib/state/workbench/navigation/pages';
    import { edgeAt } from '$lib/state/workbench/drag.svelte';
    import { paneAt, resize, showable, type Layout } from '$lib/state/workbench/layout';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { change, currentPage, expandChild, focused, layout, pageOf, pages, unembedPage },
        drag: { dragging, hover }
    } = useState();

    type Props = {
        /** The page shown here. */
        nested: string;
        /** Where the leaf sits in the host's tree, which is what taking it out again names. */
        path: number[];
        /** The page whose tree holds the leaf. */
        host: string;
        /** The palette's opener, handed to every pane of the page shown here. */
        onpalette?: (prefill: string) => void;
    };

    let { nested, path, host, onpalette }: Props = $props();

    let head: HTMLDivElement | undefined = $state();

    const page = $derived(pageOf(nested));
    const label = $derived(pageNameOf(pages(), nested));
    const focus = $derived(focused(nested));
    const zoomed = $derived(focus === null ? null : paneAt(layout(nested), focus.path));

    /**
     * The pointer over the header: which edge of the leaf a drop there would take, measured on the
     * header's own box so every side of it can be reached, the middle counting as the top.
     */
    function headHover(event: PointerEvent): void {
        const carried = dragging();
        if (carried === null || head === undefined) return;
        const rect = head.getBoundingClientRect();
        if (carried.kind === 'page' && !showable(pages(), currentPage().id, host, carried.id)) {
            hover(null, null, true);
            return;
        }
        const edge = edgeAt(rect, { x: event.clientX, y: event.clientY }) ?? 'top';
        hover({ kind: 'edge', path, edge, page: host }, rect);
    }

    function headLeave(): void {
        if (dragging() !== null) hover(null);
    }
</script>

{#snippet paneOf(node: Layout, at: number[], of: string)}
    <PaneView {node} path={at} page={of} {onpalette} />
{/snippet}

{#snippet foldOf(node: Layout, dir: 'row' | 'col', onexpand: () => void)}
    <FoldedPane {node} {dir} {onexpand} />
{/snippet}

{#snippet leafOf(inner: string, at: number[], of: string)}
    <PageLeaf nested={inner} path={at} host={of} {onpalette} />
{/snippet}

{#if page !== null}
    <div class="leaf" data-page-leaf={nested}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="head" bind:this={head} onpointermove={headHover} onpointerleave={headLeave}>
            <span class="name" data-page-leaf-label>{label}</span>
            <ToolButton
                label={t('ui.page_leaf_close')}
                glyph={t('ui.page_leaf_close_glyph')}
                compact
                onclick={() => unembedPage(path, host)}
            />
        </div>
        <div class="tree">
            {#if zoomed !== null && focus !== null}
                <PaneView node={zoomed} path={focus.path} page={nested} {onpalette} />
            {:else}
                <SplitView
                    layout={layout(nested)}
                    page={nested}
                    pane={paneOf}
                    fold={foldOf}
                    leaf={leafOf}
                    onresize={(at: number[], sizes: number[]) =>
                        change((tree) => resize(tree, at, sizes), nested)}
                    onexpand={(at: number[], index: number) => expandChild(at, index, nested)}
                />
            {/if}
        </div>
    </div>
{/if}

<style>
    .leaf {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-sizing: border-box;
        overflow: hidden;
    }

    /* One line over the page, so the reader can tell which page is being shown and stop showing
       it. */
    .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        flex: 0 0 auto;
        padding: 2px 4px;
        min-width: 0;
    }

    .name {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tree {
        display: flex;
        flex: 1 1 auto;
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
