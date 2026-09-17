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
    // Layer 3, view. The roots of the current workspace as an explorer: the workspace picker and the
    // add-root control on the view's header, a filter and a breadcrumb over one tree per root, each
    // under a head carrying that root's icon controls, and the bookmarks, the notes and the
    // workspaces as sections under the trees in the same row style. Every control is drawn in every
    // state the view is in: a section whose file could not be read keeps its head and its control and
    // says why in its one row.
    //
    // A folder is read one level at a time, when it is opened: a root is a whole checkout and walking
    // one to draw it would read a hundred thousand names to show twenty. Which folders are open, the
    // selected row, the filter text, which sections are closed, which form is open and the line typed
    // into a root or a workspace form live in the instance's own state, so a tree left half open is
    // the same tree when the tab comes back, a form left open is open again with what was typed into
    // it, and two file browsers on two pages are open at two different places. What stays in this
    // component is what answers the press just made: the refusal line (`note`), the entry form's
    // outcome line (`said`) and the root the removal confirm is open for (`removing`), all gone after
    // a switch, since a pane mounts only its active tab.
    //
    // A write closes its form on its answer, which may land after the reader has opened another form,
    // opened the same one again or switched the tab away. The instance id and the forms are taken
    // before the request goes, and the answer closes only that opening in that instance
    // (formSettled): once the tab is switched, the `instance` prop reads the tab the pane shows now.
    //
    // Every root the configuration names is in every workspace and cannot be taken out of one, so a
    // workspace can only ever add. The server refuses a removal of a configured root as well; a
    // refusal that lives only in a view is a refusal that disappears with the next caller.
    //
    // A file opens in the view that can show it: a text file in the source tab, which is where it is
    // read and written, an HTML file in the document view, and a picture, a PDF or anything else in
    // the file view. Which of those a file is comes from its own first bytes, so the answer is
    // awaited before a tab is opened. One click opens the pane's preview tab and a double click
    // opens a tab that is kept.
    //
    // A bookmark is a collection entry, so it is added and edited by the form every other collection
    // is edited by, over the schema its own file carries; the one thing this view supplies is the
    // list of roots a bookmark may name, since that is what the workspace in force says and not what
    // the file said when it was written. Its typed values are that form's drafts, and closing the
    // form by a control of this view forgets them through toggleAdd and toggleEdit, as a collection
    // view's own Add and Edit controls do. A note opens as a tab and is a file in a folder of its own,
    // written by the first keystroke typed into it.

    import Breadcrumb from '$lib/ui/Breadcrumb.svelte';
    import Confirm from '$lib/ui/Confirm.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import BookmarkForm from './files/BookmarkForm.svelte';
    import Bookmarks from './files/Bookmarks.svelte';
    import Controls from './files/Controls.svelte';
    import Notes from './files/Notes.svelte';
    import RootForm from './files/RootForm.svelte';
    import Tree from './files/Tree.svelte';
    import Workspaces from './files/Workspaces.svelte';
    import type { Entry, SchemaField } from '$lib/state/collection';
    import { BOOKMARK_COLLECTION } from '$lib/state/fs.svelte';
    import {
        bookmarkLeft,
        collapseRoot,
        crumbsOf,
        editedGone,
        editShown,
        filesViewOf,
        filterRows,
        formSettled,
        formShown,
        formsOf,
        markLabel,
        nameOf,
        rowKey,
        setExpanded,
        toggleExpanded,
        treeKey,
        treeRows,
        typeOfFile,
        type FilesForms,
        type FilesView,
        type RowRef,
        type TreeRow
    } from '$lib/state/fs';
    import { documentState } from '$lib/state/layout';
    import { sourceTabState } from '$lib/state/source.svelte';
    import { noteId } from '$lib/state/notes';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        formDrafts: { toggleAdd, toggleEdit },
        fs: {
            addBookmark,
            addRoot,
            bookmarks,
            bookmarksChanged,
            deleteNote,
            entries,
            heldEntries,
            invalidate,
            listing,
            notes,
            readFileKind,
            removeBookmark,
            removeRoot,
            saveWorkspace,
            selectWorkspace,
            workspaces
        },
        layout: { closeRecord, keepPreview, openView },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** What the endpoint refused the last attempt with, in the reader's own words. */
    let note = $state('');
    /** What the entry form's last write answered, which is a report and not a refusal. */
    let said = $state('');
    /** The root the removal confirm is open for, and the empty string while it is closed. */
    let removing = $state('');

    // Named `saved` rather than `state`: a variable called `state` in a component is read as the
    // store prefix of `$state`, which svelte-check refuses.
    const saved = $derived(workspaces());
    const current = $derived(
        saved.workspaces.find((one) => one.name === saved.current) ?? { name: '', roots: [] }
    );
    const view = $derived(filesViewOf(instanceState(instance.id)));
    const rows = $derived(treeRows(current.roots, entries, view.expanded));
    const filtering = $derived(view.filter.trim() !== '');
    const shown = $derived(filtering ? filterRows(current.roots, heldEntries, view.filter) : rows);
    const crumbs = $derived(crumbsOf(view.selected));
    const fixed = $derived(current.roots.filter((one) => one.fixed).map((one) => one.key));

    const marks = $derived(bookmarks());
    const held = $derived(notes());
    const editedMark = $derived(marks.entries.find((one) => one.id === view.editing) ?? null);
    /**
     * Whether the bookmark form is drawn. A form open over a bookmark waits for the bookmarks to be
     * read, which after a reload arrive after the record saying the form is open. Drawn before them
     * it would be an add form where the edit form belongs: its Save would add a new bookmark, and
     * what was typed into the edit form would be hidden under it.
     */
    const markForm = $derived(
        view.form === 'bookmark' && (view.editing === '' || editedMark !== null)
    );

    /** The row keys a bookmark of the reader's own names, which the tree draws its star from. */
    const marked = $derived(
        marks.entries.flatMap((one) =>
            typeof one.fields.root === 'string' && typeof one.fields.path === 'string'
                ? [treeKey(one.fields.root, one.fields.path)]
                : []
        )
    );

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

    /** Write part of what one instance remembers, keeping the rest of it as it was. */
    function patchAt(id: string, part: Partial<FilesView>): void {
        const kept = instanceState(id);
        const keep = typeof kept === 'object' && kept !== null && !Array.isArray(kept) ? kept : {};
        setInstanceState(id, { ...keep, ...part });
    }

    /** Write part of what the instance on screen remembers, for a press made on it now. */
    function patch(part: Partial<FilesView>): void {
        patchAt(instance.id, part);
    }

    /**
     * Open or close one folder. While a filter draws the tree, a folder is drawn open because the
     * filter holds it so, and a press on it writes nothing, so clearing the filter gives back the
     * folders that were open before it.
     */
    function toggle(row: TreeRow): void {
        if (filtering) return;
        patch({ expanded: setExpanded(view.expanded, rowKey(row), !row.open) });
    }

    function selectRow(row: RowRef): void {
        patch({ selected: { root: row.root, path: row.path } });
    }

    /** Open or close one section under the trees. */
    function toggleSection(id: string): void {
        patch({ collapsed: toggleExpanded(view.collapsed, id) });
    }

    /**
     * Bookmark one file, or take the bookmark on it away again. The label is the file's name, or its
     * path under the root when another bookmark already carries that name; a label that is taken
     * even so is refused rather than written over, and the refusal is said.
     */
    async function bookmark(row: TreeRow): Promise<void> {
        const found = marks.entries.find(
            (one) => one.fields.root === row.root && one.fields.path === row.path
        );
        const label = markLabel(
            row,
            marks.entries.map((one) => one.title)
        );
        const answer =
            found === undefined
                ? await addBookmark({ label, root: row.root, path: row.path })
                : await removeBookmark(found.id);
        const reason = answer.ok
            ? answer.refused.map((one) => one.reason).join('; ')
            : (answer.error ?? '');
        note = reason === '' ? '' : t('files.bookmark_failed', reason);
    }

    /**
     * Open one file as its own tab, in the view that can show it. A text file is opened for editing,
     * which is what an editor does with every file it can read; an HTML file opens in the document
     * view, which gives it a frame of its own so its stylesheets and relative assets resolve; a
     * picture, a PDF and a file no editor could read open in the file view.
     *
     * Whether a file is text is its own first bytes, so the answer is awaited before a tab is opened.
     * A single click opens the pane's preview tab and a double click keeps the tab it opened.
     */
    async function open(row: TreeRow, preview: boolean): Promise<void> {
        const label = nameOf(row.path);
        const type = await readFileKind(row.root, row.path);
        const id =
            type.kind === 'html'
                ? openView(
                      'document',
                      documentState({ label, root: row.root, path: row.path }),
                      undefined,
                      { preview }
                  )
                : type.kind === 'text'
                  ? openView('source', sourceTabState(row.root, row.path), undefined, { preview })
                  : openView(
                        'file',
                        { root: row.root, path: row.path, label, size: row.size },
                        undefined,
                        { preview }
                    );
        if (!preview) keepPreview(id);
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

    /**
     * Add the root or save the workspace the open line form names. The form closes on the answer
     * only when it is still the opening the request went from, holding the same line: a form the
     * reader opened, reopened or typed on meanwhile stays as the reader left it, and a closed tab is
     * not given its record back.
     */
    async function confirm(): Promise<void> {
        const owner = instance.id;
        const asked = formsOf(view);
        const answer =
            asked.form === 'root' ? await addRoot(asked.typed) : await saveWorkspace(asked.typed);
        if (!answer.ok) {
            note = refusal(answer.error ?? '');
            return;
        }
        note = '';
        settle(owner, asked);
    }

    /** Close the form an answer was for in the instance it was sent from, if it is still open as it was. */
    function settle(owner: string, asked: FilesForms): void {
        const closed = formSettled(filesViewOf(instanceState(owner)), asked);
        if (closed !== null) patchAt(owner, closed);
    }

    async function select(name: string): Promise<void> {
        const answer = await selectWorkspace(name);
        note = answer.ok ? '' : refusal(answer.error ?? '');
    }

    /** Open one note. Its file is written by the first keystroke, so nothing is made here. */
    function addNote(): void {
        note = '';
        // The tab is told its note has no file yet, so it knows the note is empty without a round
        // trip and asks the server for nothing that is not there.
        openView('note', { id: noteId(new Date()), fresh: true });
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

    /**
     * Move to other forms. A bookmark form the move closes forgets its draft through the form drafts
     * store: the add form's through toggleAdd, one bookmark's through toggleEdit.
     */
    function shift(next: FilesForms): void {
        const left = bookmarkLeft(view, next);
        if (left !== null && left.editing === '') {
            toggleAdd(instance.id, BOOKMARK_COLLECTION, true);
        } else if (left !== null) {
            toggleEdit(instance.id, BOOKMARK_COLLECTION, left.editing, next.editing);
        }
        patch(next);
    }

    /** Move to the forms a press asks for, clearing the lines that answered the last press. */
    function move(next: FilesForms): void {
        shift(next);
        note = '';
        said = '';
    }

    // A bookmark taken away while its edit form is open, by the row star or on the disk, closes the
    // form and forgets what was typed into it, so the tab does not ask about text it no longer shows.
    $effect(() => {
        if (editedGone(view, marks)) shift(editShown(view, view.editing));
    });

    function show(which: 'root' | 'workspace' | 'bookmark'): void {
        move(formShown(view, which));
    }

    /** Open the entry form over one bookmark, or close it when it is already that one's. */
    function edit(id: string): void {
        move(editShown(view, id));
    }

    /**
     * Close the bookmark form, which asks once Cancel, a save or a delete is done with it; the form
     * has forgotten its own draft by then. A form the reader has since left is not closed.
     */
    function closeMark(owner: string, forms: FilesForms): void {
        settle(owner, forms);
    }
</script>

{#snippet tools()}
    <Controls
        current={saved.current}
        names={saved.workspaces.map((one) => one.name)}
        adding={view.form === 'root'}
        onselect={(name: string) => void select(name)}
        onadd={() => {
            show('root');
        }}
    />
{/snippet}

<Pane title={t('views.files')} toolbar={tools} tinted>
    <div class="files" data-instance={instance.id}>
        {#if view.form === 'root' || view.form === 'workspace'}
            <RootForm
                label={view.form === 'root' ? t('files.root_dir') : t('files.workspace_name')}
                help={view.form === 'root' ? t('files.root_dir_help') : ''}
                confirm={view.form === 'root' ? t('files.add') : t('files.save')}
                value={view.typed}
                {note}
                oninput={(value: string) => patch({ typed: value })}
                onconfirm={() => void confirm()}
                oncancel={() => {
                    show(view.form === 'root' ? 'root' : 'workspace');
                }}
            />
        {:else if note !== ''}
            <p class="note" aria-live="polite">{note}</p>
        {/if}
        {#if markForm}
            {#key `${instance.id} ${view.opening}`}
                <BookmarkForm
                    owner={instance.id}
                    forms={formsOf(view)}
                    schema={markSchema}
                    entry={editedMark}
                    initial={{ root: current.roots[0]?.key ?? '' }}
                    onadd={addBookmark}
                    onclose={closeMark}
                    onsaid={(answer: string) => {
                        said = answer;
                        bookmarksChanged();
                    }}
                />
            {/key}
        {/if}
        {#if said !== ''}
            <p class="said" aria-live="polite">{said}</p>
        {/if}
        <Search
            value={view.filter}
            placeholder={t('files.filter')}
            oninput={(value: string) => patch({ filter: value })}
        />
        {#if crumbs.length > 0}
            <Breadcrumb
                label={t('files.breadcrumb')}
                segments={crumbs.map((one) => ({ id: rowKey(one.row), label: one.label }))}
                onselect={(id: string) => {
                    const found = crumbs.find((one) => rowKey(one.row) === id);
                    if (found !== undefined) selectRow(found.row);
                }}
            />
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
                rows={shown}
                {filtering}
                selected={view.selected}
                {fixed}
                {marked}
                onselect={selectRow}
                ontoggle={toggle}
                onopen={(row: TreeRow, preview: boolean) => void open(row, preview)}
                onremove={(key: string) => (removing = key)}
                onbookmark={(row: TreeRow) => void bookmark(row)}
                onrefresh={invalidate}
                oncollapse={(root: string) =>
                    patch({ expanded: collapseRoot(view.expanded, root) })}
            />
            {#if filtering && shown.every((row) => row.depth === 0)}
                <p class="said">{t('files.filter_none')}</p>
            {/if}
        {/if}
        <Bookmarks
            rows={marks.entries}
            error={marks.error}
            open={!view.collapsed.includes('bookmarks')}
            editing={view.editing}
            adding={view.form === 'bookmark' && view.editing === ''}
            ontoggle={() => toggleSection('bookmarks')}
            onadd={() => {
                show('bookmark');
            }}
            onopen={openMark}
            onedit={edit}
        />
        <Notes
            rows={held.notes}
            error={held.error}
            open={!view.collapsed.includes('notes')}
            ontoggle={() => toggleSection('notes')}
            onadd={addNote}
            onopen={openNote}
            onremove={(id: string) => void dropNote(id)}
        />
        <Workspaces
            current={saved.current}
            names={saved.workspaces.map((one) => one.name)}
            open={!view.collapsed.includes('workspaces')}
            saving={view.form === 'workspace'}
            ontoggle={() => toggleSection('workspaces')}
            onsave={() => {
                show('workspace');
            }}
            onselect={(name: string) => void select(name)}
        />
    </div>
</Pane>

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

<style>
    .files {
        display: flex;
        flex-direction: column;
        gap: 4px;
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
