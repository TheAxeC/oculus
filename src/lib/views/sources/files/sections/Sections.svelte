<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The sections of the view in the order
    // the view keeps (`order`, the instance's `sections`): the open editors and the tree, which
    // Files.svelte draws and hands in as snippets, the outline, clangd's AST and Memory Usage (each
    // drawn only while it holds an answer) and the timeline of the file tab the reader looked at
    // last, then the reader's own bookmarks and the scratch notes, each in the same row style and
    // each drawn in every state its read can be in, so a head and its control are there whatever
    // the read said. Each head is handed its drag and its Alt+Up and Alt+Down step (`move`), which
    // Files.svelte makes over the order.
    //
    // The file tab the reader looked at last on the page (followedTab in
    // state/sources/explorer/sections/followed-tab.ts) is chosen by Files.svelte and handed to the
    // Outline and to clangd's AST and Memory Usage sections, which read the same tab.
    //
    // The bookmarks and the notes are read here rather than handed down, because this is what draws
    // what each one answered: the list, the one muted row of a list that is empty, or the sentence
    // saying why the read failed. A read that failed holds nothing in the store, so it is asked
    // again from here: on the control of that sentence, and on this mount, which is the reader
    // coming back to the file browser and the occasion a reader expects a view to be current. The
    // asks are untracked, so a read that fails again is not itself the reason for another ask.
    //
    // What the view keeps is what its own presses are about: which section is open, and what the
    // last press answered. Those come in as the instance's own state and the callbacks, so this
    // component holds nothing of its own.
    //
    // A note opens as a tab and is a file in a folder of its own, written by the first keystroke
    // typed into it, so adding one makes nothing here. Its three presses are this component's, and
    // what a press answered goes to the view's refusal line through `onnote`, in the instance the
    // press was made in.

    import { untrack, type Snippet } from 'svelte';
    import Bookmarks from './Bookmarks.svelte';
    import Notes from './Notes.svelte';
    import Ast from './clangd/Ast.svelte';
    import MemoryUsage from './clangd/MemoryUsage.svelte';
    import Outline from './Outline.svelte';
    import Timeline from './Timeline.svelte';
    import type { Entry } from '$lib/state/boards/collection';
    import type { FilesView, RowRef } from '$lib/state/sources/fs';
    import type { FollowTab } from '$lib/state/sources/explorer/sections/followed-tab';
    import type { SectionMove } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import { noteId } from '$lib/state/life/notes';
    import { refusal } from '$lib/state/sources/explorer/acts/refusal';
    import { sectionOpen } from '$lib/state/sources/explorer/sections/section-state';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        fs: {
            bookmarks,
            bookmarksChanged,
            deleteNote,
            notes,
            orderNotes,
            retryBookmarks,
            retryNotes
        },
        layout: { closeRecord, openView },
        writes: { reorderEntries }
    } = useState();

    type Props = {
        /** The instance id of the file browser on screen. */
        owner: string;
        /**
         * What the file browser on screen remembers: which sections are closed, which form is open.
         */
        view: FilesView;
        /** The file selected in the tree, which the timeline is of; null for none. */
        selected: RowRef | null;
        /** The file tab the reader looked at last on the page, which the outline reads. */
        followed: FollowTab | null;
        /** The ids of the sections in the order they are drawn, every one of them once. */
        order: string[];
        /** What one section's head takes to be dragged and moved by Alt+Up and Alt+Down. */
        move: (id: string) => SectionMove;
        /** The open editors section, drawn by Files.svelte. */
        editors: Snippet;
        /** The tree's section: the workspace header and the roots, drawn by Files.svelte. */
        files: Snippet;
        /** Open or close one section under the trees. */
        onsection: (id: string) => void;
        /** Write part of the file browser's own state, which the Timeline's pin and lists are. */
        onpatch: (part: Partial<FilesView>) => void;
        onopenmark: (entry: Entry) => void;
        /** Give one bookmark another label, and take one away. */
        onrenamemark: (id: string, label: string) => void;
        onremovemark: (id: string) => void;
        /** Say what a note press answered on the refusal line of the instance it was made in. */
        onnote: (owner: string, note: string) => void;
    };

    let {
        owner,
        view,
        selected,
        followed,
        order,
        move,
        editors,
        files,
        onsection,
        onpatch,
        onopenmark,
        onrenamemark,
        onremovemark,
        onnote
    }: Props = $props();

    const marks = $derived(bookmarks());
    const held = $derived(notes());

    $effect(() => {
        untrack(() => {
            retryBookmarks();
            retryNotes();
        });
    });

    /** Open a new note. The tab is told it has no file yet, so it asks the server for nothing. */
    function addNote(): void {
        onnote(owner, '');
        openView('note', { id: noteId(new Date()), fresh: true });
    }

    /**
     * Put the bookmarks in the order a drag or a key left them: the file is written in the order of
     * the bookmarks' labels, which are their ids, and the bookmarks are read again so the rail,
     * which reads the same file, follows. A refusal is said on the view's message line.
     */
    async function orderMarks(ids: string[]): Promise<void> {
        const from = owner;
        const answer = await reorderEntries('bookmarks', ids);
        bookmarksChanged();
        onnote(
            from,
            answer.ok
                ? ''
                : t(
                      'editor.failed',
                      answer.error ?? answer.refused.map((one) => one.reason).join(', ')
                  )
        );
    }

    /**
     * Put the notes in the order a drag or a key left them; the notes are read again on success.
     */
    async function orderThem(ids: string[]): Promise<void> {
        const from = owner;
        const answer = await orderNotes(ids);
        onnote(from, answer.ok ? '' : refusal(answer.error ?? ''));
    }

    /** Take one note off the disk, and take its tab with it: what it drew is not there any more. */
    async function dropNote(id: string): Promise<void> {
        const from = owner;
        const answer = await deleteNote(id);
        onnote(from, answer.ok ? '' : refusal(answer.error ?? ''));
        if (answer.ok) closeRecord('note', id);
    }
</script>

{#each order as id (id)}
    {#if id === 'editors'}
        {@render editors()}
    {:else if id === 'files'}
        {@render files()}
    {:else if id === 'outline'}
        <Outline
            open={sectionOpen(view, 'outline')}
            ontoggle={() => onsection('outline')}
            tab={followed}
            move={move('outline')}
        />
    {:else if id === 'ast'}
        <Ast
            open={sectionOpen(view, 'ast')}
            ontoggle={() => onsection('ast')}
            tab={followed}
            move={move('ast')}
        />
    {:else if id === 'memory'}
        <MemoryUsage
            open={sectionOpen(view, 'memory')}
            ontoggle={() => onsection('memory')}
            tab={followed}
            move={move('memory')}
        />
    {:else if id === 'timeline'}
        <Timeline
            open={sectionOpen(view, 'timeline')}
            ontoggle={() => onsection('timeline')}
            {selected}
            {view}
            {onpatch}
            move={move('timeline')}
        />
    {:else if id === 'bookmarks'}
        <Bookmarks
            rows={marks.entries}
            error={marks.error}
            open={sectionOpen(view, 'bookmarks')}
            ontoggle={() => onsection('bookmarks')}
            onopen={onopenmark}
            onrename={onrenamemark}
            onremove={onremovemark}
            onretry={retryBookmarks}
            move={move('bookmarks')}
            onorder={(ids: string[]) => void orderMarks(ids)}
        />
    {:else if id === 'notes'}
        <Notes
            rows={held.notes}
            error={held.error}
            open={sectionOpen(view, 'notes')}
            ontoggle={() => onsection('notes')}
            onadd={addNote}
            onopen={(id: string) =>
                openView('note', {
                    id,
                    label: held.notes.find((one) => one.id === id)?.title ?? ''
                })}
            onremove={(id: string) => void dropNote(id)}
            onretry={retryNotes}
            move={move('notes')}
            onorder={(ids: string[]) => void orderThem(ids)}
        />
    {/if}
{/each}
