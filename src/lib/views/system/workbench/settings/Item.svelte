<script lang="ts">
    // Layer 3, view partial. One setting, drawn as VS Code's Settings editor draws one: the bar on
    // its left edge when it is Modified (its value in force differs from the defaults file's), its
    // title with the section before the name, the gear on the right, the description, the control,
    // the message lines, and the line with the default.
    //
    // The kinds of row differ in what they put under the description. An option of a defaults file,
    // of a hub's `local.yml` or of a repository's `.oculus/settings.yml` has its control
    // (Control.svelte, which draws the control its catalog entry names, a list or family with no
    // value in force drawn empty with its Add) and a default line; the rail row has the editor of
    // the rail list, and the page layouts row the editor of its trees with Reset all pages under
    // it. A setting an app declares has its control (other-rows/AppControl.svelte). This machine's
    // `clusters:` row has its family editor with a row's cluster picked from the clusters of
    // `slurm.resource` no row holds (other-rows/ClusterRows.svelte). A list or a family whose value
    // is in a shape its editor does not draw has no control and says which key holds which value;
    // no row opens the user's file. A row of the primary's `port` says when the server could not
    // move to the port the file names.
    //
    // Each item is a stop the search's Down key can move the focus to, and the gear is drawn only
    // while the pointer is over the item or the focus is inside it, and only on a row whose menu
    // holds something (state/system/config/view/gear.ts). Reset holds the taking out of the user's
    // value as a change of the scope: a list, multi, parked list or family through the editors'
    // writer, which drops the editor's draft, any other row through the row's writer, which drops
    // the typed text, and a setting an app declares through the scopes.
    //
    // The editor of a row's entries and its Fields list are each drawn under a disclosure line
    // (editors/Fold.svelte), which the reader folds and unfolds, under a search too; a folded row
    // keeps its Modified bar, its gear, its message lines and its default line, and Reset works on
    // it unfolded or not.
    //
    // A row that says why it writes nothing draws the sentence under its control. While the Hub
    // scope's hub's settings are being read or could not be read the row draws that sentence
    // alone, with no control, value, Modified bar or line, and the draft or typed text kept for
    // that hub is drawn again once they are read.

    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import { WALLPAPER_KEY } from '$lib/state/life/pictures/wallpapers.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import {
        drawsEditor,
        slotOf,
        undrawnMessage,
        withSavedDraft
    } from '$lib/state/system/config/editors/slots';
    import { PAGES_ROW, RAIL_ROW, type Row } from '$lib/state/system/config/groups';
    import { CLUSTERS_ROW } from '$lib/state/system/config/other-rows/cluster-rows';
    import { mismatchMessage, writtenWhole } from '$lib/state/system/config/rows';
    import type { RowWriter } from '$lib/state/system/config/scopes/write';
    import { settingsQuery, withTypedText } from '$lib/state/system/config/typed';
    import { foundInside, partTexts } from '$lib/state/system/config/view/fold';
    import { gearEntries } from '$lib/state/system/config/view/gear';
    import { useState } from '$lib/state/client/use';
    import Fold from '../editors/Fold.svelte';
    import Origins from '../editors/Origins.svelte';
    import PagesReset from '../PagesReset.svelte';
    import RailEditor from '../RailEditor.svelte';
    import AppControl from './other-rows/AppControl.svelte';
    import ClusterRows from './other-rows/ClusterRows.svelte';
    import WallpaperPicker from './other-rows/WallpaperPicker.svelte';
    import Control from './Control.svelte';
    import Gear from './Gear.svelte';
    import { scopesHere } from './scopes/context';
    import { defaultWords, said } from './said';

    const { ui } = useState();

    const scopes = scopesHere();

    type Props = {
        row: Exclude<Row, { kind: 'file' }>;
        id: string;
        writer: RowWriter;
        editors: EditorWriter;
        lists: Lists;
        /** Whether the search keeps the row. */
        kept: boolean;
        /** Show the Repository scope of a folder. */
        onrepo: (root: string) => void;
    };

    let { row, id, writer, editors, lists, kept, onrepo }: Props = $props();

    /** Whether the clipboard refused the last copy of this setting's id. */
    let copyRefused = $state(false);

    /** The sentence of a value in a shape its editor does not draw, or null. */
    const undrawn = $derived(row.kind === 'config' ? undrawnMessage(row) : null);

    /** The kind of control the item draws, which the markup names. */
    const control = $derived.by(() => {
        if (row.id === RAIL_ROW) return 'rail';
        if (undrawn !== null) return 'none';
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

    /**
     * Whether a plain word of the query is found in the Fields list of a row the search keeps,
     * which unfolds it until a press under that query says otherwise; the list is not filtered. The
     * editor of a family reads its draft and the rail list the rows it draws
     * (editors/Editor.svelte, ../RailEditor.svelte).
     */
    function searched(): boolean {
        if (row.kind !== 'config' || !kept) return false;
        return foundInside(settingsQuery(ui.instanceState(id)), partTexts(row, 'fields'));
    }

    /** The sentences under the control, in the order they are drawn. */
    const lines = $derived.by(() => {
        const found: string[] = [];
        if (row.kind !== 'config') {
            return copyRefused ? [t('workbench.settings_copy_refused')] : [];
        }
        if (row.blocked !== undefined) found.push(said(row.blocked));
        if (row.note !== undefined) found.push(said(row.note));
        if (undrawn !== null) found.push(said(undrawn));
        const mismatch = mismatchMessage(row);
        if (mismatch !== null) found.push(said(mismatch));
        const written = writer.said(row);
        if (written !== null) found.push(said(written));
        const listed = writtenWhole(row.control) && !drawsEditor(row) ? editors.said(row) : null;
        if (listed !== null) found.push(said(listed));
        if (copyRefused) found.push(t('workbench.settings_copy_refused'));
        return found;
    });

    function reset(): void {
        if (row.kind === 'app') {
            scopes?.stageApp(row.setting.key, { reset: true });
        } else if (row.blocked !== undefined) {
            return;
        } else if (writtenWhole(row.control)) {
            editors.clear(row);
            ui.setInstanceState(id, withSavedDraft(ui.instanceState(id), slotOf(row), null));
            editors.reset(row);
        } else {
            writer.clear(row);
            ui.setInstanceState(id, withTypedText(ui.instanceState(id), slotOf(row), null));
            writer.reset(row);
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
    {#if row.kind === 'app'}
        <AppControl {row} {lists} />
    {:else}
        {#if control === 'family' || control === 'rail'}
            {#if fields.length > 0}
                <Fold
                    {id}
                    row={row.id}
                    part="fields"
                    title={t('workbench.settings_fields')}
                    count={fields.length}
                    searched={searched()}
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
            <RailEditor {id} {row} {kept} />
        {:else if row.key === WALLPAPER_KEY}
            <WallpaperPicker {row} {writer} />
        {:else if row.id === CLUSTERS_ROW && drawsEditor(row) && row.unread === undefined}
            <ClusterRows {row} {id} {editors} {lists} {kept} />
        {:else if control !== 'none' && row.unread === undefined}
            <Control {row} {id} {writer} {editors} {lists} {kept} />
        {/if}
        {#if row.id === PAGES_ROW}
            <PagesReset />
        {/if}
        {#if row.kind === 'config' && row.key === 'editor.languages' && row.place.layer !== 'repo'}
            <Origins {onrepo} />
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
    {#if row.kind === 'config' && row.default !== undefined && defaultWords(row) !== ''}
        <!-- A key the defaults leave out has no default to name; its help says what holds. -->
        <div class="foot">
            <span class="default">{defaultWords(row)}</span>
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

    .description {
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

    .said {
        margin: 6px 0 0;
        color: var(--c-red-txt);
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
