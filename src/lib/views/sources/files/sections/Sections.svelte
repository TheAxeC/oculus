<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The three sections under the trees: the
    // reader's own bookmarks, the scratch notes and the workspaces, each in the same row style and
    // each drawn in every state its read can be in, so a head and its control are there whatever
    // the read said.
    //
    // The three reads are read here rather than handed down, because this is what draws what each one
    // answered: the list, the one muted row of a list that is empty, or the sentence saying why the
    // read failed. A read that failed holds nothing in the store, so it is asked again from here: on
    // the control of that sentence, and on this mount, which is the reader coming back to the file
    // browser and the occasion a reader expects a view to be current. The asks are untracked, so a
    // read that fails again is not itself the reason for another ask.
    //
    // What the view keeps is what its own presses are about: which section is open, which form is
    // open, and what the last press answered. Those come in as the instance's own state and the
    // callbacks, so this component holds nothing of its own.

    import { untrack } from 'svelte';
    import Bookmarks from './Bookmarks.svelte';
    import Notes from './Notes.svelte';
    import Workspaces from './Workspaces.svelte';
    import type { Entry } from '$lib/state/boards/collection';
    import type { FilesView } from '$lib/state/sources/fs';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { bookmarks, notes, retryBookmarks, retryNotes, retryWorkspaces, workspaces }
    } = useState();

    type Props = {
        /** What the file browser on screen remembers: which sections are closed, which form is open. */
        view: FilesView;
        /** Open or close one section under the trees. */
        onsection: (id: string) => void;
        onaddmark: () => void;
        onopenmark: (entry: Entry) => void;
        oneditmark: (id: string) => void;
        onaddnote: () => void;
        /** Open one note as a tab, under the title the list carries for it now. */
        onopennote: (id: string, label: string) => void;
        onremovenote: (id: string) => void;
        onsaveworkspace: () => void;
        onselectworkspace: (name: string) => void;
    };

    let {
        view,
        onsection,
        onaddmark,
        onopenmark,
        oneditmark,
        onaddnote,
        onopennote,
        onremovenote,
        onsaveworkspace,
        onselectworkspace
    }: Props = $props();

    const marks = $derived(bookmarks());
    const held = $derived(notes());
    const saved = $derived(workspaces());

    $effect(() => {
        untrack(() => {
            retryWorkspaces();
            retryBookmarks();
            retryNotes();
        });
    });
</script>

<Bookmarks
    rows={marks.entries}
    error={marks.error}
    open={!view.collapsed.includes('bookmarks')}
    editing={view.editing}
    adding={view.form === 'bookmark' && view.editing === ''}
    ontoggle={() => onsection('bookmarks')}
    onadd={onaddmark}
    onopen={onopenmark}
    onedit={oneditmark}
    onretry={retryBookmarks}
/>
<Notes
    rows={held.notes}
    error={held.error}
    open={!view.collapsed.includes('notes')}
    ontoggle={() => onsection('notes')}
    onadd={onaddnote}
    onopen={(id: string) => onopennote(id, held.notes.find((one) => one.id === id)?.title ?? '')}
    onremove={onremovenote}
    onretry={retryNotes}
/>
<Workspaces
    current={saved.current}
    names={saved.workspaces.map((one) => one.name)}
    error={saved.error}
    open={!view.collapsed.includes('workspaces')}
    saving={view.form === 'workspace'}
    ontoggle={() => onsection('workspaces')}
    onsave={onsaveworkspace}
    onselect={onselectworkspace}
    onretry={retryWorkspaces}
/>
