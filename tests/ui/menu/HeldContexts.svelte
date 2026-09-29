<script lang="ts">
    // Hands every context it is drawn under to its caller, for tests/ui/menu/GroupContexts.svelte.

    import { getAllContexts } from 'svelte';

    let { onheld }: { onheld: (contexts: Map<unknown, unknown>) => void } = $props();

    /** Hand the contexts over once, as the group drew them. */
    function hand(): void {
        onheld(getAllContexts());
    }

    hand();
</script>
