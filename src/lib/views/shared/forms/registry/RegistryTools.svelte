<script lang="ts">
    // Layer 3, shared view partial. The toolbar tail of a registry view: the control that opens the
    // registry file, and Add when the file declares a schema to build a new entry from.

    import SourceToolbar from '$lib/views/shared/links/SourceToolbar.svelte';
    import AddButton from '../AddButton.svelte';
    import type { RegistryFile } from './registry-file.svelte';

    let { file }: { file: RegistryFile } = $props();
</script>

<SourceToolbar source={file.source}>
    {#if file.collection?.schema !== undefined}
        <AddButton onclick={file.add} />
    {/if}
</SourceToolbar>
