<script lang="ts">
    // Layer 3, shell. The one float a popped-out window of the desktop app draws, filling the
    // window under the window's title bar strip: the page behind that window is the server's page
    // with `?float=<id>` and shows this float and nothing else, with no rail and no status bar. The
    // strip (titlebar/TitleBar.svelte) carries the float's own title, the words of its active tab,
    // in its middle and no dock toggles, and its Back and Forward walk the history of this window
    // alone. The float is a PaneView of its one pane with the float's id as its page, as FloatLayer
    // draws it, so the tab strip, the menus, the keyboard and the drops reach it as they reach any
    // pane. A browser tab opened for the float draws no strip, as no page in a browser does, and
    // its float fills the tab. The float's window is closed when the float stops being one placed
    // in a window: it was returned to a page, docked, freed or closed elsewhere. In the app the
    // host closes it; a browser tab opened for the float closes itself.

    import { useState } from '$lib/state/client/use';
    import TitleBar from '$lib/shell/titlebar/TitleBar.svelte';
    import PaneView from '../PaneView.svelte';
    import { activeLabel, pageActiveTab } from '../workbench-title';

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

    /** The window's title: the words of the float's active tab. */
    const title = $derived(activeLabel(client.registry, pageActiveTab(id, floats(), null)));

    $effect(() => {
        if (float?.place.kind === 'window') return;
        if (client.desktop === undefined) window.close();
        else client.desktop.bridge.closeSelf();
    });
</script>

{#if float !== undefined}
    <div class="window" data-float-window={id}>
        {#if client.desktop !== undefined}
            <TitleBar {title} {onpalette} />
        {/if}
        <div class="fill">
            <PaneView node={float.pane} path={[]} page={float.id} {onpalette} />
        </div>
    </div>
{/if}

<style>
    .window {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100vh;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        background: var(--panel);
    }

    .fill {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }
</style>
