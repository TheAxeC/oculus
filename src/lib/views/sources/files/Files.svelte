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
    // the outline, clangd's AST and Memory Usage while the file tab the reader looked at last holds
    // an answer, and the timeline of that tab, the bookmarks and the notes, all in the same row
    // style. The open editors of the page are a section above the tree.
    // The view's toolbar holds the follow toggle and the pin, and its bar the filter with the fuzzy
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
    // a form that comes back. The tree is built by shared/explorer/rooted-tree.svelte.ts and drawn
    // by shared/explorer/RootedTree.svelte, the tree a project card draws as well; the writes into
    // the state are shared/explorer/control/tab-actions.ts's, and the bookmark's are
    // shared/explorer/control/bookmark-actions.ts's. What stays in this view is what only a Files
    // tab has: the workspace header, follow mode, the rooted tab, the sections and the bookmark
    // form.
    //
    // The sections are files/sections/'s: the outline and clangd's two read the file tab shown last
    // on the page, the timeline the file pinned, else the one selected, else the one of the file
    // tab shown last, the bookmarks and the notes read their own files and answer a read of either
    // that failed. What this view reads of them is what its tree and its bookmark form are built
    // on: the roots of the workspace in force, and the bookmarks the tree draws its stars from. A
    // bookmark is a collection entry, so it is added and edited by the form every other collection
    // is edited by, over the schema its own file carries; the one thing this view supplies is the
    // list of roots a bookmark may name, since that is what the workspace in force says and not
    // what the file said when it was written.
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
    // A file opens in the view that can show it, which shared/explorer/opening.ts decides from the
    // file's own first bytes. One click opens the pane's preview tab and a double click opens a tab
    // that is kept. Another view shows a path here through the layout store's showInFiles, which
    // writes the ask into this instance's state; shared/explorer/tree/ShowPath.svelte reads the
    // folders on the way, opens them, selects the path (or the nearest folder of it that is there,
    // and says so) and scrolls it into view.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import BookmarkForm from './sections/BookmarkForm.svelte';
    import Controls from './header/Controls.svelte';
    import Filters from './header/Filters.svelte';
    import OpenEditors from './sections/OpenEditors.svelte';
    import Sections from './sections/Sections.svelte';
    import WorkspaceHeader from './header/WorkspaceHeader.svelte';
    import Follow from '$lib/views/shared/explorer/tree/Follow.svelte';
    import Outside from '$lib/views/shared/explorer/Outside.svelte';
    import RootedTree from '$lib/views/shared/explorer/RootedTree.svelte';
    import ShowPath from '$lib/views/shared/explorer/tree/ShowPath.svelte';
    import { createRootedTree, readWorkspace } from '$lib/views/shared/explorer/rooted-tree.svelte';
    import { openBookmark } from '$lib/views/shared/explorer/opening';
    import { isLineForm } from '$lib/state/sources/fs';
    import { refusal } from '$lib/state/sources/explorer/acts/refusal';
    import { sectionOpen } from '$lib/state/sources/explorer/sections/section-state';
    import type { Entry } from '$lib/state/boards/collection';
    import {
        filesViewOf,
        followView,
        followedDirOf,
        formsOf,
        markSchemaFor,
        rootedView,
        type RowRef
    } from '$lib/state/sources/fs';
    import { bookmarkById, rootKeysOf } from '$lib/state/sources/fs-transport';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        fs: { addBookmark, addRoot, bookmarksChanged, invalidate },
        layout: { instanceLayoutState },
        selection: { selected },
        selectors: { sessionById },
        terminals: { terminalById },
        ui: { instanceState, requestPalette }
    } = client;

    let { instance }: ViewProps = $props();

    const view = $derived(filesViewOf(instanceState(instance.id)));
    const workspace = readWorkspace(client);
    const saved = $derived(workspace.saved);
    const current = $derived(workspace.current);

    /** The session or terminal the tab follows: the one it pins, else the selection. */
    const followed = $derived(pinnedSession(instanceLayoutState(instance.id)) ?? selected());
    const follow = $derived(
        followView(
            instanceLayoutState(instance.id),
            current.roots,
            followedDirOf(sessionById(followed), terminalById(followed))
        )
    );
    /** The folder a rooted tab is drawn from, and the roots and the `..` row that goes with it. */
    const rooted = $derived(rootedView(follow.following ? null : view.top, current.roots));
    const shownRoots = $derived(
        follow.following ? follow.roots : rooted.rooted ? rooted.roots : current.roots
    );
    const top = $derived(follow.following ? follow.top : rooted.top);
    /** Whether the tree starts with the workspace header: a rooted or a following tab has none. */
    const headed = $derived(!follow.following && !rooted.rooted);

    const tree = createRootedTree(client, {
        workspace,
        owner: () => instance.id,
        roots: () => shownRoots,
        top: () => top,
        up: () => rooted.up,
        following: () => follow.following
    });
    const { tab, marking } = tree;
    const { patch, patchAt, answerAt, flip, toggleSection } = tab;

    /** Add the folder Open Folder found outside every root, and drop the line that offered it. */
    async function addOutside(dir: string): Promise<void> {
        const owner = instance.id;
        const answer = await addRoot(dir);
        answerAt(owner, { note: answer.ok ? '' : refusal(answer.error ?? '') });
        if (answer.ok) patchAt(owner, { outside: '' });
    }
    /** The root keys an ask to show a path is answered against, and null until they are read. */
    const rootKeys = $derived(rootKeysOf(saved));
    /** Whether the roots show under the workspace header. */
    const headerOpen = $derived(sectionOpen(view, 'files'));
    /** The file the timeline is of unless it is pinned: the selected row when it is a file. */
    const selectedFile = $derived.by<RowRef | null>(() => {
        const at = view.selected;
        if (at === null) return null;
        const row = tree.rows.find((one) => one.root === at.root && one.path === at.path);
        return row?.kind === 'file' ? { root: at.root, path: at.path } : null;
    });

    const editedMark = $derived(bookmarkById(tree.marks.entries, view.editing));
    /**
     * Whether the bookmark form is drawn. A form open over a bookmark waits for the bookmarks to be
     * read, which after a reload arrive after the record saying the form is open. Drawn before them
     * it would be an add form where the edit form belongs: its Save would add a new bookmark, and
     * what was typed into the edit form would be hidden under it.
     */
    const markForm = $derived(
        view.form === 'bookmark' && (view.editing === '' || editedMark !== null)
    );

    /** The bookmarks schema the form draws, its root field offering the workspace's roots. */
    const markSchema = $derived(markSchemaFor(tree.marks.schema, current.roots));

    // The root and workspace line forms are not opened by any control now; a record saved with one
    // open is closed, since its typed text has no form to show it.
    $effect(() => {
        if (isLineForm(view.form)) untrack(() => patch({ form: '', typed: '' }));
    });
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
        hidden={tree.listed.hidden}
        ignored={tree.listed.ignored}
        nesting={view.nesting}
        ontoggle={() => toggleSection('files')}
        onnewfile={() => tab.newItem('file')}
        onnewfolder={() => tab.newItem('folder')}
        onrefresh={invalidate}
        oncollapse={tab.collapseAll}
        onflip={flip}
        onaddfolder={() => void tree.addFolders()}
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
                onadd={() => void addOutside(view.outside)}
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
            rows={tree.shown}
            onpatch={patchAt}
        />
        <Follow owner={instance.id} {follow} />
        {#if saved.error !== ''}
            <Empty error message={t('files.read_failed', saved.error)} />
        {:else if saved.loading}
            <Empty message={t('files.loading')} glyph={t('files.none_glyph')} />
        {:else if tree.rows.length === 0}
            <!-- A tab following nothing, or a folder no root serves, has its own line above. -->
            {#if !follow.following || follow.found !== null}
                <Empty message={t('files.none')} glyph={t('files.none_glyph')} />
            {/if}
        {:else}
            {#each saved.dropped as key (key)}
                <Empty error message={t('files.reserved', key)} />
            {/each}
            <RootedTree
                {tree}
                {workspace}
                owner={instance.id}
                header={headed ? header : undefined}
                {headerOpen}
            />
        {/if}
        <Sections
            owner={instance.id}
            {view}
            selected={selectedFile}
            onsection={toggleSection}
            onpatch={patch}
            onaddmark={marking.showMarkForm}
            onopenmark={(entry: Entry) => openBookmark(tree.opener, entry)}
            oneditmark={marking.edit}
            onnote={(owner: string, note: string) => answerAt(owner, { note })}
        />
    </div>
</Pane>

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
