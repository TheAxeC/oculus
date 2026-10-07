<script lang="ts">
    // Layer 3, shared view partial, drawn by views/sources/files/Files.svelte. What answers an ask
    // to show one path, which another view writes into the instance's state through the layout
    // store's showInFiles or showTimeline: the folders on the way are read here, outermost first
    // and each only once the one above it said the next name is a folder, then the ask is settled
    // into the open folders and the selected row, the row is scrolled into view once the tree has
    // drawn it and takes the keyboard, and the outcome line says when the path was not found as
    // asked. An ask for the Timeline (showTimeline) also opens that section; its scroll is the
    // section's head brought to the top of the pane in place of the row's, so each ask scrolls
    // once, and an ask whose outcome has no row scrolls nothing. The outcome is kept in the
    // instance's state and the Files view's message line says it (revealLine). A folder whose held
    // listing lacks the next name is read from the server once more before the path is called
    // missing, and a root the held roots lack is looked for in a fresh read of the workspaces
    // before the root is called missing, since a root added a moment ago reaches them later.
    //
    // Every step goes through the instance's state and is written only while that state still holds
    // the ask it was made for (state/sources/fs.ts's revealSettled and revealScrolled): an answer
    // that lands after a later ask replaced this one, after the tab was closed, or after another
    // mount of this view already settled it writes nothing. An ask the view has not answered yet
    // stays in the state, so a tab that mounts after the ask answers it then; an ask made while the
    // roots could not be read is answered at once with the reason and is not left for a later read.

    import { untrack } from 'svelte';
    import {
        filesViewOf,
        resolveReveal,
        revealScrolled,
        revealSettled,
        rootsUnread,
        rowKey,
        shownOf,
        type FilesView,
        type TreeRow
    } from '$lib/state/sources/fs';
    import { rootKeysOf } from '$lib/state/sources/fs-transport';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { readListing, workspacesNow },
        ui: { instanceState }
    } = useState();

    type Props = {
        /** The instance the asks are read from and the answers written into. */
        owner: string;
        view: FilesView;
        /** The root keys of the workspace in force, or null while they are not read. */
        roots: string[] | null;
        /** Why the roots could not be read, or the empty string. */
        rootsError: string;
        /** The rows the tree draws, so the scroll waits until the row is one of them. */
        rows: TreeRow[];
        onpatch: (owner: string, part: Partial<FilesView>) => void;
    };

    let { owner, view, roots, rootsError, rows, onpatch }: Props = $props();

    /**
     * The ask this mount is reading the folders for, so a redraw meanwhile starts no second read.
     */
    let reading = '';

    // An ask made while the roots could not be read is answered at once with the reason.
    $effect(() => {
        const ask = view.reveal;
        if (ask === null || ask.settled || rootsError === '') return;
        const next = revealSettled(view, ask, rootsUnread(ask, rootsError));
        if (next !== null) onpatch(owner, next);
    });

    // A line saying the roots could not be read is false once they are: it goes when they arrive.
    $effect(() => {
        if (view.revealed?.kind === 'no-roots' && roots !== null && rootsError === '') {
            onpatch(owner, { revealed: null });
        }
    });

    $effect(() => {
        const ask = view.reveal;
        const held = roots;
        if (ask === null || ask.settled || held === null) return;
        const ticket = `${owner}\n${String(ask.asked)}`;
        if (reading === ticket) return;
        reading = ticket;
        const from = owner;
        // The reads answer from the store's own state, which this effect must not come to depend
        // on.
        const read = (root: string, path: string, fresh?: boolean) =>
            readListing(root, path, shownOf(view), fresh);
        const known = async (): Promise<string[]> =>
            held.includes(ask.root) ? held : (rootKeysOf(await workspacesNow()) ?? held);
        void untrack(async () => resolveReveal(ask, await known(), read)).then((outcome) => {
            const next = revealSettled(filesViewOf(instanceState(from)), ask, outcome);
            if (next !== null) onpatch(from, next);
        });
    });

    /**
     * Scroll a settled ask's row into view and give it the keyboard, once the tree has drawn it,
     * and say whether it was drawn.
     */
    function reach(from: string, ask: NonNullable<FilesView['reveal']>, key: string): boolean {
        const tree = document.querySelector(`[data-instance="${CSS.escape(from)}"]`);
        const node = tree?.querySelector(`[data-fs-row="${CSS.escape(key)}"]`) ?? null;
        if (tree === null || node === null) return false;
        const head = ask.timeline === true ? tree.querySelector('[data-fs-timeline]') : null;
        (head ?? node).scrollIntoView({ block: head === null ? 'center' : 'start' });
        // The reader asked to be taken to the path, so the keyboard goes there too: the arrow keys
        // then move from the row that was shown rather than from the control that asked.
        const item = node.querySelector('[role="treeitem"]');
        if (item instanceof HTMLElement) item.focus({ preventScroll: true });
        const next = revealScrolled(filesViewOf(instanceState(from)), ask);
        if (next !== null) onpatch(from, next);
        return true;
    }

    $effect(() => {
        const ask = view.reveal;
        const selected = view.selected;
        if (ask === null || !ask.settled || selected === null) return;
        const key = rowKey(selected);
        if (!rows.some((row) => rowKey(row) === key)) return;
        const from = owner;
        if (untrack(() => reach(from, ask, key))) return;
        const tree = document.querySelector(`[data-instance="${CSS.escape(from)}"]`);
        if (tree === null) return;
        // The list draws only the rows in view, and a tab just brought forward has drawn none yet:
        // the row is looked for again each time the view draws, until it is there.
        const watch = new MutationObserver(() => {
            if (reach(from, ask, key)) watch.disconnect();
        });
        watch.observe(tree, { childList: true, subtree: true });
        return () => watch.disconnect();
    });
</script>
