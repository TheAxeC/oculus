<script lang="ts">
    // Layer 3, shell. Renders a layout tree: a split becomes a flex box in its direction with a
    // sash between neighbours, a pane becomes whatever snippet the caller passes, another page
    // shown at a spot becomes the leaf snippet, and a child collapsed to the split's edge becomes
    // the fold snippet in a strip of a fixed thickness. It knows no view and no registry, and it
    // holds no state: the tree comes in as a prop and a resize or an expand goes out as a call, so
    // the store belongs to the caller and this component can be rendered from a test.
    //
    // The sizes are fractions, so a child's flex is `<share> 1 0`: basis zero and grow by the
    // share divides the free space in exactly that proportion. The share drawn is the child's size
    // over the sizes of the children that are open, so a folded child's size stays in the tree and
    // its space goes to its open neighbours rather than staying blank. The free space is the
    // container minus the sashes and the strips, which is why both thicknesses come from
    // ui/frame/sash-size rather than from a second copy of the numbers here.

    import type { Snippet } from 'svelte';
    import Sash from '$lib/ui/frame/Sash.svelte';
    import { FOLD_PX, SASH_PX } from '$lib/ui/frame/sash-size';
    import { equalSizes, foldedCount, isFolded, type Layout } from '$lib/state/workbench/layout';
    import SplitView from './SplitView.svelte';

    type Props = {
        /** The node to render. */
        layout: Layout;
        /** The id of the page whose tree this is, which every snippet is handed with the path. */
        page: string;
        /** The path of this node from the root of the tree the caller holds. */
        path?: number[];
        /** How a pane is drawn: the tab strip, the mounted view, or a box with its path. */
        pane: Snippet<[Layout, number[], string]>;
        /**
         * How a collapsed child is drawn: the node, the split's direction, and how to expand it.
         */
        fold: Snippet<[Layout, 'row' | 'col', () => void]>;
        /** How another page shown at this spot is drawn: the page it names, the path, the host. */
        leaf: Snippet<[string, number[], string]>;
        /** A drag or a reset asks for these sizes on the split at this path. */
        onresize: (path: number[], sizes: number[]) => void;
        /** The strip's control asks for this child of the split at this path to be shown again. */
        onexpand: (path: number[], index: number) => void;
    };

    let { layout, page, path = [], pane, fold, leaf, onresize, onexpand }: Props = $props();

    let box: HTMLDivElement | undefined = $state();

    /** The space the children actually share along the split's direction, in pixels. */
    function free(node: Extract<Layout, { kind: 'split' }>): number {
        if (box === undefined) return 0;
        const rect = box.getBoundingClientRect();
        const whole = node.dir === 'row' ? rect.width : rect.height;
        const collapsed = foldedCount(node);
        return whole - SASH_PX * sashes(node) - FOLD_PX * collapsed;
    }

    /**
     * The sizes of the children that are drawn, which is what a drawn share is measured against.
     */
    function openSum(node: Extract<Layout, { kind: 'split' }>): number {
        const total = node.children.reduce(
            (sum, _, index) => (isFolded(node, index) ? sum : sum + (node.sizes[index] ?? 0)),
            0
        );
        return total;
    }

    /**
     * The share of the free space one open child takes; equal shares when no open child has a size.
     */
    function drawn(node: Extract<Layout, { kind: 'split' }>, index: number): number {
        const total = openSum(node);
        if (total === 0) return 1 / Math.max(1, node.children.length - foldedCount(node));
        return (node.sizes[index] ?? 0) / total;
    }

    /** The nearest open child before `at`, or null when every child before it is collapsed. */
    function openBefore(node: Extract<Layout, { kind: 'split' }>, at: number): number | null {
        for (let index = at - 1; index >= 0; index -= 1) {
            if (!isFolded(node, index)) return index;
        }
        return null;
    }

    /**
     * How many handles a split draws: one before each open child that has an open child before it.
     */
    function sashes(node: Extract<Layout, { kind: 'split' }>): number {
        return node.children.filter((_, index) => index > 0 && separated(node, index)).length;
    }

    /**
     * Whether a handle is drawn before child `at`: a collapsed child gets none, and an open child
     * gets one when an open child lies before it, on the far side of any strip between them, so two
     * open children still trade space with a collapsed one between them.
     */
    function separated(node: Extract<Layout, { kind: 'split' }>, at: number): boolean {
        return !isFolded(node, at) && openBefore(node, at) !== null;
    }

    /**
     * The sash before child `at` moved `delta` pixels: the two open children it separates trade
     * shares. The pixels are a fraction of the space the open children share, so the size written
     * back is that fraction of their sizes; a fold changes what is drawn and not what is saved.
     */
    function moved(at: number, delta: number): void {
        if (layout.kind !== 'split') return;
        const room = free(layout);
        const before = openBefore(layout, at);
        if (room <= 0 || before === null) return;
        const fraction = (delta / room) * openSum(layout);
        const sizes = layout.sizes.map((size, index) => {
            if (index === before) return size + fraction;
            if (index === at) return size - fraction;
            return size;
        });
        onresize(path, sizes);
    }

    function reset(): void {
        if (layout.kind !== 'split') return;
        onresize(path, equalSizes(layout.children.length));
    }
</script>

{#if layout.kind === 'split'}
    <div class="split {layout.dir}" bind:this={box}>
        {#each layout.children as child, index (index)}
            {#if index > 0 && separated(layout, index)}
                <Sash
                    dir={layout.dir}
                    share={drawn(layout, openBefore(layout, index) ?? 0)}
                    onresize={(delta: number) => moved(index, delta)}
                    onreset={reset}
                />
            {/if}
            {#if isFolded(layout, index)}
                <div class="strip {layout.dir}" style="flex: 0 0 {FOLD_PX}px">
                    {@render fold(child, layout.dir, () => onexpand(path, index))}
                </div>
            {:else}
                <div class="child" style="flex: {drawn(layout, index)} 1 0">
                    <SplitView
                        layout={child}
                        {page}
                        path={[...path, index]}
                        {pane}
                        {fold}
                        {leaf}
                        {onresize}
                        {onexpand}
                    />
                </div>
            {/if}
        {/each}
    </div>
{:else if layout.kind === 'page'}
    {@render leaf(layout.page, path, page)}
{:else}
    {@render pane(layout, path, page)}
{/if}

<style>
    .split {
        display: flex;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    .split.row {
        flex-direction: row;
    }

    .split.col {
        flex-direction: column;
    }

    .child {
        display: flex;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    /* Whatever the pane snippet renders fills its share; the snippet is the caller's and cannot be
       given a class from here. */
    .child > :global(*) {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }

    /* A collapsed child takes its thickness and no more, along the split's direction. */
    .strip {
        display: flex;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    .strip > :global(*) {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }
</style>
