<script lang="ts">
    // Layer 3, partial of the Debug view. The Watch section: the expressions the reader keeps, each
    // with its value at the last stop or the adapter's error for it, and "not available" while the
    // program runs. Each expression is evaluated as typed. The head adds an expression and removes
    // them all; a row edits and removes its own. A new or edited expression is typed in the row
    // itself, Enter or leaving the box keeps it, Escape drops it, and an edit left empty removes
    // the expression.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import NameField from '$lib/ui/tree/NameField.svelte';
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

    const watched = $derived(debug.watchRows());

    /** The row being typed: an expression's index, `new` for an added one, null for none. */
    let editing: number | 'new' | null = $state(null);

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? [
                  ...watched.map((_, at) => ({ id: `watch:${at}`, parent: 'head' })),
                  ...(editing === 'new' ? [{ id: 'watch:new', parent: 'head' }] : [])
              ]
            : [])
    ]);

    /** Keep what was typed and close the box; an empty new expression is dropped. */
    function keep(text: string): void {
        const was = editing;
        editing = null;
        if (was === 'new') debug.addWatch(text);
        else if (was !== null) debug.editWatch(was, text);
    }

    function add(): void {
        if (!open) ontoggle();
        editing = 'new';
    }
</script>

<div class="watch" data-debug-watch>
    <TreeView label={t('debug.watch')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={t('debug.watch')}
                id="head"
                {nav}
                count={watched.length}
                {open}
                {ontoggle}
                showActions
            >
                {#snippet actions(reach: number)}
                    <ToolButton
                        label={t('debug.watch_add')}
                        glyph="add"
                        compact
                        tabindex={reach}
                        onclick={add}
                    />
                    <ToolButton
                        label={t('debug.watch_remove_all')}
                        glyph="clear_all"
                        compact
                        tabindex={reach}
                        disabled={watched.length === 0}
                        onclick={() => debug.removeAllWatch()}
                    />
                {/snippet}
                {#each watched as row, at (at)}
                    <li role="none">
                        {#if editing === at}
                            <TreeItem
                                label=""
                                name={t('debug.watch_field')}
                                id={`watch:${at}`}
                                {nav}
                                level={2}
                                selected
                            >
                                {#snippet field()}
                                    <NameField
                                        value={row.expression}
                                        label={t('debug.watch_field')}
                                        oninput={() => undefined}
                                        onsubmit={keep}
                                        oncancel={() => (editing = null)}
                                        onleave={keep}
                                    />
                                {/snippet}
                            </TreeItem>
                        {:else}
                            <TreeItem
                                label={row.expression}
                                id={`watch:${at}`}
                                {nav}
                                level={2}
                                tone={row.error === undefined ? undefined : 'error'}
                                title={row.error ?? row.value ?? t('debug.not_available')}
                                onclick={() => (editing = at)}
                            >
                                {#snippet detail()}{row.error ??
                                        row.value ??
                                        t('debug.not_available')}{/snippet}
                                {#snippet actions(reach: number)}
                                    <ToolButton
                                        label={t('debug.watch_remove')}
                                        glyph="trash"
                                        compact
                                        tabindex={reach}
                                        onclick={() => debug.removeWatch(at)}
                                    />
                                {/snippet}
                            </TreeItem>
                        {/if}
                    </li>
                {/each}
                {#if editing === 'new'}
                    <li role="none">
                        <TreeItem
                            label=""
                            name={t('debug.watch_field')}
                            id="watch:new"
                            {nav}
                            level={2}
                            selected
                        >
                            {#snippet field()}
                                <NameField
                                    value=""
                                    label={t('debug.watch_field')}
                                    oninput={() => undefined}
                                    onsubmit={keep}
                                    oncancel={() => (editing = null)}
                                    onleave={keep}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/if}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
