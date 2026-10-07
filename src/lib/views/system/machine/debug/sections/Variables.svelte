<script lang="ts">
    // Layer 3, partial of the Debug view. The Variables section: the scopes of the selected frame,
    // `Locals` then `Module`, each variable as `name = value` as the adapter answers it. The
    // adapter answers flat lists, so no row opens, and it sends no type, so none is shown. While
    // the program is not paused there is nothing to read, and the section says so.

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

    const scopes = $derived(debug.paused() ? debug.payload().scopes : []);

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? scopes.flatMap((scope, at) =>
                  scope.variables.map((_, index) => ({
                      id: `variable:${at}:${index}`,
                      parent: 'head'
                  }))
              )
            : [])
    ]);
</script>

<div class="variables" data-debug-variables>
    <TreeView label={t('debug.variables')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection label={t('debug.variables')} id="head" {nav} {open} {ontoggle}>
                {#if scopes.length === 0}
                    <li role="none">
                        <TreeItem label={t('debug.nothing_paused')} tone="muted" />
                    </li>
                {/if}
                {#each scopes as scope, at (scope.name)}
                    <li role="none">
                        <TreeItem label={scope.name} tone="muted" strong />
                    </li>
                    {#each scope.variables as variable, index (variable.name)}
                        <li role="none">
                            <TreeItem
                                label={t('debug.variable', variable.name, variable.value)}
                                id={`variable:${at}:${index}`}
                                {nav}
                                level={2}
                                title={t('debug.variable', variable.name, variable.value)}
                            />
                        </li>
                    {/each}
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
