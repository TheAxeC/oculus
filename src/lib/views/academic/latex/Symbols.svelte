<script lang="ts">
    // Layer 3, partial of the TeX view. The Math Symbols section, as LaTeX Workshop's symbol panel
    // lists them: the groups of config/catalogs/latex.yml (`latex_editing.symbols`), each symbol
    // drawn by KaTeX from its source, with a box that filters the symbols by name and search words.
    // A press asks the followed source tab to insert the symbol's snippet at its caret, the way a
    // press in LaTeX Workshop's panel types it; with no source tab followed the rows are drawn and
    // press nothing. A group opens by a press on its row, and a filter opens every group that
    // holds a match. The catalog is the store's (`latex.editing()`), read once for the page.
    //
    // Each symbol is typeset on first sight: the formula is drawn into its row when the row is
    // attached, and KaTeX and its stylesheet load as one chunk then.

    import type { Attachment } from 'svelte/attachments';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { SymbolGroup } from '$lib/state/sessions/latex/latex-state';
    import { t } from '$lib/state/shared/words/text';
    import { typeset } from '../../shared/latex/math';
    import { toggled } from '$lib/state/shared/lists/lists';

    type Props = {
        groups: SymbolGroup[];
        /** Whether a source tab is followed, so a press has somewhere to insert. */
        enabled: boolean;
        open: boolean;
        ontoggle: () => void;
        oninsert: (snippet: string) => void;
    };

    let { groups, enabled, open, ontoggle, oninsert }: Props = $props();

    let filter = $state('');
    /** The groups the reader opened. */
    let opened: string[] = $state([]);

    const needle = $derived(filter.trim().toLowerCase());

    /** The groups with the symbols that match the filter, and only the groups that hold one. */
    const shown = $derived(
        groups
            .map((group) => ({
                name: group.name,
                items:
                    needle === ''
                        ? group.items
                        : group.items.filter((one) =>
                              `${one.name} ${one.keywords} ${one.source}`
                                  .toLowerCase()
                                  .includes(needle)
                          )
            }))
            .filter((group) => group.items.length > 0)
    );

    const count = $derived(shown.reduce((sum, group) => sum + group.items.length, 0));

    const isOpen = (name: string): boolean => needle !== '' || opened.includes(name);

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? shown.flatMap((group) => [
                  { id: `group:${group.name}`, parent: 'head', open: isOpen(group.name) },
                  ...(isOpen(group.name)
                      ? group.items.map((one) => ({
                            id: `symbol:${group.name}:${one.name}`,
                            parent: `group:${group.name}`
                        }))
                      : [])
              ])
            : [])
    ]);

    function toggle(id: string): void {
        if (id === 'head') {
            ontoggle();
            return;
        }
        if (!id.startsWith('group:')) return;
        const name = id.slice('group:'.length);
        opened = toggled(opened, name);
    }

    /** Draw one symbol's formula into the node it is attached to. */
    function drawn(source: string): Attachment<HTMLElement> {
        return (node) => {
            void typeset(node, source, false);
        };
    }
</script>

<div class="symbols" data-latex-symbols>
    <TreeView label={t('latex.symbols')} {rows} ontoggle={toggle}>
        {#snippet children(nav: TreeNav)}
            <TreeSection label={t('latex.symbols')} id="head" {nav} {count} {open} {ontoggle}>
                <li role="none" class="filter">
                    <Search
                        value={filter}
                        placeholder={t('latex.symbols_filter')}
                        oninput={(value: string) => (filter = value)}
                        fill
                    />
                </li>
                {#each shown as group (group.name)}
                    <li role="none">
                        <TreeItem
                            label={group.name}
                            id={`group:${group.name}`}
                            {nav}
                            level={2}
                            expanded={isOpen(group.name)}
                            count={group.items.length}
                            onclick={() => toggle(`group:${group.name}`)}
                        />
                    </li>
                    {#if isOpen(group.name)}
                        {#each group.items as one (one.name)}
                            <li role="none">
                                <TreeItem
                                    label={one.name}
                                    id={`symbol:${group.name}:${one.name}`}
                                    {nav}
                                    level={3}
                                    depth={1}
                                    title={one.source}
                                    onclick={enabled ? () => oninsert(one.insert) : undefined}
                                >
                                    {#snippet words()}
                                        <span class="formula" {@attach drawn(one.source)}></span>
                                        <span class="name">{one.name}</span>
                                    {/snippet}
                                </TreeItem>
                            </li>
                        {/each}
                    {/if}
                {/each}
                {#if shown.length === 0}
                    <li role="none"><TreeItem label={t('latex.symbols_none')} tone="muted" /></li>
                {/if}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>

<style>
    .filter {
        padding: 2px 8px;
        display: flex;
    }

    .formula {
        display: inline-block;
        min-width: 2.5em;
        text-align: center;
        margin-right: 6px;
    }

    .name {
        color: var(--muted-txt, var(--muted));
    }
</style>
