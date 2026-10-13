<script lang="ts">
    // Layer 3, partial of the Debug view. The Loaded Sources section: the sources the adapter
    // reports loaded, drawn only while the adapter declared the request. The list is read when the
    // section is drawn and again each time the program pauses or the session changes; a source with
    // a path under a served root opens in a source tab on a press.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        open: boolean;
        ontoggle: () => void;
    };

    let { open, ontoggle }: Props = $props();

    const { debug } = useState();

    const sources = $derived(debug.sources());

    /** Read again when the status changes, which is a pause, a resume or a new session. */
    $effect(() => {
        void debug.status();
        void debug.readSources();
    });

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? sources.map((_, at) => ({ id: `source:${at}`, parent: 'head' })) : [])
    ]);
</script>

<div class="sources" data-debug-sources>
    <TreeView label={t('debug.loaded_sources')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={t('debug.loaded_sources')}
                id="head"
                {nav}
                count={sources.length}
                {open}
                {ontoggle}
            >
                {#if sources.length === 0}
                    <li role="none">
                        <TreeItem label={t('debug.loaded_none')} tone="muted" />
                    </li>
                {/if}
                {#each sources as source, at (at)}
                    <li role="none">
                        <TreeItem
                            label={source.name === '' ? source.path : source.name}
                            id={`source:${at}`}
                            {nav}
                            level={2}
                            title={source.path}
                            onclick={source.path === ''
                                ? undefined
                                : () => debug.openAt(source.path, 1)}
                        />
                    </li>
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
