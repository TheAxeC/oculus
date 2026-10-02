<script lang="ts">
    // Layer 4, test helper. A view that draws what useShown() answers and reads no store, so a
    // TabView renders it with or without a client state above it.

    import { useShown } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    let { instance }: ViewProps = $props();

    const shown = useShown();
</script>

<p data-probe={instance.id}>{shown()}</p>
