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
    // Layer 3, view. The Settings editor over the options catalog (config/catalogs/options.yml),
    // drawn as VS Code's: a search with the count of the settings found, a table of contents on
    // the left, and a list of groups. The groups are this browser's own values, a subject heading
    // for each part of the configuration (Appearance, Editor, Terminal and the rest, each with a
    // line per file it draws from), the machine's own file, and one each for the catalog files
    // and the text files. Each setting is an item with its control, its default and the file and
    // line of its key. A text, number, choice, toggle or picker is written to its file as it is
    // changed or left, through the same write the History view records and can undo; a list, a
    // multi or a family is edited in its item (editors/) and written whole on Save.
    //
    // The files are read through the file browser's `engine` root, and handed the version of the
    // config channel, so a write that the watcher pushes back redraws the value. Only the five
    // tracked files are asked for, and for a file with keys of the hub list also the hub layer's
    // file of the same name under `.oculus/config/`, read through the `hub` root with the folders
    // on its way listed (state/system/config/view/hub-layer.ts); the machine's own file is listed
    // from the catalog alone and its text is never read. The Catalogs and Texts groups are made
    // from the listings of the two folders, which the same version re-reads. The lists the controls
    // offer (the domains, the clusters, the views, the usage tiers, the theme classes, the hub's
    // folders) are built here from the stores the page holds (editors/sources.ts); one that is not
    // there yet is drawn as loading.
    //
    // The query, the text being typed in a box, the drafts of the list, multi and family editors
    // and the rail list being edited are the tab's instance state, so they are there again after
    // a tab switch or a reload. The rail's Settings choice opens the tab with `reveal: 'rail'`:
    // while that ask stands the rail row is drawn whatever the query, and once it is drawn the
    // view clears a query that would have hidden it, waits for the list to be redrawn, scrolls the
    // row into view and takes the ask out.
    //
    // The table of contents is beside the list from 700 px and over. Under that the header offers a
    // toggle that shows it over the list; a press on one of its entries or Escape hides it again
    // (state/system/config/view/contents.ts). The heading at the top of the list is the table's
    // selected row.
    //
    // The partials are in settings/: Header (search, count, filter, the table's toggle), Contents
    // (table of contents), List (groups and sections), Item (one setting), Control (one option's
    // control), BrowserControl (the controls of this browser's values), AppControl (the control of
    // a setting an app declares), Gear (the item's menu); the
    // controls themselves and the editors of lists, multis and families are in editors/.

    import { tick, untrack } from 'svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { ENGINE_ROOT, HUB_ROOT } from '$lib/state/sources/fs';
    import { themeClasses } from '$lib/ui/theme/theme';
    import { t } from '$lib/state/shared/words/text';
    import { wallpaperOnTheme } from '$lib/state/shared/words/appearance';
    import { appSettingRows } from '$lib/state/system/config/other-rows/app-rows';
    import { thisBrowserRows } from '$lib/state/system/config/other-rows/browser';
    import { CATALOGS, SCHEMAS } from '$lib/state/system/config/config-files';
    import { hasSavedDraft, withSavedDraft } from '$lib/state/system/config/editors/slots';
    import { listsOf, type Folder } from '$lib/state/system/config/editors/sources';
    import {
        RAIL_ROW,
        catalogOf,
        settingsGroups,
        tocOf,
        type Group
    } from '$lib/state/system/config/groups';
    import { searchGroups } from '$lib/state/system/config/search';
    import { contentsAfter, contentsPlace } from '$lib/state/system/config/view/contents';
    import { listedFiles } from '$lib/state/system/config/view/folders';
    import { hubLayerText } from '$lib/state/system/config/view/hub-layer';
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
        fs: { fileText, listing, refresh },
        registry,
        layout: { instanceLayoutState, restateInstance },
        ui,
        writes: { writeConfigKey, writeConfigValue }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The folder of the text files, under the engine root like the catalogs'. */
    const TEXT = 'text';

    /** The version of the config channel, which the watcher moves after a write in the folder. */
    const pushed = $derived(message('config')?.version ?? 0);

    $effect(() => {
        refresh(ENGINE_ROOT, pushed);
        refresh(HUB_ROOT, pushed);
    });

    const writer = reactiveWriter(writeConfigKey, () => lists);
    $effect(() => () => writer.close());

    // A draft ends when the file holds what it sent, another value, or a form the editor does not
    // draw: the tab's state drops it.
    const editors = reactiveEditors(
        writeConfigValue,
        (row) =>
            ui.setInstanceState(
                instance.id,
                withSavedDraft(ui.instanceState(instance.id), row.file, row.key, null)
            ),
        (row) => hasSavedDraft(ui.instanceState(instance.id), row.file, row.key),
        () => lists
    );
    $effect(() => () => editors.close());

    /** One hub folder as the file browser holds it, with the hidden and ignored entries too. */
    function folder(path: string): Folder {
        const held = listing(HUB_ROOT, path, { hidden: true, ignored: true });
        if (held.error !== '') return { state: 'failed', error: held.error };
        if (held.loading) return { state: 'loading' };
        return { state: 'ready', entries: held.entries };
    }

    /** One folder of the hub as the file browser lists it, hidden entries included. */
    function hubListing(path: string): ReturnType<typeof listing> {
        return listing(HUB_ROOT, path, { hidden: true, ignored: true });
    }

    /** The body classes the theme sheets hold a block for, read once from the sheets. */
    const classes = themeClasses();

    const lists = $derived.by(() => {
        const snapshot = portfolio();
        return listsOf({
            config: config()?.config ?? {},
            portfolio:
                snapshot === null
                    ? null
                    : {
                          domains: snapshot.entities.domains,
                          resources: snapshot.entities.resources,
                          projects: Object.values(snapshot.entities.projects)
                      },
            views: registry.views().map((one) => one.id),
            tiers: usage()?.accounts.map((account) => account.tier) ?? null,
            themeClasses: classes,
            offers: appShell.offers(),
            folder
        });
    });

    const query = $derived(settingsQuery(ui.instanceState(instance.id)));
    const revealing = $derived(settingsReveal(instanceLayoutState(instance.id)) === 'rail');

    const groups = $derived(
        settingsGroups(
            catalogOf(config()?.config ?? {}),
            (file) => fileText(ENGINE_ROOT, file),
            thisBrowserRows(ui, wallpaperOnTheme(ui.theme(), appShell.offers())),
            {
                catalogs: listedFiles(CATALOGS, (path) => listing(ENGINE_ROOT, path)),
                schemas: listedFiles(SCHEMAS, (path) => listing(ENGINE_ROOT, path)),
                texts: listedFiles(TEXT, (path) => listing(ENGINE_ROOT, path))
            },
            (file) => hubLayerText(file, hubListing, (path) => fileText(HUB_ROOT, path)),
            appSettingRows(appShell.acting(), config()?.config ?? {})
        )
    );

    // The watcher's push moves a row's value; each editor learns what the file now holds.
    $effect(() => {
        const rows = groups.flatMap((group) => group.sections.flatMap((section) => section.rows));
        untrack(() => {
            for (const row of rows) if (row.kind === 'config') editors.pushed(row);
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

    /** The headings of the list in the order drawn. */
    function headings(): HTMLElement[] {
        return list === undefined
            ? []
            : [...list.querySelectorAll<HTMLElement>('[data-toc-target]')];
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

    function scrollTo(id: string): void {
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
                <Contents entries={toc} current={top} onpick={scrollTo} />
            </nav>
            <div class="list" bind:this={list} onscroll={follow}>
                <List groups={found.groups} id={instance.id} {writer} {editors} {lists} />
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

    /* Under 700 px the table is drawn over the list, from the top-left of the body. */
    .contents.over {
        position: absolute;
        z-index: 2;
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
