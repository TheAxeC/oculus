<script module lang="ts">
    // Layer 3, view registration. The file browser sits in the rail's Sources section, after the
    // collections the configuration names.
    import type { ViewRegistration } from './registry';

    export const registration: ViewRegistration = {
        id: 'files',
        label: 'views.files',
        glyph: 'views.files_glyph',
        group: 'sources',
        order: 4
    };
</script>

<script lang="ts">
    // Layer 3, view. The roots of the current workspace as one collapsible tree, the two lists the
    // reader keeps beside them, and the toolbar that adds to all three.
    //
    // A folder is read one level at a time, when it is opened: a root is a whole checkout and walking
    // one to draw it would read a hundred thousand names to show twenty. Which folders are open lives
    // in the instance's own state, so a tree left half open is the same tree when the tab comes back,
    // and two file browsers on two pages are open at two different places.
    //
    // Every root the configuration names is in every workspace and cannot be taken out of one, so a
    // workspace can only ever add. The server refuses a removal of a configured root as well; a
    // refusal that lives only in a view is a refusal that disappears with the next caller.
    //
    // A bookmark is a collection entry, so it is added and edited by the form every other collection
    // is edited by, over the schema its own file carries; the one thing this view supplies is the
    // list of roots a bookmark may name, since that is what the workspace in force says and not what
    // the file said when it was written. A note is a file in a folder of its own and opens as a tab.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import EntryForm from './shared/EntryForm.svelte';
    import Bookmarks from './files/Bookmarks.svelte';
    import Notes from './files/Notes.svelte';
    import RootForm from './files/RootForm.svelte';
    import Tree from './files/Tree.svelte';
    import Workspaces from './files/Workspaces.svelte';
    import type { Entry, SchemaField } from '$lib/state/collection';
    import { BOOKMARK_COLLECTION } from '$lib/state/fs.svelte';
    import {
        expandedOf,
        nameOf,
        toggleExpanded,
        treeKey,
        treeRows,
        typeOfFile,
        type TreeRow
    } from '$lib/state/fs';
    import { documentState } from '$lib/state/layout';
    import { noteId } from '$lib/state/notes';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        fs: {
            addBookmark,
            addRoot,
            bookmarks,
            bookmarksChanged,
            deleteNote,
            entries,
            listing,
            notes,
            removeRoot,
            saveNote,
            saveWorkspace,
            selectWorkspace,
            workspaces
        },
        layout: { closeRecord, openView },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** Which form the toolbar has open, if any. */
    let form: 'root' | 'workspace' | 'bookmark' | '' = $state('');
    /** What is typed into whichever line form is open. */
    let typed = $state('');
    /** The bookmark the entry form is editing, and the empty string while it is adding one. */
    let editing = $state('');
    /** What the endpoint refused the last attempt with, in the reader's own words. */
    let note = $state('');
    /** What the entry form's last write answered, which is a report and not a refusal. */
    let said = $state('');

    // Named `saved` rather than `state`: a variable called `state` in a component is read as the
    // store prefix of `$state`, which svelte-check refuses.
    const saved = $derived(workspaces());
    const current = $derived(
        saved.workspaces.find((one) => one.name === saved.current) ?? { name: '', roots: [] }
    );
    const expanded = $derived(expandedOf(instanceState(instance.id)));
    const rows = $derived(treeRows(current.roots, entries, expanded));
    const fixed = $derived(current.roots.filter((one) => one.fixed).map((one) => one.key));

    const marks = $derived(bookmarks());
    const held = $derived(notes());
    const editedMark = $derived(marks.entries.find((one) => one.id === editing) ?? null);

    /**
     * The bookmarks schema the form draws, with the roots of the workspace in force as the choices
     * of its root field. The file's own schema names the field and its type; which roots there are
     * is the reader's workspace and changes under it, so it is supplied here rather than written
     * into the file, where a root added later would not be one a bookmark could name.
     */
    const markSchema = $derived<SchemaField[]>(
        marks.schema.map((field) =>
            field.field === 'root'
                ? { ...field, options: current.roots.map((one) => one.key) }
                : field
        )
    );

    /**
     * The open folders on screen the server would not list. Without this a root whose directory
     * has moved is drawn as an open folder holding nothing, which is the one thing it is not. Only
     * a drawn row is asked: a folder remembered as open under a closed parent, or under a root the
     * workspace no longer has, is neither fetched nor named.
     */
    const failures = $derived(
        rows
            .filter((row) => row.open)
            .map((row) => ({
                root: row.root,
                path: row.path,
                error: listing(row.root, row.path).error
            }))
            .filter((one) => one.error !== '')
    );

    /** What one refusal code from the endpoint says to the reader. */
    function refusal(code: string): string {
        if (code === 'no-dir') return t('files.refused_no_dir');
        if (code === 'not-absolute') return t('files.refused_not_absolute');
        if (code === 'no-such-dir') return t('files.refused_no_such_dir');
        if (code === 'not-a-directory') return t('files.refused_not_a_directory');
        if (code === 'root-held') return t('files.refused_root_held');
        if (code === 'root-fixed') return t('files.refused_root_fixed');
        if (code === 'no-such-root') return t('files.refused_no_such_root');
        if (code === 'no-name') return t('files.refused_no_name');
        if (code === 'name-held') return t('files.refused_name_held');
        if (code === 'no-such-workspace') return t('files.refused_no_such_workspace');
        if (code === 'no-such-note') return t('files.refused_no_such_note');
        return t('files.refused_other', code);
    }

    /** Open or close one folder, which is the one thing this view remembers per instance. */
    function toggle(row: TreeRow): void {
        const kept = instanceState(instance.id);
        const keep = typeof kept === 'object' && kept !== null && !Array.isArray(kept) ? kept : {};
        setInstanceState(instance.id, {
            ...keep,
            expanded: toggleExpanded(expanded, treeKey(row.root, row.path))
        });
    }

    /**
     * Open one file as its own tab. An HTML file opens in the document view, which gives it a frame
     * of its own so its stylesheets and relative assets resolve; everything else opens in the file
     * view, which draws it by what its name says it is.
     */
    function open(row: TreeRow): void {
        const label = nameOf(row.path);
        if (typeOfFile(row.path).kind === 'html') {
            openView('document', documentState({ label, root: row.root, path: row.path }));
            return;
        }
        openView('file', { root: row.root, path: row.path, label, size: row.size });
    }

    /**
     * Open the file one bookmark names, under the label the reader gave it. A document is opened the
     * way the rail opens one, through documentState, so a bookmark pressed here and the same one
     * pressed there are the one tab.
     */
    function openMark(entry: Entry): void {
        const root = entry.fields.root;
        const path = entry.fields.path;
        if (typeof root !== 'string' || typeof path !== 'string') return;
        const mark = { label: entry.title, root, path };
        if (typeOfFile(path).kind === 'html') {
            openView('document', documentState(mark));
            return;
        }
        openView('file', { root, path, label: entry.title });
    }

    async function remove(key: string): Promise<void> {
        const answer = await removeRoot(key);
        note = answer.ok ? '' : refusal(answer.error ?? '');
    }

    async function confirm(): Promise<void> {
        const answer = form === 'root' ? await addRoot(typed) : await saveWorkspace(typed);
        if (!answer.ok) {
            note = refusal(answer.error ?? '');
            return;
        }
        note = '';
        typed = '';
        form = '';
    }

    async function select(name: string): Promise<void> {
        const answer = await selectWorkspace(name);
        note = answer.ok ? '' : refusal(answer.error ?? '');
    }

    /** Make one note, so its file is there before its tab is, and open it. */
    async function addNote(): Promise<void> {
        const id = noteId(new Date());
        const answer = await saveNote(id, '', '');
        if (!answer.ok) {
            note = refusal(answer.error ?? '');
            return;
        }
        note = '';
        // The tab is told the note is new, so it knows its note is empty without a round trip and a
        // tab closed at once does not leave an untouched note in the folder.
        openView('note', { id, fresh: true });
    }

    /** Open one note as its own tab, under the title it carries now. */
    function openNote(id: string): void {
        const row = held.notes.find((one) => one.id === id);
        openView('note', { id, label: row?.title ?? '' });
    }

    /** Take one note off the disk, and take its tab with it: what it drew is not there any more. */
    async function dropNote(id: string): Promise<void> {
        const answer = await deleteNote(id);
        note = answer.ok ? '' : refusal(answer.error ?? '');
        if (answer.ok) closeRecord('note', id);
    }

    function show(which: 'root' | 'workspace' | 'bookmark'): void {
        form = form === which && editing === '' ? '' : which;
        typed = '';
        editing = '';
        note = '';
        said = '';
    }

    /** Open the entry form over one bookmark, or close it when it is already that one's. */
    function edit(id: string): void {
        const same = form === 'bookmark' && editing === id;
        form = same ? '' : 'bookmark';
        editing = same ? '' : id;
        note = '';
        said = '';
    }

    function closeForm(): void {
        form = '';
        editing = '';
    }
</script>

{#snippet tools()}
    <Toolbar label={t('files.toolbar')}>
        <Workspaces
            current={saved.current}
            names={saved.workspaces.map((one) => one.name)}
            onselect={(name: string) => void select(name)}
        />
        <ToolButton
            label={t('files.add_root')}
            title={t('files.add_root_title')}
            expanded={form === 'root'}
            onclick={() => {
                show('root');
            }}
        />
        <ToolButton
            label={t('files.save_as')}
            title={t('files.save_as_title')}
            expanded={form === 'workspace'}
            onclick={() => {
                show('workspace');
            }}
        />
        <ToolButton
            label={t('files.add_bookmark')}
            title={t('files.add_bookmark_title')}
            expanded={form === 'bookmark' && editing === ''}
            onclick={() => {
                show('bookmark');
            }}
        />
        <ToolButton
            label={t('files.add_note')}
            title={t('files.add_note_title')}
            onclick={() => void addNote()}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.files')} toolbar={tools}>
    <div class="files" data-instance={instance.id}>
        {#if form === 'root' || form === 'workspace'}
            <RootForm
                label={form === 'root' ? t('files.root_dir') : t('files.workspace_name')}
                help={form === 'root' ? t('files.root_dir_help') : ''}
                confirm={form === 'root' ? t('files.add') : t('files.save')}
                value={typed}
                {note}
                oninput={(value: string) => {
                    typed = value;
                }}
                onconfirm={() => void confirm()}
                oncancel={() => {
                    show(form === 'root' ? 'root' : 'workspace');
                }}
            />
        {:else if note !== ''}
            <p class="note" aria-live="polite">{note}</p>
        {/if}
        {#if form === 'bookmark'}
            <EntryForm
                collection={BOOKMARK_COLLECTION}
                schema={markSchema}
                entry={editedMark}
                initial={{ root: current.roots[0]?.key ?? '' }}
                onadd={addBookmark}
                onclose={closeForm}
                onsaid={(answer: string) => {
                    said = answer;
                    bookmarksChanged();
                }}
            />
        {/if}
        {#if said !== ''}
            <p class="said" aria-live="polite">{said}</p>
        {/if}
        {#if saved.error !== ''}
            <p class="note" aria-live="polite">{t('files.read_failed', saved.error)}</p>
        {:else if saved.loading}
            <Empty message={t('files.loading')} glyph={t('files.none_glyph')} />
        {:else if rows.length === 0}
            <Empty message={t('files.none')} glyph={t('files.none_glyph')} />
        {:else}
            {#each saved.dropped as key (key)}
                <p class="note">{t('files.reserved', key)}</p>
            {/each}
            {#each failures as failure (treeKey(failure.root, failure.path))}
                <p class="note">
                    {t('files.listing_failed', failure.path || failure.root, failure.error)}
                </p>
            {/each}
            <Tree
                {rows}
                {fixed}
                ontoggle={toggle}
                onopen={open}
                onremove={(key: string) => void remove(key)}
            />
        {/if}
        {#if marks.error !== ''}
            <p class="note">{t('files.bookmarks_failed', marks.error)}</p>
        {:else if marks.entries.length > 0}
            <Bookmarks rows={marks.entries} {editing} onopen={openMark} onedit={edit} />
        {/if}
        {#if held.error !== ''}
            <p class="note">{t('files.notes_failed', held.error)}</p>
        {:else if held.notes.length > 0}
            <Notes
                rows={held.notes}
                onopen={openNote}
                onremove={(id: string) => void dropNote(id)}
            />
        {/if}
    </div>
</Pane>

<style>
    .files {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .note {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }

    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
