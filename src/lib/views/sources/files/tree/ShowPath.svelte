<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. What answers an ask to show one path,
    // which another view writes into the instance's state through the layout store's showInFiles:
    // the folders on the way are read here, outermost first and each only once the one above it
    // said the next name is a folder, then the ask is settled into the open folders and the
    // selected row, the row is scrolled into view once the tree has drawn it and takes the
    // keyboard, and the outcome line says when the path was not found as asked.
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
        type FilesView,
        type RevealOutcome,
        type RowRef,
        type TreeRow
    } from '$lib/state/sources/fs';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { readListing },
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
        void untrack(() => resolveReveal(ask, held, readListing)).then((outcome) => {
            const next = revealSettled(filesViewOf(instanceState(from)), ask, outcome);
            if (next !== null) onpatch(from, next);
        });
    });

    $effect(() => {
        const ask = view.reveal;
        const selected = view.selected;
        if (ask === null || !ask.settled || selected === null) return;
        const key = rowKey(selected);
        if (!rows.some((row) => rowKey(row) === key)) return;
        const node = document.querySelector(
            `[data-instance="${CSS.escape(owner)}"] [data-fs-row="${CSS.escape(key)}"]`
        );
        if (node === null) return;
        node.scrollIntoView({ block: 'center' });
        // The reader asked to be taken to the path, so the keyboard goes there too: the arrow keys
        // then move from the row that was shown rather than from the control that asked.
        const item = node.querySelector('[role="treeitem"]');
        if (item instanceof HTMLElement) item.focus({ preventScroll: true });
        const next = revealScrolled(view, ask);
        if (next !== null) onpatch(owner, next);
    });

    /** A row as the outcome line names it: the root, then the path under it. */
    function placeOf(row: RowRef): string {
        return row.path === '' ? row.root : t('files.reveal_place', row.root, row.path);
    }

    /** What one outcome says, or the empty string for a path found as asked. */
    function lineOf(outcome: RevealOutcome | null): string {
        if (outcome === null || outcome.kind === 'found') return '';
        const asked = placeOf(outcome.asked);
        if (outcome.kind === 'no-roots') return t('files.reveal_no_roots', asked, outcome.error);
        if (outcome.kind === 'no-root' || outcome.shown === null) {
            return t('files.reveal_no_root', asked, outcome.asked.root);
        }
        const shown = placeOf(outcome.shown);
        if (outcome.kind === 'unread') return t('files.reveal_unread', asked, shown, outcome.error);
        return t('files.reveal_missing', asked, shown);
    }

    const line = $derived(lineOf(view.revealed));
</script>

{#if line !== ''}
    <p class="said" aria-live="polite" data-fs-revealed>{line}</p>
{/if}

<style>
    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
