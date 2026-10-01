<script lang="ts">
    // Layer 3, view partial. The control of one option of a config file: a Checkbox for a toggle, a
    // NumberInput for a number, a TextInput for a text, a Select for a choice, and for a list or a
    // family the count of its items and the way to edit it in the file. A row whose key is not in
    // the file has no control and says so.
    //
    // A text or number box keeps its unsent text in the tab's instance state under the file and
    // key (state/system/config/typed.ts), writes it on Enter and on leaving the box, and drops it
    // on Escape. The text is kept while the write is refused, so the reader mends it; a write that
    // is accepted, or needs none, drops it. While a write is out the control shows the value sent.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import NumberInput from '$lib/ui/forms/NumberInput.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { choiceShape, listShape, type ConfigRow } from '$lib/state/system/config/rows';
    import { typedText, withTypedText } from '$lib/state/system/config/typed';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import { itemsWords, plainText } from './said';
    import EditLink from './EditLink.svelte';

    const {
        ui: { instanceState, setInstanceState }
    } = useState();

    let { row, id, writer }: { row: ConfigRow; id: string; writer: RowWriter } = $props();

    /** The value the control shows: the one sent while its write is out, else the file's. */
    const held = $derived(writer.shown(row) ?? row.value);

    /** The text being typed in the box, or undefined while it shows the value. */
    const typed = $derived(typedText(instanceState(id), row.file, row.key));

    /** The box's text. */
    const text = $derived(typed ?? (held === undefined ? '' : plainText(held)));

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

    function revert(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || typed === undefined) return;
        event.stopPropagation();
        writer.clear(row);
        forget();
    }

    /** The file's list as a count, or nothing when the file holds something else. */
    const count = $derived(listShape.safeParse(row.value).data?.length);
</script>

{#if row.state === 'missing'}
    <EditLink file={row.file} line={row.line} />
{:else if row.control === 'toggle'}
    <Checkbox
        checked={held === true}
        label={row.description.replaceAll('`', '')}
        onchange={(next: boolean) => writer.submit(row, next)}
    />
{:else if row.control === 'number'}
    <div class="box number" role="presentation" onkeydown={revert}>
        <NumberInput
            value={text}
            label={row.title}
            oninput={type}
            onenter={settle}
            onblur={settle}
        />
    </div>
{:else if row.control === 'text'}
    <div class="box" role="presentation" onkeydown={revert}>
        <TextInput value={text} label={row.title} oninput={type} onenter={settle} onblur={settle} />
    </div>
{:else if row.control === 'choice'}
    <div class="choice">
        <Select
            value={choiceShape.safeParse(held).data ?? ''}
            label={row.title}
            empty={t('workbench.settings_choice_empty')}
            choices={row.values.map((word) => ({ id: word, label: word }))}
            onchange={(next: string) => writer.submit(row, next)}
        />
    </div>
{:else}
    <div class="summary">
        {#if row.control === 'list' && count !== undefined}
            <span class="count">{itemsWords(count)}</span>
        {/if}
        <EditLink file={row.file} line={row.line} />
    </div>
{/if}

<style>
    .box {
        width: 420px;
        max-width: 100%;
    }

    .box.number {
        width: auto;
        min-width: 200px;
        max-width: 100%;
    }

    .choice {
        width: 320px;
        max-width: 100%;
        display: flex;
    }

    .summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }

    .count {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
