<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. clangd's AST section: the syntax tree
    // of the selection the followed source tab last asked Show AST for (clangd's
    // `textDocument/ast`), drawn only while the tab holds an answer, as vscode-clangd's AST view is
    // in the Explorer only while it has data.
    //
    // Each node is labelled by its kind alone for the roles expression, statement, declaration and
    // template name, else by kind then role, its detail beside it and its arcana as its tooltip,
    // its icon by kind else by role (state/system/machine/lsp/clangd.ts). Every node with children
    // is open. A press selects the node's range in the source tab without moving the focus out of
    // the view, and the head's Close empties the section.

    import ClangdSection from './ClangdSection.svelte';
    import type { ClangdProps } from './props';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { astGlyph, describeNode, type AstNode } from '$lib/state/system/machine/lsp/clangd';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    /** One row of the tree: a node, the key it is told apart by and how deep it is. */
    type Row = { key: string; node: AstNode; depth: number; parent: string | null };

    let { open, ontoggle, tab }: ClangdProps = $props();

    const { clangd, editorStatus } = useState();

    const answer = $derived(tab === null ? null : clangd.ast(tab.id));

    /** The nodes of the answer in the order they are drawn. */
    function rowsOf(node: AstNode, depth: number, parent: string | null, key: string): Row[] {
        return [
            { key, node, depth, parent },
            ...(node.children ?? []).flatMap((child, at) =>
                rowsOf(child, depth + 1, key, `${key}/${String(at)}`)
            )
        ];
    }

    const nodes = $derived(answer?.node == null ? [] : rowsOf(answer.node, 0, null, 'ast:0'));
    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? nodes.map((row) => ({ id: row.key, parent: row.parent ?? 'head' })) : [])
    ]);

    function select(node: AstNode): void {
        if (tab === null || node.range === undefined) return;
        editorStatus.ask(tab.id, { kind: 'select', range: node.range });
    }
</script>

{#if answer !== null}
    <div class="ast" data-fs-ast>
        <ClangdSection
            label={t('files.ast')}
            {keyRows}
            count={nodes.length}
            {open}
            {ontoggle}
            close={{
                label: t('files.ast_close'),
                title: t('files.ast_close_title'),
                run: () => tab !== null && clangd.closeAst(tab.id)
            }}
        >
            {#snippet rows(nav: TreeNav)}
                {#if nodes.length === 0}
                    <li role="none">
                        <TreeItem label={t('files.ast_none')} tone="muted" />
                    </li>
                {/if}
                {#each nodes as row (row.key)}
                    <li role="none" data-fs-ast-node={row.key}>
                        <TreeItem
                            label={describeNode(row.node)}
                            id={row.key}
                            {nav}
                            level={row.depth + 2}
                            depth={row.depth}
                            glyph={astGlyph(row.node)}
                            title={row.node.arcana ?? describeNode(row.node)}
                            onclick={() => select(row.node)}
                        >
                            {#snippet detail()}{row.node.detail ?? ''}{/snippet}
                        </TreeItem>
                    </li>
                {/each}
            {/snippet}
        </ClangdSection>
    </div>
{/if}
