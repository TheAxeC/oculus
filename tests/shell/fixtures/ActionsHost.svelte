<script lang="ts">
    // Layer 5, test support. The pane strip drawn with one action of the active tab's own, as a
    // file tab hands it, so a case can read where the strip puts it.
    import PaneStrip from '../../../src/lib/shell/panes/strip/PaneStrip.svelte';

    let props: Record<string, unknown> = $props();
</script>

{#snippet mine()}
    <button type="button" class="mine">Mine</button>
{/snippet}

<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -- the strip's own props -->
<PaneStrip {...props as any} tabActions={mine} />
