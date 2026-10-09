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
    // four actions and its menu, every root as a top-level folder row under it, and, in the same
    // row style, the open editors of the page, the outline, clangd's AST and Memory Usage while the
    // file tab the reader looked at last holds an answer, the timeline of that tab, the bookmarks
    // and the notes. The sections are drawn in the order the tab keeps (`sections`, open editors
    // first and the tree second until the reader drags a head or presses Alt+Up or Alt+Down on it).
    // The view's toolbar holds the follow toggle and the pin, and its bar the filter with the fuzzy
    // toggle. Every control is drawn in every state the view is in: a section whose file could not
    // be read keeps its head and its control and says why in its one row.
    //
    // A folder is read one level at a time, when it is opened: a root is a whole checkout and
    // walking one to draw it would read a hundred thousand names to show twenty. Which folders are
    // open, the selected row and the rows selected with it, the filter text, which sections are
    // closed or open, the name being typed (`naming`) and the three listing toggles (hidden files,
    // ignored files, nested files) live in the instance's own state, so a tree left half open is
    // the same tree after a reload, and two file browsers on two pages are open at two different
    // places and list the same folder each their own way. The refusal line (`note`) is kept there
    // too. The tree is built by shared/explorer/rooted-tree.svelte.ts and drawn by
    // shared/explorer/RootedTree.svelte, the tree a project card draws as well; the writes into the
    // state are shared/explorer/control/tab-actions.ts's, and the bookmark's are
    // shared/explorer/control/bookmark-actions.ts's. What stays in this view is what only a Files
    // tab has: the workspace header, follow mode, the rooted tab and the sections.
    //
    // The sections are files/sections/'s: the outline and clangd's two read the file tab shown last
    // on the page, the timeline the file pinned, else the one selected, else the one of the file
    // tab shown last, the bookmarks and the notes read their own files and answer a read of either
    // that failed. What this view reads of them is the bookmarks the tree draws its stars from. A
    // bookmark is added by the star on a file and renamed and removed on its row in the Bookmarks
    // section; the file `~/.oculus/bookmarks.yml` is under no served root, so no form or source tab
    // edits it.
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
    import Controls from './header/Controls.svelte';
    import Filters from './header/Filters.svelte';
    import MessageLine from './MessageLine.svelte';
    import OpenEditors from './sections/OpenEditors.svelte';
    import Sections from './sections/Sections.svelte';
    import WorkspaceHeader from './header/WorkspaceHeader.svelte';
    import Follow from '$lib/views/shared/explorer/tree/Follow.svelte';
    import Outside from '$lib/views/shared/explorer/Outside.svelte';
    import RootedTree from '$lib/views/shared/explorer/RootedTree.svelte';
    import ShowPath from '$lib/views/shared/explorer/tree/ShowPath.svelte';
    import { createRootedTree, readWorkspace } from '$lib/views/shared/explorer/rooted-tree.svelte';
    import { openBookmark } from '$lib/views/shared/explorer/opening';
    import { isLineForm, revealLine } from '$lib/state/sources/fs';
    import { refusal } from '$lib/state/sources/explorer/acts/refusal';
    import { sectionOpen } from '$lib/state/sources/explorer/sections/section-state';
    import { followedTab } from '$lib/state/sources/explorer/sections/followed-tab';
    import { createListDrag } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import { fileOfTab } from '$lib/state/workbench/navigation/pages';
    import { panes } from '$lib/state/workbench/layout';
    import type { Entry } from '$lib/state/boards/collection';
    import {
        filesViewOf,
        followView,
        followedDirOf,
        rootedView,
        type RowRef
    } from '$lib/state/sources/fs';
    import { rootKeysOf } from '$lib/state/sources/fs-transport';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        explorer: { panelOpen },
        fs: { addRoot, invalidate, orderRoots },
        layout: { activeInstance, currentPage, instanceLayoutState, layout },
        clangd,
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

    const page = $derived(currentPage().id);
    /** The file tab the reader looked at last on the page, which the outline sections read. */
    const lastFile = $derived(
        followedTab(
            panes(layout(page)).map((one) => one.pane),
            activeInstance(page)?.id ?? null,
            (one) => fileOfTab(one) !== null
        )
    );

    /**
     * The sections whose heads are drawn, which are the ones a drop may land on: the tree's head
     * only while the view draws a workspace header, and clangd's two only while the file tab holds
     * an answer. The ones left out keep their place in `view.sections`.
     */
    const drawnSections = $derived(
        view.sections.filter((id) => {
            if (id === 'files') return headed;
            if (id === 'ast') return lastFile !== null && clangd.ast(lastFile.id) !== null;
            if (id === 'memory') return lastFile !== null && clangd.memory(lastFile.id) !== null;
            return true;
        })
    );

    /** The drags and the Alt+Up and Alt+Down steps of the section heads over each other. */
    const sectionDrag = createListDrag({
        type: 'application/x-oculus-section',
        order: () => view.sections,
        drawn: () => drawnSections,
        write: (order: string[]) => patch({ sections: order })
    });
    const sectionMove = (id: string) => ({
        drag: sectionDrag.row(id),
        step: (direction: 'up' | 'down') => sectionDrag.step(id, direction)
    });

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

    /**
     * The one line the view says, laid over its foot: that the folder panel is open while it is,
     * else the refusal, else the outcome of an ask to show a path, with what clears it.
     */
    const message = $derived.by(() => {
        if (panelOpen()) return { text: t('files.picker_busy'), error: false, clear: {} };
        if (view.note !== '') return { text: view.note, error: true, clear: { note: '' } };
        const shown = revealLine(view.revealed);
        return shown === '' ? null : { text: shown, error: false, clear: { revealed: null } };
    });

    /** Escape in the view takes the line away, unless a control inside it used the key. */
    function escaped(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || event.defaultPrevented || message === null) return;
        patch(message.clear);
    }

    /** Write the new order of the movable roots, and say a refusal in the message line. */
    async function reorderRoots(keys: string[]): Promise<void> {
        const owner = instance.id;
        const answer = await orderRoots(keys);
        answerAt(owner, { note: answer.ok ? '' : refusal(answer.error ?? '') });
    }

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
        panelOpen={panelOpen()}
        onswitch={() => requestPalette(':workspace ')}
        onsave={() => requestPalette(':workspace-save ')}
        onopenfolder={() => requestPalette(':folder')}
        drag={sectionDrag.row('files')}
    />
{/snippet}

{#snippet editorsSection()}
    <OpenEditors
        open={sectionOpen(view, 'editors')}
        ontoggle={() => toggleSection('editors')}
        move={sectionMove('editors')}
    />
{/snippet}

{#snippet treeSection()}
    {#if view.outside !== ''}
        <Outside
            dir={view.outside}
            onadd={() => void addOutside(view.outside)}
            ondismiss={() => patch({ outside: '' })}
        />
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
            onreorder={headed ? (keys: string[]) => void reorderRoots(keys) : undefined}
            onmoveheader={(direction: 'up' | 'down') => sectionDrag.step('files', direction)}
        />
    {/if}
{/snippet}

<Pane title={t('views.files')} toolbar={tools} {bar} tinted>
    <!-- Escape bubbles up from the tree and the sections; the view only reads what they left. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="files" data-instance={instance.id} onkeydown={escaped}>
        <Sections
            owner={instance.id}
            {view}
            selected={selectedFile}
            followed={lastFile}
            order={view.sections}
            move={sectionMove}
            editors={editorsSection}
            files={treeSection}
            onsection={toggleSection}
            onpatch={patch}
            onopenmark={(entry: Entry) => openBookmark(tree.opener, entry)}
            onrenamemark={(id: string, label: string) => void marking.rename(id, label)}
            onremovemark={(id: string) => void marking.remove(id)}
            onnote={(owner: string, note: string) => answerAt(owner, { note })}
        />
        <MessageLine
            message={message?.text ?? ''}
            error={message?.error ?? false}
            onclose={() => patch(message?.clear ?? {})}
        />
    </div>
</Pane>

<style>
    /* The view fills the pane, so the message line at its end sits at the pane's foot. */
    .files {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        min-height: 100%;
    }
</style>
