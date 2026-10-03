<script lang="ts">
    // Layer 5, test support. Draws one snippet that a view handed to the pane strip, so a case can
    // read the markup the strip would draw for it.
    import type { Snippet } from 'svelte';

    let { snippet }: { snippet: Snippet } = $props();
</script>

{@render snippet()}
