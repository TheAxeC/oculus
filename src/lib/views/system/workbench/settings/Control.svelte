<script lang="ts">
    // Layer 3, view partial. The control of one option of a defaults file, drawn from the option's
    // catalog entry by editors/FieldControl.svelte: a checkbox for a toggle, a number box held to
    // its range, a text box for a text or a scalar, a text area, a choice, a glyph, hue or colour
    // picker, a folder, file or path box, a password box for a secret, and for a list, a multi, a
    // parked list or a family its editor (../editors/Editor.svelte), drawn empty with its Add when
    // no layer gives a value. A list or family in force in a shape the editor does not draw has no
    // control: the item says which key holds which shape (Item.svelte), and nothing opens the
    // file. A row set one value at a time with no value in force draws its control empty.
    //
    // A box keeps its unsent text in the tab's instance state under the row's slot, its file and
    // key and the hub or folder of the scope when that is not the primary or the workspace
    // (state/system/config/typed.ts), so a text typed in one hub's scope is drawn again only there.
    // It holds the text as a change of the scope on Enter and on leaving the box, and drops it on
    // Escape, and the save key on the tab (Cmd+S, Ctrl+S off macOS) and the Save of a close
    // question hold it before the scope is saved. The text is kept while it is not a value of the
    // control, so the reader mends it. A pick or a toggle is held as it is made. While a change is
    // held the control shows the value held, and nothing is written until the scope is saved.

    import { drawsEditor, slotOf } from '$lib/state/system/config/editors/slots';
    import {
        controlOf,
        readField,
        textOf,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import { writtenWhole, type ConfigRow } from '$lib/state/system/config/rows';
    import { typedText, withTypedText } from '$lib/state/system/config/typed';
    import type { RowWriter } from '$lib/state/system/config/scopes/write';
    import { useState } from '$lib/state/client/use';
    import Editor from '../editors/Editor.svelte';
    import FieldControl from '../editors/FieldControl.svelte';
    import { plainText } from './said';

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

    /** The value the control shows: the one sent while its write is out, else the one in force. */
    const held = $derived(writer.pending(row) ? writer.shown(row) : row.value);

    /** The control the row is drawn with. */
    const control = $derived(controlOf(row.entry));

    /** Whether the row is set one value at a time, which is written as it is made. */
    const single = $derived(!writtenWhole(row.control));

    /** Whether the control is a box, whose text is kept until it is written. */
    const boxed = $derived(
        ['number', 'text', 'scalar', 'long', 'folder', 'file', 'path'].includes(control)
    );

    /** The value read into what the control holds; a value it cannot show is shown as its text. */
    const value = $derived.by((): FieldValue | undefined => {
        const read = readField(row.entry, held);
        if (read.kind === 'value') return read.value;
        return boxed && held !== undefined ? plainText(held) : undefined;
    });

    /** The text being typed in the box, or undefined while it shows the value. */
    const typed = $derived(typedText(instanceState(id), slotOf(row)));

    function type(next: string): void {
        writer.clear(row);
        setInstanceState(id, withTypedText(instanceState(id), slotOf(row), next));
    }

    function forget(): void {
        setInstanceState(id, withTypedText(instanceState(id), slotOf(row), null));
    }

    /**
     * Hold the typed text as the row's change; whether it was taken. A taken text ends the typing,
     * so the blur that follows Enter finds nothing typed and holds nothing twice.
     */
    function settle(next: string): boolean {
        if (typed === undefined) return false;
        writer.submit(row, next);
        const taken = writer.said(row) === null;
        if (taken) forget();
        return taken;
    }

    $effect(() =>
        registerTabSave(id, () => Promise.resolve(typed === undefined ? true : settle(typed)))
    );

    function revert(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || typed === undefined) return;
        event.stopPropagation();
        writer.clear(row);
        forget();
    }

    /** A pick or a toggle: written as it is made. */
    function pick(next: FieldValue | undefined): void {
        if (typeof next === 'boolean') writer.submit(row, next);
        else writer.submit(row, textOf(next));
    }

    /** Whether the row is a list, a multi or a family with an editor of its shape. */
    const drawn = $derived(drawsEditor(row));
</script>

{#if single}
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
{/if}

<style>
    .box {
        width: 420px;
        max-width: 100%;
    }

    .box.wide {
        width: 720px;
    }
</style>
