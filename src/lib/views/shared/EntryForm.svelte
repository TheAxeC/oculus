<script module lang="ts">
    // Layer 3, shared view partial. The add-write choice is exported so server-rendered form tests
    // exercise the same branch the save control uses without needing a browser DOM.

    import { newEntry, type WriteAnswer as AddWriteAnswer } from '$lib/state/writes.svelte';

    /** Use a file-specific add write when supplied, and the collection write otherwise. */
    export function addFromForm(
        collection: string,
        fields: Record<string, unknown>,
        onadd?: (fields: Record<string, unknown>) => Promise<AddWriteAnswer>
    ): Promise<AddWriteAnswer> {
        return onadd === undefined ? newEntry(collection, fields) : onadd(fields);
    }
</script>

<script lang="ts">
    // Layer 3, shared view partial. The add and edit form of one collection,
    // drawn from that file's own `schema:` and from nothing this module knows: the controls are the
    // schema's fields in the schema's order, through formFields() of state/collection.ts.
    //
    // Adding and editing are one form with two saves: with no entry it uses the caller's add write
    // when one is supplied and newEntry() otherwise; with one it is writeEntry() over the id the
    // reader gave that entry. The delete beside the save is deleteEntry() behind the confirm.
    //
    // A `metalist` is kept as rows apart from the scalar controls because each row writes two
    // values and is saved as one flat map.

    import Checkbox from '$lib/ui/Checkbox.svelte';
    import Confirm from '$lib/ui/Confirm.svelte';
    import DateInput from '$lib/ui/DateInput.svelte';
    import Field from '$lib/ui/Field.svelte';
    import Select from '$lib/ui/Select.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import {
        formFields,
        identityField,
        parseRawField,
        rawFieldText,
        type Entry,
        type SchemaField
    } from '$lib/state/collection';
    import { configMap } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { deleteEntry, writeEntry, type WriteAnswer } from '$lib/state/writes.svelte';

    type Props = {
        /** The collection key, which is what a write names its file by. */
        collection: string;
        schema: SchemaField[] | undefined;
        /** The entry the form edits, or null when the form adds one. */
        entry: Entry | null;
        /** A dedicated add write for a schema-driven file that is not a collection. */
        onadd?: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
        onclose: () => void;
        /** What a write answered, for the one outcome line the view holds. */
        onsaid: (said: string) => void;
    };

    let { collection, schema, entry, onadd, onclose, onsaid }: Props = $props();

    type MetaRow = { label: string; value: string };
    type Draft = string | boolean | MetaRow[];

    const fields = $derived(formFields(schema, configMap()));

    /** One field of the entry as the control for it holds it: a list is a line of commas. */
    function held(field: string, kind: string): Draft {
        const value = entry === null ? undefined : entry.fields[field];
        if (kind === 'checkbox') return value === true;
        if (kind === 'metalist' && Array.isArray(value)) {
            return value
                .filter(
                    (one): one is Record<string, unknown> =>
                        typeof one === 'object' && one !== null && !Array.isArray(one)
                )
                .map((one) => ({
                    label: typeof one.label === 'string' ? one.label : '',
                    value: typeof one.value === 'string' ? one.value : ''
                }));
        }
        if (kind === 'raw') return rawFieldText(value);
        if (Array.isArray(value)) return value.filter((one) => typeof one === 'string').join(', ');
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return '';
    }

    /** What the entry itself holds, per field: what a control shows until the reader types in it. */
    const initial = $derived.by(() => {
        const next: Record<string, Draft> = {};
        for (const field of fields) next[field.field] = held(field.field, field.kind);
        return next;
    });

    /** What the reader has typed, by field. A field nobody touched is not in here at all. */
    let edits: Record<string, Draft> = $state({});
    let asked = $state('');
    let sure = $state(false);

    /** One control's value: what was typed into it, and what the entry holds until something is. */
    function valueOf(field: string): Draft {
        return field in edits ? edits[field] : (initial[field] ?? '');
    }

    function line(field: string): string {
        const value = valueOf(field);
        return typeof value === 'string' ? value : '';
    }

    function metaRows(field: string): MetaRow[] {
        const value = valueOf(field);
        return Array.isArray(value) ? value : [];
    }

    function setMeta(field: string, at: number, key: keyof MetaRow, value: string): void {
        edits[field] = metaRows(field).map((row, index) =>
            index === at ? { ...row, [key]: value } : row
        );
    }

    function addMeta(field: string): void {
        edits[field] = [...metaRows(field), { label: '', value: '' }];
    }

    function removeMeta(field: string, at: number): void {
        edits[field] = metaRows(field).filter((_, index) => index !== at);
    }

    /** The value one control saves as: an empty control clears the field rather than writing ''. */
    function saveable(field: string, kind: string): unknown {
        const value = valueOf(field);
        if (kind === 'checkbox') return value === true ? true : null;
        if (kind === 'metalist') {
            const rows = Array.isArray(value) ? value : [];
            const kept = rows
                .map((row) => ({ label: row.label.trim(), value: row.value.trim() }))
                .filter((row) => row.label !== '' || row.value !== '');
            return kept.length === 0 ? null : kept;
        }
        const text = typeof value === 'string' ? value.trim() : '';
        if (kind === 'tags') {
            const words = text
                .split(',')
                .map((one) => one.trim())
                .filter((one) => one !== '');
            return words.length === 0 ? null : words;
        }
        return text === '' ? null : text;
    }

    function said(answer: WriteAnswer): void {
        if (!answer.ok) {
            onsaid(t('editor.failed', answer.error ?? ''));
        } else if (answer.refused.length > 0) {
            // A refused field answers ok with nothing changed; the reader is told why, not "saved".
            onsaid(
                t(
                    'editor.failed',
                    answer.refused.map((one) => `${one.field}: ${one.reason}`).join('; ')
                )
            );
        } else {
            onsaid(t('editor.saved', answer.changed.join(', ')));
        }
    }

    /** Save the form: a new entry when the form has none, the entry's own fields when it has one. */
    async function save(): Promise<void> {
        const ident = identityField(schema);
        const wanted: Record<string, unknown> = {};
        for (const field of fields) {
            if (field.kind !== 'raw') {
                wanted[field.field] = saveable(field.field, field.kind);
                continue;
            }
            if (entry !== null && !(field.field in edits)) continue;
            const parsed = parseRawField(line(field.field));
            if (!parsed.ok) {
                asked = t('collection.form_raw_invalid');
                return;
            }
            wanted[field.field] = parsed.value;
        }
        if (wanted[ident] === null || wanted[ident] === undefined) {
            asked = t('collection.form_needs', ident);
            return;
        }
        asked = '';
        const answer =
            entry === null
                ? await addFromForm(collection, wanted, onadd)
                : await writeEntry(collection, entry.id, wanted);
        said(answer);
        if (answer.ok && answer.refused.length === 0) onclose();
    }

    /** Delete the entry the form edits. The confirm is the dialog, never a second press of this. */
    async function remove(): Promise<void> {
        sure = false;
        if (entry === null) return;
        said(await deleteEntry(collection, entry.id));
        onclose();
    }
</script>

<div class="form" data-form={entry === null ? 'add' : 'edit'}>
    <div class="head">
        <span class="label">
            {entry === null ? t('collection.form_add_title') : t('collection.form_edit_title')}
        </span>
    </div>

    {#each fields as field (field.field)}
        <Field label={field.label} help={field.help}>
            {#if field.kind === 'textarea' || field.kind === 'raw'}
                <TextArea
                    value={line(field.field)}
                    label={field.label}
                    oninput={(next) => (edits[field.field] = next)}
                />
            {:else if field.kind === 'select'}
                <Select
                    value={line(field.field)}
                    label={field.label}
                    empty={t('collection.form_none')}
                    choices={field.options.map((one) => ({ id: one, label: one }))}
                    onchange={(next) => (edits[field.field] = next)}
                />
            {:else if field.kind === 'date'}
                <DateInput
                    value={line(field.field)}
                    label={field.label}
                    oninput={(next) => (edits[field.field] = next)}
                />
            {:else if field.kind === 'checkbox'}
                <Checkbox
                    checked={valueOf(field.field) === true}
                    label={field.label}
                    onchange={(next) => (edits[field.field] = next)}
                />
            {:else if field.kind === 'tags'}
                <TextInput
                    value={line(field.field)}
                    label={field.label}
                    placeholder={t('collection.tags_hint')}
                    oninput={(next) => (edits[field.field] = next)}
                />
            {:else if field.kind === 'metalist'}
                <div class="metalist" data-metalist={field.field}>
                    {#each metaRows(field.field) as row, at (`${field.field}-${at}`)}
                        <div class="metarow">
                            <TextInput
                                value={row.label}
                                label={t('collection.meta_label')}
                                placeholder={t('collection.meta_label')}
                                oninput={(next) => setMeta(field.field, at, 'label', next)}
                            />
                            <TextInput
                                value={row.value}
                                label={t('collection.meta_value')}
                                placeholder={t('collection.meta_value')}
                                oninput={(next) => setMeta(field.field, at, 'value', next)}
                            />
                            <ToolButton
                                label={t('collection.meta_remove')}
                                compact
                                onclick={() => removeMeta(field.field, at)}
                            />
                        </div>
                    {/each}
                    <ToolButton
                        label={t('collection.meta_add')}
                        onclick={() => addMeta(field.field)}
                    />
                </div>
            {:else}
                <TextInput
                    value={line(field.field)}
                    label={field.label}
                    oninput={(next) => (edits[field.field] = next)}
                />
            {/if}
        </Field>
    {/each}

    <div class="acts">
        <ToolButton
            label={t('collection.form_save')}
            glyph={t('collection.save_glyph')}
            onclick={save}
        />
        <ToolButton label={t('collection.form_cancel')} onclick={onclose} />
        {#if entry !== null}
            <ToolButton
                label={t('collection.form_delete')}
                glyph={t('collection.delete_glyph')}
                onclick={() => (sure = true)}
            />
        {/if}
        {#if asked !== ''}
            <span class="said">{asked}</span>
        {/if}
    </div>
</div>

{#if sure && entry !== null}
    <Confirm
        message={t('collection.form_delete_confirm')}
        detail={entry.title === '' ? entry.id : entry.title}
        confirm={t('collection.form_delete')}
        cancel={t('collection.form_cancel')}
        onconfirm={remove}
        oncancel={() => (sure = false)}
    />
{/if}

<style>
    .form {
        margin-top: 8px;
        padding: 6px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
    }

    .head,
    .acts {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .acts {
        margin-top: 6px;
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .said {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .metalist {
        display: grid;
        gap: 6px;
    }

    .metarow {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        gap: 6px;
        align-items: center;
    }
</style>
