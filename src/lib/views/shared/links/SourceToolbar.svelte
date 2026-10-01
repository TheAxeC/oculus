<script lang="ts">
    // Layer 3, shared view partial. The header toolbar of a view that draws a file: the view's own
    // icon actions (the children), then the control that opens the file the view is drawn from,
    // which the Pillars, the Domains, the Data and the Venues views each carry. It draws no file
    // control until that file is known.

    import type { Snippet } from 'svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import SourceButton from './SourceButton.svelte';
    import type { SourceFile } from './source-file';
    import { t } from '$lib/state/shared/words/text';

    let { source, children }: { source: SourceFile | null; children?: Snippet } = $props();
</script>

<Toolbar label={t('collection.toolbar')} overflow>
    {#if children}
        {@render children()}
    {/if}
    {#if source !== null}
        <SourceButton file={source} />
    {/if}
</Toolbar>
