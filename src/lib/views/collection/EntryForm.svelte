<script lang="ts">
    // Layer 3, view partial of views/Collection.svelte. The add and edit form of one collection,
    // drawn from that file's own `schema:` and from nothing this module knows: the controls are the
    // schema's fields in the schema's order, through formFields() of state/collection.ts.
    //
    // Adding and editing are one form with two saves: with no entry it is newEntry(), with one it is
    // writeEntry() over the id the reader gave that entry, and the delete beside the save is
    // deleteEntry() behind the confirm. What the reader sees change is the watcher's next push of the
    // portfolio, so nothing here edits the entry it was handed.
    //
    // A `metalist` field is drawn as no control: the write path takes a string, a number, a boolean,
    // a list of strings or null (asFieldValue in server/yaml-edit.ts), and a list of label-value maps
    // is none of them, so an editor over it would produce a refusal every time it saved.

    import Checkbox from '$lib/ui/Checkbox.svelte';
    import Confirm from '$lib/ui/Confirm.svelte';
    import DateInput from '$lib/ui/DateInput.svelte';
    import Field from '$lib/ui/Field.svelte';
    import Select from '$lib/ui/Select.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { formFields, identityField, type Entry, type SchemaField } from '$lib/state/collection';
    import { t } from '$lib/state/text';
    import { deleteEntry, newEntry, writeEntry } from '$lib/state/writes.svelte';

    type Props = {
        /** The collection key, which is what a write names its file by. */
        collection: string;
        schema: SchemaField[] | undefined;
        /** The entry the form edits, or null when the form adds one. */
        entry: Entry | null;
        onclose: () => void;
        /** What a write answered, for the one outcome line the view holds. */
        onsaid: (said: string) => void;
    };

    let { collection, schema, entry, onclose, onsaid }: Props = $props();

    const fields = $derived(formFields(schema).filter((field) => field.kind !== 'metalist'));

    /** One field of the entry as the control for it holds it: a list is a line of commas. */
    function held(field: string, kind: string): string | boolean {
        const value = entry === null ? undefined : entry.fields[field];
        if (kind === 'checkbox') return value === true;
        if (Array.isArray(value)) return value.filter((one) => typeof one === 'string').join(', ');
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return '';
    }

    /** What the entry itself holds, per field: what a control shows until the reader types in it. */
    const initial = $derived.by(() => {
        const next: Record<string, string | boolean> = {};
        for (const field of fields) next[field.field] = held(field.field, field.kind);
        return next;
    });

    /** What the reader has typed, by field. A field nobody touched is not in here at all. */
    let edits: Record<string, string | boolean> = $state({});
    let asked = $state('');
    let sure = $state(false);

    /** One control's value: what was typed into it, and what the entry holds until something is. */
    function valueOf(field: string): string | boolean {
        return field in edits ? edits[field] : (initial[field] ?? '');
    }

    function line(field: string): string {
        const value = valueOf(field);
        return typeof value === 'string' ? value : '';
    }

    /** The value one control saves as: an empty control clears the field rather than writing ''. */
    function saveable(field: string, kind: string): unknown {
        const value = valueOf(field);
        if (kind === 'checkbox') return value === true ? true : null;
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

    function said(answer: { ok: boolean; changed: string[]; error?: string }): void {
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }

    /** Save the form: a new entry when the form has none, the entry's own fields when it has one. */
    async function save(): Promise<void> {
        const ident = identityField(schema);
        const wanted: Record<string, unknown> = {};
        for (const field of fields) wanted[field.field] = saveable(field.field, field.kind);
        if (wanted[ident] === null || wanted[ident] === undefined) {
            asked = t('collection.form_needs', ident);
            return;
        }
        asked = '';
        const answer =
            entry === null
                ? await newEntry(collection, wanted)
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
            {#if field.kind === 'textarea'}
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
</style>
