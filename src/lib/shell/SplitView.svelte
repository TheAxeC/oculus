<script lang="ts">
    // Layer 3, shell. Renders a layout tree: a split becomes a flex box in its direction with a
    // sash between neighbours, a pane becomes whatever snippet the caller passes. It knows no view
    // and no registry, and it holds no state: the tree comes in as a prop and a resize goes out as
    // a call, so the store belongs to the caller and this component can be rendered from a test.
    //
    // The sizes are fractions, so a child's flex is `<size> 1 0`: basis zero and grow by the
    // fraction shares the free space in exactly that proportion. The free space is the container
    // minus the sashes, which is why the handle's thickness comes from Sash rather than from a
    // second copy of the number here.

    import type { Snippet } from 'svelte';
    import Sash from '$lib/ui/Sash.svelte';
    import { SASH_PX } from '$lib/ui/sash-size';
    import { equalSizes, type Layout } from '$lib/state/layout';
    import SplitView from './SplitView.svelte';

    type Props = {
        /** The node to render. */
        layout: Layout;
        /** The path of this node from the root of the tree the caller holds. */
        path?: number[];
        /** How a pane is drawn: the tab strip, the mounted view, or a box with its path. */
        pane: Snippet<[Layout, number[]]>;
        /** A drag or a reset asks for these sizes on the split at this path. */
        onresize: (path: number[], sizes: number[]) => void;
    };

    let { layout, path = [], pane, onresize }: Props = $props();

    let box: HTMLDivElement | undefined = $state();

    /** The space the children actually share along the split's direction, in pixels. */
    function free(node: Extract<Layout, { kind: 'split' }>): number {
        if (box === undefined) return 0;
        const rect = box.getBoundingClientRect();
        const whole = node.dir === 'row' ? rect.width : rect.height;
        return whole - SASH_PX * (node.children.length - 1);
    }

    /** The sash before child `at` moved `delta` pixels: the two children it separates trade shares. */
    function moved(at: number, delta: number): void {
        if (layout.kind !== 'split') return;
        const room = free(layout);
        if (room <= 0) return;
        const fraction = delta / room;
        const sizes = layout.sizes.map((size, index) => {
            if (index === at - 1) return size + fraction;
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
            {#if index > 0}
                <Sash
                    dir={layout.dir}
                    share={layout.sizes[index - 1]}
                    onresize={(delta: number) => moved(index, delta)}
                    onreset={reset}
                />
            {/if}
            <div class="child" style="flex: {layout.sizes[index]} 1 0">
                <SplitView layout={child} path={[...path, index]} {pane} {onresize} />
            </div>
        {/each}
    </div>
{:else}
    {@render pane(layout, path)}
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
</style>
