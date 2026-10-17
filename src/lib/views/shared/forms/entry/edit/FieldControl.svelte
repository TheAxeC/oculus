<script lang="ts">
    // Layer 3, shared view partial. The control of one form field, by the field's type: the project
    // editor and the editor of an entry, a person and the career file all draw their fields through
    // it. A text, a text with choices, a long text, a pick, tags, a date, a checkbox, a list of
    // label-value rows, and a `records` field in the four shapes the schema's value takes (a list
    // of cards, one card, a map of facts as rows, a map of named cards). A record's own fields are
    // controls of this same component.
    //
    // It holds no value of its own: the value comes in as a prop, in the form record-values.ts
    // gives it, and every change goes out whole. A record names the fields its schema declares,
    // and the keys it carries beyond them as label-value rows when the schema says it is `open`.
    // What a field's choices are is the caller's: the form knows the snapshot and the vocabulary.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import MultiSelect from '$lib/ui/forms/choice/MultiSelect.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import SuggestInput from '$lib/ui/forms/choice/SuggestInput.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FieldControl from './FieldControl.svelte';
    import LabelRows from './LabelRows.svelte';
    import {
        blankRecord,
        type NamedEdit,
        type RecordEdit,
        type RecordsEdit,
        type Row
    } from '$lib/state/forms/record-values';
    import { asList, asText, type Choice, type FormField } from '$lib/state/forms/schema';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        field: FormField;
        value: unknown;
        onchange: (value: unknown) => void;
        /** The choices of a field whose `from` or `options` offer some. */
        choices: (field: FormField) => Choice[];
        /** A field the form shows and never writes. */
        readonly?: boolean;
    };

    let { field, value, onchange, choices, readonly = false }: Props = $props();

    /** How tall the prose boxes open. */
    const ROWS = 3;

    /** The name being typed into a named record's box, by its place, until the box is left. */
    let typing = $state<Record<number, string>>({});

    const records = $derived(field.type === 'records' ? (value as RecordsEdit) : null);

    /** One record with a field of it changed. */
    function withField(record: RecordEdit, name: string, held: unknown): RecordEdit {
        return { ...record, fields: { ...record.fields, [name]: held } };
    }

    /** The list of cards with the card at `at` replaced. */
    function replaceItem<T>(items: T[], at: number, next: T): T[] {
        return items.map((one, place) => (place === at ? next : one));
    }

    function removeItem<T>(items: T[], at: number): T[] {
        typing = {};
        return items.filter((_, place) => place !== at);
    }

    /** Why the name typed for the named record at `at` cannot be committed, or the empty text. */
    function nameRefusal(items: NamedEdit[], at: number, name: string): string {
        const words = name.trim();
        if (words === '') return t('entry_form.label_empty');
        return items.some((one, place) => place !== at && one.label.trim() === words)
            ? t('entry_form.label_taken', words)
            : '';
    }

    /** The reader is done with a named record's name: commit it when acceptable. */
    function renamed(items: NamedEdit[], at: number, name: string): void {
        if (nameRefusal(items, at, name) === '') {
            onchange({
                shape: 'named',
                items: replaceItem(items, at, { ...items[at], label: name.trim() })
            });
        }
        typing = {};
    }

    /** The text of a field kept as a list of lines. */
    function lines(text: string): string[] {
        return text.split('\n');
    }
</script>

{#snippet record(edit: RecordEdit, change: (next: RecordEdit) => void, open: boolean)}
    <div class="record">
        {#each field.fields ?? [] as sub (sub.field)}
            <Field label={sub.label} help={sub.help}>
                <FieldControl
                    field={sub}
                    value={edit.fields[sub.field]}
                    onchange={(held: unknown) => change(withField(edit, sub.field, held))}
                    {choices}
                />
            </Field>
        {/each}
        {#if open}
            <LabelRows
                unique
                name={field.label}
                rows={edit.rows}
                onchange={(rows: Row[]) => change({ ...edit, rows })}
            />
        {/if}
    </div>
{/snippet}

{#if readonly || field.type === 'readonly' || field.type === 'keymap'}
    <TextInput value={asText(value)} label={field.label} readonly oninput={() => undefined} />
{:else if field.type === 'checkbox'}
    <Checkbox
        checked={value === true}
        label={field.label}
        onchange={(on: boolean) => onchange(on)}
    />
{:else if field.type === 'select'}
    <Select
        value={asText(value)}
        label={field.label}
        empty={t('editor.empty_choice')}
        choices={choices(field)}
        onchange={(held: string) => onchange(held)}
    />
{:else if field.type === 'chips' || field.type === 'tags'}
    <MultiSelect
        values={asList(value)}
        label={field.label}
        choices={choices(field)}
        onchange={(list: string[]) => onchange(list)}
        search={t('editor.search')}
        remove={t('editor.remove')}
        removeGlyph={t('editor.remove_glyph')}
        free={field.type === 'tags'}
        none={t('editor.no_choices')}
        more={(count: number) => t('editor.more_choices', count)}
    />
{:else if field.type === 'textarea' || field.type === 'lines'}
    <TextArea
        value={asText(value)}
        label={field.label}
        rows={ROWS}
        oninput={(held: string) => onchange(field.type === 'lines' ? lines(held) : held)}
    />
{:else if field.type === 'date'}
    <DateInput
        value={asText(value)}
        label={field.label}
        oninput={(held: string) => onchange(held)}
    />
{:else if field.type === 'metalist'}
    <LabelRows
        name={field.label}
        rows={(value as Row[] | undefined) ?? []}
        onchange={(rows: Row[]) => {
            onchange(rows);
        }}
    />
{:else if records !== null && records.shape === 'one'}
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render record(
        records.item,
        (item) => {
            onchange({ shape: 'one', item });
        },
        field.open === true
    )}
{:else if records !== null && records.shape === 'labels'}
    <LabelRows
        unique
        name={field.label}
        rows={records.rows}
        onchange={(rows: Row[]) => {
            onchange({ shape: 'labels', rows });
        }}
    />
{:else if records !== null && records.shape === 'list'}
    {@const items = records.items}
    {#each items as item, at (at)}
        <div class="card">
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render record(
                item,
                (next) => {
                    onchange({ shape: 'list', items: replaceItem(items, at, next) });
                },
                field.open === true
            )}
            <ToolButton
                small
                label={t('entry_form.record_remove')}
                glyph={t('entry_form.row_remove_glyph')}
                onclick={() => {
                    onchange({ shape: 'list', items: removeItem(items, at) });
                }}
            />
        </div>
    {/each}
    <ToolButton
        small
        label={t('entry_form.record_add', field.label)}
        glyph={t('entry_form.row_add_glyph')}
        onclick={() => {
            onchange({ shape: 'list', items: [...items, blankRecord(field)] });
        }}
    />
{:else if records !== null && records.shape === 'named'}
    {@const items = records.items}
    {#each items as item, at (at)}
        <div class="card">
            <TextInput
                value={at in typing ? typing[at] : item.label}
                label={t('entry_form.record_name', field.label)}
                invalid={at in typing ? nameRefusal(items, at, typing[at]) || undefined : undefined}
                oninput={(name: string) => (typing[at] = name)}
                onenter={(name: string) => renamed(items, at, name)}
                onblur={(name: string) => renamed(items, at, name)}
            />
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render record(
                item.record,
                (next) => {
                    onchange({
                        shape: 'named',
                        items: replaceItem(items, at, { ...item, record: next })
                    });
                },
                field.open === true
            )}
            <ToolButton
                small
                label={t('entry_form.record_remove')}
                glyph={t('entry_form.row_remove_glyph')}
                onclick={() => {
                    onchange({ shape: 'named', items: removeItem(items, at) });
                }}
            />
        </div>
    {/each}
    <ToolButton
        small
        label={t('entry_form.record_add', field.label)}
        glyph={t('entry_form.row_add_glyph')}
        onclick={() => {
            onchange({
                shape: 'named',
                items: [...items, { label: '', record: blankRecord(field) }]
            });
        }}
    />
{:else if field.from !== undefined}
    <SuggestInput
        value={asText(value)}
        label={field.label}
        suggestions={choices(field).map((one) => one.id)}
        oninput={(held: string) => onchange(held)}
    />
{:else}
    <TextInput
        value={asText(value)}
        label={field.label}
        oninput={(held: string) => onchange(held)}
    />
{/if}

<style>
    .record {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    /* A record of a list is a card: the accent along its edge, and the control that removes it. */
    .card {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 8px;
        padding: 6px 8px;
        border: 1px solid var(--line);
        border-left: 2px solid var(--accent);
        border-radius: var(--input-radius);
    }
</style>
