<script module lang="ts">
    // Layer 3, view registration. References is the fourth view of the Explorer page's group, after
    // Search, so it is reached by the chord `s4`.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'references',
        label: 'views.references',
        glyph: 'views.references_glyph',
        group: 'explorer',
        order: 3
    };
</script>

<script lang="ts">
    // Layer 3, view. The locations a language server answered for Find All References, Find All
    // Implementations, Show Call Hierarchy (the call sites of a symbol) or Show Type Hierarchy (the
    // types above and below it) of a source tab's file, as VS Code's References view draws them:
    // the count line ("<n> results in <m> files"), then a tree of one row per file (its icon, its
    // name, its folder and its count) with a row per location under it (its line and its text, the
    // match marked), a press on a location opening its file in a source tab at the line with the
    // word at the match selected. A library file a server named is a row of its own name; its press
    // opens the read-only library tab, which says the file is no longer open when the page was
    // reloaded.
    //
    // A call or type hierarchy result is a tree of the symbols the server named instead: a row for
    // each (its name and the server's detail), a press opening the symbol, and the arrow, the arrow
    // keys and the row's control opening it one level, which asks the server for the next level of
    // calls or types. The pane's header then holds a button that reads the tree the other way round
    // (incoming and outgoing calls, supertypes and subtypes).
    //
    // The pane's header holds Refresh, Clear, Clear History and Collapse All. A row's right-click
    // offers Copy, Copy Path and Dismiss, and a right-click on the count line Copy All. A cleared
    // view says "No results." and, while it has a history, lists the last ten searches of the
    // instance, each as "<title>: <word>", a press running it again. F4 and Shift+F4 walk the
    // locations of the latest result from the source tab's editor (source/language/lsp.ts).
    //
    // The result and the history are the instance's own state, kept with the layout
    // (state/system/machine/lsp/references.svelte.ts), so a saved page draws the result it had
    // without asking a server. A search is run again by the editor that holds its file, which a
    // history row opens when no tab holds it.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { openReference } from '../../shared/links/source-file';
    import { nameOf } from '$lib/state/sources/fs';
    import {
        DIRECTIONS,
        pickOf,
        rowsOf,
        type HierarchyDirection,
        type RefNode
    } from '$lib/state/system/machine/lsp/hierarchy';
    import {
        picks,
        searchKey,
        totals,
        type RefFile,
        type RefLine,
        type RefSearch
    } from '$lib/state/system/machine/lsp/references';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const { references } = client;

    let { instance }: ViewProps = $props();

    const held = $derived(references.refsState(instance.id));
    const sums = $derived(totals(held.files));
    /** The files closed by the reader or by Collapse All, by their key. */
    let closed: string[] = $state([]);

    const key = (file: RefFile): string => JSON.stringify([file.root, file.path]);
    /** The file a row names: a library file by its own name, since its path is an address. */
    const shown = (file: RefFile): string => file.library ?? file.path;
    const lineKey = (file: RefFile, one: RefLine): string =>
        JSON.stringify([file.root, file.path, one.line, one.start]);

    /** The rows of a hierarchy's tree, and the rows the tree's keys read. */
    const nodes = $derived(held.hierarchy === null ? [] : rowsOf(held.hierarchy.nodes));
    const nodeRows = $derived(
        (held.hierarchy?.nodes ?? []).map((node) => ({
            id: node.id,
            parent: node.parent,
            open: node.open
        }))
    );

    /** The direction a hierarchy is read the other way round in, and the words of both. */
    const other = $derived.by((): HierarchyDirection | null => {
        const way = held.hierarchy?.direction;
        if (way === undefined) return null;
        const pair: readonly HierarchyDirection[] =
            way === 'incoming' || way === 'outgoing' ? DIRECTIONS.calls : DIRECTIONS.types;
        return pair.find((one) => one !== way) ?? null;
    });

    function directionWords(way: HierarchyDirection): string {
        switch (way) {
            case 'incoming':
                return t('references.direction_incoming');
            case 'outgoing':
                return t('references.direction_outgoing');
            case 'supertypes':
                return t('references.direction_supertypes');
            case 'subtypes':
                return t('references.direction_subtypes');
        }
    }

    const rows = $derived(
        held.files.flatMap((file) => [
            { id: key(file), parent: null, open: !closed.includes(key(file)) },
            ...file.lines.map((one) => ({ id: lineKey(file, one), parent: key(file) }))
        ])
    );

    /** The count line, in VS Code's four forms. */
    const count = $derived.by(() => {
        if (held.hierarchy !== null) return directionWords(held.hierarchy.direction);
        if (sums.locations === 1 && sums.files === 1) return t('references.count_one');
        if (sums.locations === 1) return t('references.count_one_result', sums.files);
        if (sums.files === 1) return t('references.count_one_file', sums.locations);
        return t('references.count', sums.locations, sums.files);
    });

    /** The word a search is titled by: what it asked, then the word under the caret. */
    function titleOf(search: RefSearch): string {
        switch (search.kind) {
            case 'implementations':
                return t('references.title_implementations');
            case 'calls':
                return t('references.title_calls');
            case 'types':
                return t('references.title_types');
            case 'references':
                return t('references.title_references');
        }
    }

    const title = $derived(held.search === null ? t('views.references') : titleOf(held.search));

    function folderOf(path: string): string {
        const at = path.lastIndexOf('/');
        return at < 0 ? '' : path.slice(0, at);
    }

    /** A location's text without its indentation, and the match's place in what is left. */
    function partsOf(one: RefLine): { before: string; match: string; after: string } {
        const lead = one.text.length - one.text.trimStart().length;
        const start = Math.max(0, one.start - lead);
        const end = Math.max(start, one.end - lead);
        const text = one.text.trimStart();
        return {
            before: text.slice(0, start),
            match: text.slice(start, end),
            after: text.slice(end)
        };
    }

    function ontoggle(id: string): void {
        closed = closed.includes(id) ? closed.filter((one) => one !== id) : [...closed, id];
    }

    function collapseAll(): void {
        closed = held.files.map(key);
    }

    function open(file: RefFile, one: RefLine): void {
        openReference(client, file, one.line, one.start + 1);
    }

    function openNode(node: RefNode): void {
        const at = pickOf(node);
        openReference(client, at, at.line, at.column);
    }

    /** The calls the page lets a hierarchy ask the server for, and the file opened when it must. */
    const opening = {
        open: (
            file: { root: string; path: string; library?: string },
            line: number,
            column: number
        ) => openReference(client, file, line, column)
    };

    function toggleNode(id: string): void {
        void references.openNode(instance.id, id, opening);
    }

    /** Run a search again through the editor that holds its file. */
    function again(search: RefSearch): void {
        void references.rerun(instance.id, search, {
            open: (file, line, column) => openReference(client, file, line, column)
        });
    }

    function copy(text: string): void {
        void navigator.clipboard.writeText(text).catch(() => undefined);
    }

    /** What a row's right-click offers: Copy, Copy Path and Dismiss. */
    function rowMenu(): MenuItem[] {
        return [
            { id: 'copy', label: t('references.copy') },
            { id: 'copy_path', label: t('references.copy_path') },
            { id: 'dismiss', label: t('references.dismiss') }
        ];
    }

    function pickFile(id: string, file: RefFile): void {
        if (id === 'copy')
            copy(
                picks([file])
                    .map((one) => `${shown(file)}:${one.line}:${one.column}`)
                    .join('\n')
            );
        else if (id === 'copy_path') copy(shown(file));
        else references.dismissFile(instance.id, file.root, file.path);
    }

    function pickLine(id: string, file: RefFile, one: RefLine): void {
        if (id === 'copy') copy(one.text.trim());
        else if (id === 'copy_path')
            copy(`${shown(file)}:${String(one.line)}:${String(one.start + 1)}`);
        else references.dismissLine(instance.id, file.root, file.path, one.line, one.start);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('references.actions')} overflow>
        <ToolButton
            bare
            label={t('references.refresh')}
            glyph="refresh"
            disabled={held.search === null}
            onclick={() => held.search !== null && again(held.search)}
        />
        <ToolButton
            bare
            label={t('references.clear')}
            glyph="clear"
            disabled={held.search === null}
            onclick={() => references.clear(instance.id)}
        />
        <ToolButton
            bare
            label={t('references.clear_all_history')}
            glyph="clear_all"
            disabled={held.history.length === 0}
            onclick={() => references.clearHistory(instance.id)}
        />
        <ToolButton
            bare
            label={t('references.collapse_all')}
            glyph="collapse_all"
            disabled={held.files.length === 0}
            onclick={collapseAll}
        />
        {#if other !== null}
            <ToolButton
                bare
                label={directionWords(other)}
                glyph="hierarchy_swap"
                onclick={() => void references.reverse(instance.id, opening)}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools} tinted>
    <div
        class="references"
        data-instance={instance.id}
        onfocusin={() => references.latest(instance.id)}
    >
        {#if held.search === null || (held.hierarchy === null ? held.files.length : nodes.length) === 0}
            <Empty
                message={held.history.length === 0
                    ? t('references.empty')
                    : t('references.empty_history')}
                glyph="references"
            />
            {#if held.history.length > 0}
                <ul class="history" data-references-history>
                    {#each held.history as search (searchKey(search))}
                        <li>
                            <ToolButton
                                label={t('references.history_row', titleOf(search), search.word)}
                                title={t('references.history_title', titleOf(search), search.word)}
                                onclick={() => again(search)}
                            />
                        </li>
                    {/each}
                </ul>
            {/if}
        {:else}
            <ContextMenu
                label={t('references.results')}
                items={[{ id: 'copy_all', label: t('references.copy_all') }]}
                onpick={() => copy(references.copyAll(instance.id))}
            >
                <p class="count" data-references-count>{count}</p>
            </ContextMenu>
            <div class="results">
                {#if held.hierarchy !== null}
                    <TreeView label={t('references.results')} rows={nodeRows} ontoggle={toggleNode}>
                        {#snippet children(nav: TreeNav)}
                            <ul class="files" role="none">
                                {#each nodes as { node, depth } (node.id)}
                                    <li role="none" data-references-node={node.id}>
                                        <TreeItem
                                            label={node.name}
                                            id={node.id}
                                            {nav}
                                            level={depth + 1}
                                            {depth}
                                            expanded={node.open}
                                            title={t(
                                                'references.line_title',
                                                node.library ?? node.path,
                                                String(node.line)
                                            )}
                                            onclick={() => openNode(node)}
                                        >
                                            {#snippet detail()}{node.detail ||
                                                    nameOf(node.library ?? node.path)}{/snippet}
                                            {#snippet actions(tabindex: number)}
                                                <ToolButton
                                                    bare
                                                    label={node.open
                                                        ? t('references.collapse_node')
                                                        : t('references.expand_node')}
                                                    glyph="chevron"
                                                    {tabindex}
                                                    onclick={() => toggleNode(node.id)}
                                                />
                                            {/snippet}
                                        </TreeItem>
                                    </li>
                                {/each}
                            </ul>
                        {/snippet}
                    </TreeView>
                {:else}
                    <TreeView label={t('references.results')} {rows} {ontoggle}>
                        {#snippet children(nav: TreeNav)}
                            <ul class="files" role="none">
                                {#each held.files as file (key(file))}
                                    <li
                                        class="file"
                                        role="none"
                                        data-references-file={`${file.root}:${file.path}`}
                                    >
                                        <ContextMenu
                                            label={nameOf(shown(file))}
                                            items={rowMenu()}
                                            onpick={(id: string) => pickFile(id, file)}
                                        >
                                            <TreeItem
                                                label={nameOf(shown(file))}
                                                id={key(file)}
                                                {nav}
                                                level={1}
                                                file={shown(file)}
                                                expanded={!closed.includes(key(file))}
                                                count={file.lines.length}
                                                badge
                                                title={t('references.file_title', shown(file))}
                                                onclick={() => ontoggle(key(file))}
                                            >
                                                {#snippet detail()}{folderOf(shown(file))}{/snippet}
                                            </TreeItem>
                                        </ContextMenu>
                                        {#if !closed.includes(key(file))}
                                            <ul class="lines" role="none">
                                                {#each file.lines as one (lineKey(file, one))}
                                                    {@const parts = partsOf(one)}
                                                    <li
                                                        class="line"
                                                        role="none"
                                                        data-references-line={`${file.path}:${one.line}`}
                                                    >
                                                        <ContextMenu
                                                            label={`${shown(file)}:${String(one.line)}`}
                                                            items={rowMenu()}
                                                            onpick={(id: string) =>
                                                                pickLine(id, file, one)}
                                                        >
                                                            <TreeItem
                                                                label={`${shown(file)}:${String(one.line)}`}
                                                                id={lineKey(file, one)}
                                                                {nav}
                                                                level={2}
                                                                depth={1}
                                                                title={t(
                                                                    'references.line_title',
                                                                    shown(file),
                                                                    String(one.line)
                                                                )}
                                                                onclick={() => open(file, one)}
                                                            >
                                                                {#snippet words()}
                                                                    <span class="number"
                                                                        >{one.line}</span
                                                                    >
                                                                    <span class="text"
                                                                        >{parts.before}<strong
                                                                            class="match"
                                                                            >{parts.match}</strong
                                                                        >{parts.after}</span
                                                                    >
                                                                {/snippet}
                                                            </TreeItem>
                                                        </ContextMenu>
                                                    </li>
                                                {/each}
                                            </ul>
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        {/snippet}
                    </TreeView>
                {/if}
            </div>
        {/if}
    </div>
</Pane>

<style>
    .references {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 6px;
        height: 100%;
        min-height: 0;
    }

    .count {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .results {
        min-height: 0;
        overflow: auto;
    }

    .files,
    .lines,
    .history {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .number {
        flex: 0 0 auto;
        margin-right: 6px;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }

    .text {
        min-width: 0;
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        white-space: pre;
    }

    .match {
        color: var(--accent-txt, var(--accent));
        font-weight: 700;
    }
</style>
