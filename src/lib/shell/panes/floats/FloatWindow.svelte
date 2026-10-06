<script lang="ts">
    // Layer 3, shell. The one float a popped-out window of the desktop app draws, filling the
    // window: the page behind that window is the server's page with `?float=<id>` and shows this
    // float and nothing else, with no rail and no status bar. The float is a PaneView of its one
    // pane with the float's id as its page, as FloatLayer draws it, so the tab strip, the menus,
    // the keyboard and the drops reach it as they reach any pane. The float's window is closed when
    // the float stops being one placed in a window: it was returned to a page, docked, freed or
    // closed elsewhere.

    import { useState } from '$lib/state/client/use';
    import PaneView from '../PaneView.svelte';

    type Props = {
        /** The id of the float this window draws. */
        id: string;
        /** Open the palette with a prefill, as a pane's strip menu opens it. */
        onpalette?: (prefill: string) => void;
    };

    let { id, onpalette = () => undefined }: Props = $props();

    const client = useState();
    const {
        layout: { floats }
    } = client;

    const float = $derived(floats().find((one) => one.id === id));

    $effect(() => {
        if (float?.place.kind !== 'window') client.desktop?.bridge.closeSelf();
    });
</script>

{#if float !== undefined}
    <div class="window" data-float-window={id}>
        <PaneView node={float.pane} path={[]} page={float.id} {onpalette} />
    </div>
{/if}

<style>
    .window {
        display: flex;
        width: 100%;
        height: 100vh;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        background: var(--panel);
    }
</style>
