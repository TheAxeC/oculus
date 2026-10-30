<script lang="ts">
    // Layer 3, shared view partial. A run of form fields: each one a row with its label, its
    // control (FieldControl.svelte), its help, and under them the notes that concern it: the view's
    // own remark, the reason the server refused the field, and a reminder when a required field is
    // empty. The editor view (views/boards/editor/Editor.svelte) draws one run per section of the
    // record's schema.
    //
    // The form knows nothing of what it edits: the values, the edits over them, which fields are
    // written and which are changed are functions the caller hands in. So is `addPerson`, the write
    // of a new person to the people registry of the hub the edited record is in, which a person
    // field's Add person runs; its refusal is said under the field, with the field's other notes,
    // until the next Add of that field or an edit of it.
    //
    // Each field's row is marked with the field's name (`data-field`).

    import Field from '$lib/ui/forms/Field.svelte';
    import FieldControl from './FieldControl.svelte';
    import type { PersonAdded } from '$lib/state/forms/new-entry';
    import type { Choice, FormField } from '$lib/state/forms/schema';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        fields: FormField[];
        /** The value a field shows: the edit when there is one, the saved value otherwise. */
        valueOf: (field: FormField) => unknown;
        onedit: (field: FormField, value: unknown) => void;
        /** Whether a save writes the field; a field that is not is shown and cannot be typed in. */
        writable: (field: string) => boolean;
        /** Whether the field has an edit that says something other than the saved value. */
        changed: (field: string) => boolean;
        choices: (field: FormField) => Choice[];
        /** A remark of the view's own on a field. */
        note?: (field: FormField) => string | undefined;
        /** Why the server refused each field of the last save, by field name. */
        refusals?: Record<string, string>;
        /** Whether the field holds nothing, which a required field is reminded of. */
        empty?: (field: FormField) => boolean;
        /** Write a new person of this name to the people registry of the record's hub. */
        addPerson?: (name: string) => Promise<PersonAdded>;
        /**
         * Whether a `foreign_key:` target names the collection of the record's hub that carries the
         * people registry, which decides the fields that offer Add person.
         */
        people?: (target: string) => boolean;
    };

    let {
        fields,
        valueOf,
        onedit,
        writable,
        changed,
        choices,
        note,
        refusals = {},
        empty,
        addPerson,
        people
    }: Props = $props();

    /** Why the last Add person of a field wrote no person, by field name. */
    let unadded = $state<Record<string, string>>({});

    /** The Add person of one field: the key written, or the empty text with the reason kept. */
    async function add(
        field: FormField,
        write: (name: string) => Promise<PersonAdded>,
        name: string
    ): Promise<string> {
        const { [field.field]: _gone, ...rest } = unadded;
        unadded = rest;
        const done = await write(name);
        if (done.said !== '') unadded = { ...unadded, [field.field]: done.said };
        return done.key;
    }

    /** An edit of a field, which takes its Add person reason away. */
    function edited(field: FormField, held: unknown): void {
        const { [field.field]: _gone, ...rest } = unadded;
        unadded = rest;
        onedit(field, held);
    }

    /**
     * The notes of one field, joined: the view's remark, the refusal, the reason its last Add
     * person wrote nobody, the required reminder.
     */
    function notesOf(field: FormField): string {
        const reminder = field.required === true && empty?.(field) === true;
        return [
            note?.(field),
            refusals[field.field],
            unadded[field.field],
            reminder ? t('entry_form.required') : undefined
        ]
            .filter((one): one is string => one !== undefined && one !== '')
            .join(' ');
    }
</script>

{#each fields as field (field.field)}
    <div data-field={field.field}>
        <Field
            label={field.label}
            help={field.help}
            note={notesOf(field)}
            dirty={changed(field.field)}
        >
            <FieldControl
                {field}
                value={valueOf(field)}
                readonly={!writable(field.field)}
                {choices}
                onchange={(held: unknown) => edited(field, held)}
                onadd={addPerson === undefined
                    ? undefined
                    : (name: string) => add(field, addPerson, name)}
                {people}
            />
        </Field>
    </div>
{/each}
