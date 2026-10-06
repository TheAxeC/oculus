<script lang="ts">
    // Layer 3, primitive. The place in a view where its frame shows. The frame is not drawn here:
    // it is one element in the workbench's frame layer (ui/tabs/tab-frames.svelte.ts), laid over
    // this box while the box is on screen, so drawing this box again does not load the frame's
    // document again. The box fills the room its parent leaves and holds nothing.

    import { useTabFrames } from './tab-frames.svelte';

    type Props = {
        /** The id of the tab whose frame shows here. */
        id: string;
    };

    let { id }: Props = $props();

    const frames = useTabFrames();
</script>

<div
    class="frame-place"
    data-frame-slot={id}
    {@attach (node: HTMLElement) => frames?.slot(id, node)}
></div>

<style>
    .frame-place {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }
</style>
