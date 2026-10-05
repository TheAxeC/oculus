<script lang="ts">
    // A pane's place for a file view in a test: it provides the tab actions the way PaneView does,
    // hands the store back, and draws the view with its instance.

    import { untrack, type Component } from 'svelte';
    import {
        provideTabActions,
        type TabActions
    } from '../../../src/lib/ui/tabs/tab-actions.svelte.ts';
    import type { Instance } from '../../../src/lib/state/workbench/layout';

    type Props = {
        view: Component<{ instance: Instance }>;
        instance: Instance;
        onprovided: (actions: TabActions) => void;
    };

    let { view: View, instance, onprovided }: Props = $props();

    const provided = provideTabActions();
    untrack(() => onprovided(provided));
</script>

<View {instance} />
