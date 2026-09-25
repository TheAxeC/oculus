<script lang="ts">
    // Layer 3, shared view partial. The toolbar of a view whose only control opens the file the
    // view is drawn from, which the Pillars, the Domains and the Data views each carry; it draws
    // nothing inside the bar until that file is known.

    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import SourceButton from './SourceButton.svelte';
    import type { SourceFile } from './source-file';
    import { t } from '$lib/state/words/text';

    let { source }: { source: SourceFile | null } = $props();
</script>

<Toolbar label={t('collection.toolbar')}>
    {#if source !== null}
        <SourceButton file={source} />
    {/if}
</Toolbar>
