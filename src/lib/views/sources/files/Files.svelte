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
    // Layer 3, view. The workspace in force as an explorer: a header row for the workspace with its
    // four actions and its menu, every root as a top-level folder row under it, and under the tree
    // the outline and the timeline of the file in front of the reader, the bookmarks and the notes,
    // all in the same row style. The open editors of the page are a section above the tree. The
    // view's toolbar holds the follow toggle and the pin, and its bar the filter with the fuzzy
    // toggle. Every control is drawn in every state the view is in: a section whose file could not
    // be read keeps its head and its control and says why in its one row.
    //
    // A folder is read one level at a time, when it is opened: a root is a whole checkout and
    // walking one to draw it would read a hundred thousand names to show twenty. Which folders are
    // open, the selected row and the rows selected with it, the filter text, which sections are
    // closed or open, which form is open, the name being typed (`naming`) and the three listing
    // toggles (hidden files, ignored files, nested files) live in the instance's own state, so a
    // tree left half open is the same tree after a reload, and two file browsers on two pages are
    // open at two different places and list the same folder each their own way. The refusal line
    // (`note`) and the bookmark form's outcome line (`said`) are kept there too, since each answers
    // a form that comes back. What stays in this component is the root the removal confirm is open
    // for (`removing`). The writes into that state are control/tab-actions.ts's, and the
    // bookmark's are control/bookmark-actions.ts's.
    //
    // The sections are files/sections/'s: the outline and the timeline read what the active tab and
    // the selected file hold, the bookmarks and the notes read their own files and answer a read of
    // either that failed. What this view reads of them is what its tree and its bookmark form are
    // built on: the roots of the workspace in force, and the bookmarks the tree draws its stars
    // from. A bookmark is a collection entry, so it is added and edited by the form every other
    // collection is edited by, over the schema its own file carries; the one thing this view
    // supplies is the list of roots a bookmark may name, since that is what the workspace in force
    // says and not what the file said when it was written.
    //
    // The folders of the default workspace are the roots config/sources.yml lists, and those can be
    // taken out; every root the configuration names in a saved workspace is in it and cannot be,
    // and the server refuses that removal as well, since a refusal that lives only in a view
    // disappears with the next caller. Add Folder to Workspace opens the folder panel (POST
    // /api/folders/pick) and adds what it returns; the workspace menu items and Open Folder open
    // the palette with their command typed, where state/workbench/palette.ts runs them.
    //
    // A tab rooted at a folder (its `top`) or following a session draws the folder as the head of
    // its tree, with a `..` row above a rooted one, and no workspace header. A folder outside every
    // root that Open Folder found is said above the tree with the control that adds it. A tab with
    // `follow: true` in its layout state is rooted at a session's workspace: the tree is that
    // folder as its own head, read through the root that holds it (tree/Follow.svelte). The session
    // is the one the tab pins in its layout state, and the selection when it pins none.
    //
    // A file opens in the view that can show it, which files/opening.ts decides from the file's own
    // first bytes. One click opens the pane's preview tab and a double click opens a tab that is
    // kept. Another view shows a path here through the layout store's showInFiles, which writes the
    // ask into this instance's state; files/tree/ShowPath.svelte reads the folders on the way,
    // opens them, selects the path (or the nearest folder of it that is there, and says so) and
    // scrolls it into view.

    import { untrack } from 'svelte';
    import Breadcrumb from '$lib/ui/tabs/Breadcrumb.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import BookmarkForm from './sections/BookmarkForm.svelte';
    import Controls from './header/Controls.svelte';
    import Filters from './header/Filters.svelte';
    import Outside from './header/Outside.svelte';
    import OpenEditors from './sections/OpenEditors.svelte';
    import Sections from './sections/Sections.svelte';
    import WorkspaceHeader from './header/WorkspaceHeader.svelte';
    import ShowPath from './tree/ShowPath.svelte';
    import Follow from './tree/Follow.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import { refusal } from '$lib/state/sources/explorer/acts/refusal';
    import { addedLine } from '$lib/state/sources/explorer/acts/folders';
    import { isLineForm } from '$lib/state/sources/fs';
    import { selectPruned, selectionChanged } from '$lib/state/sources/explorer/acts/selection';
    import { sectionOpen } from '$lib/state/sources/explorer/sections/section-state';
    import { bookmarkActions } from './control/bookmark-actions';
    import { tabActions } from './control/tab-actions';
    import { openBookmark, openRow } from './opening';
    import Tree from './tree/Tree.svelte';
    import type { Entry } from '$lib/state/boards/collection';
    import {
        crumbsOf,
        filesViewOf,
        filterRows,
        followView,
        followedDirOf,
        formsOf,
        markSchemaFor,
        markedKeys,
        nestingRulesOf,
        rootedView,
        rowKey,
        shownOf,
        statusFold,
        treeKey,
        treeRows,
        type FsEntry,
        type RowRef,
        type TreeRow
    } from '$lib/state/sources/fs';
    import {
        bookmarkById,
        currentWorkspace,
        fixedRootsOf,
        matchedNothing,
        openFailures,
        rootKeysOf
    } from '$lib/state/sources/fs-transport';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        explorer,
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
            removeRoot,
            workspaces
        },
        layout: { instanceLayoutState, keepPreview, openView, showInFiles },
        selection: { selected },
        selectors: { configMap, gitFor, gitRoots, sessionById },
        terminals: { terminalById },
        ui: { instanceState, requestPalette }
    } = client;

    let { instance }: ViewProps = $props();

    /** The store calls a file or a bookmark is opened through. */
    const opener = { openView, keepPreview, readFileKind, showInFiles };

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
    /** The folder a rooted tab is drawn from, and the roots and the `..` row that goes with it. */
    const rooted = $derived(rootedView(follow.following ? null : view.top, current.roots));
    const shownRoots = $derived(
        follow.following ? follow.roots : rooted.rooted ? rooted.roots : current.roots
    );
    const top = $derived(follow.following ? follow.top : rooted.top);
    /** Whether the tree starts with the workspace header: a rooted or a following tab has none. */
    const headed = $derived(!follow.following && !rooted.rooted);
    /** What this tab's listings show beside the default: its two toggles. */
    const listed = $derived(shownOf(view));
    /** The nesting rules the tab draws with: the catalog's, or none while File Nesting is off. */
    const nesting = $derived(view.nesting ? nestingRulesOf(configMap()) : []);
    const rows = $derived(
        treeRows(
            shownRoots,
            (root, path) => entries(root, path, listed),
            view.expanded,
            top,
            view.naming,
            { held, nesting, up: rooted.up }
        )
    );
    const filtering = $derived(view.filter.trim() !== '');
    /** What the typed filter matches among the folders already read, or the tree when none is. */
    const shown = $derived(
        filtering ? filterRows(shownRoots, held, view.filter, top, view.fuzzy) : rows
    );
    /** The selection's path, while the tree on screen draws the root it is under. */
    const crumbs = $derived(
        shownRoots.some((root) => root.key === view.selected?.root) ? crumbsOf(view.selected) : []
    );
    /**
     * The roots the reader cannot take off. In the default workspace the folders of sources.yml's
     * `roots:` can be taken off.
     */
    const fixed = $derived(fixedRootsOf(current, follow.following, configMap()));
    /** The root keys an ask to show a path is answered against, and null until they are read. */
    const rootKeys = $derived(rootKeysOf(saved));
    /** What git says of the paths under the repositories the page carries. */
    const fold = $derived(
        statusFold(
            gitRoots().flatMap((dir) => {
                const git = gitFor(dir);
                return git !== null && git.repository && git.error === null ? [{ dir, git }] : [];
            })
        )
    );
    /** Whether the roots show under the workspace header. */
    const headerOpen = $derived(sectionOpen(view, 'files'));
    /** The file the timeline is of: the selected row when it is a file. */
    const selectedFile = $derived.by<RowRef | null>(() => {
        const at = view.selected;
        if (at === null) return null;
        const row = rows.find((one) => one.root === at.root && one.path === at.path);
        return row?.kind === 'file' ? { root: at.root, path: at.path } : null;
    });

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

    const tab = tabActions({
        client,
        id: () => instance.id,
        view: () => view,
        listed: () => listed,
        rows: () => rows,
        shownRoots: () => shownRoots,
        top: () => top,
        filtering: () => filtering
    });
    const { patch, patchAt, answerAt, toggle, selectRow, flip, toggleSection } = tab;
    const marking = bookmarkActions({
        client,
        id: () => instance.id,
        view: () => view,
        entries: () => marks.entries,
        tab
    });

    // The root and workspace line forms are not opened by any control now; a record saved with one
    // open is closed, since its typed text has no form to show it.
    $effect(() => {
        if (isLineForm(view.form)) untrack(() => patch({ form: '', typed: '' }));
    });

    // A refresh that no longer lists a selected row takes it out of the selection.
    $effect(() => {
        const now = { selected: view.selected, selection: view.selection, anchor: view.anchor };
        const next = selectPruned(now, held);
        if (selectionChanged(now, next)) untrack(() => patch(next));
    });

    /**
     * Add Folder to Workspace: the panel's folders become roots, and the line says what was left.
     */
    async function addFolders(): Promise<void> {
        const owner = instance.id;
        const answer = await explorer.addFolders();
        answerAt(owner, { note: addedLine(answer, refusal) });
    }

    /** Add the folder Open Folder found outside every root, and drop the line that offered it. */
    async function addOutside(): Promise<void> {
        const owner = instance.id;
        const dir = view.outside;
        const answer = await addRoot(dir);
        answerAt(owner, { note: answer.ok ? '' : refusal(answer.error ?? '') });
        if (answer.ok) patchAt(owner, { outside: '' });
    }

    async function remove(key: string): Promise<void> {
        const owner = instance.id;
        const answer = await removeRoot(key);
        answerAt(owner, { note: answer.ok ? '' : refusal(answer.error ?? '') });
    }
</script>

{#snippet tools()}
    <Controls
        owner={instance.id}
        followed={sessionById(followed) !== null || terminalById(followed) !== null
            ? followed
            : null}
    />
{/snippet}

{#snippet bar()}
    <Filters
        value={view.filter}
        fuzzy={view.fuzzy}
        onfilter={(value: string) => patch({ filter: value })}
        onfuzzy={() => patch({ fuzzy: !view.fuzzy })}
    />
{/snippet}

{#snippet header(nav: TreeNav)}
    <WorkspaceHeader
        {nav}
        label={current.name === '' ? t('files.workspace_default') : current.name}
        open={headerOpen}
        hidden={listed.hidden}
        ignored={listed.ignored}
        nesting={view.nesting}
        ontoggle={() => toggleSection('files')}
        onnewfile={() => tab.newItem('file')}
        onnewfolder={() => tab.newItem('folder')}
        onrefresh={invalidate}
        oncollapse={tab.collapseAll}
        onflip={flip}
        onaddfolder={() => void addFolders()}
        onswitch={() => requestPalette(':workspace ')}
        onsave={() => requestPalette(':workspace-save ')}
        onopenfolder={() => requestPalette(':folder')}
    />
{/snippet}

<Pane title={t('views.files')} toolbar={tools} {bar} tinted>
    <div class="files" data-instance={instance.id}>
        <OpenEditors
            open={sectionOpen(view, 'editors')}
            ontoggle={() => toggleSection('editors')}
        />
        {#if view.note !== ''}
            <Empty error message={view.note} />
        {/if}
        {#if view.outside !== ''}
            <Outside
                dir={view.outside}
                onadd={() => void addOutside()}
                ondismiss={() => patch({ outside: '' })}
            />
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
                    onclose={marking.settle}
                    onrenamed={marking.renameMark}
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
            <Empty error message={t('files.read_failed', saved.error)} />
        {:else if saved.loading}
            <Empty message={t('files.loading')} glyph={t('files.none_glyph')} />
        {:else if rows.length === 0}
            <!-- A tab following nothing, or a folder no root serves, has its own line above. -->
            {#if !follow.following || follow.found !== null}
                <Empty message={t('files.none')} glyph={t('files.none_glyph')} />
            {/if}
        {:else}
            {#each saved.dropped as key (key)}
                <Empty error message={t('files.reserved', key)} />
            {/each}
            {#each failures as failure (treeKey(failure.root, failure.path))}
                <Empty
                    error
                    message={t('files.listing_failed', failure.path || failure.root, failure.error)}
                />
            {/each}
            <Tree
                rows={shown}
                roots={current.roots}
                {filtering}
                selected={view.selected}
                owner={instance.id}
                {fixed}
                {marked}
                {fold}
                header={headed ? header : undefined}
                {headerOpen}
                onselect={selectRow}
                ontoggle={toggle}
                onopen={(row: TreeRow, preview: boolean) => void openRow(opener, row, preview)}
                onremove={(key: string) => (removing = key)}
                onbookmark={(row: TreeRow) => void marking.bookmark(row)}
                onup={(to: RowRef) => patch({ top: to })}
                onaddroot={() => void addFolders()}
            />
            {#if filtering && matchedNothing(shown)}
                <Empty message={t('files.filter_none')} glyph={t('files.none_glyph')} />
            {/if}
        {/if}
        <Sections
            owner={instance.id}
            {view}
            selected={selectedFile}
            onsection={toggleSection}
            onaddmark={marking.showMarkForm}
            onopenmark={(entry: Entry) => openBookmark(opener, entry)}
            oneditmark={marking.edit}
            onnote={(owner: string, note: string) => answerAt(owner, { note })}
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

    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
