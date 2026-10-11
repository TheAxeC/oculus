<script lang="ts">
    // Layer 3, shell. The quick input an app's host or frame asks for: a quick pick or an input
    // box, one at a time, over the page. The requests store holds the one in force and hands back
    // its answer; this draws it, so a new request replaces the one on screen. Escape and a press on
    // the ground answer nothing.

    import { useState } from '$lib/state/client/use';
    import AppQuickBox from './AppQuickBox.svelte';

    const {
        appShell: { requests }
    } = useState();

    const held = $derived(requests.quick());
</script>

{#if held !== null}
    {#key held.request.id}
        <AppQuickBox {held} />
    {/key}
{/if}
