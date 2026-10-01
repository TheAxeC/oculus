<script module lang="ts">
    // Layer 3, view registration. Settings follows the Views catalogue in the Views and Settings
    // page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'settings',
        label: 'views.settings',
        glyph: 'views.settings_glyph',
        group: 'views',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The Settings editor over the options catalog (config/catalogs/options.yml),
    // drawn as VS Code's: a search with the count of the settings found, a table of contents on
    // the left, and a list of groups, one for this browser's own values and one for each config
    // file, each setting an item with its control, its default and the file and line of its key.
    // A text, number, choice or toggle is written to its file as it is changed, through the same
    // write the History view records and can undo; a list or a family is edited in the file.
    //
    // The files are read through the file browser's `engine` root, as the Config view reads them,
    // and handed the version of the config channel, so a write that the watcher pushes back
    // redraws the value. Only the five tracked files are asked for; the machine's own file is
    // listed from the catalog alone and its text is never read.
    //
    // The query, the text being typed in a field and the rail list being edited are the tab's
    // instance state, so they are there again after a tab switch or a reload. The rail's Settings
    // choice opens the tab with `reveal: 'rail'`: while that ask stands the rail row is drawn
    // whatever the query, and once it is drawn the view clears a query that would have hidden it,
    // waits for the list to be redrawn, scrolls the row into view and takes the ask out.
    //
    // The table of contents is drawn at every width and hidden by a class while the view is under
    // 700 px wide. The heading at the top of the list is the table's selected row.
    //
    // The partials are in settings/: Header (search, count, filter), Contents (table of contents),
    // List (groups and sections), Item (one setting), Control (one option's control),
    // BrowserControl (the controls of this browser's values), Gear (the item's menu).

    import { tick, untrack } from 'svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { ENGINE_ROOT } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { wallpaperOnTheme } from '$lib/state/shared/words/appearance';
    import { thisBrowserRows } from '$lib/state/system/config/browser';
    import {
        RAIL_ROW,
        catalogOf,
        settingsGroups,
        tocOf,
        type Group
    } from '$lib/state/system/config/groups';
    import { searchGroups } from '$lib/state/system/config/search';
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

    const {
        entities: { config, message },
        fs: { fileText, refresh },
        layout: { instanceLayoutState, restateInstance },
        ui,
        writes: { writeConfigKey }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The narrowest the view may be with the table of contents beside the list. */
    const NARROW = 700;

    /** The version of the config channel, which the watcher moves after a write in the folder. */
    const pushed = $derived(message('config')?.version ?? 0);

    $effect(() => {
        refresh(ENGINE_ROOT, pushed);
    });

    const writer = reactiveWriter(writeConfigKey);
    $effect(() => () => writer.close());

    const query = $derived(settingsQuery(ui.instanceState(instance.id)));
    const revealing = $derived(settingsReveal(instanceLayoutState(instance.id)) === 'rail');

    const groups = $derived(
        settingsGroups(
            catalogOf(config()?.config ?? {}),
            (file) => fileText(ENGINE_ROOT, file),
            thisBrowserRows(ui, wallpaperOnTheme(ui.theme()))
        )
    );

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
    const narrow = $derived(width > 0 && width < NARROW);

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
    <div class="view" data-instance={instance.id} data-settings-view bind:clientWidth={width}>
        <Header {query} count={found.count} onquery={setQuery} ondown={focusFirst} />
        <div class="body">
            <nav class="contents" class:narrow aria-label={t('workbench.settings_contents')}>
                <Contents entries={toc} current={top} onpick={scrollTo} />
            </nav>
            <div class="list" bind:this={list} onscroll={follow}>
                <List groups={found.groups} id={instance.id} {writer} />
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

    .contents.narrow {
        display: none;
    }

    .list {
        flex: 1 1 auto;
        min-width: 0;
        overflow: auto;
    }
</style>
