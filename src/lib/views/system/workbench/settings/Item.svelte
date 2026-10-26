<script lang="ts">
    // Layer 3, view partial. One setting, drawn as VS Code's Settings editor draws one: the bar on
    // its left edge when it is Modified (its value in force differs from the defaults file's), its
    // title with the section before the name, the gear on the right, the description, the control,
    // the message lines, and the line with the default and, when the user's file sets the key, that
    // file and the line of the key.
    //
    // The kinds of row differ in what they put under the description. An option of a defaults file
    // has its control (Control.svelte, which draws the control its catalog entry names) and a
    // default line; the rail row and the arrangements row have the editors of the rail list and of
    // the page reset, and the workbench row has none, since its layout tree is edited in the file;
    // a row of the machine's own file has its description, its key path, where it is set and the
    // value in force the server sent (a line for each row of a joined list, with a way to open the
    // file of each hub that holds a row). A list, multi, parked list or family with no value in
    // force says so and has the way to edit the user's file; a row set one value at a time with no
    // value in force draws its control empty (Control.svelte) and says nothing more.
    //
    // Each item is a stop the search's Down key can move the focus to, and the gear is drawn only
    // while the pointer is over the item or the focus is inside it, and only on a row whose menu
    // holds something (state/system/config/view/gear.ts). Reset takes the user's value out of its
    // file: a list, multi, parked list or family through the editors' write, which drops the
    // editor's draft, any other row through the row's write, which drops the typed text.
    //
    // A list, a multi or a family in force in a shape the editor draws (editors/Editor.svelte) is
    // set there; one it does not draw keeps the way to edit the user's file.
    //
    // The editor of a row's entries and its Fields list are each drawn under a disclosure line
    // (editors/Fold.svelte), which the reader folds and unfolds; a folded row keeps its Modified
    // bar, its gear, its message lines and its default line, and Reset works on it unfolded or not.
    //
    // A row of a key each hub's own settings file is read for, in a workspace of more than one hub,
    // draws the pick of its hub under the description, the primary first and chosen, or the empty
    // choice while no hub is chosen (state/system/config/view/hub-settings.svelte.ts); a pick
    // redraws the row as that hub holds it. A row that says why it writes nothing draws the
    // sentence under its control. While the chosen hub's settings are being read or could not be
    // read the row draws that sentence alone, with no control, value, Modified bar or line, and
    // the draft or typed text kept for that hub is drawn again once they are read.

    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { WALLPAPER_KEY } from '$lib/state/life/pictures/wallpapers.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import { drawsEditor, slotOf, withSavedDraft } from '$lib/state/system/config/editors/slots';
    import { PAGES_ROW, RAIL_ROW, WORKBENCH_ROW, type Row } from '$lib/state/system/config/groups';
    import { message } from '$lib/state/system/config/messages';
    import { LOCAL_PATH, hubFileTarget, openTarget } from '$lib/state/system/config/config-files';
    import {
        mismatchMessage,
        placeName,
        placeOf,
        writtenWhole
    } from '$lib/state/system/config/rows';
    import { settingsQuery, withTypedText } from '$lib/state/system/config/typed';
    import { foundInside, partTexts, type FoldPart } from '$lib/state/system/config/view/fold';
    import { gearEntries } from '$lib/state/system/config/view/gear';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import Fold from '../editors/Fold.svelte';
    import Origins from '../editors/Origins.svelte';
    import PagesReset from '../PagesReset.svelte';
    import RailEditor from '../RailEditor.svelte';
    import AppControl from './other-rows/AppControl.svelte';
    import WallpaperPicker from './other-rows/WallpaperPicker.svelte';
    import Control from './Control.svelte';
    import Gear from './Gear.svelte';
    import { defaultWords, said } from './said';

    const {
        fs: { workspaces },
        layout: { openView },
        ui,
        writes: { writeAppSetting }
    } = useState();

    type Props = {
        row: Exclude<Row, { kind: 'file' }>;
        id: string;
        writer: RowWriter;
        editors: EditorWriter;
        lists: Lists;
        /** Pick the hub a row of a key each hub's own file is read for shows and writes. */
        onchoose: (row: string, hub: string) => void;
    };

    let { row, id, writer, editors, lists, onchoose }: Props = $props();

    /** The hubs the row offers to pick, each by its name. */
    const hubChoices = $derived(
        row.kind === 'config' && row.choice !== undefined
            ? row.choice.offered.map((hub) => ({ id: hub, label: hub }))
            : []
    );

    /** The name the row's user file is shown under, the hub's before it for another hub. */
    const named = $derived(row.kind === 'config' ? placeName(row) : null);

    /** Whether the clipboard refused the last copy of this setting's id. */
    let copyRefused = $state(false);

    /** The kind of control the item draws, which the markup names. */
    const control = $derived.by(() => {
        if (row.kind === 'local') return 'none';
        if (row.kind === 'config' && row.state === 'missing' && writtenWhole(row.control)) {
            return 'none';
        }
        if (row.id === RAIL_ROW) return 'rail';
        if (row.id === PAGES_ROW) return 'arrangements';
        if (row.id === WORKBENCH_ROW) return 'workbench';
        return row.control;
    });

    /** The title cut at its last colon, so the section can be drawn lighter than the name. */
    const split = $derived.by(() => {
        const at = row.title.lastIndexOf(': ');
        return at < 0
            ? { section: '', name: row.title }
            : { section: row.title.slice(0, at + 1), name: row.title.slice(at + 2) };
    });

    /** What the gear offers: Reset Setting, Copy Setting ID, both or neither. */
    const entries = $derived(gearEntries(row));
    const canReset = $derived(entries.includes('reset'));
    const canCopy = $derived(entries.includes('copy'));

    /** A family's fields, each with its help line. */
    const fields = $derived(
        row.kind === 'config'
            ? Object.entries(row.fields).map(([name, spec]) => [name, spec.help] as const)
            : []
    );

    /** Whether the query stands and is found inside a part of the row, which unfolds it. */
    function searched(part: FoldPart): boolean {
        if (row.kind !== 'config') return false;
        return foundInside(settingsQuery(ui.instanceState(id)), partTexts(row, part));
    }

    /** The sentences under the control, in the order they are drawn. */
    const lines = $derived.by(() => {
        const found: string[] = [];
        if (row.kind !== 'config') {
            return [
                ...(row.kind === 'local' && row.refused !== null ? [said(row.refused)] : []),
                ...(copyRefused ? [t('workbench.settings_copy_refused')] : [])
            ];
        }
        if (row.blocked !== undefined) found.push(said(row.blocked));
        if (
            row.state === 'missing' &&
            row.unread === undefined &&
            writtenWhole(row.control) &&
            row.key !== WALLPAPER_KEY &&
            named !== null
        ) {
            found.push(said(message('missing', named)));
        }
        const mismatch = mismatchMessage(row);
        if (mismatch !== null) found.push(said(mismatch));
        const written = writer.said(row);
        if (written !== null) found.push(said(written));
        const listed = drawsEditor(row) ? null : editors.said(row);
        if (listed !== null) found.push(said(listed));
        if (copyRefused) found.push(t('workbench.settings_copy_refused'));
        return found;
    });

    function reset(): void {
        if (row.kind === 'app') {
            void writeAppSetting(row.setting.key, row.setting.default);
        } else if (row.kind === 'config' && row.blocked !== undefined) {
            return;
        } else if (row.kind === 'config' && writtenWhole(row.control)) {
            editors.clear(row);
            ui.setInstanceState(id, withSavedDraft(ui.instanceState(id), slotOf(row), null));
            void editors.reset(row);
        } else if (row.kind === 'config') {
            writer.clear(row);
            ui.setInstanceState(id, withTypedText(ui.instanceState(id), slotOf(row), null));
            void writer.reset(row);
        }
    }

    async function copyId(): Promise<void> {
        try {
            await navigator.clipboard.writeText(row.path);
            copyRefused = false;
        } catch {
            copyRefused = true;
        }
    }

    /** Where the user's file of the row opens: through the workspace folder holding it, if any. */
    const target = $derived.by(() => {
        if (row.kind !== 'config') return null;
        const place = placeOf(row);
        return place === null ? null : openTarget(place.root, place.file, workspaces());
    });

    /** Open the machine file of a hub in a source tab, through the folder named for the hub. */
    function openHubFile(hub: string): void {
        const place = hubFileTarget(hub, workspaces());
        if (place !== null) openView('source', sourceTabState(place.root, place.path));
    }

    function open(): void {
        if (row.kind === 'config' && target !== null) {
            openView('source', sourceTabState(target.root, target.path, row.line));
        }
    }
</script>

<div
    class="item"
    data-setting={row.id}
    data-control={control}
    data-modified={row.modified ? '' : undefined}
    data-missing={row.kind === 'config' && row.state === 'missing' ? '' : undefined}
    role="group"
    aria-label={row.title}
    tabindex="-1"
>
    {#if row.modified}
        <span class="bar"></span>
    {/if}
    <div class="head">
        <span class="title">
            {#if split.section !== ''}
                <span class="section">{split.section}</span>
            {/if}
            <span class="name">{split.name}</span>
        </span>
        {#if canReset || canCopy}
            <span class="gear">
                <Gear reset={canReset} copy={canCopy} onreset={reset} oncopy={copyId} />
            </span>
        {/if}
    </div>
    {#if control !== 'toggle'}
        <p class="description"><CodeText text={row.help} /></p>
    {/if}
    {#if row.kind === 'config' && row.choice !== undefined}
        {@const choice = row.choice}
        <div class="hub" title={t('workbench.settings_hub_choice_tip')}>
            <Select
                value={choice.chosen ?? ''}
                label={t('workbench.settings_hub_choice')}
                empty={choice.chosen === undefined
                    ? t('workbench.settings_hub_choice_none')
                    : undefined}
                choices={hubChoices}
                onchange={(hub: string) => {
                    if (hub !== '') onchoose(row.id, hub);
                }}
            />
        </div>
    {/if}
    {#if row.kind === 'local'}
        <p class="path"><CodeText text={`\`${row.path}\``} /></p>
        <p class="standing" role="status">
            {#if row.hubs.length > 0}
                {t('workbench.settings_machine_set', row.hubs.join(', '))}
            {:else if row.setIn !== null}
                {t('workbench.settings_machine_set', row.setIn)}
            {:else if row.fallback !== null}
                {t('workbench.settings_machine_default', row.fallback)}
            {:else}
                {t('workbench.settings_machine_unset')}
            {/if}
        </p>
        {#if row.lines.length > 0}
            <p class="path">{t('workbench.settings_machine_in_force')}</p>
            <ul class="field-list">
                {#each row.lines as line, at (at)}
                    <li><code>{line}</code></li>
                {/each}
            </ul>
        {/if}
        {#if row.hubs.length > 0}
            <div class="foot">
                {#each row.hubs as hub (hub)}
                    {#if hubFileTarget(hub, workspaces()) === null}
                        <span class="default">
                            {t('workbench.settings_open_unavailable', LOCAL_PATH)}
                        </span>
                    {:else}
                        <ToolButton
                            label={t('workbench.settings_machine_edit_in', LOCAL_PATH, hub)}
                            glyph="edit"
                            title={t('workbench.settings_machine_edit_tip', LOCAL_PATH, hub)}
                            onclick={() => openHubFile(hub)}
                        />
                    {/if}
                {/each}
            </div>
        {/if}
    {:else if row.kind === 'app'}
        <AppControl {row} {lists} />
    {:else}
        {#if control === 'family' || control === 'rail' || control === 'arrangements' || control === 'workbench'}
            {#if fields.length > 0}
                <Fold
                    {id}
                    row={row.id}
                    part="fields"
                    title={t('workbench.settings_fields')}
                    count={fields.length}
                    searched={searched('fields')}
                >
                    <ul class="field-list">
                        {#each fields as [name, about] (name)}
                            <li><code>{name}</code> <CodeText text={about} /></li>
                        {/each}
                    </ul>
                </Fold>
            {/if}
        {/if}
        {#if control === 'rail'}
            <RailEditor {id} title={row.title} searched={searched('entries')} />
        {:else if control === 'arrangements'}
            <PagesReset />
        {:else if row.key === WALLPAPER_KEY}
            <WallpaperPicker {row} {writer} />
        {:else if control !== 'workbench' && row.unread === undefined}
            <Control {row} {id} {writer} {editors} {lists} />
        {/if}
        {#if row.kind === 'config' && row.key === 'editor.languages'}
            <Origins />
        {/if}
    {/if}
    {#each lines as line (line)}
        <p class="said" role="status">{line}</p>
    {/each}
    {#if row.kind === 'app'}
        <div class="foot">
            <span class="default">
                {defaultWords({ control: row.control, default: row.setting.default })}
            </span>
        </div>
    {/if}
    {#if row.kind === 'config'}
        <div class="foot">
            <!-- A key the defaults leave out has no default to name; its help says what holds. -->
            {#if row.default !== undefined && defaultWords(row) !== ''}
                <span class="default">{defaultWords(row)}</span>
            {/if}
            {#if row.own && named !== null && target === null}
                <span class="default">
                    {t('workbench.settings_open_unavailable', named)}
                </span>
            {:else if row.own && named !== null}
                <ToolButton
                    label={row.line === undefined ? named : `${named}:${row.line}`}
                    title={t('workbench.settings_edit_in_tip', named)}
                    plain
                    onclick={open}
                />
            {/if}
        </div>
    {/if}
</div>

<style>
    .item {
        position: relative;
        padding: 12px 14px 18px;
        outline: none;
    }

    .item:hover,
    .item:focus-within {
        background: var(--chip);
    }

    .item:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .bar {
        position: absolute;
        left: 5px;
        top: 15px;
        bottom: 18px;
        border-left: 2px solid var(--accent);
    }

    .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
    }

    .title {
        font-size: var(--fs-md);
        font-weight: 600;
    }

    .section {
        font-weight: 400;
        color: var(--muted-txt, var(--muted));
    }

    .gear {
        display: inline-flex;
        opacity: 0;
    }

    .item:hover .gear,
    .item:focus-within .gear {
        opacity: 1;
    }

    @media (hover: none) {
        .gear {
            opacity: 1;
        }
    }

    .description,
    .path {
        margin: 4px 0 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .field-list {
        margin: 0 0 8px;
        padding-left: 18px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    code {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        background: var(--chip);
        border-radius: var(--radius-sm);
        padding: 0 3px;
    }

    /* Over a wallpaper a code word paints nothing under it and is outlined in the line colour
       instead, so it is told from the words beside it. */
    :global(body.wall) code {
        background: transparent;
        outline: 1px solid var(--line);
        outline-offset: -1px;
    }

    /* The row's hover takes the code chip's own colour, so a code word keeps a chip of its own. */
    .item:hover code,
    .item:focus-within code {
        background: var(--line);
    }

    .hub {
        width: 220px;
        max-width: 100%;
        margin: 0 0 8px;
    }

    .said {
        margin: 6px 0 0;
        color: var(--c-red-txt);
        font-size: var(--fs-md);
    }

    .standing {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
