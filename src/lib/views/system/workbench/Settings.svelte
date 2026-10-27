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
    // Code's: a search with the count of the settings found, a table of contents on the left, and a
    // list of groups. The groups are a subject heading for each part of the configuration
    // (Appearance, Editor, Terminal and the rest, each with a line per defaults file it draws from,
    // which opens the open workspace file and shows the defaults file), the machine's own file, and
    // one each for the catalog, schema and text files. Each setting is an item with its control,
    // its default and the file and line of the user's value of it. A text, number, choice, toggle
    // or picker is written as it is changed or left, through the same write the History view
    // records and can undo; a list, a multi or a family is edited in its item (editors/) and
    // written whole on Save. A write lands in the open workspace file's `settings:`, or for a key
    // of the hub list in a hub's `.oculus/config.yml`: the hub chosen on the row for a key each
    // hub's own file is read for, the primary's otherwise; oculus's own files are never written.
    //
    // A row's value is the value in force, read from the merged configuration of the config
    // channel, so a write that the channel pushes back redraws it. The line of a key is read from
    // the user's files: the open workspace file, read through the hub folder that holds it, and the
    // primary hub's settings file, read through the primary's folder with the folders on its way
    // listed (state/system/config/view/hub-file.ts); both are read again at each push. A row of a
    // key each hub's own file is read for, in a workspace of more than one hub, offers the pick of
    // its hub, kept per row while the tab is open and never saved; with a hub other than the
    // primary chosen, its value and default are read from that hub's settings, which
    // api/hub-settings answers, and its line from that hub's settings file, read through that
    // hub's folder, each read again at each push (state/system/config/view/hub-settings.svelte.ts).
    // A file opens in an editor only through a folder of the workspace that holds it, and a
    // defaults file through the read-only route over oculus's `config/` folder. The machine's own
    // files are listed from the catalog, and the value in force of each key comes with the
    // workspaces answer, so their text is not read here. The Catalogs, Schemas and Texts groups
    // are made from the listings of their folders, which the same push re-reads. The lists the
    // controls offer (the domains, the clusters, the views, the usage tiers, the theme classes,
    // the hub's folders) are built here from the stores the page holds (editors/sources.ts), a
    // row with a hub other than the primary chosen offering that hub's folders and records; one
    // that is not there yet is drawn as loading.
    //
    // The query, the text being typed in a box, the drafts of the list, multi and family editors
    // and the rail list being edited are the tab's instance state, so they are there again after
    // a tab switch or a reload; a text and a draft made with a hub other than the primary chosen
    // are kept under that hub as well. The rail's Settings choice opens the tab with
    // `reveal: 'rail'`: while that ask stands the rail row is drawn whatever the query, and once
    // it is drawn the view clears a query that would have hidden it, waits for the list to be
    // redrawn, scrolls the row into view and takes the ask out.
    //
    // The table of contents is beside the list from 700 px and over. Under that the header offers a
    // toggle that shows it over the list; a press on one of its entries or Escape hides it again
    // (state/system/config/view/contents.ts). The heading at the top of the list is the table's
    // selected row. A press on an entry, and the rail's reveal, first open the folded group the
    // entry or the row is in (List's `unfold`); a heading inside a folded group is never the top.
    //
    // The partials are in settings/: Header (search, count, filter, the table's toggle), Contents
    // (table of contents), List (groups and sections, with the line of each file under a heading),
    // Item (one setting), Control (one option's control), EditLink (the way to edit a
    // setting in its file), AppControl (the control of a setting an app declares), Gear (the item's
    // menu); the controls themselves and the editors of lists, multis and families are in editors/.

    import { tick, untrack } from 'svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { OCULUS_CONFIG_ROOT } from '$lib/state/sources/fs';
    import { themeClasses } from '$lib/ui/theme/theme';
    import { t } from '$lib/state/shared/words/text';
    import { appSettingRows } from '$lib/state/system/config/other-rows/app-rows';
    import { CATALOGS, SCHEMAS, workspaceFilePlace } from '$lib/state/system/config/config-files';
    import { hasSavedDraft, slotOf, withSavedDraft } from '$lib/state/system/config/editors/slots';
    import { listsOf, type Folder, type Lists } from '$lib/state/system/config/editors/sources';
    import {
        RAIL_ROW,
        catalogOf,
        settingsGroups,
        tocOf,
        type Group,
        type Row
    } from '$lib/state/system/config/groups';
    import { hubsTaking } from '$lib/state/shared/page/hubs';
    import type { HubFile } from '$lib/state/system/config/rows';
    import {
        hubConfig,
        hubReader,
        hubSettingsUrl,
        hubsRead,
        withHubs
    } from '$lib/state/system/config/view/hub-settings.svelte';
    import { searchGroups } from '$lib/state/system/config/search';
    import { contentsAfter, contentsPlace } from '$lib/state/system/config/view/contents';
    import { listedFiles } from '$lib/state/system/config/view/folders';
    import { hubFileText } from '$lib/state/system/config/view/hub-file';
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
    import { reactiveWriter } from './settings/writer.svelte';
    import { reactiveEditors } from './editors/writer.svelte';

    const {
        appShell,
        entities: { config, message, portfolio, usage },
        fs: { fileText, listing, primary, refresh, roots, workspaces },
        registry,
        layout: { instanceLayoutState, restateInstance },
        ui,
        writes: { resetConfig, writeConfigKey, writeConfigValue }
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

    /** The hubs of the workspace, the primary first and the others in the workspace's order. */
    const hubs = $derived(
        hubsTaking(
            roots()
                .filter((one) => one.hub === true)
                .map((one) => one.key),
            hubRoot
        )
    );

    /** The hub picked on each row, by row id: the view's own, never saved. */
    let chosen = $state<Record<string, string>>({});

    function choose(row: string, hub: string): void {
        chosen = { ...chosen, [row]: hub };
    }

    // A hub that leaves the workspace leaves the picks of it, so its rows take the first choice.
    $effect(() => {
        const present = hubs;
        untrack(() => {
            const kept = Object.entries(chosen).filter(([, hub]) => present.includes(hub));
            if (kept.length < Object.keys(chosen).length) chosen = Object.fromEntries(kept);
        });
    });

    /** The hubs other than the primary whose settings the rows read. */
    const others = $derived(hubsRead({ hubs, primary: hubRoot, chosen }));

    const reader = hubReader((hub) => fetch(hubSettingsUrl(hub)));
    $effect(() => () => reader.close());

    $effect(() => {
        refresh(OCULUS_CONFIG_ROOT, pushed);
        if (hubRoot !== null) refresh(hubRoot, pushed);
        const root = workspaceFile?.root ?? null;
        if (root !== null && root !== hubRoot) refresh(root, pushed);
        for (const hub of others) if (hub !== root) refresh(hub, pushed);
        reader.want(others, pushed);
    });

    const writer = reactiveWriter(writeConfigKey, resetConfig, (row) => listsFor(row));
    $effect(() => () => writer.close());

    // A draft ends when the value in force is what it sent, another value, or a form the editor
    // does not draw: the tab's state drops it.
    const editors = reactiveEditors(
        writeConfigValue,
        resetConfig,
        (row) =>
            ui.setInstanceState(
                instance.id,
                withSavedDraft(ui.instanceState(instance.id), slotOf(row), null)
            ),
        (row) => hasSavedDraft(ui.instanceState(instance.id), slotOf(row)),
        (row) => listsFor(row)
    );
    $effect(() => () => editors.close());

    /** One folder of a hub as the file browser lists it, hidden and ignored entries included. */
    function hubListing(root: string | null, path: string): ReturnType<typeof listing> {
        if (root === null) return { entries: [], error: '', loading: false };
        return listing(root, path, { hidden: true, ignored: true });
    }

    /** One folder of a hub as the controls read it: its entries, or why there are none yet. */
    function folderIn(root: string | null, path: string): Folder {
        const held = hubListing(root, path);
        if (held.error !== '') return { state: 'failed', error: held.error };
        if (held.loading) return { state: 'loading' };
        return { state: 'ready', entries: held.entries };
    }

    /** The text of a file that is not read. */
    const UNREAD = { text: '', truncated: false, error: '', loading: false };

    /** One file of a hub, which a workspace with no primary does not have. */
    function hubText(root: string | null, path: string): ReturnType<typeof fileText> {
        if (root === null) return UNREAD;
        return fileText(root, path);
    }

    /** The settings file of a hub, read through its folder. */
    function settingsOf(root: string | null): HubFile {
        return hubFileText(
            (path) => hubListing(root, path),
            (path) => hubText(root, path)
        );
    }

    /** The user's files: the primary hub's settings file and the open workspace file. */
    const userFiles = $derived({
        ...(hubRoot === null ? {} : { hubFile: settingsOf(hubRoot) }),
        workspace:
            workspaceFile === null
                ? null
                : {
                      ...workspaceFile,
                      text:
                          workspaceFile.root === null
                              ? UNREAD
                              : fileText(workspaceFile.root, workspaceFile.path)
                  }
    });

    /** The body classes the theme sheets hold a block for, read once from the sheets. */
    const classes = themeClasses();

    /** The merged configuration of the config channel, under the primary's settings. */
    const merged = $derived(config()?.config ?? {});

    /**
     * The lists the controls draw from over a merged configuration, with the records and the
     * folders of the hub `root` (the primary, or a hub chosen on a row).
     */
    function listsWith(over: Record<string, unknown>, root: string | null): Lists {
        const snapshot = portfolio();
        return listsOf({
            config: over,
            portfolio:
                snapshot === null
                    ? null
                    : {
                          primary: root,
                          domains: snapshot.entities.domains,
                          resources: snapshot.entities.resources,
                          people: snapshot.entities.people,
                          projects: Object.values(snapshot.entities.projects)
                      },
            views: registry.views().map((one) => one.id),
            tiers: usage()?.accounts.map((account) => account.tier) ?? null,
            themeClasses: classes,
            codeThemeClasses: config()?.codeThemeClasses ?? [],
            offers: appShell.offers(),
            folder: (path) => folderIn(root, path)
        });
    }

    const lists = $derived(listsWith(merged, hubRoot));

    /** The lists of each hub other than the primary the rows read, over its own settings. */
    const hubLists = $derived(
        new Map(
            others.map((hub) => [
                hub,
                listsWith(hubConfig(merged, reader.read(hub)) ?? merged, hub)
            ])
        )
    );

    /** The lists a row's controls draw from: the chosen hub's for a row with one chosen. */
    function listsFor(row: Row): Lists {
        if (row.kind !== 'config' || row.hub === undefined) return lists;
        return hubLists.get(row.hub) ?? lists;
    }

    const query = $derived(settingsQuery(ui.instanceState(instance.id)));
    const revealing = $derived(settingsReveal(instanceLayoutState(instance.id)) === 'rail');

    const groups = $derived(
        withHubs(
            settingsGroups(
                catalogOf(merged),
                merged,
                userFiles,
                {
                    catalogs: listedFiles(CATALOGS, (path) => listing(OCULUS_CONFIG_ROOT, path)),
                    schemas: listedFiles(SCHEMAS, (path) => listing(OCULUS_CONFIG_ROOT, path)),
                    texts: listedFiles(TEXT, (path) => listing(OCULUS_CONFIG_ROOT, path))
                },
                appSettingRows(appShell.acting(), merged),
                {
                    primary: primary(),
                    set: workspaces().machine.set,
                    defaults: workspaces().machine.defaults,
                    values: workspaces().machine.values,
                    hubs: workspaces().machine.hubs,
                    portRefused: workspaces().machine.portRefused
                }
            ),
            {
                hubs,
                primary: hubRoot,
                chosen,
                config: merged,
                read: (hub) => reader.read(hub),
                file: (hub) => settingsOf(hub)
            }
        )
    );

    // The config channel's push moves a row's value; each editor learns the value now in force. A
    // row that says why it writes nothing holds no value of its hub to learn yet.
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
                <List
                    bind:this={drawn}
                    groups={found.groups}
                    id={instance.id}
                    {writer}
                    {editors}
                    {listsFor}
                    onchoose={choose}
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
