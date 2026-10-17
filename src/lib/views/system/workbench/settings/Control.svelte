<script lang="ts">
    // Layer 3, view partial. The control of one option of a config file, drawn from the option's
    // catalog entry by editors/FieldControl.svelte: a checkbox for a toggle, a number box held to
    // its range, a text box or area, a choice, a glyph, hue or colour picker, a folder, file or
    // path box, and for a list, a multi, a parked list or a family its editor (../editors/
    // Editor.svelte). A list or family the file holds in a shape the editor does not draw has the
    // way to edit the file instead, and so does a row whose key is not in the file, which says so.
    //
    // A box keeps its unsent text in the tab's instance state under the file and key
    // (state/system/config/typed.ts), writes it on Enter and on leaving the box, and drops it on
    // Escape, and the save key on the tab (Cmd+S, Ctrl+S off macOS) writes it too. The text is kept
    // while the write is refused, so the reader mends it; a write that is accepted, or needs none,
    // drops it. A pick or a toggle is written as it is made. While a write is out the control shows
    // the value sent.

    import { drawsEditor } from '$lib/state/system/config/editors/slots';
    import {
        controlOf,
        readField,
        textOf,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import { placeOf, type ConfigRow } from '$lib/state/system/config/rows';
    import { typedText, withTypedText } from '$lib/state/system/config/typed';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import Editor from '../editors/Editor.svelte';
    import FieldControl from '../editors/FieldControl.svelte';
    import { plainText } from './said';
    import EditLink from './EditLink.svelte';

    const {
        ui: { instanceState, setInstanceState, registerTabSave }
    } = useState();

    type Props = {
        row: ConfigRow;
        id: string;
        writer: RowWriter;
        editors: EditorWriter;
        lists: Lists;
    };

    let { row, id, writer, editors, lists }: Props = $props();

    /** The value the control shows: the one sent while its write is out, else the file's. */
    const held = $derived(writer.shown(row) ?? row.value);

    /** The control the row is drawn with. */
    const control = $derived(controlOf(row.entry));

    /** Whether the row is set one value at a time, which is written as it is made. */
    const single = $derived(
        row.control !== 'family' &&
            row.control !== 'list' &&
            row.control !== 'multi' &&
            row.control !== 'parked'
    );

    /** Whether the control is a box, whose text is kept until it is written. */
    const boxed = $derived(['number', 'text', 'long', 'folder', 'file', 'path'].includes(control));

    /** The value read into what the control holds; a value it cannot show is shown as its text. */
    const value = $derived.by((): FieldValue | undefined => {
        const read = readField(row.entry, held);
        if (read.kind === 'value') return read.value;
        return boxed && held !== undefined ? plainText(held) : undefined;
    });

    /** The text being typed in the box, or undefined while it shows the value. */
    const typed = $derived(typedText(instanceState(id), row.file, row.key));

    /** The text a write is out for, so Enter and the blur that follows it write once. */
    let settling: string | null = null;

    function type(next: string): void {
        writer.clear(row);
        setInstanceState(id, withTypedText(instanceState(id), row.file, row.key, next));
    }

    function forget(): void {
        setInstanceState(id, withTypedText(instanceState(id), row.file, row.key, null));
    }

    async function settle(next: string): Promise<void> {
        if (typed === undefined || settling === next) return;
        settling = next;
        await writer.submit(row, next);
        settling = null;
        if (writer.said(row) === null) forget();
    }

    $effect(() =>
        registerTabSave(id, () => {
            if (typed !== undefined) void settle(typed);
        })
    );

    function revert(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || typed === undefined) return;
        event.stopPropagation();
        writer.clear(row);
        forget();
    }

    /** A pick or a toggle: written as it is made. */
    function pick(next: FieldValue | undefined): void {
        if (typeof next === 'boolean') void writer.submit(row, next);
        else void writer.submit(row, textOf(next));
    }

    /** Whether the row is a list, a multi or a family with an editor of its shape. */
    const drawn = $derived(drawsEditor(row));
</script>

{#if row.state === 'missing'}
    <EditLink {...placeOf(row)} line={row.line} />
{:else if single}
    <div class="box" class:wide={control === 'long'} role="presentation" onkeydown={revert}>
        <FieldControl
            spec={row.entry}
            {value}
            label={control === 'toggle' ? row.help.replaceAll('`', '') : row.title}
            {lists}
            text={boxed ? typed : undefined}
            ontext={type}
            onsettle={settle}
            onpick={pick}
        />
    </div>
{:else if drawn}
    <Editor {row} {id} {editors} {lists} />
{:else}
    <div class="summary">
        <EditLink {...placeOf(row)} line={row.line} />
    </div>
{/if}

<style>
    .box {
        width: 420px;
        max-width: 100%;
    }

    .box.wide {
        width: 720px;
    }

    .summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }
</style>
