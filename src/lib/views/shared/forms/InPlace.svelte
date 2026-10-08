<script lang="ts">
    // Layer 3, shared view partial. One in-place control of one entry, drawn from the file's own
    // schema: the status as a pick over the field's options, or a deadline or a date as a date box
    // (a field of type `date`) or a text box. A change is one `writeEntry` call, answered to the
    // card's `onsaid`. The control holds nothing: it shows the entry's value, and a refused write
    // leaves the value of the file in it.
    //
    // A status the options do not hold is the pick's first item with the words
    // `settings.not_in_list` beside it. A date or text is written when the reader presses Enter or
    // leaves the box and only when it differs from the entry's value; an empty text clears the
    // field. `blocked` is the words saying why a control cannot write (the file has unsaved text in
    // a tab, or the entry has no identity a write can address), and then every control is disabled
    // with them as its title. An answer that arrives after the control was taken out of the page is
    // said by nobody.

    import { onDestroy } from 'svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import type { Entry, SchemaField } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        writes: { writeEntry }
    } = useState();

    type Props = {
        field: 'status' | 'deadline' | 'date';
        collection: string;
        entry: Entry;
        schema: SchemaField[] | undefined;
        blocked: string;
        onsaid: (said: string) => void;
    };

    let { field, collection, entry, schema, blocked, onsaid }: Props = $props();

    const declared = $derived(schema?.find((one) => one.field === field));
    const label = $derived(declared?.label ?? field);
    const held = $derived.by((): string => {
        const value = entry.fields[field];
        return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
    });
    const options = $derived(declared?.options ?? []);
    const stray = $derived(held !== '' && !options.includes(held));

    /** Counts the refusals, so the control is drawn again with the file's value in it. */
    let refusals = $state(0);

    /** Whether the control is still in the page, which the answer of a write is told to. */
    let drawn = true;
    onDestroy(() => {
        drawn = false;
    });

    /**
     * The value last sent for this field, so Enter and the loss of focus that follows write once.
     */
    let sent: string | null = null;

    async function write(next: string): Promise<void> {
        if (next === held || next === sent) return;
        sent = next;
        const answer = await writeEntry(collection, entry.id, {
            [field]: next === '' ? null : next
        });
        sent = null;
        if (!drawn) return;
        if (!answer.ok) refusals += 1;
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }
</script>

{#key refusals}
    {#if field === 'status'}
        <Select
            value={held}
            {label}
            choices={options.map((id) => ({ id, label: id }))}
            disabled={blocked !== ''}
            title={blocked === '' ? undefined : blocked}
            onchange={write}
        />
        {#if stray}
            <Tag label={t('settings.not_in_list')} tone="amber" />
        {/if}
    {:else if declared?.type === 'date'}
        <DateInput
            value={held}
            {label}
            disabled={blocked !== ''}
            title={blocked === '' ? undefined : blocked}
            onsettle={write}
        />
    {:else}
        <TextInput
            value={held}
            {label}
            oninput={() => undefined}
            disabled={blocked !== ''}
            title={blocked === '' ? undefined : blocked}
            onenter={write}
            onblur={write}
        />
    {/if}
{/key}
