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
    //
    // What the reader typed outlives the component. Inside a pane the form reads the instance it is
    // drawn in (state/instance-context.ts) and keeps its typed values in that instance's form drafts
    // (state/form-drafts.svelte.ts), keyed by the collection and the entry, so a tab switch or a
    // reload gives them back and the tab asks before it closes over them. Cancel and a delete forget
    // them, and a save forgets what it sent, keeping a value typed while it was on its way. A form
    // drawn outside any pane keeps them in a target of its own and registers nothing. How an entry's
    // value is held by a control, and what a control's value is saved as, are state/form-values.ts.

    import { addFromForm } from './entry-form';
    import Checkbox from '$lib/ui/Checkbox.svelte';
    import Confirm from '$lib/ui/Confirm.svelte';
    import DateInput from '$lib/ui/DateInput.svelte';
    import Field from '$lib/ui/Field.svelte';
    import Select from '$lib/ui/Select.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import {
        clearedValue,
        extraRawFields,
        formFields,
        identityField,
        parseRawField,
        refusedField,
        type Entry,
        type SchemaField
    } from '$lib/state/collection';
    import { draftTarget, formKey, localDrafts } from '$lib/state/form-drafts.svelte';
    import { controlValue, savedValue, type FormValue, type MetaRow } from '$lib/state/form-values';
    import { useInstance } from '$lib/state/instance-context';
    import { t } from '$lib/state/text';
    import type { WriteAnswer } from '$lib/state/writes.svelte';
    import { useState } from '$lib/state/use';

    const client = useState();
    const within = useInstance();

    const {
        formDrafts,
        selectors: { configMap },
        writes: { deleteEntry, writeEntry }
    } = client;

    type Props = {
        /** The collection key, which is what a write names its file by. */
        collection: string;
        schema: SchemaField[] | undefined;
        /** The entry the form edits, or null when the form adds one. */
        entry: Entry | null;
        /** What the controls of a form that adds an entry open holding, by field. */
        initial?: Record<string, unknown>;
        /**
         * Whether the form paints a surface of its own. A caller that draws it inside a card or a
         * list leaves it on, so the fields sit on their own box; a caller whose own box already
         * carries the surface turns it off, so the form is not a second translucent layer over a
         * wallpaper. The border and the padding stay either way, so the fields read as one block.
         */
        surface?: boolean;
        /** A dedicated add write for a schema-driven file that is not a collection. */
        onadd?: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
        onclose: () => void;
        /** What a write answered, for the one outcome line the view holds. */
        onsaid: (said: string) => void;
    };

    let {
        collection,
        schema,
        entry,
        initial: opening = {},
        surface = true,
        onadd,
        onclose,
        onsaid
    }: Props = $props();

    type Draft = FormValue;

    const fields = $derived([...formFields(schema, configMap()), ...extraRawFields(entry, schema)]);

    /** What the entry itself holds, per field: what a control shows until the reader types in it. */
    const initial = $derived.by(() => {
        const next: Record<string, Draft> = {};
        for (const field of fields) {
            const value = entry === null ? opening[field.field] : entry.fields[field.field];
            next[field.field] = controlValue(value, field.kind);
        }
        return next;
    });

    /** The kind of each field's control, by field name. */
    const kinds = $derived(new Map(fields.map((one) => [one.field, one.kind])));

    /** Which form of the instance this is: the collection, and the entry or null for adding. */
    const form = $derived(formKey(collection, entry === null ? null : entry.id));

    /** What a form outside any pane keeps its typed values in, since no instance keeps them. */
    const local = localDrafts();
    /** Where the typed values are kept: the instance the form is drawn in, or the form itself. */
    const target = $derived(draftTarget(formDrafts, within?.() ?? null, local));
    /** What the reader has typed, by field. A field nobody touched is not in here at all. */
    const edits = $derived(target.edits(form));
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

    /** Keep what one control now holds, with its kind and what the control held before any typing. */
    function hold(field: string, value: Draft): void {
        target.set(form, field, {
            value,
            kind: kinds.get(field) ?? 'text',
            base: initial[field] ?? ''
        });
    }

    function setMeta(field: string, at: number, key: keyof MetaRow, value: string): void {
        hold(
            field,
            metaRows(field).map((row, index) => (index === at ? { ...row, [key]: value } : row))
        );
    }

    function addMeta(field: string): void {
        hold(field, [...metaRows(field), { label: '', value: '' }]);
    }

    function removeMeta(field: string, at: number): void {
        hold(
            field,
            metaRows(field).filter((_, index) => index !== at)
        );
    }

    /**
     * The value one control saves as. A control the reader emptied writes the empty string, which is
     * the reader saying the field has no words; a control nobody touched clears the field instead,
     * so adding an entry writes no key for what was never filled in.
     */
    function saveable(field: string, kind: string): unknown {
        const saved = savedValue(valueOf(field), kind);
        if (typeof saved === 'boolean') return saved ? true : null;
        if (Array.isArray(saved)) return saved.length === 0 ? null : saved;
        if (saved !== '') return saved;
        return clearedValue(field in edits, entry !== null);
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

    /**
     * Save the form: a new entry when the form has none, the entry's own fields when it has one. The
     * draft settled is the one the save was pressed over, with the values it sent, both taken before
     * the request goes: an answer landing after the tab was switched settles that draft and no other.
     * An edit form keeps a value typed while the request was on its way, left open over it. An add
     * form closes and forgets its draft once the entry is added, since the form can only add another.
     */
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
        if (wanted[ident] === null || wanted[ident] === undefined || wanted[ident] === '') {
            asked = t('collection.form_needs', ident);
            return;
        }
        const refused = refusedField(fields, (field) => wanted[field]);
        if (refused !== null) {
            asked = t('collection.form_bad_value', refused);
            return;
        }
        asked = '';
        const into = target;
        const which = form;
        const sent = { ...edits };
        const answer =
            entry === null
                ? await addFromForm(client.writes, collection, wanted, onadd)
                : await writeEntry(collection, entry.id, wanted);
        said(answer);
        if (!answer.ok || answer.refused.length > 0) return;
        if (entry === null) {
            into.clear(which);
            onclose();
        } else if (!into.settle(which, sent)) {
            onclose();
        }
    }

    /** Close the form over nothing saved, forgetting what was typed into it. */
    function cancel(): void {
        target.clear(form);
        onclose();
    }

    /** Delete the entry the form edits. The confirm is the dialog, never a second press of this. */
    async function remove(): Promise<void> {
        sure = false;
        if (entry === null) return;
        const into = target;
        const which = form;
        said(await deleteEntry(collection, entry.id));
        into.clear(which);
        onclose();
    }
</script>

<div class="form" class:surface data-form={entry === null ? 'add' : 'edit'}>
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
                    oninput={(next: string) => hold(field.field, next)}
                />
            {:else if field.kind === 'select'}
                <Select
                    value={line(field.field)}
                    label={field.label}
                    empty={t('collection.form_none')}
                    choices={field.options.map((one) => ({ id: one, label: one }))}
                    onchange={(next: string) => hold(field.field, next)}
                />
            {:else if field.kind === 'date'}
                <DateInput
                    value={line(field.field)}
                    label={field.label}
                    oninput={(next: string) => hold(field.field, next)}
                />
            {:else if field.kind === 'checkbox'}
                <Checkbox
                    checked={valueOf(field.field) === true}
                    label={field.label}
                    onchange={(next: boolean) => hold(field.field, next)}
                />
            {:else if field.kind === 'tags'}
                <TextInput
                    value={line(field.field)}
                    label={field.label}
                    placeholder={t('collection.tags_hint')}
                    oninput={(next: string) => hold(field.field, next)}
                />
            {:else if field.kind === 'metalist'}
                <div class="metalist" data-metalist={field.field}>
                    {#each metaRows(field.field) as row, at (`${field.field}-${at}`)}
                        <div class="metarow">
                            <TextInput
                                value={row.label}
                                label={t('collection.meta_label')}
                                placeholder={t('collection.meta_label')}
                                oninput={(next: string) => setMeta(field.field, at, 'label', next)}
                            />
                            <TextInput
                                value={row.value}
                                label={t('collection.meta_value')}
                                placeholder={t('collection.meta_value')}
                                oninput={(next: string) => setMeta(field.field, at, 'value', next)}
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
                    oninput={(next: string) => hold(field.field, next)}
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
        <ToolButton label={t('collection.form_cancel')} onclick={cancel} />
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
    }

    /* The box of a form the caller asked to paint one. A caller that says no gets the border and the
       padding alone, so the fields still read as one block on whatever is behind them. */
    .form.surface {
        background: var(--panel);
    }

    :global(body.wall) .form.surface {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
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
        font-size: var(--fs-md);
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
