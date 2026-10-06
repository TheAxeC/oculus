<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. clangd's Memory Usage section: the tree
    // `$/memoryUsage` answered for the followed source tab's server, drawn only while the tab holds
    // an answer, as vscode-clangd's memory view is.
    //
    // A row is a key of the answer that does not start with `_`, its name the key's base name, its
    // total in megabytes beside it and `self=<n> total=<n>` as its tooltip; children are ordered by
    // total, largest first. A file is drawn with the file glyph and closed, a leaf with the leaf
    // glyph, and a node of six children or more is closed. The head's Refresh asks the server
    // again (Show Memory Usage from the tab) and Close empties the section.

    import ClangdSection from './ClangdSection.svelte';
    import type { ClangdProps } from './props';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { memoryRows, type MemoryRow } from '$lib/state/system/machine/lsp/clangd';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const FILE_GLYPH = 'symbol_file';
    const LEAF_GLYPH = 'memory_leaf';

    /** One row of the tree with the key it is told apart by. */
    type Row = { key: string; row: MemoryRow; depth: number; parent: string | null };

    let { open, ontoggle, tab }: ClangdProps = $props();

    const {
        clangd,
        editorStatus: { ask }
    } = useState();

    const answer = $derived(tab === null ? null : clangd.memory(tab.id));
    /** The rows the reader closed or opened against their own start. */
    let flipped: string[] = $state([]);

    function rowsOf(list: MemoryRow[], depth: number, parent: string | null, path: string): Row[] {
        return list.flatMap((row, at) => {
            const key = `${path}/${String(at)}:${row.name}`;
            return [
                { key, row, depth, parent },
                ...(isOpen(key, row) ? rowsOf(row.children, depth + 1, key, key) : [])
            ];
        });
    }

    function isOpen(key: string, row: MemoryRow): boolean {
        if (row.children.length === 0) return false;
        return row.collapsed === flipped.includes(key);
    }

    const nodes = $derived(
        answer === null ? [] : rowsOf(memoryRows(answer.tree), 0, null, 'memory')
    );
    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? nodes.map((one) => ({
                  id: one.key,
                  parent: one.parent ?? 'head',
                  ...(one.row.children.length === 0 ? {} : { open: isOpen(one.key, one.row) })
              }))
            : [])
    ]);

    function flip(key: string): void {
        flipped = flipped.includes(key) ? flipped.filter((one) => one !== key) : [...flipped, key];
    }

    /** Ask the server again, through the source tab's Show Memory Usage. */
    function refresh(): void {
        if (tab !== null) ask(tab.id, { kind: 'action', id: 'oculus.lsp.memory' });
    }
</script>

{#if answer !== null}
    <div class="memory" data-fs-memory>
        <ClangdSection
            label={t('files.memory')}
            {keyRows}
            count={nodes.length}
            {open}
            {ontoggle}
            onrow={flip}
            refresh={{ label: t('files.memory_refresh'), run: refresh }}
            close={{
                label: t('files.memory_close'),
                title: t('files.memory_close_title'),
                run: () => tab !== null && clangd.closeMemory(tab.id)
            }}
        >
            {#snippet rows(nav: TreeNav)}
                {#each nodes as one (one.key)}
                    <li role="none" data-fs-memory-node={one.key}>
                        <TreeItem
                            label={one.row.name}
                            id={one.key}
                            {nav}
                            level={one.depth + 2}
                            depth={one.depth}
                            glyph={one.row.file ? FILE_GLYPH : LEAF_GLYPH}
                            expanded={one.row.children.length === 0
                                ? undefined
                                : isOpen(one.key, one.row)}
                            title={one.row.detail}
                            onclick={one.row.children.length === 0
                                ? undefined
                                : () => flip(one.key)}
                        >
                            {#snippet detail()}{t('files.memory_mb', one.row.megabytes)}{/snippet}
                        </TreeItem>
                    </li>
                {/each}
            {/snippet}
        </ClangdSection>
    </div>
{/if}
