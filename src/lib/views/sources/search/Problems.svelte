<script module lang="ts">
    // Layer 3, view registration. Problems is the last of the eight views of the Explorer page's
    // group (orders 0, 1, 2, 3, 5, 6 and 7 are Files, Repositories, Search, References, LaTeX, the
    // debug view and the debug console), so it is reached by the chord `s8`, and its badge is the
    // number of problems the page holds.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'problems',
        label: 'views.problems',
        glyph: 'views.problems_glyph',
        group: 'explorer',
        order: 8,
        badge: (client) => client.railBadges.problemsBadge(),
        badgeTitle: (client) => client.railBadges.problemsBadgeTitle()
    };
</script>

<script lang="ts">
    // Layer 3, view. The problems of the page as VS Code's Problems view draws them: the errors,
    // warnings and infos of the language servers, of the project commands that were run, of the
    // LaTeX builds and of the linters (state/system/problems.svelte.ts), in a tree of one row per
    // file with a row per problem under it. A file row is its icon, its name, its folder and its
    // count; a problem row is its severity, its message, its source with the code in brackets and
    // its place as `[Ln l, Col c]`. A code that has a documentation page is drawn as a link: a
    // press on it opens the page, and the row's menu offers Show Documentation.
    //
    // A single press on a problem opens its file in the preview tab at the problem's range with the
    // keyboard kept here, so the list can be walked on; Enter or a double press opens a tab that
    // is kept, with the keyboard in the editor. A press on a file row folds it. A problem of a
    // file in no served root draws its path and opens nothing. A row of the table opens by the same
    // handlers as a row of the tree.
    //
    // The box under the header filters (views/sources/search/problem-rows.ts): comma-separated
    // terms, a term with a glob character a path glob and any other term text, `!` before a term
    // excluding what it matches. The buttons beside it show or hide the errors, the warnings and
    // the infos, and limit the list to the file the reader is in. A root the view was opened for
    // (the TeX view's Show Problems) is a chip beside the box that lists that root's problems alone
    // until it is dismissed. A tab limited to a folder of a root (a workbench's) lists the problems
    // of the files under that folder alone, with the line "In root/folder" and the control that
    // takes the folder away (views/shared/links/FolderLine.svelte). The header holds Collapse All
    // and View as Table, which lists every row the filter keeps in a table, whichever files the
    // tree has folded. A right-click on a problem offers Copy, which copies the marker as JSON, and
    // Copy Message.
    //
    // The filter, the buttons and the root are the instance's own state, kept with the page.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import type { Column } from '$lib/ui/display/table/table-rows';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import FolderLine from '$lib/views/shared/links/FolderLine.svelte';
    import { servesRoot } from '$lib/state/sources/fs-transport';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import { opens, type Problem } from '$lib/state/system/problems.svelte';
    import { instanceFlag, instanceMap, instanceText } from '$lib/state/workbench/layout';
    import { t } from '$lib/state/shared/words/text';
    import { webAddress } from '$lib/state/system/machine/lint/lint-model';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import {
        copyText,
        entriesOf,
        rowEntriesOf,
        fileFolder,
        fileName,
        filterFiles,
        positionText,
        severityLook,
        sourceText
    } from './problem-rows';

    const client = useState();
    const {
        fs: { workspaces },
        problems,
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const raw = $derived(instanceState(instance.id));
    const text = $derived(instanceText(raw, 'filter'));
    const hideErrors = $derived(instanceFlag(raw, 'hideErrors'));
    const hideWarnings = $derived(instanceFlag(raw, 'hideWarnings'));
    const hideInfos = $derived(instanceFlag(raw, 'hideInfos'));
    const activeOnly = $derived(instanceFlag(raw, 'activeOnly'));
    const asTable = $derived(instanceFlag(raw, 'asTable'));
    /** The root the tab was opened for, the empty text for every root. */
    const scope = $derived(instanceText(raw, 'scope'));
    /** The folder under that root the tab is limited to, the empty text for the whole root. */
    const under = $derived(instanceText(raw, 'under'));
    /** Whether the root the tab is limited to is one this workspace serves. */
    const served = $derived(scope === '' || servesRoot(workspaces(), scope));
    /** The files the reader closed, or that Collapse All closed. */
    let closed: string[] = $state([]);

    const held = $derived(problems.fold().files);
    const active = $derived.by(() => {
        const here = activeOnly ? problems.here() : null;
        return here === null ? null : { root: here.root, path: here.path };
    });
    const shown = $derived(
        filterFiles(held, {
            text,
            errors: !hideErrors,
            warnings: !hideWarnings,
            infos: !hideInfos,
            activeOnly,
            active,
            scope,
            under
        })
    );
    const entries = $derived(entriesOf(shown, closed));
    const places = $derived(new Map(entries.map((entry, at) => [entry.id, at])));
    const keyRows = $derived(
        entries.map((entry) =>
            entry.kind === 'file'
                ? { id: entry.id, parent: null, open: entry.open }
                : { id: entry.id, parent: entry.parent }
        )
    );
    const rowEntries = $derived(rowEntriesOf(shown));

    function patch(change: Record<string, unknown>): void {
        setInstanceState(instance.id, { ...instanceMap(raw), ...change });
    }

    function toggle(id: string): void {
        closed = closed.includes(id) ? closed.filter((one) => one !== id) : [...closed, id];
    }

    function clearScope(): void {
        patch({ scope: '', under: '' });
    }

    /** The word a severity is told in, in the row's severity cell. */
    function severityWord(severity: Problem['severity']): string {
        if (severity === 'error') return t('problems.severity_error');
        return severity === 'warning'
            ? t('problems.severity_warning')
            : t('problems.severity_info');
    }

    /** Open a problem's place: kept with the keyboard in the editor, else previewed in place. */
    function show(row: Problem, kept: boolean): void {
        problems.open(row, { kept, focus: kept, leaving: null });
    }

    /**
     * A press: on the code's link it opens the page, else Enter (no click count) keeps the tab and
     * a first click previews it.
     */
    function pressed(row: Problem, event: MouseEvent): void {
        if (webAddress(row.href) !== null && event.target instanceof Element) {
            if (event.target.closest('[data-code-link]') !== null) {
                documentation(row);
                return;
            }
        }
        if (event.detail > 1) return;
        show(row, event.detail === 0);
    }

    function copy(value: string): void {
        void navigator.clipboard.writeText(value).catch(() => undefined);
    }

    /** The menu of a row: the copies, and the documentation of a code that has a page. */
    function rowMenu(row: Problem): MenuItem[] {
        return [
            { id: 'copy', label: t('problems.copy') },
            { id: 'copy_message', label: t('problems.copy_message') },
            ...(webAddress(row.href) === null
                ? []
                : [{ id: 'documentation', label: t('problems.show_documentation') }])
        ];
    }

    function picked(id: string, row: Problem): void {
        if (id === 'documentation') documentation(row);
        else copy(id === 'copy' ? copyText(row) : row.message);
    }

    /** Open the page that documents a row's code. */
    function documentation(row: Problem): void {
        const address = webAddress(row.href);
        if (address !== null) window.open(address, '_blank', 'noopener,noreferrer');
    }

    /** The first line of a message, which is what a row draws; the tooltip holds all of it. */
    function firstLine(message: string): string {
        return message.split('\n', 1)[0];
    }

    const tableColumns = $derived([
        { key: 'severity', label: t('problems.col_severity'), width: '2.5em' },
        { key: 'message', label: t('problems.col_message') },
        { key: 'source', label: t('problems.col_source') },
        { key: 'file', label: t('problems.col_file') },
        { key: 'position', label: t('problems.col_position'), numeric: true }
    ]);
    const tableRows = $derived(
        rowEntries.map((entry) => ({
            id: entry.id,
            severity: entry.row.severity,
            message: firstLine(entry.row.message),
            source: sourceText(entry.row),
            file: entry.file.library ?? entry.file.path,
            position: positionText(entry.row)
        }))
    );
    const byId = $derived(new Map(rowEntries.map((entry) => [entry.id, entry.row])));
</script>

{#snippet tools()}
    <Toolbar label={t('problems.actions')} overflow>
        <ToolButton
            bare
            label={t('problems.collapse_all')}
            glyph="collapse_all"
            disabled={shown.length === 0 || asTable}
            onclick={() => (closed = shown.map((file) => file.key))}
        />
        <ToolButton
            bare
            label={asTable ? t('problems.as_tree') : t('problems.as_table')}
            glyph={asTable ? 'view_tree' : 'list'}
            pressed={asTable}
            onclick={() => patch({ asTable: !asTable })}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('problems.toolbar')}>
        <Search
            fill
            value={text}
            placeholder={t('problems.filter')}
            oninput={(value: string) => patch({ filter: value })}
        />
        {#if scope !== '' && under === ''}
            <ToolButton
                small
                label={t('problems.scope', scope)}
                glyph="dismiss"
                title={t('problems.scope_title')}
                onclick={clearScope}
            />
        {/if}
        <ToolButton
            bare
            label={t('problems.errors')}
            glyph="cross"
            pressed={!hideErrors}
            onclick={() => patch({ hideErrors: !hideErrors })}
        />
        <ToolButton
            bare
            label={t('problems.warnings')}
            glyph="warn"
            pressed={!hideWarnings}
            onclick={() => patch({ hideWarnings: !hideWarnings })}
        />
        <ToolButton
            bare
            label={t('problems.infos')}
            glyph="info"
            pressed={!hideInfos}
            onclick={() => patch({ hideInfos: !hideInfos })}
        />
        <ToolButton
            bare
            label={t('problems.active_only')}
            glyph="paper"
            pressed={activeOnly}
            onclick={() => patch({ activeOnly: !activeOnly })}
        />
        {#if under !== ''}
            <FolderLine
                text={t('problems.in_folder', scope, under)}
                clear={t('problems.clear_scope')}
                title={t('problems.clear_scope_title')}
                onclear={clearScope}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('views.problems')} toolbar={tools} {bar} tinted>
    <div class="problems" data-instance={instance.id} data-problems>
        {#if !served}
            <Empty message={t('problems.root_gone', scope)} glyph="info" />
        {:else if entries.length === 0}
            <Empty
                message={held.length === 0 ? t('problems.empty') : t('problems.filtered_empty')}
                glyph="info"
            />
        {:else if asTable}
            <Table columns={tableColumns} rows={tableRows} rowKey="id">
                {#snippet cell(row: Record<string, unknown>, column: Column)}
                    {@const problem = byId.get(String(row.id))}
                    {#if column.key === 'severity' && problem !== undefined}
                        {@const look = severityLook(problem.severity)}
                        <span style={look.style}>{severityWord(problem.severity)}</span>
                    {:else if column.key === 'message' && problem !== undefined && opens(problem)}
                        <ToolButton
                            plain
                            label={String(row.message)}
                            title={problem.message}
                            onclick={(event: MouseEvent) => pressed(problem, event)}
                            ondblclick={() => show(problem, true)}
                        />
                    {:else}
                        {String(row[column.key])}
                    {/if}
                {/snippet}
            </Table>
        {:else}
            <TreeView label={t('problems.results')} rows={keyRows} ontoggle={toggle}>
                {#snippet children(nav: TreeNav)}
                    <ul class="entries" role="none">
                        <VirtualRows
                            count={entries.length}
                            key={(at: number) => entries[at].id}
                            {nav}
                            owns={(id: string) => places.get(id) ?? -1}
                            label={(id: string) => {
                                const at = places.get(id);
                                if (at === undefined) return undefined;
                                const entry = entries[at];
                                return entry.kind === 'file'
                                    ? fileName(entry.file)
                                    : entry.row.message;
                            }}
                        >
                            {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                                {@const entry = entries[at]}
                                {#if entry.kind === 'file'}
                                    <li
                                        role="none"
                                        data-problem-file={entry.file.key}
                                        {@attach measure}
                                    >
                                        <TreeItem
                                            label={fileName(entry.file)}
                                            file={fileName(entry.file)}
                                            id={entry.id}
                                            {nav}
                                            level={1}
                                            expanded={entry.open}
                                            count={entry.file.rows.length}
                                            badge
                                            title={entry.file.library ?? entry.file.path}
                                            onclick={() => toggle(entry.id)}
                                        >
                                            {#snippet detail()}{fileFolder(entry.file)}{/snippet}
                                        </TreeItem>
                                    </li>
                                {:else if entry.kind === 'row'}
                                    {@const row = entry.row}
                                    {@const look = severityLook(row.severity)}
                                    <li role="none" data-problem={entry.id} {@attach measure}>
                                        <ContextMenu
                                            label={firstLine(row.message)}
                                            items={rowMenu(row)}
                                            onpick={(id: string) => picked(id, row)}
                                        >
                                            <TreeItem
                                                label={firstLine(row.message)}
                                                glyph={look.glyph}
                                                glyphStyle={look.style}
                                                id={entry.id}
                                                {nav}
                                                level={2}
                                                depth={1}
                                                title={row.message}
                                                onclick={opens(row)
                                                    ? (event: MouseEvent) => pressed(row, event)
                                                    : undefined}
                                                onpressagain={opens(row)
                                                    ? () => show(row, true)
                                                    : undefined}
                                            >
                                                {#snippet detail()}
                                                    {#if webAddress(row.href) !== null && row.code !== undefined}
                                                        <span class="source"
                                                            >{row.source}(<span
                                                                class="code"
                                                                data-code-link>{row.code}</span
                                                            >)</span
                                                        >
                                                    {:else}
                                                        <span class="source">{sourceText(row)}</span
                                                        >
                                                    {/if}
                                                    <span class="position">{positionText(row)}</span
                                                    >
                                                {/snippet}
                                            </TreeItem>
                                        </ContextMenu>
                                    </li>
                                {/if}
                            {/snippet}
                        </VirtualRows>
                    </ul>
                {/snippet}
            </TreeView>
        {/if}
    </div>
</Pane>

<style>
    .problems {
        min-height: 0;
    }

    .entries {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .position {
        font-family: var(--font-num);
    }

    .code {
        color: var(--accent);
        text-decoration: underline;
        cursor: pointer;
    }
</style>
