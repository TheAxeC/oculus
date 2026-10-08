<script lang="ts">
    // Layer 3, view partial. One setting, drawn as VS Code's Settings editor draws one: the bar on
    // its left edge when it is Modified, its title with the section before the name, the gear on
    // the right, the description, the control, the message lines, and the line with the default and
    // the file and line of the key.
    //
    // The kinds of row differ in what they put under the description. A config option has its
    // control (Control.svelte, which draws the control its catalog entry names) and a default
    // line; the rail row and the arrangements row have the editors of the rail list and of the
    // page reset; a "This browser" row has the control of the value the ui store keeps; a row of
    // the machine's own file has its description and key path alone, since its values are the
    // machine's and are never read here. A config row whose key is not in the file says so and has
    // the way to edit the file.
    //
    // Each item is a stop the search's Down key can move the focus to, and the gear is drawn only
    // while the pointer is over the item or the focus is inside it, and only on a row whose menu
    // holds something (state/system/config/view/gear.ts): a "This browser" row has no setting ID in
    // a file to copy, so its menu is Reset Setting alone and exists once the row is Modified. A
    // list, multi or parked list is reset by writing its default through the editors' write; a
    // family has no default.
    //
    // A list, a multi or a family the file holds in a shape the editor draws
    // (editors/Editor.svelte) is set there; one it does not draw keeps the way to edit the file.

    import CodeText from '$lib/ui/display/CodeText.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { ENGINE_ROOT } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import { resetBrowserRow } from '$lib/state/system/config/browser';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import { drawsEditor, withSavedDraft } from '$lib/state/system/config/editors/slots';
    import { PAGES_ROW, RAIL_ROW, type Row } from '$lib/state/system/config/groups';
    import { message, type Message } from '$lib/state/system/config/messages';
    import { mismatchMessage } from '$lib/state/system/config/rows';
    import { withTypedText } from '$lib/state/system/config/typed';
    import { gearEntries } from '$lib/state/system/config/view/gear';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import Origins from '../editors/Origins.svelte';
    import PagesReset from '../PagesReset.svelte';
    import RailEditor from '../RailEditor.svelte';
    import BrowserControl from './BrowserControl.svelte';
    import Control from './Control.svelte';
    import Gear from './Gear.svelte';
    import { defaultWords, said } from './said';

    const {
        layout: { openView },
        ui
    } = useState();

    type Props = {
        row: Exclude<Row, { kind: 'file' }>;
        id: string;
        writer: RowWriter;
        editors: EditorWriter;
        lists: Lists;
    };

    let { row, id, writer, editors, lists }: Props = $props();

    /** Whether the clipboard refused the last copy of this setting's id. */
    let copyRefused = $state(false);

    /** What the control of a "This browser" row says of the text last applied, or null. */
    let browserSaid: Message | null = $state(null);

    /** The kind of control the item draws, which the markup names. */
    const control = $derived.by(() => {
        if (row.kind === 'local') return 'none';
        if (row.kind === 'config' && row.state === 'missing') return 'none';
        if (row.id === RAIL_ROW) return 'rail';
        if (row.id === PAGES_ROW) return 'arrangements';
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

    /** A family's fields, each with its description. */
    const fields = $derived(
        row.kind === 'config'
            ? Object.entries(row.fields).map(([name, spec]) => [name, spec.description] as const)
            : []
    );

    /** The sentences under the control, in the order they are drawn. */
    const lines = $derived.by(() => {
        const found: string[] = [];
        if (row.kind !== 'config') {
            return [
                ...(browserSaid === null ? [] : [said(browserSaid)]),
                ...(copyRefused ? [t('workbench.settings_copy_refused')] : [])
            ];
        }
        if (row.state === 'missing') found.push(said(message('missing', row.file)));
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
        if (row.kind === 'browser') {
            resetBrowserRow(ui, row);
        } else if (row.kind === 'config' && ['list', 'multi', 'parked'].includes(row.control)) {
            editors.clear(row);
            ui.setInstanceState(id, withSavedDraft(ui.instanceState(id), row.file, row.key, null));
            void editors.reset(row);
        } else if (row.kind === 'config') {
            writer.clear(row);
            ui.setInstanceState(id, withTypedText(ui.instanceState(id), row.file, row.key, null));
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

    function open(): void {
        if (row.kind === 'config') {
            openView('source', sourceTabState(ENGINE_ROOT, row.file, row.line));
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
        <p class="description"><CodeText text={row.description} /></p>
    {/if}
    {#if row.kind === 'local'}
        <p class="path"><CodeText text={`\`${row.path}\``} /></p>
    {:else if row.kind === 'browser'}
        <BrowserControl {row} onsaid={(next: Message | null) => (browserSaid = next)} />
    {:else}
        {#if control === 'family' || control === 'rail' || control === 'arrangements'}
            {#if fields.length > 0}
                <p class="fields">{t('workbench.settings_fields')}</p>
                <ul class="field-list">
                    {#each fields as [name, about] (name)}
                        <li><code>{name}</code> <CodeText text={about} /></li>
                    {/each}
                </ul>
            {/if}
        {/if}
        {#if control === 'rail'}
            <RailEditor {id} />
        {:else if control === 'arrangements'}
            <PagesReset />
        {:else}
            <Control {row} {id} {writer} {editors} {lists} />
        {/if}
        {#if row.kind === 'config' && row.key === 'editor.languages'}
            <Origins />
        {/if}
    {/if}
    {#each lines as line (line)}
        <p class="said" role="status">{line}</p>
    {/each}
    {#if row.kind === 'config'}
        <div class="foot">
            {#if defaultWords(row) !== ''}
                <span class="default">{defaultWords(row)}</span>
            {/if}
            {#if row.line !== undefined}
                <ToolButton
                    label={`${row.file}:${row.line}`}
                    title={t('workbench.settings_edit_in_tip', row.file)}
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
    .fields,
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

    :global(body.wall) code {
        background: transparent;
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
