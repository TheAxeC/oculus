<script lang="ts">
    // Layer 3, shared view. The Files view's tree rooted at the folder of one project, drawn in a
    // project card. The folder is the head of the tree and is open the first time the card is
    // drawn; there is no `..` row and no workspace header, since the card shows one project.
    //
    // The tree keeps its state in the record the card owns
    // (state/sources/explorer/view/card-tree.ts), which is a record of the Files view's shape, so a
    // press, a key, a menu and a drag act as they do there. Unlike a Files tab, which lists hidden
    // and ignored entries until its reader turns them off, a card keeps both out: the tree is built
    // with both toggles off (`toggles`), so its first listing holds neither, and its record is
    // written with both off once the card is drawn. A record that was never opened gets the head
    // written into it once the card is drawn; a record the tab's close cleared is not written
    // again, since the seed is keyed on the head alone and reads the record without tracking it.
    //
    // A folder no root of the workspace holds is said above the tree with the control that adds it
    // as a root. A refusal of that add is kept here and not in the record, because writing the
    // record would give a card that was never opened an empty list of open folders and close its
    // head.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Outside from './Outside.svelte';
    import RootedTree from './RootedTree.svelte';
    import { createRootedTree, readWorkspace } from './rooted-tree.svelte';
    import { refusal } from '$lib/state/sources/explorer/acts/refusal';
    import {
        filesViewOf,
        folderView,
        patchedFilesView,
        treeKey,
        unopened
    } from '$lib/state/sources/fs';
    import { folderOf } from '$lib/state/client/selectors.svelte';
    import type { BoardItem } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The joined board item whose folder is drawn. */
        item: BoardItem;
        /** The key of the record the tree keeps its state in. */
        owner: string;
    };

    let { item, owner }: Props = $props();

    /** The toggles of a card's tree: hidden and ignored entries kept out. */
    const CARD_SHOWN = { showHidden: false, showIgnored: false };

    const client = useState();
    const {
        fs: { addRoot },
        ui: { instanceState, setInstanceState }
    } = client;

    const workspace = readWorkspace(client);
    /** The project folder as an absolute path. */
    const dir = $derived(folderOf(item.project));
    const place = $derived(folderView(workspace.current.roots, dir));
    /** The key of the head row, and the empty string while no root holds the folder. */
    const head = $derived(
        place.found === null ? '' : treeKey(place.found.root.key, place.found.path)
    );

    const tree = createRootedTree(client, {
        workspace,
        owner: () => owner,
        roots: () => place.roots,
        top: () => place.top,
        up: () => null,
        unsaved: () => (head === '' ? [] : [head]),
        toggles: CARD_SHOWN
    });

    // A card whose record was never opened keeps its head open from then on. A card lists no
    // hidden and no ignored entry and offers no toggle, so its record holds both toggles off.
    $effect(() => {
        if (head === '') return;
        untrack(() => {
            const held = instanceState(owner);
            const view = filesViewOf(held);
            const part = {
                ...(unopened(held) ? { expanded: [head] } : {}),
                ...(view.showHidden || view.showIgnored ? CARD_SHOWN : {})
            };
            if (Object.keys(part).length > 0) {
                setInstanceState(owner, patchedFilesView(held, part));
            }
        });
    });

    /** What the last refused add of the folder said, and the empty string for none. */
    let refused = $state('');

    async function addOutside(): Promise<void> {
        const answer = await addRoot(dir);
        refused = answer.ok ? '' : refusal(answer.error ?? '');
    }
</script>

{#if workspace.saved.error !== ''}
    <Empty error message={t('files.read_failed', workspace.saved.error)} />
{:else if workspace.saved.loading}
    <Empty message={t('files.loading')} glyph={t('files.none_glyph')} />
{:else if place.found === null}
    <Outside {dir} onadd={() => void addOutside()} />
    {#if refused !== ''}
        <Empty error message={refused} />
    {/if}
{:else}
    {#if tree.view.note !== ''}
        <Empty error message={tree.view.note} />
    {/if}
    <div class="scroll" data-scroll>
        <RootedTree {tree} {workspace} {owner} />
    </div>
{/if}

<style>
    /* The tree scrolls inside the card, which is the box its rows are windowed against. */
    .scroll {
        max-height: calc(var(--tree-row) * var(--text-scale, 1) * 12);
        overflow: auto;
    }
</style>
