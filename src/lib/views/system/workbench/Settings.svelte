<script module lang="ts">
    // Layer 3, view registration. Settings opens the System page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'settings',
        label: 'views.settings',
        glyph: 'views.settings_glyph',
        group: 'views',
        order: 0,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. The Settings editor over the options catalog (config/options/), drawn as VS
    // Code's: a search with the count of the settings found, the scope bar, a table of contents on
    // the left, and a list of groups. The groups are a subject heading for each part of the
    // configuration (Appearance, Editor, Terminal and the rest, each with a line per defaults file
    // it draws from, whose Show Defaults shows oculus's file read-only), the machine's own file in
    // the This machine scope, and one each for oculus's catalog, schema and text files. Each
    // setting is an item with its control and its default; no row opens a user's file.
    //
    // The scope bar (settings/scopes/ScopeBar.svelte) picks the file every row reads and writes:
    // Workspace (the open workspace file's `settings:`, with its `primary` and its folders' names
    // set above the rows, settings/scopes/WorkspaceRows.svelte), Primary hub (the primary's
    // `.oculus/config.yml`), Hub (a picked hub's), This machine (a picked hub's
    // `.oculus/local.yml`) and Repository (a picked repository's `.oculus/settings.yml`). A scope
    // draws only the keys its file takes (state/system/config/scopes/). The scope on screen is the
    // tab's instance state; the hubs and repositories its picker offers follow the workspace at
    // each push, and a scope whose hub or folder left falls back to Workspace. Every control holds
    // its change as an unsaved change of the scope on screen (settings/scopes/scopes.svelte.ts),
    // kept per file, so the Primary hub scope and the Hub scope with the primary picked share one;
    // the scope's Save, the save key on the tab (Cmd+S, Ctrl+S off macOS), Save All in the bar and
    // the File menu's Save All write them, one write and one History record per file. The unsaved
    // workspace asks for a name at its first change. The changes are held while the tab is open,
    // and the tab reports them as unsaved to a close.
    //
    // A row's value is the value in force of its scope's file: for the workspace and the primary
    // the merged configuration of the config channel, for another hub the slice of its settings
    // that api/hub-settings answers (state/system/config/view/hub-settings.svelte.ts), for a hub's
    // `local.yml` the values the workspaces answer sends of it with each secret as set, and for a
    // repository its file's `languages:`. The user's files are read through the folders that hold
    // them (state/system/config/view/hub-file.ts) and read again at each push, which gives each row
    // its line and each scope the digest a save is checked against. The Catalogs, Schemas and Texts
    // groups are made from the listings of their folders. The lists the controls offer are built
    // from the stores the page holds (settings/scopes/lists.svelte.ts), the Hub scope's hub
    // offering its own folders and records; one that is not there yet is drawn as loading.
    //
    // The query, the text being typed in a box, the drafts of the list, multi and family editors
    // and the rail list being edited are the tab's instance state, so they are there again after a
    // tab switch or a reload, a text and a draft of a hub other than the primary kept under that
    // hub; a draft that reads back holds its change again after a reload. The rail's Settings
    // choice opens the tab with `reveal: 'rail'`: while that ask stands the rail row is drawn
    // whatever the query, and once it is drawn the view clears a query that would have hidden it,
    // waits for the list to be redrawn, scrolls the row into view and takes the ask out.
    //
    // The table of contents is beside the list from 700 px and over. Under that the header offers a
    // toggle that shows it over the list; a press on one of its entries or Escape hides it again
    // (state/system/config/view/contents.ts). The heading at the top of the list is the table's
    // selected row. A press on an entry, and the rail's reveal, first open the folded group the
    // entry or the row is in (List's `unfold`); a heading inside a folded group is never the top.
    //
    // The partials are in settings/: Header (search, count, the table's toggle), scopes/ (the scope
    // bar, the workspace's own rows, the scopes' changes and saves, the files they read), Contents
    // (table of contents), List (groups and sections), Item (one setting), Control (one option's
    // control), Gear (the item's menu), other-rows/ (an app's setting, the wallpaper); the controls
    // themselves and the editors of lists, multis and families are in editors/.

    import { tick, untrack } from 'svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { OCULUS_CONFIG_ROOT } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { appSettingRows } from '$lib/state/system/config/other-rows/app-rows';
    import { CATALOGS, SCHEMAS, workspaceFilePlace } from '$lib/state/system/config/config-files';
    import { movedFrom } from '$lib/state/system/config/editors/draft';
    import {
        savedBase,
        savedDraft,
        slotOf,
        withSavedDraft
    } from '$lib/state/system/config/editors/slots';
    import {
        RAIL_ROW,
        catalogOf,
        settingsGroups,
        tocOf,
        type Group
    } from '$lib/state/system/config/groups';
    import { REPO_OPTION, repoRow } from '$lib/state/system/config/rows';
    import { scopeGroups } from '$lib/state/system/config/scopes/rows';
    import {
        scopeIn,
        scopeOfFile,
        standing,
        withScope,
        type Scope,
        type ScopeGround
    } from '$lib/state/system/config/scopes/scope';
    import {
        hubConfig,
        hubReader,
        hubSettingsUrl,
        withHubs
    } from '$lib/state/system/config/view/hub-settings.svelte';
    import { searchGroups } from '$lib/state/system/config/search';
    import { contentsAfter, contentsPlace } from '$lib/state/system/config/view/contents';
    import { listedFiles } from '$lib/state/system/config/view/folders';
    import {
        settingsQuery,
        settingsReveal,
        withSettingsQuery,
        withoutReveal
    } from '$lib/state/system/config/typed';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import Contents from './settings/Contents.svelte';
    import Header from './settings/Header.svelte';
    import List from './settings/List.svelte';
    import ScopeBar from './settings/scopes/ScopeBar.svelte';
    import WorkspaceRows from './settings/scopes/WorkspaceRows.svelte';
    import { provideScopes } from './settings/scopes/context';
    import { createScopeFiles } from './settings/scopes/files';
    import { scopeLists } from './settings/scopes/lists.svelte';
    import { createScopes } from './settings/scopes/scopes.svelte';
    import { reactiveWriter } from './settings/writer.svelte';
    import { reactiveEditors } from './editors/writer.svelte';

    const {
        appShell,
        autosave,
        entities: { config, message },
        fs: { fileText, listing, primary, refresh, roots, saveWorkspace, workspaces },
        layout: { instanceLayoutState, restateInstance },
        ui,
        writes: { send }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The folder of the text files, under oculus's config folder like the catalogs'. */
    const TEXT = 'text';

    /** The version of the config channel, which the server moves after a write of a layer. */
    const pushed = $derived(message('config')?.version ?? 0);

    /** The folder name of the primary hub, or null while there is none. */
    const hubRoot = $derived(primary());

    /** The open workspace file's root and path, or null for the unsaved workspace. */
    const workspaceFile = $derived(workspaceFilePlace(workspaces()));

    /** What the scope pickers are built from. */
    const ground = $derived<ScopeGround>({
        folders: roots(),
        primary: hubRoot,
        workspaceFile: workspaceFile?.path ?? null
    });

    /** The scope on screen: the tab's own, while its hub or folder is in the workspace. */
    const scope = $derived(standing(scopeIn(ui.instanceState(instance.id)), ground));

    function pickScope(next: Scope): void {
        ui.setInstanceState(instance.id, withScope(ui.instanceState(instance.id), next));
    }

    /** The hub other than the primary whose settings the Hub scope reads, or null. */
    const scopeHub = $derived(scope.kind === 'hub' && scope.hub !== hubRoot ? scope.hub : null);

    const reader = hubReader((hub) => fetch(hubSettingsUrl(hub)));
    $effect(() => () => reader.close());

    /** The files the scopes read, through the folders that hold them. */
    const files = createScopeFiles({
        listing,
        fileText,
        workspace: () => workspaceFile,
        primary: () => hubRoot,
        local: (hub) => workspaces().machine.files[hub]
    });

    const scopes = createScopes({
        scope: () => scope,
        ground: () => ground,
        read: files.read,
        downloads: (file) => {
            const named = scopeOfFile(file, hubRoot);
            const hub = named?.kind === 'local' ? named.hub : null;
            const held = workspaces().machine.files;
            return hub === null || !Object.hasOwn(held, hub)
                ? undefined
                : held[hub].values?.downloads;
        },
        send: (body) => send(body, '/api/write', { said: true }),
        saveWorkspace: (name) => saveWorkspace(name)
    });
    provideScopes(scopes);

    // Every folder whose file a scope reads, or whose file holds changes a Save All writes, is
    // read again at each push.
    $effect(() => {
        refresh(OCULUS_CONFIG_ROOT, pushed);
        const read: string[] = [];
        if (hubRoot !== null) read.push(hubRoot);
        if (workspaceFile?.root != null) read.push(workspaceFile.root);
        for (const one of [scope, ...scopes.changes.files().map((f) => scopeOfFile(f, hubRoot))]) {
            if (one?.kind === 'hub' || one?.kind === 'local') read.push(one.hub);
            if (one?.kind === 'repo') read.push(one.root);
        }
        for (const [at, root] of read.entries()) {
            if (read.indexOf(root) === at) refresh(root, pushed);
        }
        reader.want(scopeHub === null ? [] : [scopeHub], pushed);
    });

    // The workspace saved under the name its question was answered with is written once its file
    // is named and read.
    $effect(() => {
        const named = ground.workspaceFile !== null;
        const read = files.read({ kind: 'workspace' }).digest !== null;
        if (named && read) untrack(() => scopes.resume());
    });

    $effect(() =>
        ui.registerTabSave(instance.id, async () => {
            const saved = await scopes.save();
            return saved && scopes.changes.files().length === 0;
        })
    );
    $effect(() =>
        ui.registerUnsaved((id) => id === instance.id && scopes.changes.files().length > 0)
    );
    $effect(() => autosave.joinSaveEvery(() => scopes.saveAll()));

    const writer = reactiveWriter(scopes.stage, (row) => listsFor(row));
    $effect(() => () => writer.close());

    // A draft ends when the value in force is what it sent, another value, or a form the editor
    // does not draw: the tab's state drops it.
    const editors = reactiveEditors({
        stage: scopes.stage,
        ended: (row) =>
            ui.setInstanceState(
                instance.id,
                withSavedDraft(ui.instanceState(instance.id), slotOf(row), null)
            ),
        held: (row) => savedDraft(ui.instanceState(instance.id), row),
        stale: (row) => movedFrom(savedBase(ui.instanceState(instance.id), slotOf(row)), row),
        lists: (row) => listsFor(row)
    });
    $effect(() => () => editors.close());

    /** The merged configuration of the config channel, under the primary's settings. */
    const merged = $derived(config()?.config ?? {});

    /** The lists a row's controls draw from: the Hub scope's hub's for a row of it. */
    const { listsFor } = scopeLists({
        merged: () => merged,
        primary: () => hubRoot,
        hub: () => scopeHub,
        hubConfig: (hub) => hubConfig(merged, reader.read(hub)),
        folderIn: files.folderIn
    });

    const query = $derived(settingsQuery(ui.instanceState(instance.id)));
    const revealing = $derived(settingsReveal(instanceLayoutState(instance.id)) === 'rail');

    /** The catalog of the merged configuration. */
    const catalog = $derived(catalogOf(merged));

    /** The groups of every row, made for the scope's file, before the scope keeps its own. */
    const made = $derived(
        settingsGroups(
            catalog,
            merged,
            files.userFiles(),
            {
                catalogs: listedFiles(CATALOGS, (path) => listing(OCULUS_CONFIG_ROOT, path)),
                schemas: listedFiles(SCHEMAS, (path) => listing(OCULUS_CONFIG_ROOT, path)),
                texts: listedFiles(TEXT, (path) => listing(OCULUS_CONFIG_ROOT, path))
            },
            appSettingRows(appShell.acting(), merged),
            scope.kind === 'local'
                ? {
                      hub: scope.hub,
                      primary: scope.hub === hubRoot,
                      file: workspaces().machine.files[scope.hub],
                      machine: { ...workspaces().machine, primary: hubRoot }
                  }
                : undefined
        )
    );

    /** The row of the Repository scope's folder, in the place of the workspace's. */
    const repo = $derived.by(() => {
        if (scope.kind !== 'repo') return undefined;
        const entries = Object.hasOwn(catalog, REPO_OPTION.file) ? catalog[REPO_OPTION.file] : {};
        if (!Object.hasOwn(entries, REPO_OPTION.key)) return undefined;
        return repoRow(entries[REPO_OPTION.key], scope.root, files.repo(scope.root));
    });

    const groups = $derived(
        scopeGroups(
            scopeHub === null
                ? made
                : withHubs(made, {
                      hub: scopeHub,
                      config: merged,
                      read: (hub) => reader.read(hub),
                      file: (hub) => files.settingsOf(hub)
                  }),
            scope,
            ground,
            files.read(scope),
            repo
        )
    );

    // The config channel's push moves a row's value; each editor learns the value now in force. A
    // row that says why it writes nothing holds no value of its file to learn yet.
    $effect(() => {
        const rows = groups.flatMap((group) => group.sections.flatMap((section) => section.rows));
        untrack(() => {
            for (const row of rows) {
                if (row.kind === 'config' && row.blocked === undefined) editors.pushed(row);
            }
        });
    });

    /** Whether a result holds the rail row. */
    function holdsRail(result: Group[]): boolean {
        return result.some((group) =>
            group.sections.some((section) => section.rows.some((row) => row.id === RAIL_ROW))
        );
    }

    /** The groups with the settings the query keeps; the rail row is kept while it is revealed. */
    const found = $derived(searchGroups(groups, query, revealing ? [RAIL_ROW] : []));
    const toc = $derived(tocOf(found.groups));

    /** Whether the rail row is drawn, and whether the query alone would have hidden it. */
    const railDrawn = $derived(holdsRail(found.groups));
    const railHidden = $derived(!holdsRail(searchGroups(groups, query).groups));

    // The rail's reveal shows the rail row, which the Workspace scope draws.
    $effect(() => {
        if (revealing && scope.kind !== 'workspace')
            untrack(() => pickScope({ kind: 'workspace' }));
    });

    let list: HTMLElement | undefined = $state();
    let width = $state(0);

    /** Whether the reader asked for the table of contents over the list. */
    let contentsOpen = $state(false);
    const place = $derived(contentsPlace(width, contentsOpen));

    /** The id of the heading at the top of the list. */
    let top = $state('');

    /** The groups and sections, which open the folded group a scroll goes into. */
    let drawn: { unfold: (target: string) => Promise<void> } | undefined = $state();

    /** The headings of the list in the order drawn, those inside a folded group left out. */
    function headings(): HTMLElement[] {
        const all = list?.querySelectorAll<HTMLElement>('[data-toc-target]') ?? [];
        return [...all].filter((heading) => heading.checkVisibility());
    }

    /** Make the heading at the top of the list the table's selected row. */
    function follow(): void {
        if (list === undefined) return;
        const edge = list.getBoundingClientRect().top + 8;
        let at = '';
        for (const heading of headings()) {
            if (heading.getBoundingClientRect().top > edge) break;
            at = heading.dataset.tocTarget ?? '';
        }
        top = at;
    }

    async function scrollTo(id: string): Promise<void> {
        await drawn?.unfold(id);
        headings()
            .find((heading) => heading.dataset.tocTarget === id)
            ?.scrollIntoView({ block: 'start' });
        contentsOpen = contentsAfter(contentsOpen, 'choose', width);
    }

    /** Escape hides the table shown over the list, and nothing else. */
    function escaped(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || !place.over) return;
        event.stopPropagation();
        contentsOpen = contentsAfter(contentsOpen, 'escape', width);
    }

    function setQuery(next: string): void {
        ui.setInstanceState(instance.id, withSettingsQuery(ui.instanceState(instance.id), next));
    }

    /** The search's Down key moves the focus to the first setting listed. */
    function focusFirst(): void {
        list?.querySelector<HTMLElement>('[data-setting]')?.focus();
    }

    /** Clear a query that hides the rail row, wait for the redraw, scroll to it, end the ask. */
    async function showRail(area: HTMLElement, hidden: boolean): Promise<void> {
        if (hidden) setQuery('');
        await tick();
        await drawn?.unfold(RAIL_ROW);
        area.querySelector<HTMLElement>(`[data-setting="${RAIL_ROW}"]`)?.scrollIntoView({
            block: 'start'
        });
        restateInstance(instance.id, withoutReveal(instanceLayoutState(instance.id)));
    }

    // The reveal waits for the rail row to be drawn: its file may still be being read.
    $effect(() => {
        if (!revealing || !railDrawn || list === undefined) return;
        const area = list;
        // Untracked whole: `setQuery` reads the instance state it writes, which would run the
        // effect a second time.
        untrack(() => void showRail(area, railHidden && query !== ''));
    });
</script>

<Pane title={t('views.settings')} tinted>
    <div
        class="view"
        role="presentation"
        data-instance={instance.id}
        data-settings-view
        data-scope={scope.kind}
        bind:clientWidth={width}
        onkeydown={escaped}
    >
        <Header
            {query}
            count={found.count}
            onquery={setQuery}
            ondown={focusFirst}
            toggle={place.toggle}
            showing={place.over}
            ontoggle={() => (contentsOpen = contentsAfter(contentsOpen, 'toggle', width))}
        />
        <ScopeBar {scope} {ground} {scopes} file={files.read(scope)} onpick={pickScope} />
        <div class="body">
            <nav
                class="contents"
                class:hidden={!place.beside && !place.over}
                class:over={place.over}
                aria-label={t('workbench.settings_contents')}
            >
                <Contents entries={toc} current={top} onpick={(id: string) => void scrollTo(id)} />
            </nav>
            <div class="list" bind:this={list} onscroll={follow}>
                {#if scope.kind === 'workspace' && query === ''}
                    <WorkspaceRows {ground} {scopes} />
                {/if}
                <List
                    bind:this={drawn}
                    groups={found.groups}
                    id={instance.id}
                    {writer}
                    {editors}
                    {listsFor}
                    onrepo={(root: string) => pickScope({ kind: 'repo', root })}
                />
            </div>
        </div>
    </div>
</Pane>

<style>
    .view {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
    }

    .body {
        position: relative;
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
        margin-top: 8px;
    }

    .contents {
        flex: 0 0 200px;
        overflow: auto;
        padding: 0 0 0 12px;
    }

    .contents.hidden {
        display: none;
    }

    /* Under 700 px the table is drawn over the list, from the top-left of the body, above the
       list's sticky group strips (ui/controls/heads/GroupHead.svelte, `z-index: 2`). */
    .contents.over {
        position: absolute;
        z-index: 3;
        top: 0;
        bottom: 0;
        left: 0;
        width: min(280px, 90%);
        padding: 0 8px 0 12px;
        background: var(--panel);
        border-right: 1px solid var(--line);
        box-shadow: var(--shadow);
    }

    .list {
        flex: 1 1 auto;
        min-width: 0;
        overflow: auto;
    }
</style>
