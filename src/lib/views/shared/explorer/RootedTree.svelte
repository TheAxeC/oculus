<script lang="ts">
    // Layer 3, shared view. One explorer tree over a rooted-tree model (rooted-tree.svelte.ts): the
    // open folders that failed to list, the tree of rows (tree/Tree.svelte), and the line that says
    // a typed filter matched nothing. The Files view draws its workspace with it and a project card
    // draws the project's folder with it, so a press, a key, a menu and a drag act the same in
    // both.
    //
    // A file opens through opening.ts, the bookmark star writes through the model's bookmark
    // actions, and the root menu's Remove asks first (the confirm below) before it takes a root out
    // of the workspace. The header, the `..` row and the Add Folder control are the caller's:
    // a tree given none draws none.

    import type { Snippet } from 'svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { openRow } from './opening';
    import Tree from './tree/Tree.svelte';
    import type { readWorkspace, RootedTree } from './rooted-tree.svelte';
    import { refusal } from '$lib/state/sources/explorer/acts/refusal';
    import { treeKey, type RowRef, type TreeRow } from '$lib/state/sources/fs';
    import { matchedNothing } from '$lib/state/sources/fs-transport';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        tree: RootedTree;
        /** The workspace in force, whose roots the tree's rows are under. */
        workspace: ReturnType<typeof readWorkspace>;
        /** The key of the record the tree keeps its state in. */
        owner: string;
        /** The workspace header, drawn as the first row of the tree; none draws no header. */
        header?: Snippet<[TreeNav]>;
        headerOpen?: boolean;
        /** The `..` row was pressed: show this folder as the top. */
        onup?: (to: RowRef) => void;
    };

    let { tree, workspace, owner, header, headerOpen = true, onup }: Props = $props();

    const {
        fs: { removeRoot }
    } = useState();

    /** The root the removal confirm is open for, and the empty string while it is closed. */
    let removing = $state('');

    async function remove(key: string): Promise<void> {
        const answer = await removeRoot(key);
        tree.tab.answerAt(owner, { note: answer.ok ? '' : refusal(answer.error ?? '') });
    }
</script>

{#each tree.failures as failure (treeKey(failure.root, failure.path))}
    <Empty error message={t('files.listing_failed', failure.path || failure.root, failure.error)} />
{/each}
<Tree
    rows={tree.shown}
    roots={workspace.current.roots}
    filtering={tree.filtering}
    selected={tree.view.selected}
    {owner}
    fixed={tree.fixed}
    marked={tree.marked}
    fold={tree.fold}
    {header}
    {headerOpen}
    onselect={tree.tab.selectRow}
    ontoggle={tree.tab.toggle}
    onopen={(row: TreeRow, preview: boolean, pressedAt?: number) =>
        void openRow(tree.opener, row, preview, pressedAt)}
    onremove={(key: string) => (removing = key)}
    onbookmark={(row: TreeRow) => void tree.marking.bookmark(row)}
    onup={onup ?? ((to: RowRef) => tree.tab.patchAt(owner, { top: to }))}
    onaddroot={() => void tree.addFolders()}
/>
{#if tree.filtering && matchedNothing(tree.shown)}
    <Empty message={t('files.filter_none')} glyph={t('files.none_glyph')} />
{/if}

{#if removing !== ''}
    <Confirm
        message={t('files.remove_root_confirm', removing)}
        detail={t('files.remove_root_detail')}
        confirm={t('files.remove_root')}
        cancel={t('files.cancel')}
        onconfirm={() => {
            const key = removing;
            removing = '';
            void remove(key);
        }}
        oncancel={() => (removing = '')}
    />
{/if}
