<script lang="ts">
    // Layer 3, view partial under views/shared/. The three people picks of a dated line: Lead,
    // Supervisors and Collaborators, each a several-of-a-list control (ui/forms/choice/
    // MultiSelect.svelte) under its own visible label. DatedForm.svelte draws them under What and
    // the date of a new follow-up or subtask, and LineForm.svelte under the text and the date of a
    // line it edits, starting from the line's people.
    //
    // The choices are the people a `foreign_key: people` field of a record of the hub `root`
    // offers (state/forms/schema.ts `recordChoices`): that hub's people first, then a person only
    // one other hub holds, with that hub's name. A pick writes the person's key, which is what the
    // line names, and offers no Add person: a line names the people the registry holds.

    import Field from '$lib/ui/forms/Field.svelte';
    import MultiSelect from '$lib/ui/forms/choice/MultiSelect.svelte';
    import { recordChoices, selectChoices } from '$lib/state/forms/schema';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { LinePeopleFields, PeopleAction } from '$lib/state/shared/stores/shapes';
    import { LINE_PEOPLE } from '$lib/data/shapes/shapes';

    const {
        entities: { portfolio }
    } = useState();

    type Props = {
        /** The name of the hub of the record the line is of, whose people come first. */
        root: string;
        /** The people picked, by field. */
        values: LinePeopleFields;
        onchange: (next: LinePeopleFields) => void;
    };

    let { root, values, onchange }: Props = $props();

    /** The label of each field. */
    const LABELS: Record<PeopleAction, string> = {
        lead: t('project.action.line_lead'),
        supervisors: t('project.action.line_supervisors'),
        collaborators: t('project.action.line_collaborators')
    };

    /** The three fields, in the data layer's order (data/shapes/shapes.ts), each with its label. */
    const FIELDS = LINE_PEOPLE.map((field) => ({ field, label: LABELS[field] }));

    const choices = $derived(
        selectChoices(recordChoices(portfolio()?.entities.people, (one) => one.name, root))
    );

    /** The picks with one field set to the keys chosen, a field with none left out. */
    function picked(field: PeopleAction, keys: string[]): LinePeopleFields {
        const next: LinePeopleFields = {};
        for (const one of FIELDS) {
            const held = one.field === field ? keys : values[one.field];
            if (held !== undefined && held.length > 0) next[one.field] = held;
        }
        return next;
    }
</script>

{#each FIELDS as one (one.field)}
    <Field label={one.label}>
        <MultiSelect
            values={values[one.field] ?? []}
            label={one.label}
            {choices}
            onchange={(keys: string[]) => onchange(picked(one.field, keys))}
            search={t('editor.search')}
            remove={t('editor.remove')}
            removeGlyph={t('editor.remove_glyph')}
            none={t('editor.no_choices')}
            more={(count: number) => t('editor.more_choices', count)}
        />
    </Field>
{/each}
