<script lang="ts">
    // Layer 3, shared view partial. A run of form fields: each one a row with its label, its
    // control (FieldControl.svelte), its help, and under them the notes that concern it: the view's
    // own remark, the reason the server refused the field, and a reminder when a required field is
    // empty. The project editor draws one run per section of its schema; the editor of an entry, a
    // person and the career file draws one run for the whole schema.
    //
    // The form knows nothing of what it edits: the values, the edits over them, which fields are
    // written and which are changed are functions the caller hands in.

    import Field from '$lib/ui/forms/Field.svelte';
    import FieldControl from './FieldControl.svelte';
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
        empty
    }: Props = $props();

    /** The notes of one field, joined: the view's remark, the refusal, the required reminder. */
    function notesOf(field: FormField): string {
        const reminder = field.required === true && empty?.(field) === true;
        return [
            note?.(field),
            refusals[field.field],
            reminder ? t('entry_form.required') : undefined
        ]
            .filter((one): one is string => one !== undefined && one !== '')
            .join(' ');
    }
</script>

{#each fields as field (field.field)}
    <Field label={field.label} help={field.help} note={notesOf(field)} dirty={changed(field.field)}>
        <FieldControl
            {field}
            value={valueOf(field)}
            readonly={!writable(field.field)}
            {choices}
            onchange={(held: unknown) => onedit(field, held)}
        />
    </Field>
{/each}
