<script module lang="ts">
    // Layer 3, view registration. The file browser opens the Explorer page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'files',
        label: 'views.files',
        glyph: 'views.files_glyph',
        group: 'explorer',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The roots of the current workspace as an explorer: the workspace picker and
    // the add-root control on the view's header, a filter and a breadcrumb over one tree per root,
    // each under a head carrying that root's icon controls, and the bookmarks, the notes and the
    // workspaces as sections under the trees in the same row style. Every control is drawn in every
    // state the view is in: a section whose file could not be read keeps its head and its control
    // and says why in its one row.
    //
    // A folder is read one level at a time, when it is opened: a root is a whole checkout and
    // walking one to draw it would read a hundred thousand names to show twenty. Which folders are
    // open, the selected row, the filter text, which sections are closed, which form is open, the
    // line typed into a root or a workspace form, the name being typed (`naming`) and the two
    // listing toggles live in the instance's own state, so a tree left half open is the same tree
    // after a reload, and two file browsers on two pages are open at two different places and list
    // the same folder each their own way. The refusal line (`note`) and the bookmark form's outcome
    // line (`said`) are kept there too, since each answers a form that comes back. What stays in
    // this component is the root the removal confirm is open for (`removing`).
    //
    // A write closes its form on its answer, which may land after the reader has opened another
    // form, opened the same one again or closed the tab. The instance id and the forms are taken
    // before the request goes, and the answer closes only that opening in that instance
    // (formSettled). A bookmark the file no longer holds closes its form in every file browser the
    // layout holds, which the fs store does on each bookmarks answer, since a file browser on a
    // page not drawn, or in a tab never shown, is mounted nowhere.
    //
    // The three sections are files/sections/Sections.svelte's, which reads the workspaces, the
    // bookmarks and the notes for itself and answers a read of any of them that failed. What this
    // view reads of them is what its tree and its bookmark form are built on: the roots of the
    // workspace in force, and the bookmarks the tree draws its stars from.
    //
    // Every root the configuration names is in every workspace and cannot be taken out of one, so a
    // workspace can only ever add. The server refuses a removal of a configured root as well; a
    // refusal that lives only in a view is a refusal that disappears with the next caller.
    //
    // A file opens in the view that can show it, which files/opening.ts decides from the file's own
    // first bytes. One click opens the pane's preview tab and a double click opens a tab that is
    // kept.
    //
    // A bookmark is a collection entry, so it is added and edited by the form every other
    // collection is edited by, over the schema its own file carries; the one thing this view
    // supplies is the list of roots a bookmark may name, since that is what the workspace in force
    // says and not what the file said when it was written. Its typed values are that form's drafts,
    // and closing the form by a control of this view forgets them through toggleAdd and toggleEdit,
    // as a collection view's own Add and Edit controls do.
    //
    // Another view shows a path here through the layout store's showInFiles, which writes the ask
    // into this instance's state; files/tree/ShowPath.svelte reads the folders on the way, opens
    // them, selects the path (or the nearest folder of it that is there, and says so) and scrolls
    // it into view.
    //
    // A tab with `follow: true` in its layout state is rooted at a session's workspace: the tree is
    // that folder as its own head, read through the root that holds it (tree/Follow.svelte). The
    // session is the one the tab pins in its layout state, and the selection when it pins none, as
    // the Changes view reads its session. A dragged file row carries its path.

    import Breadcrumb from '$lib/ui/tabs/Breadcrumb.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import BookmarkForm from './sections/BookmarkForm.svelte';
    import Controls from './tree/Controls.svelte';
    import RootForm from './sections/RootForm.svelte';
    import Sections from './sections/Sections.svelte';
    import ShowPath from './tree/ShowPath.svelte';
    import Follow from './tree/Follow.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import { refusal } from './tree/refusal';
    import { openBookmark, openRow } from './opening';
    import Tree from './tree/Tree.svelte';
    import type { Entry } from '$lib/state/boards/collection';
    import {
        collapseRoot,
        crumbsOf,
        editShown,
        filesViewOf,
        filterRows,
        followView,
        followedDirOf,
        formSettled,
        formShown,
        formsOf,
        markLabel,
        markSchemaFor,
        markedKeys,
        patchedFilesView,
        rowKey,
        setExpanded,
        shownOf,
        toggleExpanded,
        treeKey,
        treeRows,
        type FilesForms,
        type FsEntry,
        type FilesView,
        type RowRef,
        type TreeRow
    } from '$lib/state/sources/fs';
    import {
        bookmarkAt,
        bookmarkById,
        bookmarkTitles,
        currentWorkspace,
        fixedRootKeys,
        markRefusal,
        matchedNothing,
        openFailures,
        rootKeysOf,
        workspaceNames
    } from '$lib/state/sources/fs-transport';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        fs: {
            addBookmark,
            addRoot,
            bookmarks,
            bookmarksChanged,
            entries,
            heldEntries,
            invalidate,
            listing,
            readFileKind,
            relist,
            removeBookmark,
            removeRoot,
            saveWorkspace,
            selectWorkspace,
            shiftForms,
            workspaces
        },
        layout: { instanceLayoutState, keepPreview, openView },
        selection: { selected },
        selectors: { sessionById },
        terminals: { terminalById },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The store calls a file or a bookmark is opened through. */
    const opener = { openView, keepPreview, readFileKind };

    /** The root the removal confirm is open for, and the empty string while it is closed. */
    let removing = $state('');

    // Named `saved` rather than `state`: a variable called `state` in a component is read as the
    // store prefix of `$state`, which svelte-check refuses.
    const saved = $derived(workspaces());
    const current = $derived(currentWorkspace(saved));

    /** The session or terminal the tab follows: the one it pins, else the selection. */
    const followed = $derived(pinnedSession(instanceLayoutState(instance.id)) ?? selected());
    const follow = $derived(
        followView(
            instanceLayoutState(instance.id),
            current.roots,
            followedDirOf(sessionById(followed), terminalById(followed))
        )
    );
    const view = $derived(filesViewOf(instanceState(instance.id)));
    /** What this tab's listings show beside the default: its two toggles. */
    const listed = $derived(shownOf(view));
    const rows = $derived(
        treeRows(
            follow.roots,
            (root, path) => entries(root, path, listed),
            view.expanded,
            follow.top,
            view.naming
        )
    );
    const filtering = $derived(view.filter.trim() !== '');
    /** What the typed filter matches among the folders already read, or the tree when none is. */
    const shown = $derived(
        filtering ? filterRows(follow.roots, held, view.filter, follow.top) : rows
    );
    /** The selection's path, while the tree on screen draws the root it is under. */
    const crumbs = $derived(
        follow.roots.some((root) => root.key === view.selected?.root) ? crumbsOf(view.selected) : []
    );
    const fixed = $derived(fixedRootKeys(current.roots, follow.following));
    /** The root keys an ask to show a path is answered against, and null until they are read. */
    const rootKeys = $derived(rootKeysOf(saved));

    const marks = $derived(bookmarks());
    const editedMark = $derived(bookmarkById(marks.entries, view.editing));
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
    const marked = $derived(markedKeys(marks.entries));

    /** The bookmarks schema the form draws, its root field offering the workspace's roots. */
    const markSchema = $derived(markSchemaFor(marks.schema, current.roots));

    /**
     * The open folders on screen the server would not list. Without this a root whose directory
     * has moved is drawn as an open folder holding nothing, which is the one thing it is not. Only
     * a drawn row is asked: a folder remembered as open under a closed parent, or under a root the
     * workspace no longer has, is neither fetched nor named.
     */
    const failures = $derived(
        openFailures(rows, (root, path) => listing(root, path, listed).error)
    );

    /** The entries of one folder already read, as this tab's toggles list them. */
    function held(root: string, path: string): FsEntry[] | null {
        return heldEntries(root, path, listed);
    }

    /** Write part of what one instance remembers, keeping the rest of it as it was. */
    function patchAt(id: string, part: Partial<FilesView>): void {
        setInstanceState(id, patchedFilesView(instanceState(id), part));
    }

    /** Write part of what the instance on screen remembers, for a press made on it now. */
    function patch(part: Partial<FilesView>): void {
        patchAt(instance.id, part);
    }

    /**
     * Say what a request answered in the instance it was sent from, which the reader may have
     * switched away from by the time it lands. A tab closed meanwhile has no record left, and is
     * not given one back for a line nobody will see.
     */
    function answerAt(owner: string, part: Pick<Partial<FilesView>, 'note' | 'said'>): void {
        if (owner !== instance.id && instanceState(owner) === undefined) return;
        patchAt(owner, part);
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

    /** Select one row; the outcome line of an ask to show a path is about the row it selected. */
    function selectRow(row: RowRef): void {
        patch({ selected: { root: row.root, path: row.path }, revealed: null });
    }

    /** Flip one toggle, and read every folder held under the pair it now names again. */
    function flip(which: 'hidden' | 'ignored'): void {
        const next = { ...listed, [which]: !listed[which] };
        relist(next);
        patch(next);
    }

    /** Open or close one section under the trees. */
    function toggleSection(id: string): void {
        patch({ collapsed: toggleExpanded(view.collapsed, id) });
    }

    /**
     * Bookmark one file, or take the bookmark on it away again. The label is the file's name, or
     * its path under the root when another bookmark already carries that name; a label that is
     * taken even so is refused rather than written over, and the refusal is said.
     */
    async function bookmark(row: TreeRow): Promise<void> {
        const owner = instance.id;
        const found = bookmarkAt(marks.entries, row.root, row.path);
        const label = markLabel(row, bookmarkTitles(marks.entries));
        const answer =
            found === null
                ? await addBookmark({ label, root: row.root, path: row.path })
                : await removeBookmark(found.id);
        const reason = markRefusal(answer);
        answerAt(owner, { note: reason === '' ? '' : t('files.bookmark_failed', reason) });
    }

    async function remove(key: string): Promise<void> {
        const owner = instance.id;
        const answer = await removeRoot(key);
        answerAt(owner, { note: answer.ok ? '' : refusal(answer.error ?? '') });
    }

    /**
     * Add the root or save the workspace the open line form names. The form closes on the answer
     * only when it is still the opening the request went from, holding the same line: a form the
     * reader opened, reopened or typed on meanwhile stays as the reader left it, and a closed tab
     * is not given its record back.
     */
    async function confirm(): Promise<void> {
        const owner = instance.id;
        const asked = formsOf(view);
        const answer =
            asked.form === 'root' ? await addRoot(asked.typed) : await saveWorkspace(asked.typed);
        if (!answer.ok) {
            answerAt(owner, { note: refusal(answer.error ?? '') });
            return;
        }
        answerAt(owner, { note: '' });
        settle(owner, asked);
    }

    /**
     * Close the form an answer was for in the instance it was sent from, if it is still open as it
     * was. The bookmark form asks for it once Cancel, a save or a delete is done with it, when the
     * form has forgotten its own draft; a form the reader has since left is not closed.
     */
    function settle(owner: string, asked: FilesForms): void {
        const closed = formSettled(filesViewOf(instanceState(owner)), asked);
        if (closed !== null) patchAt(owner, closed);
    }

    async function select(name: string): Promise<void> {
        const owner = instance.id;
        const answer = await selectWorkspace(name);
        answerAt(owner, { note: answer.ok ? '' : refusal(answer.error ?? '') });
    }

    /** Move the file browser on screen to other forms, for a press made on it now. */
    function shift(next: FilesForms): void {
        shiftForms(instance.id, view, next);
    }

    /** Move to the forms a press asks for, clearing the lines that answered the last press. */
    function move(next: FilesForms): void {
        shift(next);
        patch({ note: '', said: '' });
    }

    function show(which: 'root' | 'workspace' | 'bookmark'): void {
        move(formShown(view, which));
    }

    /** Open the entry form over one bookmark, or close it when it is already that one's. */
    function edit(id: string): void {
        move(editShown(view, id));
    }

    /**
     * Open the bookmark form over the id its own save gave the bookmark. The form is drawn per
     * instance and per opening, and a rename moves neither, so the form stays as it is with what
     * was typed into it; the bookmark it edits is the one the file now holds, so the close of a
     * form over a bookmark that is gone has nothing to close.
     */
    function renameMark(owner: string, id: string): void {
        patchAt(owner, { editing: id });
    }
</script>

{#snippet tools()}
    <Controls
        current={saved.current}
        names={workspaceNames(saved)}
        adding={view.form === 'root'}
        shown={listed}
        owner={instance.id}
        followed={sessionById(followed) !== null || terminalById(followed) !== null
            ? followed
            : null}
        onselect={(name: string) => void select(name)}
        onshow={flip}
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
                note={view.note}
                oninput={(value: string) => patch({ typed: value })}
                onconfirm={() => void confirm()}
                oncancel={() => {
                    show(view.form === 'root' ? 'root' : 'workspace');
                }}
            />
        {:else if view.note !== ''}
            <p class="note" aria-live="polite">{view.note}</p>
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
                    onclose={settle}
                    onrenamed={renameMark}
                    onsaid={(owner: string, answer: string) => {
                        answerAt(owner, { said: answer });
                        bookmarksChanged();
                    }}
                />
            {/key}
        {/if}
        {#if view.said !== ''}
            <p class="said" aria-live="polite">{view.said}</p>
        {/if}
        <ShowPath
            owner={instance.id}
            {view}
            roots={rootKeys}
            rootsError={saved.error}
            rows={shown}
            onpatch={patchAt}
        />
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
        <Follow owner={instance.id} {follow} />
        {#if saved.error !== ''}
            <p class="note" aria-live="polite">{t('files.read_failed', saved.error)}</p>
        {:else if saved.loading}
            <Empty message={t('files.loading')} glyph={t('files.none_glyph')} />
        {:else if rows.length === 0}
            <!-- A tab following nothing, or a folder no root serves, has its own line above. -->
            {#if !follow.following || follow.found !== null}
                <Empty message={t('files.none')} glyph={t('files.none_glyph')} />
            {/if}
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
                roots={current.roots}
                {filtering}
                selected={view.selected}
                owner={instance.id}
                {fixed}
                {marked}
                onselect={selectRow}
                ontoggle={toggle}
                onopen={(row: TreeRow, preview: boolean) => void openRow(opener, row, preview)}
                onremove={(key: string) => (removing = key)}
                onbookmark={(row: TreeRow) => void bookmark(row)}
                onrefresh={invalidate}
                oncollapse={(root: string) =>
                    patch({ expanded: collapseRoot(view.expanded, root, follow.top?.path) })}
                onaddroot={view.form === 'root' ? undefined : () => show('root')}
            />
            {#if filtering && matchedNothing(shown)}
                <p class="said">{t('files.filter_none')}</p>
            {/if}
        {/if}
        <Sections
            owner={instance.id}
            {view}
            onsection={toggleSection}
            onaddmark={() => show('bookmark')}
            onopenmark={(entry: Entry) => openBookmark(opener, entry)}
            oneditmark={edit}
            onnote={(owner: string, note: string) => answerAt(owner, { note })}
            onsaveworkspace={() => show('workspace')}
            onselectworkspace={(name: string) => void select(name)}
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
